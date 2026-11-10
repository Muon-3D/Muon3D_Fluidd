/**
 * Settings › Materials to the v3 storyboard (control-settings-materials-1106):
 * your presets, then everything on the printer with the four defaults always
 * there; pins (at most six, in drag order) are what the filament picker
 * shows; the bundled library adds a printer-local copy; a preset's sheet
 * refuses temperatures above the printer's own limits, shows the part fan in
 * %, and locks raw G-code to developer mode on a Muon printer.
 */
import type { Page } from '@playwright/test'
import { test, expect, PRINTER } from '../fixtures'
import { PRESETS, usePrinter, type PrinterHandle } from './printer'

const DEFAULTS = ['PLA', 'PETG', 'ABS', 'TPU']
const NOT_MUON = ['database', 'file_manager', 'klippy_apis', 'machine', 'history', 'authorization']
const MUON = [...NOT_MUON, 'muon_access']

type Preset = { id: string, name: string, values: Record<string, { value: number, type: 'heater' | 'fan', active: boolean }> }
const preset = (id: string, name: string, nozzle: number, bed = 60): Preset => ({
  id,
  name,
  values: { extruder: { value: nozzle, type: 'heater', active: true }, heater_bed: { value: bed, type: 'heater', active: true } }
})

async function materialsPrinter (page: Page, options: { components?: string[], presets?: Preset[], pins?: string[] } = {}): Promise<PrinterHandle> {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true, components: options.components })
  const uiSettings: Record<string, unknown> = {}
  if (options.presets) uiSettings.dashboard = { tempPresets: options.presets }
  if (options.pins) uiSettings.general = { pinnedMaterials: options.pins }
  if (options.presets || options.pins) printer.database.fluidd = { uiSettings }
  return printer
}

const pane = (page: Page) => page.getByTestId('materials-settings')
const row = (page: Page, name: string) => pane(page).getByTestId(`material-row-${name}`)

/** What this page wrote to one key of Moonraker's database. */
const writes = (printer: PrinterHandle, key: string) => printer.called('server.database.post_item')
  .filter(p => p.namespace === 'fluidd' && p.key === key)
  .map(p => p.value)

async function openMaterials (page: Page, open: (path: string) => Promise<void>) {
  await open(`${PRINTER}/settings#presets`)
  await expect(row(page, 'PLA')).toBeVisible()
}

async function openSheet (page: Page, name: string) {
  await pane(page).getByTestId(`material-open-${name}`).click()
  const sheet = page.getByTestId('preset-sheet')
  await expect(sheet).toBeVisible()
  return sheet
}

/** The filament picker on Control, open. */
async function openPicker (page: Page, open: (path: string) => Promise<void>) {
  await open(`${PRINTER}/control`)
  await page.getByTestId('chip-filament').first().click()
  const picker = page.getByTestId('material-picker')
  await expect(picker).toBeVisible()
  return picker
}

const pickerNames = (page: Page) => page.getByTestId('material-shortlist').getByRole('option').locator('b').allInnerTexts()

