import { test, expect } from './catalogue-fixture'

test('editorial Discover stays populated with untagged models and the hero opens its model', async ({ page, open, models, catalogue }) => {
  models.publications[0].tags = []
  await open('/library?view=discover')
  const hero = page.getByTestId('library-featured-hero')
  await expect(hero).toContainText('Small prints. Everyday possibilities.')
  await expect(page.getByTestId('library-shelf-editorial-everyday')).toBeVisible()
  await expect(page.getByTestId('library-shelf-m1')).toContainText('Publisher-tagged')
  await expect(page.getByTestId('library-shelf-new')).toContainText('New this week')
  await expect(hero.getByTestId('library-card-fit')).toContainText(/Fits|Check print size/)
  await hero.getByRole('button', { name: 'Take a closer look' }).click()
  await expect(page.getByTestId('library-quick-look')).toBeVisible()
  await page.keyboard.press('Escape')
  expect(catalogue.urls.some(url => url.pathname.endsWith('/discover'))).toBeTruthy()
  await hero.getByTestId('library-card-save').click()
  await expect(page.getByText('Sign in to Muon3D')).toBeVisible()
})

test.describe('signed in', () => {
  test.use({ signedIn: true })
  test('the heart is a save on every copy of a card and Print opens the existing print flow', async ({ page, open, models }) => {
    await open('/library?view=discover')
    const hero = page.getByTestId('library-featured-hero')
    const heart = hero.getByTestId('library-card-save')
    await expect(heart).toHaveAttribute('aria-pressed', 'false')
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
    expect(models.saves.some(s => s.target === models.publications[0].id)).toBeTruthy()
    await expect(page.getByTestId(`library-card-pub:${models.publications[0].id}`).nth(1).getByTestId('library-card-save')).toHaveAttribute('aria-pressed', 'true')
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'false')
    await hero.getByTestId('library-card-print').click()
    await expect(page.getByTestId('print-on')).toBeVisible()
    await page.getByTestId('print-on').getByRole('button', { name: 'Cancel', exact: true }).click()
  })
})

test('categories, all four sorts and the complete filter payload are real clickable controls', async ({ page, open, catalogue }) => {
  await open('/library?view=discover')
  await page.getByTestId('library-browse-open').click()
  await expect(page.getByTestId('library-categories')).toBeVisible()
  await page.getByTestId('library-category-tools').click()
  await expect(page).toHaveURL(/category=tools/)
  await expect(page.getByRole('heading', { level: 1, name: 'Tools', exact: true })).toBeVisible()
  await expect(page.getByTestId('library-grid-cards').locator('.mcard')).toHaveCount(3)
  expect(await page.getByTestId('library-grid-cards').locator('.mcard').evaluateAll(cards => cards.every(card => {
    const bounds = card.getBoundingClientRect()
    return [...card.querySelectorAll('[data-tid="library-card-print"], [data-tid="library-card-save"]')].every(button => {
      const action = button.getBoundingClientRect()
      return action.left >= bounds.left && action.right <= bounds.right + 1
    })
  }))).toBe(true)
  for (const sort of ['relevance', 'popular', 'new', 'trending']) {
    await page.getByLabel('Sort models').selectOption(sort)
    await expect.poll(() => catalogue.urls.filter(u => u.pathname.endsWith('/categories/tools')).at(-1)?.searchParams.get('sort')).toBe(sort)
  }
  await page.getByTestId('library-browse-filters').click()
  await page.getByLabel('Material', { exact: true }).selectOption('PLA')
  await page.getByLabel('Licence', { exact: true }).selectOption('CC0-1.0')
  await page.getByLabel('Minimum size in millimetres').fill('5')
  await page.getByLabel('Maximum size in millimetres').fill('100')
  await page.getByLabel('Minimum time in minutes').fill('1')
  await page.getByLabel('Maximum time in minutes').fill('60')
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click()
  await expect.poll(() => catalogue.urls.at(-1)?.searchParams.get('max_seconds')).toBe('3600')
  const params = catalogue.urls.at(-1)!.searchParams
  expect(Object.fromEntries(params)).toMatchObject({ material: 'PLA', licence: 'CC0-1.0', min_size: '5', max_size: '100', min_seconds: '60', max_seconds: '3600' })
  await expect(page.getByLabel('Minimum rating')).toHaveCount(0)
  const fits = page.getByRole('checkbox', { name: /Fits/ })
  if (await fits.count()) { await fits.check(); await expect.poll(() => catalogue.urls.at(-1)?.searchParams.get('fits')).toMatch(/^\d+,\d+,\d+$/) }
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click()
  await expect(page.getByLabel('Material', { exact: true })).toHaveValue('')
  await page.getByTestId('library-grid-find').fill('Print')
  await page.getByTestId('library-grid-find').press('Enter')
  await expect(page).not.toHaveURL(/category=/)
  await expect(page.getByRole('heading', { level: 1, name: 'Results for “Print”', exact: true })).toBeVisible()
})

test('debounced suggestions support arrows, Enter and Escape; results update instantly and use API empty help', async ({ page, open, catalogue }) => {
  await open('/library?view=discover')
  const search = page.getByTestId('library-discover-find')
  await search.pressSequentially('Print', { delay: 20 })
  await expect(page.getByRole('option').first()).toBeVisible()
  expect(catalogue.urls.filter(u => u.pathname.endsWith('/suggestions'))).toHaveLength(1)
  await search.press('ArrowDown')
  await expect(search).toHaveAttribute('aria-activedescendant', /-0$/)
  await search.press('Enter')
  await expect(page.getByTestId('library-quick-look')).toBeVisible()
  await page.keyboard.press('Escape')
  await search.focus()
  await search.press('Escape')
  await expect(search).toHaveAttribute('aria-expanded', 'false')
  await search.press('Enter')
  await expect(page.getByTestId('library-grid-search')).toBeVisible()
  await page.getByTestId('library-grid-find').fill('zzzxww')
  await expect(page.getByTestId('library-grid-empty')).toContainText('Try a shorter search or browse a category.')
  await page.getByTestId('library-grid-find').press('Escape')
  await page.getByTestId('library-grid-empty').getByRole('button', { name: 'Tools', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Tools', exact: true })).toBeVisible()
})

test('the designed error state retries a catalogue outage without losing Discover', async ({ page, open, models }) => {
  models.failWith = 502
  await open('/library?view=discover')
  await expect(page.getByTestId('library-discover-state')).toBeVisible()
  models.failWith = null
  await page.getByTestId('library-discover-state').getByRole('button', { name: /Try again/ }).click()
  await expect(page.getByTestId('library-featured-hero')).toBeVisible()
})

test('ratings appear only after an explicit capability response', async ({ page, open, catalogue }) => {
  catalogue.ratings = true
  await open('/library?view=discover&category=tools')
  await expect(page.getByTestId('library-grid-cards')).toBeVisible()
  await page.getByTestId('library-browse-filters').click()
  await page.getByLabel('Minimum rating').fill('4')
  await page.getByRole('button', { name: 'Apply filters', exact: true }).click()
  await expect.poll(() => catalogue.urls.at(-1)?.searchParams.get('rating')).toBe('4')
})

test('a suggestions network error still lets the search run', async ({ page, open }) => {
  await page.route('**/v1/public/search/suggestions?*', route => route.abort())
  await open('/library?view=discover')
  await page.getByTestId('library-discover-find').fill('Print')
  await expect(page.getByTestId('library-suggestions')).toContainText(/fetch|Network|network|Load failed/)
  await page.getByTestId('library-discover-find').press('Enter')
  await expect(page.getByTestId('library-grid-cards')).toBeVisible()
})
