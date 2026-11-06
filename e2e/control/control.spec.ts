/**
 * Control (v3): the D3 tiles, and Move's trackpad plus fine jog.
 *
 * The trackpad shows the bed, the head and the printer's no-go regions. A tap
 * only picks a target; the move is sent when "Move here" is pressed, through
 * the same planner as the jog buttons (lift across the notch, refuse ending
 * low over it). The page's G-code is answered and recorded by usePrinter, so
 * nothing reaches the shared mock printer.
 */
import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { usePrinter, PRESETS } from './printer'

/** A homed, idle M1 on a 200 × 200 bed, so a spot on the trackpad is easy to name. */
function idle (position: [number, number, number], homed = 'xyz') {
  const status = PRESETS.idleHomed({ position, homed })
  status.toolhead = { ...status.toolhead, axis_minimum: [0, 0, 0, 0], axis_maximum: [200, 200, 160, 0] }
  return status
}

const BED = 200
const tenth = (v: number) => Math.round(v * 10) / 10

/**
 * Tap the trackpad over a bed spot (mm), at a whole pixel, and work out in
 * the test (from the bed size and the trackpad's box, never from the page's
 * own label) which spot that pixel is. Y grows toward the front on the M1, so
 * Y 0 is the top edge.
 */
async function tap (page: Page, x: number, y: number): Promise<{ x: number, y: number }> {
  const pad = page.getByTestId('move-trackpad')
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  if (!box) throw new Error('no trackpad')
  const px = Math.round(box.x + box.width * x / BED)
  const py = Math.round(box.y + box.height * y / BED)
  await page.mouse.click(px, py)
  return { x: tenth((px - box.x) / box.width * BED), y: tenth((py - box.y) / box.height * BED) }
}

/** The pick's label, as numbers. */
async function shownPick (page: Page): Promise<{ x: number, y: number }> {
  const text = await page.getByTestId('trackpad-pick').locator('b').innerText()
  const m = /X ([\d.]+) · Y ([\d.]+)/.exec(text)
  if (!m) throw new Error(`no pick in "${text}"`)
  return { x: Number(m[1]), y: Number(m[2]) }
}

/** The one XY move sent, as numbers. */
function xyOf (line: string): { x: number, y: number } {
  const m = /^G1 X([\d.]+) Y([\d.]+) F7800$/.exec(line)
  if (!m) throw new Error(`not one XY move: ${line}`)
  return { x: Number(m[1]), y: Number(m[2]) }
}

test('the page is the v3 tiles: Move, Heaters, Speed and flow, Fans, Filament, Z offset, Macros', async ({ page, open }) => {
  await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  for (const tid of ['control-move', 'control-heat', 'control-speed', 'control-fans', 'control-filament', 'control-zoffset', 'control-macros']) {
    await expect(page.getByTestId(tid)).toBeVisible()
  }
  await expect(page.getByTestId('move-trackpad')).toBeVisible()
  await expect(page.getByTestId('trackpad-nogo')).toHaveCount(1)
  // The bed is drawn to scale: a 200 × 200 bed is square.
  const box = await page.getByTestId('move-trackpad').boundingBox()
  if (!box) throw new Error('no trackpad')
  expect(Math.abs(box.width / box.height - 1)).toBeLessThan(0.02)
  // The notch (x 75–125, y 0–34) sits where the bed puts it.
  const notch = await page.getByTestId('trackpad-nogo').boundingBox()
  if (!notch) throw new Error('no notch drawn')
  expect(Math.abs((notch.x - box.x) / box.width * BED - 75)).toBeLessThan(1)
  expect(Math.abs(notch.width / box.width * BED - 50)).toBeLessThan(1)
  expect(Math.abs(notch.height / box.height * BED - 34)).toBeLessThan(1)
})

test('a tap alone sends nothing; Move here sends one planned move to the spot', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  const spot = await tap(page, 160, 150)
  // The pixel tapped is the spot asked for, to within the trackpad's resolution.
  expect(Math.abs(spot.x - 160)).toBeLessThanOrEqual(0.5)
  expect(Math.abs(spot.y - 150)).toBeLessThanOrEqual(0.5)
  await expect(page.getByTestId('trackpad-target')).toBeVisible()
  await expect(page.getByTestId('trackpad-note')).toHaveText(/Straight there/)
  const shown = await shownPick(page)
  expect(Math.abs(shown.x - spot.x)).toBeLessThanOrEqual(0.1)
  expect(Math.abs(shown.y - spot.y)).toBeLessThanOrEqual(0.1)
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])

  await page.getByTestId('trackpad-move').click()
  await expect.poll(() => printer.moves().length).toBe(1)
  const sent = xyOf(printer.moves()[0])
  expect(Math.abs(sent.x - 160)).toBeLessThanOrEqual(0.5)
  expect(Math.abs(sent.y - 150)).toBeLessThanOrEqual(0.5)
  expect(Math.abs(sent.x - spot.x)).toBeLessThanOrEqual(0.1)
  expect(Math.abs(sent.y - spot.y)).toBeLessThanOrEqual(0.1)
  expect(printer.gcode[0].startsWith('SAVE_GCODE_STATE NAME=_ui_movement\nG90\n')).toBe(true)
  await expect(page.getByTestId('trackpad-target')).toHaveCount(0)
})

