/**
 * KAN-6283, Recommendation A and B (Jack, 25 Nov): the router's DNS rebinding protection drops
 * `<id>.muonlan.net`, so the secure name never resolves. Where the browser has Local Network Access (Chrome,
 * Edge 142+) Control connects to the printer's LAN address IN PLACE, on control.muon3d.com, and says "Connected
 * locally (by address)". Everywhere else, or if the person refuses the browser's question, the printer's own
 * page on this network is the primary button, with Bluetooth beside it.
 *
 * The page is served at an https origin the way connect-local-fallback-6283.spec.ts does. The printer's secure
 * name never resolves; the LAN address is the mock printer (e2e/fakes/lna.ts), and what the page asked of any
 * LAN-looking address is recorded, so "never tried" is something the specs can say. Both the desktop and the phone
 * project run it, and every click goes through the same buttons a phone has.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { lna, lanAsks, type LnaMode } from '../fakes/lna'
import { ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { MOCK_PORT, VITE_PORT } from '../ports'
import { PRESETS, usePrinter } from './printer'

test.use({ serviceWorkers: 'block', signedIn: true })

const HOSTED = 'https://control.e2e.test'
const SECURE = 'abcdefghijklmnopqrst.muonlan.net'
const IP = '192.168.1.20'
const MOCK = `http://localhost:${MOCK_PORT}`
const PREPROMPT = 'Chrome will ask to allow access to devices on your local network. Allow it to connect directly.'
const item = (page: Page, name: string) => page.locator('.v-list-item').getByText(name, { exact: true })

async function hostedPage (page: Page) {
  await page.route(`${HOSTED}/**`, async route => {
    const url = new URL(route.request().url())
    const response = await route.fetch({ url: `http://localhost:${VITE_PORT}${url.pathname}${url.search}` })
    if (url.pathname !== '/config.json') return route.fulfill({ response })
    const config = await response.json()
    config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
    config.endpoints = [MOCK]
    return route.fulfill({ response, json: config })
  })
}

async function nearby (page: Page, addrs: string[]) {
  await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key' },
    body: JSON.stringify({
      printers: [{ printer_id: ROUTE_PRINTER.id, name: ROUTE_PRINTER.name, model: 'M1', linked: true, local_addrs: addrs, secure_name: SECURE }]
    })
  }))
}

/** The printer says who it is. `gate` holds the answer until the spec lets it go (the browser's question is open). */
async function identity (page: Page, id: string, gate?: Promise<void>) {
  await page.route(`${MOCK}/server/muon/identity`, async route => {
    if (gate) await gate
    await route.fulfill({
      json: { name: ROUTE_PRINTER.name, display: ROUTE_PRINTER.name, endpoint_id: id, derived_name: 'boxwood', suffix: '367a' },
      headers: { 'access-control-allow-origin': '*' }
    })
  })
}

/** `who`: what the printer at the address says it is. Registered after the mock printer's own routes, so it answers first. */
async function start (page: Page, account: Parameters<typeof useAllRoutes>[1], mode: LnaMode, addrs: string[], who?: { id: string, gate?: Promise<void> }) {
  await lna(page, mode, IP)
  await useAllRoutes(page, account)
  ;(account.printers[0] as unknown as { secure_name: string }).secure_name = SECURE
  // The name never resolves: the router drops it.
  await page.route(/^https:\/\/[a-z2-7]{20}\.muonlan\.net\/.*/, route => route.abort('namenotresolved'))
  await nearby(page, addrs)
  await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  if (who) await identity(page, who.id, who.gate)
  await hostedPage(page)
  await page.goto(`${HOSTED}/`)
  await ready(page)
}

async function connectLocally (page: Page) {
  await page.getByRole('button', { name: `Options for ${ROUTE_PRINTER.name}`, exact: true }).first().click()
  await item(page, 'Connect locally').click()
}

function consoleOf (page: Page) {
  const seen: string[] = []
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) seen.push(m.text().slice(0, 200)) })
  page.on('pageerror', e => seen.push(`pageerror ${e.message}`.slice(0, 200)))
  return seen
}

/** No problem is showing; when one is, the failure says what it is, what the page asked of the LAN and what the console said. */
async function expectConnected (page: Page, seen: string[]) {
  await expect.poll(async () => {
    const problem = await page.getByTestId('route-problem-line').allTextContents()
    if (!problem.length) return 'none'
    const why = await page.evaluate(async () => {
      const m = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'activate.ts'].join('/'))
      return m.activationState.error
    }).catch(() => 'unreadable')
    return JSON.stringify({ problem, activation: why, asks: await lanAsks(page), console: seen.slice(-8) })
  }, { timeout: 20000 }).toBe('none')
}

/** The printer's tile says "Connected locally (by address)"; when it does not, the failure says what the page was on. */
async function expectBadge (page: Page) {
  await expect.poll(async () => {
    const text = await page.locator('.tile').filter({ hasText: /Boxwood/i }).first().innerText().catch(() => '')
    if (text.includes('Connected locally') && text.includes('(by address)')) return 'badge'
    const state = await page.evaluate(async () => {
      const { default: store } = await import(/* @vite-ignore */ ['', 'src', 'store', 'index.ts'].join('/'))
      const st = store.state as any
      return {
        apiUrl: st.config.apiUrl,
        socket: { open: st.socket.open, ready: st.socket.ready, apiConnected: st.socket.apiConnected, connecting: st.socket.connecting },
        instances: (st.config.instances ?? []).map((i: any) => [i.apiUrl, i.endpointId, i.active]),
        direct: (await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'direct-address-state.ts'].join('/'))).directAddressState.host
      }
    }).catch((e: Error) => ({ unreadable: e.message }))
    return JSON.stringify({ text, state, asks: (await lanAsks(page)).map(a => a.url) })
  }, { timeout: 20000 }).toBe('badge')
}

