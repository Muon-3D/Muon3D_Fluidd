/**
 * Z offset and raw fan percentages are developer-mode controls (Jack, 17 Nov,
 * I-425). Outside developer mode Control shows Quiet, Normal and Turbo and no
 * Z offset nudge or fan slider; in developer mode the raw controls are there.
 * The printer reports developer mode as `muon_guard.dev_mode`.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'

const FAN_MODES = { mode: 'normal', modes: ['normal', 'quiet', 'turbo'], commanded_speed: 0.6, target_rpm: null, output_speed: 0.18 }
const MUON = ['file_manager', 'history', 'muon_protection']

async function setUp (page: Page, dev: boolean) {
  const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), { fan_modes: FAN_MODES, muon_guard: { dev_mode: dev } }), { components: MUON, database: true })
  printer.state.results['printer.gcode.help'] = { SET_PRINT_MODE: 'Select the print mode (normal, quiet, turbo)' }
  return printer
}

test.describe('Developer mode off', () => {
  test('Control has Quiet, Normal and Turbo, no raw fan slider and no Z offset', async ({ page, open }) => {
    const printer = await setUp(page, false)
    await open('/control')
    const tile = page.getByTestId('control-printmode')
    for (const mode of ['quiet', 'normal', 'turbo']) await expect(tile.getByTestId(`mode-${mode}`)).toBeVisible()
    await page.getByTestId('advanced-toggle').click()
    await expect(page.getByTestId('advanced-speed')).toBeVisible()
    await expect(page.getByTestId('advanced-fan')).toHaveCount(0)
    await expect(page.getByTestId('control-zoffset')).toHaveCount(0)
    await page.getByTestId('move-more').click()
    await expect(page.getByTestId('motors-off')).toBeVisible()
    await expect(page.getByTestId('menu-zoffset')).toHaveCount(0)
    await tile.getByTestId('mode-turbo').click()
    await expect.poll(() => printer.gcode).toEqual(['SET_PRINT_MODE MODE=turbo'])
  })

  test('Overview does not offer the Z offset widget', async ({ page, open }) => {
    await setUp(page, false)
    await open('/')
    await expect(page.locator('[data-cell="zoffset"]')).toHaveCount(0)
    await page.getByTestId('edit-open').click()
    await page.getByTestId('widget-sheet-open').click()
    await page.getByTestId('widget-search').fill('offset')
    await expect(page.getByTestId('widget-card-zoffset')).toHaveCount(0)
  })
})

test.describe('Developer mode on', () => {
  test('Control shows the raw fan slider and Z offset, and Quiet, Normal, Turbo stay', async ({ page, open }) => {
    await setUp(page, true)
    await open('/control')
    for (const mode of ['quiet', 'normal', 'turbo']) await expect(page.getByTestId(`mode-${mode}`)).toBeVisible()
    await page.getByTestId('advanced-toggle').click()
    await expect(page.getByTestId('advanced-fan')).toBeVisible()
    await page.getByTestId('move-more').click()
    await page.getByTestId('menu-zoffset').click()
    await expect(page.getByTestId('control-zoffset')).toBeVisible()
  })

  test('Overview offers the Z offset widget', async ({ page, open }) => {
    await setUp(page, true)
    await open('/')
    await page.getByTestId('edit-open').click()
    await page.getByTestId('widget-sheet-open').click()
    await page.getByTestId('widget-search').fill('offset')
    await expect(page.getByTestId('widget-card-zoffset')).toBeVisible()
  })
})
