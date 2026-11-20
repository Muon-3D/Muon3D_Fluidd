/**
 * Add printer, no dead ends (KAN-3805). A soldier on the printer's hotspot
 * (http://10.42.0.1/ or muon3d.local) must always have a next step: every
 * failure in Add printer says what happened in plain words and offers one
 * thing to do.
 *
 * Nothing here touches a real printer: every address is a made-up one whose
 * requests are routed or aborted by the test, and Web Bluetooth is a fake.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../../fixtures'

const HOST = '192.168.88.9'

async function openPrinters (page: Page) {
  await page.goto('/')
  await ready(page)
}

/** Every request to HOST is answered by `answer`, and counted. */
async function withAddress (page: Page, answer: 'down' | 'not-a-printer' | 'muon') {
  const state = { mode: answer as string, asks: 0 }
  await page.route(`http://${HOST}/**`, route => {
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    state.asks++
    if (state.mode === 'down') return route.abort('connectionrefused')
    if (state.mode === 'not-a-printer') return route.fulfill({ status: 404, headers, contentType: 'text/plain', body: 'nope' })
    const url = new URL(route.request().url())
    if (url.pathname === '/server/muon/identity') {
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ name: 'muon-hazel-41c2', display: 'Hazel', endpoint_id: 'hazel-41c2', derived_name: 'hazel', suffix: '41c2' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ result: {} }) })
  })
  return state
}

async function openAddressDialog (page: Page) {
  await openPrinters(page)
  await page.getByTestId('add-printer').click()
  await page.getByTestId('add-printer-sheet').getByTestId('enter-address').click()
  await expect(page.getByTestId('add-printer-dialog')).toBeVisible()
}

