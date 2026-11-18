/**
 * KAN-4297 from the person's side (Jack, 18 Nov):
 *
 * - How many devices are on the printer's hotspot shows bottom-left (the rail on a desktop, over the tab
 *   bar's corner on a phone), whatever route Control reaches the printer by: this network, Bluetooth, Muon3D.
 * - It is hidden when the printer has no such answer (a 404) or its hotspot is down.
 * - Through the hotspot the route says "Through hotspot", not "On this network".
 * - The hotspot card lists who is connected when the printer says, and shows only the count when it doesn't.
 *
 * The printer's answers are faked: page.route on this network, muon-link's own route (e2e/fakes/routes.ts)
 * over Bluetooth and Muon3D. No printer is touched.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { routeCounts, ROUTE_PRINTER, setStations, useAllRoutes } from '../fakes/routes'
import { usePrinter, PRESETS } from './printer'

test.use({ signedIn: true, serviceWorkers: 'block' })

const STATIONS = '**/server/aux/wifi/ap/stations'
const count = (page: Page) => page.locator('[data-tid="hotspot-count"]')
const frame = (page: Page) => page.locator('.app-rail, .app-tab-bar__tabs').first()

/** This network: the printer answers the stations route with `body` (null: it has none, a 404). */
async function stationsOnLan (page: Page, body: unknown, hits?: { n: number }) {
  await page.route(STATIONS, route => {
    if (hits) hits.n++
    return body === null ? route.fulfill({ status: 404, body: 'Not Found' }) : route.fulfill({ json: body })
  })
}

test.describe('this network', () => {
  test.beforeEach(async ({ page }) => { await usePrinter(page, PRESETS.idleHomed()) })

  test('the count shows, with its tooltip, and the poll stays light', async ({ page, open }) => {
    const hits = { n: 0 }
    await page.clock.install()
    await stationsOnLan(page, { up: true, count: 2, auto_off_at: null }, hits)
    await open('/')
    await expect(count(page)).toBeVisible()
    await expect(count(page).getByTestId('hotspot-count-n')).toHaveText('2')
    await expect(count(page)).toHaveAttribute('title', "2 devices on the printer's hotspot")
    // The green "2 connected" tab on top of the connection item (a bare number on a phone's chip is still the count).
    await expect(count(page)).toContainText('2')
    // About every 10 s, never a burst.
    // A known number of intervals on a fake clock gives a known number of asks.
    const before = hits.n
    await page.clock.runFor(10_000 * 3 + 500)
    await expect.poll(() => hits.n - before).toBe(3)
  })

  test('a hotspot that is up with nobody on it draws no green tab, and the card says 0', async ({ page, open }) => {
    await stationsOnLan(page, { up: true, count: 0, auto_off_at: null })
    await open('/wifi')
    await expect(page.getByTestId('hotspot-badge')).toHaveText('0 connected')
    await expect(page.getByTestId('hotspot-devices-count')).toHaveText('No devices connected')
    await expect(count(page)).toHaveCount(0)
  })

  test('it is hidden when the hotspot is down', async ({ page, open }) => {
    await stationsOnLan(page, { up: false, count: 0, auto_off_at: null })
    await open('/')
    await expect(frame(page)).toBeVisible()
    await page.waitForTimeout(1500)
    await expect(count(page)).toHaveCount(0)
  })

  test('it is hidden when the printer has no such route (404)', async ({ page, open }) => {
    await stationsOnLan(page, null)
    await open('/')
    await expect(frame(page)).toBeVisible()
    await page.waitForTimeout(1500)
    await expect(count(page)).toHaveCount(0)
  })

  test('the route says "Through hotspot" when the printer says the request came from it', async ({ page, open }) => {
    await stationsOnLan(page, { up: true, count: 1, auto_off_at: null, requester_on_ap: true })
    await open('/wifi')
    await expect(page.getByTestId('wifi-route-pill')).toHaveText('Through hotspot')
  })

  test('the route stays "On this network" when the printer says it did not', async ({ page, open }) => {
    await stationsOnLan(page, { up: true, count: 1, auto_off_at: null, requester_on_ap: false })
    await open('/wifi')
    await expect(count(page)).toBeVisible()
    await expect(page.getByTestId('wifi-route-pill')).toHaveText('On this network')
  })

  test('the hotspot card lists each device when the printer sends them', async ({ page, open }) => {
    await stationsOnLan(page, {
      up: true,
      count: 2,
      auto_off_at: null,
      requester_on_ap: false,
      clients: [
        { name: 'Jack phone', ip: '10.42.0.7', mac: 'aa:bb:cc:••:••:ef', connected_s: 720, signal_dbm: -52, you: true },
        { name: null, ip: '10.42.0.9', mac: '11:22:33:••:••:99', connected_s: 30, signal_dbm: null, you: false }
      ]
    })
    await open('/wifi')
    const card = page.getByTestId('hotspot-card')
    await expect(card.getByTestId('hotspot-badge')).toHaveText('2 connected')
    const rows = card.getByTestId('hotspot-client')
    await expect(rows).toHaveCount(2)
    await expect(rows.nth(0)).toContainText('Jack phone')
    await expect(rows.nth(0)).toContainText('This device')
    await expect(rows.nth(0).getByTestId('hotspot-client-ip')).toHaveText('10.42.0.7')
    await expect(rows.nth(0).getByTestId('hotspot-client-mac')).toHaveText('aa:bb:cc:••:••:ef')
    await expect(rows.nth(0).getByTestId('hotspot-client-connected')).toHaveText('connected 12 min')
    await expect(rows.nth(0).getByTestId('hotspot-client-signal')).toHaveText('-52 dBm')
    await expect(rows.nth(1)).toContainText('Unnamed device')
    await expect(rows.nth(1)).not.toContainText('This device')
  })

  test('the hotspot card shows only the count when the printer sends no list', async ({ page, open }) => {
    await stationsOnLan(page, { up: true, count: 3, auto_off_at: null })
    await open('/wifi')
    const card = page.getByTestId('hotspot-card')
    await expect(card.getByTestId('hotspot-badge')).toHaveText('3 connected')
    await expect(card.getByTestId('hotspot-devices-count')).toHaveText('3 devices connected')
    await expect(card.getByTestId('hotspot-clients')).toHaveCount(0)
  })
})

