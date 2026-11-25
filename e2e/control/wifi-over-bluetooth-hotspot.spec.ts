/**
 * Jack, Sloe, train 3: "I can't seem to see or edit the WIFI or hotspot when connected over BT".
 * Bluetooth is the out-of-box way to set Wi-Fi up, so Settings > Wi-Fi and network must show and edit both
 * over it, through muon-link's own /muon-link/network routes (never /server/aux), and say first what an
 * action costs the connection. Desktop and phone run the same steps; every wait is on something the page shows.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { hotspotChanges, networkCalls, routeCounts, ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'

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
  // The page's own word for the route is what picks the warning, so wait for it.
  if (route === 'ble') await expect(page.getByText('Via Bluetooth').first()).toBeVisible({ timeout: 30_000 })
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

const settled = (page: Page) => expect(page.getByTestId('hotspot-card').getByLabel('Name (SSID)')).toHaveValue('Muon-Sloe')

test('over Bluetooth the Wi-Fi box and the hotspot card both show, from muon-link', async ({ page }) => {
  test.setTimeout(180_000)
  const aux: string[] = []
  page.on('request', r => { if (/\/server\/aux\//.test(r.url())) aux.push(r.url()) })
  await wifiOver(page, 'ble')
  await expect(page.getByTestId('wifi-box').getByTestId('wifi-connected-name')).toHaveText('Workshop')
  await settled(page)
  await expect(page.getByTestId('hotspot-edit')).toBeVisible()
  // This route cannot tell whether the hotspot is up, and says so instead of guessing.
  await expect(page.getByTestId('hotspot-state-unknown')).toBeVisible()
  await expect(page.getByTestId('hotspot-turn-on')).toBeVisible()
  await expect(page.getByTestId('hotspot-turn-off')).toBeVisible()
  await expect(page.getByTestId('hotspot-route-problem')).toHaveCount(0)
  expect((await networkCalls(page)).calls).toContain('GET /hotspot')
  expect(aux).toEqual([])
})

test('over Bluetooth a join warns that Bluetooth stays, then joins', async ({ page }) => {
  test.setTimeout(180_000)
  await wifiOver(page, 'ble')
  const box = page.getByTestId('wifi-box')
  await box.getByTestId('wifi-networks').locator('[data-ssid="Cafe"]').getByRole('button', { name: 'Connect' }).click()
  await expect(page.getByTestId('wifi-warning-text')).toContainText('Bluetooth stays connected')
  expect((await networkCalls(page)).calls).not.toContain('POST /wifi/connect')
  await page.getByTestId('wifi-proceed').click()
  await expect.poll(async () => (await networkCalls(page)).calls).toContain('POST /wifi/connect')
})

test('over Bluetooth the disconnect asks first and says Bluetooth stays', async ({ page }) => {
  test.setTimeout(180_000)
  await wifiOver(page, 'ble')
  await page.getByTestId('wifi-disconnect').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Bluetooth stays connected')
  expect((await networkCalls(page)).calls).not.toContain('POST /wifi/disconnect')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toBeHidden()
})

test('through Muon3D the same join warns that this connection drops', async ({ page }) => {
  test.setTimeout(180_000)
  await wifiOver(page, 'cloud')
  await page.getByTestId('wifi-box').getByTestId('wifi-networks').locator('[data-ssid="Cafe"]').getByRole('button', { name: 'Connect' }).click()
  await expect(page.getByTestId('wifi-warning-text')).toContainText('Connect over Bluetooth first')
})

test('over Bluetooth the hotspot name is edited after a warning, through /hotspot/change', async ({ page }) => {
  test.setTimeout(180_000)
  await wifiOver(page, 'ble')
  await settled(page)
  const card = page.getByTestId('hotspot-card')
  await page.getByTestId('hotspot-edit').click()
  await card.getByLabel('Name (SSID)').fill('Muon-Sloe-2')
  await page.getByTestId('hotspot-apply').click()
  await expect(page.getByTestId('hotspot-warning-text')).toContainText('Bluetooth stays connected')
  expect(await hotspotChanges(page)).toEqual([])
  await page.getByRole('dialog').getByRole('button', { name: 'Proceed' }).click()
  await expect.poll(() => hotspotChanges(page)).toEqual([{ ssid: 'Muon-Sloe-2' }])
  expect((await networkCalls(page)).calls).toContain('POST /hotspot/change')
})

test('over Bluetooth the hotspot is turned on after a warning', async ({ page }) => {
  test.setTimeout(180_000)
  await wifiOver(page, 'ble')
  await settled(page)
  await page.getByTestId('hotspot-turn-on').click()
  await expect(page.getByTestId('hotspot-warning-text')).toContainText('Bluetooth stays connected')
  expect((await networkCalls(page)).calls).not.toContain('POST /hotspot/up')
  await page.getByRole('dialog').getByRole('button', { name: 'Proceed' }).click()
  await expect.poll(async () => (await networkCalls(page)).calls).toContain('POST /hotspot/up')
})