test.describe('Settings › Materials', () => {
  test('the four defaults are always there, pinned, and cannot be deleted; loading writes nothing', async ({ page, open }) => {
    const printer = await materialsPrinter(page)
    await openMaterials(page, open)
    const onPrinter = pane(page).getByTestId('materials-printer')
    for (const name of DEFAULTS) {
      await expect(onPrinter.getByTestId(`material-row-${name}`)).toContainText(name)
      await expect(onPrinter.getByTestId(`material-pin-${name}`)).toHaveAttribute('aria-pressed', 'true')
    }
    await expect(pane(page).getByTestId('materials-pins-note')).toContainText('Pinned materials (4 of 6)')
    await expect(pane(page).getByTestId('materials-yours')).toContainText('None yet')
    const sheet = await openSheet(page, 'PLA')
    await expect(sheet.getByTestId('preset-delete')).toHaveCount(0)
    await expect(sheet.getByTestId('preset-source')).toContainText('From Generic PLA')
    expect(printer.called('server.database.post_item')).toEqual([])
  })

  test('your own presets come first, marked as yours, and can be deleted', async ({ page, open }) => {
    const printer = await materialsPrinter(page, { presets: [{ ...preset('n1', 'Nylon', 260, 70) }] })
    await openMaterials(page, open)
    const yours = pane(page).getByTestId('materials-yours')
    await expect(yours.getByTestId('material-row-Nylon')).toContainText('Yours')
    await expect(yours.getByTestId('material-row-Nylon')).toContainText('260° · 70°')
    const sheet = await openSheet(page, 'Nylon')
    await sheet.getByTestId('preset-delete').click()
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).last().click()
    await expect(row(page, 'Nylon')).toHaveCount(0)
    const saved = writes(printer, 'uiSettings.dashboard.tempPresets').at(-1) as Preset[]
    expect(saved.map(p => p.name)).toEqual([])
  })

  test('search narrows the printer list and the library; brand and type filters stack', async ({ page, open }) => {
    await materialsPrinter(page)
    await openMaterials(page, open)
    await pane(page).getByTestId('materials-search').fill('pet')
    await expect(row(page, 'PETG')).toBeVisible()
    await expect(row(page, 'PLA')).toHaveCount(0)
    await pane(page).getByTestId('materials-search').fill('nothing like this')
    await expect(pane(page).getByTestId('materials-printer')).toContainText('None match.')
    await pane(page).getByTestId('materials-search').fill('')

    const library = page.getByTestId('material-library')
    await library.getByTestId('library-search').fill('polymaker petg')
    const results = library.getByTestId('library-results').locator('[data-tid^="library-row-"]')
    await expect(results).toHaveCount(3)
    await library.getByTestId('library-chip-cf').click()
    await expect(results).toHaveCount(1)
    await expect(results.first()).toContainText('PolyLite PETG-CF')
    await expect(results.first()).toContainText('needs a hardened nozzle')
    await library.getByTestId('library-search').fill('')
    await library.getByTestId('library-chip-cf').click()
    await library.getByTestId('library-brand-Prusament').click()
    await library.getByTestId('library-chip-tpu').click()
    await expect(library.getByTestId('library-results')).toContainText('Nothing in the library matches')
  })

  test('adding from the library copies it onto the printer, shown On the printer, kept after a reload', async ({ page, open }) => {
    const printer = await materialsPrinter(page)
    await openMaterials(page, open)
    const library = page.getByTestId('material-library')
    await library.getByTestId('library-search').fill('polylite pla')
    await library.getByTestId('library-add-polymaker-polylite-pla').click()
    await expect(library.getByTestId('library-on-polymaker-polylite-pla')).toHaveText(/^On /)
    const onPrinter = pane(page).getByTestId('materials-printer')
    await expect(onPrinter.getByTestId('material-row-Polymaker PolyLite PLA')).toContainText('From Polymaker PolyLite PLA')
    await expect(onPrinter.getByTestId('material-row-Polymaker PolyLite PLA')).toContainText('210° · 60°')

    const saved = writes(printer, 'uiSettings.dashboard.tempPresets').at(-1) as Array<Preset & Record<string, unknown>>
    const copy = saved.filter(p => p.origin === 'library')
    expect(copy).toHaveLength(1)
    expect(copy[0]).toMatchObject({ name: 'Polymaker PolyLite PLA', libraryId: 'polymaker-polylite-pla', partFan: 100 })
    expect(copy[0].values.extruder).toEqual({ value: 210, type: 'heater', active: true })

    await page.reload()
    await expect(row(page, 'Polymaker PolyLite PLA')).toBeVisible()
    await expect(row(page, 'PLA')).toBeVisible()
  })

  test('Add a material: one popup with search, filters, maker ranges, and a hardened-nozzle question for carbon fibre', async ({ page, open }) => {
    const printer = await materialsPrinter(page)
    await openMaterials(page, open)
    await pane(page).getByTestId('material-add').click()
    const popup = page.getByTestId('add-material')
    await expect(popup).toBeVisible()
    await expect(popup.getByTestId('add-material-own')).toContainText('Make my own')
    await popup.getByTestId('add-material-search').fill('polymaker petg')
    await expect(popup.getByTestId('add-material-row-polymaker-polylite-petg')).toContainText('Polymaker · 230–250° · bed 70–80°')
    await popup.getByTestId('add-material-add-polymaker-polylite-petg-cf').click()
    const ask = page.getByRole('dialog').filter({ hasText: 'This needs a hardened nozzle' }).last()
    await expect(ask).toBeVisible()
    await ask.getByTestId('confirm-cancel').click()
    await expect(popup.getByTestId('add-material-add-polymaker-polylite-petg-cf')).toBeVisible()
    expect(writes(printer, 'uiSettings.dashboard.tempPresets')).toEqual([])

    await popup.getByTestId('add-material-add-polymaker-polylite-petg').click()
    await expect(popup.getByTestId('add-material-added-polymaker-polylite-petg')).toHaveText('Added')
    await popup.getByTestId('add-material-done').click()
    await expect(row(page, 'Polymaker PolyLite PETG')).toBeVisible()
  })

  test('Make my own from a library entry creates one of Your presets', async ({ page, open }) => {
    const printer = await materialsPrinter(page)
    await openMaterials(page, open)
    const library = page.getByTestId('material-library')
    await library.getByTestId('library-search').fill('polyterra')
    await library.getByTestId('library-own-polymaker-polyterra-pla').click()
    const sheet = page.getByTestId('preset-sheet')
    await sheet.getByTestId('preset-name').fill('PLA slow first layer')
    await sheet.getByTestId('preset-save').click()
    await expect(sheet).toHaveCount(0)
    await expect(pane(page).getByTestId('materials-yours').getByTestId('material-row-PLA slow first layer')).toContainText('Yours · from Polymaker PolyTerra PLA')
    const saved = writes(printer, 'uiSettings.dashboard.tempPresets').at(-1) as Array<Record<string, unknown>>
    expect(saved.find(p => p.name === 'PLA slow first layer')).toMatchObject({ origin: 'own', source: 'Polymaker PolyTerra PLA' })
  })

  test('pins: unpinning and pinning changes the picker, and a seventh pin is refused', async ({ page, open }) => {
    const printer = await materialsPrinter(page, { presets: [preset('a', 'ASA', 255, 100), preset('b', 'PC', 270, 100), preset('c', 'Nylon', 260, 70)] })
    await openMaterials(page, open)
    await pane(page).getByTestId('material-pin-PETG').click()
    await expect(pane(page).getByTestId('material-pin-PETG')).toHaveAttribute('aria-pressed', 'false')
    expect(writes(printer, 'uiSettings.general.pinnedMaterials').at(-1)).toEqual(['PLA', 'ABS', 'TPU'])
    for (const name of ['PETG', 'ASA', 'PC']) await pane(page).getByTestId(`material-pin-${name}`).click()
    await expect(pane(page).getByTestId('materials-pins-note')).toContainText('(6 of 6)')
    await expect(pane(page).getByTestId('material-pin-Nylon')).toBeDisabled()
    expect(writes(printer, 'uiSettings.general.pinnedMaterials').at(-1)).toEqual(['PLA', 'ABS', 'TPU', 'PETG', 'ASA', 'PC'])

    await openPicker(page, open)
    expect(await pickerNames(page)).toEqual(['PLA', 'ABS', 'TPU', 'PETG', 'ASA', 'PC'])
  })

  test('pinned materials keep the order they are dragged (or moved with the arrow keys) into, in the picker too', async ({ page, open, isMobile }) => {
    const printer = await materialsPrinter(page)
    await openMaterials(page, open)
    if (isMobile) {
      await pane(page).getByTestId('material-grip-TPU').focus()
      for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowUp')
    } else {
      await pane(page).getByTestId('material-grip-TPU').dragTo(row(page, 'PLA'))
    }
    await expect.poll(() => writes(printer, 'uiSettings.general.pinnedMaterials').at(-1)).toEqual(['TPU', 'PLA', 'PETG', 'ABS'])
    const order = await pane(page).getByTestId('materials-printer').locator('[data-tid^="material-row-"]').evaluateAll(rows => rows.map(r => r.getAttribute('data-tid')))
    expect(order).toEqual(['TPU', 'PLA', 'PETG', 'ABS'].map(n => `material-row-${n}`))

    await openPicker(page, open)
    expect(await pickerNames(page)).toEqual(['TPU', 'PLA', 'PETG', 'ABS'])
  })

  test('a temperature above the printer\'s own limit is refused, with the limit shown; the part fan is in %', async ({ page, open }) => {
    const printer = await materialsPrinter(page)
    await openMaterials(page, open)
    const sheet = await openSheet(page, 'PETG')
    await expect(sheet).toContainText('Maker says 220–260°')
    await expect(sheet.getByTestId('preset-fan-unit')).toHaveText('%')
    await expect(sheet.getByTestId('preset-fan')).toHaveValue('40')

    // The mock printer's [extruder] max_temp is 300 and [heater_bed] 120.
    await sheet.getByTestId('preset-temp-nozzle').fill('320')
    await expect(sheet.getByTestId('preset-limit-nozzle')).toContainText('300°C')
    await sheet.getByTestId('preset-temp-plate').fill('130')
    await expect(sheet.getByTestId('preset-limit-plate')).toContainText('120°C')
    await sheet.getByTestId('preset-save').click()
    await expect(sheet).toBeVisible()
    expect(writes(printer, 'uiSettings.dashboard.tempPresets')).toEqual([])

    await sheet.getByTestId('preset-temp-nozzle').fill('245')
    await sheet.getByTestId('preset-temp-plate').fill('85')
    await sheet.getByTestId('preset-fan').fill('30')
    await sheet.getByTestId('preset-save').click()
    await expect(sheet).toHaveCount(0)
    await expect(row(page, 'PETG')).toContainText('245° · 85°')
    const saved = writes(printer, 'uiSettings.dashboard.tempPresets').at(-1) as Array<Preset & Record<string, unknown>>
    const petg = saved.find(p => p.name === 'PETG')!
    expect(petg).toMatchObject({ partFan: 30, origin: 'default' })
    expect(petg.values.extruder.value).toBe(245)
  })

  test('on a Muon printer, G-code on a preset is developer mode only', async ({ page, open }) => {
    await materialsPrinter(page, { components: MUON })
    await openMaterials(page, open)
    const sheet = await openSheet(page, 'PLA')
    await expect(sheet.getByTestId('preset-gcode-locked')).toContainText('G-code when chosen')
    await expect(sheet.getByTestId('preset-gcode-locked')).toContainText('Developer mode only on Muon printers')
    await expect(sheet.getByTestId('preset-gcode')).toHaveCount(0)
  })

  test('on a printer that is not a Muon, G-code on a preset can be edited and is saved', async ({ page, open }) => {
    const printer = await materialsPrinter(page, { components: NOT_MUON })
    await openMaterials(page, open)
    const sheet = await openSheet(page, 'PLA')
    await expect(sheet.getByTestId('preset-gcode-locked')).toHaveCount(0)
    await sheet.getByTestId('preset-gcode').fill('M117 PLA')
    await sheet.getByTestId('preset-save').click()
    await expect(sheet).toHaveCount(0)
    const saved = writes(printer, 'uiSettings.dashboard.tempPresets').at(-1) as Array<Record<string, unknown>>
    expect(saved.find(p => p.name === 'PLA')).toMatchObject({ gcode: 'M117 PLA' })
  })

  test('when the library cannot load the printer\'s materials still work, and Retry brings it back', async ({ page, open }) => {
    await materialsPrinter(page)
    await page.route(/\/library[^/]*\.json/, route => route.abort())
    await openMaterials(page, open)
    const offline = page.getByTestId('material-library').getByTestId('library-offline')
    await expect(offline).toContainText('The material library is offline. Materials on Boxwood still work.')
    for (const name of DEFAULTS) await expect(row(page, name)).toBeVisible()
    await page.unroute(/\/library[^/]*\.json/)
    await offline.getByTestId('library-retry').click()
    await expect(page.getByTestId('library-results').locator('[data-tid^="library-row-"]').first()).toBeVisible()
  })

  test('brands are a list beside the results on a desktop and a row above them on a phone', async ({ page, open, isMobile }) => {
    await materialsPrinter(page)
    await openMaterials(page, open)
    const all = await page.getByTestId('library-brand-all').boundingBox()
    const generic = await page.getByTestId('library-brand-Generic').boundingBox()
    const search = await page.getByTestId('library-search').boundingBox()
    expect(all && generic && search).toBeTruthy()
    if (isMobile) {
      expect(Math.abs(all!.y - generic!.y)).toBeLessThan(4)
      expect(search!.y).toBeGreaterThan(all!.y)
    } else {
      expect(generic!.y).toBeGreaterThan(all!.y)
      expect(search!.x).toBeGreaterThan(all!.x + all!.width)
    }
  })
})