/** A fake Web Bluetooth: `radio` is what getAvailability says; `fail` makes the chooser fail the way a flaky link does. */
async function withBluetooth (page: Page, { radio = true, fail = false } = {}) {
  await page.addInitScript(({ radio, fail }) => {
    const asked: unknown[] = []
    ;(window as any).__bluetoothAsks = asked
    Object.defineProperty(navigator, 'bluetooth', {
      configurable: true,
      value: {
        requestDevice: (options: unknown) => {
          asked.push(options)
          return Promise.reject(fail
            ? new DOMException('GATT Server is disconnected. Cannot retrieve services.', 'NetworkError')
            : new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError'))
        },
        getAvailability: async () => radio,
        getDevices: async () => [],
        addEventListener: () => {},
        removeEventListener: () => {}
      }
    })
  }, { radio, fail })
}

const asks = (page: Page) => page.evaluate(() => (window as any).__bluetoothAsks.length as number)

test.describe('typing an address that does not work', () => {
  test('nothing answered: it says so, and Try again asks the address again', async ({ page }) => {
    const address = await withAddress(page, 'down')
    await openAddressDialog(page)
    await page.getByTestId('add-printer-address').fill(HOST)
    const status = page.getByTestId('add-printer-status')
    await expect(status).toContainText('Nothing answered', { timeout: 30_000 })
    const retry = page.getByTestId('add-printer-retry')
    await expect(retry).toBeVisible()
    // Add is off, and a line under it says why and what to do.
    await expect(page.getByTestId('add-printer-add')).toBeDisabled()
    await expect(page.getByTestId('add-printer-why')).toContainText('Add is off')
    const before = address.asks
    // The printer comes up in the meantime: asking again finds it.
    address.mode = 'muon'
    await retry.click()
    await expect(status).toContainText('Found', { timeout: 30_000 })
    expect(address.asks).toBeGreaterThan(before)
    await expect(page.getByTestId('add-printer-add')).toBeEnabled()
    await expect(page.getByTestId('add-printer-retry')).toHaveCount(0)
  })

  test('something answered that is not a printer: it says so, and Try again is there', async ({ page }) => {
    const address = await withAddress(page, 'not-a-printer')
    await openAddressDialog(page)
    await page.getByTestId('add-printer-address').fill(HOST)
    const status = page.getByTestId('add-printer-status')
    await expect(status).toContainText("isn't a printer", { timeout: 30_000 })
    await expect(page.getByTestId('add-printer-retry')).toBeVisible()
    await expect(page.getByTestId('add-printer-why')).toBeVisible()
    const before = address.asks
    await page.getByTestId('add-printer-retry').click()
    await expect.poll(() => address.asks).toBeGreaterThan(before)
    await expect(status).toContainText("isn't a printer", { timeout: 30_000 })
  })

  test('before anything is typed, Add says what turns it on', async ({ page }) => {
    await openAddressDialog(page)
    await expect(page.getByTestId('add-printer-add')).toBeDisabled()
    await expect(page.getByTestId('add-printer-why')).toContainText('Type its name or address')
  })
})

test('a brand that needs an M1 bridge offers to add the M1 first', async ({ page }) => {
  await openAddressDialog(page)
  await page.getByRole('button', { name: /Bambu Lab/ }).click()
  await expect(page.getByTestId('add-printer-dialog')).toContainText('needs an M1 bridge')
  await page.getByTestId('add-printer-bridge-m1').click()
  await expect(page.getByTestId('add-printer-address')).toBeVisible()
})

test('a Klipper address that fails says it plainly, with the raw reason behind Details', async ({ page }) => {
  await page.route(`http://${HOST}/**`, route => {
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    return route.fulfill({ status: 500, headers, contentType: 'text/plain', body: 'boom' })
  })
  await openAddressDialog(page)
  await page.getByRole('button', { name: /Klipper \(Moonraker\)/ }).click()
  await page.getByPlaceholder('192.168.1.20').fill(HOST)
  await expect(page.getByTestId('add-printer-foreign-why')).toContainText('Check printer')
  await page.getByRole('button', { name: 'Check printer' }).click()
  const message = page.getByTestId('add-printer-probe')
  await expect(message).toContainText('Something answered, but not as this kind of printer does')
  await expect(message).not.toContainText('HTTP 500')
  await page.getByText('Details', { exact: true }).click()
  await expect(page.getByTestId('add-printer-dialog')).toContainText('HTTP 500')
})

test.describe('Bluetooth and network search in the Add sheet', () => {
  test('Bluetooth off: the row is there with a Turn on Bluetooth search button that asks the browser', async ({ page }) => {
    await withBluetooth(page, { radio: false })
    await openPrinters(page)
    await page.getByTestId('add-printer').click()
    const sheet = page.getByTestId('add-printer-sheet')
    await expect(sheet.getByTestId('bluetooth-row')).toBeVisible()
    await expect(sheet.getByTestId('bluetooth-off')).toContainText('Turn on Bluetooth on this device')
    const button = sheet.getByTestId('look-nearby')
    await expect(button).toHaveText('Turn on Bluetooth search')
    await button.click()
    await expect.poll(() => asks(page)).toBe(1)
  })

  test('no Web Bluetooth: the row says why in one line instead of hiding', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: undefined })
    })
    await openPrinters(page)
    await page.getByTestId('add-printer').click()
    const sheet = page.getByTestId('add-printer-sheet')
    await expect(sheet.getByTestId('bluetooth-row')).toBeVisible()
    await expect(sheet.getByTestId('bluetooth-unavailable')).toContainText("This browser can't use Bluetooth")
    await expect(sheet.getByTestId('look-nearby')).toHaveCount(0)
  })

  test('the network row has a Search this network button that searches again', async ({ page }) => {
    await openPrinters(page)
    await page.getByTestId('add-printer').click()
    const button = page.getByTestId('add-printer-sheet').getByTestId('search-again')
    await expect(button).toHaveText('Search this network')
    await expect(button).toBeVisible()
  })
})

