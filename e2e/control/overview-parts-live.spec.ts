/**
 * Overview: the M1 follows a drag on its 3D model, live (Jack, 9 Nov).
 *
 * The head and the plate move while the pointer moves. On a printer with
 * Klipper's muon_jog the drag streams MUON_JOG targets (the printer holds
 * the limits and turns round within a few mm). Without it, DragFollow: one
 * planned move (moveTo and the no-go planner) in flight at a time, each a
 * short step (at most 3 mm), the next only once the printer reports the last
 * one landed. Esc, a second
 * pointer, the window losing focus and a refusal stop it; the view stays
 * straight down throughout. Every script is answered by usePrinter.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS, M1_NO_GO, type PrinterHandle } from './printer'

/** As overview-parts-move.spec.ts: drags redraw every frame, so they run where the GPU draws. */
const GPU = process.platform === 'win32' && !process.env.E2E_NO_GPU
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.skip(({ isMobile }) => isMobile, 'pointer drags are the desktop path; the phone has the buttons')
test.skip(!GPU, 'drags need the GPU; software WebGL stalls on the accurate model')

const moveLines = (gcode: string[]) => gcode.flatMap(s => s.split('\n')).filter(l => /^G1 /.test(l))
const jogLines = (gcode: string[]) => gcode.flatMap(s => s.split('\n')).filter(l => /^MUON_JOG /.test(l))
/** The printer has Klipper's [muon_jog]: drags stream. */
const streaming = (position: [number, number, number]) => overlay(PRESETS.idleHomed({ position }), {
  configfile: { settings: { bed_mesh: M1_NO_GO, muon_jog: { max_ahead_xy: 15, max_ahead_z: 4 } } },
  muon_jog: { active: false, reason: '', sessions: 0, position: null }
})
const num = (line: string, axis: string) => Number(new RegExp(`${axis}(-?[\\d.]+)`).exec(line)?.[1])

async function ready (page: Page) {
  await expect(page.getByTestId('m1-live')).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  await expect(page.getByTestId('m1-parts')).toBeAttached()
}

/** Selects the toolhead and waits for the view straight down, with its scales. */
async function lookDown (page: Page) {
  await page.getByTestId('m1-part-toolhead').focus()
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'top')
  await expect(page.getByTestId('m1-axes')).toBeVisible()
  await page.waitForTimeout(1200)
}

/** Where the selected part's hairline starts: on the part. */
async function partPoint (page: Page): Promise<{ x: number, y: number }> {
  await expect(page.locator('.m1-parts__leader circle')).toBeAttached()
  return page.getByTestId('m1-parts').evaluate(el => {
    const dot = el.querySelector('.m1-parts__leader circle')!
    const stage = el.getBoundingClientRect()
    return { x: stage.left + Number(dot.getAttribute('cx')), y: stage.top + Number(dot.getAttribute('cy')) }
  })
}

/** Klipper (X, Y) to the page, read off the view's own X and Y scales. */
async function bedToPage (page: Page): Promise<(x: number, y: number) => { x: number, y: number }> {
  const scales = await page.getByTestId('m1-parts').evaluate(el => {
    const stage = el.getBoundingClientRect()
    const read = (sel: string, prop: 'left' | 'top') => Array.from(el.querySelectorAll<HTMLElement>(sel))
      .map(t => ({ v: Number(t.textContent), px: parseFloat(t.style[prop]) }))
    return { left: stage.left, top: stage.top, x: read('.m1-parts__tick--x', 'left'), y: read('.m1-parts__tick--y', 'top') }
  })
  const fit = (m: Array<{ v: number, px: number }>) => {
    const [a, b] = [m[0], m[m.length - 1]]
    const k = (b.px - a.px) / (b.v - a.v)
    return (v: number) => a.px + (v - a.v) * k
  }
  const fx = fit(scales.x)
  const fy = fit(scales.y)
  return (x, y) => ({ x: scales.left + fx(x), y: scales.top + fy(y) })
}

/**
 * The printer reports `status` on top of what it reported before. (report alone
 * replaces the overlay, so the shared mock's mid-print state would show through.)
 */
function report (printer: PrinterHandle, status: Record<string, unknown>) {
  printer.report(overlay(printer.state.status, status))
}

/** The printer reports the head (or plate) at the last move's place: it has landed. */
function land (printer: PrinterHandle, at: [number, number, number]) {
  const p = [...at, 0]
  report(printer, { toolhead: { position: p }, gcode_move: { position: p, gcode_position: p }, motion_report: { live_position: p } })
}

