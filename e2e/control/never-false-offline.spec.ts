import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { NOT_PAIRED_HERE, PAIRED_BEFORE, PANEL_CODE, setPairingGate, useNearbyPrinters } from '../fakes/blePair'
import { MOCK_PORT } from '../ports'
import { PRESETS, usePrinter } from './printer'

test.use({ serviceWorkers: 'block' })

const ID = PAIRED_BEFORE.id
const API = `http://localhost:${MOCK_PORT}`
const tile = (page: Page) => page.locator('[data-tid^="printer-tile-"]').filter({ hasText: 'Boxwood' })

test.beforeEach(async ({ page }) => {
  await page.route(`${API}/server/muon/identity`, route => {
    const identity = { name: 'Boxwood', display: 'Boxwood', derived_name: 'boxwood', suffix: '367a', endpoint_id: ID }
    return route.fulfill({ json: { ...identity, result: identity }, headers: { 'access-control-allow-origin': '*' } })
  })
})

async function savedPrinter (page: Page) {
  await page.addInitScript(({ apiUrl, endpointId }) => {
    localStorage.setItem('appInstances', JSON.stringify([{ name: 'Boxwood', mdnsHost: 'muon-boxwood-367a.local', apiUrl, socketUrl: apiUrl.replace(/^http/, 'ws') + '/websocket', endpointId, active: false }]))
  }, { apiUrl: API, endpointId: ID })
}

// The LAN scanner's result, independent of the account and the active websocket.
async function lanFound (page: Page) {
  await page.evaluate(async ({ id, apiUrl }) => {
    const { discoveryState } = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'discovery.ts'].join('/'))
    discoveryState.found = [{ host: new URL(apiUrl).host, apiUrl, endpointId: id, name: 'Boxwood', link: { phase: 'linked', account: 'alice@example.test' }, health: { state: 'ready', checkedAt: Date.now() } }]
    discoveryState.scanning = false
    discoveryState.finishedAt = Date.now()
  }, { id: ID, apiUrl: API })
}

async function open (page: Page) {
  await page.goto('/')
  await ready(page)
}

async function menu (page: Page) {
  await page.getByRole('button', { name: 'Options for Boxwood', exact: true }).click()
  return page.locator('.v-menu__content.menuable__content__active')
}

async function lookNearby (page: Page) {
  if (await page.getByRole('button', { name: 'Look nearby', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'Look nearby', exact: true }).click()
  } else {
    await page.getByTestId('add-printer').click()
    await page.getByTestId('add-printer-sheet').getByTestId('look-nearby').click()
  }
}

for (const saved of [false, true]) {
  test(`KAN-3154: signed-out ${saved ? 'saved' : 'discovered'} LAN printer is Ready`, async ({ page }) => {
    await useNearbyPrinters(page, PAIRED_BEFORE)
    if (saved) await savedPrinter(page)
    await open(page)
    await lanFound(page)
    const printer = saved ? tile(page) : page.getByTestId('found')
    await expect(printer).toBeVisible()
    if (saved) await expect(printer).toContainText('Ready')
    else await expect(printer.getByRole('button', { name: 'Open', exact: true })).toBeVisible()
    await expect(printer).not.toContainText('Offline')
  })
}

test('KAN-3154: a signed-out saved Bluetooth printer stays reachable without advertisements while connected', async ({ page }) => {
  await useNearbyPrinters(page, PAIRED_BEFORE)
  await savedPrinter(page)
  await usePrinter(page, PRESETS.idleHomed())
  await open(page)
  await (await menu(page)).getByText('Connect over Bluetooth', { exact: true }).click()
  await expect.poll(() => page.evaluate(async id => {
    const { bluetoothCarrying } = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-ble', 'link.ts'].join('/'))
    return bluetoothCarrying(id)
  }, ID)).toBe(true)
  await page.evaluate(async () => {
    const { nearbyState } = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-ble', 'nearby.ts'].join('/'))
    // A connected printer stops advertising; its last sighting has expired, not its live link.
    for (const printer of nearbyState.printers) printer.heardAt = Date.now() - 31_000
    nearbyState.now = Date.now()
    const { discoveryState } = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'discovery.ts'].join('/'))
    discoveryState.scanning = false
    discoveryState.finishedAt = Date.now()
    const router = (await import(/* @vite-ignore */ ['', 'src', 'router', 'index.ts'].join('/'))).default
    if (router.currentRoute.path !== '/') await router.push('/')
  })
  await expect(tile(page)).toBeVisible()
  await expect(tile(page)).toContainText('Bluetooth')
  await expect(tile(page)).not.toContainText('Offline')
})

test('a LAN-discovered printer header does not say Offline when its websocket drops', async ({ page, isMobile }) => {
  await useNearbyPrinters(page, PAIRED_BEFORE)
  await savedPrinter(page)
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await page.goto('/boxwood-367a')
  await ready(page)
  await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
  await lanFound(page)
  await printer.offline()
  const header = isMobile ? page.getByRole('button', { name: 'Switch printer', exact: true }) : page.locator('.app-page-header')
  await expect(header).toBeVisible()
  await expect(header).toContainText('Reconnecting')
  await expect(header).not.toContainText('Offline')
})

