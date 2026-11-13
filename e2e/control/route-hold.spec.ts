/**
 * The chosen route is held, and a dropped Bluetooth route is said, not hidden
 * (Jack, 9 and 11 Nov; KAN-1913, KAN-2080, KAN-1992):
 *
 * - Bluetooth chosen, and it drops: "Bluetooth dropped", with Connect on local
 *   network (only when it answers there), Connect via cloud, and Try Bluetooth
 *   again. Control never moves the session itself. Bluetooth coming back tries
 *   again on its own.
 * - The drop is not assumed to be the radio: the radio can stay up while
 *   nothing crosses it (the bench, 12 Nov).
 * - A permission refusal is an answer, not a dropped route.
 * - Plain Connect (auto) goes local network, then cloud, then Bluetooth, and
 *   moves back up when a better route returns.
 *
 * Every route reaches the same mock printer (e2e/fakes/routes.ts).
 */
import * as path from 'path'
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { reachOnLan, routeCounts, ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'

// The page's service worker answers its fetches itself, past page.route: a reload could then
// load the real muon-link-web in place of the fake (relay.e2e.test, "BLE peer sent an invalid endpoint id").
test.use({ signedIn: true, serviceWorkers: 'block' })

/** Where the done-1112 screenshots go, when a run asks for them. */
const SHOTS = process.env.DONE_SHOTS

const sheet = (page: Page) => page.getByTestId('bluetooth-fallback')
const lastRoute = async (page: Page) => (await routeCounts(page)).routes.at(-1)
const where = (page: Page) => page.evaluate(async () => {
  const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
  return m.where()
})
const control = (page: Page, what: 'silence' | 'radio' | 'cloud', on: boolean) =>
  page.evaluate(([what, on]) => (window as any).__e2eRoute[what](on), [what, on] as const)

/** All printers, then the printer's own menu: the way a person picks a route. */
async function choose (page: Page, action: 'Connect over Bluetooth' | 'Connect through Muon3D') {
  await page.goto('/')
  await ready(page)
  // Signed in, the app opens the last printer: go to All printers, as a person does.
  await page.getByRole('link', { name: 'All printers' }).first().click()
  // The card is still connecting on its own at first; a person picks once it has settled.
  await expect(page.getByText('Connecting...')).toHaveCount(0, { timeout: 30_000 })
  // The tile itself is a button too; the menu is the real <button> on it.
  await page.locator(`button[aria-label="Options for ${ROUTE_PRINTER.name}"]`).click()
  // The card has its own "Connect over Bluetooth" button now: the menu's item is the one in the list.
  await page.locator('.v-list-item').getByText(action, { exact: true }).click()
}

/** Connect over Bluetooth, and wait until the session really runs over it. */
async function onBluetooth (page: Page) {
  await choose(page, 'Connect over Bluetooth')
  await expect.poll(() => lastRoute(page)).toBe('ble')
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true })
  await expect(sheet(page)).toHaveCount(0)
}

test.beforeEach(async ({ page, account }) => {
  // Nothing here is about the 3D model: the photoreal M1 stalls software WebGL for tens of seconds
  // on the printer page and starves the page, as in overview.spec.ts and jack-1110.spec.ts.
  await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
  await useAllRoutes(page, account)
})

test('Bluetooth that goes quiet with the radio up says "Bluetooth dropped", moves nowhere, and Try Bluetooth again reconnects', async ({ page, isMobile }) => {
  await onBluetooth(page)
  if (!isMobile) await expect(page.getByText('Via Bluetooth', { exact: true }).first()).toBeVisible()
  // The printer has spoken over the radio (its keep-alive): only quiet after that is a dead path behind a live radio.
  await expect.poll(() => where(page)).toMatchObject({ carrying: true })
  const before = await routeCounts(page)

  await control(page, 'silence', true)
  // SILENT_DROP_MS is 15 s of nothing heard, checked every second; 30 s leaves room for a loaded runner. The
  // wait is the product's own threshold, nothing retries.
  await expect(sheet(page)).toContainText('Bluetooth dropped', { timeout: 30_000 })
  await expect(sheet(page)).toContainText('Nothing came over Bluetooth for 15 seconds.')
  await expect(page.getByTestId('bluetooth-dropped-cloud')).toHaveText('Connect via cloud')
  await expect(page.getByTestId('bluetooth-dropped-ble')).toHaveText('Try Bluetooth again')
  // Not on this network: no local-network choice.
  await expect(page.getByTestId('bluetooth-dropped-lan')).toHaveCount(0)
  // Never a silent switch: no new session over the relay, the old one closed.
  const dropped = await routeCounts(page)
  expect(dropped.dials).toBe(before.dials)
  expect(dropped.closes).toBeGreaterThan(before.closes)
  if (!isMobile) await expect(page.getByText('Through Muon3D', { exact: true })).toHaveCount(0)

  await control(page, 'silence', false)
  await page.getByTestId('bluetooth-dropped-ble').click()
  await expect(sheet(page)).toHaveCount(0)
  await expect.poll(() => lastRoute(page)).toBe('ble')
  expect((await routeCounts(page)).dials).toBe(before.dials + 1)
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true })
  expect((await where(page)).mode).toBe('ble')
})