/** Where the head is after the moves so far, from the last of each axis. */
function headAfter (printer: PrinterHandle, from: [number, number, number]): [number, number, number] {
  const at = [...from] as [number, number, number]
  for (const line of moveLines(printer.gcode)) {
    for (const [i, a] of (['X', 'Y', 'Z'] as const).entries()) if (line.includes(` ${a}`)) at[i] = num(line, a)
  }
  return at
}

test('the head follows a drag in short steps, each only after the last has landed', async ({ page, open }) => {
  const start: [number, number, number] = [60, 100, 10]
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: start }))
  await open('/')
  await ready(page)
  await lookDown(page)
  const toPage = await bedToPage(page)
  const at = await partPoint(page)

  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  const a = toPage(90, 100)
  await page.mouse.move(a.x, a.y, { steps: 6 })
  await expect.poll(() => moveLines(printer.gcode).length).toBe(1)
  // Still moving: the pointer goes on, but nothing more is sent until the printer says it got there.
  const b = toPage(120, 110)
  await page.mouse.move(b.x, b.y, { steps: 6 })
  await page.waitForTimeout(600)
  expect(moveLines(printer.gcode)).toHaveLength(1)
  land(printer, headAfter(printer, start))
  await expect.poll(() => moveLines(printer.gcode).length).toBe(2)
  land(printer, headAfter(printer, start))
  const c = toPage(150, 120)
  await page.mouse.move(c.x, c.y, { steps: 6 })
  await expect.poll(() => moveLines(printer.gcode).length).toBeGreaterThanOrEqual(3)
  // The Y moves kept going the way the pointer went, all while the button was down.
  const xs = moveLines(printer.gcode).map(l => num(l, 'X'))
  expect(xs).toEqual([...xs].sort((p, q) => p - q))
  // Each step short (a step in flight can't be taken back), the first from where the head was.
  ;[60, ...xs].slice(1).forEach((x, i) => expect(x - [60, ...xs][i]).toBeLessThanOrEqual(3.001))
  expect(moveLines(printer.gcode).every(l => /^G1 X[\d.]+ Y[\d.]+ F\d+$/.test(l))).toBe(true)
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'top')
  land(printer, headAfter(printer, start))
  await page.mouse.up()
  // After the moves, still looking straight down.
  await page.waitForTimeout(500)
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'top')
})

test('the view stays straight down while the printer is busy running the move', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
  await open('/')
  await ready(page)
  await lookDown(page)
  const toPage = await bedToPage(page)
  const at = await partPoint(page)
  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  const a = toPage(140, 100)
  // One pointer move, one target: a slow frame rate can't outlast the hand-move settle and let a second through.
  await page.mouse.move(a.x, a.y)
  await expect.poll(() => moveLines(printer.gcode).length).toBe(1)
  // Klipper runs the move: idle_timeout says Printing with no print.
  report(printer, { idle_timeout: { state: 'Printing' } })
  await page.waitForTimeout(400)
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'top')
  await expect(page.getByTestId('m1-drag-target')).toBeAttached()
  // Landed but still busy: the next step waits for it.
  land(printer, headAfter(printer, [100, 100, 10]))
  const b = toPage(160, 110)
  await page.mouse.move(b.x, b.y, { steps: 4 })
  await page.waitForTimeout(500)
  expect(moveLines(printer.gcode)).toHaveLength(1)
  report(printer, { idle_timeout: { state: 'Ready' } })
  await expect.poll(() => moveLines(printer.gcode).length).toBe(2)
  await page.mouse.up()
})

for (const how of ['Esc', 'a second pointer', 'the window losing focus', 'homing lost', 'a print starting'] as const) {
  test(`${how} stops a live drag: nothing more is sent`, async ({ page, open }) => {
    const start: [number, number, number] = [60, 100, 10]
    const printer = await usePrinter(page, PRESETS.idleHomed({ position: start }))
    await open('/')
    await ready(page)
    await lookDown(page)
    const toPage = await bedToPage(page)
    const at = await partPoint(page)
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    const a = toPage(90, 100)
    await page.mouse.move(a.x, a.y, { steps: 6 })
    await expect.poll(() => moveLines(printer.gcode).length).toBe(1)

    if (how === 'Esc') await page.keyboard.press('Escape')
    else if (how === 'a second pointer') {
      await page.locator('.m1-live__canvas').dispatchEvent('pointerdown', { pointerId: 99, isPrimary: false, button: 0, clientX: a.x + 40, clientY: a.y })
    } else if (how === 'the window losing focus') await page.evaluate(() => window.dispatchEvent(new Event('blur')))
    else if (how === 'homing lost') report(printer, { toolhead: { homed_axes: '' } })
    else report(printer, { print_stats: { state: 'printing' }, idle_timeout: { state: 'Printing' } })
    await expect(page.getByTestId('m1-drag-target')).toHaveCount(0)

    land(printer, headAfter(printer, start))
    const b = toPage(150, 120)
    await page.mouse.move(b.x, b.y, { steps: 6 })
    await page.mouse.up()
    await page.waitForTimeout(800)
    expect(moveLines(printer.gcode)).toHaveLength(1)
  })
}

