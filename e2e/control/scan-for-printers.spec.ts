/**
 * KAN-5409: one "Scan for printers" button finds the printers on the person's network with no typing.
 *
 * The console (account printers with their secure names, and the same-network list) and the https probe are
 * mocked; the Bluetooth radio is the fake from e2e/fakes/blePair.ts. No real printer is touched.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { OPEN_PRINTER, useNearbyPrinters } from '../fakes/blePair'

test.use({ serviceWorkers: 'block' })

const SLOE_NAME = 'abcdefghijklmnopqrst.muonlan.net'
const ALDER_NAME = 'bcdefghijklmnopqrstu.muonlan.net'
const CORS = { 'access-control-allow-origin': '*' }

function cloudPrinter (id: string, name: string, secureName: string | null) {
  const now = Math.floor(Date.now() / 1000)
  return { id, name, model: 'M1', version: '1.0.0', linked_at: 1_700_000_000, last_seen: now, online: true, online_since: 1_700_000_000, role: 'operator', secure_name: secureName }
}

async function mockConsole (page: Page, printers: unknown[], nearby: unknown[]) {
  await page.route(`${CONSOLE}/v1/printers`, route => route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ printers }) }))
  await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ printers: nearby }) }))
}

/** A browser without Web Bluetooth. (With the fake radio, a pick opens that printer and leaves this page.) */
function noBluetooth (page: Page) {
  return page.addInitScript(() => { Object.defineProperty(navigator, 'bluetooth', { value: undefined, configurable: true }) })
}

/** The https probe (Moonraker's /server/info, as Control asks it): the printers in `answering` answer, the others do not. */
async function mockProbe (page: Page, answering: string[], probed: string[] = []) {
  await page.route(/^https:\/\/[a-z2-7]{20}\.muonlan\.net\/.*/, route => {
    const url = new URL(route.request().url())
    probed.push(`${url.hostname}${url.pathname} credentials=${route.request().headers().authorization ? 'sent' : 'none'}`)
    if (answering.includes(url.hostname)) return route.fulfill({ status: 200, contentType: 'text/plain', headers: CORS, body: 'muon3d-secure-origin-1\n' })
    return route.abort('connectionrefused')
  })
}

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('Scan lists a printer that answers over https as "On this network (secure)" and offers no printer address for one that does not', async ({ page }) => {
    const probed: string[] = []
    await noBluetooth(page)
    await mockConsole(page,
      [cloudPrinter('p-sloe', 'Sloe b26d', SLOE_NAME), cloudPrinter('p-alder', 'Alder 6601', ALDER_NAME), cloudPrinter('p-far', 'Far away', null)],
      [
        { printer_id: 'p-sloe', name: 'Sloe b26d', model: 'M1', linked: true, local_addrs: ['192.168.1.20'] },
        { printer_id: 'p-alder', name: 'Alder 6601', model: 'M1', linked: true, local_addrs: ['192.168.1.21'] }
      ])
    await mockProbe(page, [SLOE_NAME], probed)
    await page.goto('/')
    await ready(page)

    await page.getByTestId('scan-printers').click()

    const secure = page.getByTestId('scan-secure')
    await expect(secure).toHaveCount(1)
    await expect(secure).toContainText('Sloe')
    await expect(secure).toContainText('On this network (secure)')
    // A button, never a link to the printer's address: Open connects in place (KAN-5459).
    await expect(secure.getByTestId('scan-open-secure')).not.toHaveAttribute('href', /.*/)

    // Alder did not answer: it is not offered by an address of its own, only in the printer list.
    await expect(page.getByTestId('scan-local')).toHaveCount(0)

    await expect(page.getByTestId('scan-progress')).toHaveCount(0)
    await expect(page.getByTestId('scan-empty')).toHaveCount(0)
    // Only names under the printer zone were probed, for the printer marker, with no credentials.
    expect(probed.every(p => p.endsWith('/server/info credentials=none'))).toBe(true)
    expect(probed.map(p => p.split('/')[0]).sort()).toEqual([SLOE_NAME, ALDER_NAME])
  })

  test('Scan with Bluetooth: the click opens the chooser', async ({ page }) => {
    await useNearbyPrinters(page, OPEN_PRINTER)
    await mockConsole(page, [cloudPrinter('p-sloe', 'Sloe b26d', SLOE_NAME)], [])
    await mockProbe(page, [SLOE_NAME])
    await page.goto('/')
    await ready(page)

    await page.getByTestId('scan-printers').click()

    // The chooser (the fake radio) was opened by the click, and its pick is reported with the cloud result.
    await expect(page.getByTestId('scan-secure')).toContainText('Sloe')
    await expect(page.getByTestId('scan-bluetooth-found')).toContainText('Found over Bluetooth')
  })

  test('with no internet, Scan searches Bluetooth only and says why the rest was skipped', async ({ page }) => {
    await useNearbyPrinters(page, OPEN_PRINTER)
    await page.goto('/')
    await ready(page)
    await page.route(`${CONSOLE}/**`, route => route.abort('internetdisconnected'))
    await page.route('https://relay.*/**', route => route.abort('internetdisconnected'))

    await page.getByTestId('scan-printers').click()

    await expect(page.getByTestId('scan-cloud-skipped')).toContainText("Couldn't reach the Muon3D service")
    await expect(page.getByTestId('scan-bluetooth-found')).toContainText('Found over Bluetooth')
    await expect(page.getByTestId('scan-secure')).toHaveCount(0)
  })
})

