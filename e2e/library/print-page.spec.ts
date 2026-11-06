/**
 * A print's own page (Library v3, page 6): opened from a quick look's Open
 * page (or its address), the gallery, a Print tile with everything needed
 * to print it, About and its Maker, then Made by people and Remixes as
 * shelves. Back returns where it was opened.
 */
import { test, expect } from '../fixtures'
import type { ModelServiceState } from '../fakes/models'
import type { Page } from '@playwright/test'

const P11 = 10

/** Print 11 has two makes (Print 3, Print 5) and one remix (Print 7). */
function family (models: ModelServiceState) {
  const id = models.publications[P11].id
  models.publications[2].make_of = id
  models.publications[4].make_of = id
  models.publications[6].remix_of = id
  return id
}

const shelf = (page: Page, id: string) => page.getByTestId(`library-shelf-${id}`)

async function openFromDiscover (page: Page, open: (path: string) => Promise<void>) {
  await open('/library?view=discover')
  await shelf(page, 'popular').getByRole('button', { name: 'Quick look at Print 11' }).first().click()
  await page.getByTestId('library-quick-look-page').click()
  await expect(page.getByTestId('library-print-title')).toHaveText('Print 11')
}

test('Open page in a quick look opens the print\'s page: gallery, Print, About, Maker, makes and remixes', async ({ page, models, open }) => {
  const id = family(models)
  await openFromDiscover(page, open)
  await expect(page).toHaveURL(new RegExp(`print=${id}`))
  await expect(page.getByTestId('library-quick-look')).toHaveCount(0)
  await expect(page.getByTestId('library-print-by')).toHaveText(/^\s*by Maker 3 · shared .+ · CC BY 4\.0\s*$/)
  await expect(page.getByTestId('library-print-gallery').locator('img').first()).toBeVisible()
  const tile = page.getByTestId('library-print-tile')
  await expect(page.getByTestId('library-print-fits')).toHaveText('Fits Boxwood')
  await expect(tile).toContainText('Material')
  await expect(tile).toContainText('PLA')
  await expect(page.getByTestId('library-print-print')).toHaveText(/Print on Boxwood/)
  await expect(page.getByTestId('library-print-remix')).toHaveAttribute('href', `https://library.muon3d.com/p/${models.publications[P11].slug}/remix`)
  await expect(page.getByTestId('library-print-counts')).toContainText('110 made')
  await expect(page.getByTestId('library-print-about')).toContainText('Print 11, sliced for the M1.')
  await expect(page.getByTestId('library-print-maker')).toContainText('Maker 3')
  await expect(page.getByTestId('library-print-maker')).toContainText('@maker3')
  await expect(shelf(page, 'makes')).toContainText('Print 3')
  await expect(shelf(page, 'makes')).toContainText('Print 5')
  await expect(shelf(page, 'makes')).not.toContainText('Print 7')
  await expect(shelf(page, 'remixes')).toContainText('Print 7')
  // Signed out: nothing that needs an account.
  await expect(page.getByTestId('library-print-heart')).toHaveCount(0)
  await expect(page.getByTestId('library-print-collect')).toHaveCount(0)
  await expect(page.getByTestId('library-print-download')).toHaveCount(0)
})

test('‹ Discover and the browser\'s Back both return to Discover', async ({ page, models, open }) => {
  family(models)
  await openFromDiscover(page, open)
  await page.goBack()
  await expect(page.getByTestId('library-shelf-popular')).toBeVisible()
  await expect(page).not.toHaveURL(/print=/)
  await page.goForward()
  await expect(page.getByTestId('library-print-title')).toHaveText('Print 11')
  await page.getByTestId('library-print-back').click()
  await expect(page.getByTestId('library-shelf-popular')).toBeVisible()
  await expect(page).not.toHaveURL(/print=/)
})

test('opened by its address it reads itself; ‹ goes to Discover under it', async ({ page, models, open }) => {
  const id = family(models)
  await open(`/library?view=discover&print=${id}`)
  await expect(page.getByTestId('library-print-title')).toHaveText('Print 11')
  await expect(page.getByTestId('library-print-fits')).toHaveText('Fits Boxwood')
  await page.getByTestId('library-print-back').click()
  await expect(page.getByTestId('library-shelf-popular')).toBeVisible()
  await expect(page).not.toHaveURL(/print=/)
})

test('a make on its shelf opens its own page, and Back returns to the first', async ({ page, models, open }) => {
  family(models)
  await openFromDiscover(page, open)
  await shelf(page, 'makes').getByRole('button', { name: 'Quick look at Print 3' }).first().click()
  await page.getByTestId('library-quick-look-page').click()
  await expect(page.getByTestId('library-print-title')).toHaveText('Print 3')
  await expect(page.getByTestId('library-shelf-makes-empty')).toBeVisible()
  await page.goBack()
  await expect(page.getByTestId('library-print-title')).toHaveText('Print 11')
})

test('Print on Boxwood asks a signed-out person to sign in first', async ({ page, models, open }) => {
  family(models)
  await openFromDiscover(page, open)
  await page.getByTestId('library-print-print').click()
  await expect(page.getByText('Sign in to Muon3D')).toBeVisible()
  await expect(page.getByTestId('print-on')).toHaveCount(0)
})

test('a print that could not be read says so, and Try again reads it', async ({ page, models, open }) => {
  const id = family(models)
  let down = true
  models.failOn = request => down && request === `GET /v1/public/publications/${id}` ? 503 : null
  await open(`/library?view=discover&print=${id}`)
  await expect(page.getByTestId('library-print-error')).toBeVisible()
  down = false
  await page.getByTestId('library-print-error').getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByTestId('library-print-title')).toHaveText('Print 11')
  await expect(page.getByTestId('library-print-about')).toBeVisible()
})

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('Print on Boxwood opens Print on…; the heart saves; New collection makes one and adds it', async ({ page, models, open }) => {
    family(models)
    await openFromDiscover(page, open)
    await page.getByTestId('library-print-print').click()
    await expect(page.getByTestId('print-on').getByRole('heading', { name: 'Print 11' })).toBeVisible()
    await page.getByTestId('print-on-cancel').click()

    const heart = page.getByTestId('library-print-heart')
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
    expect(models.saves.map(s => s.target)).toEqual([models.publications[P11].id])

    await page.getByTestId('library-print-collect').selectOption('__new')
    await page.getByTestId('library-print-new-name').fill('Robots')
    await page.getByRole('button', { name: 'Create and add' }).click()
    await expect(page.getByTestId('library-print-note')).toHaveText('Added to Robots.')
    expect(models.collections.map(c => c.name)).toEqual(['Robots'])
    expect(models.collections[0].items).toHaveLength(1)
  })

  test('Share copies the print\'s link', async ({ page, models, open, context, isMobile }) => {
    test.skip(!!isMobile, 'A phone offers its own share sheet.')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    family(models)
    await openFromDiscover(page, open)
    await page.getByTestId('library-print-share').click()
    await expect(page.getByTestId('library-print-note')).toHaveText('Link copied.')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`https://library.muon3d.com/p/${models.publications[P11].slug}`)
  })
})
