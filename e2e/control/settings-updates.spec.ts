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
