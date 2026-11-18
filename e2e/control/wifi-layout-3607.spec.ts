/**
 * KAN-3607 (Jack, 17 Nov, I-377): Wi-Fi and network is one Wi-Fi box holding the network the printer
 * is on and the others, then Bluetooth and the hotspot as their own sections stacked below it. On a
 * phone the page scrolls as one page: no sideways scroll, no inner scroller, the list rows short.
 */
import { test, expect } from '../fixtures'
import { usePrinter } from './printer'

test('one Wi-Fi box, then Bluetooth, then the hotspot, stacked', async ({ page, open }) => {
  await usePrinter(page)
  await open('/wifi')
  const box = page.getByTestId('wifi-box')
  const bluetooth = page.getByTestId('wifi-bluetooth')
  const hotspot = page.getByTestId('hotspot-card')
  await expect(box).toBeVisible()
  await expect(bluetooth).toBeVisible()
  await expect(hotspot).toBeVisible()

  // The connected network and the others are inside the one box; the connected one is not repeated in the list.
  await expect(box.getByTestId('wifi-connected-name')).toHaveText('Workshop')
  await expect(box.getByTestId('wifi-networks').locator('[data-ssid="Workshop-2G"]')).toBeVisible()
  await expect(box.getByTestId('wifi-networks').locator('[data-ssid="Workshop"]')).toHaveCount(0)
  await expect(box.getByTestId('wifi-refresh')).toBeVisible()

  // Stacked: each starts below the one before, and all are as wide as the box.
  const b = await box.boundingBox()
  const t = await bluetooth.boundingBox()
  const h = await hotspot.boundingBox()
  expect(b && t && h).toBeTruthy()
  expect(t!.y).toBeGreaterThanOrEqual(b!.y + b!.height - 1)
  expect(h!.y).toBeGreaterThanOrEqual(t!.y + t!.height - 1)
  expect(Math.abs(t!.width - b!.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(h!.width - b!.width)).toBeLessThanOrEqual(1)
})

test('on a phone the page scrolls as one page: nothing sideways, no scroller inside it', async ({ page, open, isMobile }) => {
  test.skip(!isMobile, 'phone only')
  await usePrinter(page)
  await open('/wifi')
  await expect(page.getByTestId('wifi-box')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)

  // No element on the page scrolls on its own (an inner scroller is what traps a thumb).
  const inner = await page.evaluate(() => [...document.querySelectorAll('[data-tid=wifi-page] *')]
    .filter(el => {
      const o = getComputedStyle(el).overflowY
      return (o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 1
    }).length)
  expect(inner).toBe(0)

  // A network row is one short line pair: the channel line is left for the desktop, the signal bars stay (KAN-4354).
  const row = page.getByTestId('wifi-networks').locator('[data-ssid="Office"]')
  await expect(row.getByTestId('wifi-detail')).toBeHidden()
  await expect(row.locator('.wf__bars')).toBeVisible()
  expect((await row.boundingBox())!.height).toBeLessThanOrEqual(72)
})
