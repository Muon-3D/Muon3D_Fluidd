/**
 * Overview, the 3D scene finished (Jack's 11 Nov notes, KAN-2093..2102): the
 * selection lets go when the pointer leaves the stage; hovering the spool picks
 * the filament; the bed is see-through; a click on the screen flies the camera
 * straight down onto it with the model's knob beside it, and a scroll or a
 * click there turns or presses that knob; the drag's line starts at the nozzle;
 * the camera keeps the nozzle on the stage; the spool is the colour that was set.
 *
 * Nothing here moves the printer: every script the page sends is answered by
 * usePrinter and the tests assert none was sent. The drag test cancels with Esc
 * before it lets go. (Axes inside the reach are overview-3d-scene.spec.ts.)
 */
import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'

const GPU = process.platform === 'win32' && !process.env.E2E_NO_GPU
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})
test.slow(!GPU, 'software WebGL')

const M1_MACROS = {
  'gcode_macro LOAD_FILAMENT': {},
  'gcode_macro UNLOAD_FILAMENT': {},
  configfile: {
    settings: {
      'gcode_macro load_filament': { gcode: 'FILAMENT_INSERT_FLOW {rawparams}' },
      'gcode_macro unload_filament': { gcode: 'M104 S250\nG1 E-30 F3600' }
    }
  }
}

async function partsReady (page: Page): Promise<{ parts: Locator, stage: Locator }> {
  const stage = page.getByTestId('m1-live')
  await expect(stage).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  const parts = page.getByTestId('m1-parts')
  await expect(parts).toBeAttached()
  return { parts, stage }
}

async function canvasBox (page: Page) {
  return (await page.locator('.m1-live__canvas').boundingBox())!
}

/** The accurate model draws only where the GPU does; its parts (knob, nozzle, spool colour, glass) are what these read. */
async function needAccurate (stage: Locator) {
  await expect(stage).toHaveAttribute('data-model', /accurate|simple/, { timeout: 60_000 })
  const model = await stage.getAttribute('data-model')
  test.skip(model !== 'accurate', 'the accurate model draws only with the GPU')
}

/** Sweeps the stage for the spool or the hose, until the pointer lights the filament. */
async function findFilament (page: Page, parts: Locator): Promise<{ x: number, y: number }> {
  const box = await canvasBox(page)
  for (let y = box.y + box.height * 0.2; y < box.y + box.height * 0.95; y += 30) {
    for (let x = box.x + box.width * 0.2; x < box.x + box.width * 0.85; x += 30) {
      await page.mouse.move(x, y)
      await page.waitForTimeout(50)
      await page.mouse.move(x + 1, y)
      await page.waitForTimeout(70)
      if (await parts.getAttribute('data-hovered') === 'filament') return { x: x + 1, y }
    }
  }
  throw new Error('the filament never lit anywhere on the stage')
}

test('the selection lets go when the pointer leaves the stage, but not onto its own panel', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'a finger has no cursor to move off the stage')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const { parts } = await partsReady(page)
  await page.getByTestId('m1-part-plate').focus()
  await expect(parts).toHaveAttribute('data-selected', 'plate')
  const label = page.getByTestId('m1-parts-label')
  await expect(label).toBeVisible()

  // The pointer crosses the stage and goes onto the panel: still selected.
  const box = await canvasBox(page)
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.7)
  const l = (await label.boundingBox())!
  await page.mouse.move(l.x + l.width / 2, l.y + 6, { steps: 6 })
  await page.waitForTimeout(400)
  await expect(parts).toHaveAttribute('data-selected', 'plate')

  // Back over the model, then off it altogether: it lets go.
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.7, { steps: 4 })
  await expect(parts).toHaveAttribute('data-selected', 'plate')
  await page.mouse.move(5, 5, { steps: 4 })
  await expect(parts).toHaveAttribute('data-selected', '')
  expect(printer.gcode).toEqual([])
})

test('hovering the spool picks the filament and opens its panel; moving away lets go', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'hover is a desktop pointer thing; the phone taps the filament chip')
  const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), M1_MACROS))
  await open('/')
  const { parts } = await partsReady(page)
  await expect(parts).toHaveAttribute('data-interactive', 'on')
  await expect(parts).toHaveAttribute('data-selected', '')

  await findFilament(page, parts)
  // No click: pointing is enough.
  await expect(parts).toHaveAttribute('data-selected', 'filament')
  await expect(page.getByTestId('m1-options-filament')).toBeVisible()
  await expect(page.getByTestId('m1-load')).toBeEnabled()
  expect(printer.gcode).toEqual([])

  // To the panel and it stays, however long it takes to get there.
  // (The panel follows the part while the camera eases, so aim at where it has settled.) GPU only: on CI's
  // software WebGL a frame can take longer than the settle poll, so the panel is still moving when the pointer
  // lands and the test aims at where it was (failed on develop at 7cb99348, run 43527570409). The pick and the
  // let-go above and below still run everywhere.
  if (GPU) {
    const labelBox = async () => (await page.getByTestId('m1-parts-label').boundingBox())!
    let label = await labelBox()
    await expect.poll(async () => { const b = await labelBox(); const same = b.x === label.x && b.y === label.y; label = b; return same }, { intervals: [300] }).toBe(true)
    await page.mouse.move(label.x + label.width / 2, label.y + label.height / 2, { steps: 5 })
    await page.waitForTimeout(1000)
    await expect(parts).toHaveAttribute('data-selected', 'filament')
  }

  // Off the panel and off the stage: it lets go.
  await page.mouse.move(5, 5, { steps: 4 })
  await expect(parts).toHaveAttribute('data-selected', '')
  expect(printer.gcode).toEqual([])
})

