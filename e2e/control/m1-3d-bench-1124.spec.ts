/**
 * Jack's bench notes on the 3D model, 24 Nov (KAN-5982, KAN-5983, KAN-5984), as a person meets them:
 *
 * - not homed, the stage is not greyed; the "not homed" words stay;
 * - what is selected stays selected when the mouse leaves the stage;
 * - the head glides to a new place, never jumping, never past it or back, and no frame of the stage flashes white
 *   across a move, a homing, or a resize;
 * - looking at the printer's screen, the toolhead and rail go almost clear, and come back.
 *
 * At a desktop width and at 360 and 320 px. Nothing here moves the printer: the mock answers every script and the
 * tests assert none was sent.
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

test.use({ webgl: true })

const GPU = process.platform === 'win32' && !process.env.E2E_NO_GPU
if (GPU) test.use({ launchOptions: { args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] } })
test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})
test.slow(!GPU, 'software WebGL')

/** Where screenshots go, when asked for (KAN5982_SHOTS=dir). */
const SHOTS = process.env.KAN5982_SHOTS
async function shot (page: Page, name: string, width: number) {
  if (!SHOTS) return
  mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: join(SHOTS, `${name}-${width}.png`) })
}

async function ready (page: Page): Promise<{ stage: Locator, parts: Locator, canvas: Locator }> {
  const stage = page.getByTestId('m1-live')
  await expect(stage).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  const parts = page.getByTestId('m1-parts')
  await expect(parts).toBeAttached()
  return { stage, parts, canvas: page.locator('.m1-live__canvas') }
}

async function needAccurate (stage: Locator) {
  await expect(stage).toHaveAttribute('data-model', /accurate|simple/, { timeout: 60_000 })
  test.skip(await stage.getAttribute('data-model') !== 'accurate', 'the accurate model draws only with the GPU')
}

type Json = Record<string, unknown>
const at = (x: number, y: number, z: number, homed = 'xyz'): Json => ({
  toolhead: { homed_axes: homed, position: [x, y, z, 0] },
  gcode_move: { position: [x, y, z, 0], gcode_position: [x, y, z, 0] },
  motion_report: { live_position: [x, y, z, 0], live_velocity: 0 }
})

const WIDTHS = [1440, 360, 320]

