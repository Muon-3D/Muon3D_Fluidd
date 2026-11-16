/**
 * Opening Control settles straight on the right printer (KAN-2008). While it
 * loads, no other printer's name is drawn, whether that printer is saved in
 * this browser or found on the network. Jack, 10 Nov 2026: "randomly named
 * printers flash up before it settles on Boxwood".
 *
 * Two doors: a printer's page (/boxwood-367a), and the root of a printer's own
 * address (/), which used to draw every printer's tile until the account had
 * restored, then jump to the printer.
 */
import type { Page } from '@playwright/test'
import WebSocket from 'ws'
import { test, expect, ready, PRINTER } from '../fixtures'
import { MOCK_PORT, VITE_PORT } from '../ports'

const OTHER = 'Sloe'

/** A second printer found on the network, and a third saved in this browser; and a record of every moment their names are on screen. */
async function withOtherPrinters (page: Page) {
  await page.route('**/muon/lan-printers.json', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    json: {
      version: 1,
      printers: [{ name: OTHER, apiUrl: 'http://192.168.77.20', socketUrl: 'ws://192.168.77.20/websocket', authKey: 'sloe-1234.local' }]
    }
  }))
  await page.addInitScript(({ other }) => {
    const w = window as unknown as { __seen: boolean }
    w.__seen = false
    new MutationObserver(() => {
      if ((document.body?.innerText ?? '').includes(other)) w.__seen = true
    }).observe(document, { subtree: true, childList: true, characterData: true })
  }, { other: OTHER })
}

const otherSeen = (page: Page) => page.evaluate(() => (window as unknown as { __seen: boolean }).__seen)

test('opening a printer\'s page shows no other printer\'s name while it loads', async ({ page }) => {
  await withOtherPrinters(page)
  await page.goto(PRINTER)
  await ready(page)
  await expect(page.getByTestId('printer-switch')).toContainText('Boxwood')
  await page.waitForTimeout(1500)
  expect(await otherSeen(page)).toBe(false)
  expect(new URL(page.url()).pathname.startsWith(PRINTER)).toBe(true)
})

test('opening the root of a printer\'s own address goes straight to that printer, with no list of printers first', async ({ page }) => {
  // The page is the printer's own: Control and the mock answer from one origin.
  const origin = `http://localhost:${VITE_PORT}`
  const mock = `http://localhost:${MOCK_PORT}`
  await page.route('**/config.json', async route => {
    const response = await route.fetch()
    const config = await response.json()
    await route.fulfill({ response, json: { ...config, blacklist: [], endpoints: [origin] } })
  })
  await page.route(url => /^\/(server|access|printer|machine|api)\//.test(url.pathname), async route => {
    const url = new URL(route.request().url())
    await route.fulfill({ response: await route.fetch({ url: `${mock}${url.pathname}${url.search}` }) })
  })
  // The socket goes to the mock the same way.
  await page.routeWebSocket(/\/websocket(\?.*)?$/, ws => {
    const up = new WebSocket(`ws://localhost:${MOCK_PORT}/websocket`)
    const queued: string[] = []
    ws.onMessage(message => { if (up.readyState === WebSocket.OPEN) up.send(message as string); else queued.push(message as string) })
    up.on('open', () => queued.splice(0).forEach(m => up.send(m)))
    up.on('message', data => ws.send(data.toString()))
    up.on('close', () => ws.close())
    ws.onClose(() => up.close())
  })
  await withOtherPrinters(page)
  await page.goto('/')
  await ready(page)
  await expect(page.getByTestId('printer-switch')).toContainText('Boxwood')
  await page.waitForTimeout(1500)
  expect(await otherSeen(page)).toBe(false)
  // The address names the printer once its identity is known.
  await expect(page).toHaveURL(/\/boxwood-367a$/)
})
