/**
 * Control and Overview, 10 Nov 2026 (Jack's 6 Nov notes, JACK-FEEDBACK-1106):
 * - FM-04 (KAN-1712, KAN-1965): one filament section on both pages. The ring,
 *   the icon and the text open the one material panel; so does ⋯ on Overview.
 * - CT-08 (KAN-1967): Extrude by hand heats for you, to an editable temperature.
 * - CT-09 (KAN-1698, KAN-1714): a sparkline beside each temperature.
 * - CT-07 (KAN-1976): speed, flow and the part fan together in Print mode.
 * - FM-07 (KAN-1697): a jump to Health opens "Switches and sensors".
 * - FM-05 guard (KAN-1964): idle Change filament sends nothing, on both pages.
 */
import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { overlay, usePrinter, PRESETS, type PrinterHandle } from './printer'

// The photoreal M1 stalls software WebGL for seconds a frame (see overview-parts.spec.ts).
test.beforeEach(async ({ page }) => {
  if (process.platform !== 'win32') await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

const M1_MACROS = {
  'gcode_macro M600': {},
  'gcode_macro LOAD_FILAMENT': {},
  'gcode_macro UNLOAD_FILAMENT': {},
  configfile: {
    settings: {
      'gcode_macro m600': { gcode: 'PAUSE' },
      'gcode_macro load_filament': { gcode: 'FILAMENT_INSERT_FLOW {rawparams}' },
      'gcode_macro unload_filament': { gcode: 'G1 E-30 F3600' }
    }
  }
}

/** Idle and homed, with a cold nozzle and the M1's filament macros. */
const idle = (extra: Record<string, unknown> = {}) => overlay(overlay(PRESETS.idleHomed(), M1_MACROS), {
  extruder: { temperature: 24, target: 0, can_extrude: false },
  ...extra
})

const SENSOR = 'filament_switch_sensor runout'
const withSensor = () => idle({ [SENSOR]: { filament_detected: true, enabled: true }, configfile: { settings: { [SENSOR]: { pause_on_runout: 'True' } } } })

/** Anything that would heat, move or energise: a G-code script, an emergency stop, a restart. */
const motorOrGcode = (printer: PrinterHandle) => printer.calls.filter(c => /^printer\.(gcode\.script|emergency_stop|restart|firmware_restart|print\.)|^machine\.(reboot|services)/.test(c.method))

async function isThePanel (page: Page, printer: PrinterHandle, close = true) {
  const panel = page.getByTestId('material-picker')
  await expect(panel).toBeVisible()
  await expect(page.getByTestId('material-load')).toBeVisible()
  await expect(page.getByTestId('material-unload')).toBeVisible()
  await page.waitForTimeout(250)
  expect(printer.gcode).toEqual([])
  if (!close) return
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
}

for (const where of [{ name: 'Overview', path: '/', card: '[data-tile="filament"]' }, { name: 'Control', path: '/control', card: '[data-tid="control-filament"]' }]) {
  test(`${where.name}: the ring, the icon and the text each open the one material panel`, async ({ page, open }) => {
    const printer = await usePrinter(page, idle())
    await open(where.path)
    const section = page.locator(where.card).getByTestId('filament-section')
    // The ring (the swatch), the spool icon inside it, and the text ("PLA · Blue").
    const targets = [
      section.getByTestId('filament-swatch'),
      section.getByTestId('filament-swatch').locator('svg').first(),
      section.getByTestId('filament-type'),
      section.getByTestId('filament-detail')
    ]
    for (const target of targets) {
      await target.click({ force: true })
      await isThePanel(page, printer)
    }
  })

  test(`${where.name}: idle Change filament opens the panel and sends no G-code or motor command`, async ({ page, open }) => {
    const printer = await usePrinter(page, idle())
    await open(where.path)
    const tid = where.path === '/' ? 'overview-change-filament' : 'change-filament'
    await page.getByTestId(tid).click()
    await expect(page.getByTestId('material-picker')).toBeVisible()
    await page.waitForTimeout(500)
    expect(printer.gcode).toEqual([])
    expect(motorOrGcode(printer)).toEqual([])
  })
}

test('Overview: ⋯ Set material and colour opens the same panel', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/')
  await page.getByRole('button', { name: 'More for Filament' }).click()
  await page.getByRole('menuitem', { name: /Set material and colour/ }).click()
  await isThePanel(page, printer, false)
})

test('Overview and Control show the same filament section: Change filament, Load, Unload', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/')
  const tile = page.locator('[data-tile="filament"]')
  await expect(tile.getByTestId('overview-change-filament')).toHaveText('Change filament')
  await expect(tile.getByTestId('overview-load-filament')).toBeVisible()
  await expect(tile.getByTestId('overview-unload-filament')).toBeVisible()
  await open('/control')
  const card = page.getByTestId('control-filament')
  await expect(card.getByTestId('change-filament')).toHaveText('Change filament')
  await expect(card.getByTestId('load-filament')).toBeVisible()
  await expect(card.getByTestId('unload-filament')).toBeVisible()
  await expect(card.getByText('Extrude by hand')).toBeVisible()
  await expect(tile).toHaveCount(0)
})

