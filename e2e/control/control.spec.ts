/**
 * Control (v4): Movement (trackpad with live drag, fine jog, position and Go
 * to, homing), Print mode with Advanced, and Quick commands.
 *
 * Every move goes through the planner: a tap only picks a spot and Move here
 * sends it; a drag has the head follow, one planned move at a time, held
 * until the printer reports the last one landed. The page's G-code is
 * answered and recorded by usePrinter, so nothing reaches the shared mock
 * printer, and each test asserts the exact G-code sent.
 */
import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'

type Json = Record<string, any>

/** A homed, idle M1 on a 200 × 200 bed, so a spot on the trackpad is easy to name. */
function idle (position: [number, number, number], homed = 'xyz', extra: Json = {}): Json {
  const status = PRESETS.idleHomed({ position, homed })
  status.toolhead = { ...status.toolhead, axis_minimum: [0, 0, 0, 0], axis_maximum: [200, 200, 160, 0] }
  return { ...status, ...extra }
}

const BED = 200
const tenth = (v: number) => Math.round(v * 10) / 10
const START = 'SAVE_GCODE_STATE NAME=_ui_movement\nG90\n'
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\n/g, '\\n')
const END = '\nRESTORE_GCODE_STATE NAME=_ui_movement'

async function padBox (page: Page) {
  const pad = page.getByTestId('move-trackpad')
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  if (!box) throw new Error('no trackpad')
  return box
}

/**
 * Tap the trackpad over a bed spot (mm), at a whole pixel, and work out in
 * the test which spot that pixel is. Y grows toward the front on the M1, so
 * Y 0 is the top edge.
 */
async function tap (page: Page, x: number, y: number): Promise<{ x: number, y: number }> {
  const box = await padBox(page)
  const px = Math.round(box.x + box.width * x / BED)
  const py = Math.round(box.y + box.height * y / BED)
  await page.mouse.click(px, py)
  return { x: tenth((px - box.x) / box.width * BED), y: tenth((py - box.y) / box.height * BED) }
}

/** Press on a bed spot and drag through `path` (bed mm), a few pixels a step; the button stays down. */
async function dragThrough (page: Page, from: [number, number], path: Array<[number, number]>) {
  const box = await padBox(page)
  const at = (p: [number, number]) => [box.x + box.width * p[0] / BED, box.y + box.height * p[1] / BED] as const
  await page.mouse.move(...at(from))
  await page.mouse.down()
  for (const p of path) await page.mouse.move(...at(p), { steps: 3 })
}

/** Points along a straight line, inclusive of the end. */
const line = (a: [number, number], b: [number, number], n: number): Array<[number, number]> =>
  Array.from({ length: n }, (_, i) => [a[0] + (b[0] - a[0]) * (i + 1) / n, a[1] + (b[1] - a[1]) * (i + 1) / n])

/** The XY of a G1 line. */
function xyOf (l: string): { x: number, y: number } {
  const m = /^G1 X([\d.]+) Y([\d.]+) F7800$/.exec(l)
  if (!m) throw new Error(`not one XY move: ${l}`)
  return { x: Number(m[1]), y: Number(m[2]) }
}

/** The printer reports the head arrived where the last move sent it (lock released). */
function arrive (printer: PrinterHandle, z: number, base: Json = {}) {
  const last = printer.moves().map(l => /X([\d.]+) Y([\d.]+)/.exec(l)).filter(Boolean).pop()
  if (!last) throw new Error('nothing sent yet')
  const x = Number(last[1])
  const y = Number(last[2])
  printer.report(idle([x, y, z], 'xyz', base))
}

