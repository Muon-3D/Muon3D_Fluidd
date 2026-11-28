/**
 * Jack, 25 Nov: connected to Smew from control.muon3d.com over its secure name, Chrome showed the site as "Not secure".
 * A page on https must not request anything over http:// or ws:// once it is connected by the secure name: the two
 * routes never mix. The by-address route (http to a private address) is only for a name that did not work, and it
 * alone says "not encrypted".
 *
 * The page is served at an https origin, the printer's secure name is answered whole by the mock printer
 * (e2e/fakes/secure-printer.ts), and every request and websocket the page makes after it is connected is recorded.
 * Desktop and phone both run it.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { lna, lanAsks } from '../fakes/lna'
import { securePrinter } from '../fakes/secure-printer'
import { ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { MOCK_PORT, VITE_PORT } from '../ports'
import { PRESETS, usePrinter } from './printer'

test.use({ serviceWorkers: 'block', signedIn: true })

const HOSTED = 'https://control.e2e.test'
const SECURE = 'abcdefghijklmnopqrst.muonlan.net'
const IP = '192.168.1.20'
const MOCK = `http://localhost:${MOCK_PORT}`

function webcam (uid: string, streamUrl: string, snapshotUrl: string) {
  return {
    uid, name: uid, location: 'printer', service: 'mjpegstreamer', enabled: true, icon: 'mdiWebcam', target_fps: 15, target_fps_idle: 5,
    stream_url: streamUrl, snapshot_url: snapshotUrl, flip_horizontal: false, flip_vertical: false, rotation: 0, aspect_ratio: '16:9',
    source: 'database', extra_data: {}
  }
}

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

/**
 * Everything the page asks for, from before it loads: requests, sockets and console messages, as the browser reports
 * them. `connected()` marks the moment the secure name is up; `after()` is everything past it.
 */
function record (page: Page) {
  const urls: string[] = []
  const console_: string[] = []
  let cut = 0
  page.on('request', r => { urls.push(r.url()) })
  page.on('websocket', w => { urls.push(w.url()) })
  page.on('console', m => { console_.push(m.text()) })
  return {
    urls,
    console: console_,
    connected: () => { cut = urls.length },
    after: () => urls.slice(cut),
    mixedMessages: () => console_.filter(t => /mixed content/i.test(t))
  }
}

/**
 * What is not https/wss. Once connected by the secure name there is no excuse for any, the mock printer's origin
 * included: the only setup step named is the vite dev server's own reload socket, which exists only under test.
 */
const SETUP = [new RegExp(`^ws://localhost:${VITE_PORT}/(\\?token=.*)?$`)]
function mixed (urls: string[]): string[] {
  return urls.filter(u => /^(http|ws):\/\//i.test(u) && !SETUP.some(re => re.test(u)))
}

async function connectLocally (page: Page) {
  await page.getByRole('button', { name: `Options for ${ROUTE_PRINTER.name}`, exact: true }).first().click()
  await page.locator('.v-list-item').getByText('Connect locally', { exact: true }).click()
}

async function expectOnSecureName (page: Page) {
  await expect.poll(() => page.evaluate(async () => {
    const { default: store } = await import(/* @vite-ignore */ ['', 'src', 'store', 'index.ts'].join('/'))
    const st = store.state as any
    return `${st.config.apiUrl}|${st.socket.open && st.socket.ready}`
  }), { timeout: 30_000 }).toBe(`https://${SECURE}|true`)
}

async function goTo (page: Page, path: string) {
  await page.evaluate(async path => {
    const { default: router } = await import(/* @vite-ignore */ ['', 'src', 'router', 'index.ts'].join('/'))
    const { scopedPath } = await import(/* @vite-ignore */ ['', 'src', 'router', 'printerPagePaths.ts'].join('/'))
    const { activeSlug } = await import(/* @vite-ignore */ ['', 'src', 'services', 'printer-pages', 'index.ts'].join('/'))
    await router.push(scopedPath(path, activeSlug()))
  }, path)
}

async function allPrinters (page: Page) {
  const link = page.getByRole('banner').getByRole('link', { name: 'All printers', exact: true })
  if (await link.count()) await link.click()
  else {
    await page.getByTestId('printer-switch').click()
    await page.getByTestId('all-printers').click()
  }
}

async function startSecure (page: Page, account: Parameters<typeof useAllRoutes>[1], webcams: unknown[], persisted = false) {
  await lna(page, 'granted', IP)
  await useAllRoutes(page, account)
  ;(account.printers[0] as unknown as { secure_name: string }).secure_name = SECURE
  const secure = await securePrinter(page, { host: SECURE, endpointId: ROUTE_PRINTER.id, name: ROUTE_PRINTER.name, webcams, address: IP })
  await nearby(page, [IP])
  const seen = record(page)
  if (persisted) {
    // This browser's old state: a printer saved at its address (it was once connected by address), and the addresses
    // Control learned for it. The page is opened on that printer's own address, as a reload would.
    await page.addInitScript(([id, name, ip]) => {
      localStorage.setItem('appInstances', JSON.stringify([{ name, apiUrl: `http://${ip}`, socketUrl: `ws://${ip}/websocket`, active: true, endpointId: id }]))
      localStorage.setItem('muonKnownLanAddrs', JSON.stringify({ [id.toLowerCase()]: [ip] }))
    }, [ROUTE_PRINTER.id, ROUTE_PRINTER.name, IP])
  }
  await hostedPage(page)
  await page.goto(persisted ? `${HOSTED}/boxwood-367a/camera` : `${HOSTED}/`)
  await ready(page)
  return { secure, seen }
}

test.describe('The secure-name route never mixes with http or ws', () => {
  test('connected by the secure name, nothing is asked over http:// or ws://, on any page', async ({ page, account }) => {
    const { seen } = await startSecure(page, account, [webcam('chamber', `http://${IP}/webcam/?action=stream`, `http://${IP}/webcam/?action=snapshot`)])
    await connectLocally(page)
    await expectOnSecureName(page)
    seen.connected()
    await goTo(page, '/camera')
    await expect(page.getByTestId('camera-tile')).toBeVisible()
    await goTo(page, '/')
    await goTo(page, '/camera')
    await expect(page.getByTestId('camera-tile')).toBeVisible()
    // Background discovery on the hosted page asks the service, never an http address.
    await page.evaluate(async () => {
      const d = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'discovery.ts'].join('/'))
      await d.discoverPrinters(true)
      await d.lookForPrinters()
      await d.refreshKnownPrinters()
      await d.refreshLanStatus()
    })
    // The printer's address was never dialled, and nothing else went out unencrypted.
    expect(await lanAsks(page)).toEqual([])
    expect(mixed(seen.after())).toEqual([])
    expect(seen.mixedMessages()).toEqual([])
    expect(seen.urls.some(u => u.startsWith(`https://${SECURE}/`))).toBe(true)
  })

  test('a webcam the printer reports as http://<ip>/webcam/ is loaded from the secure origin', async ({ page, account }) => {
    const { secure, seen } = await startSecure(page, account, [webcam('chamber', `http://${IP}/webcam/?action=stream`, `http://${IP}/webcam/?action=snapshot`)])
    await connectLocally(page)
    await expectOnSecureName(page)
    seen.connected()
    await goTo(page, '/camera')
    await expect.poll(() => secure.cameraPaths.some(p => p.startsWith('/webcam/?action=stream'))).toBe(true)
    expect(seen.urls.filter(u => u.includes(IP))).toEqual([])
    expect(mixed(seen.after())).toEqual([])
    expect(seen.mixedMessages()).toEqual([])
  })

  test('a camera that is only reachable over http says it needs a secure address, and is never asked for', async ({ page, account }) => {
    const { seen } = await startSecure(page, account, [webcam('garage', 'http://garage-cam.e2e:8080/stream', 'http://garage-cam.e2e:8080/snapshot')])
    await connectLocally(page)
    await expectOnSecureName(page)
    seen.connected()
    await goTo(page, '/camera')
    await expect(page.getByTestId('camera-needs-secure').first()).toContainText('needs a secure address')
    expect(seen.urls.filter(u => u.includes('garage-cam.e2e'))).toEqual([])
    expect(mixed(seen.after())).toEqual([])
    expect(seen.mixedMessages()).toEqual([])
  })
})

