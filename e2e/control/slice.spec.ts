/**
 * Slice: the Muon3D Slicer is the page. Its frame fills the height under the
 * bar and the width beside the rail, with no heading, chips or card of
 * Control's own (route meta fullPage): the slicer names the printer and its
 * material in its own Setup card, as slicer.muon3d.com does.
 *
 * The slicer is this origin's /slicer/embed.html, answered per test: a page
 * marked as embeddable (the slicer is there), held back (it is opening), or a
 * 404 (it isn't there). The fake never says hello, so it shows as an older
 * slicer does, 3 s after it loads.
 */
import type { Page, Route } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const EMBED_HTML = '<!doctype html><html><head><meta name="muon3d-embed-hosts" content="\'self\'"><title>Muon3D Slicer</title></head><body style="margin:0;background:#123"><p id="fake-slicer" style="color:#fff">Fake slicer</p></body></html>'

/** Answers /slicer/embed.html: there, missing, or (for the frame) only once `release` is called. */
async function serveSlicer (page: Page, kind: 'present' | 'absent' | 'held') {
  let release = () => {}
  const held = new Promise<void>(resolve => { release = resolve })
  await page.route('**/slicer/embed.html*', async (route: Route) => {
    if (kind === 'absent') return route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' })
    if (kind === 'held' && route.request().resourceType() === 'document') await held
    return route.fulfill({ status: 200, contentType: 'text/html', body: EMBED_HTML })
  })
  return release
}

const frame = (page: Page) => page.getByTestId('slice-view').locator('iframe[title="Muon3D Slicer"]')

test('the slicer is the page: under the bar, beside the rail, to the window\'s right and bottom edges', async ({ page, open, isMobile }) => {
  await serveSlicer(page, 'present')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/slice')
  await expect(page.getByTestId('page-title')).toHaveText('Slice')
  await expect(frame(page)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('slice-opening')).toHaveCount(0)
  await expect(page.frameLocator('iframe[title="Muon3D Slicer"]').locator('#fake-slicer')).toHaveText('Fake slicer')
  // No heading, chips or card of Control's own: the slicer names the printer itself.
  await expect(page.getByTestId('slice-tile')).toHaveCount(0)
  await expect(page.getByTestId('slice-printer')).toHaveCount(0)

  const view = page.viewportSize()!
  const box = (await frame(page).boundingBox())!
  const bar = (await page.locator('.v-app-bar').first().boundingBox())!
  expect(Math.abs(box.y - (bar.y + bar.height))).toBeLessThanOrEqual(1)
  expect(Math.abs(box.x + box.width - view.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(box.y + box.height - view.height)).toBeLessThanOrEqual(1)
  if (isMobile) expect(box.x).toBeLessThanOrEqual(1)
  else {
    const rail = (await page.locator('nav').first().boundingBox())!
    expect(Math.abs(box.x - (rail.x + rail.width))).toBeLessThanOrEqual(1)
  }
  // The page itself does not scroll.
  expect(await page.evaluate(() => document.scrollingElement!.scrollHeight <= window.innerHeight + 1)).toBe(true)
  // Fluidd starts no print of its own: that only comes from its confirm, when the slicer asks.
  expect(printer.called('printer.print.start')).toHaveLength(0)
})

test('opening: the page says so until the slicer has loaded', async ({ page, open }) => {
  const release = await serveSlicer(page, 'held')
  await usePrinter(page, PRESETS.idleHomed())
  await open('/slice')
  await expect(page.getByTestId('slice-opening')).toHaveText('Opening the slicer…')
  await expect(frame(page)).toBeHidden()
  release()
  await expect(page.getByTestId('slice-opening')).toHaveCount(0, { timeout: 20_000 })
  await expect(frame(page)).toBeVisible()
})

test('no slicer: the page says so, Look again frames it once it is there, and Slice is not in the pages', async ({ page, open, isMobile }) => {
  let there = false
  await page.route('**/slicer/embed.html*', route => there
    ? route.fulfill({ status: 200, contentType: 'text/html', body: EMBED_HTML })
    : route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' }))
  await usePrinter(page, PRESETS.idleHomed())
  await open('/slice')
  const missing = page.getByTestId('slice-missing')
  await expect(missing).toContainText('The slicer isn\'t here')
  await expect(missing).toContainText('The Muon3D Slicer is not available here yet.')
  await expect(frame(page)).toHaveCount(0)
  if (!isMobile) await expect(page.locator('nav').getByRole('link', { name: 'Slice', exact: true })).toHaveCount(0)

  there = true
  await missing.getByRole('button', { name: 'Look again' }).click()
  await expect(missing).toHaveCount(0)
  await expect(frame(page)).toBeVisible({ timeout: 20_000 })
})

test('/slice with a printer open is that printer\'s Slice', async ({ page }) => {
  await serveSlicer(page, 'present')
  await usePrinter(page, PRESETS.idleHomed())
  await page.goto('/slice')
  await expect(page).toHaveURL(/\/boxwood-367a\/slice$/)
  await expect(frame(page)).toBeVisible({ timeout: 20_000 })
})

test('offline: the slicer stays open with its plates, and is still there when the printer comes back', async ({ page, open }) => {
  await serveSlicer(page, 'present')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/slice')
  await expect(frame(page)).toBeVisible({ timeout: 20_000 })
  await printer.offline()
  await expect(frame(page)).toBeVisible()
  await expect(page.frameLocator('iframe[title="Muon3D Slicer"]').locator('#fake-slicer')).toHaveText('Fake slicer')
  printer.online()
  await expect(frame(page)).toBeVisible()
  await expect(page.frameLocator('iframe[title="Muon3D Slicer"]').locator('#fake-slicer')).toHaveText('Fake slicer')
})
