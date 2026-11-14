/**
 * The site's Print link (`/library?view=discover&print=<id>`): only that
 * arrival opens Print on… (once, signed in, with no printer preselected).
 * Back, a reload, and a model opened inside Control open nothing; a second
 * click of the link, or signing in and coming back to it, opens it again.
 * Signed out the page opens with its sign-in prompt and no chooser.
 */
import { test, expect } from '../fixtures'
import { signIn } from '../fakes/console'
import type { Page } from '@playwright/test'

const P11 = 10

const dialog = (page: Page) => page.getByTestId('print-on')
const title = (page: Page) => page.getByTestId('library-print-title')

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('opens the model\'s page and Print on… once; a reload does not open it again', async ({ page, models, open }) => {
    const id = models.publications[P11].id
    await open(`/library?view=discover&print=${id}`)
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page).getByRole('heading', { name: 'Print 11' })).toBeVisible()
    await page.getByTestId('print-on-cancel').click()
    await expect(dialog(page)).toBeHidden()
    // The model's page is still where the person is.
    await expect(title(page)).toHaveText('Print 11')
    await page.reload()
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toHaveCount(0)
  })

  test('a related model opened from the page opens nothing, and nor does Back to the first', async ({ page, models, open }) => {
    const id = models.publications[P11].id
    models.publications[2].make_of = id
    await open(`/library?view=discover&print=${id}`)
    await expect(dialog(page)).toBeVisible()
    await page.getByTestId('print-on-cancel').click()
    await page.getByTestId('library-shelf-makes').getByRole('button', { name: 'Quick look at Print 3' }).first().click()
    await page.getByTestId('library-quick-look-page').click()
    await expect(title(page)).toHaveText('Print 3')
    await expect(dialog(page)).toHaveCount(0)
    await page.goBack()
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toHaveCount(0)
  })

  test('a model opened inside Control and reloaded opens nothing', async ({ page, open }) => {
    await open('/library?view=discover')
    await page.getByTestId('library-shelf-popular').getByRole('button', { name: 'Quick look at Print 11' }).first().click()
    await page.getByTestId('library-quick-look-page').click()
    await expect(title(page)).toHaveText('Print 11')
    await page.reload()
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toHaveCount(0)
  })

  test('a second click of the link opens it again', async ({ page, models, open }) => {
    const id = models.publications[P11].id
    await open(`/library?view=discover&print=${id}`)
    await expect(dialog(page)).toBeVisible()
    await page.getByTestId('print-on-cancel').click()
    await open(`/library?view=discover&print=${id}`)
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toBeVisible()
  })
})

test.describe('signed out', () => {
  test('the page opens with no chooser; signing in and coming back opens it once', async ({ page, models, open }) => {
    const id = models.publications[P11].id
    await open(`/library?view=discover&print=${id}`)
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toHaveCount(0)
    await signIn(page)
    await page.reload()
    await expect(dialog(page)).toBeVisible()
    await page.getByTestId('print-on-cancel').click()
    await page.reload()
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toHaveCount(0)
  })
})
