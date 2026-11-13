/**
 * KAN-2528 and KAN-2530 from the person's side.
 *
 * - KAN-2528: a printer whose Bluetooth advert is heard is not "Offline", whether the
 *   console lists it (and calls it offline) or only this browser saved it.
 * - KAN-2530: the main Bluetooth control is the icon alone, with an accessible name and a
 *   tooltip; a printer picked that is not on the account shows the set-up flow or a notice;
 *   a cancelled chooser stays silent.
 *
 * Connect locally from the hosted https page (KAN-2529) needs an https page, which the
 * local server is not; it is covered by unit tests (printer-entries-connect-locally.spec.ts,
 * local-route.spec.ts) on an https jsdom page.
 *
 * Desktop 1440x900 and phone 390x844. The fake navigator.bluetooth is the one in
 * ble-chooser.spec.ts, with getDevices and watchAdvertisements added when a test needs adverts.
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

function cloudPrinter (id: string, name: string, online: boolean) {
  return { id, name, model: 'M1', version: '1.0.0', linked_at: 1_700_000_000, last_seen: online ? Math.floor(Date.now() / 1000) : 1_700_000_000, online, online_since: online ? 1_700_000_000 : null, role: 'operator' }
}

async function withAccountPrinters (page: Page, printers: Array<ReturnType<typeof cloudPrinter>>) {
  await page.route(`${CONSOLE}/v1/printers`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ printers }) }))
}

/** The same fake as ble-chooser.spec.ts: pick is the EndpointId the person chooses, null for a dismissed chooser. */
async function withBluetooth (page: Page, pick: string | null, name = 'walnut-8987') {
  await page.addInitScript(({ pick, name }) => {
    const info = new Uint8Array(38)
    info[0] = 1
    info[4] = 182
    if (pick) for (let i = 0; i < 32; i++) info[6 + i] = parseInt(pick.slice(i * 2, i * 2 + 2), 16)
    const characteristic = { readValue: async () => new DataView(info.buffer.slice(0)) }
    const server: any = {
      connected: true,
      connect: async () => server,
      disconnect: () => {},
      getPrimaryService: async () => ({ getCharacteristic: async () => characteristic })
    }
    const device = Object.assign(new EventTarget(), { id: 'dev-1', name, gatt: server })
    Object.defineProperty(navigator, 'bluetooth', {
      configurable: true,
      value: {
        requestDevice: () => pick
          ? Promise.resolve(device)
          : Promise.reject(new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError')),
        getAvailability: async () => true,
        addEventListener: () => {},
        removeEventListener: () => {}
      }
    })
  }, { pick, name })
}

/**
 * A printer this browser chose before and now hears advertise: getDevices gives it back,
 * and watchAdvertisements reports an advert every 500 ms.
 */
async function withAdvertisingPrinter (page: Page, endpointId: string, localName: string) {
  await page.addInitScript(({ endpointId, localName }) => {
    localStorage.setItem('muon.ble.printers', JSON.stringify({ 'dev-adv': { endpointId, localName } }))
    const prefix = new Uint8Array(10)
    prefix[0] = 1
    for (let i = 0; i < 8; i++) prefix[2 + i] = parseInt(endpointId.slice(i * 2, i * 2 + 2), 16)
    const device: any = Object.assign(new EventTarget(), { id: 'dev-adv', name: localName, gatt: { connected: false } })
    device.watchAdvertisements = async ({ signal }: { signal: AbortSignal }) => {
      const send = () => {
        const event: any = new Event('advertisementreceived')
        event.device = device
        event.name = localName
        event.manufacturerData = new Map([[0xffff, new DataView(prefix.buffer)]])
        device.dispatchEvent(event)
      }
      send()
      const timer = setInterval(send, 500)
      signal.addEventListener('abort', () => clearInterval(timer))
    }
    Object.defineProperty(navigator, 'bluetooth', {
      configurable: true,
      value: {
        getDevices: async () => [device],
        requestDevice: () => Promise.reject(new DOMException('User cancelled', 'NotFoundError')),
        getAvailability: async () => true,
        addEventListener: () => {},
        removeEventListener: () => {}
      }
    })
  }, { endpointId, localName })
}

test.describe('KAN-2528: heard over Bluetooth is not Offline', () => {
  test.use({ signedIn: true })

  test('a printer the console calls offline, but whose advert is heard, is Nearby', async ({ page }) => {
    await withAdvertisingPrinter(page, ELM_ID, 'elm-1234')
    await withAccountPrinters(page, [cloudPrinter(ELM_ID, 'Elm', false)])
    await openPrinters(page)
    await expect(page.getByText('Nearby · Bluetooth').first()).toBeVisible()
    await expect(page.getByTestId('offline')).toHaveCount(0)
  })

  test('the same printer with no advert stays Offline (control)', async ({ page }) => {
    await withBluetooth(page, null)
    await withAccountPrinters(page, [cloudPrinter(ELM_ID, 'Elm', false)])
    await openPrinters(page)
    await expect(page.getByTestId('offline')).toBeVisible()
    await expect(page.getByText('Nearby · Bluetooth')).toHaveCount(0)
  })
})

test.describe('KAN-2530: the Bluetooth button', () => {
  test.use({ signedIn: true })

  test('is the Bluetooth icon alone, named and with a tooltip', async ({ page }) => {
    await withBluetooth(page, null)
    await openPrinters(page)
    const button = page.getByTestId('connect-bluetooth')
    await expect(button).toBeVisible()
    await expect(button).toHaveAttribute('aria-label', 'Connect over Bluetooth')
    await expect(button).toHaveAttribute('title', 'Connect over Bluetooth')
    await expect(page.getByRole('button', { name: 'Connect over Bluetooth' })).toBeVisible()
    await expect(button).toHaveText('')
  })

  test('a printer picked that is not on the account shows something', async ({ page }) => {
    await withBluetooth(page, NEW_ID)
    await withAccountPrinters(page, [cloudPrinter(ELM_ID, 'Elm', true)])
    await openPrinters(page)
    await page.getByTestId('connect-bluetooth').click()
    // The set-up dialog for a new printer, or a notice: never nothing.
    const setup = page.getByRole('dialog')
    const notice = page.locator('.note', { hasText: /was found over Bluetooth|is saved in this browser|still loading|is nearby|Couldn.t tell which printer/ })
    await expect(setup.or(notice).first()).toBeVisible()
  })

  test('a cancelled chooser stays silent', async ({ page }) => {
    await withBluetooth(page, null)
    await withAccountPrinters(page, [cloudPrinter(ELM_ID, 'Elm', true)])
    await openPrinters(page)
    await page.getByTestId('connect-bluetooth').click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('.note')).toHaveCount(0)
  })
})
