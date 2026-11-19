/**
 * KAN-4369 / KAN-4368 (Army demo): there is no internet, only the printer's
 * hotspot and Bluetooth. Bluetooth must never need the Muon3D service: the
 * relay address is the cloud's if the page has it, else the last one cached,
 * else the production relay built into Control.
 *
 * Every request to the console and relay is blocked at the route level, so the
 * cloud is unreachable. Only the radio and the wasm client are faked
 * (e2e/fakes/blePair.ts), as in open-printer-ble.spec.ts. Nobody is signed in.
 * Desktop 1440x900 and phone 390x844.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { OPEN_PRINTER, pairEvents, setPairingGate, useNearbyPrinters } from '../fakes/blePair'
import { DEFAULT_RELAY_URL, RELAY_CACHE_KEY } from '../../src/services/muon-cloud/relay'

test.use({ signedIn: false, serviceWorkers: 'block' })

const UNREACHABLE = /Muon3D could not be reached|has not reached Muon3D/

async function offlineNearby (page: Page, cachedRelay?: string) {
  await useNearbyPrinters(page, OPEN_PRINTER, { advertise: true })
  // Registered after the fake's own routes, so it wins: the cloud and the relay answer nothing.
  await page.route(`${CONSOLE}/**`, route => route.abort('internetdisconnected'))
  await page.route('https://relay.*/**', route => route.abort('internetdisconnected'))
  if (cachedRelay) await page.addInitScript(([key, url]) => { try { localStorage.setItem(key, url) } catch { /* none */ } }, [RELAY_CACHE_KEY, cachedRelay])
  await page.goto('/')
  await ready(page)
  // A reload with the cloud gone: the page keeps nothing of the console in memory.
  await page.reload()
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await expect(page.getByTestId('found-pair-bluetooth')).toBeVisible()
  await setPairingGate(page, true)
}

async function openOverBluetooth (page: Page) {
  await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain(`connect ${OPEN_PRINTER.advertised}`)
  await expect(page).toHaveURL(/\/alder-6601(\/|$)/)
  await expect(page.locator('body')).not.toContainText(UNREACHABLE)
  await expect(page.getByTestId('pair-failed')).toHaveCount(0)
}

const relaysUsed = (page: Page) => page.evaluate(() => (window as any).__e2ePair.relays as string[])

test('offline after a reload, an Open printer opens over Bluetooth on the cached relay', async ({ page }) => {
  await offlineNearby(page, 'https://relay2.muon3d.com/')
  await openOverBluetooth(page)
  expect(await relaysUsed(page)).toEqual(['https://relay2.muon3d.com/'])
})

test('offline on a first load with nothing cached, Bluetooth uses the built-in relay', async ({ page }) => {
  await offlineNearby(page)
  expect(await page.evaluate(key => localStorage.getItem(key), RELAY_CACHE_KEY)).toBeNull()
  await openOverBluetooth(page)
  expect(await relaysUsed(page)).toEqual([DEFAULT_RELAY_URL])
})

test('offline, a guest on an Open printer can upload and print over Bluetooth', async ({ page }) => {
  await offlineNearby(page)
  await openOverBluetooth(page)
  // In-app, so the Bluetooth session stays up (a page load would end it).
  await page.evaluate(async () => {
    // eslint-disable-next-line import/no-absolute-path
    const { default: router } = await import(/* @vite-ignore */ '/src/router/index.ts')
    await router.push(`${window.location.pathname.replace(/\/$/, '').replace(/\/[^/]*$/, '')}/alder-6601/jobs`)
  })
  await expect(page.locator('body')).not.toContainText(UNREACHABLE)
  await expect(page.getByTestId('jobs-upload')).toBeEnabled()
  // Print is for the selected file; the mock's file that is printing right now reads "Printing now" and is
  // rightly disabled, so some other file must be startable by a guest.
  const rows = page.getByTestId('jobs-row')
  await expect(rows.first()).toBeVisible()
  let startable = false
  for (let i = 0; i < await rows.count() && !startable; i++) {
    await rows.nth(i).click()
    startable = await page.getByTestId('jobs-print').first().isEnabled().catch(() => false)
  }
  expect(startable).toBe(true)
})

// Jack's walk, 19 Nov: signed in as a non-owner, DevTools Network set to Offline, Sloe (Open, set up, linked to
// another account, muon-link #160). Search nearby, pick Sloe, then Connect over Bluetooth said "can't reach Muon3D",
// and the row offered Set it up beside it. The page here is signed in; only the network is gone.
test.describe('signed in, browser Offline: Search nearby then Connect over Bluetooth', () => {
  test.use({ signedIn: true })

  for (const advertise of [true, false]) {
    test(`a set-up Open printer offers Connect, never Set it up, and opens (advertisement ${advertise ? 'heard' : 'not heard'})`, async ({ page, context }) => {
      await useNearbyPrinters(page, OPEN_PRINTER, { advertise, ownerOnly: 'after-160' })
      await page.goto('/')
      await ready(page)
      await context.setOffline(true)
      await expect.poll(() => page.evaluate(() => navigator.onLine)).toBe(false)
      await setPairingGate(page, true)
      await page.getByRole('button', { name: 'Look nearby' }).click()
      const row = page.getByTestId('found-list')
      await expect(row).toBeVisible()
      // The printer's own word on whether it is set up decides. A missing answer is never "new".
      await expect(page.getByTestId('found-set-up')).toHaveCount(0)
      await expect(page.getByRole('button', { name: 'Set it up' })).toHaveCount(0)
      const connect = page.getByTestId('found-connect-bluetooth').or(page.getByTestId('found-pair-bluetooth'))
      await expect(connect.first()).toBeVisible()
      await connect.first().click()
      await expect.poll(() => pairEvents(page), { timeout: 15_000 }).toContain(`connect ${OPEN_PRINTER.advertised}`)
      await expect(page).toHaveURL(/\/alder-6601(\/|$)/)
      await expect(page.locator('body')).not.toContainText(UNREACHABLE)
      await expect(page.locator('body')).not.toContainText('could not be reached')
    })
  }
})
