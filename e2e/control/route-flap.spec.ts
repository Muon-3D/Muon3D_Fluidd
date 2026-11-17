import type { Page, WebSocketRoute } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { routeCounts, ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { PRESETS, usePrinter } from './printer'

test.use({ signedIn: true, serviceWorkers: 'block' })

const tile = (page: Page) => page.getByTestId(`printer-tile-cloud:${ROUTE_PRINTER.id}`)
const item = (page: Page, name: string) => page.locator('.v-list-item').filter({ has: page.getByText(name, { exact: true }) })
const where = (page: Page) => page.evaluate(async () => {
  const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
  return m.where()
})
const cloud = (page: Page, on: boolean) => page.evaluate(on => (window as any).__e2eRoute.cloud(on), on)
const networkFor = new WeakMap<Page, { up: boolean, sockets: Set<WebSocketRoute> }>()
interface RouteLabel {
  at: number;
  text: string;
  lanUp: boolean;
  lanSince: number;
  cloudUp: boolean;
}

async function printers (page: Page) {
  if (await page.getByRole('link', { name: 'All printers' }).count() === 0) {
    await page.getByRole('button', { name: 'Switch printer', exact: true }).click()
  }
  await page.getByRole('link', { name: 'All printers' }).first().click()
  await expect(page.getByText('Connecting...')).toHaveCount(0)
}

async function menu (page: Page) {
  await page.getByRole('button', { name: `Options for ${ROUTE_PRINTER.name}`, exact: true }).click()
}

async function openAuto (page: Page) {
  await page.goto('/')
  await ready(page)
  await printers(page)
  await tile(page).click()
  await expect.poll(() => where(page), { timeout: 45_000 }).toMatchObject({ activeCloud: ROUTE_PRINTER.id, socketOpen: true, mode: 'auto', switching: null })
  await expect(page).not.toHaveURL(/\/$/)
  await printers(page)
}

async function choose (page: Page, name: string, returnToPrinters = true) {
  const before = await routeCounts(page)
  await menu(page)
  await item(page, name).click()
  if (name !== 'Connect locally') await expect.poll(async () => (await routeCounts(page)).dials).toBeGreaterThan(before.dials)
  await expect.poll(() => where(page), { timeout: 45_000 }).toMatchObject({ socketOpen: true, switching: null })
  await expect(page).not.toHaveURL(/\/$/)
  if (returnToPrinters) await printers(page)
}

async function lan (page: Page, on: boolean) {
  const network = networkFor.get(page)!
  network.up = on
  if (!on) for (const socket of network.sockets) await socket.close()
  await page.evaluate(async ([port, id, name, on]) => {
    const state = (window as any).__e2eRoute
    if (on && !state.lanUp) state.lanSince = Date.now()
    state.lanUp = on
    const m = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'discovery.ts'].join('/'))
    m.abortSweep()
    m.discoveryState.found = on ? [{ host: `localhost:${port}`, aliases: [`localhost:${port}`], apiUrl: `http://localhost:${port}`, name, endpointId: id }] : []
    m.discoveryState.finishedAt = Date.now()
  }, [MOCK_PORT, ROUTE_PRINTER.id, ROUTE_PRINTER.name, on] as const)
}

async function recordLabels (page: Page) {
  await page.evaluate(async id => {
    const { cloudState } = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'state.ts'].join('/'))
    const labels: RouteLabel[] = []
    const record = () => {
      const el = document.querySelector(`[data-tid="printer-tile-cloud:${id}"] .tile__detail`)
      const text = el?.textContent?.trim() ?? ''
      const state = (window as any).__e2eRoute
      if (text && text !== labels.at(-1)?.text) labels.push({ at: Date.now(), text, lanUp: !!state.lanUp, lanSince: state.lanSince ?? 0, cloudUp: state.cloudUp, printerStatus: { ...cloudState.status[id] }, consoleOnline: cloudState.printers.find((p: any) => p.id === id)?.online, heard: state.heard } as RouteLabel)
    }
    record()
    new MutationObserver(record).observe(document.body, { childList: true, subtree: true, characterData: true })
    ;(window as any).__routeLabels = labels
  }, ROUTE_PRINTER.id)
}

