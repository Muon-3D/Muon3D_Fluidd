/**
 * Settings › G-code preview and 3D, the G-code preview group, as the
 * storyboard lays it out: open on print start, follow the head, travel moves,
 * retractions, plate and origin, line thickness and flip, saved on the
 * printer. The one-file options (bounding box, minimum layer height) are in
 * the preview's own Show ··· menu. And the one Animations switch covers the
 * whole app, not just the model.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../../fixtures'
import { PRESETS, usePrinter, type PrinterHandle } from '../printer'

const GCODE = [
  ';FLAVOR:Klipper',
  'G28',
  'G1 Z0.2 F600',
  'G1 X10 Y10 F6000',
  'G1 X40 Y10 E2 F1800',
  'G1 E1.2 F2400',
  'G1 Z0.4 F600',
  'G1 E2 F2400',
  'G1 X10 Y40 E4 F1800',
  ''
].join('\n')

async function settingsPrinter (page: Page): Promise<PrinterHandle> {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await page.route('**/server/files/gcodes/**', route => route.fulfill({ status: 200, contentType: 'text/plain', body: GCODE }))
  return printer
}

async function openSettings (page: Page, open: (path: string) => Promise<void>) {
  await open('/settings#gcodePreview')
  await expect(page.getByTestId('gcode-preview-settings')).toBeVisible()
}

/** What the page wrote for `key` under uiSettings.gcodePreview. */
const saved = (printer: PrinterHandle, key: string) => printer.called('server.database.post_item')
  .filter(p => p.namespace === 'fluidd' && p.key === `uiSettings.gcodePreview.${key}`)
  .map(p => p.value)

const sw = (page: Page, name: string) => page.getByTestId('gcode-preview-settings').getByRole('switch', { name, exact: true })

async function openFile (page: Page) {
  await page.getByTestId('preview-empty').getByTestId('preview-open').click()
  await page.getByTestId('preview-open-list').locator('[data-file="calibration_cube.gcode"]').click()
  await expect(page.getByTestId('preview-layer-pill')).toBeVisible()
}

test('the storyboard\'s rows, in order, at their defaults', async ({ page, open }) => {
  await settingsPrinter(page)
  await openSettings(page, open)
  const card = page.getByTestId('gcode-preview-settings')
  const titles = await card.locator('.sc-label').evaluateAll(els => els.map(e => (e.childNodes[0]?.textContent ?? '').trim()))
  expect(titles).toEqual([
    'Open the preview when a print starts',
    'Follow the head while printing',
    'Show travel moves',
    'Show retractions',
    'Retraction marker size',
    'Draw the plate and origin',
    'Line thickness',
    'Flip',
    expect.any(String)
  ])
  await expect(sw(page, 'Open the preview when a print starts')).not.toBeChecked()
  await expect(sw(page, 'Follow the head while printing')).toBeChecked()
  await expect(sw(page, 'Show travel moves')).toBeChecked()
  await expect(sw(page, 'Show retractions')).toBeChecked()
  await expect(page.getByTestId('preview-draw-plate')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('preview-draw-origin')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('preview-flip-vertical')).toHaveText(/↕ on/)
  await expect(page.getByTestId('preview-flip-horizontal')).toHaveText(/↔ off/)
  await expect(page.getByTestId('preview-one-file-note')).toContainText("preview's own ··· menu")
})

test('travel moves off is saved on the printer, kept after a reload, and a preview opens without them', async ({ page, open }) => {
  const printer = await settingsPrinter(page)
  await openSettings(page, open)
  await sw(page, 'Show travel moves').click({ force: true })
  await expect(sw(page, 'Show travel moves')).not.toBeChecked()
  await expect.poll(() => saved(printer, 'showMoves')).toEqual([false])

  await page.reload()
  await expect(sw(page, 'Show travel moves')).not.toBeChecked({ timeout: 60_000 })

  await open('/preview')
  await openFile(page)
  await expect(page.getByTestId('preview-show').getByRole('switch', { name: 'Travel moves' })).not.toBeChecked()
  await expect(page.getByTestId('preview-legend')).not.toContainText('Travel moves')
  await expect(page.getByTestId('preview-legend')).toContainText('Retractions')
})

test('retractions off hides its marker size; on a phone too only shows once Open on print start is on', async ({ page, open }) => {
  const printer = await settingsPrinter(page)
  await openSettings(page, open)
  await expect(page.getByTestId('preview-retraction-size')).toBeVisible()
  await sw(page, 'Show retractions').click({ force: true })
  await expect(page.getByTestId('preview-retraction-size')).toHaveCount(0)
  await expect.poll(() => saved(printer, 'showRetractions')).toEqual([false])

  await expect(page.getByTestId('preview-auto-open-phone')).toHaveCount(0)
  await sw(page, 'Open the preview when a print starts').click({ force: true })
  await expect(page.getByTestId('preview-auto-open-phone')).toBeVisible()
  await expect.poll(() => saved(printer, 'autoLoadOnPrintStart')).toEqual([true])
})

