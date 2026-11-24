/**
 * Jack's 17 Nov walk of control.muon3d.com with Boxwood (his) and Sloe (Harry's), both on his Wi-Fi.
 *
 * - KAN-3581/3582/3584, now KAN-5459: Connect locally finds a printer the service puts beside this browser and
 *   connects to it IN PLACE over its secure name (https/wss://<label>.muonlan.net). The tab never goes to a
 *   printer's own address; a failure stays local, says so and offers the other routes.
 * - KAN-3586: a printer that is someone else's offers no Link to my account and no Connect through Muon3D.
 * - KAN-3585: a printer that refuses this browser's status reads says Needs access, never Connecting for good.
 *
 * The page has to be https for Control to behave as the hosted site, and the local server is not: the
 * app is served at https://control.e2e.test by proxying every request of that origin to it. The printer's
 * secure origin is a stub (the probe answers, or is refused); nothing leaves the browser.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { MOCK_PORT, VITE_PORT } from '../ports'

test.use({ serviceWorkers: 'block', signedIn: true })

const HOSTED = 'https://control.e2e.test'
const SECURE = 'abcdefghijklmnopqrst.muonlan.net'
const SLOE = { id: '8f21abcd'.repeat(8), name: 'Sloe b26d' }
const item = (page: Page, name: string) => page.locator('.v-list-item').getByText(name, { exact: true })

/** Serves the app at an https origin, so Control takes the hosted path. Registered last, so it answers first. */
async function hostedPage (page: Page) {
  await page.route(`${HOSTED}/**`, async route => {
    const url = new URL(route.request().url())
    const response = await route.fetch({ url: `http://localhost:${VITE_PORT}${url.pathname}${url.search}` })
    if (url.pathname !== '/config.json') return route.fulfill({ response })
    const config = await response.json()
    config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
    config.endpoints = [`http://localhost:${MOCK_PORT}`]
    return route.fulfill({ response, json: config })
  })
}

async function nearby (page: Page, printers: Array<{ id: string, name: string, linked: boolean, addrs: string[], secure?: string }>) {
  await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key' },
    body: JSON.stringify({
      printers: printers.map(p => ({
        printer_id: p.id, name: p.name, model: 'M1', linked: p.linked, local_addrs: p.addrs, ...(p.secure ? { secure_name: p.secure } : {})
      }))
    })
  }))
}

/** The printer's secure origin: the paths asked of it, and whether Moonraker's /server/info answers (the in-place probe). */
async function secureOrigin (page: Page, answers: boolean) {
  const seen: string[] = []
  await page.route(/^https:\/\/[a-z2-7]{20}\.muonlan\.net\/.*/, route => {
    const path = new URL(route.request().url()).pathname
    seen.push(path)
    if (answers && path === '/server/info') {
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"result":{"klippy_state":"ready"}}' })
    }
    return route.abort('connectionrefused')
  })
  return seen
}

/** What the printer itself would serve at its own address: a stub, and a record of what was asked for. Nothing should ask. */
async function printerPages (page: Page, hosts: string[]) {
  const asked: string[] = []
  // Nothing in a spec reaches a real printer: any private address not stubbed below is refused here.
  await page.route(/^http:\/\/(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|[a-z0-9-]+\.local[/:])/i, route => route.abort('connectionrefused'))
  for (const host of hosts) {
    await page.route(new RegExp(`^http://${host.replace(/\./g, '\\.')}/`), route => {
      asked.push(route.request().url())
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>printer</title><h1 id="printer-own-control">Printer</h1>' })
    })
  }
  return asked
}

async function start (page: Page, account: Parameters<typeof useAllRoutes>[1], nearbyList: Parameters<typeof nearby>[1], saved: boolean, renamedTo?: string) {
  await useAllRoutes(page, account)
  if (renamedTo) account.printers[0].name = renamedTo
  if (saved) {
    await page.addInitScript(([id, name]) => {
      localStorage.setItem('appInstances', JSON.stringify([{
        name, apiUrl: 'http://muon-sloe-b26d.local', socketUrl: 'ws://muon-sloe-b26d.local/websocket', active: false, endpointId: id, mdnsHost: 'muon-sloe-b26d.local'
      }]))
    }, [SLOE.id, SLOE.name])
  }
  await nearby(page, nearbyList)
  await hostedPage(page)
  await page.goto(`${HOSTED}/`)
  await ready(page)
}

async function optionsOf (page: Page, name: string) {
  await page.getByRole('button', { name: `Options for ${name}`, exact: true }).first().click()
}

