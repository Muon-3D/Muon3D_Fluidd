/**
 * The Bluetooth sheet (v3 `bluetooth` storyboard): one sheet over All
 * printers, full width on a phone, "Step n of N" and dots on top, each step
 * the setup step's layout.
 *
 * No radio here: the steps are driven through the same reactive state the
 * Bluetooth services keep (Vite serves each module once, so the page's copy
 * is the app's), and nothing is sent to a printer.
 */
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'

async function openPrinters (page: Page) {
  await page.goto('/')
  await ready(page)
}

/** Sets the pairing state the pairing sheet draws from. */
async function pairing (page: Page, patch: Record<string, unknown>) {
  await page.evaluate(async (p) => {
    const m = await import('/src/services/muon-ble/pairing.ts' as string)
    Object.assign(m.pairingState, p)
  }, patch)
}

/** Opens the setup sheet on All printers for a printer heard nearby, then sets where it is. */
async function setupSheet (page: Page, patch: { phase?: string, code?: string, fixture?: string }) {
  // The printer's setup state, as a printer answers it, from the unit-test fixtures; nothing leaves the page.
  const fixture = patch.fixture
    ? JSON.parse(readFileSync(new URL(`../../src/services/muon-setup/__tests__/fixtures/${patch.fixture}.json`, import.meta.url), 'utf8'))
    : null
  await page.evaluate(async ({ p, fixture }) => {
    const page = (document.querySelector('.printers') as any).__vue__
    if (!page.setupDialog) {
      page.setupPrinter = { display: 'Hazel · 8987', localName: 'Muon3D-8987', device: {}, advert: null }
      page.setupDialog = true
      await page.$nextTick()
    }
    const find = (vm: any): any => vm.$options.name === 'BluetoothSetupDialog' ? vm : vm.$children.map(find).find(Boolean)
    const sheet = find(page)
    // Whatever the real connection says (there is no radio here) is dropped as late.
    sheet.attempt++
    const state = await import('/src/services/muon-setup/state.ts' as string)
    if (fixture) {
      state.applyState(fixture, { fromGet: true })
      if (!sheet.client) {
        const { createSetupClient } = await import('/src/services/muon-setup/client.ts' as string)
        const answer = () => new Response(JSON.stringify({ result: state.setupState.state }), { status: 200, headers: { 'content-type': 'application/json' } })
        sheet.client = createSetupClient({ transport: { fetch: async () => answer() }, overBluetooth: true })
      }
    }
    if (p.phase) sheet.phase = p.phase
    if (p.code) sheet.code = p.code
  }, { p: patch, fixture })
}

test.describe('pairing this browser', () => {
  test('finding the printer is step 1, the code and the eight digits step 2', async ({ page, isMobile }) => {
    await openPrinters(page)
    await pairing(page, { printerId: 'boxwood', phase: 'connecting' })
    const sheet = page.getByTestId('ble-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByTestId('ble-sheet-step')).toHaveText('Step 1 of 2')
    await expect(sheet.getByTestId('pair-connecting')).toContainText('Find your printer')
    await expect(sheet.getByTestId('ble-printer-row')).toBeVisible()
    // Over All printers, not a page of its own.
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('.printers')).toBeAttached()
    if (isMobile) {
      const box = await sheet.boundingBox()
      expect(box!.width).toBeGreaterThan(370)
    }
    await page.screenshot({ path: `test-results/ble-pair-find-${isMobile ? 'phone' : 'desktop'}.png` })

    await pairing(page, { phase: 'code', comparison: 'F6QTDH' })
    await expect(sheet.getByTestId('ble-sheet-step')).toHaveText('Step 2 of 2')
    await expect(sheet.getByTestId('pair-code-step')).toContainText('Check the code')
    await expect(sheet.getByTestId('pair-code')).toBeVisible()
    await page.screenshot({ path: `test-results/ble-pair-code-${isMobile ? 'phone' : 'desktop'}.png` })

    await pairing(page, { phase: 'idle', printerId: null, comparison: null })
    await expect(sheet).toBeHidden()
  })
})

test.describe('setting a printer up over Bluetooth', () => {
  test('find and check is step 1 of 3, Wi-Fi step 2, set up step 3', async ({ page, isMobile }) => {
    await openPrinters(page)
    await setupSheet(page, {})
    const sheet = page.getByTestId('ble-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByTestId('ble-sheet-step')).toHaveText('Step 1 of 3')
    await expect(sheet.getByTestId('ble-sheet-dots').locator('i')).toHaveCount(3)

    await setupSheet(page, { phase: 'compare', code: 'F6QTDH' })
    await expect(sheet.getByTestId('ble-sheet-step')).toHaveText('Step 1 of 3')
    await expect(sheet.getByTestId('ble-sas')).toHaveAttribute('aria-label', 'F 6 Q T D H')
    if (isMobile) {
      const box = await sheet.boundingBox()
      expect(box!.width).toBeGreaterThan(370)
    }
    await page.screenshot({ path: `test-results/ble-setup-code-${isMobile ? 'phone' : 'desktop'}.png` })

    await setupSheet(page, { phase: 'setup', fixture: 'state.01-new' })
    await expect(sheet.getByTestId('ble-sheet-step')).toHaveText('Step 2 of 3')
    await expect(sheet.getByTestId('setup-ble-steps')).toBeVisible()
    await page.screenshot({ path: `test-results/ble-setup-wifi-${isMobile ? 'phone' : 'desktop'}.png` })

    await setupSheet(page, { fixture: 'state.08-complete-with-skips' })
    await expect(sheet.getByTestId('ble-sheet-step')).toHaveText('Step 3 of 3')
    await page.screenshot({ path: `test-results/ble-setup-ready-${isMobile ? 'phone' : 'desktop'}.png` })
  })
})
