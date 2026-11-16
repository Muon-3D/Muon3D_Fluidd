/**
 * Settings › General (v3 storyboard): this printer, Look (five accents and
 * Dark/Light/Auto, glass only), language and time, Ask before (E-STOP asks
 * only when someone turns it on), Overview and the top bar, and a copy of
 * these settings that shows what it changes before it is restored. The
 * settings database is useDatabase's, so nothing reaches the shared mock.
 */
import type { Page } from '@playwright/test'
import { test, expect, PRINTER } from '../fixtures'
import { usePrinter, useDatabase, PRESETS } from './printer'

const PERSONAL = 'uiSettings.personal.anonymous'
/** The mock's /server/muon/identity, with a serial as a printer that reports one would. */
const IDENTITY = { name: 'Boxwood', display: 'Boxwood', derived_name: 'boxwood', suffix: '367a', endpoint_id: 'mockendpointboxwood367a', serial: 'M1-0042' }

async function setUp (page: Page, options: { power?: boolean } = {}) {
  const printer = await usePrinter(page, PRESETS.idleHomed(), options.power ? { components: ['power'] } : {})
  if (options.power) {
    printer.state.answers['machine.device_power.devices'] = { devices: [{ device: 'printer_psu', status: 'on', locked_while_printing: false, type: 'gpio' }] }
  }
  printer.state.answers['printer.emergency_stop'] = 'ok'
  const db = await useDatabase(page, printer)
  return { printer, db }
}

const general = (page: Page) => page.getByTestId('general-settings')
const saves = (db: { posts: () => Array<Record<string, any>> }, key: string) => db.posts().filter(p => p.key === key).map(p => p.value)
const appTheme = (page: Page) => page.locator('.v-application').first()

test('the page has the storyboard groups, and no Flat, logo or community theme', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/settings#general')
  await expect(general(page)).toBeVisible()
  for (const title of ['This printer', 'Look', 'Language and time', 'Ask before', 'Overview and the top bar', 'Keyboard', 'These settings', 'More']) {
    await expect(general(page).getByRole('heading', { name: title, exact: true })).toBeVisible()
  }
  await expect(page.getByTestId('setting-model')).toHaveText('Muon M1')
  for (const gone of ['Panels', 'Flat', 'Logo behind the pages', 'A community theme', 'Choose page and print details', 'Camera switch on Overview']) {
    await expect(general(page).getByText(gone)).toHaveCount(0)
  }
  await expect(page.locator('html')).toHaveAttribute('data-m3d-style', 'glass')
  // No power devices: no question about them.
  await expect(page.getByTestId('setting-ask-power')).toHaveCount(0)
  await page.getByTestId('setting-link-gcode-preview').click()
  await expect(page).toHaveURL(/#gcodePreview$/)
  await expect(page.locator('#gcodePreview')).toBeVisible()
  expect(printer.gcode).toEqual([])
})

test('a serial the printer reports is shown with the model', async ({ page, open }) => {
  await setUp(page)
  await page.route(/\/server\/muon\/identity/, route => route.fulfill({
    json: { ...IDENTITY, result: IDENTITY }
  }))
  await open('/settings#general')
  await expect(page.getByTestId('setting-model')).toHaveText('Muon M1 · serial M1-0042')
})

test('an accent swatch is saved as this person\'s own, and is still picked after a reload', async ({ page, open }) => {
  const { db } = await setUp(page)
  await open('/settings#general')
  const look = page.getByTestId('theme-settings')
  await expect(look.getByRole('radio', { name: 'Teal' })).toHaveAttribute('aria-checked', 'true')
  await look.getByRole('radio', { name: 'Blue' }).click()
  await expect.poll(() => saves(db, `${PERSONAL}.theme.color`)).toEqual(['#7aa7ff'])
  // The printer's own colour is left for everyone else.
  expect(saves(db, 'uiSettings.theme.color')).toEqual([])

  await page.reload()
  await expect(page.getByTestId('theme-settings').getByRole('radio', { name: 'Blue' })).toHaveAttribute('aria-checked', 'true')
})

test('Light, Dark and Auto: Auto follows the device', async ({ page, open }) => {
  const { db } = await setUp(page)
  await open('/settings#general')
  const mode = page.getByTestId('setting-theme-mode')
  await expect(mode.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true')
  await mode.getByRole('radio', { name: 'Light' }).click()
  await expect(appTheme(page)).toHaveClass(/theme--light/)
  await expect.poll(() => saves(db, `${PERSONAL}.theme.mode`)).toEqual(['light'])

  await page.emulateMedia({ colorScheme: 'dark' })
  await mode.getByRole('radio', { name: 'Auto' }).click()
  await expect(appTheme(page)).toHaveClass(/theme--dark/)
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(appTheme(page)).toHaveClass(/theme--light/)

  await mode.getByRole('radio', { name: 'Dark' }).click()
  await expect(appTheme(page)).toHaveClass(/theme--dark/)
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(appTheme(page)).toHaveClass(/theme--dark/)
})

test('E-STOP: off by default it stops at once; turned on (which asks), it asks first', async ({ page, open }) => {
  const { printer, db } = await setUp(page)
  await open('/settings#general')
  const estopSwitch = general(page).getByRole('switch', { name: 'Emergency stop', exact: true })
  await expect(estopSwitch).toHaveAttribute('aria-checked', 'false')

  await page.getByTestId('estop').first().click()
  await expect.poll(() => printer.called('printer.emergency_stop').length).toBe(1)
  await expect(page.getByTestId('confirm').filter({ visible: true })).toHaveCount(0)

  await estopSwitch.click()
  const asking = page.getByTestId('confirm').filter({ visible: true }).filter({ hasText: 'E-STOP will need two presses' })
  await expect(asking).toBeVisible()
  await asking.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm').filter({ visible: true })).toHaveCount(0)
  await expect(estopSwitch).toHaveAttribute('aria-checked', 'false')
  expect(saves(db, `${PERSONAL}.general.confirmOnEstop`)).toEqual([])

  await estopSwitch.click()
  await page.getByTestId('confirm').filter({ visible: true }).filter({ hasText: 'E-STOP will need two presses' }).getByTestId('confirm-ok').click()
  await expect(estopSwitch).toHaveAttribute('aria-checked', 'true')
  await expect.poll(() => saves(db, `${PERSONAL}.general.confirmOnEstop`)).toEqual([true])

  await page.getByTestId('estop').first().click()
  const stop = page.getByTestId('confirm').filter({ visible: true }).filter({ hasText: 'Stop the printer now?' })
  await expect(stop).toBeVisible()
  expect(printer.called('printer.emergency_stop')).toHaveLength(1)
  await stop.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.called('printer.emergency_stop').length).toBe(2)
})

