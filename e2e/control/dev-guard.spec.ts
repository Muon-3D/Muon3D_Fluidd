/**
 * Klipper#112 only lets certain commands through in developer mode, so Control
 * does not offer them outside it. The one reachable on a page today is the raw
 * PID_CALIBRATE that Maintenance falls back to when a printer has no tuning
 * macro of its own (the M1 has CALIBRATE_HEATING_HOTEND and never needs it).
 * The toolhead widgets (FORCE_MOVE, ACTIVATE_EXTRUDER, SET_STEPPER_ENABLE) are
 * on no route in Control v3, so they are covered by component tests.
 *
 * The printer reports developer mode as `muon_guard.dev_mode`.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const RAW_PID = { 'printer.gcode.help': { G28: 'Home', BED_MESH_CALIBRATE: 'Probe the bed', PID_CALIBRATE: 'Calibrate a heater' } }
const M1_PID = { 'printer.gcode.help': { G28: 'Home', PID_CALIBRATE: 'Calibrate a heater', CALIBRATE_HEATING_HOTEND: 'Tune the hotend' } }
const MUON = ['file_manager', 'muon_protection']

async function withPrinter (page: import('@playwright/test').Page, status: Record<string, unknown>, answer: Record<string, unknown>, components = MUON) {
  const printer = await usePrinter(page, { ...PRESETS.idleHomed(), ...status }, { components })
  Object.assign(printer.state.answer, answer)
  return printer
}

const pidRow = (page: import('@playwright/test').Page) => page.locator('[data-tid="cal-run-pid"]')

test('outside developer mode a printer with only PID_CALIBRATE is not offered heater tuning', async ({ page, open }) => {
  const printer = await withPrinter(page, { muon_guard: { dev_mode: false } }, RAW_PID)
  await open('/maintenance')
  // The other checks are there, so the page has loaded and the missing row is the gate's doing.
  await expect(page.locator('[data-tid="cal-run-bedMesh"]')).toBeVisible()
  await expect(pidRow(page)).toHaveCount(0)
  expect(printer.gcode.join('\n')).not.toContain('PID_CALIBRATE')
})

test('in developer mode the PID_CALIBRATE fallback is offered', async ({ page, open }) => {
  await withPrinter(page, { muon_guard: { dev_mode: true } }, RAW_PID)
  await open('/maintenance')
  await expect(pidRow(page)).toBeVisible()
})

test('a printer that is not a Muon keeps the fallback', async ({ page, open }) => {
  await withPrinter(page, {}, RAW_PID, ['file_manager', 'update_manager'])
  await open('/maintenance')
  await expect(pidRow(page)).toBeVisible()
})

test('the M1 keeps its own tuning macro outside developer mode and never runs PID_CALIBRATE', async ({ page, open }) => {
  const printer = await withPrinter(page, { muon_guard: { dev_mode: false } }, M1_PID)
  await open('/maintenance')
  await expect(pidRow(page)).toBeVisible()
  await pidRow(page).click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.gcode.length).toBe(1)
  expect(printer.gcode).toEqual(['CALIBRATE_HEATING_HOTEND'])
})
