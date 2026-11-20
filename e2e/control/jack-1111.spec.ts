/**
 * Jack's 11 Nov Overview notes, KAN-2076: Quick commands is a tile under Jog (12 Nov: out to the right
 * edge and down to the Trackpad's floor) whose buttons are drawn like the top bar's Quick actions (an icon over the name).
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
/** A cell's box in page coordinates, so boxes read after different scrolls compare. */
const pageBox = (page: Page, id: string) => cell(page, id).evaluate(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + window.scrollY, width: r.width, height: r.height } })

test.describe('KAN-2076: Quick commands', () => {
  test.beforeEach(async ({ page, open }) => {
    await usePrinter(page, PRESETS.idleHomed())
    await open('/')
    await expect(cell(page, 'macros')).toBeVisible()
  })

  test('takes the full width under the Trackpad, Jog and Lighting, and each button has an icon over its name', async ({ page, isMobile }) => {
    const grid = await box(page.locator('.overview__grid'))
    const macros = await pageBox(page, 'macros')
    // I-542: edge to edge, both sides, under everything above it.
    expect(Math.abs(macros.x + macros.width - (grid.x + grid.width))).toBeLessThan(2)
    expect(Math.abs(macros.x - grid.x)).toBeLessThan(2)
    if (!isMobile) {
      const [lighting, trackpad] = [await pageBox(page, 'lighting'), await pageBox(page, 'trackpad')]
      expect(macros.y).toBeGreaterThan(lighting.y + lighting.height - 2)
      expect(macros.y).toBeGreaterThan(trackpad.y + trackpad.height - 2)
    }

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
