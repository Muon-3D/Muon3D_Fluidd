/**
 * Settings › G-code preview and 3D: the 3D printer on Overview (shown or
 * not, its detail and glass, the print growing on it), one Animations
 * switch that follows the device's reduce-motion until set, and the camera
 * on the stage. These are this person's, on this device: kept in the
 * browser, not in Moonraker, and the Overview follows them.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { PRESETS, usePrinter, type PrinterHandle } from './printer'

const KEY = 'muon3d.model3d'
const CAMERA = {
  name: 'Bed',
  enabled: true,
  service: 'mjpegstreamer-adaptive',
  target_fps: 15,
  target_fps_idle: 5,
  stream_url: '/webcam/?action=stream',
  snapshot_url: '/webcam/?action=snapshot',
  flip_horizontal: false,
  flip_vertical: false,
  rotation: 0,
  aspect_ratio: '4:3',
  source: 'database',
  uid: 'bed-1'
}

async function openPreviewSettings (page: Page, open: (path: string) => Promise<void>) {
  await open('/settings#gcodePreview')
  await expect(page.getByTestId('model-settings')).toBeVisible()
}

/** What this device has kept for the 3D printer. */
function kept (page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '{}'), KEY)
}

/** Nothing about the 3D printer went to Moonraker. */
function noneSaved (printer: PrinterHandle) {
  expect(printer.called('server.database.post_item').filter(p => /model|printGrowing|animations|opensOn/i.test(String(p.key)))).toEqual([])
}

const stage = (page: Page) => page.getByTestId('m1-live')
const canvas = (page: Page) => stage(page).locator('canvas.m1-live__canvas')

interface GlProbe { draws: number, lastDraw: number, viewport: { width: number, shown: number } | null }

/**
 * Watches the WebGL the page draws with, from the browser's own calls, so it
 * measures the same in CI's software WebGL as on a GPU: how many draw calls
 * were made and when the last was, and the pixel width the model was drawn at
 * against the width it is shown at (the canvas may be parked again by the time
 * a test looks, so the canvas itself is not read).
 */
function probeGl (page: Page) {
  return page.addInitScript(() => {
    const probe: GlProbe = { draws: 0, lastDraw: 0, viewport: null }
    ;(window as unknown as { __gl: GlProbe }).__gl = probe
    for (const proto of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype]) {
      for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced'] as const) {
        const draw = proto[name] as (...a: unknown[]) => void
        proto[name] = function (this: WebGLRenderingContext, ...a: unknown[]) {
          probe.draws++
          probe.lastDraw = performance.now()
          return draw.apply(this, a)
        } as never
      }
      const viewport = proto.viewport
      proto.viewport = function (this: WebGLRenderingContext, x: number, y: number, w: number, h: number) {
        const c = this.canvas as HTMLCanvasElement
        if (c.className === 'm1-live__canvas' && c.clientWidth > 0) probe.viewport = { width: w, shown: c.clientWidth }
        return viewport.call(this, x, y, w, h)
      }
    }
  })
}
const probe = (page: Page) => page.evaluate(() => (window as unknown as { __gl: GlProbe }).__gl)
/** Pixels drawn per CSS pixel, once the model has drawn. */
const pixelRatio = async (page: Page) => {
  const v = (await probe(page)).viewport
  return v ? v.width / v.shown : 0
}
/** The simple model, so a headless browser without the real GPU still draws one. */
const simpleModel = (page: Page) => page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
const active = /v-btn--active/
const showModel = (page: Page) => page.getByRole('switch', { name: 'Show the 3D printer' })

test('the storyboard\'s rows, at their defaults: shown, Auto, Auto, growing, Like this device, opens on 3D', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await openPreviewSettings(page, open)
  await expect(showModel(page)).toBeChecked()
  await expect(page.getByTestId('model-detail-auto')).toHaveClass(active)
  await expect(page.getByTestId('model-detail-medium')).toHaveCount(0)
  await expect(page.getByTestId('model-glass-auto')).toHaveClass(active)
  await expect(page.getByRole('switch', { name: 'Show the print growing on the model' })).toBeChecked()
  await expect(page.getByTestId('model-animations-device')).toHaveClass(active)
  await expect(page.getByTestId('opens-on-3d')).toHaveClass(active)
  await expect(page.getByRole('switch', { name: 'Camera button on Overview' })).toBeVisible()
  // One Animations switch, and the camera row moved here from General.
  await expect(page.getByText('Show animations')).toHaveCount(0)
  await open('/settings#general')
  await expect(page.getByText('Camera switch on Overview')).toHaveCount(0)
})

