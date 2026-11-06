/**
 * Library v3, page 1: Discover. What a person sees and does there: the
 * header, filters and search, the three shelves, the feed below them, quick
 * look and Print from a card. States (loading, errors, offline) are in
 * discover-states.spec.ts.
 */
import { test, expect } from '../fixtures'
import { publication } from '../fakes/models'

const shelf = (page: import('@playwright/test').Page, id: string) => page.getByTestId(`library-shelf-${id}`)
const titles = async (page: import('@playwright/test').Page, id: string) =>
  shelf(page, id).locator('.mcard__title').allTextContents()

test('the header says what Discover is, and the switch takes you to Yours', async ({ page, open }) => {
  await open('/library?view=discover')
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  await expect(page.getByTestId('library-purpose')).toHaveText('Prints people share, and ones tested on the M1')
  await expect(page.getByRole('tab', { name: 'Discover' })).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('tab', { name: 'Yours' }).click()
  await expect(page).toHaveURL(/view=mine/)
  await expect(page.getByTestId('library-signed-out')).toContainText('Sign in to see yours')
})

test('in Control, Discover opens on what the open printer can print, and the chip turns that off', async ({ page, open }) => {
  await open('/library?view=discover')
  const fits = page.getByTestId('library-discover-chip-fits')
  await expect(fits).toHaveText(/Fits Boxwood/)
  await expect(fits).toHaveAttribute('aria-pressed', 'true')
  // The fake marks odd prints Made for M1: with Fits on, Popular holds only those.
  for (const title of await titles(page, 'popular')) expect(Number(title.replace('Print ', '')) % 2).toBe(1)
  await fits.click()
  await expect(fits).toHaveAttribute('aria-pressed', 'false')
  await expect(shelf(page, 'popular')).toContainText('Print 12')
})

test('a category chip shows only that kind of print, on every shelf and in the feed', async ({ page, open }) => {
  await open('/library?view=discover')
  await page.getByTestId('library-discover-chip-fits').click()
  await page.getByTestId('library-discover-chip-workshop').click()
  await expect(page.getByTestId('library-discover-chip-workshop')).toHaveAttribute('aria-pressed', 'true')
  // Workshop prints in the fake: 1, 5, 9.
  await expect(shelf(page, 'popular').locator('.mcard__title')).toHaveText(['Print 9', 'Print 5', 'Print 1'])
  await expect(page.getByTestId('library-feed').locator('.mlib-post')).toHaveCount(3)
})

test('search finds prints by maker, and Clear filter brings everything back', async ({ page, open }) => {
  await open('/library?view=discover')
  await page.getByTestId('library-discover-chip-fits').click()
  await page.getByRole('searchbox', { name: 'Search Discover' }).fill('maker 3')
  for (const title of await titles(page, 'popular')) expect(Number(title.replace('Print ', '')) % 4).toBe(3)
  await page.getByRole('searchbox', { name: 'Search Discover' }).fill('no such print')
  await page.getByTestId('library-discover-empty').getByRole('button', { name: 'Clear filter' }).click()
  await expect(shelf(page, 'popular')).toContainText('Print 12')
})

test('the feed says who made, shared and remixed what, newest first, with hearts', async ({ page, models, open }) => {
  models.publications[0].make_of = models.publications[2].id
  models.publications[1].remix_of = models.publications[3].id
  await open('/library?view=discover')
  await page.getByTestId('library-discover-chip-fits').click()
  const feed = page.getByTestId('library-feed')
  const posts = feed.locator('.mlib-post')
  await expect(posts.first()).toContainText('Maker 1 made Print 1, from Print 3')
  await expect(posts.nth(1)).toContainText('Maker 2 remixed Print 2 from Print 4')
  await expect(posts.nth(2)).toContainText('Maker 3 shared Print 3')
  await expect(posts.first()).toContainText('♡ 5')
})

test('Show more reads the next page of the feed, once each', async ({ page, models, open }) => {
  models.publications = Array.from({ length: 30 }, (_, i) => publication(i + 1))
  await open('/library?view=discover')
  await page.getByTestId('library-discover-chip-fits').click()
  const posts = page.getByTestId('library-feed').locator('.mlib-post')
  await expect(posts).toHaveCount(12)
  await page.getByTestId('library-feed-more').click()
  await expect(posts).toHaveCount(24)
  const texts = await posts.locator('.mlib-post__by').allTextContents()
  expect(new Set(texts).size).toBe(texts.length)
})

test('quick look shows a print\'s facts, and closes', async ({ page, open }) => {
  await open('/library?view=discover')
  await shelf(page, 'popular').getByRole('button', { name: 'Quick look at Print 11' }).first().click()
  const look = page.getByTestId('library-quick-look')
  await expect(look.getByRole('heading', { name: 'Print 11' })).toBeVisible()
  await expect(look).toContainText('Muon3D M1')
  await expect(look).toContainText('PLA')
  await expect(look.getByTestId('library-quick-look-print')).toHaveText(/Print on Boxwood/)
  await page.keyboard.press('Escape')
  await expect(look).toHaveCount(0)
})

test('a print with no G-code says how to slice it instead of offering Print', async ({ page, models, open }) => {
  models.publications[10].gcode = false
  await open('/library?view=discover')
  await shelf(page, 'popular').getByRole('button', { name: 'Quick look at Print 11' }).first().click()
  const look = page.getByTestId('library-quick-look')
  await expect(look).toContainText('This print has no G-code yet')
  await expect(look.getByTestId('library-quick-look-print')).toHaveCount(0)
})

test('signed out, Print on a card asks you to sign in first', async ({ page, open }) => {
  await open('/library?view=discover')
  await shelf(page, 'popular').getByRole('button', { name: 'Print Print 11 on Boxwood' }).click()
  await expect(page.getByText('Sign in to Muon3D')).toBeVisible()
  await expect(page.getByTestId('print-on')).toHaveCount(0)
})

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('Print on a card opens Print on… for that print, from Discover', async ({ page, open }) => {
    await open('/library?view=discover')
    await shelf(page, 'popular').getByRole('button', { name: 'Print Print 11 on Boxwood' }).click()
    const dialog = page.getByTestId('print-on')
    await expect(dialog).toContainText('Print from Discover')
    await expect(dialog).toContainText('Print 11')
    // The fake account has no printers yet: the dialog says so.
    await expect(dialog).toContainText('There are no printers in your account yet')
  })
})
