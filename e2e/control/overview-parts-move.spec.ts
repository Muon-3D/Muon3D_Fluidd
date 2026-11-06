/**
 * Overview: moving the M1 from its 3D model (Jack, 6 Nov).
 *
 * Selecting the toolhead looks straight down with X and Y marked; dragging
 * shows a target and a live line, and letting go sends one move through
 * moveTo and the no-go planner. The plate goes up and down by its buttons
 * and by a drag. Esc mid-drag, an unhomed printer and a printing one send
 * nothing. Every script the page sends is answered by usePrinter, so nothing
 * reaches the shared mock.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const GPU = process.platform === 'win32'
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.skip(({ isMobile }) => isMobile, 'pointer drags are the desktop path; the phone has the buttons')
test.skip(!GPU, 'drags read millimetres off the accurate model, which needs the GPU here')

async function ready (page: Page) {
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await expect(page.getByTestId('m1-parts')).toBeAttached()
}

/** Where the selected part's hairline starts: its middle on the page. */
async function partPoint (page: Page): Promise<{ x: number, y: number }> {
  await page.waitForTimeout(1200)
  await expect(page.locator('.m1-parts__leader circle')).toBeAttached()
  return page.getByTestId('m1-parts').evaluate(el => {
    const dot = el.querySelector('.m1-parts__leader circle')!
    const stage = el.getBoundingClientRect()
    return { x: stage.left + Number(dot.getAttribute('cx')), y: stage.top + Number(dot.getAttribute('cy')) }
  })
}

const moveLines = (gcode: string[]) => gcode.flatMap(s => s.split('\n')).filter(l => /^G1 /.test(l))

test('the toolhead looks straight down, with X and Y marked and its options', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-toolhead').focus()
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'top')
  await expect(page.getByTestId('m1-axes')).toContainText('100')
  await expect(page.getByTestId('m1-options-toolhead')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'free')
  expect(printer.gcode).toEqual([])
})

test('the pad moves the head as Control does: right is X+', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-toolhead').focus()
  await page.getByTestId('m1-pad-e').click()
  await expect.poll(() => moveLines(printer.gcode)).toEqual(['G1 X10 F7800'])
})

test('dragging the head shows a target and sends one planned move on release', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-toolhead').focus()
  const at = await partPoint(page)

  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  await page.mouse.move(at.x + 30, at.y + 4, { steps: 4 })
  await page.mouse.move(at.x + 60, at.y + 8, { steps: 4 })
  const target = page.getByTestId('m1-drag-target')
  await expect(target).toHaveAttribute('data-target', /^X \d+\.\d {2}Y \d+\.\d$/)
  expect(printer.gcode).toEqual([])
  await page.mouse.up()

  await expect(target).toHaveCount(0)
  await expect.poll(() => moveLines(printer.gcode).length).toBe(1)
  const [line] = moveLines(printer.gcode)
  const x = Number(/X([\d.]+)/.exec(line)?.[1])
  // Dragged to the right of where the head was: a larger X.
  expect(x).toBeGreaterThan(100)
  expect(line).toMatch(/^G1 X[\d.]+ Y[\d.]+ F\d+$/)
})

test('a drag that starts off the head, or with the right button, sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-toolhead').focus()
  const at = await partPoint(page)
  const stage = await page.getByTestId('m1-parts').boundingBox()

  // From empty stage, well away from the head.
  await page.mouse.move(stage!.x + 30, stage!.y + stage!.height / 2)
  await page.mouse.down()
  await page.mouse.move(stage!.x + 120, stage!.y + stage!.height / 2 - 40, { steps: 5 })
  await expect(page.getByTestId('m1-drag-target')).toHaveCount(0)
  await page.mouse.up()

  // From the head, but with the right button.
  await page.mouse.move(at.x, at.y)
  await page.mouse.down({ button: 'right' })
  await page.mouse.move(at.x + 60, at.y, { steps: 5 })
  await page.mouse.up({ button: 'right' })
  await page.waitForTimeout(500)
  expect(moveLines(printer.gcode)).toEqual([])
})

test('a heat chip on the toolhead heats the nozzle only', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-toolhead').focus()
  const chip = page.getByTestId('m1-options-toolhead').locator('[data-tid^="m1-heat-"]').first()
  await chip.click()
  await expect.poll(() => printer.gcode.length).toBeGreaterThan(0)
  expect(printer.gcode.every(g => /^SET_HEATER_TEMPERATURE HEATER=extruder TARGET=\d+$/.test(g))).toBe(true)
})

test('Esc in the middle of a drag drops it and sends nothing', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-toolhead').focus()
  const at = await partPoint(page)
  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  await page.mouse.move(at.x + 50, at.y, { steps: 5 })
  await expect(page.getByTestId('m1-drag-target')).toBeAttached()
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await page.waitForTimeout(500)
  expect(printer.gcode).toEqual([])
})

test('the plate goes up by its button and by a drag', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-plate').focus()
  await page.getByTestId('m1-plate-up').click()
  await expect.poll(() => moveLines(printer.gcode)).toEqual(['G1 Z1 F600'])
  // The plate gets there: the next hand move waits for that report (the shared hand-move lock).
  printer.report({
    toolhead: { position: [100, 100, 11, 0] },
    gcode_move: { position: [100, 100, 11, 0], gcode_position: [100, 100, 11, 0] },
    motion_report: { live_position: [100, 100, 11, 0] }
  })

  const at = await partPoint(page)
  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  await page.mouse.move(at.x, at.y - 40, { steps: 5 })
  await expect(page.getByTestId('m1-drag-target')).toHaveAttribute('data-target', /^Z \d+\.\d$/)
  await page.mouse.up()
  await expect.poll(() => moveLines(printer.gcode).length).toBe(2)
  const z = Number(/Z([\d.]+)/.exec(moveLines(printer.gcode)[1])?.[1])
  // Dragged up: the plate rises, a larger Z (the gap from the nozzle).
  expect(z).toBeGreaterThan(11)
})

test('not homed: the head says to home it, and neither the pad nor a drag sends a move', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ homed: '' }))
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-toolhead').focus()
  await expect(page.getByTestId('m1-parts-label')).toContainText('Home it to move it by hand')
  await expect(page.getByTestId('m1-pad-e')).toBeDisabled()
  const at = await partPoint(page)
  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  await page.mouse.move(at.x + 50, at.y, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(500)
  expect(moveLines(printer.gcode)).toEqual([])
})

test('while it prints, a selected part has no options and no drag', async ({ page, open }) => {
  const printer = await usePrinter(page) // the shared mock as it is: mid-print
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-toolhead').focus()
  await expect(page.getByTestId('m1-parts-label')).toBeVisible()
  await expect(page.getByTestId('m1-options-toolhead')).toHaveCount(0)
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'free')
  expect(printer.gcode).toEqual([])
})
