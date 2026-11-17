/**
 * No made-up printer names while loading (KAN-2257, plan B; Jack: "very
 * glitchy when loading, with randomly named printers").
 *
 * What a person sees from the first frame to the page being ready: the top
 * bar never names the printer with something that isn't its name (the product
 * name, its network name) and never says it is offline while it is only being
 * reached; the tab title never shows "null", an internal page name or the raw
 * network name. Until the name is known, a drawn placeholder holds its place.
 */
import { test, expect } from '../fixtures'
import { MOCK_PORT } from '../ports'
import type { Page } from '@playwright/test'

interface Seen { at: number; where: string; text: string }

// Records every distinct text in the top bar's printer button and the tab
// title from the first frame on.
async function watchNames (page: Page) {
  await page.addInitScript(() => {
    const seen: Seen[] = []
    const t0 = performance.now()
    const look = () => {
      const add = (where: string, text: string) => {
        if (text && !seen.some(s => s.where === where && s.text === text)) seen.push({ at: Math.round(performance.now() - t0), where, text })
      }
      add('title', document.title)
      document.querySelectorAll('.printer-switch__name').forEach(e => add('name', (e.textContent || '').trim()))
      document.querySelectorAll('.printer-switch__status-text').forEach(e => add('status', (e.textContent || '').trim()))
      if (document.querySelector('[data-tid="printer-name-pending"]')) add('name', '(placeholder)')
      document.querySelectorAll('[data-tid="page-title"]').forEach(e => add('heading', e.querySelector('[data-tid="page-title-pending"]') ? '(placeholder)' : (e.textContent || '').trim()))
    }
    new MutationObserver(look).observe(document, { subtree: true, childList: true, characterData: true, attributes: true })
    ;(window as unknown as { __seen: Seen[] }).__seen = seen
  })
}

// A printer that is slow to answer (Boxwood, Jack: "it takes a while to
// stabilise"): Control's shell draws before the printer has said anything.
async function slowPrinter (page: Page, ms = 2500) {
  const printer = new RegExp(`//(localhost|127[.]0[.]0[.]1):${MOCK_PORT}/`)
  await page.route(printer, async route => {
    await new Promise(resolve => setTimeout(resolve, ms))
    await route.fallback()
  })
  await page.routeWebSocket(printer, async ws => {
    await new Promise(resolve => setTimeout(resolve, ms))
    ws.connectToServer()
  })
}

const seen = (page: Page) => page.evaluate(() => (window as unknown as { __seen: Seen[] }).__seen)

test('loading names the printer only with its name, and never says offline while connecting', async ({ page, open }) => {
  await watchNames(page)
  await slowPrinter(page)
  await open('/')
  await expect(page.locator('.printer-switch__name').first()).toHaveText(/Boxwood/)
  await expect(page.locator('.printer-switch__status-text').first()).toHaveText(/Printing/)
  const all = await seen(page)
  const names = all.filter(s => s.where === 'name').map(s => s.text)
  const statuses = all.filter(s => s.where === 'status').map(s => s.text)
  const titles = all.filter(s => s.where === 'title').map(s => s.text)
  test.info().annotations.push({ type: 'seen while loading', description: JSON.stringify(all) })

  // The name: a placeholder, then the real one, and nothing else.
  for (const n of names) expect(['(placeholder)', 'Boxwood']).toContain(n)
  // Overview's heading is the printer's name: the same rule.
  for (const h of all.filter(s => s.where === 'heading').map(s => s.text)) expect(['(placeholder)', 'Boxwood']).toContain(h)
  // The state: never a false "Offline" or "Klipper offline" while connecting.
  for (const s of statuses) expect(s).not.toMatch(/^Offline$|Klipper offline/)
  // The tab: no "null", no route-internal names, no network name.
  for (const t of titles) {
    expect(t).not.toMatch(/null|Dashboard|muon-boxwood-367a/)
  }
  await expect.poll(() => page.title()).toMatch(/Boxwood \| Overview$/)
})

test('the tab title uses the page names people see', async ({ page, open }) => {
  await open('/history')
  await expect.poll(() => page.title()).toMatch(/Boxwood \| History$/)
  await open('/settings')
  await expect.poll(() => page.title()).toMatch(/Boxwood \| Settings$/)
})

test('a printer that never answers is named from its address and said to be offline, not left connecting', async ({ page }) => {
  const printer = new RegExp(`//(localhost|127[.]0[.]0[.]1):${MOCK_PORT}/`)
  await page.route(printer, route => route.abort())
  await page.routeWebSocket(printer, ws => { ws.close() })
  await page.goto('/boxwood-367a/', { waitUntil: 'commit' })
  const name = page.locator('.printer-switch__name:visible').first()
  // After at most the quiet time (8 s), the silence is the answer.
  await expect(name).toHaveText(/Boxwood/, { timeout: 20_000 })
  await expect(page.locator('[data-tid="printer-name-pending"]:visible')).toHaveCount(0)
  await expect(page.locator('.printer-switch__status-text:visible').first()).toHaveText(/Offline/)
})
