/**
 * Library v3, pages 3 and 4: See all (a shelf as a grid) and search
 * results. One grid page: back, a count, search and sort, the same filters
 * as Discover, Load more, and the shared states.
 */
import { test, expect } from '../fixtures'
import { publication } from '../fakes/models'

test('See all opens the shelf as a grid, and Back returns to Discover', async ({ page, open }) => {
  await open('/library?view=discover')
  await page.getByRole('button', { name: 'See all Popular this week' }).click()
  await expect(page).toHaveURL(/shelf=popular/)
  const grid = page.getByTestId('library-grid-popular')
  await expect(grid.getByRole('heading', { level: 1, name: 'Popular' })).toBeVisible()
  await expect(grid.getByTestId('library-grid-cards').locator('.mcard').first()).toBeVisible()
  await page.goBack()
  await expect(page).not.toHaveURL(/shelf=/)
  await expect(page.getByTestId('library-shelf-popular')).toBeVisible()
  await page.getByRole('button', { name: 'See all Popular this week' }).click()
  await page.getByTestId('library-grid-back').click()
  await expect(page).not.toHaveURL(/shelf=/)
  await expect(page.getByTestId('library-shelf-popular')).toBeVisible()
  // ‹ Discover was the browser's Back, so Forward returns to the grid.
  await page.goForward()
  await expect(page).toHaveURL(/shelf=popular/)
})

test('a filter that hides every loaded print still offers Load more', async ({ page, models, open }) => {
  // The first 24 newest are workshop-free; the workshop prints come later.
  models.publications = Array.from({ length: 40 }, (_, i) => publication(i + 1, { category: i >= 30 ? 'workshop' : 'home' }))
  await open('/library?view=discover&shelf=new')
  const grid = page.getByTestId('library-grid-new')
  await grid.getByTestId('library-grid-chip-fits').click()
  await grid.getByTestId('library-grid-chip-workshop').click()
  await expect(grid.getByTestId('library-grid-nomatch')).toBeVisible()
  await grid.getByTestId('library-grid-more').click()
  await expect(grid.getByTestId('library-grid-cards').locator('.mcard')).toHaveCount(10)
})

test('Load more reads the next page, each print once, and the count follows', async ({ page, models, open }) => {
  models.publications = Array.from({ length: 40 }, (_, i) => publication(i + 1))
  await open('/library?view=discover&shelf=new')
  const grid = page.getByTestId('library-grid-new')
  await grid.getByTestId('library-grid-chip-fits').click()
  const cards = grid.getByTestId('library-grid-cards').locator('.mcard')
  await expect(cards).toHaveCount(24)
  await expect(grid.getByTestId('library-grid-count')).toHaveText('24+ prints')
  await grid.getByTestId('library-grid-more').click()
  await expect(cards).toHaveCount(40)
  await expect(grid.getByTestId('library-grid-count')).toHaveText('40 prints')
  await expect(grid.getByTestId('library-grid-more')).toHaveCount(0)
  const titles = await cards.locator('.mcard__title').allTextContents()
  expect(new Set(titles).size).toBe(40)
})

test('the sort switches the grid between Popular, New and Made for M1, without adding history', async ({ page, open }) => {
  await open('/library?view=discover&shelf=popular')
  await page.getByTestId('library-grid-popular').getByTestId('library-grid-chip-fits').click()
  // Popular is most made first (Print 12), New is newest first (Print 1).
  await expect(page.getByTestId('library-grid-cards').locator('.mcard__title').first()).toHaveText('Print 12')
  await page.getByTestId('library-grid-sort-new').click()
  await expect(page).toHaveURL(/shelf=new/)
  await expect(page.getByTestId('library-grid-new').getByRole('heading', { name: 'New' })).toBeVisible()
  await expect(page.getByTestId('library-grid-new').getByTestId('library-grid-cards').locator('.mcard__title').first()).toHaveText('Print 1')
  await page.getByTestId('library-grid-sort-m1').click()
  await expect(page.getByTestId('library-grid-m1')).toBeVisible()
})

test('filters and the search box narrow the grid; Clear filter undoes them', async ({ page, open }) => {
  await open('/library?view=discover&shelf=popular')
  const grid = page.getByTestId('library-grid-popular')
  await grid.getByTestId('library-grid-chip-fits').click()
  await grid.getByTestId('library-grid-chip-workshop').click()
  await expect(grid.getByTestId('library-grid-cards').locator('.mcard__title')).toHaveText(['Print 9', 'Print 5', 'Print 1'])
  await grid.getByTestId('library-grid-find').fill('zzz')
  const none = grid.getByTestId('library-grid-nomatch')
  await expect(none).toContainText('Nothing here with Workshop and "zzz"')
  await none.getByRole('button', { name: 'Clear filter' }).click()
  await expect(grid.getByTestId('library-grid-cards').locator('.mcard')).toHaveCount(12)
})

