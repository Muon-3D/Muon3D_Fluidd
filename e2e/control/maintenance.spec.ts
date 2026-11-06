/**
 * Maintenance: Health and Bed as tiles. The bed mesh is one heat map (2D) or
 * the 3D surface, chosen on Bed; Calibrate mesh and Accuracy test move the head,
 * so each asks first, and neither works while the printer is printing.
 * G-code is answered and recorded by usePrinter: nothing reaches the shared mock.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const COMMANDS = { BED_MESH_CALIBRATE: {}, PROBE_ACCURACY: {}, SHAPER_CALIBRATE: {}, PROBE_CALIBRATE: {} }

/** An idle, homed M1 that can calibrate and has a probe. */
function idle () {
  const preset = PRESETS.idleHomed()
  return {
    ...preset,
    gcode: { commands: COMMANDS },
    probe: { name: 'probe', last_query: false, last_z_result: 0 },
    configfile: { settings: { ...preset.configfile.settings, probe: { z_offset: -0.018 } } }
  }
}

test('Health is tiles: checks, the bed mesh, calibration, consumables and wear', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/maintenance')
  await expect(page.getByRole('heading', { name: 'Health', level: 1 })).toBeVisible()
  const checks = page.getByTestId('maintenance-checks')
  await expect(checks.getByText('Klipper and Moonraker')).toBeVisible()
  await expect(checks.getByTestId('health-klipper').getByText('OK')).toBeVisible()
  await expect(checks.getByText('Heater sensors')).toBeVisible()
  for (const tid of ['maintenance-mesh', 'maintenance-calibration', 'maintenance-consumables', 'maintenance-wear']) {
    await expect(page.getByTestId(tid)).toBeVisible()
  }
  await expect(page.getByTestId('consumable-nozzle')).toContainText('of 400 h')
})

test('the bed mesh is on Health once, as a small map that opens Bed', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/maintenance')
  await expect(page.getByTestId('mesh-heat')).toHaveCount(1)
  await expect(page.getByTestId('maintenance-mesh').getByText('Spread')).toBeVisible()
  await page.getByRole('link', { name: 'Open bed detail' }).click()
  await expect(page).toHaveURL(/\/tune$/)
  await expect(page.getByRole('heading', { name: 'Bed', level: 1 })).toBeVisible()
  await expect(page.getByText('Mesh and probe for Boxwood · Maintenance')).toBeVisible()
})

test('Bed has a back chevron to Health and Calibrate mesh as its one primary action', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/tune')
  await expect(page.getByTestId('mesh-calibrate')).toBeVisible()
  await expect(page.getByTestId('mesh-calibrate')).toBeEnabled()
  await page.getByTestId('bed-back').click()
  await expect(page).toHaveURL(/\/maintenance$/)
  await expect(page.getByRole('heading', { name: 'Health', level: 1 })).toBeVisible()
})

test('the mesh is a 2D heat map with a scale, and 3D swaps it for the surface and back', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/tune')
  const tile = page.getByTestId('bed-mesh-tile')
  await expect(tile.getByRole('radio', { name: '2D' })).toBeChecked()
  await expect(tile.getByTestId('mesh-heat')).toBeVisible()
  await expect(tile.getByTestId('mesh-scale')).toContainText('mm')
  // The heights are always written on the cells: no Colours/Numbers choice.
  await expect(tile.locator('[role="cell"]').first()).toHaveText(/^-?d+.dd$/)
  await expect(tile.getByRole('radio', { name: 'Numbers' })).toHaveCount(0)
  await expect(tile.getByRole('radio', { name: 'Colours' })).toHaveCount(0)

  await tile.getByRole('radio', { name: '3D' }).click()
  await expect(tile.getByRole('radio', { name: '3D' })).toBeChecked()
  await expect(tile.getByTestId('bed-surface')).toBeVisible()
  await expect(tile.getByTestId('mesh-heat')).toHaveCount(0)

  await tile.getByRole('radio', { name: '2D' }).click()
  await expect(tile.getByTestId('mesh-heat')).toBeVisible()
})

test('with no mesh the bed says it is not levelled, in grey question marks instead of heights', async ({ page, open }) => {
  await usePrinter(page, { ...idle(), bed_mesh: { profile_name: '', probed_matrix: [], mesh_matrix: [] } })
  await open('/tune')
  const tile = page.getByTestId('bed-mesh-tile')
  await expect(tile.getByTestId('mesh-unlevelled').getByText('Bed not levelled')).toBeVisible()
  await expect(tile.getByText('Not levelled', { exact: true })).toBeVisible()
  await expect(tile.getByTestId('mesh-heat')).toHaveCount(0)
  await expect(tile.getByText('?', { exact: true }).first()).toBeVisible()
  await expect(page.getByTestId('mesh-calibrate')).toBeEnabled()
})

