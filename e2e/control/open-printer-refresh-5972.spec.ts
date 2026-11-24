/**
 * KAN-5972 (I-584), Jack at the bench 24 Nov: refreshing on Sloe's page said "Couldn't open Sloe, no such printer on
 * this account", and Try again did nothing. Sloe is an Open printer this browser holds (opened over Bluetooth),
 * not one on the account. A refresh must reopen it over the route this browser holds, and Try again must retry.
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

/**
 * Try again, as a person does it: the radio is off when the page is refreshed, so the reopen fails and says so; the
 * radio comes back; they press Try again and the printer opens. Nothing here waits on a clock:
 * - the radio is off from the page's first line after the reload (a flag in sessionStorage, read by an init script),
 *   so the failure is certain, not a race with the page's own reconnect;
 * - it comes back by clearing the fake's flag only. The fake's `radio(true)` also tells the page the radio is back
 *   (availabilitychanged), which makes the page retry by itself and would race the click this test is about;
 * - every wait is on what the page shows (the heading, the button, the opening card gone) or on the connects the
 *   radio saw, never on a fixed delay.
 */
test('Try again after a failed reopen retries it and opens the printer', async ({ page }) => {
  await openOverBluetooth(page)
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2eRadioOffAtRefresh')) (window as any).__e2ePair.radioOff = true
  })
  await page.evaluate(() => sessionStorage.setItem('e2eRadioOffAtRefresh', '1'))
  await page.reload()
  await ready(page)
  const card = page.getByTestId('printer-opening')
  await expect(card.getByRole('heading', { name: /Couldn't open/i })).toBeVisible()
  await expect(card).not.toContainText(/no such printer/i)
  const tryAgain = card.getByRole('button', { name: 'Try again' })
  await expect(tryAgain).toBeVisible()
  const connects = async () => (await pairEvents(page)).filter(e => e === `connect ${OPEN_PRINTER.advertised}`).length
  const before = await connects()
  // The radio is back, quietly.
  await page.evaluate(() => {
    sessionStorage.removeItem('e2eRadioOffAtRefresh')
    ;(window as any).__e2ePair.radioOff = false
  })
  await tryAgain.click()
  await expect(card).toHaveCount(0)
  await expect.poll(connects).toBeGreaterThan(before)
  await expect(page).toHaveURL(/\/alder-6601(\/|$)/)
})