test('dragging across the trackpad streams no moves', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  const pad = page.getByTestId('move-trackpad')
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  if (!box) throw new Error('no trackpad')
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6)
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + box.width * (0.6 + i * 0.03), box.y + box.height * 0.6)
  await page.mouse.up()
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
  await expect(page.getByTestId('trackpad-target')).toBeVisible()
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

test('a path across the notch lifts first, crosses, and comes back down', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([60, 20, 1]))
  await open('/control')
  const spot = await tap(page, 140, 20)
  await expect(page.getByTestId('trackpad-note')).toHaveText(/Lifts to Z 6/)
  await page.getByTestId('trackpad-move').click()

  await expect.poll(() => printer.moves().length).toBe(3)
  const [lift, over, down] = printer.moves()
  const liftZ = Number(/^G1 Z([\d.]+) F600$/.exec(lift)?.[1])
  expect(liftZ).toBeGreaterThanOrEqual(6)
  expect(liftZ).toBeLessThan(7)
  const xy = xyOf(over)
  expect(Math.abs(xy.x - spot.x)).toBeLessThanOrEqual(0.1)
  expect(Math.abs(xy.y - spot.y)).toBeLessThanOrEqual(0.1)
  expect(down).toBe('G1 Z1 F600')
})

test('unhomed: the trackpad asks to home, a tap picks nothing, and the jog pad sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10], ''))
  await open('/control')
  await expect(page.getByText('Home X and Y to move the head')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Head right (X+)' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Head back and right' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Plate up' })).toBeDisabled()
  const pad = page.getByTestId('move-trackpad')
  const box = await pad.boundingBox()
  if (!box) throw new Error('no trackpad')
  await page.mouse.click(box.x + 8, box.y + 8)
  await expect(page.getByTestId('trackpad-target')).toHaveCount(0)
  expect(printer.gcode).toEqual([])
})

test('printing: Move is locked, a tap picks nothing, and nothing is sent', async ({ page, open }) => {
  const printer = await usePrinter(page) // the mock as it is: mid-print
  await open('/control')
  await expect(page.getByTestId('control-move').getByText('Locked while printing')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Head right (X+)' })).toBeDisabled()
  const pad = page.getByTestId('move-trackpad')
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  if (!box) throw new Error('no trackpad')
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5)
  await expect(page.getByTestId('trackpad-target')).toHaveCount(0)
  await expect(page.getByTestId('trackpad-move')).toHaveCount(0)
  expect(printer.moves()).toEqual([])
})

test('fine jog: a 0.1 mm step is one small relative move', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  await page.getByTestId('control-move').getByRole('radiogroup', { name: 'Step' }).getByRole('radio', { name: '0.1', exact: true }).click()
  await page.getByRole('button', { name: 'Head right (X+)' }).click()
  await expect.poll(() => printer.gcode).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X0.1 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
})

test('a diagonal jog is one relative move of both axes', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  await page.getByTestId('control-move').getByRole('radiogroup', { name: 'Step' }).getByRole('radio', { name: '10', exact: true }).click()
  await page.getByRole('button', { name: 'Head forward and right' }).click()
  // Forward is Y+ on the M1.
  await expect.poll(() => printer.gcode).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X10 Y10 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
})

test('Edit layout hides a tile, sends nothing while editing, and keeps the layout after Done', async ({ page, open }) => {
  test.slow() // two full page loads
  const printer = await usePrinter(page, idle([150, 100, 10]))
  // The layout save is answered here, so the shared mock's settings (which every other test reads) stay as they are.
  printer.state.answers['server.database.post_item'] = (p: Record<string, unknown>) => ({ namespace: p.namespace, key: p.key, value: p.value })
  await open('/control')
  await page.getByTestId('edit-open').click()
  await page.getByRole('button', { name: 'Hide Macros' }).click()
  await expect(page.getByTestId('control-macros')).toHaveCount(0)
  await expect(page.getByTestId('add-macros')).toBeVisible()
  await page.getByTestId('edit-done').click()
  await expect(page.getByTestId('control-macros')).toHaveCount(0)
  // Open the page afresh (past the splash, as a person coming back would).
  await open('/control')
  await expect(page.getByTestId('control-move')).toBeVisible()
  await expect(page.getByTestId('control-macros')).toHaveCount(0)
  expect(printer.gcode).toEqual([])
})

