/**
 * Settings › Updates (KAN-1925, brief control-settings-1109): automatic
 * updates are on and the knob confirmation is off on a fresh printer; both
 * persist; a staged update says it installs on the next restart; "Restart
 * now to update" waits for an idle, cool printer. The printer's answers are
 * faked per test with page.route, so the shared mock never changes.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const COOL = { extruder: { temperature: 24, target: 0, power: 0 }, heater_bed: { temperature: 23, target: 0, power: 0 } }

const STAGED = {
  state: 'idle',
  current_version: '0.9.3',
  target_version: '0.9.4',
  update_available: true,
  last_checked: new Date().toISOString(),
  install: { phase: 'idle' },
  stage: { state: 'staged', version: '0.9.4', slot_fingerprint: { sha256: 'abc' } },
  session: null
}

/** The printer's update choices, kept for this test across reloads, as a fresh printer has them. */
async function printerChoices (page: Page, status: Record<string, unknown> = { state: 'idle', current_version: '0.9.3', session: null }) {
  const kept = { enabled: true, required: false }
  const posts: string[] = []
  await page.route('**/server/aux/update/status', route => route.fulfill({ json: status }))
  await page.route('**/server/aux/update/auto_install', route => {
    if (route.request().method() === 'POST') {
      kept.enabled = !!route.request().postDataJSON()?.enabled
      posts.push(`auto_install=${kept.enabled}`)
    }
    return route.fulfill({ json: { enabled: kept.enabled } })
  })
  await page.route('**/server/aux/update/presence', route => {
    if (route.request().method() === 'POST') {
      kept.required = !!route.request().postDataJSON()?.required
      posts.push(`presence=${kept.required}`)
    }
    return route.fulfill({ json: { required: kept.required } })
  })
  return { kept, posts }
}

const autoSwitch = (page: Page) => page.getByRole('switch', { name: 'Automatic updates' })
const presenceSwitch = (page: Page) => page.getByRole('switch', { name: 'Confirm on the printer before installing' })

test('a fresh printer has automatic updates on and the printer confirmation off, in the words the owner agreed', async ({ page, open }) => {
  await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL })
  await printerChoices(page)
  await open('/settings#versions')
  await expect(autoSwitch(page)).toHaveAttribute('aria-checked', 'true')
  await expect(presenceSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByTestId('software-auto-text')).toHaveText('Automatic updates: On. New versions download in the background and install the next time the printer restarts.')
  const panel = page.getByTestId('software-settings')
  await expect(panel).not.toContainText(/install window|quiet hours|when idle|while idle/i)
})

test('both switches are sent to the printer and stay as set after a reload', async ({ page, open }) => {
  await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL })
  const { posts } = await printerChoices(page)
  await open('/settings#versions')
  await autoSwitch(page).click()
  await expect(autoSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByTestId('software-auto-text')).toContainText('Automatic updates: Off.')
  await presenceSwitch(page).click()
  await expect(presenceSwitch(page)).toHaveAttribute('aria-checked', 'true')
  expect(posts).toEqual(['auto_install=false', 'presence=true'])

  await page.reload()
  await expect(autoSwitch(page)).toHaveAttribute('aria-checked', 'false')
  await expect(presenceSwitch(page)).toHaveAttribute('aria-checked', 'true')
})

test('a printer that wants the knob pressed says so, with the Wi-Fi words', async ({ page, open }) => {
  await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL })
  await printerChoices(page)
  await page.route('**/server/aux/update/presence', route => route.request().method() === 'POST'
    ? route.fulfill({ status: 202, json: { consent_required: true, challenge_id: 'c1' } })
    : route.fulfill({ json: { required: false } }))
  await open('/settings#versions')
  await presenceSwitch(page).click()
  await expect(page.getByTestId('software-policy-note')).toContainText('Press the knob on the printer to confirm')
  await expect(presenceSwitch(page)).toHaveAttribute('aria-checked', 'false')
})

test('a staged update says it installs on the next restart', async ({ page, open }) => {
  await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL })
  await printerChoices(page, STAGED)
  await open('/settings#versions')
  await expect(page.getByTestId('software-staged')).toHaveText('Update ready, installs on next restart')
  await expect(page.getByTestId('software-state')).toHaveText('Update ready, installs on next restart')
  await expect(page.getByTestId('software-restart')).toHaveText('Restart now to update')
  await expect(page.getByTestId('software-install')).toHaveCount(0)
})

