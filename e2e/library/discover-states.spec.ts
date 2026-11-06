/**
 * Library v3, page 12 (states) and the shared shelf (L2), on Discover:
 * loading, one shelf down, everything down, offline, no match, nothing yet.
 * The same tile in the same place every time (v3 principles section 6).
 */
import { test, expect } from '../fixtures'

test('while Discover loads, its shelves show skeleton cards in place', async ({ page, models, open }) => {
  models.delayMs = 4000
  await open('/library?view=discover')
  const popular = page.getByTestId('library-shelf-popular')
  await expect(popular).toHaveAttribute('aria-busy', 'true')
  await expect(popular.locator('.mlib-skeleton-card')).toHaveCount(5)
  await expect(popular).toHaveAttribute('aria-busy', 'false', { timeout: 20_000 })
  await expect(popular).toContainText('Print 11')
})

test('a shelf that failed says so with Retry, and the rest of Discover keeps working', async ({ page, models, open }) => {
  // Popular's own list and Discover's fallback both down; Made for M1 and New still answer.
  models.failOn = r => (r.startsWith('GET /v1/public/publications?sort=trending&limit') || r.startsWith('GET /v1/public/discover')) ? 503 : null
  await open('/library?view=discover')
  await expect(page.getByTestId('library-shelf-popular-error')).toContainText('didn\'t answer')
  await expect(page.getByTestId('library-shelf-new')).toContainText('Print 1')
  await expect(page.getByTestId('library-feed')).toBeVisible()
  models.failOn = () => null
  await page.getByTestId('library-shelf-popular-error').getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByTestId('library-shelf-popular-error')).toHaveCount(0)
  await expect(page.getByTestId('library-shelf-popular')).toContainText('Print 11')
})

test('with nothing answering, one tile says so, and Try again brings Discover back', async ({ page, models, open }) => {
  models.failWith = 503
  await open('/library?view=discover')
  const state = page.getByTestId('library-discover-state')
  await expect(state).toContainText('The Library didn\'t answer')
  await expect(page.getByTestId('library-shelf-popular')).toHaveCount(0)
  models.failWith = null
  await state.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByTestId('library-shelf-popular')).toBeVisible()
})

test('offline, Discover says so, and comes back by itself when the connection does', async ({ page, models, open }) => {
  // The page itself loads from this machine; only the internet is "gone".
  await page.addInitScript(() => {
    let online = false
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online })
    ;(window as unknown as { goOnline: () => void }).goOnline = () => { online = true; window.dispatchEvent(new Event('online')) }
  })
  models.failWith = 503
  await open('/library?view=discover')
  await expect(page.getByTestId('library-discover-state')).toContainText('You\'re offline')
  models.failWith = null
  await page.evaluate(() => (window as unknown as { goOnline: () => void }).goOnline())
  await expect(page.getByTestId('library-shelf-popular')).toContainText('Print 11')
})

test('a search that matches nothing says so, and Clear filter brings everything back', async ({ page, open }) => {
  await open('/library?view=discover')
  await page.getByTestId('library-discover-find').fill('zzz')
  const empty = page.getByTestId('library-discover-empty')
  await expect(empty).toContainText('Nothing matches "zzz" with Fits Boxwood')
  await empty.getByRole('button', { name: 'Clear filter' }).click()
  await expect(page.getByTestId('library-discover-find')).toHaveValue('')
  await expect(page.getByTestId('library-discover-chip-all')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('library-shelf-popular')).toContainText('Print 12')
})

test('with nothing shared yet, Discover says so instead of empty shelves', async ({ page, models, open }) => {
  models.publications = []
  await open('/library?view=discover')
  await expect(page.getByTestId('library-discover-state')).toContainText('Nothing to discover yet')
  await expect(page.getByTestId('library-shelf-popular')).toHaveCount(0)
  await expect(page.getByTestId('library-feed')).toHaveCount(0)
  // The model service did answer: this is "nothing yet", not an outage.
  expect(models.seen.some(r => r.startsWith('GET /v1/public/publications'))).toBe(true)
})

test('a shelf\'s See all is a button with the shelf\'s name, for every shelf shown', async ({ page, open }) => {
  await open('/library?view=discover')
  await expect(page.getByRole('button', { name: 'See all Popular this week' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'See all New' })).toBeVisible()
})

test('when two shelves fail and the feed is empty, the shelves keep their Retry instead of "Nothing to discover"', async ({ page, models, open }) => {
  models.failOn = r => r.startsWith('GET /v1/public/discover') || r.includes('sort=trending') ? 503 : null
  models.publications = []
  await open('/library?view=discover')
  await expect(page.getByTestId('library-shelf-popular-error')).toBeVisible()
  await expect(page.getByTestId('library-discover-state')).toHaveCount(0)
})
