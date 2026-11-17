/**
 * Jack, 17 Nov walk (KAN-3590, KAN-3592):
 *
 * - Pairing a printer from the top-right Bluetooth button lagged, then briefly showed the orange
 *   "Reconnecting". It is a first connect, not a reconnect: the bar must never say Reconnecting.
 * - A printer that is not on this account (not owned, not shared) cannot go through Muon3D, so the
 *   "Bluetooth dropped" sheet does not offer "Connect via cloud"; Try Bluetooth again stays.
 *
 * The radio and the wasm client are faked at their edges (e2e/fakes/blePair.ts). Nobody is signed in.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { PAIRED_BEFORE, pairEvents, useNearbyPrinters } from '../fakes/blePair'

test.use({ signedIn: false, serviceWorkers: 'block' })

/** Records every time a "Reconnecting" bar or label shows, whatever the page does, into window.__sawReconnecting. */
async function watchForReconnecting (page: Page) {
  await page.addInitScript(() => {
    const seen: string[] = []
    ;(window as any).__sawReconnecting = seen
    const look = () => {
      const bar = document.querySelector('[data-tid="connection-reconnecting"]')
      if (bar) seen.push(bar.textContent ?? '')
      if (document.body && /Reconnecting/.test(document.body.innerText)) seen.push('text')
    }
    new MutationObserver(look).observe(document, { subtree: true, childList: true, characterData: true, attributes: true })
    setInterval(look, 25)
  })
}

async function connectFromTopRight (page: Page) {
  await useNearbyPrinters(page, PAIRED_BEFORE, { advertise: true })
  await page.goto('/')
  await ready(page)
  // With nothing listed yet the page shows the welcome, which has no top-right button: hear the printer first, then use it.
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await expect(page.getByTestId('connect-bluetooth')).toBeVisible()
  await page.getByTestId('connect-bluetooth').click()
  await expect(page).toHaveURL(/\/boxwood-367a(\/|$)/, { timeout: 30_000 })
}

test('pairing from the top-right button never shows Reconnecting', async ({ page }) => {
  await watchForReconnecting(page)
  await connectFromTopRight(page)
  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain('connect muon-boxwood-367a')
  // Let the page settle: the lag was followed by the flash.
  await page.waitForTimeout(3000)
  expect(await page.evaluate(() => (window as any).__sawReconnecting)).toEqual([])
})

test('Bluetooth dropped on a printer that is not on this account offers no cloud, and keeps Try Bluetooth again', async ({ page }) => {
  await connectFromTopRight(page)
  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain('connect muon-boxwood-367a')
  await page.evaluate(() => (window as any).__e2ePair.radio(false))
  const sheet = page.getByTestId('bluetooth-fallback')
  await expect(sheet).toContainText('Bluetooth dropped', { timeout: 30_000 })
  await expect(page.getByTestId('bluetooth-dropped-ble')).toHaveText('Try Bluetooth again')
  await expect(page.getByTestId('bluetooth-dropped-cloud')).toHaveCount(0)
  await expect(sheet).not.toContainText('cloud')
})
