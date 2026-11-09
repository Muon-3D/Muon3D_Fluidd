/**
 * Maintenance: Health and Bed as tiles. The bed mesh is one heat map (2D) or
 * the 3D surface, chosen on Bed; every run that moves the head or heats asks
 * first, and none works while the printer is printing.
 * G-code is answered and recorded by usePrinter: nothing reaches the shared mock.
 */
import type { Page } from '@playwright/test'
import { test, expect, PRINTER } from '../fixtures'
import { usePrinter, PRESETS, useDatabase } from './printer'

const COMMANDS = { BED_MESH_CALIBRATE: {}, PROBE_ACCURACY: {}, SHAPER_CALIBRATE: {}, PROBE_CALIBRATE: {}, PID_CALIBRATE: {} }

const POINTS = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
const PARAMS = { min_x: 10, max_x: 190, min_y: 10, max_y: 190, x_count: 3, y_count: 3, mesh_x_pps: 2, mesh_y_pps: 2, algo: 'lagrange', tension: 0.2 }

/** An idle, homed M1 that can calibrate and has a probe. */
function idle (position: [number, number, number] = [100, 100, 10]) {
  const preset = PRESETS.idleHomed({ position })
  return {
    ...preset,
    gcode: { commands: COMMANDS },
    // PID_CALIBRATE is the raw fallback, which Klipper#112 allows only in developer mode (KAN-1798).
    muon_guard: { dev_mode: true },
    probe: { name: 'probe', last_query: false, last_z_result: 0 },
    configfile: { settings: { ...preset.configfile.settings, probe: { z_offset: -0.018 } } }
  }
}

/** Answers the question a run asks: ticks the plate check when it is asked, then says yes. */
async function start (page: Page) {
  const plate = page.getByTestId('confirm-plate').getByRole('checkbox')
  if (await plate.count()) await plate.check()
  await page.getByTestId('confirm-ok').click()
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

test('a Health row is absent when its data is missing, not shown as OK', async ({ page, open }) => {
  await usePrinter(page, { ...idle(), heaters: { available_heaters: [] } })
  await open('/maintenance')
  await expect(page.getByTestId('health-klipper')).toBeVisible()
  await expect(page.getByTestId('health-heaters')).toHaveCount(0)
})

test('the Health bed mesh row warns Not levelled when no mesh is loaded', async ({ page, open }) => {
  await usePrinter(page, { ...idle(), bed_mesh: { profile_name: '', probed_matrix: [[]], mesh_matrix: [[]] } })
  await open('/maintenance')
  await expect(page.getByTestId('health-bedMesh')).toContainText('Not levelled')
  await expect(page.getByTestId('maintenance-mesh').getByTestId('mesh-unlevelled')).toBeVisible()
})

test('the bed mesh is on Health once, as a small map with its heights, that opens Bed', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/maintenance')
  await expect(page.getByTestId('mesh-heat')).toHaveCount(1)
  await expect(page.getByTestId('maintenance-mesh').locator('[role="cell"]').first()).toHaveText(/^-?\d+\.\d\d$/)
  await expect(page.getByTestId('maintenance-mesh').getByText('Spread')).toBeVisible()
  await page.getByRole('link', { name: 'Open bed detail' }).click()
  await expect(page).toHaveURL(/\/tune$/)
  await expect(page.getByRole('heading', { name: 'Bed', level: 1 })).toBeVisible()
  await expect(page.getByText('Mesh and probe for Boxwood · Maintenance')).toBeVisible()
})

