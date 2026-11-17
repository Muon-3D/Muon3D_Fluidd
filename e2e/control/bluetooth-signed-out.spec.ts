/**
 * KAN-2123, Jack 11 Nov (review of :8097): "No Bluetooth pair option when NOT
 * signed in; signed in, it only works for already-paired printers. Must allow
 * pairing new printers, signed out too."
 *
 * Nobody is signed in (no Muon3D account). A printer is nearby over Bluetooth
 * and the person uses the real buttons:
 * - one that has never been set up: Connect over Bluetooth opens the Bluetooth
 *   sheet on its code check, and "They match" goes on to its setup;
 * - one that is set up and was never paired with this browser: the sheet says
 *   so and offers Pair over Bluetooth; the code is checked, the eight digits
 *   typed, and the printer opens;
 * - one this browser was paired with before: Pair over Bluetooth opens it with
 *   no code at all.
 * Nothing asks to sign in at any point.
 *
 * The radio and the wasm client are faked at their edges (e2e/fakes/blePair.ts);
 * Control's own code does the rest. Runs at desktop 1440x900 and phone 390x844.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { COMPARE, NEW_PRINTER, NOT_PAIRED_HERE, PAIRED_BEFORE, PANEL_CODE, pairEvents, useNearbyPrinters, type NearbyFake } from '../fakes/blePair'

// The page's service worker answers its fetches itself, past page.route.
test.use({ signedIn: false, serviceWorkers: 'block' })

/** Nobody was asked to sign in: no sign-in form anywhere on the page. */
async function expectNeverAskedToSignIn (page: Page) {
  await expect(page.getByLabel('Password')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Sign in', exact: true }).and(page.locator('form button, [role=dialog] button'))).toHaveCount(0)
}

/**
 * Nobody has a printer yet, so All printers is the welcome page: the person
 * presses Look nearby, picks the printer in Chrome's Bluetooth chooser, and
 * presses what its tile offers.
 */
async function lookNearby (page: Page, printer: NearbyFake, advertise = false) {
  await useNearbyPrinters(page, printer, { advertise })
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await expect.poll(async () => (await page.evaluate(() => (window as any).__bluetoothAsks)).length).toBe(1)
  if (!advertise) await page.getByTestId('found-set-up').click()
}

test('a printer that has never been set up opens the Bluetooth sheet and its code check, signed out', async ({ page, isMobile }) => {
  await lookNearby(page, NEW_PRINTER)
  const sheet = page.getByTestId('ble-sheet')
  await expect(sheet).toBeVisible()
  await expect(sheet.getByTestId('ble-sheet-step')).toHaveText('Step 1 of 3')
  await expect(sheet.getByTestId('setup-ble-compare')).toContainText('Check the code')
  await expect(sheet.getByTestId('ble-sas')).toHaveAttribute('aria-label', COMPARE.split('').join(' '))
  if (isMobile) await expect.poll(async () => (await sheet.boundingBox())!.width).toBeGreaterThan(370)
  await expectNeverAskedToSignIn(page)

  await sheet.getByTestId('ble-sas-match').click()
  await expect(sheet.getByTestId('setup-ble-steps')).toBeVisible()
  await expect(sheet.getByTestId('ble-sheet-step')).toHaveText('Step 2 of 3')
  await expectNeverAskedToSignIn(page)
})

test('a printer that is set up and was never paired here is paired over Bluetooth, signed out, and opens', async ({ page, isMobile }) => {
  await lookNearby(page, NOT_PAIRED_HERE)
  const setup = page.getByTestId('setup-ble-failed')
  await expect(setup).toContainText('is set up already')
  await expect(setup.getByTestId('ble-pair-instead')).toHaveText('Pair over Bluetooth')
  await expectNeverAskedToSignIn(page)

  await setup.getByTestId('ble-pair-instead').click()
  const sheet = page.getByTestId('ble-sheet')
  await expect(sheet.getByTestId('pair-code-step')).toContainText('Check the code')
  await expect(sheet.getByTestId('ble-sheet-step')).toHaveText('Step 2 of 2')
  await expect(sheet.getByTestId('pair-sas')).toHaveAttribute('aria-label', COMPARE.split('').join(' '))
  if (isMobile) await expect.poll(async () => (await sheet.boundingBox())!.width).toBeGreaterThan(370)
  await expectNeverAskedToSignIn(page)

  // A wrong code is turned away with the tries left; the right one pairs.
  await sheet.getByLabel('8-digit code from the printer').fill('87654321')
  await sheet.getByTestId('pair-submit').click()
  await expect(sheet.getByTestId('pair-message')).toContainText('Wrong code. 2 tries left')
  await sheet.getByLabel('8-digit code from the printer').fill(PANEL_CODE)
  await sheet.getByTestId('pair-submit').click()

  // Paired: the sheet is gone and the printer has opened over Bluetooth.
  await expect(sheet).toBeHidden({ timeout: 30_000 })
  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain('connect muon-sloe-5522')
  const events = await pairEvents(page)
  expect(events.indexOf('beginPairing muon-sloe-5522')).toBeGreaterThan(events.indexOf('refused muon-sloe-5522'))
  expect(events.indexOf('paired muon-sloe-5522')).toBeGreaterThan(events.indexOf('submitCode 12345678'))
  expect(events.indexOf('connect muon-sloe-5522')).toBeGreaterThan(events.indexOf('paired muon-sloe-5522'))
  await expect(page.getByTestId('pair-failed')).toBeHidden()
  // And the person is on the printer's own page, not left on the list.
  await expect(page).toHaveURL(/\/sloe-5522(\/|$)/)
  await expect(page.getByTestId('printers-summary')).toHaveCount(0)
  await expectNeverAskedToSignIn(page)
  await page.screenshot({ path: `test-results/ble-signed-out-paired-${isMobile ? 'phone' : 'desktop'}.png` })
})

test('a printer this browser was paired with before opens from Pair over Bluetooth with no code, signed out', async ({ page }) => {
  await lookNearby(page, PAIRED_BEFORE)
  const setup = page.getByTestId('setup-ble-failed')
  await expect(setup.getByTestId('ble-pair-instead')).toBeVisible()
  await setup.getByTestId('ble-pair-instead').click()

  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain('connect muon-boxwood-367a')
  await expect(page.getByTestId('ble-sheet')).toBeHidden()
  const events = await pairEvents(page)
  expect(events.some(e => e.startsWith('beginPairing') || e.startsWith('refused'))).toBe(false)
  await expect(page.getByTestId('pair-code-step')).toHaveCount(0)
  await expect(page).toHaveURL(/\/boxwood-367a(\/|$)/)
  await expect(page.getByTestId('printers-summary')).toHaveCount(0)
  await expectNeverAskedToSignIn(page)
})

test('a set-up printer heard nearby is paired from its tile: Pair over Bluetooth, and a reload stays on its page', async ({ page, isMobile }) => {
  // The printer advertises that it is set up, so its tile offers Pair over Bluetooth itself.
  await lookNearby(page, NOT_PAIRED_HERE, true)
  const pair = page.getByTestId('found-pair-bluetooth')
  await expect(pair).toHaveText('Pair over Bluetooth')
  await expect(page.getByTestId('found-set-up')).toHaveCount(0)
  await pair.click()

  const sheet = page.getByTestId('ble-sheet')
  await expect(sheet.getByTestId('pair-code-step')).toContainText('Check the code')
  if (isMobile) await expect.poll(async () => (await sheet.boundingBox())!.width).toBeGreaterThan(370)
  await sheet.getByLabel('8-digit code from the printer').fill(PANEL_CODE)
  await sheet.getByTestId('pair-submit').click()
  await expect(sheet).toBeHidden({ timeout: 30_000 })
  await expect(page).toHaveURL(/\/sloe-5522(\/|$)/)
  await expect(page.getByTestId('printers-summary')).toHaveCount(0)
  await expectNeverAskedToSignIn(page)

  // No account knows this printer: its name must outlive a reload, or its page address leads nowhere.
  await page.reload()
  await ready(page)
  await expect(page).toHaveURL(/\/sloe-5522(\/|$)/)
  await expect(page.getByText('linked to another account')).toHaveCount(0)
  await expect(page.getByText(/No printer called/)).toHaveCount(0)
})