const labels = (page: Page): Promise<RouteLabel[]> => page.evaluate(() => (window as any).__routeLabels ?? [])

function parseLabel (label: { at: number, text: string }) {
  const route = /via Bluetooth/i.test(label.text)
    ? 'ble'
    : /through Muon3D/i.test(label.text)
      ? 'cloud'
      : /connected locally|^On this network$|^Ready · On this network$/i.test(label.text) ? 'lan' : null
  return { ...label, status: label.text.split(' · ')[0], route }
}

function routeTransitions (seen: Array<{ at: number, text: string }>) {
  const parsed = seen.map(parseLabel)
  for (const label of parsed) {
    if (!label.route) expect(label.status).toMatch(/^(Reconnecting…|Connecting…|Loading|Offline|Unreachable.*)$/)
  }
  const transitions: string[] = []
  for (const label of parsed) if (label.route && label.route !== transitions.at(-1)) transitions.push(label.route)
  return transitions
}

async function flap (page: Page, account: { printers: Array<{ online?: boolean }> }) {
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 200))
  const start = await page.evaluate(() => Date.now())
  for (let i = 0; i < 10; i++) {
    account.printers[0].online = true
    await cloud(page, true)
    await lan(page, true)
    await page.clock.runFor(1_000)
    await expect.poll(() => page.evaluate(() => (window as any).__e2eRoute.pendingFetches ?? 0)).toBe(0)
    account.printers[0].online = false
    await cloud(page, false)
    await lan(page, false)
    await page.clock.runFor(1_000)
    await expect.poll(() => page.evaluate(() => (window as any).__e2eRoute.pendingFetches ?? 0)).toBe(0)
  }
  expect(await page.evaluate(() => Date.now()) - start).toBe(20_000)
}

test.beforeEach(async ({ page, account }) => {
  await page.clock.install()
  await useAllRoutes(page, account)
  await usePrinter(page, PRESETS.idleHomed({}), { ticks: false })
  const network = { up: true, sockets: new Set<WebSocketRoute>() }
  networkFor.set(page, network)
  await page.route(new RegExp(`^http://localhost:${MOCK_PORT}/`), route => {
    if (new URL(route.request().url()).searchParams.has('e2e_route') || network.up) return route.fallback()
    return route.abort('connectionrefused')
  })
  await page.routeWebSocket(new RegExp(`:${MOCK_PORT}/websocket\\?(?!.*e2e_route=)`), socket => {
    if (!network.up) { socket.close(); return }
    network.sockets.add(socket)
    socket.onClose(() => { network.sockets.delete(socket) })
    const server = socket.connectToServer()
    server.onMessage(raw => {
      const msg = JSON.parse(String(raw))
      if (msg.result?.status) msg.result.status = { ...msg.result.status, ...PRESETS.idleHomed({}) }
      if (msg.method === 'notify_status_update') msg.params[0] = {}
      socket.send(JSON.stringify(msg))
    })
  })
  await page.route(new RegExp(`:${MOCK_PORT}/printer/objects/query`), async route => {
    const response = await route.fetch()
    const json = await response.json()
    json.result.status = { ...json.result.status, ...PRESETS.idleHomed({}) }
    await route.fulfill({ response, json })
  })
  await page.route(new RegExp(`:${MOCK_PORT}/server/muon/identity(?:\\?|$)`), route => route.fulfill({
    json: { name: 'Boxwood', display: ROUTE_PRINTER.name, derived_name: 'boxwood', suffix: '367a', endpoint_id: ROUTE_PRINTER.id },
    headers: { 'access-control-allow-origin': '*' }
  }))
})

test.afterEach(async ({ page }, info) => {
  await info.attach('route-observations', { body: JSON.stringify({ labels: await labels(page), counts: await routeCounts(page) }, null, 2), contentType: 'application/json' })
})

