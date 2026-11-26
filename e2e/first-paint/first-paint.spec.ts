/**
 * First paint (KAN-5929), flag ON: opening Control shows the rim and the
 * wordmark being printed; the rim follows the printer's real start-up and
 * stops where it stops; the splash leaves when the printer is ready and the
 * wordmark is done, and the real page is there. Run by
 * playwright.first-paint.config.ts (vite started with VITE_CONTROL_FIRST_PAINT=true).
 */
import { test, expect, ready, PRINTER } from '../fixtures'
import { usePrinter, PRESETS } from '../control/printer'
import { allPixels, rimPixels, watch, watched } from './helpers'

const box = '[data-tid=first-paint]'
const STEP_NAMES = ['Opening Control', 'Connecting', 'Asking the printer', 'Starting Klipper', 'Loading the printer', 'Nearly there', 'Ready']

test.beforeEach(async ({ page }) => {
  await watch(page)
})

test('opening Control shows the rim and the wordmark, in the loader\'s place', async ({ page }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.results['server.info'] = { klippy_state: 'startup' }
  await page.goto(PRINTER)
  await expect(page.locator(box)).toBeVisible()
  await expect(page.locator(`${box} canvas`)).toBeVisible()
  await expect(page.getByTestId('first-paint-label')).toHaveText(/\S/)
  // The loader's own bar and wordmark are not drawn under it.
  await expect(page.locator('.muon-loader__bar')).toBeHidden()
  await expect(page.locator('.muon-loader__word')).toBeHidden()
  await expect(page.locator(box)).toHaveAttribute('data-logo', /printing|done/)
})

test('the rim advances with the printer\'s real start-up, and the splash gives way to the real page', async ({ page }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.results['server.info'] = { klippy_state: 'startup' }
  await page.goto(PRINTER)
  await expect(page.locator(box)).toHaveAttribute('data-stage', '2')
  await expect(page.getByTestId('first-paint-label')).toHaveText('Starting Klipper')
  await expect(page.locator(box)).toHaveAttribute('data-target', '0.50')
  // Klipper comes up: the next time Control asks, it is ready.
  delete printer.state.results['server.info']
  await expect(page.locator(box)).toHaveAttribute('data-outcome', 'ready', { timeout: 30_000 })
  await expect(page.locator(box)).toHaveAttribute('data-target', '1.00')
  await ready(page)
  await expect(page.getByTestId('printer-switch')).toContainText('Boxwood')

  const seen = await watched(page)
  // Only real states were named, in order, and the fill never went back.
  expect(seen.labels.length).toBeGreaterThanOrEqual(3)
  for (const label of seen.labels) expect(STEP_NAMES).toContain(label)
  const order = seen.labels.map(l => STEP_NAMES.indexOf(l))
  expect(order).toEqual([...order].sort((a, b) => a - b))
  const targets = seen.targets.map(Number)
  expect(targets).toEqual([...targets].sort((a, b) => a - b))
  expect(targets).toContain(0.5)
  expect(targets[targets.length - 1]).toBe(1)
  expect(seen.labels[seen.labels.length - 1]).toBe('Ready')
})

test('a stalled start stops the fill but the comet keeps lapping', async ({ page }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.results['server.info'] = { klippy_state: 'startup' }
  await page.goto(PRINTER)
  await expect(page.locator(box)).toHaveAttribute('data-logo', 'done', { timeout: 20_000 })
  const target = await page.locator(box).getAttribute('data-target')
  expect(target).toBe('0.50')
  const a = await rimPixels(page)
  await page.waitForTimeout(350)
  const b = await rimPixels(page)
  await page.waitForTimeout(350)
  const c = await rimPixels(page)
  expect(a).not.toBe('')
  expect(new Set([a, b, c]).size).toBeGreaterThan(1)
  // The fill did not creep on while it was stuck, and the splash still holds the page.
  expect(await page.locator(box).getAttribute('data-target')).toBe(target)
  await expect(page.locator('#muon-loader')).toHaveCount(1)
  expect((await watched(page)).labels).not.toContain('Ready')
})