test('Extrude by hand: Heat sets the nozzle for the material, the temperature can be changed, and nothing extrudes', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  const card = page.getByTestId('control-filament')
  await card.getByRole('button', { name: /Extrude by hand/ }).click()
  await expect(card).not.toContainText(/heat the nozzle first/i)
  await expect(card.getByTestId('extrude-reason')).toContainText('Press Heat')
  const temp = card.getByRole('textbox', { name: 'Extrude temperature' }).or(card.getByLabel('Extrude temperature')).first()
  const first = Number(await temp.inputValue())
  expect(first).toBeGreaterThanOrEqual(170)
  await card.getByTestId('extrude-heat').click()
  await expect.poll(() => printer.gcode).toEqual([`SET_HEATER_TEMPERATURE HEATER=extruder TARGET=${first}`])
  await temp.fill('232')
  await temp.press('Enter')
  await card.getByTestId('extrude-heat').click()
  await expect.poll(() => printer.gcode.length).toBe(2)
  expect(printer.gcode[1]).toBe('SET_HEATER_TEMPERATURE HEATER=extruder TARGET=232')
  expect(printer.gcode.join('\n')).not.toMatch(/G1 E|M83/)
})

test('Heaters: each temperature has a sparkline from the graph\'s history', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/control')
  const heat = page.getByTestId('control-heat')
  await expect(heat.getByTestId('heat-now').first()).toBeVisible()
  await expect(heat.locator('[data-tid="heater-spark"][data-series="extruder"]')).toHaveAttribute('data-state', 'line')
  await expect(heat.locator('[data-tid="heater-spark"][data-series="heater_bed"]')).toHaveAttribute('data-state', 'line')
  const size = await heat.getByTestId('heat-now').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))
  expect(size).toBeGreaterThanOrEqual(18)
  // Overview's Hotend and Bed widgets are small (S) by default; their sparkline is at M (HeaterTile.spec.ts).
})

test('Heaters: with no history yet the sparkline is an empty line and the temperature still shows', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  printer.state.failOn['server.temperature_store'] = 'no history'
  await open('/control')
  const heat = page.getByTestId('control-heat')
  await expect(heat.getByTestId('heat-now').first()).toHaveText(/\d+\.\d°/)
  await expect(heat.locator('[data-tid="heater-spark"][data-series="extruder"]')).toHaveAttribute('data-state', 'empty')
})

test('Print mode: speed, flow and the part fan are adjusted together', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/control')
  const tile = page.getByTestId('control-printmode')
  await expect(tile.getByText('Speed, flow and fans')).toBeVisible()
  await expect(page.getByTestId('advanced-summary')).toContainText('Fan 80%')
  await page.getByTestId('advanced-toggle').click()
  for (const tid of ['advanced-speed', 'advanced-flow', 'advanced-fan']) await expect(page.getByTestId(tid)).toBeVisible()
  await page.getByTestId('advanced-fan').evaluate(el => {
    const input = (el.matches('input') ? el : el.querySelector('input')) as HTMLInputElement
    input.value = '40'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect.poll(() => printer.gcode).toContain('M106 S102')
})

test('Quick commands: the link says "All commands", with no number', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/control')
  const all = page.getByTestId('quick-all')
  if (await all.count()) await expect(all).toHaveText('All commands')
  await expect(page.getByTestId('control-quick')).not.toContainText(/All \d+/)
})

test('Overview ⋯ Filament sensors opens Health with "Switches and sensors" open', async ({ page, open }) => {
  await usePrinter(page, withSensor())
  await open('/')
  await page.getByRole('button', { name: 'More for Filament' }).click()
  await page.getByRole('menuitem', { name: /Filament sensors/ }).click()
  await expect(page).toHaveURL(/\/maintenance\?sensors=open/)
  await expect(page.getByRole('button', { name: /Switches and sensors/ })).toHaveAttribute('aria-expanded', 'true')
})

test('Control: the sensor sits beside Load and Unload, and its link opens "Switches and sensors"', async ({ page, open }) => {
  await usePrinter(page, withSensor())
  await open('/control')
  const card = page.getByTestId('control-filament')
  await expect(card.getByTestId('filament-sensor')).toContainText('Runout')
  await card.getByTestId('filament-sensors-link').click()
  await expect(page).toHaveURL(/\/maintenance\?sensors=open/)
  await expect(page.getByRole('button', { name: /Switches and sensors/ })).toHaveAttribute('aria-expanded', 'true')
})

test('Health opened plainly keeps "Switches and sensors" folded', async ({ page, open }) => {
  await usePrinter(page, withSensor())
  await open('/maintenance')
  await expect(page.getByRole('button', { name: /Switches and sensors/ })).toHaveAttribute('aria-expanded', 'false')
})
