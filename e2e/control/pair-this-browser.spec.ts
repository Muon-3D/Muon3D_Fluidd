/**
 * KAN-1374, Jack 3 Nov at the printer: the panel showed System > Add a device with its
 * 8-digit code, but Control had "no button to pair... very not intuitive".
 *
 * "Pair this browser" is in a printer's options menu, linked to an account or not, whenever
 * the pairing switch is on. Choosing it opens the Bluetooth chooser if the printer has not
 * been picked yet, then the code dialog. With the switch off the item is not there.
 *
 * The radio and the wasm client are faked at their edges (e2e/fakes/blePair.ts). A set-up
 * printer that was never paired with this browser is heard nearby, so it is listed under
 * Found (not linked to anyone). Runs at desktop 1440x900 and phone 390x844.
 */
import { test, expect, ready } from '../fixtures'
import { NOT_PAIRED_HERE, PANEL_CODE, COMPARE, pairEvents, setPairingGate, useNearbyPrinters } from '../fakes/blePair'

test.use({ signedIn: false, serviceWorkers: 'block' })

const NAME = NOT_PAIRED_HERE.advertised

async function heardNearby (page: import('@playwright/test').Page) {
  await useNearbyPrinters(page, NOT_PAIRED_HERE, { advertise: true })
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await expect(page.getByTestId('found-pair-bluetooth')).toBeVisible()
}

test('Pair this browser is offered on a printer heard nearby and opens the code dialog', async ({ page, isMobile }) => {
  await heardNearby(page)
  await setPairingGate(page, true)
  // A printer heard nearby and linked to nobody lists its actions as buttons on its tile.
  await page.getByRole('button', { name: 'Pair over Bluetooth' }).click()

  const sheet = page.getByTestId('ble-sheet')
  await expect(sheet.getByTestId('pair-code-step')).toContainText('Check the code')
  await expect(sheet.getByTestId('pair-sas')).toHaveAttribute('aria-label', COMPARE.split('').join(' '))
  if (isMobile) await expect.poll(async () => (await sheet.boundingBox())!.width).toBeGreaterThan(370)
  await sheet.getByLabel('8-digit code from the printer').fill(PANEL_CODE)
  await sheet.getByTestId('pair-submit').click()
  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain(`paired ${NAME}`)
  const events = await pairEvents(page)
  expect(events).toContain(`beginPairing ${NAME}`)
  expect(events.indexOf(`submitCode ${PANEL_CODE}`)).toBeGreaterThan(events.indexOf(`beginPairing ${NAME}`))
})

test('Pair this browser is not offered while the pairing switch is off', async ({ page }) => {
  await heardNearby(page)
  await setPairingGate(page, false)
  await expect(page.getByRole('button', { name: 'Pair over Bluetooth' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pair this browser' })).toHaveCount(0)
})