test('a quick start still gives the wordmark its full time', async ({ page }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await page.goto(PRINTER)
  await ready(page)
  const seen = await watched(page)
  expect(seen.shownAt).not.toBeNull()
  expect(seen.goneAt).not.toBeNull()
  // 0.4 s run-in + 3.6 s of printing, from when it was first shown.
  expect(seen.goneAt! - seen.shownAt!).toBeGreaterThanOrEqual(3900)
  expect(seen.labels).toContain('Ready')
})

test('with the printer unreachable the splash hands over to the real screen', async ({ page }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.offline = true
  await page.goto(PRINTER)
  await expect(page.locator('#muon-loader')).toHaveCount(0, { timeout: 30_000 })
  await expect(page.getByTestId('connection-unreachable').or(page.getByTestId('connection-connecting'))).toBeVisible()
  const seen = await watched(page)
  expect(seen.labels).not.toContain('Ready')
  // It did not sit on its wordmark for the print time: this is not a start-up that finished.
  expect(seen.goneAt! - seen.shownAt!).toBeLessThan(15_000)
})

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: the splash is the colour of the page it hands over to`, async ({ page }) => {
    await page.addInitScript(t => { try { localStorage.setItem('muon3d.theme', t) } catch {} }, theme)
    const printer = await usePrinter(page, PRESETS.idleHomed())
    printer.state.results['server.info'] = { klippy_state: 'startup' }
    await page.goto(PRINTER)
    await expect(page.locator(box)).toBeVisible()
    const look = await page.locator('#muon-loader').evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, canvasInside: !!el.querySelector('canvas') }))
    expect(look.canvasInside).toBe(true)
    expect(look.bg).toBe(theme === 'light' ? 'rgb(242, 242, 247)' : 'rgb(0, 0, 0)')
  })
}

test('it fits the screen: no sideways scroll, the rim inside the viewport', async ({ page }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  printer.state.results['server.info'] = { klippy_state: 'startup' }
  await page.goto(PRINTER)
  await expect(page.locator(box)).toBeVisible()
  const view = page.viewportSize()!
  const rect = await page.locator(`${box} canvas`).boundingBox()
  expect(rect!.x).toBeGreaterThanOrEqual(0)
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(view.width)
  expect(rect!.y).toBeGreaterThanOrEqual(0)
  expect(rect!.y + rect!.height).toBeLessThanOrEqual(view.height)
  const label = await page.getByTestId('first-paint-label').boundingBox()
  expect(label!.x).toBeGreaterThanOrEqual(0)
  expect(label!.x + label!.width).toBeLessThanOrEqual(view.width)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test.describe('reduced motion', () => {
  test.use({ colorScheme: 'dark' })

  test('a still rim and the finished wordmark: nothing moves, and it does not wait for the print', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const printer = await usePrinter(page, PRESETS.idleHomed())
    printer.state.results['server.info'] = { klippy_state: 'startup' }
    await page.goto(PRINTER)
    await expect(page.locator(box)).toHaveAttribute('data-stage', '2')
    await expect(page.locator(box)).toHaveAttribute('data-animating', 'false')
    await expect(page.locator(box)).toHaveAttribute('data-logo', 'done')
    const a = await allPixels(page)
    await page.waitForTimeout(700)
    const b = await allPixels(page)
    expect(a).not.toBe('')
    expect(b).toBe(a)
    // Ready: it leaves at once, with no sweep and no wait for a print time.
    delete printer.state.results['server.info']
    const before = Date.now()
    await ready(page)
    expect(Date.now() - before).toBeLessThan(20_000)
    const seen = await watched(page)
    expect(seen.labels).not.toContain('Nearly there')
  })
})
