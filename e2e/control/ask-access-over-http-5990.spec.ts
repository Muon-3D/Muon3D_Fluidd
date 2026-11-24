/**
 * KAN-5990 (I-600): on an http page (muon3d.local, no secure context) "Ask for access" to another printer failed with
 * the browser's bare "Failed to fetch". It now says the page couldn't reach the printer and what to do instead.
 * The other printer is stubbed and its request is refused, as a cross-origin block would.
 */
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'

const FOUND_HOST = '192.168.77.6'

test.use({ signedIn: true, serviceWorkers: 'block' })

test('Ask for access on an http page says it could not reach the printer, never "Failed to fetch"', async ({ page }) => {
  await page.route(`${CONSOLE}/v1/printers`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ printers: [] }) }))
  await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ printers: [{ printer_id: 'larch-41c2', name: 'muon-larch-41c2', model: 'M1', linked: true, local_addrs: [FOUND_HOST] }] })
  }))
  await page.route(`http://${FOUND_HOST}/**`, route => {
    const url = new URL(route.request().url())
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (url.pathname.startsWith('/server/muon/access/')) return route.abort('failed')
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (url.pathname === '/server/muon/link') {
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ result: { phase: 'linked', account: 'someone.else@example.com' } }) })
    }
    if (url.pathname === '/server/muon/identity') {
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ name: 'muon-larch-41c2', display: 'muon-larch-41c2', endpoint_id: 'larch-41c2', derived_name: 'larch', suffix: '41c2', entry: 'protected' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ result: { status: { webhooks: { state: 'ready' }, print_stats: { state: 'standby' } } } }) })
  })
  await page.goto('/')
  await ready(page)
  await page.getByTestId('view-bench').click()
  const tile = page.getByTestId('found').locator('[data-tid^="printer-tile-"]').first()
  await expect(tile).toContainText('Larch', { timeout: 30_000 })
  await tile.getByTestId('bench-action-ask').click()
  await expect(page.getByText("couldn't reach that printer to ask")).toBeVisible()
  await expect(page.getByText(/failed to fetch/i)).toHaveCount(0)
})