async function allPrinters (page: Page) {
  const link = page.getByRole('banner').getByRole('link', { name: 'All printers', exact: true })
  if (await link.count()) await link.click()
  else {
    const sheet = page.locator('.printer-switch__sheet.v-dialog--active')
    if (await sheet.isVisible()) {
      await page.keyboard.press('Escape')
      await expect(sheet).toBeHidden()
    }
    await page.getByTestId('printer-switch').click()
    await page.getByTestId('all-printers').click()
    await expect(sheet).toBeHidden()
  }
  await expect(page.getByRole('heading', { name: 'All printers', exact: true })).toBeVisible()
}

/** What the person is left with when no way in place worked: the printer's own page first, Bluetooth beside it. */
async function expectFallbackButtons (page: Page) {
  await expect(page.getByTestId('route-choice-open-page')).toHaveText(`Open ${ROUTE_PRINTER.name} on this network`)
  await expect(page.getByTestId('route-choice-bluetooth')).toHaveText('Connect over Bluetooth')
  await expect(page).toHaveURL(`${HOSTED}/`)
}

test.describe('Connect locally by address when the secure name is blocked', () => {
  test('Chrome with Local Network Access: the browser question is explained first, then it connects in place, by address', async ({ page, context, account }) => {
    const seen = consoleOf(page)
    let release!: () => void
    await start(page, account, 'supported', ['10.42.0.1', IP], { id: ROUTE_PRINTER.id, gate: new Promise<void>(resolve => { release = resolve }) })
    await connectLocally(page)
    // The browser's question is open: the person is told what it is for before the request that causes it.
    await expect(page.getByTestId('route-notice')).toContainText(PREPROMPT)
    release()
    await page.evaluate(() => (window as any).__lanGrant())
    await expect(page.getByTestId('route-notice')).toHaveCount(0)
    await expectConnected(page, seen)
    await expect(page).toHaveURL(new RegExp(`^${HOSTED}/boxwood-367a`))
    await allPrinters(page)
    await expectBadge(page)
    // In place on this page, declared local, over the printer's address and never its hotspot; no tab opened.
    const asks = await lanAsks(page)
    expect(asks).toContainEqual({ url: `http://${IP}/server/muon/identity`, space: 'local' })
    expect(asks.map(a => a.url).filter(u => u.includes('10.42.0.1'))).toEqual([])
    expect(asks.some(a => a.url.startsWith(`ws://${IP}/websocket`))).toBe(true)
    expect(context.pages()).toHaveLength(1)
  })

  test('already allowed, Auto: a click on the printer connects by address before Muon3D', async ({ page, account }) => {
    const seen = consoleOf(page)
    await start(page, account, 'granted', [IP], { id: ROUTE_PRINTER.id })
    await page.locator('.tile').filter({ hasText: ROUTE_PRINTER.name }).first().click()
    await expect.poll(async () => (await lanAsks(page)).some(a => a.url.startsWith(`ws://${IP}/websocket`))).toBe(true)
    await expectConnected(page, seen)
    await allPrinters(page)
    await expectBadge(page)
  })

  test('another printer answers at that address: it is never shown as this one, and the fallback buttons show', async ({ page, account }) => {
    await start(page, account, 'granted', [IP], { id: 'cd34'.repeat(16) })
    await connectLocally(page)
    await expect(page.getByTestId('route-problem-line')).toContainText('DNS rebinding protection')
    await expectFallbackButtons(page)
    expect((await lanAsks(page)).some(a => a.url.startsWith('ws://'))).toBe(false)
    await allPrinters(page)
    await expect(page.locator('.tile').filter({ hasText: /Boxwood/i })).not.toContainText('(by address)')
  })

  test('a browser without Local Network Access: the printer page on this network is the primary button, with Bluetooth; nothing is dialled', async ({ page, context, account }) => {
    await context.route(new RegExp(`^http://${IP.replace(/\./g, '\\.')}/`), route =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>printer</title>' }))
    await start(page, account, 'unsupported', [IP])
    await connectLocally(page)
    await expect(page.getByTestId('route-problem-line')).toContainText('DNS rebinding protection')
    await expect(page.getByTestId('route-problem-detail')).toContainText("allow muonlan.net in the router's DNS rebind exceptions")
    await expectFallbackButtons(page)
    // The first button is the printer's page, the second Bluetooth.
    await expect(page.getByTestId('route-problem').locator('button').first()).toHaveAttribute('data-tid', 'route-choice-open-page')
    expect(await lanAsks(page)).toEqual([])
    const opened = context.waitForEvent('page')
    await page.getByTestId('route-choice-open-page').click()
    const popup = await opened
    await popup.waitForURL(`http://${IP}/boxwood-367a`)
    await expect(page).toHaveURL(`${HOSTED}/`)
  })

  test('the person refused the browser question: the permission line, the printer page and Bluetooth; nothing is dialled', async ({ page, account }) => {
    await start(page, account, 'denied', [IP])
    await connectLocally(page)
    await expect(page.getByTestId('route-problem-line')).toContainText("Allow 'local network access'")
    await expectFallbackButtons(page)
    expect((await lanAsks(page)).filter(a => a.url.includes(IP))).toEqual([])
  })

  test('an address that is not private is never tried', async ({ page, account }) => {
    await start(page, account, 'granted', ['8.8.8.8', '203.0.113.9', '10.42.0.1'])
    await connectLocally(page)
    await expect(page.getByTestId('route-problem-line')).toContainText('DNS rebinding protection')
    await expect(page.getByTestId('route-choice-open-page')).toBeVisible()
    expect(await lanAsks(page)).toEqual([])
  })
})