test('Bed is also one tap away from the Health header', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/maintenance')
  await page.getByTestId('maintenance-actions').getByRole('radio', { name: 'Bed' }).click()
  await expect(page).toHaveURL(/\/tune$/)
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

test('Calibrate mesh is off, with the reason, on a printer that cannot run it', async ({ page, open }) => {
  await usePrinter(page, { ...idle(), gcode: { commands: { PROBE_ACCURACY: {} } } })
  await open('/tune')
  await expect(page.getByTestId('mesh-calibrate')).toBeDisabled()
})

test('the mesh is a 2D heat map with heights and a scale, and 3D swaps it for the surface and back', async ({ page, open }) => {
  await usePrinter(page, idle())
  await open('/tune')
  const tile = page.getByTestId('bed-mesh-tile')
  await expect(tile.getByRole('radio', { name: '2D' })).toBeChecked()
  await expect(tile.getByTestId('mesh-heat')).toBeVisible()
  await expect(tile.getByTestId('mesh-scale')).toContainText('mm')
  // The heights are always written on the cells: no Colours/Numbers choice.
  await expect(tile.locator('[role="cell"]').first()).toHaveText(/^-?\d+\.\d\d$/)
  await expect(tile.getByRole('radio', { name: 'Numbers' })).toHaveCount(0)
  await expect(tile.getByRole('radio', { name: 'Colours' })).toHaveCount(0)

  await tile.getByRole('radio', { name: '3D' }).click()
  await expect(tile.getByRole('radio', { name: '3D' })).toBeChecked()
  await expect(tile.getByTestId('bed-surface')).toBeVisible()
  await expect(tile.getByTestId('mesh-heat')).toHaveCount(0)

  await tile.getByRole('radio', { name: '2D' }).click()
  await expect(tile.getByTestId('mesh-heat')).toBeVisible()
})

// KAN-1627: echarts-gl drew the 3D axis numbers white whatever the theme, so on
// light they vanished into the card. They now take the theme's muted text token.
test('the 3D mesh labels its axes in the theme text colour, light and dark', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await useDatabase(page, printer)
  const axisColours = () => page.getByTestId('bed-surface').locator('.echarts').evaluate((el: any) => {
    const option = el.__vue__.getOption()
    return ['xAxis3D', 'yAxis3D', 'zAxis3D'].map(axis => option[axis][0].axisLabel.color)
  })
  for (const [theme, muted] of [['Light', '#6e6e73'], ['Dark', '#98989d']]) {
    await open(`${PRINTER}/settings#theme`)
    await page.getByTestId('theme-settings').getByRole('radio', { name: theme }).click()
    await open('/tune')
    const tile = page.getByTestId('bed-mesh-tile')
    await tile.getByRole('radio', { name: '3D' }).click()
    await expect(tile.getByTestId('bed-surface')).toBeVisible()
    await expect.poll(axisColours).toEqual([muted, muted, muted])
  }
})

test('the back row of the plate is at the top and X runs left to right', async ({ page, open }) => {
  await usePrinter(page, { ...idle(), bed_mesh: { probed_matrix: [[0.01, 0.02, 0.03], [0.04, 0.05, 0.06], [0.07, 0.08, 0.09]] } })
  await open('/tune')
  // Klipper's first row is the lowest Y: the back of the plate, drawn first.
  await expect(page.getByTestId('bed-mesh-tile').locator('[role="cell"]')).toHaveText(['0.01', '0.02', '0.03', '0.04', '0.05', '0.06', '0.07', '0.08', '0.09'])
})

// Klipper reports a cleared or never-loaded mesh as one empty row, not as none.
for (const empty of [[[]], []]) {
  test(`with no mesh (${JSON.stringify(empty)}) the bed says it is not levelled, in grey question marks`, async ({ page, open }) => {
    await usePrinter(page, { ...idle(), bed_mesh: { profile_name: '', probed_matrix: empty, mesh_matrix: empty } })
    await open('/tune')
    const tile = page.getByTestId('bed-mesh-tile')
    await expect(tile.getByTestId('mesh-unlevelled').getByText('Bed not levelled')).toBeVisible()
    await expect(tile.getByText('Not levelled', { exact: true })).toBeVisible()
    await expect(tile.getByText('Not loaded')).toHaveCount(0)
    await expect(tile.getByTestId('mesh-heat')).toHaveCount(0)
    await expect(tile.getByText('?', { exact: true }).first()).toBeVisible()
    await expect(page.getByTestId('mesh-calibrate')).toBeEnabled()
  })
}

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
  await expect(page.getByTestId('confirm-message')).toContainText('touches the plate at every point')
  await page.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
})

test('Calibrate mesh, after Start, sends BED_MESH_CALIBRATE and nothing else (the printer is homed)', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/tune')
  await page.getByTestId('mesh-calibrate').click()
  await start(page)
  await expect.poll(() => printer.gcode).toEqual(['BED_MESH_CALIBRATE'])
})

test('Health runs calibration only after a question named for its row, and Cancel sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/maintenance')
  await page.getByTestId('cal-run-bedMesh').click()
  await expect(page.getByTestId('confirm')).toContainText('Bed mesh calibrate')
  await page.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  await page.getByTestId('cal-run-shaper').click()
  await expect(page.getByTestId('confirm')).toContainText('Resonance test')
  await expect(page.getByTestId('confirm-message')).toContainText('shakes the toolhead')
  await page.getByTestId('confirm-cancel').click()
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
})

const RUNS: Array<[string, string, string | RegExp]> = [
  ['bedMesh', 'Bed mesh calibrate', 'BED_MESH_CALIBRATE'],
  ['shaper', 'Resonance test', 'SHAPER_CALIBRATE'],
  ['firstLayer', 'First layer height', 'PROBE_CALIBRATE'],
  ['pid', 'Heater tuning', /^PID_CALIBRATE HEATER=extruder TARGET=\d+$/]
]
for (const [id, name, script] of RUNS) {
  test(`${name}: Run, then Start, sends exactly its G-code`, async ({ page, open }) => {
    const printer = await usePrinter(page, idle())
    await open('/maintenance')
    await page.getByTestId(`cal-run-${id}`).click()
    await expect(page.getByTestId('confirm')).toContainText(name)
    await start(page)
    await expect.poll(() => printer.gcode.length).toBe(1)
    if (typeof script === 'string') expect(printer.gcode).toEqual([script])
    else expect(printer.gcode[0]).toMatch(script)
  })
}

