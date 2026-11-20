/**
 * KAN-3413 (Army demo, acceptance A5/B5): the header Bluetooth button (icon only) must open
 * the chooser and connect to the printer picked, online and with the network gone,
 * signed out. The radio and the wasm client are faked (e2e/fakes/blePair.ts).
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { OPEN_PRINTER, pairEvents, setPairingGate, useNearbyPrinters } from '../fakes/blePair'

test.use({ signedIn: false, serviceWorkers: 'block' })

async function press (page: Page) {
  await expect(page.getByTestId('connect-bluetooth')).toBeEnabled()
  await page.getByTestId('connect-bluetooth').click()
  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain(`connect ${OPEN_PRINTER.advertised}`)
  await expect(page).toHaveURL(/\/alder-/)
  await expect(page.getByTestId('pair-failed')).toHaveCount(0)
}

function cloudPrinter (id: string, name: string) {
  const now = Math.floor(Date.now() / 1000)
  return { id, name, model: 'M1', version: '1.0.0', linked_at: 1_700_000_000, last_seen: now, online: true, online_since: 1_700_000_000, role: 'operator' }
}

test.describe('on the account', () => {
  test.use({ signedIn: true })

  test('the header Bluetooth button opens the chooser and connects, online', async ({ page }) => {
    await useNearbyPrinters(page, OPEN_PRINTER)
    await page.route(`${CONSOLE}/v1/printers`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ printers: [cloudPrinter(OPEN_PRINTER.id, 'Alder')] }) }))
    await page.goto('/')
    await ready(page)
    await setPairingGate(page, true)
    await press(page)
  })

  test('the header Bluetooth button connects with the console and relay unreachable', async ({ page }) => {
    await useNearbyPrinters(page, OPEN_PRINTER)
    await page.route(`${CONSOLE}/v1/printers`, route =>
      route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ printers: [cloudPrinter(OPEN_PRINTER.id, 'Alder')] }) }))
    await page.goto('/')
    await ready(page)
    await page.route(`${CONSOLE}/**`, route => route.abort('internetdisconnected'))
    await page.route('https://relay.*/**', route => route.abort('internetdisconnected'))
    // As ble-works-offline.spec.ts: the internet is cut at the console and relay. (context.setOffline would also cut the loopback the fake radio's gateway rides on.)
    await setPairingGate(page, true)
    await press(page)
  })
})

test('signed out and offline, once a printer is listed the header button connects it', async ({ page }) => {
  await useNearbyPrinters(page, OPEN_PRINTER, { advertise: true })
  await page.route(`${CONSOLE}/**`, route => route.abort('internetdisconnected'))
  await page.route('https://relay.*/**', route => route.abort('internetdisconnected'))
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await expect(page.getByTestId('found-pair-bluetooth')).toBeVisible()
  await setPairingGate(page, true)
  await press(page)
})
