/**
 * KAN-3590: opening another printer is a first connect, not a reconnect. The page that was on printer A
 * must not read "Reconnecting" while printer B's first connection opens. And once B's own socket is up,
 * a real drop keeps the page and says so (a switch must not forget that B was reached).
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { CONSOLE } from '../fakes/console'
import { reachOnLan, ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { PRESETS, usePrinter } from './printer'

test.use({ serviceWorkers: 'block', signedIn: true })

const A = `http://localhost:${MOCK_PORT}`
const B = `http://127.0.0.1:${MOCK_PORT}`
const SECOND = { id: '8f21abcd'.repeat(8), name: 'Sloe 8f21' }
const where = (page: Page) => page.evaluate(async () => {
  const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
  return m.where()
})

/** Records every time a "Reconnecting" bar shows, whatever the page does, into window.__sawReconnecting. */
async function watchForReconnecting (page: Page) {
  await page.addInitScript(() => {
    const seen: string[] = []
    ;(window as any).__sawReconnecting = seen
    const look = () => {
      const bar = document.querySelector('[data-tid="connection-reconnecting"]')
      if (bar) seen.push(bar.textContent ?? '')
    }
    new MutationObserver(look).observe(document, { subtree: true, childList: true, characterData: true, attributes: true })
    setInterval(look, 25)
  })
}

async function discoverSecond (page: Page) {
  await page.evaluate(async ([apiUrl, id, name]) => {
    const m = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'discovery.ts'].join('/'))
    for (let n = 0; n < 300 && m.discoveryState.scanning; n++) await new Promise(resolve => setTimeout(resolve, 100))
    m.discoveryState.found = [{ host: new URL(apiUrl).host, aliases: [new URL(apiUrl).host], apiUrl, name, endpointId: id, link: { phase: 'unlinked' } }]
    m.discoveryState.finishedAt = Date.now()
    const { default: store } = await import(/* @vite-ignore */ ['', 'src', 'store', 'index.ts'].join('/'))
    store.state.config.instances.push({ name, apiUrl, socketUrl: apiUrl.replace(/^http/, 'ws') + '/websocket', active: false, endpointId: id })
    localStorage.setItem('appInstances', JSON.stringify(store.state.config.instances))
  }, [B, SECOND.id, SECOND.name])
}

async function onA (page: Page, account: Parameters<typeof useAllRoutes>[1]) {
  await useAllRoutes(page, account)
  await page.route(`${CONSOLE}/v1/printers/*/access`, r => r.request().headers().authorization || r.request().method() === 'OPTIONS'
    ? r.fallback()
    : r.fulfill({ status: 401, json: { detail: 'not signed in' }, headers: { 'access-control-allow-origin': '*' } }))
  await page.route(`${A}/server/muon/identity`, r => r.fulfill({
    json: { name: ROUTE_PRINTER.name, display: ROUTE_PRINTER.name, endpoint_id: ROUTE_PRINTER.id, derived_name: 'boxwood', suffix: '367a' },
    headers: { 'access-control-allow-origin': '*' }
  }))
  await page.route(`${B}/server/muon/identity`, r => r.fulfill({
    json: { name: SECOND.name, display: SECOND.name, endpoint_id: SECOND.id, derived_name: 'sloe', suffix: '8f21' },
    headers: { 'access-control-allow-origin': '*' }
  }))
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: `Options for ${ROUTE_PRINTER.name}`, exact: true }).click()
  await page.locator('.v-list-item').getByText('Connect through Muon3D', { exact: true }).click()
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true, mode: 'cloud' })
  await reachOnLan(page)
}

async function switchToSecond (page: Page) {
  await discoverSecond(page)
  await page.getByTestId('printer-switch').first().click()
  await page.locator('.muon-card').filter({ hasText: SECOND.name }).click()
  await expect.poll(() => where(page)).toMatchObject({ apiUrl: B, socketOpen: true })
  await expect(page.getByTestId('printer-switch').first()).toContainText(/Sloe/i)
}

test('opening another printer never reads Reconnecting', async ({ page, account }) => {
  await watchForReconnecting(page)
  await usePrinter(page, PRESETS.idleHomed(), { ticks: false, apiUrl: A })
  await usePrinter(page, PRESETS.idleHomed(), { ticks: false, apiUrl: B })
  await onA(page, account)
  await switchToSecond(page)
  await page.waitForTimeout(2000)
  expect(await page.evaluate(() => (window as any).__sawReconnecting)).toEqual([])
})

test('a drop right after opening another printer still says Reconnecting and keeps the page', async ({ page, account }) => {
  await usePrinter(page, PRESETS.idleHomed(), { ticks: false, apiUrl: A })
  const second = await usePrinter(page, PRESETS.idleHomed(), { ticks: false, apiUrl: B })
  await onA(page, account)
  await switchToSecond(page)
  await second.offline()
  await expect(page.getByTestId('connection-reconnecting')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByTestId('printer-switch').first()).toContainText(/Sloe/i)
})