test('Try Bluetooth again that fails leaves the sheet and its choices, never a dead end', async ({ page }) => {
  await onBluetooth(page)
  await control(page, 'radio', false)
  await expect(sheet(page)).toContainText('Bluetooth dropped')
  // The radio is still off: the try fails, and the person can still choose.
  await page.getByTestId('bluetooth-dropped-ble').click()
  await expect(sheet(page)).toContainText('Bluetooth dropped')
  await expect(page.getByTestId('bluetooth-dropped-ble')).toBeEnabled()
  await expect(page.getByTestId('bluetooth-dropped-cloud')).toBeEnabled()
  expect(await lastRoute(page)).toBe('ble')
})

test('Connect via cloud from the sheet moves the session to the relay, because the person chose it', async ({ page, isMobile }) => {
  await onBluetooth(page)
  const before = await routeCounts(page)
  await control(page, 'radio', false)
  await expect(sheet(page)).toContainText('Bluetooth dropped')
  expect((await routeCounts(page)).dials).toBe(before.dials)

  await page.getByTestId('bluetooth-dropped-cloud').click()
  await expect(sheet(page)).toHaveCount(0)
  await expect.poll(() => lastRoute(page)).toBe('cloud')
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true })
  expect((await where(page)).mode).toBe('cloud')
  if (!isMobile) await expect(page.getByText('Through Muon3D', { exact: true }).first()).toBeVisible()
})

test('Connect on local network shows only when the printer answers here, and opens it there', async ({ page }, testInfo) => {
  await onBluetooth(page)
  await reachOnLan(page)
  await control(page, 'radio', false)
  await expect(sheet(page)).toContainText('Bluetooth dropped')
  await expect(page.getByTestId('bluetooth-dropped-lan')).toHaveText('Connect on local network')
  await expect(page.getByTestId('bluetooth-dropped-cloud')).toBeVisible()
  await expect(page.getByTestId('bluetooth-dropped-ble')).toBeVisible()
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `CN-04-${testInfo.project.name}.png`) })

  await page.getByTestId('bluetooth-dropped-lan').click()
  await expect(sheet(page)).toHaveCount(0)
  await expect.poll(async () => (await where(page)).apiUrl).toBe(`http://localhost:${MOCK_PORT}`)
  expect((await where(page)).activeCloud).toBeNull()
})

test('Bluetooth coming back tries again by itself', async ({ page }) => {
  await onBluetooth(page)
  const before = await routeCounts(page)
  await control(page, 'radio', false)
  await expect(sheet(page)).toContainText('Bluetooth dropped')

  await control(page, 'radio', true)
  await expect(sheet(page)).toHaveCount(0)
  await expect.poll(() => routeCounts(page).then(c => c.dials)).toBe(before.dials + 1)
  expect(await lastRoute(page)).toBe('ble')
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true })
})

test('a permission refusal never moves the chosen route', async ({ page, isMobile }) => {
  await onBluetooth(page)
  const before = await routeCounts(page)
  const answer = await page.evaluate(async () => {
    const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
    return m.refusedRequests()
  })
  expect(answer.http).toBe(403)
  // The page polls update status on its own (refused too); the two this test sent are the new ones.
  await expect.poll(() => routeCounts(page).then(c => c.refused.slice(before.refused.length))).toEqual(['POST /muon-link/plate/clear', 'RPC machine.update.status'])
  const after = await routeCounts(page)
  expect(after.dials).toBe(before.dials)
  expect(after.closes).toBe(before.closes)
  expect(after.routes.at(-1)).toBe('ble')
  await expect(sheet(page)).toHaveCount(0)
  expect(await where(page)).toMatchObject({ mode: 'ble', socketOpen: true })
  if (!isMobile) await expect(page.getByText('Via Bluetooth', { exact: true }).first()).toBeVisible()
})

test('plain Connect goes cloud before Bluetooth, fails over to Bluetooth, and returns to cloud, then to the local network', async ({ page, account }) => {
  await page.goto('/')
  await ready(page)
  // This page has heard the printer over Bluetooth (Look nearby).
  expect(await page.evaluate(async () => {
    const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
    return m.hearNearby()
  })).toBe(true)
  // Plain Connect: not on this network, so the cloud.
  await page.getByRole('link', { name: 'All printers' }).first().click()
  await expect(page.getByText('Connecting...')).toHaveCount(0, { timeout: 30_000 })
  await page.locator('[data-tid^="printer-tile-"]').first().click()
  await expect.poll(() => lastRoute(page)).toBe('cloud')
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true })
  expect((await where(page)).mode).toBe('auto')

  // The relay goes away: auto mode fails over to Bluetooth, without a sheet.
  account.printers[0].online = false
  await control(page, 'cloud', false)
  await expect.poll(() => lastRoute(page), { timeout: 30_000 }).toBe('ble')
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true })
  await expect(sheet(page)).toHaveCount(0)
  expect((await where(page)).mode).toBe('auto')

  // The relay is back: auto returns to it.
  account.printers[0].online = true
  await control(page, 'cloud', true)
  await expect.poll(() => lastRoute(page), { timeout: 30_000 }).toBe('cloud')
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true })

  // The printer answers on this network: auto moves to it.
  await reachOnLan(page)
  await expect.poll(async () => (await where(page)).apiUrl, { timeout: 20_000 }).toBe(`http://localhost:${MOCK_PORT}`)
})
