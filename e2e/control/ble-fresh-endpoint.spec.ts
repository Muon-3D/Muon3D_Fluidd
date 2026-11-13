/**
 * An explicit Connect over Bluetooth, after a cloud session, runs over
 * Bluetooth (KAN-2531, Jack I-290: "I just connected over BT and after a bit it
 * switched to through muon3d").
 *
 * iroh remembers a printer's relay path for 60 s after its last connection
 * closes, so a Bluetooth dial on the same endpoint sent its first packets over
 * the relay as well, and the relay copy won. The fake client (e2e/fakes/rebind.ts)
 * keeps that memory per endpoint, so:
 * - Control binds a new endpoint before the explicit Bluetooth dial, and the
 *   session lands on Bluetooth, and only then says "Via Bluetooth";
 * - if the relay answers anyway, Control says the session is not on Bluetooth
 *   and never shows "Via Bluetooth".
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { REBIND_PRINTER, rebindEvents, useRebindRoutes } from '../fakes/rebind'

// The page's service worker answers its fetches itself, past page.route: a reload could then load the real muon-link-web.
test.use({ signedIn: true, serviceWorkers: 'block' })

const banner = (page: Page) => page.getByTestId('bluetooth-fallback')
const label = (page: Page) => page.evaluate(async id => {
  const m = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-ble', 'link.ts'].join('/'))
  return m.remoteRouteLabel(id) as string
}, REBIND_PRINTER.id)
const lastConnect = async (page: Page) => (await rebindEvents(page)).filter(e => e.startsWith('connect#')).pop()

test.beforeEach(async ({ page, account }) => {
  // Nothing here is about the 3D model; the photoreal M1 stalls software WebGL.
  await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
  await useRebindRoutes(page, account)
})

/** The app opens the printer through Muon3D on its own; then the person picks Connect over Bluetooth from All printers. */
async function cloudThenChooseBluetooth (page: Page) {
  await page.goto('/')
  await ready(page)
  await expect.poll(() => lastConnect(page)).toBe('connect#1 cloud')
  await page.getByRole('link', { name: 'All printers' }).first().click()
  await expect(page.getByText('Connecting...')).toHaveCount(0, { timeout: 30_000 })
  await page.locator(`button[aria-label="Options for ${REBIND_PRINTER.name}"]`).click()
  await page.getByText('Connect over Bluetooth', { exact: true }).click()
}

test('Connect over Bluetooth after a cloud session binds a fresh endpoint, lands on Bluetooth, and says Via Bluetooth only then', async ({ page, isMobile }) => {
  await cloudThenChooseBluetooth(page)

  // The old endpoint is closed and a new one bound before the link and the dial; the dial lands on Bluetooth.
  await expect.poll(() => lastConnect(page)).toBe('connect#2 ble')
  const events = await rebindEvents(page)
  expect(events.slice(0, 2)).toEqual(['bind#1', 'connect#1 cloud'])
  const closeAt = events.indexOf('close#1')
  const bindAt = events.indexOf('bind#2')
  expect(closeAt).toBeGreaterThan(1)
  expect(bindAt).toBeGreaterThan(closeAt)
  expect(events.indexOf('addLink#2')).toBeGreaterThan(bindAt)
  expect(events.indexOf('connect#2 ble')).toBeGreaterThan(events.indexOf('addLink#2'))
  expect(events.filter(e => e.startsWith('bind#'))).toHaveLength(2)

  // The printer speaks over the radio: now, and only now, the label says Bluetooth.
  await expect.poll(() => label(page), { timeout: 30_000 }).toBe('Via Bluetooth')
  if (!isMobile) await expect(page.getByText('Via Bluetooth', { exact: true }).first()).toBeVisible()
  await expect(banner(page)).toHaveCount(0)
  // And it stays there: no later dial moved it.
  await page.waitForTimeout(12_000)
  expect(await label(page)).toBe('Via Bluetooth')
  expect((await rebindEvents(page)).filter(e => e.startsWith('connect#'))).toEqual(['connect#1 cloud', 'connect#2 ble'])
  await expect(banner(page)).toHaveCount(0)
})

test('when the relay answers anyway, it says the session is not on Bluetooth and never shows Via Bluetooth', async ({ page, isMobile }) => {
  await page.addInitScript(() => { (window as any).__e2eRebind.relayWins(true) })
  await cloudThenChooseBluetooth(page)
  await expect.poll(() => lastConnect(page)).toBe('connect#2 cloud')

  // Never "Via Bluetooth" for a session the relay carries, at any moment on the way.
  expect(await label(page)).toBe('Through Muon3D')
  // NOT_ON_BLUETOOTH_MS is 10 s of silence from the printer on the radio, checked every second.
  await expect(banner(page)).toContainText('not over Bluetooth', { timeout: 30_000 })
  await expect(banner(page)).toContainText('Connect over Bluetooth again to retry')
  expect(await label(page)).toBe('Through Muon3D')
  if (!isMobile) await expect(page.getByText('Via Bluetooth', { exact: true })).toHaveCount(0)
})
