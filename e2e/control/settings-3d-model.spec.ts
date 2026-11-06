/**
 * Settings › G-code preview: the 3D model's detail, whether the printer's
 * 3D model shows at all, and whether it animates (by default, as the
 * system's reduce-motion says). Each is saved to Moonraker's database, is
 * there after a reload, and the Overview's model follows it.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { PRESETS, usePrinter, type PrinterHandle } from './printer'

const KEY = 'uiSettings.gcodePreview'

async function openPreviewSettings (page: Page, open: (path: string) => Promise<void>) {
  await open('/settings#gcodePreview')
  await expect(page.getByTestId('model-detail')).toBeVisible()
}

/** The last value this page saved for a G-code preview setting. */
function saved (printer: PrinterHandle, setting: string): unknown {
  return printer.called('server.database.post_item').filter(p => p.namespace === 'fluidd' && p.key === `${KEY}.${setting}`).at(-1)?.value
}

const stage = (page: Page) => page.getByTestId('m1-live')
const showModel = (page: Page) => page.getByRole('switch', { name: "Show the printer's 3D model" })
const animations = (page: Page) => page.getByRole('switch', { name: 'Animations', exact: true })

test('the three settings are in G-code preview, at their defaults: High, shown, animating', async ({ page, open }) => {
  await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await openPreviewSettings(page, open)
  await expect(page.getByTestId('model-detail-high')).toHaveClass(/v-btn--active/)
  await expect(showModel(page)).toBeChecked()
  await expect(animations(page)).toBeChecked()
  await expect(page.getByText("until set, it follows your system's reduce-motion choice (full)")).toBeVisible()
})

test('detail Low is saved, is there after a reload, and the Overview model draws at it', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await openPreviewSettings(page, open)
  await page.getByTestId('model-detail-low').click()
  await expect(page.getByTestId('model-detail-low')).toHaveClass(/v-btn--active/)
  await expect.poll(() => saved(printer, 'modelDetail')).toBe('low')

  await page.reload()
  await expect(page.getByTestId('model-detail-low')).toHaveClass(/v-btn--active/, { timeout: 60_000 })

  await open('/')
  await expect(stage(page)).toHaveAttribute('data-detail', 'low')
})

test('the printer\'s 3D model turned off is saved, and the Overview shows its picture instead', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-model', 'on')

  await openPreviewSettings(page, open)
  await showModel(page).click({ force: true })
  await expect(showModel(page)).not.toBeChecked()
  await expect.poll(() => saved(printer, 'showPrinterModel')).toBe(false)

  await page.reload()
  await expect(showModel(page)).not.toBeChecked({ timeout: 60_000 })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-model', 'off')
  await expect(stage(page)).toHaveAttribute('data-live', 'off')
  await expect(stage(page).locator('.m1-live__slot')).toHaveCount(0)
  await expect(page.getByTestId('overview-stage')).toBeVisible()

  // And on again.
  await openPreviewSettings(page, open)
  await showModel(page).click({ force: true })
  await expect.poll(() => saved(printer, 'showPrinterModel')).toBe(true)
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-model', 'on')
})

test('with reduce motion set the model doesn\'t animate until animations are turned on, which is saved', async ({ page, open }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-animations', 'off')

  await openPreviewSettings(page, open)
  await expect(animations(page)).not.toBeChecked()
  await expect(page.getByText("reduce-motion choice (reduced)")).toBeVisible()
  await animations(page).click({ force: true })
  await expect(animations(page)).toBeChecked()
  await expect.poll(() => saved(printer, 'modelAnimations')).toBe(true)

  await page.reload()
  await expect(animations(page)).toBeChecked({ timeout: 60_000 })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-animations', 'on')
})

test('animations turned off are saved, and the model stops animating with full motion too', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await openPreviewSettings(page, open)
  await animations(page).click({ force: true })
  await expect.poll(() => saved(printer, 'modelAnimations')).toBe(false)
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-animations', 'off')
})

test('error: a setting Moonraker won\'t save stays as chosen on this page, and comes back after a reload', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  printer.state.failOn['server.database.post_item'] = 'Database is read-only'
  await openPreviewSettings(page, open)
  await page.getByTestId('model-detail-medium').click()
  await expect(page.getByTestId('model-detail-medium')).toHaveClass(/v-btn--active/)
  await expect.poll(() => printer.called('server.database.post_item').some(p => p.key === `${KEY}.modelDetail`)).toBe(true)
  expect(printer.database.fluidd?.uiSettings).toBeUndefined()

  delete printer.state.failOn['server.database.post_item']
  await page.reload()
  await expect(page.getByTestId('model-detail-high')).toHaveClass(/v-btn--active/, { timeout: 60_000 })
})

test('offline: with the printer gone, the Overview model stops drawing live, and nothing is saved', async ({ page, open }) => {
  const printer = await usePrinter(page, PRESETS.idleHomed(), { database: true })
  await open('/')
  await expect(stage(page)).toHaveAttribute('data-model', 'on')
  printer.disconnect()
  await expect(page.getByText('Reconnecting', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(stage(page)).toHaveAttribute('data-live', 'off')
  expect(printer.called('server.database.post_item').filter(p => String(p.key).startsWith(KEY))).toEqual([])
})
