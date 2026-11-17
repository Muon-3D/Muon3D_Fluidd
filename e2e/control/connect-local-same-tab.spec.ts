/**
 * Jack's 17 Nov walk of control.muon3d.com with Boxwood (his) and Sloe (Harry's), both on his Wi-Fi.
 *
 * - KAN-3581/3582/3584: Connect locally finds a printer the service puts beside this browser and sends
 *   THIS tab to http://<host>.local/ (the printer's own Control). No popup, no new page.
 * - KAN-3586: a printer that is someone else's offers no Link to my account and no Connect through Muon3D.
 * - KAN-3585: a printer that refuses this browser's status reads says Needs access, never Connecting for good.
 *
 * The page has to be https for Control to behave as the hosted site, and the local server is not: the
 * app is served at https://control.e2e.test by proxying every request of that origin to it. The printer's
 * own page (http://muon-sloe-b26d.local/) is a stub; nothing leaves the browser.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { MOCK_PORT, VITE_PORT } from '../ports'

test.use({ serviceWorkers: 'block', signedIn: true })

const HOSTED = 'https://control.e2e.test'
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

async function nearby (page: Page, printers: Array<{ id: string, name: string, linked: boolean, addrs: string[] }>) {
  await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key' },
    body: JSON.stringify({ printers: printers.map(p => ({ printer_id: p.id, name: p.name, model: 'M1', linked: p.linked, local_addrs: p.addrs })) })
  }))
}

/** What the printer itself serves at its own address: a stub, and a record of what was asked for. */
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
  test('Boxwood on the same Wi-Fi: Connect locally moves THIS tab to its .local page, with no popup', async ({ page, context, account }) => {
    const pages: string[] = []
    context.on('page', p => pages.push(p.url()))
    const asked = await printerPages(page, ['muon-boxwood-367a.local', '192.168.1.20'])
    await start(page, account, [{ id: ROUTE_PRINTER.id, name: ROUTE_PRINTER.name, linked: true, addrs: ['10.42.0.1', '192.168.1.20'] }], false)
    await optionsOf(page, ROUTE_PRINTER.name)
    await expect(item(page, 'Connect locally')).toBeVisible()
    await expect(page.getByText('Not found on this network')).toHaveCount(0)
    await item(page, 'Connect locally').click()
    await expect(page).toHaveURL('http://muon-boxwood-367a.local/')
    await expect(page.locator('#printer-own-control')).toBeVisible()
    expect(asked).toEqual(['http://muon-boxwood-367a.local/'])
    expect(pages).toEqual([])
    expect(context.pages()).toHaveLength(1)
    // Leaving for the printer's page chooses no route here: back on this page nothing is held that cannot be dialled.
    await page.goBack()
    await ready(page)
    expect(await page.evaluate(() => sessionStorage.getItem('muon.route.modes') ?? '')).not.toContain('lan')
  })

  test('a renamed printer (Living Room) has no guessable .local name: Connect locally opens its listed host', async ({ page, account }) => {
    const asked = await printerPages(page, ['muon-living-room.local', 'lounge-pi.local'])
    await start(page, account, [{ id: ROUTE_PRINTER.id, name: 'Living Room', linked: true, addrs: ['lounge-pi.local'] }], false, 'Living Room')
    await optionsOf(page, 'Living Room')
    await item(page, 'Connect locally').click()
    await expect(page).toHaveURL('http://lounge-pi.local/')
    expect(asked).toEqual(['http://lounge-pi.local/'])
  })

  test('Sloe, not mine: it opens at its .local name in this tab, and offers no Link or Muon3D route', async ({ page, context, account }) => {
    const pages: string[] = []
    context.on('page', p => pages.push(p.url()))
    const asked = await printerPages(page, ['muon-sloe-b26d.local', '192.168.1.78'])
    await start(page, account, [
      { id: ROUTE_PRINTER.id, name: ROUTE_PRINTER.name, linked: true, addrs: ['192.168.1.20'] },
      { id: SLOE.id, name: SLOE.name, linked: true, addrs: ['192.168.1.78'] }
    ], true)
    await optionsOf(page, SLOE.name)
    await expect(item(page, 'Connect locally')).toBeVisible()
    await expect(item(page, 'Link to my account')).toHaveCount(0)
    await expect(item(page, 'Connect through Muon3D')).toHaveCount(0)
    await item(page, 'Connect locally').click()
    await expect(page).toHaveURL('http://muon-sloe-b26d.local/')
    expect(asked).toEqual(['http://muon-sloe-b26d.local/'])
    expect(pages).toEqual([])
  })

  test('the page words the not-yours section plainly', async ({ page, account }) => {
    await start(page, account, [{ id: SLOE.id, name: SLOE.name, linked: true, addrs: ['192.168.1.78'] }], false)
    await expect(page.getByText('not yours yet')).toHaveCount(0)
  })
})