test('pointing at the spool and passing on lets go of it after a moment', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'hover is a desktop pointer thing')
  await usePrinter(page, overlay(PRESETS.idleHomed(), M1_MACROS))
  await open('/')
  const { parts } = await partsReady(page)
  await findFilament(page, parts)
  await expect(parts).toHaveAttribute('data-selected', 'filament')
  // Onto empty stage (the bottom left corner is the backdrop) and the pick goes after its grace.
  const box = await canvasBox(page)
  await page.mouse.move(box.x + 6, box.y + box.height - 6, { steps: 3 })
  await expect(parts).toHaveAttribute('data-selected', '', { timeout: 4000 })
})

test('on a phone, the filament chip picks the filament (a finger does not hover)', async ({ page, open, isMobile }) => {
  test.skip(!isMobile, 'the chip row is the touch path')
  await usePrinter(page, overlay(PRESETS.idleHomed(), M1_MACROS))
  await open('/')
  const { parts } = await partsReady(page)
  await page.getByTestId('m1-part-filament').tap()
  await expect(parts).toHaveAttribute('data-selected', 'filament')
  await expect(page.getByTestId('m1-options-filament')).toBeVisible()
  // And the selection is still there a moment later: nothing moved off the stage.
  await page.waitForTimeout(1200)
  await expect(parts).toHaveAttribute('data-selected', 'filament')
})

test('the bed is see-through', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const { stage } = await partsReady(page)
  await needAccurate(stage)
  await expect.poll(async () => Number(await stage.getAttribute('data-plate-see') || 0)).toBeGreaterThanOrEqual(0.85)
})

test('a click on the screen flies the camera straight down onto it, and a scroll turns the model knob', async ({ page, open, isMobile }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await page.route('**/panel/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><body style="background:#111">screen</body>' }))
  await open('/')
  const { parts, stage } = await partsReady(page)
  await needAccurate(stage)
  await expect(stage).toHaveAttribute('data-knob', '0.00')

  if (isMobile) await page.getByTestId('m1-part-screen').tap()
  else {
    await page.getByTestId('m1-part-screen').focus()
    await page.getByTestId('m1-part-screen').press('Enter')
  }
  const screen = page.getByTestId('m1-screen')
  await expect(screen).toHaveAttribute('data-phase', 'open')
  // The camera flew in: straight down onto the screen, and the live screen sits on the model's own.
  await expect(parts).toHaveAttribute('data-view', 'screen')
  await expect(screen).toHaveAttribute('data-camera', 'on')
  await expect.poll(async () => Number(await stage.getAttribute('data-camera-phi'))).toBeLessThan(0.05)

  const box = await canvasBox(page)
  if (!isMobile) {
    // A scroll over the model, outside the screen's disc, turns the knob (down is clockwise: positive).
    await page.mouse.move(box.x + 60, box.y + box.height * 0.5)
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 100)
    await expect.poll(async () => Number(await stage.getAttribute('data-knob'))).toBeGreaterThan(0.8)
    await page.mouse.wheel(0, -100)
    await expect.poll(async () => Number(await stage.getAttribute('data-knob'))).toBeLessThan(1.05)
  }

  // (The knob sits under the live screen, so its press is the picture's: pressKnob, covered by the unit specs; it cannot be clicked here.)
  // A click elsewhere on the model leaves it, flying back out.
  if (isMobile) await page.touchscreen.tap(box.x + 12, box.y + box.height - 40)
  else await page.mouse.click(box.x + 12, box.y + box.height * 0.5)
  await expect(screen).toBeHidden()
  await expect(parts).toHaveAttribute('data-view', 'free')
  // The knob stays where it was turned and nothing went to the printer.
  expect(printer.gcode).toEqual([])
})

