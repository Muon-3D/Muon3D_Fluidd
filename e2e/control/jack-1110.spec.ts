/**
 * Jack's 10 Nov bench notes (devin-briefs/control-jack-1110-gaps.md):
 * - KAN-1951: print mode is Quiet / Normal / Turbo; no Fans tile and no
 *   speed-and-flow stand-in by default.
 * - KAN-1953: Load and Unload sit inside the filament box, evenly, full width.
 * - KAN-1954: what the printer reports as loaded shows live, with no reload.
 * - KAN-1955: Home all is the first thing under the trackpad's header.
 */
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'

const M1_FILAMENT = {
  'gcode_macro M600': {},
  'gcode_macro LOAD_FILAMENT': {},
  'gcode_macro UNLOAD_FILAMENT': {},
  save_variables: { variables: {} },
  configfile: {
    settings: {
      'gcode_macro m600': { gcode: 'PAUSE' },
      'gcode_macro load_filament': { gcode: 'FILAMENT_INSERT_FLOW {rawparams}' },
      'gcode_macro unload_filament': { gcode: 'G1 E-30 F3600' }
    }
  }
}
const idle = () => overlay(PRESETS.idleHomed(), M1_FILAMENT)

test.describe('KAN-1951: print mode only', () => {
  test('no Fans tile on Overview or Control by default, and Print mode is never "Speed and flow"', async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await expect(page.locator('[data-cell="mode"]')).toBeVisible()
    await expect(page.locator('[data-cell="fans"]')).toHaveCount(0)
    await open('/control')
    const mode = page.getByTestId('control-printmode')
    await expect(mode).toBeVisible()
    await expect(mode).toContainText('Print mode')
    await expect(mode).not.toContainText('Speed and flow')
    await expect(page.getByTestId('control-fans')).toHaveCount(0)
  })
})

test.describe('KAN-1953 / KAN-1954: the filament box', () => {
  test('Load and Unload are inside the box, side by side, sharing its full width', async ({ page, open }) => {
    await usePrinter(page, idle())
    await open('/control')
    await page.getByTestId('chip-filament').click()
    const panel = page.getByTestId('material-picker')
    await expect(panel.getByTestId('material-load')).toBeVisible()
    const box = await panel.getByTestId('material-load-unload').boundingBox()
    const load = await panel.getByTestId('material-load').boundingBox()
    const unload = await panel.getByTestId('material-unload').boundingBox()
    if (!box || !load || !unload) throw new Error('not on screen')
    expect(Math.abs(load.width - unload.width)).toBeLessThan(2)
    expect(Math.abs(load.y - unload.y)).toBeLessThan(2)
    expect(load.width + unload.width).toBeGreaterThan(box.width - 16)
    expect(Math.abs(load.x - box.x)).toBeLessThan(2)
  })

  test('the mock printer loads, and the box and panel update live', async ({ page, open }) => {
    const printer = await usePrinter(page, idle())
    await open('/')
    await expect(page.getByTestId('filament-type')).toHaveText('No material loaded')
    await page.getByTestId('filament-row').click()
    await page.getByTestId('material-PETG').click()
    await expect.poll(() => printer.gcode).toContain('SAVE_VARIABLE VARIABLE=muon_material VALUE=\'"PETG"\'')
    // The printer saves it and reports it back.
    printer.report({ save_variables: { variables: { muon_material: 'PETG' } } })
    await expect(page.getByTestId('filament-type')).toHaveText('PETG')
    await expect(page.getByTestId('material-PETG')).toHaveAttribute('aria-selected', 'true')
    await page.getByTestId('material-load').click()
    await expect.poll(() => printer.gcode.slice(-1)).toEqual(['LOAD_FILAMENT'])
    // Loading, the printer names the colour too: it shows with no reload.
    printer.report({ save_variables: { variables: { muon_material: 'PETG', muon_material_colour: 'D32F2F' } } })
    await expect(page.getByTestId('filament-type')).toHaveText('PETG')
    await expect(page.getByTestId('filament-detail')).not.toHaveText('Colour not set')
    await open('/control')
    await expect(page.getByTestId('chip-filament')).toContainText('PETG')
  })
})

test('KAN-1955: Home all is the first action under the trackpad header, and sends G28', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/control')
  const homes = page.getByTestId('move-homes')
  await expect(homes).toBeVisible()
  const pad = await page.getByTestId('move-trackpad').boundingBox()
  const bar = await homes.boundingBox()
  if (!pad || !bar) throw new Error('not on screen')
  expect(bar.y).toBeLessThan(pad.y)
  await homes.getByTestId('home-all').click()
  await expect.poll(() => printer.gcode).toContain('G28')
})
