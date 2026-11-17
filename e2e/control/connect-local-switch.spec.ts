import type { Page } from '@playwright/test'
import { mdiBluetooth } from '@mdi/js'
import { test, expect, ready } from '../fixtures'
import { MOCK_PORT } from '../ports'
import { CONSOLE } from '../fakes/console'
import { PAIRED_BEFORE, pairEvents, useNearbyPrinters } from '../fakes/blePair'
import { reachOnLan, ROUTE_PRINTER, useAllRoutes } from '../fakes/routes'
import { PRESETS, usePrinter } from './printer'

test.use({ serviceWorkers: 'block' })

const A = `http://localhost:${MOCK_PORT}`
const B = `http://127.0.0.1:${MOCK_PORT}`
const SECOND = { id: '8f21abcd'.repeat(8), name: 'Sloe 8f21' }
const item = (page: Page, name: string) => page.locator('.v-list-item').getByText(name, { exact: true })
const where = (page: Page) => page.evaluate(async () => {
  const m = await import(/* @vite-ignore */ ['', 'e2e', 'fakes', 'routeActions.ts'].join('/'))
  return m.where()
})
const links = (page: Page) => page.evaluate(() => {
  const s = (window as any).__e2eRoute
  return { up: s.links.size as number, events: s.linkEvents as Array<{ event: string, at: number }> }
})

async function allPrinters (page: Page) {
  const link = page.getByRole('banner').getByRole('link', { name: 'All printers', exact: true })
  if (await link.count()) await link.click()
  else {
    const sheet = page.locator('.printer-switch__sheet.v-dialog--active')
    if (await sheet.isVisible()) {
      await page.keyboard.press('Escape')
      await expect(sheet).toBeHidden()
    }
    await page.getByTestId('printer-switch').click()
    await page.getByTestId('all-printers').click()
    await expect(sheet).toBeHidden()
  }
  await expect(page.getByRole('heading', { name: 'All printers', exact: true })).toBeVisible()
}

async function menu (page: Page, mobile: boolean) {
  if (mobile) {
    await page.getByTestId('printer-switch').click()
    await page.locator('.printer-switch__sheet.v-dialog--active button[aria-label^="Options for"]').first().click()
  } else await page.getByTestId('printer-page-menu-button').click()
}

async function routes (page: Page, account: Parameters<typeof useAllRoutes>[1]) {
  await useAllRoutes(page, account)
  await page.route(`${CONSOLE}/v1/printers/*/access`, r => r.request().headers().authorization || r.request().method() === 'OPTIONS'
    ? r.fallback()
    : r.fulfill({ status: 401, json: { detail: 'not signed in' }, headers: { 'access-control-allow-origin': '*' } }))
  await page.route(`${A}/server/muon/identity`, r => r.fulfill({
    json: { name: ROUTE_PRINTER.name, display: ROUTE_PRINTER.name, endpoint_id: ROUTE_PRINTER.id, derived_name: 'boxwood', suffix: '367a' },
    headers: { 'access-control-allow-origin': '*' }
  }))
}

async function onCloud (page: Page) {
  await page.goto('/')
  await ready(page)
  await allPrinters(page)
  await page.getByRole('button', { name: `Options for ${ROUTE_PRINTER.name}`, exact: true }).click()
  await item(page, 'Connect through Muon3D').click()
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true, mode: 'cloud' })
  await expect(page.getByTestId('printer-switch').first()).toContainText(/Boxwood/i)
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

test.describe('Connect locally', () => {
  test.describe('signed in on the cloud route', () => {
    test.use({ signedIn: true })
    for (const surface of ['page', 'tile'] as const) {
      test(`the ${surface} menu moves the running session onto LAN`, async ({ page, account, isMobile }) => {
        await routes(page, account)
        await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
        await onCloud(page)
        await reachOnLan(page)
        if (surface === 'page') await menu(page, isMobile)
        else {
          await allPrinters(page)
          await page.getByRole('button', { name: `Options for ${ROUTE_PRINTER.name}`, exact: true }).click()
        }
        await expect(item(page, 'Connect locally')).toBeVisible()
        await item(page, 'Connect locally').click()
        await expect.poll(() => where(page)).toMatchObject({ apiUrl: A, socketOpen: true, activeCloud: null, mode: 'lan' })
        await expect(page).toHaveURL(/\/boxwood-367a$/)
        await allPrinters(page)
        await expect(page.locator('.tile').filter({ hasText: /Boxwood/i })).toContainText('On this network')
      })
    }
  })

  for (const surface of ['page', 'tile'] as const) {
    test(`signed out, the ${surface} menu opens LAN from a Bluetooth session`, async ({ page, account, isMobile }) => {
      await routes(page, account)
      await page.addInitScript(([apiUrl, name, endpointId]) => {
        localStorage.setItem('appInstances', JSON.stringify([{ apiUrl, name, endpointId, socketUrl: apiUrl.replace(/^http/, 'ws') + '/websocket', active: false }]))
      }, [A, ROUTE_PRINTER.name, ROUTE_PRINTER.id])
      await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
      await page.goto('/')
      await ready(page)
      await reachOnLan(page)
      await page.getByTestId('connect-bluetooth').click()
      await expect.poll(() => where(page)).toMatchObject({ socketOpen: true, carrying: true })
      await reachOnLan(page)
      if (surface === 'page') await menu(page, isMobile)
      else {
        await allPrinters(page)
        await page.locator('button.tile__menu').click()
      }
      await expect(item(page, 'Connect locally')).toBeVisible()
      await item(page, 'Connect locally').click()
      await expect.poll(() => where(page)).toMatchObject({ apiUrl: A, socketOpen: true, activeCloud: null, mode: 'lan' })
      await expect(page.getByTestId('printer-switch').first()).toContainText('Ready')
    })
  }
})