test.describe('the filament picker', () => {
  test('shows pinned materials only, with + Add and See materials, and no "See all materials" popup', async ({ page, open }) => {
    await materialsPrinter(page, { presets: [preset('n1', 'Nylon', 260, 70)], pins: ['Nylon', 'PLA'] })
    const picker = await openPicker(page, open)
    expect(await pickerNames(page)).toEqual(['Nylon', 'PLA'])
    await expect(picker.getByTestId('material-see-all')).toHaveCount(0)
    await expect(picker).not.toContainText("Change the materials' temperatures")
    await expect(picker.getByRole('button', { name: /^(Pin|Unpin) / })).toHaveCount(0)
    await expect(picker.getByTestId('material-colours')).toBeVisible()
    await expect(picker.getByTestId('material-see-materials')).toHaveText('See materials ›')

    await picker.getByTestId('material-picker-add').click()
    const popup = page.getByTestId('add-material')
    await expect(popup).toBeVisible()
    await popup.getByTestId('add-material-see-all').click()
    await expect(page).toHaveURL(/settings#presets/)
    await expect(row(page, 'Nylon')).toBeVisible()
  })

  test('Heat\'s More opens the same Add-a-material popup', async ({ page, open }) => {
    await materialsPrinter(page)
    await open(`${PRINTER}/control`)
    const heat = page.getByTestId('control-heat')
    await heat.getByRole('button', { name: 'Heat options' }).or(heat.getByLabel('Heat options')).first().click()
    await heat.getByTestId('heat-add-material').click()
    await expect(page.getByTestId('add-material')).toBeVisible()
    await expect(page.getByTestId('add-material').getByTestId('add-material-own')).toBeVisible()
  })
})
