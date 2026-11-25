/**
 * KAN-6743 (Jack, 25 Nov): connecting locally showed no spinner like Bluetooth does, and the All printers tile
 * stayed on a grey "Connecting" although the printer was connected.
 *
 * - The tile shows its spinner from the click until the printer is connected or the try failed, over the secure
 *   name and over the address (a delayed answer holds the connect open, so the spinner is something to wait on).
 * - A browser that already holds other saved printers never adds the printer opened in place to its saved list;
 *   the tile then took the account's status read (none) and stayed on Connecting. Both specs run with such a list.
 *
 * The page is served at an https origin the way connect-direct-address-6283.spec.ts does. Desktop and phone run it;
 * every click is on the tile, which a phone has too.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { lna } from '../fakes/lna'
import { CONSOLE } from '../fakes/console'
import { ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { MOCK_PORT, VITE_PORT } from '../ports'
import { PRESETS, usePrinter } from './printer'

test.use({ serviceWorkers: 'block', signedIn: true })

const HOSTED = 'https://control.e2e.test'
const SECURE = 'abcdefghijklmnopqrst.muonlan.net'
const IP = '192.168.1.20'
const MOCK = `http://localhost:${MOCK_PORT}`

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

/** This browser already holds another printer, so the one opened in place is not added to its saved list. */
async function otherSaved (page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('appInstances', JSON.stringify([{
      name: 'Walnut', apiUrl: 'http://muon-walnut-aaaa.local', socketUrl: 'ws://muon-walnut-aaaa.local/websocket', active: false, endpointId: 'ee'.repeat(32)
    }]))
  })
}

/** Holds the printer's answer at `path` once `armed.on` is set (after the page has started), so the connect is slow. */
const armed = { on: false }
async function slow (page: Page, path: string, gate: Promise<void>) {
  await page.route(`${MOCK}${path}`, async route => {
    if (armed.on) await gate
    await route.fallback()
  })
}

const tileOf = (page: Page) => page.locator('.tile').filter({ hasText: ROUTE_PRINTER.name }).first()

async function expectSpinnerThenReady (page: Page, release: () => void) {
  const tile = tileOf(page)
  armed.on = true
  await tile.click()
  await expect(tile.getByTestId('tile-connecting')).toBeVisible()
  release()
  await expect(tile.getByTestId('tile-connecting')).toHaveCount(0)
  await expect(page).toHaveURL(new RegExp(`^${HOSTED}/boxwood-367a`))
  const link = page.getByRole('banner').getByRole('link', { name: 'All printers', exact: true })
  if (await link.count()) await link.click()
  else {
    await page.getByTestId('printer-switch').click()
    await page.getByTestId('all-printers').click()
  }
  await expect(page.getByRole('heading', { name: 'All printers', exact: true })).toBeVisible()
  // Ready, and never left on Connecting beside a connected printer.
  await expect(tileOf(page)).toContainText('Ready')
  await expect(tileOf(page)).not.toContainText('Connecting')
}

test.describe('A local connect shows it is connecting, and the tile says Ready after', () => {
  test('by address: spinner while the printer is slow to answer, then Ready', async ({ page, account }) => {
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    await useAllRoutes(page, account)
    ;(account.printers[0] as unknown as { secure_name: string }).secure_name = SECURE
    await page.route(/^https:\/\/[a-z2-7]{20}\.muonlan\.net\/.*/, route => route.abort('namenotresolved'))
    await nearby(page, [IP])
    await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
    await lna(page, 'granted', IP)
    await page.route(`${MOCK}/server/muon/identity`, async route => {
      await gate
      await route.fulfill({
        json: { name: ROUTE_PRINTER.name, display: ROUTE_PRINTER.name, endpoint_id: ROUTE_PRINTER.id, derived_name: 'boxwood', suffix: '367a' },
        headers: { 'access-control-allow-origin': '*' }
      })
    })
    await otherSaved(page)
    await hostedPage(page)
    await page.goto(`${HOSTED}/`)
    await ready(page)
    await expectSpinnerThenReady(page, release)
  })

  test('by secure name: spinner while the probe is slow, then Ready', async ({ page, account }) => {
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    await useAllRoutes(page, account)
    ;(account.printers[0] as unknown as { secure_name: string }).secure_name = SECURE
    await nearby(page, [])
    await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
    // The secure name answers as the mock printer does, by the same route the address spec uses.
    await lna(page, 'granted', SECURE)
    await slow(page, '/server/info', gate)
    await otherSaved(page)
    await hostedPage(page)
    await page.goto(`${HOSTED}/`)
    await ready(page)
    await expectSpinnerThenReady(page, release)
  })
})