test('the drag line starts at the nozzle, not at the label line', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'pointer drags are the desktop path')
  test.skip(!GPU, 'drags need the GPU; software WebGL stalls on the accurate model')
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 100, 10] }))
  await open('/')
  const { parts, stage } = await partsReady(page)
  await needAccurate(stage)
  await page.getByTestId('m1-part-toolhead').focus()
  await expect(parts).toHaveAttribute('data-view', 'top')
  await page.waitForTimeout(1200)
  const dot = await page.locator('.m1-parts__leader circle').evaluate(c => ({ x: Number(c.getAttribute('cx')), y: Number(c.getAttribute('cy')) }))
  const box = await canvasBox(page)
  await page.mouse.move(box.x + dot.x, box.y + dot.y)
  await page.mouse.down()
  await page.mouse.move(box.x + dot.x + 40, box.y + dot.y + 6, { steps: 4 })
  await page.mouse.move(box.x + dot.x + 80, box.y + dot.y + 12, { steps: 4 })
  const target = page.getByTestId('m1-drag-target')
  await expect(target).toBeVisible()
  await page.waitForTimeout(300)
  const from = await target.locator('line').evaluate(l => ({ x: Number(l.getAttribute('x1')), y: Number(l.getAttribute('y1')) }))
  const [nx, ny] = (await stage.getAttribute('data-nozzle'))!.split(',').map(Number)
  // The line starts where the nozzle is drawn.
  expect(Math.hypot(from.x - nx, from.y - ny)).toBeLessThan(4)
  // And that is not where the label's own line starts (the part's middle).
  expect(Math.hypot(from.x - dot.x, from.y - dot.y)).toBeGreaterThan(6)
  // Esc drops the drag and sends nothing.
  await page.keyboard.press('Escape')
  await page.mouse.up()
  expect(printer.gcode).toEqual([])
  expect(printer.moves()).toEqual([])
})

test('the camera keeps the nozzle on the stage as the head runs to every corner', async ({ page, open, isMobile }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed({ position: [100, 90, 10] }))
  await open('/')
  const { stage } = await partsReady(page)
  await needAccurate(stage)
  if (isMobile) await page.getByTestId('m1-part-toolhead').tap()
  else await page.getByTestId('m1-part-toolhead').focus()
  await page.waitForTimeout(1500)

  // Sampled in the page, every animation frame, so a head that leaves the picture and comes back is seen.
  await page.evaluate(() => {
    const el = document.querySelector('[data-tid="m1-live"]') as HTMLElement
    const canvas = el.querySelector('canvas') as HTMLCanvasElement
    const seen: Array<{ x: number, y: number, w: number, h: number }> = []
    ;(window as unknown as { __nozzle: typeof seen }).__nozzle = seen
    const tick = () => {
      const at = el.dataset.nozzle
      if (at) {
        const [x, y] = at.split(',').map(Number)
        seen.push({ x, y, w: canvas.clientWidth, h: canvas.clientHeight })
      }
      requestAnimationFrame(tick)
    }
    tick()
  })
  const corners: Array<[number, number]> = [[0, 0], [200, 0], [200, 180], [0, 180], [100, 90]]
  for (const [x, y] of corners) {
    printer.report({ toolhead: { position: [x, y, 10, 0] }, gcode_move: { position: [x, y, 10, 0], gcode_position: [x, y, 10, 0] }, motion_report: { live_position: [x, y, 10, 0], live_velocity: 0 } })
    await page.waitForTimeout(1600)
    const [nx, ny] = (await stage.getAttribute('data-nozzle'))!.split(',').map(Number)
    const box = await canvasBox(page)
    // At rest in each corner it is well inside the stage.
    expect(nx).toBeGreaterThan(box.width * 0.03)
    expect(nx).toBeLessThan(box.width * 0.97)
    expect(ny).toBeGreaterThan(box.height * 0.03)
    expect(ny).toBeLessThan(box.height * 0.97)
  }
  const samples = await page.evaluate(() => (window as unknown as { __nozzle: Array<{ x: number, y: number, w: number, h: number }> }).__nozzle)
  expect(samples.length).toBeGreaterThan(20)
  // And never off the stage at any frame on the way.
  for (const s of samples) {
    expect(s.x).toBeGreaterThanOrEqual(0)
    expect(s.x).toBeLessThanOrEqual(s.w)
    expect(s.y).toBeGreaterThanOrEqual(0)
    expect(s.y).toBeLessThanOrEqual(s.h)
  }
  expect(printer.gcode).toEqual([])
})

test('the spool is the colour that was set, and follows a change', async ({ page, open }) => {
  const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), {
    save_variables: { variables: { muon_material: 'PLA', muon_material_colour: '2255cc' } }
  }))
  await open('/')
  const { stage } = await partsReady(page)
  await needAccurate(stage)
  await expect(stage).toHaveAttribute('data-filament-colour', '#2255cc')
  printer.report({ save_variables: { variables: { muon_material: 'PLA', muon_material_colour: 'cc3311' } } })
  await expect(stage).toHaveAttribute('data-filament-colour', '#cc3311')
  expect(printer.gcode).toEqual([])
})
