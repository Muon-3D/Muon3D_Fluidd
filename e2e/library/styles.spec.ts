/**
 * The Library is styled, not just present (Jack, 6 Nov: "Yours" had no
 * styling on control.muon3d.com). Asserts computed styles a reader sees:
 * cards on their glass, shelves laid out in a row, the collection tiles,
 * the Print button's accent. Runs on the dev server like the rest, and
 * against a production build with playwright.prod.config.ts (CSS chunks).
 */
import { test, expect } from '../fixtures'
import { ownItem } from '../fakes/models'
import type { Locator } from '@playwright/test'

const css = (el: Locator, prop: string) => el.evaluate((node, p) => getComputedStyle(node).getPropertyValue(p), prop)

/** A real background: a colour that is not transparent, or an image. */
async function painted (el: Locator) {
  const [colour, image] = await Promise.all([css(el, 'background-color'), css(el, 'background-image')])
  return (colour !== 'rgba(0, 0, 0, 0)' && colour !== 'transparent') || (image !== 'none' && image !== '')
}

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('Yours is styled: card pictures on their surface, shelves in a row, tiles, the accent Print button', async ({ page, models, open }) => {
    models.items.push(ownItem('a', { name: 'Desk bracket' }), ownItem('b', { name: 'Knob' }))
    models.saves.push({ id: 'save-1', target: models.publications[0].id })
    models.collections.push({ id: 'col-1', name: 'Workshop', items: ['save-1'] })
    await open('/library?view=mine')
    const sliced = page.getByTestId('library-shelf-sliced')
    await expect(sliced.locator('.mcard').first()).toBeVisible()
    // The card's picture sits on its own surface, rounded.
    const pic = sliced.locator('.mcard__pic').first()
    expect(await painted(pic)).toBe(true)
    expect(parseFloat(await css(pic, 'border-top-left-radius'))).toBeGreaterThan(4)
    // The shelf is a row of cards, not a stack.
    const row = sliced.locator('.mlib-shelf__row')
    expect(await css(row, 'display')).toMatch(/grid|flex/)
    const [first, second] = [await sliced.locator('.mcard').nth(0).boundingBox(), await sliced.locator('.mcard').nth(1).boundingBox()]
    expect(first && second && Math.abs(first.y - second.y) < 4).toBe(true)
    // The Print button is the accent, not a bare browser button.
    const go = sliced.getByTestId('library-own-act').first()
    expect(await painted(go)).toBe(true)
    expect(await css(go, 'border-top-style')).not.toBe('outset')
    // Collections: a tile with a surface.
    expect(await painted(page.getByTestId('library-collection-col-1'))).toBe(true)
    // The shelf heading is a heading, not body text.
    expect(parseFloat(await css(sliced.locator('h2').first(), 'font-size'))).toBeGreaterThan(17)
  })
})

test('Discover is styled: shelves in a row, cards on their surface', async ({ page, open }) => {
  await open('/library?view=discover')
  const popular = page.getByTestId('library-shelf-popular')
  await expect(popular.locator('.mcard').first()).toBeVisible()
  expect(await painted(popular.locator('.mcard__pic').first())).toBe(true)
  expect(await css(popular.locator('.mlib-shelf__row'), 'display')).toMatch(/grid|flex/)
})

test('a link drawn as a button reads as one: its text on its own colour, not underlined', async ({ page, models, open }) => {
  // A print with no G-code: the quick look's one primary is a link, Slice it on library.muon3d.com.
  models.publications[10].gcode = false
  await open('/library?view=discover')
  await page.getByTestId('library-shelf-popular').getByRole('button', { name: 'Quick look at Print 11' }).first().click()
  const slice = page.getByTestId('library-quick-look-slice')
  await expect(slice).toBeVisible()
  const [colour, background] = [await css(slice, 'color'), await css(slice, 'background-color')]
  expect(colour).not.toBe(background)
  // The primary's own dark text (library-v2.scss .mlib-btn--primary), not the theme's link colour.
  expect(colour).toBe('rgb(4, 33, 31)')
  expect(await css(slice, 'text-decoration-line')).toBe('none')
  expect(await css(page.getByTestId('library-quick-look-remix'), 'text-decoration-line')).toBe('none')
})
