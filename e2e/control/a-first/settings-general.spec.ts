/**
 * Settings › General (v3 storyboard): this printer, Layout (the theme moved to
 * Account › Appearance, KAN-6106), language and time, Ask before (E-STOP asks
 * only when someone turns it on), Overview and the top bar, and a copy of
 * these settings that shows what it changes before it is restored. The
 * settings database is useDatabase's, so nothing reaches the shared mock.
 */
import type { Page } from '@playwright/test'
import { test, expect, PRINTER } from '../../fixtures'
import { usePrinter, useDatabase, PRESETS } from '../printer'

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

test('the page has the storyboard groups, and no Flat, logo or community theme', async ({ page, open }) => {
  const { printer } = await setUp(page)
  await open('/settings#general')
  await expect(general(page)).toBeVisible()
  for (const title of ['This printer', 'Layout', 'Language and time', 'Ask before', 'Overview and the top bar', 'Keyboard', 'These settings', 'More']) {
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

/** The printer's own rename route: records every body, answers with `status`. */
async function renameRoute (page: Page, status = 200, error = 'muon_setup: protected') {
  const sent: Array<Record<string, unknown>> = []
  await page.route(/\/server\/muon\/identity\/name/, async route => {
    sent.push(route.request().postDataJSON())
    if (status === 200) await route.fulfill({ json: { result: { ...IDENTITY, name: String(sent.at(-1)!.name) } } })
    else await route.fulfill({ status, json: { error } })
  })
  return sent
}

test.describe('renaming the printer from Control (KAN-3603)', () => {
  test('a new name is the printer own: sent to its rename route, then kept as the Control label', async ({ page, open }) => {
    const { db } = await setUp(page)
    const sent = await renameRoute(page)
    await open('/settings#general')
    const name = page.getByTestId('setting-name').locator('input').or(page.locator('input[data-tid="setting-name"]')).first()
    await name.fill('Elm Bench')
    await name.press('Tab')
    await expect.poll(() => sent).toEqual([{ name: 'Elm Bench' }])
    await expect.poll(() => saves(db, 'uiSettings.general.instanceName')).toEqual(['Elm Bench'])
    await expect(page.getByText('did not accept the new name')).toHaveCount(0)
  })

  test('a printer that refuses the rename keeps its name: the reason is shown and the Control label does not change', async ({ page, open }) => {
    const { db } = await setUp(page)
    const sent = await renameRoute(page, 403)
    await open('/settings#general')
    const name = page.getByTestId('setting-name').locator('input').or(page.locator('input[data-tid="setting-name"]')).first()
    await name.fill('Elm Bench')
    await name.press('Tab')
    await expect(page.getByText('did not accept the new name: muon_setup: protected. Nothing changed.')).toBeVisible()
    expect(sent).toEqual([{ name: 'Elm Bench' }])
    expect(saves(db, 'uiSettings.general.instanceName')).toEqual([])
    await expect(name).not.toHaveValue('Elm Bench')
  })
})

/** The printer's time zone route: reads `zone`, records writes, answers per `mode`. */
async function zoneRoute (page: Page, mode: 'ok' | 'refuse' | 'missing') {
  const sent: Array<Record<string, unknown>> = []
  await page.route(/\/server\/muon\/timezone/, async route => {
    if (mode === 'missing') { await route.fulfill({ status: 404, json: { error: 'Not Found' } }); return }
    if (route.request().method() === 'GET') { await route.fulfill({ json: { result: { zone: 'Europe/London' } } }); return }
    sent.push(route.request().postDataJSON())
    if (mode === 'refuse') await route.fulfill({ status: 403, json: { error: 'only the owner can change the time zone' } })
    else await route.fulfill({ json: { result: { zone: String(sent.at(-1)!.zone) } } })
  })
  return sent
}

async function pickZone (page: Page, zone: string) {
  await page.getByTestId('setting-timezone-select').fill(zone)
  await page.getByRole('option', { name: zone, exact: true }).click()
}

test.describe('time zone from Control (KAN-3603)', () => {
  test('the zone the printer reports is shown and a new one is sent to it', async ({ page, open }) => {
    await setUp(page)
    const sent = await zoneRoute(page, 'ok')
    await open('/settings#general')
    await expect(page.getByTestId('setting-timezone')).toBeVisible()
    await expect(page.getByTestId('setting-timezone-select')).toHaveValue('Europe/London')
    await pickZone(page, 'Europe/Paris')
    await expect.poll(() => sent).toEqual([{ zone: 'Europe/Paris' }])
    await expect(page.getByText('did not accept that time zone')).toHaveCount(0)
  })

  test('a refusal is shown under the field and the zone does not change', async ({ page, open }) => {
    await setUp(page)
    const sent = await zoneRoute(page, 'refuse')
    await open('/settings#general')
    await expect(page.getByTestId('setting-timezone')).toBeVisible()
    await pickZone(page, 'Europe/Paris')
    await expect(page.getByText('did not accept that time zone: only the owner can change the time zone. Nothing changed.')).toBeVisible()
    expect(sent).toEqual([{ zone: 'Europe/Paris' }])
    await expect(page.getByTestId('setting-timezone-select')).toHaveValue('Europe/London')
  })

  test('a printer without the route (404) shows no Time zone row', async ({ page, open }) => {
    await setUp(page)
    await zoneRoute(page, 'missing')
    await open('/settings#general')
    await expect(page.getByTestId('setting-times')).toBeVisible()
    await expect(page.getByTestId('setting-timezone')).toHaveCount(0)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the groups are full width and the layout buttons are in reach', async ({ page, open }) => {
    await setUp(page)
    await open(`${PRINTER}/settings#general`)
    const layout = page.getByTestId('layout-settings')
    await expect(layout).toBeVisible()
    const box = await layout.boundingBox()
    expect(box!.width).toBeGreaterThan(390 - 48)
    await expect(layout.getByTestId('layout-reset-overview')).toBeVisible()
    await expect(page.getByTestId('estop').first()).toBeVisible()
  })
})