test.describe('account printers', () => {
  test.use({ signedIn: true })

  test('KAN-3052: cloud-owned and LAN-reachable stays Ready through sign-out and another account', async ({ page, account }) => {
    account.account = { id: 'alice', email: 'alice@example.test', name: 'Alice' }
    account.printers = [{ id: ID, name: 'Boxwood', model: 'M1', state: 'offline', online: false, last_seen: 0 }]
    await useNearbyPrinters(page, PAIRED_BEFORE)
    await savedPrinter(page)
    await page.route(`${CONSOLE}/v1/auth/sign-in`, route => {
      account.account = { id: 'bob', email: 'bob@example.test', name: 'Bob' }
      account.printers = []
      return route.fulfill({ json: { token: 'bob-token', account: account.account }, headers: { 'access-control-allow-origin': '*' } })
    })
    await open(page)
    await lanFound(page)
    await expect(tile(page)).toContainText('Ready')
    if (await page.getByTestId('tab-more').isVisible()) await page.getByTestId('tab-more').click()
    await page.getByRole('button', { name: 'Account', exact: true }).click()
    await page.getByRole('menuitem', { name: /^Sign out/ }).click()
    await expect(page.getByTestId('signed-out-page')).toBeVisible()
    await page.getByTestId('signed-out-sign-in').click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Email', { exact: true }).fill('bob@example.test')
    await dialog.getByLabel('Password', { exact: true }).fill('a valid password')
    await dialog.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(tile(page)).toContainText('Ready')
    await expect(tile(page)).not.toContainText('Offline')
    await page.getByRole('button', { name: 'Account', exact: true }).click()
    await expect(page.getByRole('menu', { name: 'Account', exact: true })).toContainText('bob@example.test')
  })

  for (const route of ['LAN', 'Bluetooth'] as const) {
    test(`KAN-3411: console-offline printer present over ${route} is not Offline`, async ({ page, account }) => {
      account.printers = [{ id: ID, name: 'Boxwood', model: 'M1', state: 'offline', online: false, last_seen: 0 }]
      await useNearbyPrinters(page, PAIRED_BEFORE, { advertise: true })
      await open(page)
      if (route === 'LAN') await lanFound(page)
      else await lookNearby(page)
      await expect(tile(page)).toContainText(route === 'LAN' ? 'Ready' : 'Nearby')
      await expect(tile(page)).not.toContainText('Offline')
      const options = await menu(page)
      await expect(options.getByText('Connect over Bluetooth', { exact: true })).toBeVisible()
      await expect(options).not.toContainText('Offline')
    })
  }

  for (const route of ['LAN', 'cloud'] as const) {
    test(`KAN-1175: Bluetooth is offered while online over ${route}`, async ({ page, account }) => {
      account.printers = [{ id: ID, name: 'Boxwood', model: 'M1', state: 'idle', online: true, last_seen: Date.now() / 1000 }]
      await useNearbyPrinters(page, PAIRED_BEFORE, { advertise: true })
      await page.route(`${CONSOLE}/v1/printers/*/access`, r => r.request().method() === 'OPTIONS'
        ? r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } })
        : r.fulfill({ json: { printer_id: ID, relay_url: 'https://relay.e2e.test', role: 'operator', grant_id: 'e2e', expires_at: Date.now() / 1000 + 3600 }, headers: { 'access-control-allow-origin': '*' } }))
      await usePrinter(page, PRESETS.idleHomed())
      await open(page)
      if (route === 'LAN') await lanFound(page)
      await lookNearby(page)
      await (await menu(page)).getByText(route === 'LAN' ? 'Connect locally' : 'Connect through Muon3D', { exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible()
      const approval = page.getByTestId('approval-outcome')
      if (await approval.isVisible()) {
        await expect(approval).toContainText('Boxwood let this device in.')
        await page.getByTestId('approval-close').click()
        await expect(approval).toBeHidden()
      }
      await page.evaluate(async () => {
        const router = (await import(/* @vite-ignore */ ['', 'src', 'router', 'index.ts'].join('/'))).default
        await router.push('/')
      })
      await expect(tile(page)).toContainText(/Ready|Printing|\d+%/)
      await expect(tile(page)).not.toContainText('Offline')
      const options = await menu(page)
      const bluetooth = options.locator('.v-list-item').filter({ hasText: 'Connect over Bluetooth' })
      await expect(bluetooth).toBeVisible()
      await expect(bluetooth).not.toHaveClass(/v-list-item--disabled/)
    })
  }
})

test.describe('off-account nearby printers', () => {
  test.use({ signedIn: true })

  test('KAN-3410: an off-account nearby printer offers Bluetooth and shows its refusal', async ({ page, account }) => {
    account.printers = []
    await useNearbyPrinters(page, NOT_PAIRED_HERE, { advertise: true })
    await open(page)
    await page.getByRole('button', { name: 'Look nearby' }).click()
    await setPairingGate(page, false)
    const printer = page.getByTestId('found-list')
    await expect(printer).toContainText('Sloe')
    const bluetooth = printer.getByRole('button', { name: 'Connect over Bluetooth', exact: true })
    await expect(bluetooth).toBeEnabled()
    await bluetooth.click()
    await expect(page.getByText("This printer doesn't know this browser yet", { exact: false })).toBeVisible()
  })
})

test('Pair this browser remembers the admitted printer name and navigates to it', async ({ page, isMobile }) => {
  await useNearbyPrinters(page, NOT_PAIRED_HERE, { advertise: true })
  await usePrinter(page, PRESETS.idleHomed())
  await open(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await setPairingGate(page, true)
  await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  const sheet = page.getByTestId('ble-sheet')
  await sheet.getByLabel('8-digit code from the printer').fill(PANEL_CODE)
  await sheet.getByTestId('pair-submit').click()
  await expect(sheet).toBeHidden()
  await expect(page).toHaveURL(/\/sloe-5522$/)
  const title = isMobile ? page.getByRole('button', { name: 'Switch printer', exact: true }) : page.getByTestId('page-title')
  await expect(title).toContainText(/Sloe/i)
  await page.reload()
  await ready(page)
  await expect(page).toHaveURL(/\/sloe-5522$/)
  await expect(page.getByText(/No printer called/)).toHaveCount(0)
})