test('detail Low and glass Plain are kept on this device, after a reload, and the Overview model draws with them', async ({ page, open }) => {
  await simpleModel(page)
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await openPreviewSettings(page, open)
  await page.getByTestId('model-detail-low').click()
  await page.getByTestId('model-glass-plain').click()
  await expect.poll(() => kept(page)).toMatchObject({ detail: 'low', glass: 'plain' })

  await page.reload()
  await expect(page.getByTestId('model-detail-low')).toHaveClass(active, { timeout: 60_000 })
  await expect(page.getByTestId('model-glass-plain')).toHaveClass(active)

  await open('/')
  await expect(stage(page)).toHaveAttribute('data-detail', 'low')
  await expect(stage(page)).toHaveAttribute('data-glass', 'plain')
  noneSaved(printer)
})

test.describe('on a 2x screen, the model draws with the detail asked for', () => {
  test.use({ deviceScaleFactor: 2 })

  test('Low draws one pixel per pixel; Auto draws two', async ({ page, open }) => {
    await simpleModel(page)
    await probeGl(page)
    await usePrinter(page, PRESETS.idleHomed(), { database: true })
    await open('/')
    await expect(stage(page)).toHaveAttribute('data-model', 'simple', { timeout: 60_000 })
    expect(await page.evaluate(() => window.devicePixelRatio)).toBe(2)
    await expect.poll(() => pixelRatio(page)).toBeGreaterThan(0)
    const shown = (await probe(page)).viewport!.shown
    expect(await pixelRatio(page)).toBeCloseTo(shown >= 600 ? 2 : 1.5, 1)

    await openPreviewSettings(page, open)
    await page.getByTestId('model-detail-low').click()
    await open('/')
    await expect(stage(page)).toHaveAttribute('data-detail', 'low')
    await expect(stage(page)).toHaveAttribute('data-model', 'simple', { timeout: 60_000 })
    await expect.poll(() => pixelRatio(page)).toBeGreaterThan(0)
    expect(await pixelRatio(page)).toBeCloseTo(1, 1)
  })
})

test('detail High asks for the accurate model, and Auto comes back as it was', async ({ page, open }) => {
  await simpleModel(page)
  await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await openPreviewSettings(page, open)
  await page.getByTestId('model-detail-high').click()
  await page.getByTestId('model-glass-real').click()
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-detail', 'high')
  await expect(stage(page)).toHaveAttribute('data-glass', 'real')
  await openPreviewSettings(page, open)
  await page.getByTestId('model-detail-auto').click()
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-detail', 'auto')
})

test('the 3D printer off, with no camera, shows the still picture on Overview', async ({ page, open }) => {
  await simpleModel(page)
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-show-model', 'on')
  // On, the model is really drawn, so the Off below is a change in what is on screen.
  await expect(stage(page)).toHaveAttribute('data-model', 'simple', { timeout: 60_000 })
  await expect(canvas(page)).toHaveCount(1)

  await openPreviewSettings(page, open)
  await showModel(page).click({ force: true })
  await expect(showModel(page)).not.toBeChecked()
  await expect.poll(() => kept(page)).toMatchObject({ show: false })
  await page.reload()
  await expect(showModel(page)).not.toBeChecked({ timeout: 60_000 })

  await open('/')
  await expect(stage(page)).toHaveAttribute('data-show-model', 'off')
  // No model at all: no canvas, nothing drawn, and the stage never says which model it drew.
  await expect(stage(page).locator('canvas')).toHaveCount(0)
  await expect(stage(page).locator('.m1-live__slot')).toHaveCount(0)
  await expect(stage(page)).not.toHaveAttribute('data-model', /.+/)
  await expect(stage(page)).toHaveAttribute('data-live', 'off')
  await expect(page.getByTestId('overview-stage')).toBeVisible()
  await expect(page.getByTestId('stage-camera')).toHaveCount(0)
  noneSaved(printer)
})

