/**
 * KAN-5972 (I-584), Jack at the bench 24 Nov: refreshing on Sloe's page said "Couldn't open Sloe, no such printer on
 * this account", and Try again did nothing. Sloe is an Open printer this browser holds (opened over Bluetooth),
 * not one on the account. A refresh must reopen it over the route this browser holds, and Try again must retry (PrinterOpening.online.spec covers the retry).
 *
 * The radio is faked (e2e/fakes/blePair.ts); the browser keeps its permission for the device across a reload, as
 * Chrome does (getDevices lists it). Nobody is signed in, so no account holds the printer.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { OPEN_PRINTER, pairEvents, setPairingGate, useNearbyPrinters } from '../fakes/blePair'

test.use({ signedIn: false, serviceWorkers: 'block' })

async function openOverBluetooth (page: Page) {
  await useNearbyPrinters(page, OPEN_PRINTER, { advertise: true })
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await expect(page.getByTestId('found-pair-bluetooth')).toBeVisible()
  await setPairingGate(page, true)
  await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  await expect(page).toHaveURL(/\/alder-6601(\/|$)/)
  await expect(page.getByTestId('printer-opening')).toHaveCount(0)
}

test('refreshing an Open printer this browser holds reopens it, with no error', async ({ page }) => {
  await openOverBluetooth(page)
  await page.reload()
  await ready(page)
  await expect(page).toHaveURL(/\/alder-6601(\/|$)/)
  // Never "Couldn't open ...", "No printer called ..." or the account's "no such printer".
  await expect(page.getByTestId('printer-opening')).toHaveCount(0, { timeout: 30_000 })
  await expect(page.locator('body')).not.toContainText(/Couldn't open|No printer called|no such printer/i)
  const events = await pairEvents(page)
  expect(events.filter(e => e === `connect ${OPEN_PRINTER.advertised}`).length).toBeGreaterThan(0)
})