test('Auto on Muon3D offers every explicit route, including its current transport (KAN-3414)', async ({ page }) => {
  await openAuto(page)
  await menu(page)
  await expect(item(page, 'Connect locally')).toBeVisible()
  await expect(item(page, 'Connect locally')).toHaveAttribute('aria-disabled', 'true')
  await expect(item(page, 'Connect locally')).toContainText('Not found on this network')
  await expect(item(page, 'Connect through Muon3D')).toBeVisible()
  await expect(item(page, 'Connect over Bluetooth')).toBeVisible()
  await item(page, 'Connect through Muon3D').click()
  await expect.poll(() => where(page)).toMatchObject({ mode: 'cloud', socketOpen: true })
  await printers(page)
  await menu(page)
  await expect(item(page, 'Connect through Muon3D')).toHaveCount(0)
  await expect(item(page, 'Connect locally')).toBeVisible()
})

test('Auto ignores ten short LAN blips and distrusted relay returns, then upgrades to a stable LAN', async ({ page, account }) => {
  await openAuto(page)
  const before = await routeCounts(page)
  await page.evaluate(async () => {
    const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
    await m.hearNearby()
  })
  // Give Auto a look at the working relay before it goes away.
  await page.clock.runFor(1_000)
  account.printers[0].online = false
  await cloud(page, false)
  await expect.poll(() => where(page), { timeout: 45_000 }).toMatchObject({ mode: 'auto', socketOpen: true, carrying: true })
  await expect(tile(page)).toContainText('Via Bluetooth')
  await recordLabels(page)
  await flap(page, account)
  const duringHold = await labels(page)
  expect(duringHold.length).toBeGreaterThan(0)
  expect(routeTransitions(duringHold)).toEqual(['ble'])
  expect((await routeCounts(page)).sessionEvents.slice(before.sessionEvents.length).filter(event => event.event === 'socket-open').map(event => event.route)).toEqual(['ble'])
  expect(await page.evaluate(async id => {
    const m = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'route-choice.ts'].join('/'))
    return Date.now() - m.relayLostAt(id)
  }, ROUTE_PRINTER.id)).toBeLessThan(30_000)
  await lan(page, true)
  await page.clock.resume()
  await expect.poll(() => where(page), { timeout: 45_000 }).toMatchObject({ activeCloud: null, socketOpen: true, mode: 'auto', apiUrl: `http://localhost:${MOCK_PORT}` })
  await expect(tile(page)).toContainText('On this network')
  const seen = await labels(page)
  expect(routeTransitions(seen)).toEqual(['ble', 'lan'])
  for (const label of seen) {
    const parsed = parseLabel(label)
    if (parsed.route === 'lan') {
      expect(label.lanUp).toBe(true)
      expect(label.at - label.lanSince).toBeGreaterThanOrEqual(3_000)
    }
  }
})

test('explicit Bluetooth stays Bluetooth through ten relay and LAN flaps', async ({ page, account }) => {
  await openAuto(page)
  await choose(page, 'Connect over Bluetooth')
  await expect.poll(() => where(page)).toMatchObject({ carrying: true, mode: 'ble' })
  await expect(tile(page)).toContainText('Via Bluetooth')
  const before = await routeCounts(page)
  await recordLabels(page)
  await flap(page, account)
  const after = await routeCounts(page)
  expect(after.linkEvents).toEqual(before.linkEvents)
  expect(after.sessionEvents.filter(event => event.route === 'ble')).toEqual(before.sessionEvents.filter(event => event.route === 'ble'))
  expect((await labels(page)).map(label => label.text)).toEqual([expect.stringContaining('Via Bluetooth')])
  expect(await where(page)).toMatchObject({ mode: 'ble', socketOpen: true, carrying: true })
  expect(after.sessionEvents.filter(event => event.event === 'socket-open')).toEqual(before.sessionEvents.filter(event => event.event === 'socket-open'))
  await expect(page.getByTestId('bluetooth-fallback')).toHaveCount(0)
})

