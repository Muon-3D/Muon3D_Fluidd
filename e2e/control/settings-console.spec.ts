/**
 * Settings › Console: quick commands (chips above the Console's input, each
 * person's own on this printer), what the console shows, the lines it hides
 * (with a live preview), and how typing works. G-code is answered and
 * recorded by usePrinter, and the settings database by useDatabase, so
 * nothing reaches the shared mock.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, useDatabase, PRESETS } from './printer'

const QUICK_KEY = 'uiSettings.console.quickCommands.anonymous'

async function setUp (page: Page, lines: Array<{ message: string, type?: string }> = []) {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  const now = Date.now() / 1000
  printer.state.answer['server.gcode_store'] = {
    gcode_store: lines.map((l, i) => ({ message: l.message, type: l.type ?? 'response', time: now - lines.length + i }))
  }
  const db = await useDatabase(page, printer)
  return { printer, db }
}

const settings = (page: Page) => page.getByTestId('console-settings')
const quickSaves = (db: { posts: () => Array<Record<string, any>> }) => db.posts().filter(p => p.key === QUICK_KEY)
const consoleChips = (page: Page) => page.getByTestId('console-quick').getByRole('button')

async function addQuick (page: Page, command: string, label: string, send = true) {
  await settings(page).getByTestId('console-settings-add-quick').click()
  const dialog = page.getByTestId('quick-command-dialog')
  await dialog.getByTestId('quick-command-command').fill(command)
  await dialog.getByTestId('quick-command-label').fill(label)
  if (!send) await dialog.getByRole('radio', { name: /Put it in the input/ }).click()
  await dialog.getByTestId('quick-command-save').click()
  await expect(dialog).toBeHidden()
}

async function toggle (page: Page, name: string) {
  await settings(page).getByRole('switch', { name, exact: true }).click()
}

test('the page has the four groups from the storyboard, and links to People and access', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/settings#console')
  await expect(page.getByTestId('page-title')).toHaveText('Console')
  for (const title of ['Quick commands · 6', 'Showing', 'Hide lines · 0', 'Typing']) {
    await expect(settings(page).getByRole('heading', { name: title })).toBeVisible()
  }
  for (const row of ['Times on each line', 'Temperature reports', 'Newest at', 'Lines kept', 'Text size', 'Suggest commands as you type', 'Enter sends', 'Remember what I typed']) {
    await expect(settings(page).getByText(row, { exact: true })).toBeVisible()
  }
  // The move-or-heat check is proj-control's gate; the printer doesn't say who sent a line.
  await expect(settings(page).getByText('Check commands that move or heat')).toHaveCount(0)
  await expect(settings(page).getByText("Other people's commands")).toHaveCount(0)
  // Empty: no filters yet, and the way to add one.
  await expect(settings(page).getByTestId('console-add-filter')).toBeVisible()

  await settings(page).getByTestId('console-settings-access').click()
  await expect(page.getByTestId('page-title')).toHaveText('People and access')
  expect(printer.gcode).toEqual([])
})

test('a quick command added here shows above the Console input, and one tap sends it', async ({ page, open }) => {
  const { printer, db } = await setUp(page)
  await open('/settings#console')
  await addQuick(page, 'M115', 'Firmware')
  await expect(settings(page).getByRole('heading', { name: 'Quick commands · 7' })).toBeVisible()
  await expect.poll(() => quickSaves(db).at(-1)?.value.map((q: { command: string }) => q.command))
    .toEqual(['G28', 'M105', 'BED_MESH_CALIBRATE', 'QUERY_PROBE', 'FIRMWARE_RESTART', 'STATUS', 'M115'])

  await open('/console')
  const chip = page.getByTestId('console-quick-M115')
  await expect(chip).toHaveText('Firmware')
  const [chipBox, inputBox] = [await chip.boundingBox(), await page.getByTestId('console-input').boundingBox()]
  expect(chipBox!.y).toBeLessThan(inputBox!.y)
  await chip.click()
  await expect.poll(() => printer.gcode).toEqual(['M115'])
})

test('a quick command set to "Put it in the input" fills the line and sends nothing', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/settings#console')
  await addQuick(page, 'SET_PRESSURE_ADVANCE ADVANCE=0.04', 'PA', false)
  await open('/console')
  await page.getByTestId('console-quick-SET_PRESSURE_ADVANCE ADVANCE=0.04').click()
  await expect(page.getByTestId('console-input')).toHaveValue('SET_PRESSURE_ADVANCE ADVANCE=0.04')
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
})

test('double-clicking a chip edits it, and removing it takes it off the Console', async ({ page, open }) => {
  const { db } = await setUp(page)
  await open('/settings#console')
  await settings(page).getByTestId('console-settings-chip-STATUS').dblclick()
  const dialog = page.getByTestId('quick-command-dialog')
  await expect(dialog.getByRole('heading', { name: 'Edit the quick command' })).toBeVisible()
  await dialog.getByTestId('quick-command-remove').click()
  await expect(settings(page).getByRole('heading', { name: 'Quick commands · 5' })).toBeVisible()
  await expect.poll(() => quickSaves(db).at(-1)?.value.length).toBe(5)
  await open('/console')
  await expect(page.getByTestId('console-quick-G28')).toBeVisible()
  await expect(page.getByTestId('console-quick-STATUS')).toHaveCount(0)
})

test('dragging a chip reorders it, and the order is still there after a reload', async ({ page, open }) => {
  const { db } = await setUp(page)
  await open('/settings#console')
  const from = settings(page).getByTestId('console-settings-chip-M105')
  const to = settings(page).getByTestId('console-settings-chip-G28')
  const [a, b] = [await from.boundingBox(), await to.boundingBox()]
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2)
  await page.mouse.down()
  await page.mouse.move(a!.x + a!.width / 2 - 10, a!.y + a!.height / 2, { steps: 4 })
  await page.mouse.move(b!.x + 6, b!.y + b!.height / 2, { steps: 12 })
  await page.mouse.up()

  const order = ['M105', 'G28', 'BED_MESH_CALIBRATE', 'QUERY_PROBE', 'FIRMWARE_RESTART', 'STATUS']
  await expect.poll(() => quickSaves(db).at(-1)?.value.map((q: { command: string }) => q.command)).toEqual(order)

  await page.reload()
  await expect(settings(page).getByRole('listitem')).toHaveText(order)
  await open('/console')
  await expect(consoleChips(page)).toHaveText(order)
})

test('the keyboard moves a chip too (Alt and an arrow), and that persists', async ({ page, open }) => {
  const { db } = await setUp(page)
  await open('/settings#console')
  await settings(page).getByTestId('console-settings-chip-STATUS').focus()
  await page.keyboard.press('Alt+ArrowLeft')
  const order = ['G28', 'M105', 'BED_MESH_CALIBRATE', 'QUERY_PROBE', 'STATUS', 'FIRMWARE_RESTART']
  await expect.poll(() => quickSaves(db).at(-1)?.value.map((q: { command: string }) => q.command)).toEqual(order)
  await page.reload()
  await expect(settings(page).getByRole('listitem')).toHaveText(order)
})

test('"Times on each line" off takes the times off the console', async ({ page, open }) => {
  const { db } = await setUp(page, [{ message: 'Pressure advance set to 0.04' }])
  await open('/console')
  const log = page.getByTestId('console-log')
  await expect(log.getByText('Pressure advance set to 0.04')).toBeVisible()
  await expect(log.locator('time').first()).toBeVisible()

  await open('/settings#console')
  await toggle(page, 'Times on each line')
  await expect.poll(() => db.posts().find(p => p.key === 'uiSettings.console.timestamps')?.value).toBe(false)

  await open('/console')
  await expect(log.getByText('Pressure advance set to 0.04')).toBeVisible()
  await expect(log.locator('time')).toHaveCount(0)
})

test('a filter previews what it would hide, refuses a bad pattern, and saves', async ({ page, open }) => {
  const { db } = await setUp(page, [
    { message: 'probe at 120.0,80.0 is z=0.012' },
    { message: 'Pressure advance set to 0.04' },
    { message: 'probe at 140.0,80.0 is z=0.009' },
    { message: 'probe at 160.0,80.0 is z=0.010' }
  ])
  await open('/console')
  await expect(page.getByTestId('console-log').getByText('Pressure advance set to 0.04')).toBeVisible()
  await open('/settings#console')
  await expect(settings(page)).toBeVisible()
  await settings(page).getByTestId('console-add-filter').click()
  const dialog = page.getByTestId('console-filter-dialog')
  await dialog.getByTestId('console-filter-name').fill('Probe chatter')
  await dialog.getByRole('radio', { name: 'Pattern' }).click()
  await dialog.getByTestId('console-filter-value').fill('^probe at .* is z=')
  await expect(dialog.getByTestId('console-filter-count')).toHaveText(/^Would hide 3 of the last \d+ lines$/)
  await expect(dialog.getByTestId('console-filter-preview')).toContainText('probe at 140.0,80.0 is z=0.009')
  await expect(dialog.getByTestId('console-filter-preview')).not.toContainText('Pressure advance')

  await dialog.getByTestId('console-filter-value').fill('^probe at ([')
  await expect(dialog.getByRole('alert')).toContainText("That pattern can't be used")
  await expect(dialog.getByTestId('console-filter-save')).toBeDisabled()

  await dialog.getByTestId('console-filter-value').fill('^probe at .* is z=')
  await dialog.getByTestId('console-filter-save').click()
  const row = settings(page).getByTestId('console-filter-Probe chatter')
  await expect(row).toContainText('matches /^probe at .* is z=/')
  await expect(settings(page).getByRole('heading', { name: 'Hide lines · 1' })).toBeVisible()
  await expect.poll(() => db.posts().find(p => p.key === 'console.consoleFilters')?.value?.[0]?.name).toBe('Probe chatter')
  await expect(row.getByRole('switch', { name: 'Hide Probe chatter' })).toHaveAttribute('aria-checked', 'true')
})

test('Enter sends; with "Enter sends" off, Enter adds a line and Ctrl Enter sends', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/console')
  const input = page.getByTestId('console-input')
  await input.fill('M105')
  await input.press('Enter')
  await expect.poll(() => printer.gcode).toEqual(['M105'])

  await open('/settings#console')
  await toggle(page, 'Enter sends')
  await expect(settings(page).getByRole('switch', { name: 'Enter sends', exact: true })).toHaveAttribute('aria-checked', 'false')

  await open('/console')
  await input.fill('M105')
  await input.press('Enter')
  await input.pressSequentially('M114')
  await expect(input).toHaveValue('M105\nM114')
  await page.waitForTimeout(300)
  expect(printer.gcode).toEqual(['M105'])
  await input.press('Control+Enter')
  await expect.poll(() => printer.gcode).toEqual(['M105', 'M105\nM114'])
})

test('with the printer gone, the Console\'s chips are greyed out and say why, and send nothing', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/console')
  await expect(page.getByTestId('console-quick-M105')).toBeEnabled()
  await printer.offline()
  await expect(page.getByTestId('console-quick-M105')).toBeDisabled()
  await expect(page.getByTestId('console-quick-note')).toContainText("You can't send commands to this printer")
  await page.getByTestId('console-quick-M105').click({ force: true })
  await page.waitForTimeout(300)
  expect(printer.gcode).toEqual([])
})

test('Text size and Newest at change the console', async ({ page, open }) => {
  const { db } = await setUp(page, [{ message: 'first line' }, { message: 'last line' }])
  await open('/settings#console')
  await settings(page).getByRole('radio', { name: 'L' }).click()
  await settings(page).getByRole('radio', { name: 'Top' }).click()
  await expect.poll(() => db.posts().find(p => p.key === 'uiSettings.general.flipConsoleLayout')?.value).toBe(true)
  await expect.poll(() => db.posts().find(p => p.key === 'uiSettings.console.textSize')?.value).toBe('lg')

  await open('/console')
  const log = page.getByTestId('console-log')
  await expect(log).toHaveClass(/cons__log--lg/)
  const [first, last] = [await log.getByText('first line').boundingBox(), await log.getByText('last line').boundingBox()]
  expect(last!.y).toBeLessThan(first!.y)
})

test.describe('signed in to a Muon3D account', () => {
  test.use({ signedIn: true })

  test('the chips are kept under the account\'s own key, never under "anonymous", and are there again after a reload', async ({ page, open, account }) => {
    const { db } = await setUp(page)
    const key = `uiSettings.console.quickCommands.${account.account.id}`
    await open('/settings#console')
    await expect(settings(page).getByRole('heading', { name: 'Quick commands · 6' })).toBeVisible()
    await addQuick(page, 'M115', 'Firmware')
    await expect.poll(() => db.posts().filter(p => p.key === key).at(-1)?.value.map((q: { command: string }) => q.command))
      .toEqual(['G28', 'M105', 'BED_MESH_CALIBRATE', 'QUERY_PROBE', 'FIRMWARE_RESTART', 'STATUS', 'M115'])
    expect(quickSaves(db)).toEqual([])

    await open('/console')
    await expect(page.getByTestId('console-quick-M115')).toHaveText('Firmware')
  })

  test('nothing is read or written for "anonymous" while the account is still loading', async ({ page, open }) => {
    const { db } = await setUp(page)
    let release: () => void = () => {}
    const gate = new Promise<void>(resolve => { release = resolve })
    await page.route('**/v1/me', async route => {
      await gate
      await route.fallback()
    })
    await open('/settings#console')
    await expect(settings(page).getByTestId('console-settings-quick-loading')).toBeVisible()
    await expect(settings(page).getByTestId('console-settings-add-quick')).toBeDisabled()
    await expect(settings(page).getByRole('heading', { name: 'Quick commands · 0' })).toBeVisible()
    release()
    await expect(settings(page).getByRole('heading', { name: 'Quick commands · 6' })).toBeVisible()
    await expect(settings(page).getByTestId('console-settings-add-quick')).toBeEnabled()
    expect(db.posts().filter(p => String(p.key).startsWith('uiSettings.console.quickCommands'))).toEqual([])
  })
})