test.describe('Old saved state in this browser', () => {
  test('a printer saved at http://<ip> and a remembered address are never dialled by themselves: load, connect by secure name, zero http or ws', async ({ page, account }) => {
    const { seen } = await startSecure(page, account, [], true)
    // The deep link opened nothing by itself (no http request); the printer is chosen from the list.
    await allPrinters(page)
    await connectLocally(page)
    await expectOnSecureName(page)
    // From load to now: the saved address was never asked for (the only http/ws before the secure name is the
    // hosted test config's own endpoint, the mock printer, which a real hosted page does not have).
    expect(seen.urls.filter(u => u.includes(IP))).toEqual([])
    seen.connected()
    await goTo(page, '/camera')
    expect(await lanAsks(page)).toEqual([])
    expect(mixed(seen.after())).toEqual([])
    expect(seen.mixedMessages()).toEqual([])
  })
})

test.describe('The by-address route', () => {
  test('still connects when the secure name does not resolve, and alone says "not encrypted"', async ({ page, account }) => {
    await useAllRoutes(page, account)
    ;(account.printers[0] as unknown as { secure_name: string }).secure_name = SECURE
    await page.route(/^https:\/\/[a-z2-7]{20}\.muonlan\.net\/.*/, route => route.abort('namenotresolved'))
    await nearby(page, [IP])
    await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
    await lna(page, 'granted', IP)
    await page.route(`${MOCK}/server/muon/identity`, route => route.fulfill({
      json: { name: ROUTE_PRINTER.name, display: ROUTE_PRINTER.name, endpoint_id: ROUTE_PRINTER.id },
      headers: { 'access-control-allow-origin': '*' }
    }))
    await hostedPage(page)
    await page.goto(`${HOSTED}/`)
    await ready(page)
    await page.locator('.tile').filter({ hasText: ROUTE_PRINTER.name }).first().click()
    await expect.poll(async () => (await lanAsks(page)).some(a => a.url.startsWith(`ws://${IP}/websocket`)), { timeout: 30_000 }).toBe(true)
    await allPrinters(page)
    await expect(page.locator('.tile').filter({ hasText: /Boxwood/i }).first()).toContainText('(by address, not encrypted)', { timeout: 30_000 })
    // A reload (or a deep link) while the secure name still does not resolve reconnects by the same address, with no click.
    await page.reload()
    await ready(page)
    await expect.poll(async () => (await lanAsks(page)).some(a => a.url.startsWith(`ws://${IP}/websocket`)), { timeout: 30_000 }).toBe(true)
  })

  test('on the secure name the printer is not labelled "not encrypted"', async ({ page, account }) => {
    await startSecure(page, account, [])
    await connectLocally(page)
    await expectOnSecureName(page)
    await allPrinters(page)
    const tile = page.locator('.tile').filter({ hasText: /Boxwood/i }).first()
    await expect(tile).toContainText('Connected locally')
    await expect(tile).not.toContainText('not encrypted')
  })
})
