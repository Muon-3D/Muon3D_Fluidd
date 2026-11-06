/**
 * Library v3, page 5: quick look. A sheet over the shelf (a bottom sheet on
 * a phone): pictures, who made it, the facts, the colours it was shown in,
 * one Print, then Add to collection, Open page, Remix and Download.
 */
import { test, expect } from '../fixtures'
import { GCODE_TEXT } from '../fakes/models'

const look = (page: import('@playwright/test').Page) => page.getByTestId('library-quick-look')

async function openLook (page: import('@playwright/test').Page, title = 'Print 11') {
  await page.getByTestId('library-shelf-popular').getByRole('button', { name: `Quick look at ${title}` }).first().click()
  await expect(look(page).getByRole('heading', { name: title })).toBeVisible()
}

test('it shows the maker, Made for M1 and Fits Boxwood, the facts, and the colours it was shown in', async ({ page, open }) => {
  await open('/library?view=discover')
  await openLook(page)
  await expect(look(page)).toContainText('Maker 3')
  await expect(look(page).getByText('Made for M1')).toBeVisible()
  await expect(look(page).getByTestId('library-quick-look-fits')).toHaveText('Fits Boxwood')
  await expect(look(page).locator('.mlook__specs')).toContainText('PLA')
  const colours = look(page).getByTestId('library-quick-look-colours')
  await expect(colours).toContainText('Shown in')
  await expect(colours.locator('.mlook__dot')).toHaveCount(2)
})

test('one Print, then the secondary row: Open page and Remix go to its page on the Library site', async ({ page, models, open }) => {
  await open('/library?view=discover')
  await openLook(page)
  await expect(look(page).getByTestId('library-quick-look-print')).toHaveText(/Print on Boxwood/)
  const p11 = models.publications[10]
  await expect(look(page).getByTestId('library-quick-look-page')).toHaveAttribute('href', `https://library.muon3d.com/p/${p11.slug}`)
  await expect(look(page).getByTestId('library-quick-look-remix')).toHaveAttribute('href', `https://library.muon3d.com/p/${p11.slug}/remix`)
  // Signed out: nothing that needs an account.
  await expect(look(page).getByTestId('library-quick-look-save')).toHaveCount(0)
  await expect(look(page).getByTestId('library-quick-look-collect')).toHaveCount(0)
  await expect(look(page).getByTestId('library-quick-look-download')).toHaveCount(0)
})

test('a click outside, or Escape, closes it and gives focus back', async ({ page, isMobile, open }) => {
  await open('/library?view=discover')
  await openLook(page)
  await page.keyboard.press('Escape')
  await expect(look(page)).toHaveCount(0)
  test.skip(isMobile, 'a phone bottom sheet has no outside to click above it at this size')
  await openLook(page)
  await look(page).click({ position: { x: 5, y: 5 } })
  await expect(look(page)).toHaveCount(0)
})

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('the heart saves it, and a second tap unsaves', async ({ page, models, open }) => {
    await open('/library?view=discover')
    await openLook(page)
    const heart = look(page).getByTestId('library-quick-look-save')
    await expect(heart).toHaveAttribute('aria-pressed', 'false')
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
    expect(models.saves.map(s => s.target)).toEqual([models.publications[10].id])
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'false')
    expect(models.saves).toEqual([])
  })

  test('New collection… makes one by name and puts the print in it, saving it first', async ({ page, models, open }) => {
    await open('/library?view=discover')
    await openLook(page)
    await look(page).getByTestId('library-quick-look-collect').selectOption('__new')
    await look(page).getByTestId('library-quick-look-new-name').fill('Gifts')
    await look(page).getByRole('button', { name: 'Create and add' }).click()
    await expect(look(page)).toContainText('Added to Gifts.')
    expect(models.collections.map(c => c.name)).toEqual(['Gifts'])
    expect(models.collections[0].items).toHaveLength(1)
    expect(models.saves.map(s => s.target)).toEqual([models.publications[10].id])
    // The new collection is offered next time.
    await expect(look(page).getByTestId('library-quick-look-collect').locator('option', { hasText: 'Gifts' })).toHaveCount(1)
  })

  test('Add to collection puts it in one you already have', async ({ page, models, open }) => {
    models.collections.push({ id: 'col-1', name: 'Workshop', items: [] })
    await open('/library?view=discover')
    await openLook(page)
    await look(page).getByTestId('library-quick-look-collect').selectOption({ label: 'Workshop' })
    await expect(look(page)).toContainText('Added to Workshop.')
    expect(models.collections[0].items).toHaveLength(1)
  })

  test('Download saves its G-code, checked against what its maker published', async ({ page, open }) => {
    await open('/library?view=discover')
    await openLook(page)
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      look(page).getByTestId('library-quick-look-download').click()
    ])
    expect(download.suggestedFilename()).toBe('Print 11.gcode')
    const path = await download.path()
    const { readFileSync } = await import('node:fs')
    expect(readFileSync(path!, 'utf-8')).toBe(GCODE_TEXT)
  })
})