test('Restart now to update is off and says why while printing or hot, and restarts once idle and cool', async ({ page, open }) => {
  const printer = await usePrinter(page, { ...PRESETS.idleHomed(), print_stats: { state: 'printing' }, idle_timeout: { state: 'Printing' } })
  await printerChoices(page, STAGED)
  await open('/settings#versions')
  const restart = page.getByTestId('software-restart')
  await expect(restart).toBeDisabled()
  await expect(page.getByTestId('software-restart-why')).toHaveText('Not while printing.')

  printer.report({ ...PRESETS.idleHomed(), extruder: { temperature: 180, target: 0 }, heater_bed: { temperature: 23, target: 0 } })
  await expect(page.getByTestId('software-restart-why')).toHaveText('Wait until the heaters have cooled.')
  await expect(restart).toBeDisabled()
  expect(printer.called('machine.update.client')).toEqual([])

  printer.report({ ...PRESETS.idleHomed(), ...COOL })
  await expect(restart).toBeEnabled()
  await restart.click()
  await page.getByRole('dialog').getByTestId('confirm-cancel').last().click()
  expect(printer.called('machine.update.client')).toEqual([])

  await restart.click()
  await page.getByRole('dialog').getByTestId('confirm-ok').last().click()
  await expect.poll(() => printer.called('machine.update.client').length).toBe(1)
  await expect(page).toHaveURL(/\/updating/)
})

test('no restart is offered when automatic updates are off: the update installs only when asked', async ({ page, open }) => {
  await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL })
  const { kept } = await printerChoices(page, STAGED)
  kept.enabled = false
  await open('/settings#versions')
  await expect(page.getByTestId('software-install')).toBeVisible()
  await expect(page.getByTestId('software-restart')).toHaveCount(0)
  await expect(page.getByTestId('software-settings')).not.toContainText('installs on next restart')
})

