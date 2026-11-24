/**
 * KAN-5974 (I-586), Jack at the bench 24 Nov: connect a printer over Bluetooth, go back to Printers, and Chrome says
 * it is paired while Control no longer recognises it. Once a printer is connected over Bluetooth in a session,
 * Control holds it as reachable until the link drops, and a click reconnects with no chooser.
 *
 * Radio faked (e2e/fakes/blePair.ts). The drop itself (gattserverdisconnected stops the claim) is covered by the
 * unit tests in muon-ble/__tests__ (link.spec, nearby.spec).
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { OPEN_PRINTER, setPairingGate, useNearbyPrinters } from '../fakes/blePair'

/** To Printers from the page: the title bar's link on a wide screen, the printer switch's list on a phone. */
async function allPrinters (page: Page) {
  const link = page.getByRole('banner').getByRole('link', { name: 'All printers', exact: true })
  if (await link.count()) await link.click()
  else {
    await page.getByTestId('printer-switch').click()
    await page.getByTestId('all-printers').click()
  }
}

test.use({ signedIn: false, serviceWorkers: 'block' })

test('a printer connected over Bluetooth is still recognised on Printers, and a click reconnects with no chooser', async ({ page }) => {
  await useNearbyPrinters(page, OPEN_PRINTER, { advertise: true })
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await expect(page.getByTestId('found-pair-bluetooth')).toBeVisible()
  await setPairingGate(page, true)
  await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  await expect(page).toHaveURL(/\/alder-6601(\/|$)/)
  const chooserAsks = () => page.evaluate(() => (window as any).__bluetoothAsks.length)
  const asked = await chooserAsks()

  // Back to Printers, past the 30 s an advertisement counts for.
  await allPrinters(page)
  await expect(page).toHaveURL(/\/$/)
  const tile = page.locator('[data-tid^="printer-tile-"]').filter({ hasText: 'Alder' }).first()
  await expect(tile).toBeVisible({ timeout: 30_000 })
  await expect(tile).not.toContainText(/offline/i)

  await tile.click()
  await expect(page).toHaveURL(/\/alder-6601(\/|$)/, { timeout: 30_000 })
  await expect(page.getByTestId('printer-opening')).toHaveCount(0, { timeout: 30_000 })
  expect(await chooserAsks()).toBe(asked)
})
