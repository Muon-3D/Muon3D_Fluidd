/**
 * G-code preview: the canvas first, the layer slider under it, the Show tile
 * beside it (under it, on a phone), the header's Open another and Print
 * this, and the empty, error and offline states.
 *
 * The G-code itself is served per test by a route, so nothing here changes
 * what the shared mock tells other tests.
 */
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS, type PrinterHandle } from './printer'
import type { Page } from '@playwright/test'

const GCODE = [
  ';FLAVOR:Klipper',
  'G28',
  'G1 Z0.2 F600',
  'G1 X10 Y10 F6000',
  'G1 X40 Y10 E2 F1800',
  'G1 X40 Y40 E4',
  'G1 E3.2 F2400',
  'G1 Z0.4 F600',
  'G1 E4 F2400',
  'G1 X10 Y40 E6 F1800',
  'G1 X10 Y10 E8',
  'G1 Z0.6 F600',
  'G1 X40 Y10 E10 F1800',
  'G1 X40 Y40 E12',
  ''
].join('\n')

async function previewPrinter (page: Page, served: { fail?: boolean } = {}): Promise<PrinterHandle> {
  const printer = await usePrinter(page, PRESETS.idleHomed())
  await page.route('**/server/files/gcodes/**', route => served.fail
    ? route.fulfill({ status: 500, body: 'no' })
    : route.fulfill({ status: 200, contentType: 'text/plain', body: GCODE }))
  return printer
}

async function openFile (page: Page, name = 'calibration_cube.gcode') {
  await page.getByTestId('preview-empty').getByTestId('preview-open').click()
  await page.getByTestId('preview-open-list').locator(`[data-file="${name}"]`).click()
}

test('Jobs\' ··· opens the preview, and a file opened there draws on the canvas with the layer slider under it', async ({ page, open }, testInfo) => {
  const phone = testInfo.project.name === 'phone'
  await previewPrinter(page)
  await open('/jobs')
  await page.getByTestId('jobs-more').click()
  await page.getByTestId('jobs-more-preview').click()
  await expect(page.getByTestId('preview-empty')).toContainText('Nothing loaded')
  await expect(page.getByTestId('page-title')).toHaveText('G-code preview')

  await openFile(page)
  await expect(page.getByTestId('preview-layer-pill')).toContainText(/Layer \d+ of 3 · Z/)
  await expect(page.getByTestId('page-title')).toHaveText('calibration_cube')
  await expect(page.locator('.app-page-header__subtitle')).toContainText('G-code preview · ')
  await expect(page.locator('.app-page-header__subtitle')).toContainText('3 layers')

  const canvas = await page.getByTestId('preview-canvas').boundingBox()
  const show = await page.getByTestId('preview-show').boundingBox()
  const layer = await page.getByTestId('preview-layer').boundingBox()
  expect(canvas && show && layer).toBeTruthy()
  // The slider is under the drawing, in the canvas tile.
  expect(layer!.y).toBeGreaterThan(canvas!.y + 200)
  if (phone) {
    expect(show!.y).toBeGreaterThanOrEqual(canvas!.y + canvas!.height)
    expect(Math.round(show!.width)).toBe(Math.round(canvas!.width))
  } else {
    expect(show!.x).toBeGreaterThanOrEqual(canvas!.x + canvas!.width)
    expect(canvas!.width).toBeGreaterThan(show!.width * 2.5)
  }
})

test('the Show tile turns travel moves on, and shows only the current layer', async ({ page, open }) => {
  await previewPrinter(page)
  await open('/preview')
  await openFile(page)
  const show = page.getByTestId('preview-show')
  await expect(show.getByTestId('preview-legend')).toContainText('Travel moves')
  await show.getByRole('switch', { name: 'Travel moves' }).click()
  await expect(show.getByTestId('preview-legend')).not.toContainText('Travel moves')
  await show.getByRole('switch', { name: 'Travel moves' }).click()
  await expect(show.getByTestId('preview-legend')).toContainText('Travel moves')
  await expect(show.getByRole('switch', { name: 'Follow the nozzle' })).toBeDisabled()
  await expect(show.getByTestId('preview-legend')).not.toContainText('Layers below and above')
  await show.getByRole('switch', { name: 'Only current layer' }).click()
  await expect(show.getByTestId('preview-legend')).toContainText('Layers below and above')
  // What's left of what's drawn, and Unload, are in the tile's ···.
  await show.getByTestId('preview-show-more').click()
  await page.getByTestId('preview-unload').click()
  await expect(page.getByTestId('preview-empty')).toBeVisible()
})

test('Print this asks first, then starts the file on the printer', async ({ page, open }) => {
  const printer = await previewPrinter(page)
  await open('/preview')
  await openFile(page, 'fan_duct_v3.gcode')
  await expect(page.getByTestId('preview-layer-pill')).toBeVisible()
  await page.getByTestId('preview-print').click()
  await page.getByTestId('confirm-plate').check()
  await page.getByRole('button', { name: 'Print now' }).click()
  await expect.poll(() => printer.called('printer.print.start')).toEqual([{ filename: 'fan_duct_v3.gcode' }])
})

test('the header\'s back chevron goes to Jobs, and Open another loads another file', async ({ page, open }, testInfo) => {
  await previewPrinter(page)
  await open('/preview')
  await openFile(page)
  await expect(page.getByTestId('page-title')).toHaveText('calibration_cube')
  if (testInfo.project.name === 'phone') {
    await page.getByTestId('preview-show-more').click()
    await page.getByTestId('preview-show-open').click()
  } else {
    await page.getByTestId('preview-open-another').click()
  }
  await page.locator('[data-tid="preview-open-list"]:visible [data-file="benchy_0.16mm_PETG.gcode"]').click()
  await expect(page.getByTestId('page-title')).toHaveText('benchy_0.16mm_PETG')
  await page.getByTestId('page-back').click()
  await expect(page).toHaveURL(/\/jobs$/)
})

test('error state: the file didn\'t come, it says why, and Retry fetches it again', async ({ page, open }) => {
  const served = { fail: true }
  await previewPrinter(page, served)
  await open('/preview')
  await openFile(page)
  await expect(page.getByTestId('preview-error')).toContainText("Couldn't open calibration_cube.gcode")
  await expect(page.getByTestId('preview-error')).toContainText("Boxwood didn't send calibration_cube.gcode")
  served.fail = false
  await page.getByTestId('preview-retry').click()
  await expect(page.getByTestId('preview-layer-pill')).toBeVisible()
})

test('offline state: it says so, opening and printing wait with a reason, and the Show tile stays', async ({ page, open }) => {
  const printer = await previewPrinter(page)
  await open('/preview')
  await openFile(page)
  await expect(page.getByTestId('preview-layer-pill')).toBeVisible()
  await printer.offline()
  await expect(page.getByTestId('preview-offline')).toContainText("Boxwood is offline. Files can be opened once it's back")
  await expect(page.getByTestId('preview-empty').getByTestId('preview-open')).toBeDisabled()
  await expect(page.getByTestId('preview-show')).toBeVisible()
  printer.online()
  await expect(page.getByTestId('preview-offline')).toHaveCount(0, { timeout: 30_000 })
  await expect(page.getByTestId('preview-empty').getByTestId('preview-open')).toBeEnabled()
})
