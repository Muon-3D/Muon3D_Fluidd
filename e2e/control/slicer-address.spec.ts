/**
 * One address to slice and print on a printer (I-414, KAN-3808): a soldier on
 * the printer's hotspot types http://muon3d.local/slicer. That path is the
 * network's (the printer's nginx serves the slicer there), and Control, which
 * the same printer serves at /, never takes it. /slice, Control's own page for
 * the same slicer, frames this origin's /slicer/ copy, so both addresses are
 * one slicer and Print now goes to the printer the page came from.
 */
import type { Page, Route } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const EMBED_HTML = '<!doctype html><html><head><meta name="muon3d-embed-hosts" content="\'self\'"><title>Muon3D Slicer</title></head><body><p id="fake-slicer">Fake slicer</p></body></html>'
const SLICER_PAGE = '<!doctype html><html><head><title>Muon3D Slicer</title></head><body><h1 id="the-slicer">The printer\'s own slicer</h1></body></html>'

/** What the printer's nginx does: /slicer 301s to /slicer/, which is the slicer's own page. */
async function serveLikeNginx (page: Page) {
  await page.route('**/slicer', (route: Route) =>
    route.fulfill({ status: 301, headers: { location: '/slicer/' }, body: '' }))
  await page.route('**/slicer/', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: SLICER_PAGE }))
  await page.route('**/slicer/embed.html*', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: EMBED_HTML }))
}

test('/slice frames this printer\'s own /slicer/ copy, in this tab', async ({ page, context }) => {
  await serveLikeNginx(page)
  await usePrinter(page, PRESETS.idleHomed())
  await page.goto('/slice')
  const frame = page.getByTestId('slice-view').locator('iframe[title="Muon3D Slicer"]')
  await expect(frame).toBeVisible({ timeout: 20_000 })
  const origin = new URL(page.url()).origin
  await expect(frame).toHaveAttribute('src', new RegExp(`^${origin.replace(/[.*+?^${}()|[\]\]/g, '\$&')}/slicer/embed\.html`))
  expect(context.pages()).toHaveLength(1)
})

test('/slicer is the network\'s: a push to it inside Control leaves for the server, in this tab', async ({ page, context }) => {
  await serveLikeNginx(page)
  await usePrinter(page, PRESETS.idleHomed())
  await page.goto('/slice')
  await expect(page.getByTestId('slice-view')).toBeVisible({ timeout: 20_000 })
  await page.evaluate(() => {
    const root = document.querySelector('.v-application') as unknown as { __vue__: { $router: { push: (path: string) => Promise<unknown> } } }
    root.__vue__.$router.push('/slicer').catch(() => {})
  })
  await expect(page.locator('#the-slicer')).toHaveText('The printer\'s own slicer', { timeout: 15_000 })
  expect(new URL(page.url()).pathname).toBe('/slicer/')
  expect(context.pages()).toHaveLength(1)
})
