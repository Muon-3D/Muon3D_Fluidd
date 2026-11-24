/**
 * KAN-5975 (I-587), Jack at the bench 24 Nov: Sloe's status often showed grey "Connecting" though this network had
 * recognised it. A printer the page finds reachable on this network shows its real state within a bounded time,
 * even when its own socket never opens.
 *
 * The printer is the shared mock, saved and found by the LAN scan (ready); its socket is refused, so the live
 * socket never says anything but "not connected".
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { PAIRED_BEFORE } from '../fakes/blePair'
import { MOCK_PORT } from '../ports'

test.use({ serviceWorkers: 'block' })

const ID = PAIRED_BEFORE.id
const API = `http://localhost:${MOCK_PORT}`
const tile = (page: Page) => page.locator('[data-tid^="printer-tile-"]').filter({ hasText: 'Boxwood' })

test('a printer found ready on this network is not left on Connecting when its socket never opens', async ({ page }) => {
  await page.route(`${API}/server/muon/identity`, route => {
    const identity = { name: 'Boxwood', display: 'Boxwood', derived_name: 'boxwood', suffix: '367a', endpoint_id: ID }
    return route.fulfill({ json: { ...identity, result: identity }, headers: { 'access-control-allow-origin': '*' } })
  })
  await page.routeWebSocket(new RegExp(`:${MOCK_PORT}/websocket`), ws => { ws.close() })
  await page.addInitScript(({ apiUrl, endpointId }) => {
    localStorage.setItem('appInstances', JSON.stringify([{ name: 'Boxwood', mdnsHost: 'muon-boxwood-367a.local', apiUrl, socketUrl: apiUrl.replace(/^http/, 'ws') + '/websocket', endpointId, active: true }]))
  }, { apiUrl: API, endpointId: ID })
  await page.goto('/')
  await ready(page)
  await page.evaluate(async ({ id, apiUrl }) => {
    const { discoveryState } = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'discovery.ts'].join('/'))
    discoveryState.found = [{ host: new URL(apiUrl).host, apiUrl, endpointId: id, name: 'Boxwood', link: { phase: 'unlinked' }, health: { state: 'ready', checkedAt: Date.now() } }]
    discoveryState.scanning = false
    discoveryState.finishedAt = Date.now()
  }, { id: ID, apiUrl: API })
  await page.getByRole('link', { name: /All printers/ }).first().click()
  await expect(tile(page).first()).toBeVisible({ timeout: 30_000 })
  await expect(tile(page).first()).not.toContainText(/Connecting/, { timeout: 30_000 })
})