test('the 3D printer off, with a camera, shows the camera on Overview', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  printer.state.results['server.webcams.list'] = { webcams: [CAMERA] }
  await openPreviewSettings(page, open)
  await showModel(page).click({ force: true })
  await open('/')
  await expect(page.getByTestId('stage-camera')).toBeVisible()
  await expect(page.getByTestId('view-toggle')).toHaveCount(0)
})

test('Opens on Camera is kept, and Overview opens on the camera', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  printer.state.results['server.webcams.list'] = { webcams: [CAMERA] }
  await open('/')
  await expect(page.getByTestId('view-toggle')).toBeVisible()
  await expect(page.getByTestId('stage-camera')).toHaveCount(0)
  await openPreviewSettings(page, open)
  await page.getByTestId('opens-on-camera').click()
  await expect.poll(() => kept(page)).toMatchObject({ opensOn: 'camera' })
  await open('/')
  await expect(page.getByTestId('stage-camera')).toBeVisible()
})

test('with reduce motion set, Like this device doesn\'t animate; On does, and is kept', async ({ page, open }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-animations', 'off')
  await expect(stage(page)).toHaveClass(/m1-live--still/)

  await openPreviewSettings(page, open)
  await page.getByTestId('model-animations-on').click()
  await expect.poll(() => kept(page)).toMatchObject({ animations: true })
  await page.reload()
  await expect(page.getByTestId('model-animations-on')).toHaveClass(active, { timeout: 60_000 })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-animations', 'on')
  await expect(stage(page)).not.toHaveClass(/m1-live--still/)
})

test('animations Off stops the model animating with full motion too: the still class, and no frame loop once it has settled', async ({ page, open }) => {
  await simpleModel(page)
  await probeGl(page)
  await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-animations', 'on')
  await expect(stage(page)).not.toHaveClass(/m1-live--still/)
  await openPreviewSettings(page, open)
  await page.getByTestId('model-animations-off').click()
  await expect.poll(() => kept(page)).toMatchObject({ animations: false })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-animations', 'off')
  await expect(stage(page)).toHaveClass(/m1-live--still/)
  await expect(stage(page)).toHaveAttribute('data-model', 'simple', { timeout: 60_000 })
  // Settled: the page's own clock says the last draw call was over 400 ms ago (waited for in the page, not guessed at)...
  await page.waitForFunction(() => {
    const gl = (window as unknown as { __gl: GlProbe }).__gl
    return gl.draws > 0 && performance.now() - gl.lastDraw > 400
  }, undefined, { timeout: 30_000 })
  // ...and then nothing moves, so over a whole second the model makes no draw call at all.
  const settled = (await probe(page)).draws
  await page.evaluate(() => new Promise<void>(resolve => setTimeout(resolve, 1000)))
  expect((await probe(page)).draws).toBe(settled)
})

test('the print growing turned off is kept', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await openPreviewSettings(page, open)
  const growing = page.getByRole('switch', { name: 'Show the print growing on the model' })
  await growing.click({ force: true })
  await expect(growing).not.toBeChecked()
  await expect.poll(() => kept(page)).toMatchObject({ printGrowing: false })
})

test('error: settings this device can\'t read come back as the defaults, and the page still works', async ({ page, open }) => {
  await page.addInitScript(key => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(key, '{not json')
      sessionStorage.setItem('seeded', '1')
    }
  }, KEY)
  await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await openPreviewSettings(page, open)
  await expect(page.getByTestId('model-detail-auto')).toHaveClass(active)
  await page.getByTestId('model-detail-high').click()
  await expect.poll(() => kept(page)).toMatchObject({ detail: 'high' })
})

test('offline: with the printer gone the settings page keeps its view, held still, and nothing is saved', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await openPreviewSettings(page, open)
  await printer.offline()
  await expect(page.getByText('Reconnecting', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('model-detail-auto')).toHaveClass(active)
  await expect(page.locator('[inert]').getByTestId('model-settings')).toBeVisible()
  noneSaved(printer)
})

test('offline: with the printer gone, the Overview model stops drawing live', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-show-model', 'on')
  await printer.offline()
  await expect(page.getByText('Reconnecting', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(stage(page)).toHaveAttribute('data-live', 'off')
  noneSaved(printer)
})
