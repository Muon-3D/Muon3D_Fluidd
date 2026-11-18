/**
 * KAN-4354 from the person's side (Jack, 18 Nov): the Wi-Fi networks sit in the same card as the connected
 * one; the hotspot card has a count badge and lists who is on it; bottom-left a small green "N connected"
 * tab sits on top of the connection item. Printers stay open: no prompt appears anywhere.
 *
 * The printer's stations answer is faked with page.route. With SHOT_DIR set, the frames are also saved
 * there (the storyboard's `built/` folder) to compare with the storyboard PNGs.
 */
import path from 'node:path'
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter } from './printer'

test.use({ signedIn: true, serviceWorkers: 'block' })

const STATIONS = '**/server/aux/wifi/ap/stations'
const SHOT_DIR = process.env.SHOT_DIR
const tab = (page: Page) => page.locator('[data-tid="hotspot-count"]')
const shot = async (page: Page, name: string, project: string) => {
  if (SHOT_DIR) await page.screenshot({ path: path.join(SHOT_DIR, `${name}-${project}.png`) })
}

const ON = {
  up: true,
  count: 3,
  auto_off_at: Math.floor(Date.now() / 1000) + 25 * 60 + 30,
  requester_on_ap: false,
  clients: [
    { name: "Jack's iPhone", ip: '10.42.0.12', mac: 'a4:••:••:••:••:3f', connected_s: 720, signal_dbm: -52, you: true },
    { name: null, ip: '10.42.0.18', mac: '3c:••:••:••:••:b7', connected_s: 2460, signal_dbm: -67, you: false },
    { name: '<b>Harry</b>', ip: '10.42.0.23', mac: 'f0:••:••:••:••:0a', connected_s: 95, signal_dbm: -74, you: false }
  ]
}

test.beforeEach(async ({ page }) => { await usePrinter(page) })

test('the Wi-Fi list is inside the connected network\'s card, with signal bars on every row', async ({ page, open }, info) => {
  await page.route(STATIONS, route => route.fulfill({ json: ON }))
  await open('/wifi')
  const box = page.getByTestId('wifi-box')
  await expect(box.getByTestId('wifi-connected-name')).toBeVisible()
  await expect(box.getByTestId('wifi-networks')).toBeVisible()
  await expect(box.getByTestId('wifi-found')).toContainText('found')
  const rows = box.getByTestId('wifi-networks').locator('.wf__net')
  expect(await rows.count()).toBeGreaterThan(0)
  for (let i = 0; i < await rows.count(); i++) await expect(rows.nth(i).locator('.wf__bars')).toBeVisible()
  await shot(page, '02-wifi', info.project.name)
})

test('the hotspot card has a count badge and lists each device, names as plain text', async ({ page, open }, info) => {
  await page.route(STATIONS, route => route.fulfill({ json: ON }))
  await open('/wifi')
  const card = page.getByTestId('hotspot-card')
  await expect(card.getByTestId('hotspot-badge')).toHaveText('3 connected')
  await expect(card.getByTestId('hotspot-auto-off')).toContainText(/Turns off in \d+ min/)
  const rows = card.getByTestId('hotspot-client')
  await expect(rows).toHaveCount(3)
  await expect(rows.nth(0)).toContainText("Jack's iPhone")
  await expect(rows.nth(0)).toContainText('This device')
  await expect(rows.nth(0).getByTestId('hotspot-client-signal')).toHaveText('-52 dBm')
  await expect(rows.nth(1)).toContainText('Unnamed device')
  await expect(rows.nth(1)).not.toContainText('This device')
  await expect(rows.nth(2)).toContainText('<b>Harry</b>')
  await expect(rows.nth(2).locator('b')).toHaveText('<b>Harry</b>')
  await card.scrollIntoViewIfNeeded()
  await shot(page, '03-hson', info.project.name)
})

test('without a client list the card shows only the count', async ({ page, open }) => {
  await page.route(STATIONS, route => route.fulfill({ json: { up: true, count: 2, auto_off_at: null } }))
  await open('/wifi')
  const card = page.getByTestId('hotspot-card')
  await expect(card.getByTestId('hotspot-badge')).toHaveText('2 connected')
  await expect(card.getByTestId('hotspot-devices-count')).toHaveText('2 devices connected')
  await expect(card.getByTestId('hotspot-clients')).toHaveCount(0)
})

test('the green "3 connected" tab sits on the connection item, and no prompt appears', async ({ page, open }, info) => {
  await page.route(STATIONS, route => route.fulfill({ json: ON }))
  await open('/')
  await expect(tab(page)).toBeVisible()
  await expect(tab(page)).toContainText('3')
  await expect(tab(page).getByTestId('hotspot-count-n')).toHaveText('3')
  const colour = await tab(page).evaluate(el => getComputedStyle(el).color)
  const [r, g, b] = colour.match(/\d+(\.\d+)?/g)!.map(Number)
  expect(g).toBeGreaterThan(r)
  expect(g).toBeGreaterThan(b)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await shot(page, '05-rail', info.project.name)
})

test('hotspot off: no badge, no tab', async ({ page, open }, info) => {
  await page.route(STATIONS, route => route.fulfill({ json: { up: false, count: 0, auto_off_at: null } }))
  await open('/wifi')
  await expect(page.getByTestId('hotspot-card')).toBeVisible()
  await page.waitForTimeout(1500)
  await expect(page.getByTestId('hotspot-badge')).toHaveCount(0)
  await expect(tab(page)).toHaveCount(0)
  await shot(page, '04-hsoff', info.project.name)
})