// Opus review of #340, B1: a release still waiting for the last move to land is not a drag any more,
// so the cancels must reach it too, or it would send later (to another printer, after a switch).
for (const how of ['Esc', 'the window losing focus'] as const) {
  test(`${how} after letting go also drops the move still waiting to send`, async ({ page, open }) => {
    const start: [number, number, number] = [60, 100, 10]
    const printer = await usePrinter(page, PRESETS.idleHomed({ position: start }))
    await open('/')
    await ready(page)
    await lookDown(page)
    const toPage = await bedToPage(page)
    const at = await partPoint(page)
    await page.mouse.move(at.x, at.y)
    await page.mouse.down()
    const a = toPage(90, 100)
    await page.mouse.move(a.x, a.y, { steps: 6 })
    await expect.poll(() => moveLines(printer.gcode).length).toBe(1)
    // Further on, then let go while the first move has not landed: the release waits to send.
    const b = toPage(150, 120)
    await page.mouse.move(b.x, b.y, { steps: 6 })
    await page.mouse.up()
    await page.waitForTimeout(300)
    expect(moveLines(printer.gcode)).toHaveLength(1)

    if (how === 'Esc') await page.keyboard.press('Escape')
    else await page.evaluate(() => window.dispatchEvent(new Event('blur')))

    land(printer, headAfter(printer, start))
    await page.waitForTimeout(1200)
    expect(moveLines(printer.gcode)).toHaveLength(1)
  })
}

test('a drag across the bed notch low down stops at it: no step ends inside, the label says why', async ({ page, open }) => {
  const start: [number, number, number] = [70, 20, 1]
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: start }))
  await open('/')
  await ready(page)
  await lookDown(page)
  await expect(page.getByTestId('m1-notch')).toHaveCount(1)
  const toPage = await bedToPage(page)
  const at = await partPoint(page)
  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  const far = toPage(160, 20)
  await page.mouse.move(far.x, far.y)
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(300)
    land(printer, headAfter(printer, start))
  }
  await expect(page.getByTestId('m1-drag-refused')).toContainText(/notch/i)
  const xs = moveLines(printer.gcode).filter(l => !l.includes(' Z')).map(l => num(l, 'X'))
  expect(xs.every(x => x <= 75 || x >= 125)).toBe(true)
  await page.mouse.up()
})

test('a step that would end over the notch low down is refused: following stops and the label says why', async ({ page, open }) => {
  const start: [number, number, number] = [40, 20, 1]
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: start }))
  await open('/')
  await ready(page)
  await lookDown(page)
  const toPage = await bedToPage(page)
  const at = await partPoint(page)
  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  const inNotch = toPage(100, 15)
  await page.mouse.move(inNotch.x, inNotch.y)
  await expect(page.getByTestId('m1-drag-refused')).toContainText(/notch/i)
  await expect(page.getByTestId('m1-drag-target')).toHaveCount(0)
  // Out the other side: still nothing, the drag has stopped.
  const away = toPage(170, 120)
  await page.mouse.move(away.x, away.y, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(800)
  expect(moveLines(printer.gcode)).toEqual([])
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'top')
})

test('the plate follows a drag up, live, in short steps, with no cap per drag', async ({ page, open }) => {
  const start: [number, number, number] = [100, 100, 10]
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: start }))
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-plate').focus()
  await expect(page.getByTestId('m1-plate-handle')).toBeVisible()
  await page.waitForTimeout(1200)
  const at = await partPoint(page)
  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  await page.mouse.move(at.x, at.y - 30)
  await expect.poll(() => moveLines(printer.gcode).length).toBe(1)
  await page.mouse.move(at.x, at.y - 400, { steps: 8 })
  for (let i = 0; i < 4; i++) {
    land(printer, headAfter(printer, start))
    await page.waitForTimeout(300)
  }
  await page.mouse.up()
  const zs = moveLines(printer.gcode).map(l => num(l, 'Z'))
  expect(zs.length).toBeGreaterThanOrEqual(3)
  ;[10, ...zs].slice(1).forEach((z, i) => expect(Math.abs(z - [10, ...zs][i])).toBeLessThanOrEqual(3.001))
  expect(moveLines(printer.gcode).every(l => /^G1 Z[\d.]+ F\d+$/.test(l))).toBe(true)
})