test.describe('Movement', () => {
  test('the page is the v4 tiles, and the bed and notch are drawn to scale from the config', async ({ page, open }) => {
    await usePrinter(page, idle([150, 100, 10]))
    await open('/control')
    for (const tid of ['control-move', 'control-heat', 'control-printmode', 'control-filament', 'control-quick']) {
      await expect(page.getByTestId(tid)).toBeVisible()
    }
    await expect(page.getByTestId('control-move').getByText('Homed', { exact: true })).toBeVisible()
    const box = await padBox(page)
    expect(Math.abs(box.width / box.height - 1)).toBeLessThan(0.02)
    const notch = await page.getByTestId('trackpad-notch').boundingBox()
    if (!notch) throw new Error('no notch drawn')
    // x 75–125 on the Y=0 edge, which is the top (the back) as the jog keys say: Y− is up.
    expect(Math.abs((notch.x - box.x) / box.width * BED - 75)).toBeLessThan(1)
    expect(Math.abs(notch.width / box.width * BED - 50)).toBeLessThan(1)
    expect(Math.abs(notch.y - box.y)).toBeLessThan(1)
    expect(Math.abs(notch.height / box.height * BED - 34)).toBeLessThan(1)
    await expect(page.getByRole('button', { name: 'Head back (Y−)' })).toBeVisible()
  })

  test('the jog pad centre is an inert dot; Z+ and Z− are split by the live Z readout and named for the plate', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([150, 100, 10]))
    await open('/control')
    const dot = page.getByTestId('jog-centre')
    await expect(dot).toBeVisible()
    await dot.click({ force: true })
    const up = page.getByTestId('jog-z-up')
    const down = page.getByTestId('jog-z-down')
    await expect(up).toHaveText('Plate up')
    await expect(up).toHaveAttribute('title', 'Z+')
    await expect(down).toHaveText('Plate down')
    const between = page.getByTestId('control-move').locator('.move__zcol').getByTestId('pos-z')
    await expect(between).toHaveText(/10\.00/)
    const u = await up.boundingBox()
    const d = await down.boundingBox()
    if (!u || !d) throw new Error('no Z keys')
    expect(d.y - (u.y + u.height)).toBeGreaterThan(60)
    await page.waitForTimeout(300)
    expect(printer.gcode).toEqual([])
    await up.click()
    await expect.poll(() => printer.gcode).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 Z10 F600\nRESTORE_GCODE_STATE NAME=_ui_movement'])
  })

  test('a tap picks a spot and sends nothing; Move here sends one planned move', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([150, 100, 10]))
    await open('/control')
    const spot = await tap(page, 160, 150)
    await expect(page.getByTestId('trackpad-target')).toBeVisible()
    await expect(page.getByTestId('trackpad-line')).toBeVisible()
    await expect(page.getByTestId('trackpad-note')).toHaveText('Straight there, at Z 10.00')
    await page.waitForTimeout(400)
    expect(printer.gcode).toEqual([])

    await page.getByTestId('trackpad-move').click()
    await expect.poll(() => printer.gcode.length).toBe(1)
    expect(printer.gcode[0]).toBe(`${START}G1 X${spot.x} Y${spot.y} F7800${END}`)
    await expect(page.getByTestId('trackpad-target')).toHaveCount(0)
  })

  test('a path across the notch lifts, crosses and comes back down', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([60, 20, 1]))
    await open('/control')
    const spot = await tap(page, 140, 20)
    await expect(page.getByTestId('trackpad-note')).toHaveText(/Lifts to Z 6/)
    await page.getByTestId('trackpad-move').click()
    await expect.poll(() => printer.gcode.length).toBe(1)
    // The crossing height is the traverse Z plus the active mesh's spread: 6 and a bit.
    expect(printer.gcode[0]).toMatch(new RegExp(`^${esc(START)}G1 Z6(\\.\\d+)? F600\\nG1 X${spot.x} Y${spot.y} F7800\\nG1 Z1 F600${esc(END)}$`))
  })

  test('a target inside the notch at low Z is refused, says why, and sends nothing', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([60, 100, 1]))
    await open('/control')
    await tap(page, 100, 15)
    await expect(page.getByTestId('trackpad-note')).toHaveText(/over the bed notch/)
    await expect(page.getByTestId('trackpad-move')).toBeDisabled()
    await page.waitForTimeout(300)
    expect(printer.gcode).toEqual([])
  })

  test('a drag shows the marker and the line, and the head follows: one move in flight, the last point on release', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([100, 100, 10]))
    await open('/control')
    await dragThrough(page, [100, 100], line([100, 100], [160, 140], 12))
    await expect(page.getByTestId('trackpad-target')).toBeVisible()
    await expect(page.getByTestId('trackpad-line')).toBeVisible()
    await expect(page.getByTestId('trackpad-note')).toHaveText('Following the drag…')
    // The first point went at once; the rest wait for it to land (nothing queues up).
    await expect.poll(() => printer.moves().length).toBe(1)
    await page.waitForTimeout(500)
    expect(printer.moves()).toHaveLength(1)
    await page.mouse.up()
    arrive(printer, 10)
    await expect.poll(() => printer.moves().length).toBe(2)
    const last = xyOf(printer.moves()[1])
    expect(Math.abs(last.x - 160)).toBeLessThanOrEqual(1)
    expect(Math.abs(last.y - 140)).toBeLessThanOrEqual(1)
    // Each is one planned absolute move, never a raw relative one.
    for (const g of printer.gcode) expect(g).toMatch(/^SAVE_GCODE_STATE NAME=_ui_movement\nG90\nG1 X[\d.]+ Y[\d.]+ F7800\nRESTORE_GCODE_STATE NAME=_ui_movement$/)
    arrive(printer, 10)
    await page.waitForTimeout(600)
    expect(printer.moves()).toHaveLength(2)
  })

  test('a long drag with the head keeping up sends a bounded number of moves', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([40, 100, 10]))
    await open('/control')
    // The printer reports each move landed as soon as it is sent.
    const sent = { n: 0 }
    const timer = setInterval(() => {
      if (printer.moves().length > sent.n) { sent.n = printer.moves().length; arrive(printer, 10) }
    }, 20)
    try {
      await dragThrough(page, [40, 100], line([40, 100], [180, 100], 40))
      await page.mouse.up()
      // The final point goes once the move before it lands.
      const lastX = () => { const m = printer.moves(); return m.length ? xyOf(m[m.length - 1]).x : 0 }
      await expect.poll(lastX, { timeout: 30_000 }).toBeGreaterThan(179)
      await page.waitForTimeout(500)
    } finally { clearInterval(timer) }
    const n = printer.moves().length
    expect(n).toBeGreaterThan(1)
    // Rate-capped at one per 150 ms, whatever the pointer does.
    expect(n).toBeLessThanOrEqual(40)
    const lines = printer.moves()
    for (let i = 1; i < lines.length; i++) expect(lines[i]).not.toBe(lines[i - 1])
    expect(Math.abs(xyOf(lines[lines.length - 1]).x - 180)).toBeLessThanOrEqual(1)
  })

  test('a drag across the notch low down lifts, crosses and lowers', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([50, 20, 1]))
    await open('/control')
    await dragThrough(page, [50, 20], line([50, 20], [58, 20], 2))
    await expect.poll(() => printer.gcode.length).toBe(1)
    // Across the notch while the first move is in flight, then it lands.
    const box = await padBox(page)
    for (const p of line([58, 20], [150, 20], 6)) await page.mouse.move(box.x + box.width * p[0] / BED, box.y + box.height * p[1] / BED)
    arrive(printer, 1)
    await expect.poll(() => printer.gcode.length).toBe(2)
    expect(printer.gcode[1]).toMatch(/^SAVE_GCODE_STATE NAME=_ui_movement\nG90\nG1 Z6(\.\d+)? F600\nG1 X1[45]\d(\.\d)? Y20 F7800\nG1 Z1 F600\nRESTORE_GCODE_STATE NAME=_ui_movement$/)
    await page.mouse.up()
  })

  test('a drag that ends in the notch low down stops following, says why, and sends nothing more', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([60, 100, 1]))
    await open('/control')
    await dragThrough(page, [60, 100], line([60, 100], [68, 100], 2))
    await expect.poll(() => printer.gcode.length).toBe(1)
    const box = await padBox(page)
    for (const p of line([68, 100], [100, 15], 8)) await page.mouse.move(box.x + box.width * p[0] / BED, box.y + box.height * p[1] / BED)
    arrive(printer, 1)
    await expect(page.getByTestId('trackpad-note')).toHaveText(/Stopped following\. That spot is over the bed notch/)
    // Out again, and let go: nothing more.
    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8)
    await page.mouse.up()
    await page.waitForTimeout(700)
    expect(printer.gcode).toHaveLength(1)
  })

  test('pointer-cancel stops a drag at once and nothing more is sent', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([100, 100, 10]))
    await open('/control')
    await dragThrough(page, [100, 100], line([100, 100], [130, 100], 6))
    await expect.poll(() => printer.moves().length).toBe(1)
    await page.getByTestId('move-trackpad').dispatchEvent('pointercancel', { pointerId: 1, bubbles: true })
    arrive(printer, 10)
    const box = await padBox(page)
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.9, { steps: 4 })
    await page.mouse.up()
    await page.waitForTimeout(700)
    expect(printer.moves()).toHaveLength(1)
  })

  test('two quick drags to the same spot do not double-send', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([100, 100, 10]))
    await open('/control')
    for (let i = 0; i < 2; i++) {
      await dragThrough(page, [100, 100], line([100, 100], [140, 100], 4))
      await page.mouse.up()
    }
    await expect.poll(() => printer.moves().length).toBe(1)
    arrive(printer, 10)
    await page.waitForTimeout(800)
    const lines = printer.moves()
    expect(lines.length).toBeLessThanOrEqual(2)
    for (let i = 1; i < lines.length; i++) expect(lines[i]).not.toBe(lines[i - 1])
  })

  test('not homed: one warning with Home all, and the trackpad and jog send nothing', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([150, 100, 10], ''))
    await open('/control')
    await expect(page.getByTestId('move-not-homed')).toBeVisible()
    await expect(page.getByTestId('control-move').getByText('Not homed', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Head right (X+)' })).toBeDisabled()
    await expect(page.getByTestId('jog-z-up')).toBeDisabled()
    const box = await padBox(page)
    await page.mouse.click(box.x + 8, box.y + 8)
    await expect(page.getByTestId('trackpad-target')).toHaveCount(0)
    expect(printer.gcode).toEqual([])
    await page.getByTestId('home-all').click()
    await expect.poll(() => printer.gcode).toEqual(['G28'])
  })

  test('there is one Home all, and it sends a full G28 (never G28 X Y)', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([150, 100, 10]))
    await open('/control')
    await expect(page.getByTestId('control-move').getByRole('button', { name: 'Home all' })).toHaveCount(1)
    await page.getByTestId('home-all').click()
    await expect.poll(() => printer.gcode).toEqual(['G28'])
    await page.getByTestId('move-more').click()
    await expect(page.getByTestId('menu-home-xy')).toHaveCount(0)
    await expect(page.getByText('Home X and Y')).toHaveCount(0)
  })

  test('printing: locked, the trackpad and jog stay but are greyed out and disabled', async ({ page, open }) => {
    const printer = await usePrinter(page) // the mock as it is: mid-print
    await open('/control')
    const move = page.getByTestId('control-move')
    await expect(move.getByText('Locked while printing')).toBeVisible()
    await expect(page.getByTestId('move-printing')).toBeVisible()
    await expect(page.getByTestId('move-trackpad')).toHaveAttribute('aria-disabled', 'true')
    await expect(page.getByRole('button', { name: 'Head right (X+)' })).toBeDisabled()
    await expect(page.getByTestId('home-all')).toBeDisabled()
    expect(printer.moves()).toEqual([])
  })

  test('fine jog: a 0.1 mm step and a diagonal are each one relative move', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([150, 100, 10]))
    await open('/control')
    const steps = page.getByTestId('control-move').getByRole('radiogroup', { name: 'Step' })
    await steps.getByRole('radio', { name: '0.1', exact: true }).click()
    await page.getByRole('button', { name: 'Head right (X+)' }).click()
    await expect.poll(() => printer.gcode).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X0.1 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
    printer.report(idle([150.1, 100, 10]))
    await steps.getByRole('radio', { name: '10', exact: true }).click()
    await page.getByRole('button', { name: 'Head forward and right' }).click()
    // Forward is Y+ on the M1.
    await expect.poll(() => printer.gcode[1]).toBe('SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X10 Y10 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement')
  })

  test('a second jog waits for the first to land, so a lagging position cannot leave G91 behind (KAN-1745)', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([150, 100, 10]))
    await open('/control')
    await page.getByRole('button', { name: 'Head right (X+)' }).click()
    await expect.poll(() => printer.gcode.length).toBe(1)
    await page.getByRole('button', { name: 'Head right (X+)' }).click()
    await page.waitForTimeout(300)
    expect(printer.gcode).toHaveLength(1)
    printer.report(idle([160, 100, 10]))
    await page.getByRole('button', { name: 'Head right (X+)' }).click()
    await expect.poll(() => printer.gcode.length).toBe(2)
  })

  test('Go to turns the readout into fields and goes through the planner', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([60, 20, 1]))
    await open('/control')
    await page.getByTestId('move-goto').click()
    const form = page.getByTestId('move-go-form')
    await form.getByLabel('X to go to').fill('140')
    await form.getByLabel('X to go to').press('Tab')
    await expect(page.getByTestId('move-go-note')).toHaveText(/Lifts to Z 6/)
    await page.getByTestId('move-go').click()
    await expect.poll(() => printer.gcode.length).toBe(1)
    expect(printer.gcode[0]).toMatch(new RegExp(`^${esc(START)}G1 Z6(\\.\\d+)? F600\\nG1 X140 Y20 F7800\\nG1 Z1 F600${esc(END)}$`))
    await expect(form).toHaveCount(0)
  })

  test('Motors off is only in the ··· menu', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([150, 100, 10]))
    await open('/control')
    await expect(page.getByTestId('motors-off')).toHaveCount(0)
    await page.getByTestId('move-more').click()
    await page.getByTestId('motors-off').click()
    await expect.poll(() => printer.gcode).toEqual(['M84'])
  })

  test('no Z offset on a Muon printer; a printer that is not a Muon has it in the ··· menu', async ({ page, open }) => {
    await usePrinter(page, idle([150, 100, 10]))
    await open('/control')
    await expect(page.getByTestId('control-zoffset')).toHaveCount(0)
    await page.getByTestId('move-more').click()
    await expect(page.getByTestId('menu-home-z')).toBeVisible()
    await expect(page.getByTestId('menu-zoffset')).toHaveCount(0)
    await expect(page.getByText('Z offset', { exact: true })).toHaveCount(0)
  })
})

