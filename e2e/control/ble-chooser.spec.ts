/**
 * KAN-2470: Connect over Bluetooth.
 *
 * - On one printer, the menu's Connect over Bluetooth opens the same chooser as the top-right button
 *   (KAN-3589: a filter on that printer's EndpointId matched nothing in Chrome), and is the only Bluetooth item.
 * - The big Connect over Bluetooth button on All printers lists only Muon printers
 *   (the service filter, nothing else); a dismissed chooser does nothing.
 * - Where there is no Web Bluetooth, one quiet line says why.
 *
 * Runs on the desktop (1440x900) and phone (390x844) projects. A fake
 * `navigator.bluetooth` records what the page asked of `requestDevice`.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'

const ELM_ID = '3fa9c0de'.repeat(8)
const NEW_ID = '9b1e44a0'.repeat(8)

async function openPrinters (page: Page) {
  await page.goto('/')
  await ready(page)
}

function cloudPrinter (id: string, name: string) {
  const now = Math.floor(Date.now() / 1000)
  return { id, name, model: 'M1', version: '1.0.0', linked_at: 1_700_000_000, last_seen: now, online: true, online_since: 1_700_000_000, role: 'operator' }
}

async function withAccountPrinters (page: Page, printers: Array<ReturnType<typeof cloudPrinter>>) {
  await page.route(`${CONSOLE}/v1/printers`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ printers }) }))
}

/**
 * A fake Web Bluetooth. `pick` is the EndpointId of the printer the person
 * chooses, or null for a dismissed chooser. Nothing but `requestDevice` is
 * remembered, and `getDevices` is undefined unless `granted`, where it lists the device.
 */
