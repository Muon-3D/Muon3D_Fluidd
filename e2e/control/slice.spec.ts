/**
 * Slice: the Muon3D Slicer framed in a 12-column tile, under a page header
 * that names the printer it slices for and what that printer has loaded.
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

const frame = (page: Page) => page.getByTestId('slice-tile').locator('iframe[title="Muon3D Slicer"]')

test('the slicer, framed in a tile under a header naming the printer it slices for', async ({ page, open, isMobile }) => {
  await serveSlicer(page, 'present')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/slice')
  await expect(page.getByTestId('page-title')).toHaveText('Slice')
  await expect(page.getByTestId('slice-printer')).toHaveText('Boxwood')
  await expect(frame(page)).toBeVisible({ timeout: 20_000 })
  await expect(page.getByTestId('slice-status')).toHaveText('Ready')
  await expect(page.frameLocator('iframe[title="Muon3D Slicer"]').locator('#fake-slicer')).toHaveText('Fake slicer')
  if (!isMobile) await expect(page.getByText('slices for Boxwood and sends the print to it')).toBeVisible()

  // The frame sits inside the tile, the tile fills the page's width below the header.
  const tile = await page.getByTestId('slice-tile').boundingBox()
  const box = await frame(page).boundingBox()
  const head = await page.getByTestId('page-title').boundingBox()
  expect(box!.x).toBeGreaterThanOrEqual(tile!.x)
  expect(box!.y).toBeGreaterThan(tile!.y)
  expect(box!.x + box!.width).toBeLessThanOrEqual(tile!.x + tile!.width + 1)
  expect(tile!.y).toBeGreaterThan(head!.y + head!.height)
  expect(box!.height).toBeGreaterThan(isMobile ? 400 : 500)
  // Fluidd starts no print of its own: that only comes from its confirm, when the slicer asks.
  expect(printer.called('printer.print.start')).toHaveLength(0)
})

test('opening: the tile says so until the slicer has loaded', async ({ page, open }) => {
  const release = await serveSlicer(page, 'held')
  await usePrinter(page, PRESETS.idleHomed())
  await open('/slice')
  await expect(page.getByTestId('slice-opening')).toHaveText('Opening the slicer…')
  await expect(page.getByTestId('slice-status')).toHaveText('Opening')
  await expect(frame(page)).toBeHidden()
  release()
  await expect(page.getByTestId('slice-opening')).toHaveCount(0, { timeout: 20_000 })
  await expect(frame(page)).toBeVisible()
  await expect(page.getByTestId('slice-status')).toHaveText('Ready')
})

test('no slicer: the tile says so, Look again frames it once it is there, and Slice is not in the pages', async ({ page, open, isMobile }) => {
  let there = false
  await page.route('**/slicer/embed.html*', route => there
    ? route.fulfill({ status: 200, contentType: 'text/html', body: EMBED_HTML })
    : route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' }))
  await usePrinter(page, PRESETS.idleHomed())
  await open('/slice')
  const missing = page.getByTestId('slice-missing')
  await expect(missing).toContainText('The slicer isn\'t here')
  await expect(missing).toContainText('The Muon3D Slicer is not available here yet.')
  await expect(page.getByTestId('slice-status')).toHaveText('Not found')
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
  await expect(page.getByTestId('slice-printer')).toHaveText('Boxwood')
  await expect(frame(page)).toBeVisible({ timeout: 20_000 })
})

test('offline: the printer chip says so, the slicer stays open, and it comes back by itself', async ({ page, open }) => {
  await serveSlicer(page, 'present')
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/slice')
  await expect(frame(page)).toBeVisible({ timeout: 20_000 })
  await printer.offline()
  await expect(page.getByTestId('slice-printer')).toHaveText('Boxwood · offline', { timeout: 20_000 })
  await expect(frame(page)).toBeVisible()
  await expect(page.frameLocator('iframe[title="Muon3D Slicer"]').locator('#fake-slicer')).toHaveText('Fake slicer')
  printer.online()
  await expect(page.getByTestId('slice-printer')).toHaveText('Boxwood', { timeout: 45_000 })
})