test.describe('the Showing options (KAN-1971)', () => {
  const LONG = 'Probe at 112.0,108.5 is z=1.842, bed mesh "default" loaded with 25 points across the whole bed, ready to print'

  test('each new option has a preview line that follows it', async ({ page, open }) => {
    const { db } = await setUp(page)
    await open('/settings#console')
    await expect(settings(page).getByTestId('console-preview-timestamps')).toHaveText(/^\d\d:\d\d:\d\d\s+ok T:/)
    await toggle(page, 'Times on each line')
    await expect(settings(page).getByTestId('console-preview-timestamps')).toHaveText(/^ok T:/)

    const wrap = settings(page).getByTestId('console-preview-wrap')
    await expect(wrap).not.toHaveClass(/cset__preview--cut/)
    await toggle(page, 'Wrap long lines')
    await expect(wrap).toHaveClass(/cset__preview--cut/)
    await expect.poll(() => db.posts().find(p => p.key === 'uiSettings.console.wrap')?.value).toBe(false)

    const reconnect = settings(page).getByTestId('console-preview-reconnect')
    await expect(reconnect).toContainText('earlier lines stay')
    await toggle(page, 'Start empty after a reconnect')
    await expect(reconnect).toContainText('starts empty')
    await expect.poll(() => db.posts().find(p => p.key === 'uiSettings.console.clearOnReconnect')?.value).toBe(true)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })

  test('"Wrap long lines" off keeps a long line on one line in the Console', async ({ page, open }) => {
    await setUp(page, [{ message: LONG }])
    await open('/console')
    const line = page.getByTestId('console-log').getByText(LONG)
    await expect(line).toBeVisible()
    const wrapped = (await line.boundingBox())!.height

    await open('/settings#console')
    await toggle(page, 'Wrap long lines')
    await open('/console')
    await expect(page.getByTestId('console-log')).toHaveClass(/cons__log--nowrap/)
    const one = (await page.getByTestId('console-log').getByText(LONG).boundingBox())!.height
    expect(one).toBeLessThanOrEqual(wrapped)
    expect(one).toBeLessThan(30)
  })
})
