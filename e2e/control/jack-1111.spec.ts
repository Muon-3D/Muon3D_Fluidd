/**
 * Jack's 11 Nov Overview notes:
 * - KAN-2076: Quick commands is a full-width tile whose buttons are drawn like the top bar's Quick actions (an icon over the name).
 * - KAN-2077: the Trackpad is a compact tile.
 * - KAN-2078: Jog is shorter, with no empty space under its last control.
 */
import type { Locator, Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { usePrinter, PRESETS } from './printer'

const box = async (l: Locator) => {
  await l.scrollIntoViewIfNeeded()
  const b = await l.boundingBox()
  if (!b) throw new Error('not on screen')
  return b
}
const cell = (page: Page, id: string) => page.locator(`[data-cell="${id}"]`)

test.describe('KAN-2076/2077/2078: Quick commands, Trackpad and Jog', () => {
  test.beforeEach(async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await expect(cell(page, 'macros')).toBeVisible()
  })

  test('Quick commands spans the full width of the grid, and each button has an icon over its name', async ({ page }) => {
    const grid = await box(page.locator('.overview__grid'))
    const macros = await box(cell(page, 'macros'))
    expect(Math.abs(macros.x - grid.x)).toBeLessThan(2)
    expect(Math.abs(macros.width - grid.width)).toBeLessThan(2)

    const chips = page.locator('[data-tile="macros"] [data-tid="macro-chip"]')
    expect(await chips.count()).toBeGreaterThan(0)
    for (const chip of await chips.all()) {
      await expect(chip.locator('svg.frame-icon')).toHaveCount(1)
      const [icon, label] = [await box(chip.locator('svg.frame-icon')), await box(chip.locator('.mt__label'))]
      expect(icon.y + icon.height).toBeLessThanOrEqual(label.y + 1) // the icon is over the name
      expect(label.width).toBeGreaterThan(0)
    }
    await expect(page.locator('[data-tile="macros"] [data-tid="macros-all"] svg.frame-icon')).toHaveCount(1)
  })

  test('the Trackpad is compact, half a row, and its pad is not taller than the tile it sits in', async ({ page, isMobile }) => {
    const tile = await box(page.locator('[data-tile="trackpad"]'))
    const pad = await box(page.getByTestId('move-trackpad'))
    // Before: the Trackpad was two thirds of the grid and about 600 px tall on a computer.
    expect(tile.height).toBeLessThanOrEqual(isMobile ? 420 : 340)
    expect(pad.height).toBeLessThanOrEqual(tile.height - 40)
    expect(pad.width).toBeLessThanOrEqual(isMobile ? 260 : 240)
    if (!isMobile) {
      const grid = await box(page.locator('.overview__grid'))
      expect(tile.width).toBeLessThan(grid.width * 0.6)
    }
  })

  test('Jog has no empty area below its last control', async ({ page }) => {
    const tile = await box(page.locator('[data-tile="jog"]'))
    const bottoms = await page.locator('[data-tile="jog"] button[data-jog], [data-tile="jog"] [role="radio"]').evaluateAll(els => els.map(e => e.getBoundingClientRect().bottom + window.scrollY))
    const top = (await page.evaluate(() => window.scrollY)) + tile.y
    const lowest = Math.max(...bottoms)
    // Only the tile's own padding is left under the lowest button.
    expect(top + tile.height - lowest).toBeLessThanOrEqual(24)
    expect(tile.height).toBeLessThanOrEqual(340)
  })
})
