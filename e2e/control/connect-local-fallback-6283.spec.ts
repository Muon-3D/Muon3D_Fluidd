/**
 * KAN-6283 (Jack, 24 Nov, BT Home Hub): the router's DNS rebinding protection returns nothing for
 * `<id>.muonlan.net`, so the in-place probe of the printer's secure name fails although the printer is right here.
 *
 * An https page cannot fall back to the printer's IP in place (http://<ip> is mixed content, https://<ip> has no
 * certificate), so Control says what is wrong, offers the other routes, and opens the printer's own page only when
 * the person clicks for it, in a new tab. A printer on another network says so and never sends anyone to sign in.
 *
 * The page is served at an https origin the way connect-local-same-tab.spec.ts does; the printer's secure origin
 * is a stub that refuses the connection (what a name that does not resolve looks like to the page).
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { MOCK_PORT, VITE_PORT } from '../ports'

test.use({ serviceWorkers: 'block', signedIn: true })

const HOSTED = 'https://control.e2e.test'
const SECURE = 'abcdefghijklmnopqrst.muonlan.net'
const IP = '192.168.1.20'
const item = (page: Page, name: string) => page.locator('.v-list-item').getByText(name, { exact: true })

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

async function nearby (page: Page, printers: Array<{ id: string, name: string, addrs: string[], secure?: string }>) {
  await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key' },
    body: JSON.stringify({
      printers: printers.map(p => ({
        printer_id: p.id, name: p.name, model: 'M1', linked: true, local_addrs: p.addrs, ...(p.secure ? { secure_name: p.secure } : {})
      }))
    })
  }))
}

/** The printer's secure origin never answers: the name does not resolve. */
async function unresolvedName (page: Page) {
  await page.route(/^https:\/\/[a-z2-7]{20}\.muonlan\.net\/.*/, route => route.abort('namenotresolved'))
}

async function start (page: Page, account: Parameters<typeof useAllRoutes>[1], beside: boolean) {
  await useAllRoutes(page, account)
  ;(account.printers[0] as unknown as { secure_name: string }).secure_name = SECURE
  await nearby(page, beside ? [{ id: ROUTE_PRINTER.id, name: ROUTE_PRINTER.name, addrs: [IP], secure: SECURE }] : [])
  await hostedPage(page)
  await page.goto(`${HOSTED}/`)
  await ready(page)
}

async function connectLocally (page: Page) {
  await page.getByRole('button', { name: `Options for ${ROUTE_PRINTER.name}`, exact: true }).first().click()
  await item(page, 'Connect locally').click()
}

test.describe('Connect locally when the secure name does not answer', () => {
  test('beside this browser: says the router blocks the name, offers the routes, and opens the printer page only on a click', async ({ page, context, account }) => {
    const pages: string[] = []
    context.on('page', p => pages.push(p.url()))
    await context.route(new RegExp(`^http://${IP.replace(/\./g, '\.')}/`), route =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>printer</title>' }))
    await unresolvedName(page)
    await start(page, account, true)
    await connectLocally(page)
    await expect(page.getByTestId('route-problem-line')).toContainText("Your network's router is blocking the printer's secure address (DNS rebinding protection)")
    await expect(page.getByTestId('route-problem-detail')).toContainText("allow muonlan.net in the router's DNS rebind exceptions")
    await expect(page.getByTestId('route-choice-cloud')).toBeVisible()
    await expect(page.getByTestId('route-choice-open-page')).toContainText(`http://${IP}/`)
    // Nothing left this page by itself.
    await expect(page).toHaveURL(`${HOSTED}/`)
    expect(pages).toEqual([])
    const opened = context.waitForEvent('page')
    await page.getByTestId('route-choice-open-page').click()
    const popup = await opened
    await popup.waitForURL(`http://${IP}/`)
    await expect(page).toHaveURL(`${HOSTED}/`)
  })

  test('Auto: the click tries the secure name first, then carries on without leaving the page or signing in', async ({ page, context, account }) => {
    const asked: string[] = []
    await page.route(/^https:\/\/[a-z2-7]{20}\.muonlan\.net\/.*/, route => {
      asked.push(new URL(route.request().url()).pathname)
      return route.abort('namenotresolved')
    })
    await start(page, account, true)
    await page.locator('.tile').filter({ hasText: ROUTE_PRINTER.name }).first().click()
    await expect.poll(() => asked).toContain('/server/info')
    await expect(page.getByRole('heading', { name: /sign-in/i })).toHaveCount(0)
    expect(context.pages()).toHaveLength(1)
  })

  test('another network: "This printer isn\'t on your network", the other routes, and never the sign-in page', async ({ page, context, account }) => {
    const pages: string[] = []
    context.on('page', p => pages.push(p.url()))
    await unresolvedName(page)
    await start(page, account, false)
    await connectLocally(page)
    await expect(page.getByTestId('route-problem-line')).toContainText("This printer isn't on your network")
    await expect(page.getByTestId('route-choice-cloud')).toBeVisible()
    await expect(page.getByTestId('route-choice-muon-local')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /sign-in/i })).toHaveCount(0)
    await expect(page.getByTestId('account-dialog')).toHaveCount(0)
    await expect(page).toHaveURL(`${HOSTED}/`)
    expect(pages).toEqual([])
  })

  test('local network access refused: the permission message is unchanged', async ({ page, account }) => {
    await page.addInitScript(() => {
      const query = navigator.permissions.query.bind(navigator.permissions)
      navigator.permissions.query = (d: PermissionDescriptor) =>
        (d as { name: string }).name === 'local-network-access' ? Promise.resolve({ state: 'denied' } as PermissionStatus) : query(d)
    })
    await unresolvedName(page)
    await start(page, account, true)
    await connectLocally(page)
    await expect(page.getByTestId('route-problem-line')).toHaveText(
      "Your browser blocked access to printers on your network. Allow 'local network access' for control.muon3d.com in the address bar, then try again."
    )
    await expect(page.getByTestId('route-problem-detail')).toHaveCount(0)
  })
})