test.describe('Connect locally from the hosted page', () => {
  test('Boxwood on the same Wi-Fi with a secure name: Connect locally connects IN PLACE, the address stays, no popup', async ({ page, context, account }) => {
    const pages: string[] = []
    context.on('page', p => pages.push(p.url()))
    const asked = await printerPages(page, ['muon-boxwood-367a.local', '192.168.1.20'])
    const seen = await secureOrigin(page, true)
    await start(page, account, [{ id: ROUTE_PRINTER.id, name: ROUTE_PRINTER.name, linked: true, addrs: ['10.42.0.1', '192.168.1.20'], secure: SECURE }], false)
    await optionsOf(page, ROUTE_PRINTER.name)
    await expect(item(page, 'Connect locally')).toBeVisible()
    await expect(page.getByText('Not found on this network')).toHaveCount(0)
    await item(page, 'Connect locally').click()
    // The in-place attempt: Moonraker on the secure name. The mock cannot serve the rest of a TLS printer origin.
    await expect.poll(() => seen).toContain('/server/info')
    await expect(page).toHaveURL(`${HOSTED}/`)
    expect(asked).toEqual([])
    expect(pages).toEqual([])
    expect(context.pages()).toHaveLength(1)
  })

  test('a picked Connect locally whose secure name does not answer stays local: the message and the other routes, nothing opened', async ({ page, context, account }) => {
    const pages: string[] = []
    context.on('page', p => pages.push(p.url()))
    const asked = await printerPages(page, ['muon-boxwood-367a.local', '192.168.1.20'])
    await secureOrigin(page, false)
    await start(page, account, [{ id: ROUTE_PRINTER.id, name: ROUTE_PRINTER.name, linked: true, addrs: ['192.168.1.20'], secure: SECURE }], false)
    await optionsOf(page, ROUTE_PRINTER.name)
    await item(page, 'Connect locally').click()
    await expect(page.getByTestId('route-problem-line')).toContainText('DNS rebinding protection')
    await expect(page.getByTestId('route-choice-cloud')).toBeVisible()
    // The muon3d.local choice is now the printer's own page, opened only by a click (KAN-6283): nothing left yet.
    await expect(page.getByTestId('route-choice-open-page')).toBeVisible()
    await expect(page).toHaveURL(`${HOSTED}/`)
    expect(asked).toEqual([])
    expect(pages).toEqual([])
  })

  test('a renamed printer (Living Room) has no guessable .local name: Connect locally goes to no guessed or listed host', async ({ page, account }) => {
    const asked = await printerPages(page, ['muon-living-room.local', 'lounge-pi.local'])
    await start(page, account, [{ id: ROUTE_PRINTER.id, name: 'Living Room', linked: true, addrs: ['lounge-pi.local'] }], false, 'Living Room')
    await optionsOf(page, 'Living Room')
    await expect(page.locator('.v-list-item', { hasText: 'Connect locally' })).toContainText('Needs its secure address')
    await item(page, 'Connect locally').click({ force: true }).catch(() => undefined)
    await expect(page).toHaveURL(`${HOSTED}/`)
    expect(asked).toEqual([])
  })

  test('Sloe, not mine: Connect locally tries its secure name in this tab, and offers no Link or Muon3D route', async ({ page, context, account }) => {
    const pages: string[] = []
    context.on('page', p => pages.push(p.url()))
    const asked = await printerPages(page, ['muon-sloe-b26d.local', '192.168.1.78'])
    const seen = await secureOrigin(page, true)
    await start(page, account, [
      { id: ROUTE_PRINTER.id, name: ROUTE_PRINTER.name, linked: true, addrs: ['192.168.1.20'] },
      { id: SLOE.id, name: SLOE.name, linked: true, addrs: ['192.168.1.78'], secure: SECURE }
    ], true)
    await optionsOf(page, SLOE.name)
    await expect(item(page, 'Connect locally')).toBeVisible()
    await expect(item(page, 'Link to my account')).toHaveCount(0)
    await expect(item(page, 'Connect through Muon3D')).toHaveCount(0)
    await item(page, 'Connect locally').click()
    await expect.poll(() => seen).toContain('/server/info')
    await expect(page).toHaveURL(`${HOSTED}/`)
    expect(asked).toEqual([])
    expect(pages).toEqual([])
  })

  // KAN-4898: Sloe's relay keeps dropping, so the nearby list is empty, yet the printer told Control its name. That name
  // is a printer's own address: never navigated to (KAN-5459). Without a secure name there is no local route from here.
  test('Sloe with an empty nearby list: the name the printer reported is not opened; Connect locally says it needs the secure address', async ({ page, context, account }) => {
    const pages: string[] = []
    context.on('page', p => pages.push(p.url()))
    const asked = await printerPages(page, ['muon-sloe-b26d.local'])
    await start(page, account, [], true)
    await optionsOf(page, SLOE.name)
    const entry = page.locator('.v-list-item', { hasText: 'Connect locally' })
    await expect(entry).toBeVisible()
    await expect(entry).toContainText('Needs its secure address')
    await item(page, 'Connect locally').click({ force: true }).catch(() => undefined)
    await expect(page).toHaveURL(`${HOSTED}/`)
    expect(asked).toEqual([])
    expect(pages).toEqual([])
  })

  test('negative control: nothing the printer said and an empty nearby list stays Not found, and the page stays', async ({ page, account }) => {
    // Sloe's display name implies muon-sloe-b26d.local, but that is a guess: it is never offered on its own.
    const asked = await printerPages(page, ['muon-sloe-b26d.local'])
    await start(page, account, [], false)
    await expect(page).toHaveURL(`${HOSTED}/`)
    await optionsOf(page, ROUTE_PRINTER.name)
    await expect(item(page, 'Connect locally')).toBeVisible()
    await expect(page.locator('.v-list-item', { hasText: 'Connect locally' })).toContainText('Not found on this network')
    await item(page, 'Connect locally').click({ force: true }).catch(() => undefined)
    await expect(page).toHaveURL(`${HOSTED}/`)
    expect(asked).toEqual([])
  })

  test('the page words the not-yours section plainly', async ({ page, account }) => {
    await start(page, account, [{ id: SLOE.id, name: SLOE.name, linked: true, addrs: ['192.168.1.78'] }], false)
    await expect(page.getByText('not yours yet')).toHaveCount(0)
  })
})
