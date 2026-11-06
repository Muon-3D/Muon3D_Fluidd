/**
 * A collection's page (Library v3, page 8): a tile on Yours opens it; it
 * shows its prints in your order; Private/Public and Rename change it; your
 * order changes by dragging or Alt + arrows and is kept; a card's quick
 * look takes it out; Delete sits in ··· and asks first.
 */
import { test, expect } from '../fixtures'
import type { ModelServiceState } from '../fakes/models'
import type { Page } from '@playwright/test'

test.use({ signedIn: true })

/** Workshop holds Print 1, 2 and 3, saved in that order. */
function stock (models: ModelServiceState) {
  for (const n of [0, 1, 2]) models.saves.push({ id: `save-${n + 1}`, target: models.publications[n].id })
  models.collections.push({ id: 'col-1', name: 'Workshop', items: ['save-1', 'save-2', 'save-3'] })
}

const titles = (page: Page) => page.getByTestId('library-collection-cards').locator('.mcard__title')

async function openWorkshop (page: Page, open: (path: string) => Promise<void>) {
  await open('/library?view=mine')
  await page.getByTestId('library-collection-col-1').click()
  await expect(page.getByTestId('library-collection-title')).toHaveText('Workshop')
}

test('a tile opens the collection on its own page, and Back returns to Yours', async ({ page, models, open }) => {
  stock(models)
  await openWorkshop(page, open)
  await expect(page).toHaveURL(/collection=col-1/)
  await expect(page.getByTestId('library-collection-line')).toContainText('3 prints · private')
  await expect(titles(page)).toHaveText(['Print 1', 'Print 2', 'Print 3'])
  // Nothing on it is wider than the screen (a wider page pushed the quick look off a phone).
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.goBack()
  await expect(page.getByTestId('library-yours-shelves')).toBeVisible()
  await page.goForward()
  await expect(page.getByTestId('library-collection-title')).toHaveText('Workshop')
  await page.getByTestId('library-collection-back').click()
  await expect(page.getByTestId('library-yours-shelves')).toBeVisible()
  await expect(page).not.toHaveURL(/collection=/)
})

test('Public and Rename change it, and Yours shows the new name', async ({ page, models, open }) => {
  stock(models)
  await openWorkshop(page, open)
  await page.getByTestId('library-collection-public').click()
  await expect(page.getByTestId('library-collection-public')).toHaveAttribute('aria-pressed', 'true')
  expect(models.collections[0].visibility).toBe('public')
  await page.getByTestId('library-collection-rename').click()
  await page.getByTestId('library-collection-rename-input').fill('Garage')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('library-collection-title')).toHaveText('Garage')
  expect(models.collections[0].name).toBe('Garage')
  await page.getByTestId('library-collection-back').click()
  await expect(page.getByTestId('library-collection-col-1')).toContainText('Garage')
})

test('your order: Alt + → moves a print, and the new order is kept', async ({ page, models, open }) => {
  stock(models)
  await openWorkshop(page, open)
  await page.getByTestId('library-collection-cell-0').focus()
  await page.keyboard.press('Alt+ArrowRight')
  await expect(titles(page)).toHaveText(['Print 2', 'Print 1', 'Print 3'])
  await expect.poll(() => models.collections[0].items).toEqual(['save-2', 'save-1', 'save-3'])
  // Kept: read again from the service.
  await page.reload()
  await expect(titles(page)).toHaveText(['Print 2', 'Print 1', 'Print 3'])
})

test('your order: dragging a print onto another puts it there', async ({ page, models, open, isMobile }) => {
  test.skip(!!isMobile, 'Dragging is a pointer gesture; a phone uses the arrows.')
  stock(models)
  await openWorkshop(page, open)
  await page.getByTestId('library-collection-cell-2').dragTo(page.getByTestId('library-collection-cell-0'))
  await expect(titles(page)).toHaveText(['Print 3', 'Print 1', 'Print 2'])
  await expect.poll(() => models.collections[0].items).toEqual(['save-3', 'save-1', 'save-2'])
})

test('Recent and Name sort without changing your order', async ({ page, models, open }) => {
  stock(models)
  models.collections[0].items = ['save-3', 'save-1', 'save-2']
  await openWorkshop(page, open)
  await expect(titles(page)).toHaveText(['Print 3', 'Print 1', 'Print 2'])
  await page.getByTestId('library-collection-sort-name').click()
  await expect(titles(page)).toHaveText(['Print 1', 'Print 2', 'Print 3'])
  expect(models.collections[0].items).toEqual(['save-3', 'save-1', 'save-2'])
})

test('a card\'s quick look takes it out of the collection; it stays saved', async ({ page, models, open }) => {
  stock(models)
  await openWorkshop(page, open)
  await page.getByTestId('library-collection-cards').getByRole('button', { name: 'Quick look at Print 2' }).first().click()
  await page.getByTestId('library-quick-look-uncollect').click()
  await expect(page.getByTestId('library-quick-look')).toHaveCount(0)
  await expect(titles(page)).toHaveText(['Print 1', 'Print 3'])
  expect(models.collections[0].items).toEqual(['save-1', 'save-3'])
  expect(models.saves.map(s => s.id)).toContain('save-2')
})

test('Delete is in ··· and asks first; Keep it keeps it, Delete goes back to Yours without it', async ({ page, models, open }) => {
  stock(models)
  await openWorkshop(page, open)
  await page.getByTestId('library-collection-more').click()
  await page.getByTestId('library-collection-delete').click()
  await expect(page.getByTestId('library-collection-confirm')).toContainText('The prints in it stay saved')
  await page.getByRole('button', { name: 'Keep it' }).click()
  expect(models.collections).toHaveLength(1)
  await page.getByTestId('library-collection-more').click()
  await page.getByTestId('library-collection-delete').click()
  await page.getByTestId('library-collection-confirm-delete').click()
  await expect(page.getByTestId('library-yours-shelves')).toBeVisible()
  await expect(page.getByTestId('library-collection-col-1')).toHaveCount(0)
  expect(models.collections).toHaveLength(0)
  expect(models.saves).toHaveLength(3)
})

test('an empty collection says how to fill it, and one that could not be read says so with Try again', async ({ page, models, open }) => {
  models.collections.push({ id: 'col-1', name: 'Empty', items: [] })
  await open('/library?view=mine&collection=col-1')
  await expect(page.getByTestId('library-collection-empty')).toContainText('Add a print from its quick look')
  let down = true
  models.failOn = request => down && request.startsWith('GET /v1/community/collections/col-1') ? 503 : null
  await page.reload()
  await expect(page.getByTestId('library-collection-error')).toBeVisible()
  down = false
  await page.getByTestId('library-collection-error').getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByTestId('library-collection-empty')).toBeVisible()
})
