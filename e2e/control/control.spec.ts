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

/** Tap the trackpad at a bed spot (mm). Y grows toward the front on the M1, so Y 0 is the top edge. */
async function tap (page: Page, x: number, y: number) {
  const pad = page.getByTestId('move-trackpad')
  await pad.scrollIntoViewIfNeeded()
  const box = await pad.boundingBox()
  if (!box) throw new Error('no trackpad')
  await page.mouse.click(box.x + box.width * x / 200, box.y + box.height * y / 200)
}

/** The G1 line the picked target should become, read from what the page shows. */
async function pickedMove (page: Page): Promise<string> {
  const text = await page.getByTestId('trackpad-pick').locator('b').innerText()
  const m = /X ([\d.]+) · Y ([\d.]+)/.exec(text)
  if (!m) throw new Error(`no pick in "${text}"`)
  return `G1 X${Number(m[1])} Y${Number(m[2])} F7800`
}

test('the page is the v3 tiles: Move, Heaters, Speed and flow, Fans, Filament, Z offset, Macros', async ({ page, open }) => {
  await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  for (const tid of ['control-move', 'control-heat', 'control-speed', 'control-fans', 'control-filament', 'control-zoffset', 'control-macros']) {
    await expect(page.getByTestId(tid)).toBeVisible()
  }
  await expect(page.getByTestId('move-trackpad')).toBeVisible()
  await expect(page.getByTestId('trackpad-nogo')).toHaveCount(1)
})

test('a tap alone sends nothing; Move here sends one planned move to the spot', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  await tap(page, 160, 150)
  await expect(page.getByTestId('trackpad-target')).toBeVisible()
  await expect(page.getByTestId('trackpad-note')).toHaveText(/Straight there/)
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])

  const expected = await pickedMove(page)
  await page.getByTestId('trackpad-move').click()
  await expect.poll(() => printer.moves()).toEqual([expected])
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
  await tap(page, 140, 20)
  await expect(page.getByTestId('trackpad-note')).toHaveText(/Lifts to Z/)
  const across = await pickedMove(page)
  await page.getByTestId('trackpad-move').click()

  await expect.poll(() => printer.moves().length).toBe(3)
  const [lift, over, down] = printer.moves()
  const liftZ = Number(/^G1 Z([\d.]+) F600$/.exec(lift)?.[1])
  expect(liftZ).toBeGreaterThanOrEqual(6)
  expect(liftZ).toBeLessThan(7)
  expect(over).toBe(across)
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

test('a diagonal jog is one planned absolute move', async ({ page, open }) => {
  const printer = await usePrinter(page, idle([150, 100, 10]))
  await open('/control')
  await page.getByTestId('control-move').getByRole('radiogroup', { name: 'Step' }).getByRole('radio', { name: '10', exact: true }).click()
  await page.getByRole('button', { name: 'Head forward and right' }).click()
  // Forward is Y+ on the M1.
  await expect.poll(() => printer.moves()).toEqual(['G1 X160 Y110 F7800'])
})

test('Edit layout hides a tile, sends nothing while editing, and keeps the layout after Done', async ({ page, open }) => {
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
  await page.reload()
  await expect(page.getByTestId('control-move')).toBeVisible()
  await expect(page.getByTestId('control-macros')).toHaveCount(0)
  expect(printer.gcode).toEqual([])
})
