/**
 * KAN-5973 (I-585) and KAN-5977 (I-589), from the person's side (Jack at Sloe, 24 Nov):
 *
 * - On the Wi-Fi and network page, when more than one route is there, very small buttons offer them:
 *   one per route, the current one active, a click connects over it and holds it.
 * - From the click on Bluetooth to connected, the button says "Switching to Bluetooth…". A failed pick says
 *   "Couldn't connect over Bluetooth.", stays held (no silent fallback) and leaves the other buttons usable.
 * - With one route there are no buttons.
 *
 * Every route reaches the same mock printer (e2e/fakes/routes.ts).
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { reachOnLan, ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'

test.use({ signedIn: true, serviceWorkers: 'block' })

const REOPEN_MS = 45_000
const where = (page: Page) => page.evaluate(async () => {
  const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
  return m.where()
})

async function onWifiPageOverMuon3D (page: Page) {
  await page.goto('/')
  await ready(page)
  await page.getByRole('link', { name: 'All printers' }).first().click()
  await expect(page.getByText('Connecting...')).toHaveCount(0, { timeout: 30_000 })
  await page.locator(`button[aria-label="Options for ${ROUTE_PRINTER.name}"]`).click()
  await page.locator('.v-list-item').getByText('Connect through Muon3D', { exact: true }).click()
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true, mode: 'cloud' })
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

test('local, Muon3D and Bluetooth buttons: a pick connects, shows it is switching, and is held', async ({ page }) => {
  await onWifiPageOverMuon3D(page)
  await reachOnLan(page)
  const local = page.getByRole('button', { name: 'Connect locally', exact: true })
  const cloud = page.getByRole('button', { name: 'Connect over Muon3D', exact: true })
  const ble = page.getByRole('button', { name: 'Connect over Bluetooth', exact: true })
  await expect(local).toBeVisible()
  await expect(cloud).toHaveAttribute('aria-pressed', 'true')
  await expect(ble).toBeVisible()
  // Small: a tap target well under a normal button.
  expect((await ble.boundingBox())!.width).toBeLessThanOrEqual(32)

  // Bluetooth takes a moment to come up: the button says so from the click.
  await page.evaluate(() => {
    const gatt = (window as any).__e2eRoute.device.gatt
    const connect = gatt.connect
    gatt.connect = async () => { await new Promise(resolve => setTimeout(resolve, 2_000)); return connect() }
  })
  await ble.click()
  await expect(page.getByTestId('route-switching')).toHaveText('Switching to Bluetooth…')
  await expect(ble).toHaveAttribute('aria-busy', 'true')
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true, carrying: true, mode: 'ble' })
  await expect(page.getByTestId('route-switching')).toHaveCount(0)
  await expect(ble).toHaveAttribute('aria-pressed', 'true')

  // Back to local.
  await reachOnLan(page)
  await local.click()
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true, carrying: false, activeCloud: null, mode: 'lan' })
  await expect(local).toHaveAttribute('aria-pressed', 'true')

  // Bluetooth fails: said plainly, still Bluetooth (no silent fallback), the others still work.
  await page.evaluate(() => (window as any).__e2eRoute.radio(false))
  await ble.click()
  await expect(page.getByTestId('route-failed')).toHaveText("Couldn't connect over Bluetooth.", { timeout: REOPEN_MS })
  await expect(page.getByTestId('route-switching')).toHaveCount(0)
  expect((await where(page)).mode).toBe('ble')
  await expect(local).toBeEnabled()
  await expect(cloud).toBeEnabled()
  await page.evaluate(() => (window as any).__e2eRoute.radio(true))
  await reachOnLan(page)
  await local.click()
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true, activeCloud: null, mode: 'lan' })
})

test('only one route is there: no route buttons', async ({ page }) => {
  // This browser has no Bluetooth and the printer is not on this network: Muon3D is the only way.
  await page.addInitScript(() => Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: undefined }))
  await onWifiPageOverMuon3D(page)
  await expect(page.getByTestId('wifi-route-pill')).toBeVisible()
  await expect(page.getByTestId('route-buttons')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Connect (locally|over)/ })).toHaveCount(0)
})
