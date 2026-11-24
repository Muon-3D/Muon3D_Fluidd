/**
 * KAN-5979 / KAN-5980 (Jack, 24 Nov): the four Overview panels (Hotend, Bed, Position,
 * Print mode) are the same width; the Trackpad has the one Home all; the
 * trackpad's head follows the printer's live position.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { overlay, usePrinter, PRESETS } from './printer'

const PANELS = ['hotend', 'bed', 'position', 'mode']
const FAN_MODES = { mode: 'normal', modes: ['quiet', 'normal', 'turbo'] }

const start = (page: Page, position: [number, number, number] = [100, 100, 10]) =>
  usePrinter(page, overlay(PRESETS.idleHomed({ position }), { fan_modes: FAN_MODES }))

const box = async (page: Page, id: string) => (await page.locator(`[data-cell="${id}"]`).boundingBox())!
const trackpad = (page: Page) => page.locator('[data-tile="trackpad"]')

test.describe('the four Overview panels are equal', () => {
  test('desktop: the same width, within 1 px, in one row', async ({ page, open }) => {
    await start(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await open('/')
    for (const id of PANELS) await expect(page.locator(`[data-cell="${id}"]`)).toBeVisible()
    const boxes = await Promise.all(PANELS.map(id => box(page, id)))
    for (const b of boxes) expect(Math.abs(b.width - boxes[0].width)).toBeLessThanOrEqual(1)
    // Negative control: they really are side by side, not stacked.
    expect(new Set(boxes.map(b => Math.round(b.y))).size).toBe(1)
  })

  for (const width of [360, 320]) {
    test(`${width} px: they stack or wrap inside the screen, with no sideways scroll`, async ({ page, open }) => {
      await start(page)
      await page.setViewportSize({ width, height: 800 })
      await open('/')
      for (const id of PANELS) await expect(page.locator(`[data-cell="${id}"]`)).toBeVisible()
      for (const id of PANELS) {
        const b = await box(page, id)
        expect(b.x).toBeGreaterThanOrEqual(0)
        expect(b.x + b.width).toBeLessThanOrEqual(width + 1)
      }
      // Once the page has settled (the 3D view and the tiles load in after the first paint).
      await expect(page.locator('[data-cell="trackpad"]')).toBeAttached({ timeout: 45_000 })
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), { timeout: 20_000 }).toBeLessThanOrEqual(0)
    })
  }
})

for (const width of [1440, 360, 320]) {
  test.describe(`Home at ${width} px`, () => {
    test.beforeEach(async ({ page }) => { await page.setViewportSize({ width, height: 900 }) })

    test('one Home all on the whole Overview, it sends G28, and Home XY sends G28 X Y (KAN-6008)', async ({ page, open }) => {
      const printer = await start(page)
      await open('/')
      await expect(trackpad(page).getByTestId('move-homes')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Home all' })).toHaveCount(1)
      // Nothing else on the page is a second Home all or a Quick command that homes; the one Home XY is the header's.
      await expect(page.getByRole('button', { name: /Home X ?Y/i })).toHaveCount(1)
      await expect(page.locator('[data-tile="macros"] [data-macro="home"]')).toHaveCount(0)
      // Home all sits above the pad.
      const homes = (await trackpad(page).getByTestId('move-homes').boundingBox())!
      const pad = (await trackpad(page).getByTestId('move-trackpad').boundingBox())!
      expect(homes.y + homes.height).toBeLessThan(pad.y)
      await page.getByRole('button', { name: 'Home all' }).click()
      await expect.poll(() => printer.gcode).toEqual(['G28'])
      await page.getByRole('button', { name: 'Home XY' }).click()
      await expect.poll(() => printer.gcode).toEqual(['G28', 'G28 X Y'])
    })

    test('Home XY is disabled with its reason when Klipper reports home_xy not ready (KAN-6008)', async ({ page, open }) => {
      const printer = await usePrinter(page, overlay(PRESETS.idleHomed(), { m1_machine: { ready: { home_xy: false }, missing: { home_xy: ['toolhead_disconnected'] } } }))
      await open('/')
      const btn = trackpad(page).getByRole('button', { name: 'Home XY' })
      await expect(btn).toBeDisabled()
      await expect(trackpad(page).getByTestId('home-xy-reason')).toHaveText('Connect the toolhead first')
      await btn.click({ force: true })
      expect(printer.gcode).toEqual([])
    })
  })
}

test.describe('the trackpad head follows the live position', () => {
  for (const width of [1440, 360, 320]) {
    test(`at ${width} px the head moves when the printer reports a new toolhead position`, async ({ page, open }) => {
      const printer = await start(page, [60, 60, 10])
      await page.setViewportSize({ width, height: 900 })
      await open('/')
      const head = trackpad(page).getByTestId('trackpad-head')
      await expect(trackpad(page)).toBeAttached({ timeout: 45_000 })
      await trackpad(page).scrollIntoViewIfNeeded()
      await expect(head).toBeVisible({ timeout: 30_000 })
      const at = async () => (await head.boundingBox())!
      const before = await at()
      // Without a drag or a click: the printer moved the head by itself.
      printer.report({
        toolhead: { homed_axes: 'xyz', position: [200, 180, 10, 0] },
        gcode_move: { position: [200, 180, 10, 0], gcode_position: [200, 180, 10, 0] },
        motion_report: { live_position: [200, 180, 10, 0], live_velocity: 0 }
      })
      await expect.poll(async () => { const b = await at(); return b.x - before.x }, { timeout: 8000 }).toBeGreaterThan(5)
      const after = await at()
      // The bed is drawn with Y up: a larger Y is higher on the pad.
      expect(Math.abs(after.y - before.y)).toBeGreaterThan(5)
      // And back.
      printer.report({
        toolhead: { homed_axes: 'xyz', position: [60, 60, 10, 0] },
        gcode_move: { position: [60, 60, 10, 0], gcode_position: [60, 60, 10, 0] },
        motion_report: { live_position: [60, 60, 10, 0], live_velocity: 0 }
      })
      await expect.poll(async () => Math.abs((await at()).x - before.x), { timeout: 8000 }).toBeLessThan(2)
    })
  }
})