test('explicit cloud surfaces a drop and never takes LAN or Bluetooth through ten flaps', async ({ page, account }) => {
  await openAuto(page)
  await choose(page, 'Connect through Muon3D')
  await expect.poll(() => where(page)).toMatchObject({ mode: 'cloud' })
  account.printers[0].online = false
  await cloud(page, false)
  await expect(tile(page)).toContainText(/Reconnecting|Offline|Unreachable|Connecting/)
  await recordLabels(page)
  await flap(page, account)
  const seen = await labels(page)
  expect(seen.length).toBeGreaterThan(0)
  expect(seen.every(label => !/Via Bluetooth|^Ready · On this network$/i.test(label.text))).toBe(true)
  expect((await routeCounts(page)).routes.every(route => route === 'cloud')).toBe(true)
  expect(await where(page)).toMatchObject({ mode: 'cloud', apiUrl: 'https://muon-cloud.invalid' })
})

test('explicit LAN surfaces a drop and never takes cloud or Bluetooth through ten flaps', async ({ page, account }) => {
  await openAuto(page)
  await lan(page, true)
  await choose(page, 'Connect locally', false)
  await expect.poll(() => where(page), { timeout: 45_000 }).toMatchObject({ activeCloud: null, socketOpen: true, mode: 'lan', apiUrl: `http://localhost:${MOCK_PORT}` })
  const before = await routeCounts(page)
  await lan(page, false)
  await expect(page.locator('[data-tid="connection-connecting"], [data-tid="connection-reconnecting"], [data-tid="connection-unreachable"]').first()).toBeVisible()
  await printers(page)
  await recordLabels(page)
  await flap(page, account)
  const seen = await labels(page)
  expect(seen.length).toBeGreaterThan(0)
  expect(seen.every(label => !/Via Bluetooth|Muon3D/.test(label.text))).toBe(true)
  expect((await routeCounts(page)).sessionEvents.filter(event => event.event === 'socket-open')).toEqual(before.sessionEvents.filter(event => event.event === 'socket-open'))
  expect(await where(page)).toMatchObject({ mode: 'lan', apiUrl: `http://localhost:${MOCK_PORT}`, activeCloud: null })
})

/** Holds the local network, then takes the printer's local path away: the page must say so and let the person pick. */
async function loseHeldLan (page: Page) {
  await openAuto(page)
  await lan(page, true)
  await choose(page, 'Connect locally', false)
  await expect.poll(() => where(page), { timeout: 45_000 }).toMatchObject({ activeCloud: null, socketOpen: true, mode: 'lan' })
  await expect(page.getByTestId('route-lost-title')).toHaveCount(0)
  // Let the open settle, so the count below is what the drop itself does.
  await page.waitForTimeout(6_000)
  const before = await routeCounts(page)
  await lan(page, false)
  await expect(page.getByTestId('route-lost-title')).toHaveText("Local network isn't reachable", { timeout: 30_000 })
  // Held means held: the drop is said out loud, and nothing moved the session meanwhile.
  const after = await routeCounts(page)
  expect({ dials: after.dials, routes: after.routes.slice(before.routes.length), ev: after.sessionEvents.slice(before.sessionEvents.length) }).toEqual({ dials: before.dials, routes: [], ev: [] })
  await expect(page.getByTestId('route-lost-lan')).toHaveCount(0)
  await expect(page.getByTestId('route-lost-auto')).toBeVisible()
}

test('a held LAN that dies says "Local network isn\'t reachable" and Connect via cloud then connects', async ({ page }) => {
  await loseHeldLan(page)
  await page.getByTestId('route-lost-cloud').click()
  await expect.poll(() => where(page), { timeout: 45_000 }).toMatchObject({ activeCloud: ROUTE_PRINTER.id, socketOpen: true, mode: 'cloud' })
  await expect(page.getByTestId('route-lost-title')).toHaveCount(0)
})

test('a held LAN that dies: Use Auto hands it back and Auto connects through Muon3D', async ({ page }) => {
  await loseHeldLan(page)
  await page.getByTestId('route-lost-auto').click()
  await expect.poll(() => where(page), { timeout: 60_000 }).toMatchObject({ activeCloud: ROUTE_PRINTER.id, socketOpen: true, mode: 'auto' })
  await expect(page.getByTestId('route-lost-title')).toHaveCount(0)
})