test('the primary Bluetooth button uses the Bluetooth icon and opens a BLE session', async ({ page, account }) => {
  await routes(page, account)
  await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  await page.goto('/')
  await ready(page)
  await reachOnLan(page)
  const primary = page.getByTestId('connect-bluetooth')
  await expect(primary).toBeVisible()
  await expect(primary.locator('svg path')).toHaveAttribute('d', mdiBluetooth)
  await primary.click()
  await expect.poll(() => where(page)).toMatchObject({ socketOpen: true, carrying: true, mode: 'ble' })
  await expect(page).toHaveURL(/\/boxwood-367a$/)
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
})

test('the nearby tile primary action shows the Bluetooth icon and opens its BLE session', async ({ page }) => {
  await useNearbyPrinters(page, PAIRED_BEFORE, { advertise: true })
  await usePrinter(page, PRESETS.idleHomed(), { ticks: false })
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby', exact: true }).click()
  const primary = page.getByTestId('found-pair-bluetooth')
  await expect(primary.locator('svg path')).toHaveAttribute('d', mdiBluetooth)
  await primary.click()
  await expect.poll(() => pairEvents(page)).toContain('connect muon-boxwood-367a')
  await expect(page).toHaveURL(/\/boxwood-367a$/)
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
})

test.describe('switching printers', () => {
  test.use({ signedIn: true })
  for (const route of ['lan', 'ble', 'cloud'] as const) {
    for (const surface of ['printers', 'switcher'] as const) {
      test(`${route} A → LAN B from ${surface} closes A before B opens, without mixed data`, async ({ page, account, isMobile }) => {
        await routes(page, account)
        const events: Array<{ printer: string, event: string, method?: string, at: number }> = []
        const first = await usePrinter(page, PRESETS.idleHomed(), {
          ticks: false,
          apiUrl: A,
          onSocketEvent: (event, method) => events.push({ printer: 'A', event, method, at: Date.now() })
        })
        const second = await usePrinter(page, PRESETS.idleHomed(), {
          ticks: false,
          apiUrl: B,
          onSocketEvent: (event, method) => events.push({ printer: 'B', event, method, at: Date.now() })
        })
        const identity = { name: SECOND.name, display: SECOND.name, endpoint_id: SECOND.id, derived_name: 'sloe', suffix: '8f21' }
        await page.route(`${B}/server/muon/identity`, r => r.fulfill({ json: identity, headers: { 'access-control-allow-origin': '*' } }))
        await onCloud(page)
        if (route === 'ble') {
          await menu(page, isMobile)
          await item(page, 'Connect over Bluetooth').click()
          await expect.poll(() => where(page)).toMatchObject({ socketOpen: true, carrying: true, mode: 'ble' })
          await expect.poll(async () => (await links(page)).up).toBe(1)
        } else if (route === 'lan') {
          await reachOnLan(page)
          await menu(page, isMobile)
          await item(page, 'Connect locally').click()
          await expect.poll(() => where(page)).toMatchObject({ apiUrl: A, socketOpen: true, activeCloud: null })
        }
        await page.evaluate(() => { (window as any).__switchDocument = 'same document' })
        await discoverSecond(page)
        events.length = 0
        if (surface === 'printers') {
          await allPrinters(page)
          await page.locator('.tile').filter({ hasText: SECOND.name }).click()
        } else {
          await page.getByTestId('printer-switch').first().click()
          await page.locator('.muon-card').filter({ hasText: SECOND.name }).click()
        }
        await expect.poll(() => where(page)).toMatchObject({ apiUrl: B, socketOpen: true, activeCloud: null })
        await expect(page.getByTestId('printer-switch').first()).toContainText(/Sloe/i)
        await expect(page).toHaveURL(/\/sloe-8f21(?:-[a-z0-9]+)?$/)
        const closed = events.findIndex(e => e.printer === 'A' && e.event === 'close')
        const opened = events.findIndex(e => e.printer === 'B' && e.event === 'open')
        expect(closed, JSON.stringify(events)).toBeGreaterThanOrEqual(0)
        expect(opened, JSON.stringify(events)).toBeGreaterThan(closed)
        if (route === 'ble') {
          const radio = await links(page)
          expect(radio.up).toBe(0)
          expect(radio.events.at(-1)?.event).toBe('close')
          expect(radio.events.at(-1)!.at).toBeLessThanOrEqual(events[opened].at)
        }
        // Reports from the old printer cannot contaminate the new printer's live state.
        first.report({ print_stats: { state: 'printing', filename: 'A-only.gcode' } })
        second.report({ print_stats: { state: 'paused', filename: 'B-only.gcode' } })
        await expect(page.getByTestId('printer-switch').first()).toContainText('Paused')
        await page.evaluate(async () => {
          const { default: router } = await import(/* @vite-ignore */ ['', 'src', 'router', 'index.ts'].join('/'))
          await router.push(`${location.pathname}/console`)
        })
        await expect(page.getByRole('heading', { name: 'Console', exact: true })).toBeVisible()
        first.say('A-only-console-line')
        second.say('B-only-console-line')
        await expect(page.getByText('B-only-console-line', { exact: true })).toHaveCount(1)
        await expect(page.getByText('A-only-console-line', { exact: true })).toHaveCount(0)
        await expect(page.getByTestId('printer-switch').first()).not.toContainText('Boxwood')
        expect(events.slice(opened).filter(e => e.printer === 'A' && (e.event === 'open' || e.event === 'send'))).toEqual([])
        expect(await page.evaluate(() => (window as any).__switchDocument)).toBe('same document')
      })
    }
  }
})