test.describe('signed out, a printer beside this browser (KAN-5459)', () => {
  test.use({ signedIn: false })

  test('Scan lists a same-network printer with a certificate; Open that fails asks about muon3d.local and stays on this page until Open is chosen', async ({ page }) => {
    const probed: string[] = []
    const answering = [SLOE_NAME]
    await noBluetooth(page)
    await mockConsole(page, [], [
      { printer_id: 'p-sloe', name: 'Sloe b26d', model: 'M1', linked: true, local_addrs: ['192.168.1.20'], secure_name: SLOE_NAME },
      { printer_id: 'p-walnut', name: 'Walnut 8987', model: 'M1', linked: false, local_addrs: ['192.168.1.30'] }
    ])
    await mockProbe(page, answering, probed)
    await page.goto('/')
    await ready(page)

    await page.getByTestId('scan-printers').click()

    const secure = page.getByTestId('scan-secure')
    await expect(secure).toHaveCount(1)
    await expect(secure).toContainText('On this network (secure)')
    await expect(page.getByTestId('scan-local')).toHaveCount(0)
    expect(probed).toEqual([`${SLOE_NAME}/server/info credentials=none`])

    // The printer stops answering before the click: Auto has nothing left, so the page asks. The address does not change.
    const here = page.url()
    answering.length = 0
    await secure.getByTestId('scan-open-secure').click()
    await expect(page.getByTestId('muon-local-question')).toHaveText(
      "Can't reach your printers from here. Open muon3d.local, the offline page for printers on this network?"
    )
    expect(page.url()).toBe(here)
    await page.getByTestId('muon-local-cancel').click()
    await expect(page.getByTestId('muon-local-question')).toHaveCount(0)
    expect(page.url()).toBe(here)

    // Only Open leaves the page, and only for muon3d.local.
    await page.route('http://muon3d.local/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>offline</title>' }))
    await secure.getByTestId('scan-open-secure').click()
    await expect(page.getByTestId('muon-local-question')).toBeVisible()
    await page.getByTestId('muon-local-open').click()
    await expect(page).toHaveURL('http://muon3d.local/')
  })
})

test.describe('signed out, empty welcome', () => {
  test.use({ signedIn: false })

  test('Scan is in the welcome and says what it tried when nothing is found', async ({ page }) => {
    // A browser without Web Bluetooth (Firefox, Safari): the scan says so in one line.
    await noBluetooth(page)
    await mockConsole(page, [], [])
    await page.goto('/')
    await ready(page)

    await page.getByTestId('scan-printers').click()

    await expect(page.getByTestId('scan-empty')).toContainText('No printers found. Tried:')
    await expect(page.getByTestId('scan-empty')).toContainText('the Muon3D list of printers on this network')
    await expect(page.getByTestId('scan-bluetooth-skipped')).toContainText("can't use Bluetooth")
    // No typing: nothing here asked for an address.
    await expect(page.getByTestId('scan-results').getByRole('textbox')).toHaveCount(0)
  })
})
