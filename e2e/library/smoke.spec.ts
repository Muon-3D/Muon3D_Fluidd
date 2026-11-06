/**
 * Harness smoke: Control loads against the mock printer, the Library reads
 * the fake model service, and a signed-in session reaches Yours. Page tests
 * live beside this one (e2e/library/<page>.spec.ts, e2e/control/...).
 */
import { test, expect } from '../fixtures'

test('Discover shows shelves and the feed from the model service, signed out', async ({ page, open }) => {
  await open('/library?view=discover')
  await expect(page.getByTestId('library-shelf-popular')).toBeVisible()
  await expect(page.getByTestId('library-feed')).toContainText('Print 1')
  // "Fits Boxwood" is on in Control: Popular holds M1 prints (the odd ones here).
  await page.getByTestId('library-shelf-popular').getByRole('button', { name: 'Quick look at Print 11' }).first().click()
  await expect(page.getByTestId('library-quick-look')).toContainText('Print 11')
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('library-quick-look')).toHaveCount(0)
})

test('Discover says so when the model service is down, and Try again recovers', async ({ page, models, open }) => {
  models.failWith = 503
  await open('/library?view=discover')
  await expect(page.getByRole('alert')).toContainText('Discover didn\'t answer')
  models.failWith = null
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByTestId('library-shelf-popular')).toBeVisible()
})

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('Yours shows collections and what you saved', async ({ page, models, open }) => {
    models.saves.push({ id: 'save-1', target: models.publications[0].id })
    models.collections.push({ id: 'col-1', name: 'Workshop', items: ['save-1'] })
    await open('/library?view=mine')
    await expect(page.getByTestId('library-yours-shelves')).toBeVisible()
    await expect(page.getByTestId('library-collection-col-1')).toContainText('Workshop')
    await expect(page.getByTestId('library-saved')).toContainText('Print 1')
  })
})
