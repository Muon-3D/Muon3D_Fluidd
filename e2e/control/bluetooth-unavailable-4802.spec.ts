/**
 * Why Bluetooth is not there, said plainly (KAN-4802). Jack, on Chrome on his
 * phone, read "connecting over Bluetooth needs Chrome or Edge" on a page that
 * was plain http. The line now names the real cause: an iPhone or iPad
 * browser, an insecure page, or a browser without Web Bluetooth.
 *
 * Desktop 1440x900 and phone 390x844. Nothing here touches a printer.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'

const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1'

async function openPrinters (page: Page) {
  await page.goto('/')
  await ready(page)
}

async function noWebBluetooth (page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: undefined })
  })
}

test('an insecure page says it needs a secure page and links control.muon3d.com in the same tab', async ({ page }) => {
  await noWebBluetooth(page)
  await page.addInitScript(() => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
  })
  await openPrinters(page)
  const line = page.getByTestId('bluetooth-needs-chrome')
  await expect(line).toContainText('Bluetooth needs a secure page. Open control.muon3d.com to connect over Bluetooth.')
  await expect(line).not.toContainText('Chrome or Edge')
  const link = line.getByTestId('bluetooth-secure-link')
  await expect(link).toHaveAttribute('href', 'https://control.muon3d.com/')
  await expect(link).toHaveAttribute('target', '_self')
  await page.getByTestId('add-printer').click()
  await expect(page.getByTestId('add-printer-sheet').getByTestId('bluetooth-unavailable')).toContainText('Bluetooth needs a secure page')
})

test('an iPhone browser says iPhone and iPad browsers cannot use Bluetooth, even on a secure page', async ({ page }) => {
  await noWebBluetooth(page)
  await page.addInitScript((ua) => {
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: ua })
    Object.defineProperty(navigator, 'platform', { configurable: true, value: 'iPhone' })
  }, IPHONE_CHROME)
  await openPrinters(page)
  const line = page.getByTestId('bluetooth-needs-chrome')
  await expect(line).toContainText("iPhone and iPad browsers can't use Bluetooth. Use the Muon app, or join the printer's hotspot.")
  await expect(line).not.toContainText('Chrome or Edge')
  await expect(page.getByTestId('connect-bluetooth')).toHaveCount(0)
})

test('an iPad that claims to be a Mac gets the iPhone and iPad line too', async ({ page }) => {
  await noWebBluetooth(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'platform', { configurable: true, value: 'MacIntel' })
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 })
  })
  await openPrinters(page)
  await expect(page.getByTestId('bluetooth-needs-chrome')).toContainText("iPhone and iPad browsers can't use Bluetooth")
})

test('negative control: Chrome with Web Bluetooth on a secure page shows no reason and a working button', async ({ page }) => {
  await page.addInitScript(() => {
    const bt = new EventTarget() as EventTarget & Record<string, unknown>
    bt.getAvailability = async () => true
    bt.getDevices = async () => []
    bt.requestDevice = async () => { throw new DOMException('cancelled', 'NotFoundError') }
    Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: bt })
  })
  await openPrinters(page)
  await expect(page.getByTestId('bluetooth-needs-chrome')).toHaveCount(0)
  await expect(page.getByTestId('connect-bluetooth')).toBeVisible()
})
