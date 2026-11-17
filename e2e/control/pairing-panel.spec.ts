import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { NOT_PAIRED_HERE, PANEL_CODE, COMPARE, answerAtPrinter, pairedHere, pairEvents, setPairingGate, useNearbyPrinters } from '../fakes/blePair'

test.use({ serviceWorkers: 'block' })

async function nearby (page: Page, approval = false) {
  await useNearbyPrinters(page, NOT_PAIRED_HERE, { advertise: true, panel: true, approval })
  await page.goto('/')
  await ready(page)
  await page.getByRole('button', { name: 'Look nearby' }).click()
  await expect(page.getByTestId('found-pair-bluetooth')).toBeVisible()
  await setPairingGate(page, true)
}

async function codeStep (page: Page) {
  await page.getByRole('button', { name: 'Pair this browser', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Check the code' })).toBeVisible()
  await expect(page.getByTestId('pair-sas')).toHaveAttribute('aria-label', COMPARE.split('').join(' '))
}

async function submit (page: Page, code = PANEL_CODE) {
  await page.getByLabel('8-digit code from the printer').fill(code)
  await page.getByRole('button', { name: 'Pair', exact: true }).click()
}

async function admitted (page: Page) {
  await expect(page.getByTestId('ble-sheet')).toBeHidden()
  await expect(page.getByRole('alert')).toContainText('let this device in.')
  expect(await pairedHere(page)).toContain(NOT_PAIRED_HERE.id)
}

test('owned printer: panel Accept pairs this browser and confirms admission', async ({ page }) => {
  await nearby(page)
  await codeStep(page)
  await submit(page)
  await expect(page.getByRole('heading', { name: 'Confirm on the printer' })).toBeVisible()
  expect(await pairedHere(page)).not.toContain(NOT_PAIRED_HERE.id)
  await answerAtPrinter(page, 'accept')
  await admitted(page)
})

test('owned printer: panel Reject says nothing was added and permits another try', async ({ page }) => {
  await nearby(page)
  await codeStep(page)
  await submit(page)
  await expect(page.getByRole('heading', { name: 'Confirm on the printer' })).toBeVisible()
  await answerAtPrinter(page, 'reject')
  await expect(page.getByText('The printer said no to this browser, so nothing was added.', { exact: true })).toBeVisible()
  expect(await pairedHere(page)).not.toContain(NOT_PAIRED_HERE.id)
  await page.getByRole('button', { name: 'Try again', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Check the code' })).toBeVisible()
})

test('wrong code does not pair and can be corrected', async ({ page }) => {
  await nearby(page)
  await codeStep(page)
  await submit(page, '87654321')
  await expect(page.getByText(/Wrong code\. 2 tries left/)).toBeVisible()
  expect(await pairedHere(page)).not.toContain(NOT_PAIRED_HERE.id)
  await submit(page)
  await expect(page.getByRole('heading', { name: 'Confirm on the printer' })).toBeVisible()
  await answerAtPrinter(page, 'accept')
  await admitted(page)
})

test('expired panel window explains how to get a new code', async ({ page }) => {
  await nearby(page)
  await codeStep(page)
  await submit(page)
  await expect(page.getByRole('heading', { name: 'Confirm on the printer' })).toBeVisible()
  await answerAtPrinter(page, 'time out')
  await expect(page.getByText(/pairing window closed after 2 minutes/)).toBeVisible()
  await expect(page.getByText(/Add a device.*try again/)).toBeVisible()
  expect(await pairedHere(page)).not.toContain(NOT_PAIRED_HERE.id)
  await expect(page.getByRole('button', { name: 'Try again', exact: true })).toBeVisible()
})

test.describe('signed in', () => {
  test.use({ signedIn: true })
  test('panel pairing keeps the account signed in', async ({ page, isMobile }) => {
    await nearby(page)
    await codeStep(page)
    await submit(page)
    await expect(page.getByRole('heading', { name: 'Confirm on the printer' })).toBeVisible()
    await answerAtPrinter(page, 'accept')
    await admitted(page)
    await page.getByTestId('approval-close').click()
    if (isMobile) await page.getByTestId('tab-more').click()
    await page.locator('[data-tid="account"]:visible').first().click()
    await expect(page.getByText('jack@example.test', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toHaveCount(0)
  })
})

for (const outcome of ['accept', 'reject', 'time out'] as const) {
  test(`connectAs approval: ${outcome}`, async ({ page }) => {
    await nearby(page, true)
    await page.getByRole('button', { name: 'Pair over Bluetooth', exact: true }).click()
    await expect(page.getByText('Waiting for approval at the printer', { exact: true })).toBeVisible()
    await expect(page.getByTestId('approval-symbols')).toHaveText(COMPARE)
    expect((await pairEvents(page)).some(line => line.startsWith('connectAs ') && line.includes('"role":"operator"'))).toBe(true)
    await answerAtPrinter(page, outcome)
    if (outcome === 'accept') {
      await expect(page.getByTestId('approval-outcome')).toContainText('let this device in')
      expect(await pairedHere(page)).toContain(NOT_PAIRED_HERE.id)
    } else {
      await expect(page.getByTestId('approval-outcome')).toContainText(outcome === 'reject' ? 'refused this device' : "Check the printer's screen, then try again.")
      expect(await pairedHere(page)).not.toContain(NOT_PAIRED_HERE.id)
    }
  })
}
