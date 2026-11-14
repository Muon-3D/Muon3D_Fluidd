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
/**
 * A route change reloads the whole printer page (init.ts resets the store and loads it again), then opens
 * the socket. That is about 1 s here and 8 to 14 s with the CPU at a sixth to a quarter of its speed
 * (CDP throttle 4 and 6), which is what a CI runner with two workers is. The default 15 s is the page's own
 * work on a fast machine, not a fixed delay: this is the wait for it, and nothing retries.
 */
const REOPEN_MS = 45_000
/**
 * Auto mode keeps off the relay for RELAY_HOLD_MS (30 s) after it failed, then waits AUTO_SETTLE_MS (3 s) on
 * the move and a tick: the way back to the cloud cannot come sooner than about 34 s after the failure.
 */
const BACK_TO_CLOUD_MS = 75_000

/**
 * #370 / KAN-2703 CI diagnosis: when a test fails, say where the page's requests to the mock printer stopped.
 * The test process asks the mock directly, the page asks it too, and each side counts what it holds:
 * - the mock's own list of requests in flight, its total served and its peak (`/__e2e/diag`): a request the
 *   page sent and the mock never saw is stuck in Chrome, not in the mock;
 * - the page's fetches to the mock that have not settled (with their age) and the states of its WebSockets
 *   (0 connecting, 1 open, 2 closing, 3 closed): a page that has run out of connections shows a pile of old
 *   fetches here, and none on the mock's side;
 * - what the fake transport still holds open.
 * Printed as DIAG370 lines in the CI log.
 */
test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus) return
  const probe = async (url: string) => {
    const t = Date.now()
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(5_000) })
      return `${r.status} in ${Date.now() - t} ms`
    } catch (e) {
      return `${(e as Error).name}: ${(e as Error).message} after ${Date.now() - t} ms`
    }
  }
  console.log('DIAG370 node 127.0.0.1', await probe(`http://127.0.0.1:${MOCK_PORT}/server/info`))
  console.log('DIAG370 node localhost', await probe(`http://localhost:${MOCK_PORT}/server/info`))
  try {
    console.log('DIAG370 mock', JSON.stringify(await (await fetch(`http://127.0.0.1:${MOCK_PORT}/__e2e/diag`, { signal: AbortSignal.timeout(5_000) })).json()))
  } catch (e) {
    console.log('DIAG370 mock', (e as Error).message)
  }
  const inPage = await Promise.race([
    page.evaluate(async (port) => {
      const t = Date.now()
      let fetched: string
      try {
        const r = await fetch(`http://localhost:${port}/server/info`, { signal: AbortSignal.timeout(5_000) })
        fetched = `${r.status} in ${Date.now() - t} ms`
      } catch (e) {
        fetched = `${(e as Error).name}: ${(e as Error).message} after ${Date.now() - t} ms`
      }
      const S = (window as any).__e2eRoute
      const live = S ? [...S.live] : []
      const sockets = live.flatMap((p: any) => [...p.sockets])
      const net = (window as any).__e2eNet
      const now = Date.now()
      const pending = net ? [...net.fetches.values()] : []
      const toMock = pending.filter((x: any) => x.url.includes(`:${port}/`))
      return {
        fetched,
        live: live.length,
        sockets: sockets.length,
        links: S?.links?.size,
        fetchesStarted: net?.started,
        fetchesPending: toMock.length,
        otherPending: pending.length - toMock.length,
        oldestPendingMs: toMock.length ? now - Math.min(...toMock.map((x: any) => x.t)) : 0,
        pending: toMock.slice(0, 8).map((x: any) => `${x.method} ${x.url.replace(/^https?:\/\/[^/]+/, '').slice(0, 50)} ${now - x.t} ms`),
        wsOpened: net?.sockets.length,
        wsStates: [0, 1, 2, 3].map(n => (net?.sockets ?? []).filter((x: any) => x.ws.readyState === n).length).join(',')
      }
    }, MOCK_PORT),
    new Promise(resolve => setTimeout(() => resolve('page.evaluate hung for 10 s'), 10_000))
  ])
  console.log('DIAG370 page', JSON.stringify(inPage))
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
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true })
  await expect(sheet(page)).toHaveCount(0)
}

test.beforeEach(async ({ page, account }) => {
  // Nothing here is about the 3D model: the photoreal M1 stalls software WebGL for tens of seconds
  // on the printer page and starves the page, as in overview.spec.ts and jack-1110.spec.ts.
  await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
  // The page's own count of fetches and WebSockets, for the diagnosis above.
  await page.addInitScript(() => {
    const net: any = { fetches: new Map(), sockets: [] as any[], started: 0 }
    ;(window as any).__e2eNet = net
    const realFetch = window.fetch.bind(window)
    window.fetch = (input: any, init?: any) => {
      const id = ++net.started
      net.fetches.set(id, { url: typeof input === 'string' ? input : input.url, method: init?.method ?? 'GET', t: Date.now() })
      const settled = () => net.fetches.delete(id)
      const result = realFetch(input, init)
      result.then(settled, settled)
      return result
    }
    const RealWebSocket = window.WebSocket
    const Counted: any = function (this: any, url: string, protocols?: any) {
      const ws = new RealWebSocket(url, protocols)
      net.sockets.push({ url, ws })
      return ws
    }
    Counted.prototype = RealWebSocket.prototype
    for (const k of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) Counted[k] = (RealWebSocket as any)[k]
    window.WebSocket = Counted
  })
  await useAllRoutes(page, account)
})

test('Bluetooth that goes quiet with the radio up says "Bluetooth dropped", moves nowhere, and Try Bluetooth again reconnects', async ({ page, isMobile }) => {
  // The product's own waits (15 s of silence, 30 s off the relay) and two page reloads: more than the default 90 s on a slow runner.
  test.setTimeout(240_000)
  await onBluetooth(page)
  if (!isMobile) await expect(page.getByText('Via Bluetooth', { exact: true }).first()).toBeVisible()
  // The printer has spoken over the radio (its keep-alive): only quiet after that is a dead path behind a live radio.
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ carrying: true })
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
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true })
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
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true })
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
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true })
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
  // The product's own waits (15 s of silence, 30 s off the relay) and two page reloads: more than the default 90 s on a slow runner.
  test.setTimeout(240_000)
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
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true })
  expect((await where(page)).mode).toBe('auto')

  // The relay goes away: auto mode fails over to Bluetooth, without a sheet.
  account.printers[0].online = false
  await control(page, 'cloud', false)
  await expect.poll(() => lastRoute(page), { timeout: 30_000 }).toBe('ble')
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true })
  await expect(sheet(page)).toHaveCount(0)
  expect((await where(page)).mode).toBe('auto')

  // The relay is back: auto returns to it.
  account.printers[0].online = true
  await control(page, 'cloud', true)
  await expect.poll(() => lastRoute(page), { timeout: BACK_TO_CLOUD_MS }).toBe('cloud')
  await expect.poll(() => where(page), { timeout: REOPEN_MS }).toMatchObject({ socketOpen: true })

  // The printer answers on this network: auto moves to it.
  await reachOnLan(page)
  await expect.poll(async () => (await where(page)).apiUrl, { timeout: REOPEN_MS }).toBe(`http://localhost:${MOCK_PORT}`)
})