test('Enter in Discover\'s search opens the results; the results search again', async ({ page, models, open }) => {
  // "Fits Boxwood" is on in search too (the mockup): the planter is an M1 print.
  models.publications[4].tags = ['planter', 'm1-ready']
  await open('/library?view=discover')
  await page.getByTestId('library-discover-find').fill('planter')
  await page.getByTestId('library-discover-find').press('Enter')
  await expect(page).toHaveURL(/shelf=search&q=planter|q=planter.*shelf=search/)
  const grid = page.getByTestId('library-grid-search')
  await expect(grid.getByRole('heading', { level: 1 })).toHaveText('Library')
  await expect(grid.getByTestId('library-grid-find')).toHaveValue('planter')
  await expect(grid.getByRole('heading', { level: 2, name: 'On Muon3D' })).toBeVisible()
  await expect(grid.getByTestId('library-grid-cards').locator('.mcard__title')).toHaveText(['Print 5'])
  await expect(grid.getByTestId('library-grid-count')).toHaveText('1 print for "planter"')
  expect(models.seen.some(r => r.startsWith('GET /v1/public/search?q=planter'))).toBe(true)

  await grid.getByTestId('library-grid-chip-fits').click()
  await grid.getByTestId('library-grid-find').fill('maker 2')
  await grid.getByTestId('library-grid-find').press('Enter')
  await expect(page).toHaveURL(/q=maker/)
  await expect(grid.getByTestId('library-grid-count')).toContainText('for "maker 2"')
  for (const title of await grid.getByTestId('library-grid-cards').locator('.mcard__title').allTextContents()) {
    expect(Number(title.replace('Print ', '')) % 4).toBe(2)
  }
})

test('a search that finds nothing says so', async ({ page, open }) => {
  await open('/library?view=discover&shelf=search&q=nothing-like-this')
  await expect(page.getByTestId('library-grid-empty')).toContainText('Nothing found for "nothing-like-this"')
})

test('with a model service from before search, results come from the newest prints', async ({ page, models, open }) => {
  models.noSearch = true
  models.publications[2].tags = ['m1-ready', 'sundial']
  await open('/library?view=discover&shelf=search&q=sundial')
  const grid = page.getByTestId('library-grid-search')
  await expect(grid.getByTestId('library-grid-cards').locator('.mcard__title')).toHaveText(['Print 3'])
  await expect(grid.getByTestId('library-grid-count')).toHaveText('1 print for "sundial", among the newest')
})

test('a grid that can\'t be read says so, and Try again recovers', async ({ page, models, open }) => {
  models.failWith = 503
  await open('/library?view=discover&shelf=popular')
  const error = page.getByTestId('library-grid-error')
  await expect(error).toContainText('didn\'t answer')
  models.failWith = null
  await error.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByTestId('library-grid-cards').locator('.mcard').first()).toBeVisible()
})

test('a card in the grid opens quick look', async ({ page, open }) => {
  await open('/library?view=discover&shelf=popular')
  await page.getByTestId('library-grid-cards').getByRole('button', { name: 'Quick look at Print 11' }).first().click()
  await expect(page.getByTestId('library-quick-look')).toContainText('Print 11')
})

test('a search address with one letter asks for two, without an error', async ({ page, open }) => {
  await open('/library?view=discover&shelf=search&q=a')
  await expect(page.getByTestId('library-grid-short')).toContainText('Search for two letters or more')
  await expect(page.getByTestId('library-grid-error')).toHaveCount(0)
})

test('too many searches says to wait', async ({ page, models, open }) => {
  models.failOn = r => r.startsWith('GET /v1/public/search') ? 429 : null
  await open('/library?view=discover&shelf=search&q=vase')
  await expect(page.getByTestId('library-grid-error')).toContainText('Too many searches')
})

test('Discover from the results returns to the shelves', async ({ page, open }) => {
  await open('/library?view=discover')
  await page.getByTestId('library-discover-find').fill('print')
  await page.getByTestId('library-discover-find').press('Enter')
  await page.getByTestId('library-grid-discover').click()
  await expect(page).not.toHaveURL(/shelf=/)
  await expect(page.getByTestId('library-shelf-popular')).toBeVisible()
})

test('Yours from the results, then Discover, shows the shelves, not the old results', async ({ page, open }) => {
  await open('/library?view=discover&shelf=search&q=print')
  await page.getByTestId('library-grid-search').getByRole('button', { name: 'Yours' }).click()
  await expect(page).toHaveURL(/view=mine/)
  await expect(page).not.toHaveURL(/shelf=|q=/)
  await page.getByRole('tab', { name: 'Discover' }).click()
  await expect(page.getByTestId('library-shelf-popular')).toBeVisible()
})

test('going from results to a too-short search address leaves no old results', async ({ page, open }) => {
  await open('/library?view=discover&shelf=search&q=print')
  await expect(page.getByTestId('library-grid-cards').locator('.mcard').first()).toBeVisible()
  await page.goto('/boxwood-367a/library?view=discover&shelf=search&q=p')
  await expect(page.getByTestId('library-grid-short')).toBeVisible()
  await expect(page.getByTestId('library-grid-cards')).toHaveCount(0)
})
