/**
 * First paint (the loading rim and the printed wordmark) is behind
 * VITE_CONTROL_FIRST_PAINT, off by default: with it off, Control loads as it
 * did. (The flag-on specs are e2e/first-paint, run by playwright.first-paint.config.ts.)
 */
import { test, expect, ready, PRINTER } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

test('with the flag off the loader is the plain bar and wordmark, and first paint never appears', async ({ page }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await page.addInitScript(() => {
    const w = window as unknown as { __seen: { rim: boolean, style: boolean } }
    w.__seen = { rim: false, style: false }
    new MutationObserver(() => {
      if (document.querySelector('[data-tid=first-paint], .muon-first-paint')) w.__seen.rim = true
      if (document.querySelector('style[data-first-paint]')) w.__seen.style = true
    }).observe(document, { subtree: true, childList: true, attributes: true })
  })
  await page.goto(PRINTER)
  await expect(page.locator('.muon-loader__word').or(page.locator('.v-application')).first()).toBeVisible()
  await ready(page)
  await expect(page.getByTestId('printer-switch')).toContainText('Boxwood')
  const seen = await page.evaluate(() => (window as unknown as { __seen: { rim: boolean, style: boolean } }).__seen)
  expect(seen.rim).toBe(false)
  expect(seen.style).toBe(false)
})

test('with the flag off the loader leaves as soon as Control can show something, with no print time', async ({ page }) => {
  await usePrinter(page, PRESETS.idleHomed())
  await page.addInitScript(() => {
    const w = window as unknown as { __loader: { start: number | null, gone: number | null } }
    w.__loader = { start: null, gone: null }
    new MutationObserver(() => {
      const loader = document.getElementById('muon-loader')
      if (loader && w.__loader.start === null) w.__loader.start = performance.now()
      if (!loader && w.__loader.start !== null && w.__loader.gone === null) w.__loader.gone = performance.now()
    }).observe(document, { subtree: true, childList: true })
  })
  await page.goto(PRINTER)
  await ready(page)
  const t = await page.evaluate(() => (window as unknown as { __loader: { start: number, gone: number } }).__loader)
  // The flag-on splash holds at least 3.9 s for the wordmark; the plain loader goes with the first route.
  expect(t.gone - t.start).toBeLessThan(3900)
})
