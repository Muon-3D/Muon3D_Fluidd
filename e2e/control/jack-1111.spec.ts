/**
 * Jack's 11 Nov Overview notes, KAN-2076: Quick commands is a full-width tile
 * whose buttons are drawn like the top bar's Quick actions (an icon over the name).
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

test.describe('KAN-2076: Quick commands', () => {
  test.beforeEach(async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await expect(cell(page, 'macros')).toBeVisible()
  })

  test('spans the full width of the grid, and each button has an icon over its name', async ({ page }) => {
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
})
