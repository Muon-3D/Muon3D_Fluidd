/**
 * KAN-2487 from the person's side (Jack, 13 Nov, I-257, I-285, I-289):
 *
 * - A printer's menus (its three dots on the printer page and on All printers) list the
 *   routes it is NOT on, and change when the route changes.
 * - A printer that is not open lists all three, the unavailable one greyed with a reason.
 * - Connect locally is open while the printer answers on the network, even over Bluetooth.
 * - A known printer shows on the network before any session is open.
 * - Another account, or none, changes only the Muon3D route: the printer on this network
 *   still connects locally.
 *
 * Every route reaches the same mock printer (e2e/fakes/routes.ts).
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { reachOnLan, routeCounts, ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'

test.use({ signedIn: true, serviceWorkers: 'block' })

const SLOE = { id: '5a1ce0de'.repeat(8), name: 'Sloe 8f21' }

const lastRoute = async (page: Page) => (await routeCounts(page)).routes.at(-1)
const where = (page: Page) => page.evaluate(async () => {
  const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
  return m.where()
})
const item = (page: Page, name: string) => page.getByRole('menuitem', { name: new RegExp(`^${name}`) })
const ID = { local: 'connect-local', cloud: 'connect-cloud', bluetooth: 'connect-bluetooth' } as const
/** The open menu's item for a route, greyed or not (a greyed item is not a menuitem for the accessibility tree). */
const route = (page: Page, id: typeof ID[keyof typeof ID]) => page.locator(`.menuable__content__active [data-action="${id}"]`)
const greyed = /v-list-item--disabled/

/** The printer answers on this network and is linked to nobody: a row under "Found", as LAN discovery lists it. */
async function foundOnLan (page: Page, id: string, name: string) {
  await page.evaluate(async ([port, id, name]) => {
    const discovery = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'discovery.ts'].join('/'))
    discovery.discoveryState.found = [{
      host: `localhost:${port}`,
      aliases: [`localhost:${port}`],
      apiUrl: `http://localhost:${port}`,
      name,
      endpointId: id,
      link: { phase: 'unlinked' }
    }]
    discovery.discoveryState.finishedAt = Date.now()
  }, [MOCK_PORT, id, name] as const)
}

async function allPrinters (page: Page) {
  await page.goto('/')
  await ready(page)
  await page.getByRole('link', { name: 'All printers' }).first().click()
  await expect(page.getByText('Connecting...')).toHaveCount(0, { timeout: 30_000 })
}

const cardMenu = (page: Page, name: string) => page.locator(`button[aria-label="Options for ${name}"]`)

/**
 * Opens the printer's menu: the three dots on its own page, or, on a phone where the page has
 * none, the printer's card in the switcher. Both list the same routes.
 */
async function pageMenu (page: Page, isMobile = false) {
  if (isMobile) {
    // The phone's printer switcher lists the printer's card, with the same menu as All printers.
    if (!await cardMenu(page, ROUTE_PRINTER.name).isVisible()) {
      await page.getByRole('button', { name: 'Switch printer' }).click()
    }
    await cardMenu(page, ROUTE_PRINTER.name).click()
  } else {
    await page.getByTestId('printer-page-menu-button').click()
  }
  await expect(page.locator('.menuable__content__active [data-action]').first()).toBeVisible()
}

test.beforeEach(async ({ page, account }) => {
  await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
  await useAllRoutes(page, account)
  // The printer's own identity names the EndpointId the account lists it under, as a real printer's does,
  // so asking it again (the switcher does, on opening) keeps it the same printer.
  await page.route(`http://localhost:${MOCK_PORT}/server/muon/identity`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ name: 'Boxwood', display: ROUTE_PRINTER.name, derived_name: 'boxwood', suffix: '367a', endpoint_id: ROUTE_PRINTER.id })
  }))
  // A second printer on the account, never opened here: its menu is the main menu.
  account.printers.push({ ...account.printers[0], id: SLOE.id, name: SLOE.name })
})

test('the printer menu lists the routes it is not on, and follows the route it is on', async ({ page, isMobile }) => {
  await allPrinters(page)
  await cardMenu(page, ROUTE_PRINTER.name).click()
  await item(page, 'Connect over Bluetooth').click()
  await expect.poll(() => lastRoute(page)).toBe('ble')
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true, mode: 'ble' })

  // On Bluetooth: Muon3D and Locally, never Bluetooth (Jack: "it still has connect over bluetooth").
  await pageMenu(page, isMobile)
  await expect(item(page, 'Connect through Muon3D')).toBeVisible()
  await expect(route(page, ID.local)).toBeVisible()
  await expect(item(page, 'Connect over Bluetooth')).toHaveCount(0)

  // Pick Muon3D: the menu now offers Bluetooth and Locally, never Muon3D.
  await item(page, 'Connect through Muon3D').click()
  await expect.poll(() => lastRoute(page)).toBe('cloud')
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true, mode: 'cloud' })
  await pageMenu(page, isMobile)
  await expect(item(page, 'Connect over Bluetooth')).toBeVisible()
  await expect(route(page, ID.local)).toBeVisible()
  await expect(item(page, 'Connect through Muon3D')).toHaveCount(0)
})