test.describe('Movement on a printer that is not a Muon', () => {
  test('keeps Z+ and Z−, and has Z offset in the ··· menu', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([150, 100, 10]), { components: ['file_manager', 'update_manager', 'machine', 'database', 'data_store', 'proc_stats', 'history', 'authorization'] })
    await open('/control')
    await expect(page.getByTestId('jog-z-up')).toHaveText('Z+')
    await page.getByTestId('move-more').click()
    await page.getByTestId('menu-zoffset').click()
    await expect(page.getByTestId('control-zoffset')).toBeVisible()
    await page.getByTestId('zoffset-0.05').click()
    await expect.poll(() => printer.gcode).toEqual(['SET_GCODE_OFFSET Z_ADJUST=+0.05 MOVE=1'])
  })
})

const FAN_MODES = { mode: 'normal', modes: ['normal', 'quiet', 'turbo'], commanded_speed: 0.6, target_rpm: null, output_speed: 0.18 }

test.describe('Print mode', () => {
  test('sends SET_PRINT_MODE and shows the mode fan_modes reports', async ({ page, open }) => {
    const printer = await usePrinter(page, idle([150, 100, 10], 'xyz', { fan_modes: FAN_MODES }))
    printer.state.results['printer.gcode.help'] = { SET_PRINT_MODE: 'Select the print mode (normal, quiet, turbo)' }
    await open('/control')
    const tile = page.getByTestId('control-printmode')
    await expect(tile.getByRole('radio', { name: /Normal/ })).toHaveAttribute('aria-checked', 'true')
    await tile.getByRole('radio', { name: /Quiet/ }).click()
    await expect.poll(() => printer.gcode).toEqual(['SET_PRINT_MODE MODE=quiet'])
    // Shown from what Klipper reports, not from the press.
    await expect(tile.getByRole('radio', { name: /Quiet/ })).toHaveAttribute('aria-checked', 'false')
    printer.report(idle([150, 100, 10], 'xyz', { fan_modes: { ...FAN_MODES, mode: 'quiet' } }))
    await expect(tile.getByRole('radio', { name: /Quiet/ })).toHaveAttribute('aria-checked', 'true')
    // The printer chip says the mode while it isn't Normal.
    await expect(page.locator('.printer-switch__status-text').first()).toHaveText(/· Quiet$/)
  })

  test('says what it needs on a printer without fan_modes, with no speed-and-flow stand-in; Advanced stays', async ({ page, open }) => {
    await usePrinter(page, idle([150, 100, 10]))
    await open('/control')
    const tile = page.getByTestId('control-printmode')
    await expect(tile.getByRole('radiogroup', { name: 'Print mode' })).toHaveCount(0)
    await expect(tile).toContainText('Print mode')
    await expect(tile.getByText('Speed and flow')).toHaveCount(0)
    await expect(tile.getByTestId('printmode-none')).toContainText('Quiet, Normal and Turbo need [fan_modes]')
    await expect(page.getByTestId('advanced-toggle')).toBeVisible()
  })

  test('Advanced sends M220, M221 and SET_PRESSURE_ADVANCE', async ({ page, open }) => {
    const status = idle([150, 100, 10], 'xyz', { fan_modes: FAN_MODES })
    status.extruder = { pressure_advance: 0.04 }
    status.configfile = { settings: { ...status.configfile.settings, extruder: { pressure_advance: 0.04 } } }
    status.gcode_move = { ...status.gcode_move, speed_factor: 1, extrude_factor: 1 }
    const printer = await usePrinter(page, status)
    await open('/control')
    await expect(page.getByTestId('advanced-summary')).toHaveText('Speed 100% · Flow 100% · Fan 80% · Pressure advance 0.040')
    await page.getByTestId('advanced-toggle').click()
    const set = async (tid: string, value: number) => page.getByTestId(tid).evaluate((el, v) => {
      const input = el as HTMLInputElement
      input.value = String(v)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }, value)
    await set('advanced-speed', 110)
    await set('advanced-flow', 98)
    await page.getByTestId('pa-more').click()
    await expect.poll(() => printer.gcode).toEqual(['M220 S110', 'M221 S98', 'SET_PRESSURE_ADVANCE ADVANCE=0.041'])
  })
})

