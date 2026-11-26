/**
 * KAN-5989 (I-598): one printer is one row. A printer saved in this browser without its id (an Open printer added by
 * its address) and the service's same-network list naming the same printer were listed twice: "on this network" and
 * "Looking for it…". The page lists it once, in the best state its sources give.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'

test.use({ serviceWorkers: 'block' })

const OTTER = 'a1a1a1a1'.repeat(8)

async function nearby (page: Page, printers: unknown[]) {
  await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ printers })
  }))
}

function savedWithoutId (page: Page, entries: Array<{ name: string, host: string }>) {
  return page.addInitScript(list => {
    localStorage.setItem('appInstances', JSON.stringify(list.map(e => ({
      name: e.name, apiUrl: `http://${e.host}`, socketUrl: `ws://${e.host}/websocket`, active: false
    }))))
  }, entries)
}

const tiles = (page: Page, name: string) => page.locator('[data-tid^="printer-tile-"]').filter({ hasText: name })

test('a saved printer with no id and the same printer in the same-network list are one row', async ({ page }) => {
  await savedWithoutId(page, [{ name: 'Otter 4b2c', host: 'muon-otter-4b2c.local' }])
  await nearby(page, [{ printer_id: OTTER, name: 'Otter 4b2c', model: 'M1', linked: false, local_addrs: ['192.168.1.5'] }])
  await page.goto('/')
  await ready(page)
  await expect(tiles(page, 'Otter').first()).toBeVisible()
  await expect(tiles(page, 'Otter')).toHaveCount(1)
})

test('the same printer saved at two addresses stays one row when it is offline', async ({ page }) => {
  await savedWithoutId(page, [
    { name: 'Sloe 11aa', host: 'muon-sloe-11aa.local' },
    { name: 'Sloe 11aa', host: '192.168.1.9' }
  ])
  await nearby(page, [])
  await page.goto('/')
  await ready(page)
  await expect(tiles(page, 'Sloe').first()).toBeVisible()
  await expect(tiles(page, 'Sloe')).toHaveCount(1)
})
