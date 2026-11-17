/**
 * A printer that comes online shows Online with no refresh (Jack, 17 Nov; KAN-3783).
 *
 * Boxwood is on the account but off when the page loads: the console lists it
 * offline and the relay cannot reach it. Then it is powered on: the console
 * reports it online and the relay answers. The page is never reloaded, and the
 * status flips on its own within the console list's own poll (10 s) and the
 * status poll after it.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'

test.use({ signedIn: true, serviceWorkers: 'block' })

/** The console poll is 10 s and the status poll 3 s; a loaded runner needs room. */
const FLIPS_WITHIN_MS = 45_000

const list = (page: Page) => page.getByRole('main')
const control = (page: Page, on: boolean) => page.evaluate(on => (window as any).__e2eRoute.cloud(on), on)

test.beforeEach(async ({ page, account }) => {
  await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
  await useAllRoutes(page, account)
  // Powered off: the console lists it offline, and the relay has no path to it.
  account.printers = [{ ...account.printers[0], state: 'offline', online: false, last_seen: 0, online_since: null }]
  await page.addInitScript(() => {
    ;(window as any).__e2eRoute.cloud(false)
  })
})

function powerOn (page: Page, account: { printers: Array<Record<string, unknown>> }) {
  account.printers = [{ ...account.printers[0], state: 'ready', online: true, last_seen: Math.floor(Date.now() / 1000), online_since: Math.floor(Date.now() / 1000) }]
  return control(page, true)
}

test('a printer offline at page load flips to online in the printers list without a refresh', async ({ page, account }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await ready(page)
  await page.getByRole('link', { name: 'All printers' }).first().click()
  await expect(list(page)).toContainText('1 offline')
  await expect(list(page)).toContainText(ROUTE_PRINTER.name)

  await powerOn(page, account)

  await expect(list(page)).not.toContainText('1 offline', { timeout: FLIPS_WITHIN_MS })
  await expect(list(page)).not.toContainText('Is it switched on and on Wi-Fi?')
})

test('the open printer page that said Offline comes alive when the printer comes online, without a refresh', async ({ page, account }) => {
  test.setTimeout(120_000)
  await page.goto(`/${ROUTE_PRINTER.name.toLowerCase().replace(/\s+/g, '-')}`)
  await ready(page)
  await expect(page.getByTestId('printer-opening')).toContainText('Printer is offline', { timeout: 60_000 })

  await powerOn(page, account)

  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible({ timeout: FLIPS_WITHIN_MS })
  await expect(page.getByTestId('printer-opening')).toHaveCount(0)
})