test('Connect locally is open on Bluetooth when the printer answers on the network, and holds the local route', async ({ page, isMobile }) => {
  await allPrinters(page)
  await cardMenu(page, ROUTE_PRINTER.name).click()
  await item(page, 'Connect over Bluetooth').click()
  await expect.poll(() => lastRoute(page)).toBe('ble')
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true })

  await pageMenu(page, isMobile)
  // Not on the network yet: greyed.
  await expect(route(page, ID.local)).toHaveClass(greyed)
  await page.keyboard.press('Escape')
  await expect(page.locator('.menuable__content__active')).toHaveCount(0)

  await reachOnLan(page)
  await pageMenu(page, isMobile)
  await expect(route(page, ID.local)).not.toHaveClass(greyed)
  await item(page, 'Connect locally').click()
  await expect.poll(async () => (await where(page)).apiUrl).toBe(`http://localhost:${MOCK_PORT}`)
  expect((await where(page)).mode).toBe('lan')
})

test('the main menu of a printer that is not open lists all three, with the unavailable one greyed and why', async ({ page }) => {
  await allPrinters(page)
  await cardMenu(page, SLOE.name).click()
  // One read of the open menu, so a redraw between checks cannot split the answer.
  await expect.poll(() => page.locator('.menuable__content__active [data-action]').evaluateAll(els => els.map(el => ({
    id: (el as HTMLElement).dataset.action,
    greyed: el.classList.contains('v-list-item--disabled'),
    text: el.textContent ?? ''
  })).filter(i => i.id?.startsWith('connect-')))).toMatchObject([
    // Not found on this network: greyed, with a line saying so.
    { id: ID.local, greyed: true, text: expect.stringMatching(/network|this page/i) },
    { id: ID.cloud, greyed: false },
    { id: ID.bluetooth, greyed: false }
  ])
})

test('a known printer shows on the network before any session is opened to it', async ({ page }) => {
  await allPrinters(page)
  await page.evaluate(async ([port, id, name]) => {
    const discovery = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'discovery.ts'].join('/'))
    discovery.discoveryState.found = [{ host: `localhost:${port}`, aliases: [`localhost:${port}`], apiUrl: `http://localhost:${port}`, name, endpointId: id }]
    discovery.discoveryState.finishedAt = Date.now()
  }, [MOCK_PORT, SLOE.id, SLOE.name] as const)
  await expect(page.getByText('on this network', { exact: false }).first()).toBeVisible()
  await cardMenu(page, SLOE.name).click()
  await expect(route(page, ID.local)).not.toHaveClass(greyed)
})

test.describe('another account, or none, changes only the Muon3D route', () => {
  test('signed in as an account that owns no printers, the printer on this network still connects locally', async ({ page, account }) => {
    account.printers = []
    await page.goto('/')
    await ready(page)
    await page.getByRole('link', { name: 'All printers' }).first().click()
    await foundOnLan(page, ROUTE_PRINTER.id, ROUTE_PRINTER.name)
    // Found on this network, not offline, and not behind the account.
    await expect(page.getByTestId('found-connect')).toBeVisible()
    await expect(page.getByTestId('offline')).toHaveCount(0)
    await page.getByTestId('found-connect').click()
    await expect.poll(async () => (await where(page)).apiUrl).toBe(`http://localhost:${MOCK_PORT}`)
    await expect.poll(() => where(page)).toMatchObject({ socketOpen: true })
    expect((await where(page)).activeCloud).toBeNull()
  })

  test('a printer you do not own is offered over Bluetooth, and choosing it holds Bluetooth', async ({ page, account }) => {
    account.printers = []
    await page.goto('/')
    await ready(page)
    await page.getByRole('link', { name: 'All printers' }).first().click()
    // This page has heard the printer over Bluetooth (Look nearby), and it is on no account here.
    expect(await page.evaluate(async () => {
      const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
      return m.hearNearby()
    })).toBe(true)
    await page.getByTestId('found-connect-bluetooth').click()
    await expect.poll(() => lastRoute(page)).toBe('ble')
    await expect.poll(() => where(page)).toMatchObject({ socketOpen: true, mode: 'ble' })
  })

  test.describe('signed out', () => {
    test.use({ signedIn: false })

    test('the printer on this network still connects locally', async ({ page, account }) => {
      account.printers = []
      await page.goto('/')
      await ready(page)
      await page.getByRole('link', { name: 'All printers' }).first().click()
      await foundOnLan(page, ROUTE_PRINTER.id, ROUTE_PRINTER.name)
      await expect(page.getByTestId('found-connect')).toBeVisible()
      await page.getByTestId('found-connect').click()
      await expect.poll(async () => (await where(page)).apiUrl).toBe(`http://localhost:${MOCK_PORT}`)
      await expect.poll(() => where(page)).toMatchObject({ socketOpen: true })
    })
  })
})