test.describe('the update hero (ST-09b, KAN-1927)', () => {
  const READY = {
    state: 'idle',
    current_version: '20261030120000-aaaaaaa',
    target_version: '20261106120000-bbbbbbb',
    update_available: true,
    last_checked: new Date().toISOString(),
    release_notes: 'Smoother Edit mode, the filament panel opens straight away, a fix for "Verifying an update" staying on screen.',
    install: { phase: 'idle' },
    session: null
  }
  const PRINTING = { print_stats: { state: 'printing', filename: 'M1_bracket.gcode' }, idle_timeout: { state: 'Printing' }, virtual_sdcard: { is_active: true, progress: 0.44 } }
  const hero = (page: Page) => page.getByTestId('software-hero')

  test('with an update ready: what is ready, what you have, what is new, how long, and one Install', async ({ page, open }) => {
    await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL })
    await printerChoices(page, READY)
    await open('/settings#versions')
    await expect(page.getByTestId('software-state')).toHaveText('Update ready')
    await expect(page.getByTestId('software-hero-title')).toHaveText('MuonOS 6 November 2026')
    await expect(page.getByTestId('software-hero-sub')).toContainText('You have 30 October 2026 · checked')
    await expect(page.getByTestId('software-whats-new')).toContainText('Smoother Edit mode')
    await expect(page.getByTestId('software-how-long')).toContainText('10 to 40 minutes')
    await expect(hero(page).getByTestId('software-install')).toHaveCount(1)
    await expect(page.getByTestId('software-install')).toHaveText('Install…')
    // How updates arrive: automatic updates stay on by default (#327), Stable only, no channel picker.
    await expect(autoSwitch(page)).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByTestId('software-channel')).toContainText('Stable')
    await expect(page.getByTestId('software-channel').getByRole('radio')).toHaveCount(0)
    await expect(page.getByTestId('software-settings')).not.toContainText('Beta gets')
    await expect(page.getByTestId('software-history')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('with no update: Up to date, the version it has, and no Install', async ({ page, open }) => {
    await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL })
    await printerChoices(page, { ...READY, target_version: null, update_available: false, release_notes: null })
    await open('/settings#versions')
    await expect(page.getByTestId('software-state')).toHaveText('Up to date')
    await expect(page.getByTestId('software-hero-title')).toHaveText('MuonOS 30 October 2026')
    await expect(page.getByTestId('software-hero-sub')).toContainText('Up to date · checked')
    await expect(page.getByTestId('software-install')).toHaveCount(0)
    await expect(page.getByTestId('software-check')).toBeEnabled()
  })

  test('while installing: the hero shows progress and the bar at the top follows it', async ({ page, open }) => {
    await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL })
    await printerChoices(page, { ...READY, state: 'installing', progress: 58, install: { phase: 'installing', job_id: 'job-1', progress: 58 } })
    await open('/settings#versions')
    await expect(page.getByTestId('software-state')).toHaveText('Updating · 58%')
    await expect(page.getByTestId('software-progress')).toContainText('See progress')
    await expect(page.getByTestId('update-banner')).toContainText('Installing update')
    await expect(page.getByTestId('software-install')).toHaveCount(0)
    await page.getByTestId('update-banner').click()
    await expect(page).toHaveURL(/\/updating/)
    await expect(page.getByRole('status').filter({ hasText: 'Installing update' })).toContainText('Step 1 of 4')
  })

  test('when the last one failed: the reason in plain words, and Install again', async ({ page, open }) => {
    await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL })
    await printerChoices(page, { ...READY, state: 'failed', error: "The download didn't finish: the printer lost Wi-Fi." })
    await open('/settings#versions')
    await expect(page.getByTestId('software-outcome')).toHaveText("The download didn't finish: the printer lost Wi-Fi.")
    await expect(page.getByTestId('software-install')).toBeEnabled()
  })

  test('Install now: the dialog offers now (after this print needs a print), Not now sends nothing, Install starts it', async ({ page, open }) => {
    const printer = await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL })
    await printerChoices(page, READY)
    await open('/settings#versions')
    await page.getByTestId('software-install').click()
    const dialog = page.getByTestId('software-install-dialog')
    await expect(dialog).toContainText('Install MuonOS 6 November 2026?')
    await expect(dialog.getByTestId('software-install-now')).toHaveAttribute('aria-checked', 'true')
    await expect(dialog.getByTestId('software-install-after')).toBeDisabled()
    await expect(dialog.getByTestId('software-install-after')).toContainText('Nothing is printing.')
    await dialog.getByTestId('software-install-cancel').click()
    expect(printer.called('machine.update.client')).toEqual([])

    await page.getByTestId('software-install').click()
    await page.getByTestId('software-install-dialog').getByTestId('software-install-go').click()
    await expect.poll(() => printer.called('machine.update.client').length).toBe(1)
    await expect(page).toHaveURL(/\/updating/)
  })

  test('Install after this print: kept across a reload, sent only once the print is over', async ({ page, open }) => {
    const printer = await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL, ...PRINTING })
    await printerChoices(page, READY)
    await open('/settings#versions')
    await page.getByTestId('software-install').click()
    const dialog = page.getByTestId('software-install-dialog')
    await expect(dialog.getByTestId('software-install-now')).toBeDisabled()
    await expect(dialog.getByTestId('software-install-now')).toContainText('Not while printing.')
    await expect(dialog.getByTestId('software-install-after')).toHaveAttribute('aria-checked', 'true')
    await expect(dialog.getByTestId('software-install-after')).toContainText('When M1_bracket ends.')
    await dialog.getByTestId('software-install-go').click()
    await expect(page.getByTestId('software-queued')).toContainText('Installs after this print (M1_bracket)')
    expect(printer.called('machine.update.client')).toEqual([])

    await page.reload()
    await expect(page.getByTestId('software-queued')).toBeVisible()
    await page.waitForTimeout(1000)
    expect(printer.called('machine.update.client')).toEqual([])

    printer.report({ print_stats: { state: 'complete', filename: 'M1_bracket.gcode' }, idle_timeout: { state: 'Idle' }, virtual_sdcard: { is_active: false, progress: 1 } })
    await expect.poll(() => printer.called('machine.update.client').length).toBe(1)
    await expect(page.getByTestId('software-queued')).toHaveCount(0)
  })

  test('a queued install can be cancelled and is then never sent', async ({ page, open }) => {
    const printer = await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL, ...PRINTING })
    await printerChoices(page, READY)
    await open('/settings#versions')
    await page.getByTestId('software-install').click()
    await page.getByTestId('software-install-dialog').getByTestId('software-install-go').click()
    await page.getByTestId('software-queued-cancel').click()
    await expect(page.getByTestId('software-queued')).toHaveCount(0)
    printer.report({ print_stats: { state: 'complete' }, idle_timeout: { state: 'Idle' } })
    await page.waitForTimeout(1500)
    expect(printer.called('machine.update.client')).toEqual([])
  })

  test('other software is behind developer mode on a Muon printer', async ({ page, open }) => {
    await usePrinter(page, { ...PRESETS.idleHomed(), ...COOL, muon_guard: { dev_mode: false } }, { components: ['file_manager', 'update_manager', 'machine', 'muon_protection'] })
    await printerChoices(page, READY)
    await open('/settings#versions')
    await expect(page.getByTestId('software-others-locked')).toContainText('Other software')
    await expect(page.getByTestId('software-others')).toHaveCount(0)
  })
})
