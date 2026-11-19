/**
 * I-542: screenshots of the Overview mockup (status line, trackpad + Quick commands, Jog + Lighting).
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
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })

const STATE = {
  fan_modes: { mode: 'normal', modes: ['quiet', 'normal', 'turbo'] },
  'gcode_macro LED_MODE': { mode: 'solid', h: 30, h2: 240, bright: 80, speed: 55 },
  extruder: { temperature: 214.8, target: 220 },
  heater_bed: { temperature: 59.6, target: 60 }
}

async function show (page: Page, open: (p: string) => Promise<void>, homed = 'xyz') {
  const printer = await usePrinter(page, overlay(PRESETS.idleHomed({ position: [112.5, 86, 24.5], homed }), STATE), { ticks: false })
  printer.state.results['printer.gcode.help'] = { SET_PRINT_MODE: 'Select the print mode', LED_MODE: 'LEDs', M84: 'Motors off' }
  await open('/')
  await expect(page.locator('[data-tile="statusline"]')).toBeVisible()
  await expect(page.locator('[data-tile="trackpad"]')).toBeVisible()
  await page.waitForTimeout(2500)
  return printer
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
  await page.screenshot({ path: `${OUT}/04-not-homed-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } })
})

test('axis box in edit mode', async ({ page, open, isMobile }) => {
  test.skip(isMobile)
  await show(page, open)
  await page.getByTestId('axis-edit-x').click()
  await page.getByTestId('axis-input-x').fill('140')
  await page.screenshot({ path: `${OUT}/05-edit-axis-1440.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } })
})