async function withBluetooth (page: Page, pick: string | null, name = 'walnut-8987', granted = false, advertisesAs: string | null = null) {
  await page.addInitScript(({ pick, name, granted, advertisesAs }) => {
    const asked: unknown[] = []
    ;(window as any).__bluetoothAsks = asked
    const info = new Uint8Array(38)
    info[0] = 1
    info[4] = 182
    if (pick) for (let i = 0; i < 32; i++) info[6 + i] = parseInt(pick.slice(i * 2, i * 2 + 2), 16)
    const characteristic = { readValue: async () => new DataView(info.buffer.slice(0)) }
    ;(window as any).__bluetoothGetDevices = 0
    const server: any = {
      connected: true,
      connect: async () => server,
      disconnect: () => {},
      getPrimaryService: async () => ({ getCharacteristic: async () => characteristic })
    }
    const device: any = Object.assign(new EventTarget(), { id: 'dev-1', name, gatt: server })
    // `advertisesAs`: the device's advertisement names another printer's EndpointId, so the page drops the id it read (a stale key).
    if (advertisesAs) {
      device.watchAdvertisements = async () => {
        const bytes = new Uint8Array(10)
        bytes[0] = 1
        for (let i = 0; i < 8; i++) bytes[2 + i] = parseInt(advertisesAs.slice(i * 2, i * 2 + 2), 16)
        const event: any = new Event('advertisementreceived')
        event.device = device
        event.name = name
        event.manufacturerData = new Map([[0xffff, new DataView(bytes.buffer)]])
        device.dispatchEvent(event)
      }
    }
    // `granted`: this browser was allowed the printer earlier, so getDevices lists it and the page remembers it.
    if (granted && pick) localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-1': { endpointId: pick, localName: name } }))
    Object.defineProperty(navigator, 'bluetooth', {
      configurable: true,
      value: {
        getDevices: granted ? async () => { (window as any).__bluetoothGetDevices++; return [device] } : undefined,
        requestDevice: (options: unknown) => {
          asked.push(options)
          return pick
            ? Promise.resolve(device)
            : Promise.reject(new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError'))
        },
        getAvailability: async () => true,
        addEventListener: () => {},
        removeEventListener: () => {}
      }
    })
  }, { pick, name, granted, advertisesAs })
}

const asks = (page: Page) => page.evaluate(() => (window as any).__bluetoothAsks as any[])

test.describe('Connect over Bluetooth on one printer', () => {
  test.use({ signedIn: true })

  test("the menu's Connect over Bluetooth asks the chooser exactly what the top-right button does (KAN-3589)", async ({ page }) => {
    await withBluetooth(page, null)
    await withAccountPrinters(page, [cloudPrinter(ELM_ID, 'Elm')])
    await openPrinters(page)
    await page.locator('button[aria-label="Options for Elm"]').click()
    // One Bluetooth item: Pair this browser is gone, its pairing happens inside Connect over Bluetooth (KAN-3588).
    await expect(page.getByRole('menuitem', { name: 'Connect over Bluetooth' })).toHaveCount(1)
    await expect(page.getByRole('menuitem', { name: 'Pair this browser' })).toHaveCount(0)
    await page.getByRole('menuitem', { name: 'Connect over Bluetooth' }).click()
    await expect.poll(async () => (await asks(page)).length).toBe(1)
    const [options] = await asks(page)
    // The filter built from the printer's EndpointId (manufacturer data) listed nothing in Chrome:
    // "No compatible devices found". The working request is the service filter alone.
    expect(options.filters).toEqual([{ services: ['843ce1e6-c64c-4ac1-b06b-5afd8329b7f9'] }])
    expect(options.optionalManufacturerData).toEqual([0xffff])
    // The top-right button's request is the same one.
    await page.getByTestId('connect-bluetooth').click()
    await expect.poll(async () => (await asks(page)).length).toBe(2)
    expect((await asks(page))[1]).toEqual(options)
  })

  test('a device this browser was already allowed is reused: no chooser (KAN-3591)', async ({ page }) => {
    await withBluetooth(page, ELM_ID, 'walnut-8987', true)
    await withAccountPrinters(page, [cloudPrinter(ELM_ID, 'Elm')])
    await openPrinters(page)
    await page.locator('button[aria-label="Options for Elm"]').click()
    await page.getByRole('menuitem', { name: 'Connect over Bluetooth' }).click()
    // The granted devices were consulted, one matched this printer, and the chooser never opened.
    await expect.poll(async () => page.evaluate(() => (window as any).__bluetoothGetDevices)).toBeGreaterThan(0)
    await page.waitForTimeout(1500)
    expect(await asks(page)).toHaveLength(0)
  })

  test('a different printer picked anyway is refused with its name', async ({ page }) => {
    await withBluetooth(page, NEW_ID)
    await withAccountPrinters(page, [cloudPrinter(ELM_ID, 'Elm')])
    await openPrinters(page)
    await page.locator('button[aria-label="Options for Elm"]').click()
    await page.getByRole('menuitem', { name: 'Connect over Bluetooth' }).click()
    await expect(page.getByText("That device isn't Elm", { exact: false })).toBeVisible()
  })

  test('a chosen device that names no printer is refused, not connected as the printer that was clicked', async ({ page }) => {
    // The chooser returns Elm's id, but the device then advertises another printer's: the page keeps no EndpointId for it.
    await withBluetooth(page, ELM_ID, 'walnut-8987', false, NEW_ID)
    await withAccountPrinters(page, [cloudPrinter(ELM_ID, 'Elm')])
    await openPrinters(page)
    await page.locator('button[aria-label="Options for Elm"]').click()
    await page.getByRole('menuitem', { name: 'Connect over Bluetooth' }).click()
    await expect(page.getByText("That device isn't Elm", { exact: false })).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
  })
})

test('the big Connect over Bluetooth button lists only Muon printers', async ({ page }) => {
  await withBluetooth(page, null)
  await openPrinters(page)
  const button = page.getByTestId('connect-bluetooth')
  await expect(button).toBeVisible()
  await expect(page.getByTestId('add-printer')).toBeVisible()
  await expect(page.getByTestId('bluetooth-needs-chrome')).toHaveCount(0)
  await button.click()
  await expect.poll(async () => (await asks(page)).length).toBe(1)
  const [options] = await asks(page)
  expect(options.filters).toEqual([{ services: ['843ce1e6-c64c-4ac1-b06b-5afd8329b7f9'] }])
})

test('a dismissed chooser from the big button does nothing and shows no error', async ({ page }) => {
  await withBluetooth(page, null)
  await openPrinters(page)
  const before = await page.getByTestId('printers-summary').innerText()
  await page.getByTestId('connect-bluetooth').click()
  await expect.poll(async () => (await asks(page)).length).toBe(1)
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByTestId('printers-summary')).toHaveText(before)
  await expect(page.getByText("Couldn't read the printer over Bluetooth")).toHaveCount(0)
  await expect(page.getByTestId('connect-bluetooth')).toBeEnabled()
})

test('a printer picked with the big button that is new to this browser is listed over Bluetooth', async ({ page }) => {
  await withBluetooth(page, NEW_ID)
  await openPrinters(page)
  await page.getByTestId('connect-bluetooth').click()
  await expect(page.getByText('Walnut', { exact: false }).first()).toBeVisible()
})

test('without Web Bluetooth there is no button, only one quiet line', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: undefined })
  })
  await openPrinters(page)
  await expect(page.getByTestId('connect-bluetooth')).toHaveCount(0)
  await expect(page.getByTestId('bluetooth-needs-chrome')).toContainText("This browser can't use Bluetooth")
  await expect(page.getByTestId('add-printer')).toBeVisible()
})
