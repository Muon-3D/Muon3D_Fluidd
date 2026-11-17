/**
 * Jack's 17 Nov walk, printer page:
 * KAN-3593 Home on the toolhead's panel keeps the toolhead selected, its options and its view.
 * KAN-3597 a trackpad's burst of small wheel events is a few knob steps, not a spin.
 * Nothing here moves a printer: the fake answers every script.
 */
import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

test.use({ webgl: true })
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

test('Home on the toolhead\'s panel stays on the toolhead while the printer homes', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  const { parts } = await partsReady(page)
  await page.getByTestId('m1-part-toolhead').focus()
  await expect(parts).toHaveAttribute('data-selected', 'toolhead')
  await expect(page.getByTestId('m1-home')).toBeVisible()

  const release = printer.hold(/^G28/)
  await page.getByTestId('m1-home').click()
  await expect.poll(() => printer.gcode.some(s => s.startsWith('G28'))).toBe(true)
  // The printer reports busy while it homes: the part, its panel and its options are still there.
  printer.report({ ...PRESETS.idleHomed(), idle_timeout: { state: 'Printing' } })
  await page.waitForTimeout(800)
  await expect(parts).toHaveAttribute('data-selected', 'toolhead')
  await expect(page.getByTestId('m1-parts-label')).toHaveAttribute('data-part', 'toolhead')
  await expect(page.getByTestId('m1-home')).toBeVisible()

  release()
  printer.report({ ...PRESETS.idleHomed(), idle_timeout: { state: 'Ready' } })
  await expect(parts).toHaveAttribute('data-selected', 'toolhead')
  await expect(parts).toHaveAttribute('data-interactive', 'on')
})

test('a burst of small trackpad wheel events turns the knob a few steps, not a spin', async ({ page, open, isMobile }) => {
  test.skip(isMobile, 'a wheel scroll is the desktop path')
  await usePrinter(page, PRESETS.idleHomed())
  await page.route('**/panel/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><body style="background:#111">screen</body>' }))
  await open('/')
  const { stage } = await partsReady(page)
  await expect(stage).toHaveAttribute('data-model', /accurate|simple/, { timeout: 60_000 })
  test.skip(await stage.getAttribute('data-model') !== 'accurate', 'the accurate model draws only with the GPU')
  await page.getByTestId('m1-part-screen').focus()
  await page.getByTestId('m1-part-screen').press('Enter')
  await expect(page.getByTestId('m1-screen')).toHaveAttribute('data-phase', 'open')
  const box = (await page.locator('.m1-live__canvas').boundingBox())!
  await page.mouse.move(box.x + 60, box.y + box.height * 0.5)
  // 200 events of 4 px, 800 px of trackpad travel: six steps of 120 px, a step being 15 degrees (0.2618 rad).
  for (let i = 0; i < 200; i++) await page.mouse.wheel(0, 4)
  await expect.poll(async () => Number(await stage.getAttribute('data-knob'))).toBeGreaterThan(0.5)
  await page.waitForTimeout(500)
  expect(Number(await stage.getAttribute('data-knob'))).toBeLessThan(2.1)
})
