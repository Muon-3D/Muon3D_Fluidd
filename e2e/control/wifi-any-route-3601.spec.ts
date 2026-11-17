/**
 * KAN-3601 and KAN-3607 from the person's side (Jack, 17 Nov walk, I-374, I-377):
 *
 * - On an open printer, Wi-Fi can be joined and forgotten from Control over any route:
 *   Bluetooth and Muon3D go to muon-link's own /muon-link/network/wifi routes, never /server/aux
 *   (muon-link closes that to every caller there). The fake answers them as muon-link does,
 *   including its rule that a scan takes no query.
 * - A muon-link that predates the routes, or an owner who turned the route off, is said in words.
 * - One Wi-Fi box holds the network it is on and the others; Bluetooth and the hotspot are
 *   their own sections below it, and the phone page scrolls as one page.
 *
 * Every route reaches the same mock printer (e2e/fakes/routes.ts).
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { networkCalls, routeCounts, ROUTE_PRINTER, setNetworkMode, useAllRoutes } from '../fakes/routes'

test.use({ signedIn: true, serviceWorkers: 'block' })

const REOPEN_MS = 45_000
const lastRoute = async (page: Page) => (await routeCounts(page)).routes.at(-1)
const where = (page: Page) => page.evaluate(async () => {
  const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
  return m.where()
})

/** All printers, then the printer's own menu: the way a person picks a route. */
async function choose (page: Page, action: 'Connect over Bluetooth' | 'Connect through Muon3D') {
  await page.goto('/')
  await ready(page)
  await page.getByRole('link', { name: 'All printers' }).first().click()
  await expect(page.getByText('Connecting...')).toHaveCount(0, { timeout: 30_000 })
  await page.locator(`button[aria-label="Options for ${ROUTE_PRINTER.name}"]`).click()
  await page.locator('.v-list-item').getByText(action, { exact: true }).click()
}

/** On that route, then Settings > Wi-Fi and network. */
async function wifiOver (page: Page, route: 'ble' | 'cloud') {
  await choose(page, route === 'ble' ? 'Connect over Bluetooth' : 'Connect through Muon3D')
  await expect.poll(() => lastRoute(page)).toBe(route)
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true })
  await page.evaluate(async () => {
    const { default: router } = await import(/* @vite-ignore */ ['', 'src', 'router', 'index.ts'].join('/'))
    await router.push(`${location.pathname.replace(/\/$/, '')}/wifi`)
  })
  await expect(page.getByTestId('wifi-box')).toBeVisible()
}

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

for (const route of ['ble', 'cloud'] as const) {
  test(`over ${route === 'ble' ? 'Bluetooth' : 'Muon3D'}: lists, joins and forgets a network through muon-link, never /server/aux`, async ({ page }) => {
    test.setTimeout(180_000)
    const aux: string[] = []
    page.on('request', r => { if (/\/server\/aux\/wifi\//.test(r.url())) aux.push(r.url()) })
    await wifiOver(page, route)

    // One box: the network it is on, and the others under it.
    const box = page.getByTestId('wifi-box')
    await expect(box.getByTestId('wifi-connected-name')).toHaveText('Workshop')
    await expect(box.getByTestId('wifi-networks').locator('[data-ssid="Cafe"]')).toBeVisible()
    await expect(page.getByTestId('wifi-route-problem')).toHaveCount(0)

    // Join an open network: asked first, then sent to muon-link.
    await box.getByTestId('wifi-networks').locator('[data-ssid="Cafe"]').getByRole('button', { name: 'Connect' }).click()
    await page.getByTestId('wifi-proceed').click()
    await expect.poll(async () => (await networkCalls(page)).calls).toContain('POST /wifi/connect')
    expect((await networkCalls(page)).bodies).toEqual([{ ssid: 'Cafe' }])

    // Forget a saved one.
    await box.getByTestId('wifi-networks').locator('[data-ssid="Workshop-2G"]').getByRole('button', { name: 'Forget' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Forget', exact: true }).click()
    await expect.poll(async () => (await networkCalls(page)).calls).toContain('DELETE /wifi/forget?ssid=Workshop-2G')

    const { calls } = await networkCalls(page)
    expect(calls.filter(c => c.includes('/wifi/scan'))).not.toEqual([])
    expect(calls.every(c => !c.startsWith('GET /wifi/scan?'))).toBe(true)
    expect(aux).toEqual([])
  })
}

test('an older muon-link says it cannot change Wi-Fi over this connection', async ({ page }) => {
  test.setTimeout(180_000)
  await wifiOver(page, 'cloud')
  await setNetworkMode(page, 'older')
  await page.getByTestId('wifi-refresh').click()
  await expect(page.getByTestId('wifi-route-problem')).toContainText("can't change Wi-Fi over this connection yet")
})

test("an owner's turned-off route says so", async ({ page }) => {
  test.setTimeout(180_000)
  await wifiOver(page, 'ble')
  await setNetworkMode(page, 'path_disabled')
  await page.getByTestId('wifi-refresh').click()
  await expect(page.getByTestId('wifi-route-problem')).toContainText('turned off Wi-Fi changes over this connection')
})

// The panel never takes printer compute: every scan costs the printer an nmcli run.
const scans = async (page: Page) => (await networkCalls(page)).calls.filter(c => c.startsWith('GET /wifi/scan')).length

for (const route of ['ble', 'cloud'] as const) {
  test(`over ${route === 'ble' ? 'Bluetooth' : 'Muon3D'}: the printer is scanned once on open, not every few seconds`, async ({ page }) => {
    test.setTimeout(180_000)
    await wifiOver(page, route)
    await expect(page.getByTestId('wifi-box').getByTestId('wifi-connected-name')).toHaveText('Workshop')
    const before = await scans(page)
    expect(before).toBeGreaterThanOrEqual(1)
    await page.waitForTimeout(12_000)
    expect(await scans(page)).toBe(before)
    // The Scan button still scans.
    await page.getByTestId('wifi-refresh').click()
    await expect.poll(() => scans(page)).toBe(before + 1)
  })
}

test('after the owner has turned the route off, the card stops asking', async ({ page }) => {
  test.setTimeout(180_000)
  await wifiOver(page, 'ble')
  await setNetworkMode(page, 'path_disabled')
  await page.getByTestId('wifi-refresh').click()
  await expect(page.getByTestId('wifi-route-problem')).toBeVisible()
  const after = (await networkCalls(page)).calls.length
  await page.waitForTimeout(12_000)
  expect((await networkCalls(page)).calls.length).toBe(after)
})