test('plate, origin, flip and line thickness are saved, and Reset puts them back', async ({ page, open }) => {
  const printer = await settingsPrinter(page)
  await openSettings(page, open)
  await page.getByTestId('preview-draw-plate').click()
  await expect(page.getByTestId('preview-draw-plate')).toHaveAttribute('aria-pressed', 'false')
  await page.getByTestId('preview-flip-horizontal').click()
  await expect(page.getByTestId('preview-flip-horizontal')).toHaveText(/↔ on/)
  await page.getByTestId('preview-travel-width').fill('0.25')
  await page.getByTestId('preview-travel-width').press('Enter')
  await expect.poll(() => saved(printer, 'drawBackground')).toEqual([false])
  await expect.poll(() => saved(printer, 'flip.horizontal')).toEqual([true])
  await expect.poll(() => saved(printer, 'moveLineWidth')).toEqual([0.25])

  await page.reload()
  await expect(page.getByTestId('preview-flip-horizontal')).toHaveText(/↔ on/, { timeout: 60_000 })
  await expect(page.getByTestId('preview-draw-plate')).toHaveAttribute('aria-pressed', 'false')

  await page.getByTestId('preview-settings-reset').click()
  await expect(page.getByTestId('preview-flip-horizontal')).toHaveText(/↔ off/)
  await expect(page.getByTestId('preview-draw-plate')).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => printer.called('server.database.post_item').some(p => p.key === 'uiSettings.gcodePreview')).toBe(true)
})

test('the preview\'s Show ··· menu has the bounding box and minimum layer height, saved on the printer', async ({ page, open }) => {
  const printer = await settingsPrinter(page)
  await open('/preview')
  await openFile(page)
  await page.getByTestId('preview-show-more').click()
  const menu = page.getByTestId('preview-show-menu')
  await menu.getByRole('switch', { name: 'Hide the bounding box' }).click()
  await expect.poll(() => saved(printer, 'hideSinglePartBoundingBox')).toEqual([true])

  const input = menu.getByTestId('preview-min-layer-input')
  await expect(input).toHaveValue('0.1')
  // Under 0.1 mm isn't taken.
  await input.fill('0.02')
  await input.press('Enter')
  await input.blur()
  await input.fill('0.2')
  await input.press('Enter')
  await input.blur()
  await expect.poll(() => saved(printer, 'minLayerHeight')).toEqual([0.2])
})

test('offline: the settings keep their view, held still, and nothing is saved', async ({ page, open }) => {
  const printer = await settingsPrinter(page)
  await openSettings(page, open)
  const writes = printer.called('server.database.post_item').length
  await printer.offline()
  await expect(page.getByText('Reconnecting', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('[inert]').getByTestId('gcode-preview-settings')).toBeVisible()
  expect(printer.called('server.database.post_item')).toHaveLength(writes)
})

test.describe('one Animations switch for the whole app', () => {
  const still = (page: Page) => page.evaluate(() => document.documentElement.classList.contains('m3d-reduced-motion'))
  /** What a transitioning element in the app is allowed to animate. */
  const transitions = (page: Page) => page.evaluate(() => getComputedStyle(document.querySelector('.v-application .v-btn') as Element).transitionProperty)

  test('Off holds the whole app still: only fades are left, and it\'s kept after a reload', async ({ page, open }) => {
    await settingsPrinter(page)
    await openSettings(page, open)
    expect(await still(page)).toBe(false)
    expect(await transitions(page)).not.toBe('opacity')

    await page.getByTestId('model-animations-off').click()
    await expect.poll(() => still(page)).toBe(true)
    expect(await transitions(page)).toBe('opacity')

    await page.reload()
    await expect(page.getByTestId('gcode-preview-settings')).toBeVisible({ timeout: 60_000 })
    expect(await still(page)).toBe(true)
  })

  test('with reduce motion set, Like this device is still and On moves again', async ({ page, open }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await settingsPrinter(page)
    await openSettings(page, open)
    expect(await still(page)).toBe(true)
    await page.getByTestId('model-animations-on').click()
    await expect.poll(() => still(page)).toBe(false)
    await page.getByTestId('model-animations-device').click()
    await expect.poll(() => still(page)).toBe(true)
  })
})