test('Accuracy test asks first, and Cancel sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/tune')
  await page.getByTestId('probe-accuracy-run').click()
  await expect(page.getByTestId('confirm')).toContainText('Probe accuracy')
  await expect(page.getByTestId('confirm-message')).toContainText('probes there ten times')
  await page.getByTestId('confirm-cancel').click()
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
})

test('Accuracy test, from a head already high enough, goes to the middle of the bed (X100 Y100) and probes, with no lift', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([100, 100, 10]))
  await open('/tune')
  await page.getByTestId('probe-accuracy-run').click()
  await expect(page.getByTestId('confirm-message')).toContainText('X100 Y100')
  await start(page)
  await expect.poll(() => printer.gcode).toEqual(['G90\nG1 X100 Y100 F6000\nPROBE_ACCURACY'])
})

test('Accuracy test, from a head below the notch crossing height, lifts to it first, in G-code Z', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([60, 40, 1]))
  await open('/tune')
  await page.getByTestId('probe-accuracy-run').click()
  await start(page)
  await expect.poll(() => printer.gcode.length).toBe(1)
  const lines = printer.gcode[0].split('\n')
  // The notch must be crossed at 6 mm plus the mesh's spread.
  expect(lines[0]).toBe('G90')
  const lift = /^G1 Z(\d+(?:\.\d+)?) F600$/.exec(lines[1])
  expect(lift).not.toBeNull()
  expect(Number(lift![1])).toBeGreaterThanOrEqual(6)
  expect(Number(lift![1])).toBeLessThan(7)
  expect(lines.slice(2)).toEqual(['G1 X100 Y100 F6000', 'PROBE_ACCURACY'])
})

test('Query probe sends QUERY_PROBE, which moves nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, idle())
  await open('/tune')
  await page.getByTestId('probe-query').click()
  await expect.poll(() => printer.gcode).toEqual(['QUERY_PROBE'])
})

test('while printing, Calibrate mesh and every Run are off and send nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, { gcode: { commands: COMMANDS }, muon_guard: { dev_mode: true }, probe: { name: 'probe', last_query: false } }) // the mock as it is: mid-print
  await open('/tune')
  await expect(page.getByTestId('mesh-calibrate')).toBeDisabled()
  await expect(page.getByTestId('probe-accuracy-run')).toBeDisabled()
  await page.getByTestId('mesh-calibrate').click({ force: true })
  await page.getByTestId('probe-accuracy-run').click({ force: true })
  await expect(page.getByTestId('confirm')).toHaveCount(0)

  await open('/maintenance')
  for (const id of ['bedMesh', 'shaper', 'firstLayer', 'pid', 'probeAccuracy']) await expect(page.getByTestId(`cal-run-${id}`)).toBeDisabled()
  await expect(page.getByTestId('maintenance-calibration').getByText('Wait until the printer is idle.')).toBeVisible()
  expect(printer.gcode).toEqual([])
})

/** A printer with the default mesh in use and a saved one called cold. */
function withProfiles () {
  return { ...idle(), bed_mesh: { profile_name: 'default', profiles: { cold: { points: POINTS, mesh_params: PARAMS } } } }
}

test('Profiles: the active mesh is marked, and Load, Remove, Save current and Clear each send the right command', async ({ page, open }) => {
  const printer = await usePrinter(page, withProfiles())
  await open('/tune')
  const profiles = page.getByTestId('mesh-profiles')
  await expect(profiles.locator('[data-profile="default"]').getByText('Active')).toBeVisible()
  await expect(profiles.locator('[data-profile="cold"]')).toContainText('0.000 mm spread')

  await profiles.getByRole('button', { name: 'Load cold' }).click()
  await expect.poll(() => printer.gcode).toEqual(['BED_MESH_PROFILE LOAD="cold"'])

  await profiles.getByRole('button', { name: 'Remove cold' }).click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printer.gcode.at(-1)).toBe('BED_MESH_PROFILE REMOVE="cold"')

  await profiles.getByRole('button', { name: /Save current/ }).click()
  await page.getByTestId('file-name-input').fill('hot-bed')
  await page.getByTestId('file-name-save').click()
  await expect.poll(() => printer.gcode.at(-1)).toBe('BED_MESH_PROFILE SAVE="hot-bed"')

  await profiles.getByTestId('mesh-clear').click()
  await expect.poll(() => printer.gcode.at(-1)).toBe('BED_MESH_CLEAR')
  expect(printer.gcode).toHaveLength(4)
})

test('Remove asks first: keeping the profile sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, withProfiles())
  await open('/tune')
  await page.getByTestId('mesh-profiles').getByRole('button', { name: 'Remove cold' }).click()
  await page.getByTestId('confirm-cancel').click()
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
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