for (const width of WIDTHS) {
  test.describe(`at ${width} px`, () => {
    test.use({ viewport: { width, height: width > 600 ? 900 : 760 } })

    test('KAN-5982: not homed, the stage is not greyed, and still says so', async ({ page, open, isMobile }) => {
      test.skip(isMobile, 'the phone project has its own viewport; widths are set here')
      const printer = await usePrinter(page, PRESETS.idleHomed({ homed: '' }))
      await open('/')
      const { stage, parts, canvas } = await ready(page)
      await expect(canvas).toHaveAttribute('data-place', 'unknown')
      // Over the transition's length and after it, the canvas is fully opaque and unfiltered.
      for (const wait of [0, 300, 700]) {
        await page.waitForTimeout(wait)
        const look = await canvas.evaluate(c => { const s = getComputedStyle(c); return { opacity: s.opacity, filter: s.filter } })
        expect(look.opacity).toBe('1')
        expect(look.filter).toBe('none')
      }
      // The words stay: the toolhead's line says not homed.
      await page.getByTestId('m1-part-toolhead').focus()
      await expect(parts).toHaveAttribute('data-selected', 'toolhead')
      await expect(page.getByTestId('m1-parts-label')).toContainText('not homed')
      await page.waitForTimeout(1200)
      await shot(page, 'unhomed-panel', width)
      // Homed, it is as bright as before.
      printer.report(PRESETS.idleHomed())
      await expect(canvas).toHaveAttribute('data-place', 'known')
      expect(await canvas.evaluate(c => getComputedStyle(c).opacity)).toBe('1')
      await expect(stage).toHaveAttribute('data-live', 'on')
      expect(printer.gcode).toEqual([])
    })

    test('KAN-5982: the selection stays when the mouse leaves the stage', async ({ page, open, isMobile }) => {
      test.skip(isMobile, 'a finger has no cursor to move off the stage')
      const printer = await usePrinter(page, PRESETS.idleHomed())
      await open('/')
      const { parts, canvas } = await ready(page)
      await page.getByTestId('m1-part-plate').focus()
      await expect(parts).toHaveAttribute('data-selected', 'plate')
      const box = (await canvas.boundingBox())!
      await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.6, { steps: 3 })
      await page.mouse.move(2, 2, { steps: 5 })
      await page.waitForTimeout(1200)
      await expect(parts).toHaveAttribute('data-selected', 'plate')
      await expect(page.getByTestId('m1-parts-label')).toBeVisible()
      await shot(page, 'selected-after-mouse-out', width)
      // Another part is still picked as before, and Esc still lets it go.
      await page.getByTestId('m1-part-toolhead').focus()
      await expect(parts).toHaveAttribute('data-selected', 'toolhead')
      await page.keyboard.press('Escape')
      await expect(parts).toHaveAttribute('data-selected', '')
      expect(printer.gcode).toEqual([])
    })

    test('KAN-5983: the head glides to a new place, never jumping, past it or back', async ({ page, open, isMobile }) => {
      test.skip(isMobile, 'the phone project has its own viewport; widths are set here')
      const printer = await usePrinter(page, PRESETS.idleHomed({ position: [70, 70, 10] }))
      await open('/')
      const { stage } = await ready(page)
      await needAccurate(stage)
      await expect.poll(() => stage.getAttribute('data-nozzle')).not.toBe('')
      await page.waitForTimeout(1500)
      await page.evaluate(() => {
        const el = document.querySelector('[data-tid="m1-live"]') as HTMLElement
        const seen: Array<{ t: number, x: number, y: number }> = []
        ;(window as unknown as { __seen: typeof seen }).__seen = seen
        const tick = () => {
          const [x, y] = (el.dataset.nozzle ?? ',').split(',').map(Number)
          if (Number.isFinite(x)) seen.push({ t: performance.now(), x, y })
          requestAnimationFrame(tick)
        }
        tick()
      })
      const read = () => page.evaluate(() => (window as unknown as { __seen: Array<{ t: number, x: number, y: number }> }).__seen)
      const start = (await stage.getAttribute('data-nozzle'))!.split(',').map(Number)
      const mark = (await read()).length
      printer.report(at(130, 110, 10))
      await page.waitForTimeout(1800)
      const end = (await stage.getAttribute('data-nozzle'))!.split(',').map(Number)
      const run = (await read()).slice(mark)
      const total = Math.hypot(end[0] - start[0], end[1] - start[1])
      expect(total).toBeGreaterThan(20)
      // Distance still to go, every frame: only ever shrinking (a pixel of rounding allowed), never beyond where it began.
      let prev = total
      let biggest = 0
      for (const s of run) {
        const left = Math.hypot(end[0] - s.x, end[1] - s.y)
        expect(left).toBeLessThanOrEqual(prev + 1.5)
        expect(left).toBeLessThanOrEqual(total + 1.5)
        biggest = Math.max(biggest, prev - left)
        prev = left
      }
      expect(prev).toBeLessThan(1.5)
      // And it was drawn on the way: no single frame covered the whole move.
      expect(biggest).toBeLessThan(total * 0.75)
      expect(run.filter(s => Math.hypot(end[0] - s.x, end[1] - s.y) > 2).length).toBeGreaterThan(2)
      expect(printer.gcode).toEqual([])
    })

    test('KAN-5983: no white frame across a move, a homing or a resize', async ({ page, open, isMobile }) => {
      test.skip(isMobile, 'the phone project has its own viewport; widths are set here')
      const printer = await usePrinter(page, PRESETS.idleHomed({ position: [60, 60, 10], homed: '' }))
      // Watches every frame the stage draws: its mean brightness, the canvas's opacity at that moment, and any resize that
      // empties the canvas without a draw in the same task (the browser would show that as one blank frame).
      await page.addInitScript(() => {
        const w = window as unknown as { __flash: { means: number[], opacity: number[], blank: number } }
        w.__flash = { means: [], opacity: [], blank: 0 }
        let drew = false
        for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
          for (const fn of ['drawElements', 'drawArrays', 'drawElementsInstanced'] as const) {
            const orig = (proto as unknown as Record<string, (...a: unknown[]) => unknown>)[fn]
            if (!orig) continue
            ;(proto as unknown as Record<string, unknown>)[fn] = function (this: unknown, ...a: unknown[]) { drew = true; return orig.apply(this, a) }
          }
        }
        let pending = false
        for (const dim of ['width', 'height'] as const) {
          const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, dim)!
          Object.defineProperty(HTMLCanvasElement.prototype, dim, {
            ...d,
            set (this: HTMLCanvasElement, v: number) {
              d.set!.call(this, v)
              if (!this.classList.contains('m1-live__canvas') || pending) return
              pending = true
              drew = false
              queueMicrotask(() => { if (pending && !drew) w.__flash.blank++; pending = false })
            }
          })
        }
        const small = document.createElement('canvas')
        small.width = 24; small.height = 14
        const ctx = small.getContext('2d', { willReadFrequently: true })!
        const raf = window.requestAnimationFrame.bind(window)
        window.requestAnimationFrame = (cb: FrameRequestCallback) => raf(t => {
          drew = false
          cb(t)
          if (pending && drew) pending = false
          const canvas = document.querySelector('.m1-live__canvas') as HTMLCanvasElement | null
          if (!canvas || !drew) return
          ctx.drawImage(canvas, 0, 0, 24, 14)
          const px = ctx.getImageData(0, 0, 24, 14).data
          let sum = 0
          for (let i = 0; i < px.length; i += 4) sum += (px[i] + px[i + 1] + px[i + 2]) / 3
          w.__flash.means.push(sum / (px.length / 4))
          w.__flash.opacity.push(Number(getComputedStyle(canvas).opacity))
        })
      })
      await open('/')
      const { stage, canvas } = await ready(page)
      await needAccurate(stage)
      await page.waitForTimeout(1500)
      // Homing, an axis at a time, then moves, with the stage resized by a pixel as the layout may do.
      printer.report(at(0, 0, 0, ''))
      await page.waitForTimeout(300)
      printer.report(at(200, 0, 0, 'x'))
      await page.waitForTimeout(300)
      printer.report(at(200, 180, 0, 'xy'))
      await page.waitForTimeout(300)
      printer.report(at(100, 90, 10, 'xyz'))
      await page.waitForTimeout(500)
      for (const [x, y] of [[40, 40], [160, 120], [90, 150]]) {
        printer.report(at(x, y, 10))
        await page.waitForTimeout(250)
        await page.setViewportSize({ width: width + 1, height: page.viewportSize()!.height })
        await page.waitForTimeout(250)
        await page.setViewportSize({ width, height: page.viewportSize()!.height })
        await page.waitForTimeout(250)
      }
      await page.waitForTimeout(800)
      const flash = await page.evaluate(() => (window as unknown as { __flash: { means: number[], opacity: number[], blank: number } }).__flash)
      expect(flash.means.length).toBeGreaterThan(10)
      // No frame the page sees dimmed by the canvas's opacity (the old grey-then-clear flip), and no blank frame.
      for (const o of flash.opacity) expect(o).toBe(1)
      expect(flash.blank).toBe(0)
      // And no spike of brightness: no frame is far above the model's own steady look.
      const sorted = [...flash.means].sort((a, b) => a - b)
      const median = sorted[sorted.length >> 1]
      expect(Math.max(...flash.means)).toBeLessThan(median * 1.3 + 8)
      expect(await canvas.evaluate(c => getComputedStyle(c).opacity)).toBe('1')
      expect(printer.gcode).toEqual([])
    })

    test('KAN-5984: at the panel the toolhead and rail go almost clear, and come back', async ({ page, open, isMobile }) => {
      test.skip(isMobile, 'the phone project has its own viewport; widths are set here')
      const printer = await usePrinter(page, PRESETS.idleHomed())
      await page.route('**/panel/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><body style="background:#111">screen</body>' }))
      await open('/')
      const { stage, parts } = await ready(page)
      await needAccurate(stage)
      await expect(stage).toHaveAttribute('data-head-see', '1.00')
      await page.getByTestId('m1-part-screen').focus()
      await page.getByTestId('m1-part-screen').press('Enter')
      await expect(parts).toHaveAttribute('data-view', 'screen')
      await expect.poll(async () => Number(await stage.getAttribute('data-head-see')), { timeout: 5000 }).toBeLessThanOrEqual(0.15)
      expect(Number(await stage.getAttribute('data-head-see'))).toBeGreaterThanOrEqual(0.08)
      await page.waitForTimeout(600)
      await shot(page, 'panel-see-through', width)
      // Leaving the view brings them back, solid.
      await page.keyboard.press('Escape')
      await expect(parts).toHaveAttribute('data-view', 'free')
      await expect.poll(() => stage.getAttribute('data-head-see'), { timeout: 5000 }).toBe('1.00')
      expect(printer.gcode).toEqual([])
    })
  })
}
