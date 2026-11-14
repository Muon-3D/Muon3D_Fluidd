/**
 * Overview, the 3D scene, Jack's second look (11 Nov, KAN-2117 and KAN-2118):
 * the filament goes into the real small hole in the base's wall just round
 * from the knob (not the back of the deck); and the knob is a whole wheel, so
 * scrolling it any distance never leaves a gap, and a click visibly presses it.
 *
 * Nothing here moves the printer: usePrinter answers every script and the
 * tests assert none was sent. The accurate model draws only with the GPU, so
 * these skip without it (as overview-3d-scene-1111.spec.ts does).
 */
import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const GPU = process.platform === 'win32' && !process.env.E2E_NO_GPU
test.use({ launchOptions: { args: GPU ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] : [] } })
test.beforeEach(async ({ page }) => {
  if (!GPU) await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})
test.slow(!GPU, 'software WebGL')

async function partsReady (page: Page): Promise<{ parts: Locator, stage: Locator }> {
  const stage = page.getByTestId('m1-live')
  await expect(stage).toHaveAttribute('data-live', 'on', { timeout: 60_000 })
  const parts = page.getByTestId('m1-parts')
  await expect(parts).toBeAttached()
  return { parts, stage }
}

async function needAccurate (stage: Locator) {
  await expect(stage).toHaveAttribute('data-model', /accurate|simple/, { timeout: 60_000 })
  const model = await stage.getAttribute('data-model')
  test.skip(model !== 'accurate', 'the accurate model draws only with the GPU')
}

async function canvasBox (page: Page) {
  return (await page.locator('.m1-live__canvas').boundingBox())!
}

async function px (stage: Locator, name: string): Promise<{ x: number, y: number }> {
  const [x, y] = ((await stage.getAttribute(name)) ?? '').split(',').map(Number)
  return { x, y }
}

/** Opens the printer's screen, as a person would: the camera flies down onto it, with the knob at its edge. */
async function openScreen (page: Page, isMobile: boolean) {
  await page.route('**/panel/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><body style="background:#111">screen</body>' }))
  if (isMobile) await page.getByTestId('m1-part-screen').tap()
  else {
    await page.getByTestId('m1-part-screen').focus()
    await page.getByTestId('m1-part-screen').press('Enter')
  }
  const screen = page.getByTestId('m1-screen')
  await expect(screen).toHaveAttribute('data-phase', 'open')
  await expect(page.getByTestId('m1-parts')).toHaveAttribute('data-view', 'screen')
  await expect.poll(async () => Number(await page.getByTestId('m1-live').getAttribute('data-camera-phi'))).toBeLessThan(0.05)
}

test('the filament ends in the small hole in the wall round from the knob', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const { stage } = await partsReady(page)
  await needAccurate(stage)
  await expect(stage).toHaveAttribute('data-strand-end', /\d+,\d+/)
  const end = await px(stage, 'data-strand-end')
  const hole = await px(stage, 'data-strand-hole')
  const knob = await px(stage, 'data-knob-at')
  // The strand's last point is drawn in the hole: within a few pixels of it, however the stage is sized.
  expect(Math.hypot(end.x - hole.x, end.y - hole.y)).toBeLessThan(10)
  // And the hole is round the base from the knob, near it on the model and not on top of it.
  const box = await canvasBox(page)
  const apart = Math.hypot(hole.x - knob.x, hole.y - knob.y)
  expect(apart).toBeGreaterThan(8)
  expect(apart).toBeLessThan(box.width * 0.45)
  expect(printer.gcode).toEqual([])
})

test('the knob is a whole wheel: three full turns of scrolling show no gap', async ({ page, open, isMobile }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const { stage } = await partsReady(page)
  await needAccurate(stage)
  await openScreen(page, isMobile)
  // The wheel drawn covers the whole way round (the GLB's arc covers about 130 degrees), before any turn and after.
  await expect.poll(async () => Number(await stage.getAttribute('data-knob-arc'))).toBeGreaterThan(358)
  test.skip(isMobile, 'a wheel scroll is the desktop path')
  const box = await canvasBox(page)
  await page.mouse.move(box.x + 60, box.y + box.height * 0.5)
  // Three full turns: one notch is a 15 degree detent, so 72 notches.
  for (let i = 0; i < 72; i++) await page.mouse.wheel(0, 100)
  await expect.poll(async () => Number(await stage.getAttribute('data-knob')), { timeout: 15_000 }).toBeGreaterThan(18.8)
  await expect(stage).toHaveAttribute('data-knob-arc', /^(35[89]|360)(\.\d)?$/)
  // And back the other way, past the start.
  for (let i = 0; i < 80; i++) await page.mouse.wheel(0, -100)
  await expect.poll(async () => Number(await stage.getAttribute('data-knob')), { timeout: 15_000 }).toBeLessThan(-0.5)
  await expect(stage).toHaveAttribute('data-knob-arc', /^(35[89]|360)(\.\d)?$/)
  expect(printer.gcode).toEqual([])
})

test('a click on the knob presses it in for a moment, and nothing is sent', async ({ page, open, isMobile }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const { stage } = await partsReady(page)
  await needAccurate(stage)
  await openScreen(page, isMobile)
  await expect(stage).toHaveAttribute('data-knob-presses', '0')
  await expect(stage).toHaveAttribute('data-knob-peak', '0.00')
  // The knob's rim is the part outside the screen's disc: click or tap there.
  const box = await canvasBox(page)
  const rim = await px(stage, 'data-knob-rim')
  if (isMobile) await page.touchscreen.tap(box.x + rim.x, box.y + rim.y)
  else await page.mouse.click(box.x + rim.x, box.y + rim.y)
  await expect(stage).toHaveAttribute('data-knob-presses', '1')
  // It went in a few millimetres (the deepest it reached), and came back out.
  await expect.poll(async () => Number(await stage.getAttribute('data-knob-peak')), { timeout: 5_000 }).toBeGreaterThan(1.5)
  await expect(stage).toHaveAttribute('data-knob-pushed', 'off', { timeout: 5_000 })
  // The screen is still open (the click was the knob's), and nothing went to the printer.
  await expect(page.getByTestId('m1-screen')).toHaveAttribute('data-phase', 'open')
  expect(printer.gcode).toEqual([])
})