test('with muon_jog the plate streams and turns round at once: up, then down, no waiting to land; FINAL on release', async ({ page, open }) => {
  const printer = await usePrinter(page, streaming([100, 100, 40]))
  await open('/')
  await ready(page)
  await page.getByTestId('m1-part-plate').focus()
  await expect(page.getByTestId('m1-plate-handle')).toBeVisible()
  await page.waitForTimeout(1200)
  const at = await partPoint(page)
  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  await page.mouse.move(at.x, at.y - 120, { steps: 6 })
  await expect.poll(() => jogLines(printer.gcode).length).toBeGreaterThanOrEqual(1)
  const up = jogLines(printer.gcode).length
  // Straight back down, and the printer never says anything landed.
  await page.mouse.move(at.x, at.y + 120, { steps: 6 })
  await expect.poll(() => jogLines(printer.gcode).length).toBeGreaterThan(up)
  const zs = jogLines(printer.gcode).map(l => num(l, 'Z='))
  const top = Math.max(...zs)
  expect(top).toBeGreaterThan(40)
  expect(zs[zs.length - 1]).toBeLessThan(top)
  expect(moveLines(printer.gcode)).toEqual([])
  await page.mouse.up()
  await expect.poll(() => jogLines(printer.gcode).at(-1) ?? '').toMatch(/^MUON_JOG Z=[\d.]+ SPEED=[\d.]+ FINAL=1$/)
})

test('the drag line starts at the head itself, where the printer says it is now', async ({ page, open }) => {
  const printer = await usePrinter(page, streaming([60, 100, 10]))
  await open('/')
  await ready(page)
  await lookDown(page)
  const toPage = await bedToPage(page)
  const at = await partPoint(page)
  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  const far = toPage(150, 100)
  await page.mouse.move(far.x, far.y, { steps: 6 })
  await expect.poll(() => jogLines(printer.gcode).length).toBeGreaterThanOrEqual(1)
  report(printer, { muon_jog: { active: true, reason: '', sessions: 1, position: [80, 100, 10] } })
  const head = toPage(80, 100)
  await expect.poll(async () => {
    const p = await page.getByTestId('m1-parts').evaluate(el => {
      const line = el.querySelector('[data-tid="m1-drag-target"] line')
      const stage = el.getBoundingClientRect()
      return line ? { x: stage.left + Number(line.getAttribute('x1')), y: stage.top + Number(line.getAttribute('y1')) } : null
    })
    return p ? Math.hypot(p.x - head.x, p.y - head.y) : Infinity
  }).toBeLessThan(4)
  await page.keyboard.press('Escape')
  await page.mouse.up()
  expect(jogLines(printer.gcode).at(-1)).toBe('MUON_JOG STOP=1')
})

test('the printer ending the jog (the contact guard) stops the drag and the label says why', async ({ page, open }) => {
  const printer = await usePrinter(page, streaming([60, 100, 10]))
  await open('/')
  await ready(page)
  await lookDown(page)
  const toPage = await bedToPage(page)
  const at = await partPoint(page)
  await page.mouse.move(at.x, at.y)
  await page.mouse.down()
  const a = toPage(100, 100)
  await page.mouse.move(a.x, a.y, { steps: 6 })
  await expect.poll(() => jogLines(printer.gcode).length).toBeGreaterThanOrEqual(1)
  report(printer, { muon_jog: { active: false, reason: 'refused: Nozzle is touching the plate: lift Z before moving X or Y', sessions: 1, position: null } })
  await expect(page.getByTestId('m1-drag-refused')).toContainText('Nozzle is touching the plate')
  await expect(page.getByTestId('m1-drag-target')).toHaveCount(0)
  const sent = jogLines(printer.gcode).length
  const b = toPage(150, 120)
  await page.mouse.move(b.x, b.y, { steps: 6 })
  await page.mouse.up()
  await page.waitForTimeout(600)
  expect(jogLines(printer.gcode)).toHaveLength(sent)
})
