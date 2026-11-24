/**
 * Overview, I-542: one row of widgets (Hotend, Bed, Position with typed axes and
 * Motors off, Print mode), a bigger Trackpad, and a full-width Quick commands tile
 * of exactly two rows. Each test has a negative control: the opposite case it
 * must NOT do.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'

// Real names from the M1 config (Muon3D_Klipper core/M1/macros): the defaults, and the left-out test and dev macros.
const DEFAULTS = ['LOAD_FILAMENT', 'UNLOAD_FILAMENT', 'PURGE_LINE', 'CLEAN_NOZZLE', 'CUT_FILAMENT', 'PARK_PRINTER', 'CENTER', 'LED_MODE', 'CALIBRATE_HEATING_HOTEND', 'CALIBRATE_HEATING_BED', 'CALIBRATE_PROBE', 'Z_PARK']
const LEFT_OUT = ['BUZZ_EXTRUDER', 'STEPLOSS_TEST', 'TEST_SPEED', 'LED_INFO', 'LED_READY', 'CHOME', 'FINETUNE_RESONANCE', 'RESET_CALIBRATION']
const settings = (names: string[]) => Object.fromEntries(names.map(n => [`gcode_macro ${n}`, { gcode: '' }]))
const HELP = { SET_PRINT_MODE: 'Select the print mode', BED_MESH_CALIBRATE: 'Calibrate the bed mesh' }

async function start (page: Page, extra = {}, macros = [...DEFAULTS, ...LEFT_OUT], homed = 'xyz') {
  const printer = await usePrinter(page, overlay(PRESETS.idleHomed({ homed }), { configfile: { settings: settings(macros) }, fan_modes: { mode: 'normal', modes: ['quiet', 'normal', 'turbo'] }, ...extra }), { ticks: false, database: true })
  printer.state.results['printer.gcode.help'] = HELP
  return printer
}

const chips = (page: Page) => page.locator('[data-tile="macros"] [data-tid="macro-chip"], [data-tile="macros"] [data-tid="macros-all"]')
const rows = (page: Page) => chips(page).evaluateAll(els => new Set(els.map(e => (e as HTMLElement).offsetTop)).size)

for (const width of [390, 1440, 1920]) {
  test.describe(`Quick commands at ${width}`, () => {
    test('are exactly two rows, and All commands is the last tile', async ({ page, open }) => {
      await start(page)
      await page.setViewportSize({ width, height: 900 })
      await open('/')
      await expect(page.getByTestId('macros-all')).toBeVisible()
      expect(await rows(page)).toBe(2)
      // The last tile in order is All commands, and it is the only one that is.
      const ids = await chips(page).evaluateAll(els => els.map(e => (e as HTMLElement).dataset.tid))
      expect(ids[ids.length - 1]).toBe('macros-all')
      expect(ids.filter(i => i === 'macros-all')).toHaveLength(1)
      // Negative controls: the test and dev macros are not tiles, and every width keeps its first tile.
      await expect(page.locator('[data-tile="macros"] [data-macro="BUZZ_EXTRUDER"], [data-tile="macros"] [data-macro="TEST_SPEED"]')).toHaveCount(0)
      // KAN-5980: Home all is the Trackpad's alone, not a Quick command.
      await expect(page.locator('[data-tile="macros"] [data-macro="home"]')).toHaveCount(0)
      await expect(page.locator('[data-tile="macros"] [data-macro="load"]')).toHaveCount(1)
    })
  })
}

test('a narrower tile shows fewer commands, dropping from the tail (negative control: not a fixed list)', async ({ page, open }) => {
  await start(page)
  await page.setViewportSize({ width: 1920, height: 900 })
  await open('/')
  await expect(page.getByTestId('macros-all')).toBeVisible()
  const wide = await chips(page).count()
  await page.setViewportSize({ width: 390, height: 900 })
  await expect.poll(() => chips(page).count()).toBeLessThan(wide)
  const keys = await page.locator('[data-tile="macros"] [data-tid="macro-chip"]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.macro))
  expect(keys).toEqual(['load', 'unload', 'purge'])
})

test('only macros the printer has are shown (negative control: Purge line and Lights off absent without them)', async ({ page, open }) => {
  await start(page, {}, ['LOAD_FILAMENT', 'CLEAN_NOZZLE'])
  await open('/')
  await expect(page.locator('[data-tile="macros"] [data-macro="load"]')).toBeVisible()
  await expect(page.locator('[data-tile="macros"] [data-macro="purge"]')).toHaveCount(0)
  await expect(page.locator('[data-tile="macros"] [data-macro="lights-off"]')).toHaveCount(0)
})

test('Lights off sends LED_MODE MODE=off', async ({ page, open }) => {
  const printer = await start(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await open('/')
  const tile = page.locator('[data-tile="macros"] [data-macro="lights-off"]')
  await expect(tile).toBeVisible()
  expect(printer.gcode).toEqual([])
  await tile.click()
  await expect.poll(() => printer.gcode).toEqual(['LED_MODE MODE=off'])
  // Negative control: another tile sends its own macro, not the lights.
  await page.locator('[data-tile="macros"] [data-macro="purge"]').click()
  await expect.poll(() => printer.gcode).toEqual(['LED_MODE MODE=off', 'PURGE_LINE'])
})

test.describe('Motors off in the Position tile', () => {
  test('sends M84 at once, as it always has (there is no confirm)', async ({ page, open }) => {
    const printer = await start(page)
    await open('/')
    const button = page.locator('[data-tile="position"]').getByTestId('motors-off')
    await expect(button).toHaveAttribute('title', 'Turn the motors off (M84)')
    expect(printer.gcode).toEqual([])
    await button.click()
    await expect.poll(() => printer.gcode).toEqual(['M84'])
    // The standalone tile is gone.
    await expect(page.locator('[data-tile="motors"]')).toHaveCount(0)
  })

  test('is off while a print runs (negative control: nothing is sent)', async ({ page, open }) => {
    const printer = await start(page, { print_stats: { state: 'printing', filename: 'cube.gcode' }, idle_timeout: { state: 'Printing' }, virtual_sdcard: { is_active: true, progress: 0.3 } })
    await open('/')
    const button = page.locator('[data-tile="position"]').getByTestId('motors-off')
    await expect(button).toBeDisabled()
    await button.click({ force: true }).catch(() => {})
    expect(printer.gcode).toEqual([])
  })
})

test.describe('Position tile', () => {
  test('click an axis, type a number, Enter: the head goes there', async ({ page, open }) => {
    const printer = await start(page)
    await open('/')
    await page.getByTestId('axis-edit-x').click()
    await page.getByTestId('axis-input-x').fill('140')
    await page.getByTestId('axis-input-x').press('Enter')
    await expect.poll(() => printer.moves().some(m => m.includes('X140'))).toBe(true)
  })

  test('a number outside the machine is refused (negative control: nothing is sent)', async ({ page, open }) => {
    const printer = await start(page)
    await open('/')
    await page.getByTestId('axis-edit-x').click()
    await page.getByTestId('axis-input-x').fill('9999')
    await page.getByTestId('axis-input-x').press('Enter')
    await expect(page.getByTestId('axis-input-x')).toHaveAttribute('aria-invalid', 'true')
    expect(printer.moves()).toEqual([])
  })

  test('an axis that is not homed says so, with no Home button of its own (KAN-5980)', async ({ page, open }) => {
    const printer = await start(page, {}, undefined, 'xy')
    await open('/')
    await expect(page.getByTestId('axis-not-homed')).toHaveCount(1)
    await expect(page.locator('[data-tile="position"]').getByRole('button', { name: /^Home/ })).toHaveCount(0)
    expect(printer.gcode).toEqual([])
  })
})

test.describe('A layout saved before the new row', () => {
  const KEY = 'muon.overview.layout.v3.anonymous.boxwood-367a'
  const OLD = { version: 1, savedAt: 1, tiles: [{ id: 'stage', span: 8, rows: 2 }, { id: 'job', span: 4, rows: 1 }, { id: 'mode', span: 6, rows: 1 }, { id: 'position', span: 6, rows: 1 }], hidden: [] }

  test('shows the new default once, says so, and Keep this layout saves it', async ({ page, open }) => {
    await start(page)
    await page.addInitScript(([key, value]) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value) }, [KEY, JSON.stringify(OLD)])
    await open('/')
    await expect(page.getByTestId('layout-migrated')).toBeVisible()
    await expect(page.locator('[data-cell="hotend"]')).toBeVisible()
    await page.getByTestId('layout-keep').click()
    await expect(page.getByTestId('layout-migrated')).toHaveCount(0)
    expect(JSON.parse((await page.evaluate(k => localStorage.getItem(k), KEY))!).version).toBe(3)
  })

  test('a layout saved by this version is left alone (negative control: no notice)', async ({ page, open }) => {
    await start(page)
    const mine = { ...OLD, version: 2, tiles: [{ id: 'stage', span: 7, rows: 2 }, { id: 'job', span: 5, rows: 1 }], hidden: ['filament', 'mode', 'position'] }
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [KEY, JSON.stringify(mine)])
    await open('/')
    await expect(page.locator('[data-cell="job"]')).toBeVisible()
    await expect(page.getByTestId('layout-migrated')).toHaveCount(0)
    await expect(page.locator('[data-cell="hotend"]')).toHaveCount(0)
  })
})
