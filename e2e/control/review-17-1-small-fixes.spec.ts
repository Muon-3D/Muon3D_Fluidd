/**
 * KAN-4371: small fixes from the Opus review of train 17.1 (Army demo, offline, hotspot + Bluetooth), as the person sees them.
 *
 * - The hotspot badge over the phone's tab bar is not a button: a tap on it reaches what is under it.
 * - "Through hotspot" is on the printer reached through its own hotspot only, not on every local card.
 *
 * (The grant retry and the 8 s `/v1/me` timeout have no screen of their own: unit specs in muon-ble/__tests__/granted-role-retry.spec.ts
 * and muon-cloud/__tests__/me-timeout.spec.ts.) The printers are the shared mock and page.route fakes; no real printer is asked.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready, PRINTER } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { usePrinter, PRESETS } from './printer'

test.use({ serviceWorkers: 'block' })

const STATIONS = '**/server/aux/wifi/ap/stations'
const SECOND = { id: '8f21abcd'.repeat(8), name: 'Sloe 8f21' }
const SECOND_URL = `http://127.0.0.1:${MOCK_PORT}`

async function stations (page: Page, body: unknown) {
  await page.route(STATIONS, route => route.fulfill({ json: body }))
}

/** Boxwood (the mock, on localhost) is the active local printer; a second one is saved in this browser. */
async function twoLocalPrinters (page: Page) {
  await usePrinter(page, PRESETS.idleHomed())
  await page.addInitScript(([apiUrl, name, endpointId]) => {
    // The second printer joins the saved list once the app has written its own.
    const add = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('appInstances') ?? '[]')
        if (!saved.some((i: { endpointId?: string }) => i.endpointId === endpointId)) {
          saved.push({ apiUrl, name, endpointId, socketUrl: apiUrl.replace(/^http/, 'ws') + '/websocket', active: false })
          localStorage.setItem('appInstances', JSON.stringify(saved))
        }
      } catch { /* nothing saved yet */ }
    }
    add()
    window.addEventListener('pagehide', add)
  }, [SECOND_URL, SECOND.name, SECOND.id])
}

/** From Boxwood's own page to All printers, inside the app (the printer stays connected, so its hotspot answer is read). */
async function allPrinters (page: Page) {
  const link = page.getByRole('banner').getByRole('link', { name: 'All printers', exact: true })
  if (await link.count()) await link.click()
  else {
    await page.getByTestId('printer-switch').click()
    await page.getByTestId('all-printers').click()
  }
  await expect(page.getByRole('heading', { name: 'All printers', exact: true })).toBeVisible()
}

const tiles = (page: Page) => page.locator('.tile')
const tileOf = (page: Page, name: RegExp) => tiles(page).filter({ hasText: name })

test.describe('the hotspot badge does not block taps (phone tab bar)', () => {
  test('a tap on the badge reaches what is under it, and the tabs still work', async ({ page, isMobile }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await stations(page, { up: true, count: 2, auto_off_at: null })
    await page.goto(PRINTER)
    await ready(page)
    const badge = page.locator('[data-tid="hotspot-count"]')
    await expect(badge).toBeVisible()
    if (!isMobile) {
      // The desktop rail holds it: there is no tab bar to cover.
      await expect(page.locator('.app-tab-bar__tabs')).toHaveCount(0)
      return
    }
    // What a tap at the badge's centre lands on: record the target of the first pointer event there.
    const box = (await badge.boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    await page.evaluate(() => {
      (window as any).__tapTarget = null
      document.addEventListener('pointerdown', e => { (window as any).__tapTarget = (e.target as Element).closest('[data-tid="hotspot-count"]') ? 'badge' : 'other' }, true)
    })
    await page.touchscreen.tap(x, y)
    expect(await page.evaluate(() => (window as any).__tapTarget)).toBe('other')
    expect(await page.evaluate(([px, py]) => !!document.elementFromPoint(px, py)?.closest('[data-tid="hotspot-count"]'), [x, y])).toBe(false)
    // The badge stays on screen, and every tab is reachable.
    await expect(badge).toBeVisible()
    await page.getByTestId('tab-more').tap()
    await expect(page.locator('.v-bottom-sheet--active, .v-dialog--active').first()).toBeVisible()
  })
})

test.describe('"Through hotspot" is for the printer reached through its own hotspot', () => {
  test('two local printers: only the one the printer says is on its hotspot is labelled', async ({ page }) => {
    await twoLocalPrinters(page)
    await stations(page, { up: true, count: 1, auto_off_at: null, requester_on_ap: true })
    await page.goto(PRINTER)
    await ready(page)
    await expect(page.locator('[data-tid="hotspot-count"]')).toBeVisible()
    await allPrinters(page)
    await expect(tiles(page).first()).toBeVisible()
    await expect(tileOf(page, /Boxwood/i)).toContainText('Through hotspot')
    await expect(tileOf(page, /Sloe/i)).toBeVisible()
    await expect(tileOf(page, /Sloe/i)).not.toContainText('Through hotspot')
    await expect(tiles(page).filter({ hasText: 'Through hotspot' })).toHaveCount(1)
  })

  test('on this network: no card says Through hotspot', async ({ page }) => {
    await twoLocalPrinters(page)
    await stations(page, { up: true, count: 1, auto_off_at: null, requester_on_ap: false })
    await page.goto(PRINTER)
    await ready(page)
    await expect(page.locator('[data-tid="hotspot-count"]')).toBeVisible()
    await allPrinters(page)
    await expect(tileOf(page, /Boxwood/i)).toContainText('Connected locally')
    await expect(tiles(page).filter({ hasText: 'Through hotspot' })).toHaveCount(0)
  })
})
