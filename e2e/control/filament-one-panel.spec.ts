/**
 * One material panel (Jack, 6 and 9 Nov 2026: "Clicking the filament ring,
 * the icon, or the text opens the styled filament panel directly … Remove the
 * unstyled intermediate page."). Overview's tile, its ⋯ menu, Control's card
 * and chip, and Quick actions all open the same MaterialPicker; the old
 * "Set the filament" dialog is gone, and opening the panel sends nothing.
 */
import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'

// The photoreal M1 stalls software WebGL for seconds a frame (see overview-parts.spec.ts).
test.beforeEach(async ({ page }) => {
  if (process.platform !== 'win32') await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
})

async function isThePanel (page: Page, printer: PrinterHandle) {
  await expect(page.getByTestId('material-picker')).toBeVisible()
  await expect(page.getByTestId('material-load')).toBeVisible()
  await expect(page.getByTestId('material-unload')).toBeVisible()
  await expect(page.getByTestId('tile-dialog')).toHaveCount(0)
  await expect(page.getByText('Set the filament')).toHaveCount(0)
  await page.waitForTimeout(300)
  expect(printer.gcode).toEqual([])
}

test('Overview: a press on the filament row opens the material panel', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await page.getByTestId('filament-row').click()
  await isThePanel(page, printer)
})

for (const item of [/Set material and colour/, /Load or unload/]) {
  test(`Overview: ⋯ ${item.source.replace(/\\/g, '')} opens the same panel, on Overview`, async ({ page, open }) => {
    const printer = await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await page.getByRole('button', { name: 'More for Filament' }).click()
    await page.getByRole('menuitem', { name: item }).click()
    await expect(page).not.toHaveURL(/\/control/)
    await isThePanel(page, printer)
  })
}

test('Control: the filament row opens the same panel', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/control')
  await page.getByTestId('control-filament').getByTestId('filament-row').click()
  await isThePanel(page, printer)
})

test('Quick actions: Change filament opens the same panel', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await open('/')
  await page.getByTestId('quick-actions').first().click()
  await page.getByTestId('quick-filament').click()
  await isThePanel(page, printer)
})
