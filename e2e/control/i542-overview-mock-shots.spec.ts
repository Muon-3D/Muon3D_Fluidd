/**
 * I-542: screenshots of the built Overview (one row of widgets, Trackpad, Jog + Lighting, two-row Quick commands).
 * Not a regression test: it only runs with I542_SHOTS=<folder> and writes pictures there.
 *   I542_SHOTS=... E2E_PORT=8542 E2E_MOCK_PORT=7542 npx playwright test -c e2e/playwright.config.ts control/i542
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'

const OUT = process.env.I542_SHOTS
test.skip(!OUT, 'screenshots only')

test.use({ webgl: true })
const GPU = process.platform === 'win32'
// Only on a GPU host: an empty launchOptions override still puts the file in its own worker bucket, and Playwright shards bucket by bucket (KAN-4847, KAN-5192).
if (GPU) test.use({ launchOptions: { args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] } })

// Real names from the M1 config (Muon3D_Klipper core/M1/macros), the ones a person would press.
const M1_MACROS = ['LOAD_FILAMENT', 'UNLOAD_FILAMENT', 'PURGE_LINE', 'CLEAN_NOZZLE', 'CUT_FILAMENT', 'PARK_PRINTER', 'CENTER', 'LED_MODE', 'CALIBRATE_HEATING_HOTEND', 'CALIBRATE_HEATING_BED', 'CALIBRATE_PROBE', 'Z_PARK',
  'BUZZ_EXTRUDER', 'STEPLOSS_TEST', 'TEST_SPEED', 'LED_INFO', 'LED_READY', 'CHOME', 'FINETUNE_RESONANCE', 'RESET_CALIBRATION']
const MACROS = Object.fromEntries(M1_MACROS.map(n => [`gcode_macro ${n}`, { gcode: '' }]))

const STATE = {
  configfile: { settings: MACROS },
  fan_modes: { mode: 'normal', modes: ['quiet', 'normal', 'turbo'] },
  'gcode_macro LED_MODE': { mode: 'solid', h: 30, h2: 240, bright: 80, speed: 55 },
  extruder: { temperature: 214.8, target: 220 },
  heater_bed: { temperature: 59.6, target: 60 }
}

async function show (page: Page, open: (p: string) => Promise<void>, homed = 'xyz') {
  const printer = await usePrinter(page, overlay(PRESETS.idleHomed({ position: [112.5, 86, 24.5], homed }), STATE), { ticks: false })
  printer.state.results['printer.gcode.help'] = { SET_PRINT_MODE: 'Select the print mode', LED_MODE: 'LEDs', M84: 'Motors off', BED_MESH_CALIBRATE: 'Mesh' }
  await open('/')
  await expect(page.locator('[data-tile="position"]')).toBeVisible()
  await expect(page.locator('[data-tile="trackpad"]')).toBeVisible()
  await page.waitForTimeout(2500)
  return printer
}

/** The one row of widgets with the Filament tile above it and the Temperatures below, as a person scrolled to it sees it. */
async function row (page: Page, name: string) {
  const a = (await page.locator('[data-tile="hotend"]').boundingBox())!
  const b = (await page.locator('[data-cell="mode"]').boundingBox())!
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: true, clip: { x: 240, y: a.y - 120, width: b.x + b.width - 240 + 24, height: a.height + 240 } })
}

test('desktop 1440', async ({ page, open, isMobile }) => {
  test.skip(isMobile)
  await show(page, open)
  await page.screenshot({ path: `${OUT}/01-desktop-1440.png`, fullPage: true })
})

test('desktop 1920', async ({ page, open, isMobile }) => {
  test.skip(isMobile)
  await page.setViewportSize({ width: 1920, height: 1080 })
  await show(page, open)
  await page.screenshot({ path: `${OUT}/02-desktop-1920.png`, fullPage: true })
})

test('phone 390', async ({ page, open, isMobile }) => {
  test.skip(!isMobile)
  await show(page, open)
  await page.screenshot({ path: `${OUT}/03-phone-390.png`, fullPage: true })
})

test('not homed with Home buttons', async ({ page, open, isMobile }) => {
  test.skip(isMobile)
  await show(page, open, 'xy')
  await expect(page.getByTestId('axis-not-homed')).toHaveCount(1)
  await row(page, '04-not-homed-1440.png')
})

test('axis box in edit mode', async ({ page, open, isMobile }) => {
  test.skip(isMobile)
  await show(page, open)
  await page.getByTestId('axis-edit-x').click()
  await page.getByTestId('axis-input-x').fill('140')
  await row(page, '05-edit-axis-1440.png')
})
