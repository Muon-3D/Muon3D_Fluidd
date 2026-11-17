/**
 * KAN-3823, Jack's ruling D-166: "the printer should be open by default.
 * Anybody should be able to pair to the printer through bluetooth, with any
 * device... If someone wants to lock their printer down... they should be
 * allowed to!"
 *
 * - An Open printer (`GET /pairing` says `entry: "open"`) admits a stranger over
 *   Bluetooth: Control connects and lands in the printer, with no code step and
 *   no instruction to open "Add a device" on the printer.
 * - A protected printer keeps the code step, worded without that instruction.
 * - A printer whose answer has no `entry` is protected: a missing field is
 *   never read as open.
 *
 * The radio and the wasm client are faked at their edges (e2e/fakes/blePair.ts).
 * Nobody is signed in. Runs at desktop 1440x900 and phone 390x844.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { NOT_PAIRED_HERE, OPEN_PRINTER, PANEL_CODE, PROTECTED_PRINTER, answerAtPrinter, pairEvents, setPairingGate, useNearbyPrinters, type NearbyFake } from '../fakes/blePair'

test.use({ signedIn: false, serviceWorkers: 'block' })

async function nearby (page: Page, printer: NearbyFake, panel = false) {
  await useNearbyPrinters(page, printer, { advertise: true, panel })
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await expect(page.getByTestId('found-pair-bluetooth')).toBeVisible()
  await setPairingGate(page, true)
}

const noAddADevice = (page: Page) => expect(page.locator('body')).not.toContainText('Add a device')

test('an Open printer lets a stranger in over Bluetooth with no code and no Add a device', async ({ page }) => {
  await nearby(page, OPEN_PRINTER)
  await noAddADevice(page)
  await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()

  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain(`connect ${OPEN_PRINTER.advertised}`)
  await expect(page).toHaveURL(/\/alder-6601(\/|$)/)
  await expect(page.getByTestId('pair-code-step')).toHaveCount(0)
  await expect(page.getByTestId('pair-connecting')).toHaveCount(0)
  await expect(page.getByLabel('8-digit code from the printer')).toHaveCount(0)
  await expect(page.getByTestId('approval-symbols')).toHaveCount(0)
  const events = await pairEvents(page)
  expect(events.some(e => e.startsWith('beginPairing') || e.startsWith('refused') || e.startsWith('submitCode'))).toBe(false)
  await noAddADevice(page)
})

test('a protected printer keeps the code step, with no Add a device instruction', async ({ page }) => {
  await nearby(page, PROTECTED_PRINTER)
  await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  const step = page.getByTestId('pair-code-step')
  await expect(step).toBeVisible()
  await expect(step).toContainText('is locked')
  await expect(step).toContainText('Ask its owner to share it with you')
  await expect(page.getByLabel('8-digit code from the printer')).toBeVisible()
  await noAddADevice(page)
})

test('a printer whose answer has no entry is treated as protected, never as open', async ({ page }) => {
  expect(NOT_PAIRED_HERE.entry).toBeUndefined()
  await nearby(page, NOT_PAIRED_HERE)
  await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  await expect(page.getByTestId('pair-code-step')).toBeVisible()
  await expect(page.getByTestId('pair-code-step')).toContainText('is locked')
  const events = await pairEvents(page)
  expect(events).toContain(`refused ${NOT_PAIRED_HERE.advertised}`)
  expect(events).toContain(`beginPairing ${NOT_PAIRED_HERE.advertised}`)
  await noAddADevice(page)
})

test('a printer its owner opened while the code step was up lets the person in on Try again, with no code', async ({ page }) => {
  await nearby(page, PROTECTED_PRINTER, true)
  await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
  await expect(page.getByTestId('pair-code-step')).toBeVisible()
  await page.getByLabel('8-digit code from the printer').fill(PANEL_CODE)
  await page.getByRole('button', { name: 'Pair', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Confirm on the printer' })).toBeVisible()
  await answerAtPrinter(page, 'time out')
  await expect(page.getByTestId('pair-failed')).toBeVisible()
  await noAddADevice(page)

  // The owner opens the printer: it now says entry "open".
  await page.evaluate(id => { (window as any).__e2ePair.printers.find((p: any) => p.id === id).entry = 'open' }, PROTECTED_PRINTER.id)
  await page.getByTestId('pair-retry').click()

  await expect.poll(() => pairEvents(page), { timeout: 30_000 }).toContain(`connect ${PROTECTED_PRINTER.advertised}`)
  await expect(page).toHaveURL(/\/birch-7702(\/|$)/)
  await expect(page.getByTestId('pair-code-step')).toHaveCount(0)
  await noAddADevice(page)
})