test('a Bluetooth search that fails is a plain sentence with Try again, and the raw reason behind Details', async ({ page }) => {
  await withBluetooth(page, { fail: true })
  await openPrinters(page)
  await page.getByTestId('connect-bluetooth').click()
  const error = page.getByTestId('nearby-error')
  await expect(error).toContainText("Couldn't reach the printer over Bluetooth")
  // The raw reason is folded away until Details is opened.
  await expect(error.locator('code')).toBeHidden()
  await expect.poll(() => asks(page)).toBe(1)
  await page.getByTestId('nearby-retry').click()
  await expect.poll(() => asks(page)).toBe(2)
  await error.getByText('Details', { exact: true }).click()
  await expect(error.locator('code')).toBeVisible()
  await expect(error).toContainText('GATT Server is disconnected')
})

test.describe('the top-bar Sign in on a printer with no internet', () => {
  test('hidden when the Muon3D service cannot be reached', async ({ page }) => {
    await page.route('https://console.e2e.test/v1/config', route => route.abort('internetdisconnected'))
    await openPrinters(page)
    // The check has run once the page is settled; give it its time limit, then the button must not be there.
    await expect(page.getByTestId('topbar-sign-in')).toHaveCount(0, { timeout: 15_000 })
    await page.waitForTimeout(1000)
    await expect(page.getByTestId('topbar-sign-in')).toHaveCount(0)
  })

  test('shown when the service answers', async ({ page }) => {
    await openPrinters(page)
    await expect(page.getByTestId('topbar-sign-in')).toBeVisible()
  })

  test('comes back when the network does', async ({ page }) => {
    let up = false
    await page.route('https://console.e2e.test/v1/config', route => up ? route.fallback() : route.abort('internetdisconnected'))
    await openPrinters(page)
    await expect(page.getByTestId('topbar-sign-in')).toHaveCount(0, { timeout: 15_000 })
    up = true
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expect(page.getByTestId('topbar-sign-in')).toBeVisible()
  })

  test('a slow service (6 s) still shows Sign in', async ({ page }) => {
    await page.route('https://console.e2e.test/v1/config', async route => {
      await new Promise(resolve => setTimeout(resolve, 6000))
      await route.fallback()
    })
    await openPrinters(page)
    await page.waitForTimeout(8000)
    await expect(page.getByTestId('topbar-sign-in')).toBeVisible()
  })

  test('comes back when the tab is focused again, with no online event', async ({ page }) => {
    let up = false
    await page.route('https://console.e2e.test/v1/config', route => up ? route.fallback() : route.abort('internetdisconnected'))
    await openPrinters(page)
    await expect(page.getByTestId('topbar-sign-in')).toHaveCount(0, { timeout: 15_000 })
    up = true
    // Focus alone inside the minute is throttled; a minute on, it asks again.
    await page.evaluate(async () => {
      const m = await import('/src/services/muon-cloud/reachable.ts' as string)
      m.reachState.checkedAt = Date.now() - 61_000
      window.dispatchEvent(new Event('focus'))
    })
    await expect(page.getByTestId('topbar-sign-in')).toBeVisible()
  })
})

test.describe('the empty Welcome page keeps the Bluetooth row too', () => {
  async function noPrinters (page: Page) {
    await page.route('**/config.json', async route => {
      const response = await route.fetch()
      const config = await response.json()
      config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
      config.endpoints = []
      await route.fulfill({ response, json: config })
    })
  }

  test('Bluetooth off: Turn on Bluetooth search is there and asks the browser', async ({ page }) => {
    await withBluetooth(page, { radio: false })
    await noPrinters(page)
    await openPrinters(page)
    const welcome = page.getByTestId('printers-welcome')
    await expect(welcome.getByTestId('bluetooth-off')).toBeVisible()
    await expect(welcome.getByTestId('look-nearby')).toHaveText('Turn on Bluetooth search')
    await welcome.getByTestId('look-nearby').click()
    await expect.poll(() => asks(page)).toBe(1)
  })

  test('no Web Bluetooth: one plain line, no dead button', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: undefined })
    })
    await noPrinters(page)
    await openPrinters(page)
    const welcome = page.getByTestId('printers-welcome')
    await expect(welcome.getByTestId('bluetooth-unavailable')).toContainText("This browser can't use Bluetooth")
    await expect(welcome.getByTestId('look-nearby')).toHaveCount(0)
  })
})