test('the power-switch question shows when the printer has power switches', async ({ page, open }) => {
  const { db } = await setUp(page, { power: true })
  await open('/settings#general')
  const row = page.getByTestId('setting-ask-power')
  await expect(row).toBeVisible()
  await row.getByRole('switch').click()
  await expect.poll(() => saves(db, `${PERSONAL}.general.confirmOnPowerDeviceChange`)).toEqual([true])
})

test('progress and time left are one choice each, saved in today\'s shape', async ({ page, open }) => {
  const { db } = await setUp(page)
  await open('/settings#general')
  await page.getByTestId('setting-progress').getByRole('radio', { name: 'Layers' }).click()
  await expect.poll(() => saves(db, 'uiSettings.general.printProgressCalculation')).toEqual([['layers']])
  await page.getByTestId('setting-eta').getByRole('radio', { name: 'Average' }).click()
  await expect.poll(() => saves(db, 'uiSettings.general.printEtaCalculation')).toEqual([['file', 'slicer']])
  await page.getByTestId('setting-times').getByRole('radio', { name: '12-hour' }).click()
  await expect.poll(() => saves(db, 'uiSettings.general.timeFormat')).toEqual(['hours12'])
})

test.describe('restore from a copy', () => {
  const copy = (data: Record<string, unknown>) => Buffer.from(JSON.stringify({ meta: { app: 'Fluidd', version: '1', type: 'settings-backup' }, data }))

  async function restoreWrites (page: Page) {
    const writes: Array<{ key: string, value: unknown }> = []
    await page.route(/\/server\/database\/item/, async route => {
      if (route.request().method() !== 'POST') { await route.fallback(); return }
      const body = route.request().postDataJSON()
      writes.push({ key: body.key, value: body.value })
      await route.fulfill({ json: { result: body } })
    })
    return writes
  }

  test('shows what changes, writes nothing on Cancel, and restores on Restore', async ({ page, open }) => {
    await setUp(page)
    const writes = await restoreWrites(page)
    await open('/settings#general')
    const file = { name: 'elm-control-2026-10-30.json', mimeType: 'application/json', buffer: copy({ uiSettings: { theme: { color: '#7aa7ff' }, general: { instanceName: 'Elm' } } }) }

    await page.getByTestId('settings-restore-file').setInputFiles(file)
    const sheet = page.getByTestId('settings-restore-dialog')
    await expect(sheet.getByText('Restore these settings?')).toBeVisible()
    await expect(sheet.getByText('elm-control-2026-10-30.json · saved from Elm')).toBeVisible()
    await expect(page.getByTestId('settings-restore-other')).toBeVisible()
    await expect(sheet.getByTestId('settings-restore-change').filter({ hasText: 'Accent colour' })).toContainText('Teal → Blue')
    await expect(sheet.getByTestId('settings-restore-change').filter({ hasText: 'Name' })).toContainText('→ Elm')
    await expect(sheet.getByText('Everything else')).toBeVisible()
    await sheet.getByTestId('settings-restore-cancel').click()
    await expect(sheet.getByText('Restore these settings?')).toBeHidden()
    expect(writes).toEqual([])

    await page.getByTestId('settings-restore-file').setInputFiles(file)
    await page.getByTestId('settings-restore-dialog').getByTestId('settings-restore-apply').click()
    await expect.poll(() => writes.map(w => w.key)).toEqual(['uiSettings'])
  })

  test('a file that is not a copy of Control settings is refused, with nothing written', async ({ page, open }) => {
    await setUp(page)
    const writes = await restoreWrites(page)
    await open('/settings#general')
    // One flash message shows at a time, and the offline-ready notice can land on top of it: pick again until it is seen.
    await expect(async () => {
      await page.getByTestId('settings-restore-file').setInputFiles({ name: 'notes.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') })
      await expect(page.getByText("That isn't a Control backup file.").first()).toBeVisible({ timeout: 3000 })
    }).toPass()
    await expect(page.getByTestId('settings-restore-dialog').getByText('Restore these settings?')).toHaveCount(0)
    expect(writes).toEqual([])
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the groups are full width and a swatch is still one tap', async ({ page, open }) => {
    const { db } = await setUp(page)
    await open(`${PRINTER}/settings#general`)
    const look = page.getByTestId('theme-settings')
    await expect(look).toBeVisible()
    const box = await look.boundingBox()
    expect(box!.width).toBeGreaterThan(390 - 48)
    await look.getByRole('radio', { name: 'Orange' }).click()
    await expect.poll(() => saves(db, `${PERSONAL}.theme.color`)).toEqual(['#ffb36b'])
    await expect(page.getByTestId('estop').first()).toBeVisible()
  })
})