test('nothing on Bed says the mesh levels out the first layer', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/tune')
  await expect(page.getByTestId('bedmesh-page')).toBeVisible()
  await expect(page.getByText(/levels? out|evens? out/i)).toHaveCount(0)
})

test('Calibrate mesh asks first: keeping things as they are sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/tune')
  await page.getByTestId('mesh-calibrate').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/touches the plate at every point/)).toBeVisible()
  await page.getByTestId('confirm-cancel').click()
  await expect(dialog).toHaveCount(0)
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
})

test('Health runs calibration only after the same question, and Cancel sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/maintenance')
  await page.getByTestId('cal-run-bedMesh').click()
  await page.getByTestId('confirm-cancel').click()
  await page.getByTestId('cal-run-shaper').click()
  await expect(page.getByRole('dialog').getByText(/shakes the toolhead/)).toBeVisible()
  await page.getByTestId('confirm-cancel').click()
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
})

test('Accuracy test asks first, and Cancel sends nothing; yes goes to the middle of the bed and probes', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/tune')
  await page.getByTestId('probe-accuracy-run').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/probes there ten times/)).toBeVisible()
  await page.getByTestId('confirm-cancel').click()
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])

  await page.getByTestId('probe-accuracy-run').click()
  const plate = page.getByTestId('confirm-plate').getByRole('checkbox')
  if (await plate.count()) await plate.check()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.gcode.length).toBe(1)
  const lines = printer.gcode[0].split('\n')
  expect(lines.at(-1)).toBe('PROBE_ACCURACY')
  // Homed already: no homing, only a move to the middle (lifted first by the no-go path where needed).
  expect(lines.filter(l => !/^(G90|G1 |PROBE_ACCURACY)/.test(l))).toEqual([])
})

test('Query probe sends QUERY_PROBE, which moves nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/tune')
  await page.getByTestId('probe-query').click()
  await expect.poll(() => printer.gcode).toEqual(['QUERY_PROBE'])
})

test('while printing, Calibrate mesh and every Run are off and send nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, { gcode: { commands: COMMANDS }, probe: { name: 'probe', last_query: false } }) // the mock as it is: mid-print
  await open('/tune')
  await expect(page.getByTestId('mesh-calibrate')).toBeDisabled()
  await expect(page.getByTestId('probe-accuracy-run')).toBeDisabled()
  await page.getByTestId('mesh-calibrate').click({ force: true })
  await page.getByTestId('probe-accuracy-run').click({ force: true })
  await expect(page.getByRole('dialog')).toHaveCount(0)

  await open('/maintenance')
  for (const id of ['bedMesh', 'shaper', 'probeAccuracy']) await expect(page.getByTestId(`cal-run-${id}`)).toBeDisabled()
  await expect(page.getByTestId('maintenance-calibration').getByText('Wait until the printer is idle.')).toBeVisible()
  expect(printer.gcode).toEqual([])
})

test('profiles list the active mesh and Load asks nothing it should not', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/tune')
  const row = page.getByTestId('mesh-profiles').locator('[data-profile="default"]')
  await expect(row).toContainText('default')
  await expect(row.getByText('Active')).toBeVisible()
  await expect(page.getByTestId('mesh-profiles').getByRole('button', { name: /Save current/ })).toBeVisible()
})

test('the layout follows the screen: tiles stack on a phone and sit side by side on a desktop', async ({ page, open }, info) => {
  await usePrinter(page, idle())
  await open('/maintenance')
  const checks = (await page.getByTestId('maintenance-checks').boundingBox())!
  const mesh = (await page.getByTestId('maintenance-mesh').boundingBox())!
  if (info.project.name === 'phone') {
    expect(Math.abs(checks.x - mesh.x)).toBeLessThan(2)
    expect(mesh.y).toBeGreaterThan(checks.y + checks.height - 2)
  } else {
    expect(mesh.x).toBeGreaterThan(checks.x + checks.width)
    expect(Math.abs(mesh.y - checks.y)).toBeLessThan(2)
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)

  await open('/tune')
  const mapTile = (await page.getByTestId('bed-mesh-tile').boundingBox())!
  const profiles = (await page.getByTestId('mesh-profiles').boundingBox())!
  expect(profiles.y).toBeGreaterThan(mapTile.y + mapTile.height - 2)
  await expect(page.getByTestId('mesh-calibrate')).toBeVisible()
  const box = (await page.getByTestId('mesh-calibrate').boundingBox())!
  expect(box.x + box.width).toBeLessThanOrEqual(info.project.name === 'phone' ? 390 : 1440)
})
