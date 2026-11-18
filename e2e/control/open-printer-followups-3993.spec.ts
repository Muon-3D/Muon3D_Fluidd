/**
 * KAN-3993, follow-ups to Jack's D-166 (open printers over Bluetooth):
 *
 * - A printer that reports itself Open shows no "Ask for access" / "Ask its owner", even when it is linked to
 *   another account; a protected printer linked to another account keeps it.
 * - An Open printer carried over Bluetooth lets the person in with no code. (The relay-fallback case, where Open
 *   must not count, is covered by the unit test in pairing.spec.ts: the fake radio cannot yet model a silent
 *   but connected link.)
 *
 * Everything is faked: page.route for the network printer, e2e/fakes/blePair.ts for the radio. No printer is touched.
 * Runs at desktop 1440x900 and phone 390x844.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { OPEN_PRINTER, pairEvents, setPairingGate, useNearbyPrinters } from '../fakes/blePair'

const FOUND_HOST = '192.168.77.6'

/** A printer found on this network, linked to another account, saying how it lets strangers in. */
async function foundPrinterOfAnotherAccount (page: Page, entry: 'open' | 'protected') {
  await page.route(`${CONSOLE}/v1/printers`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ printers: [] }) }))
  await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ printers: [{ printer_id: 'larch-41c2', name: 'muon-larch-41c2', model: 'M1', linked: true, local_addrs: [FOUND_HOST] }] })
  }))
  await page.route(`http://${FOUND_HOST}/**`, route => {
    const url = new URL(route.request().url())
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (url.pathname === '/server/muon/link') {
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ result: { phase: 'linked', account: 'someone.else@example.com' } }) })
    }
    if (url.pathname === '/server/muon/identity') {
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ name: 'muon-larch-41c2', display: 'muon-larch-41c2', endpoint_id: 'larch-41c2', derived_name: 'larch', suffix: '41c2', entry }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ result: { status: { webhooks: { state: 'ready' }, print_stats: { state: 'standby' } } } }) })
  })
}

async function foundTile (page: Page) {
  await page.goto('/')
  await ready(page)
  await page.getByTestId('view-bench').click()
  const tile = page.getByTestId('found').locator('[data-tid^="printer-tile-"]').first()
  await expect(tile).toContainText('Larch', { timeout: 30_000 })
  return tile
}

test.describe('signed in', () => {
  test.use({ signedIn: true, serviceWorkers: 'block' })

  test('an Open printer linked to another account offers no Ask for access', async ({ page }) => {
    await foundPrinterOfAnotherAccount(page, 'open')
    const tile = await foundTile(page)
    await expect(tile.getByTestId('bench-action-ask')).toHaveCount(0)
    await expect(page.getByText('Ask for access')).toHaveCount(0)
  })

  test('control: a protected printer linked to another account keeps Ask its owner', async ({ page }) => {
    await foundPrinterOfAnotherAccount(page, 'protected')
    const tile = await foundTile(page)
    await expect(tile.getByTestId('bench-action-ask')).toHaveText('Ask its owner')
  })
})

test.describe('signed out, over Bluetooth', () => {
  test.use({ signedIn: false, serviceWorkers: 'block' })

  async function nearby (page: Page) {
    await useNearbyPrinters(page, OPEN_PRINTER, { advertise: true })
    await page.goto('/')
    await ready(page)
    await page.getByRole('button', { name: 'Look nearby' }).click()
    await expect(page.getByTestId('found-pair-bluetooth')).toBeVisible()
    await setPairingGate(page, true)
    await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  }

  test('an Open printer carried over Bluetooth lets the person in with no code', async ({ page }) => {
    await nearby(page)
    await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain(`connect ${OPEN_PRINTER.advertised}`)
    await expect(page).toHaveURL(/\/alder-6601(\/|$)/)
    await expect(page.getByTestId('pair-code-step')).toHaveCount(0)
  })
})