test.describe('over Bluetooth and Muon3D', () => {
  const REOPEN_MS = 45_000
  const lastRoute = async (page: Page) => (await routeCounts(page)).routes.at(-1)
  const where = (page: Page) => page.evaluate(async () => {
    const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
    return m.where()
  })

  test.beforeEach(async ({ page, account }) => {
    await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
    await useAllRoutes(page, account)
    await page.route(`http://localhost:${MOCK_PORT}/server/muon/identity`, route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ name: 'Boxwood', display: ROUTE_PRINTER.name, derived_name: 'boxwood', suffix: '367a', endpoint_id: ROUTE_PRINTER.id })
    }))
  })

  /** All printers, then the printer's own menu; `stations` is what muon-link answers from the start (none: a 404). */
  async function connect (page: Page, action: 'Connect over Bluetooth' | 'Connect through Muon3D', route: 'ble' | 'cloud', stations: unknown = null) {
    await page.goto('/')
    await ready(page)
    await setStations(page, stations)
    await page.getByRole('link', { name: 'All printers' }).first().click()
    await expect(page.getByText('Connecting...')).toHaveCount(0, { timeout: 30_000 })
    await page.locator(`button[aria-label="Options for ${ROUTE_PRINTER.name}"]`).click()
    await page.locator('.v-list-item').getByText(action, { exact: true }).click()
    await expect.poll(() => lastRoute(page)).toBe(route)
    await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true })
  }

  test('over Bluetooth: hidden while muon-link has no such route, then the count shows when it does', async ({ page }) => {
    test.setTimeout(180_000)
    await connect(page, 'Connect over Bluetooth', 'ble')
    await expect(frame(page)).toBeVisible()
    await page.waitForTimeout(1500)
    await expect(count(page)).toHaveCount(0)
    await setStations(page, { up: true, count: 3, auto_off_at: null })
    // The 404 slows the poll to a minute: a visibility change asks at once, as coming back to the tab does.
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await expect(count(page).getByTestId('hotspot-count-n')).toHaveText('3', { timeout: 20_000 })
    await expect(count(page)).toHaveAttribute('title', "3 devices on the printer's hotspot")
  })

  test('over Muon3D: the count shows', async ({ page }) => {
    test.setTimeout(180_000)
    await connect(page, 'Connect through Muon3D', 'cloud', { up: true, count: 1, auto_off_at: null })
    await expect(count(page).getByTestId('hotspot-count-n')).toHaveText('1', { timeout: 20_000 })
    await expect(count(page)).toHaveAttribute('title', "1 device on the printer's hotspot")
  })
})