test('arrow keys and Page Up / Page Down on the trackpad move the pick and send nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  await tap(page, 100, 100)
  const before = await shownPick(page)
  await page.getByTestId('move-trackpad').focus()
  for (const key of ['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'PageUp', 'PageDown', 'Enter', ' ']) await page.keyboard.press(key)
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
  const after = await shownPick(page)
  expect(Math.abs(after.x - (before.x + 10))).toBeLessThanOrEqual(0.1)
  expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(0.1)
})

test('a double click on Move here sends one move', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  await tap(page, 60, 150)
  await page.getByTestId('trackpad-move').dblclick()
  await page.waitForTimeout(800)
  expect(printer.moves()).toHaveLength(1)
  expect(printer.gcode).toHaveLength(1)
})

test('the pick is dropped when homing is lost', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  await tap(page, 60, 150)
  await expect(page.getByTestId('trackpad-move')).toBeEnabled()
  printer.report(idle([150, 100, 10], ''))
  await expect(page.getByTestId('trackpad-target')).toHaveCount(0)
  await expect(page.getByTestId('trackpad-move')).toHaveCount(0)
  expect(printer.gcode).toEqual([])
})

test('a diagonal that would end in the notch low down is refused; one that crosses it lifts first', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([70, 40, 1]))
  await open('/control')
  const steps = page.getByTestId('control-move').getByRole('radiogroup', { name: 'Step' })
  await steps.getByRole('radio', { name: '10', exact: true }).click()
  // Back is Y− on the M1: 70,40 → 80,30 ends inside the notch.
  await page.getByRole('button', { name: 'Head back and right' }).click()
  await expect(page.getByText(/over the bed notch/).first()).toBeVisible()
  expect(printer.gcode).toEqual([])

  await steps.getByRole('radio', { name: '50 mm' }).click()
  // 70,40 → 120,90 starts in the notch's tolerance band, low down.
  await page.getByRole('button', { name: 'Head forward and right' }).click()
  await expect.poll(() => printer.moves().length).toBe(3)
  const [lift, across, down] = printer.moves()
  expect(Number(/^G1 Z([\d.]+) F600$/.exec(lift)?.[1])).toBeGreaterThanOrEqual(6)
  expect([across, down]).toEqual(['G1 X120 Y90 F7800', 'G1 Z1 F600'])
})

test('the no-go regions follow the printer config when it changes', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([60, 100, 1]))
  await open('/control')
  const pad = page.getByTestId('move-trackpad')
  const notch = page.getByTestId('trackpad-nogo')
  await expect(notch).toHaveCount(1)
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  if (!box) throw new Error('no trackpad')

  // The printer now declares its region at the back-right corner instead.
  const moved = idle([60, 100, 1])
  moved.configfile = { settings: { bed_mesh: { no_go_region_1_min: [150, 150], no_go_region_1_max: [190, 190], no_go_boundary_tolerance: 5, no_go_traverse_z: 6 } } }
  printer.report(moved)
  await expect.poll(async () => ((await notch.boundingBox())?.x ?? 0) - box.x).toBeGreaterThan(box.width * 0.7)

  // The old notch spot is now fine at this height; the new region is refused.
  await tap(page, 100, 15)
  await expect(page.getByTestId('trackpad-note')).toHaveText(/Straight there/)
  await tap(page, 170, 170)
  await expect(page.getByTestId('trackpad-note')).toHaveText(/over the bed notch/)
  await expect(page.getByTestId('trackpad-move')).toBeDisabled()
  expect(printer.gcode).toEqual([])
})

test('Motors off sends M84, and is not in the homing row beside Home Z', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  const homeZ = await page.getByTestId('home-z').boundingBox()
  const motors = await page.getByTestId('motors-off').boundingBox()
  if (!homeZ || !motors) throw new Error('no buttons')
  // Below the homing row, not on it.
  expect(motors.y).toBeGreaterThan(homeZ.y + homeZ.height)
  await page.getByTestId('motors-off').click()
  await expect.poll(() => printer.gcode).toEqual(['M84'])
})