test.describe('Quick commands', () => {
  const macros = {
    'gcode_macro park_head': { gcode: 'G1 X0 Y0', description: 'G-Code macro' },
    'gcode_macro load_filament': { gcode: 'M83', description: 'G-Code macro' }
  }

  test('rows name the macro in plain words, leave out what Filament has, and run their macro', async ({ page, open }) => {
    const status = idle([150, 100, 10])
    status.configfile = { settings: { ...status.configfile.settings, ...macros } }
    const printer = await usePrinter(page, status)
    await open('/control')
    const tile = page.getByTestId('control-quick')
    const all = tile.getByTestId('quick-all')
    if (await all.count()) await all.click()
    const row = tile.getByRole('listitem').filter({ hasText: 'Park the head' })
    await expect(row).toBeVisible()
    await expect(row.locator('kbd')).toHaveText(/park_head/i)
    await expect(tile.getByRole('listitem').filter({ hasText: /load_filament/i })).toHaveCount(0)
    await expect(tile.getByRole('listitem').filter({ hasText: 'Restart the firmware' })).toBeVisible()
    await row.click()
    await expect.poll(() => printer.gcode.map(g => g.toUpperCase())).toEqual(['PARK_HEAD'])
  })
})

test('Edit layout hides a tile, sends nothing while editing, and keeps the layout after Done', async ({ page, open }) => {
  test.slow() // two full page loads
  const printer = await usePrinter(page, idle([150, 100, 10]))
  printer.state.answers['server.database.post_item'] = (p: Record<string, unknown>) => ({ namespace: p.namespace, key: p.key, value: p.value })
  await open('/control')
  await page.getByTestId('edit-open').click()
  await page.getByRole('button', { name: 'Hide Quick commands' }).click()
  await expect(page.getByTestId('control-quick')).toHaveCount(0)
  await page.getByTestId('edit-done').click()
  await open('/control')
  await expect(page.getByTestId('control-move')).toBeVisible()
  await expect(page.getByTestId('control-quick')).toHaveCount(0)
  expect(printer.gcode).toEqual([])
})
