/**
 * The site's Print button (`/library?view=discover&print=<id>&do=print`): the
 * model's page opens Print on… once, signed in, with no printer preselected.
 * Handled, `do` leaves the address and the model's page stays, so a reload or
 * Back opens nothing; a fresh click opens it again. A bare `print=<id>` (a
 * shared model link, a reload, a model opened inside Control) only shows the
 * model. Signed out the page opens with no chooser, and signing in opens it.
 */
import { test, expect } from '../fixtures'
import { signIn } from '../fakes/console'
import type { Page } from '@playwright/test'

const P11 = 10

const dialog = (page: Page) => page.getByTestId('print-on')
const title = (page: Page) => page.getByTestId('library-print-title')

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('do=print opens the model\'s page and Print on… once; do leaves the address, a reload opens nothing', async ({ page, models, open }) => {
    const id = models.publications[P11].id
    await open(`/library?view=discover&print=${id}&do=print`)
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toBeVisible()
    await expect(dialog(page).getByRole('heading', { name: 'Print 11' })).toBeVisible()
    await expect(page).not.toHaveURL(/do=print/)
    await expect(page).toHaveURL(new RegExp(`print=${id}`))
    await page.getByTestId('print-on-cancel').click()
    await expect(dialog(page)).toBeHidden()
    await expect(title(page)).toHaveText('Print 11')
    await page.reload()
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toHaveCount(0)
  })

  test('a bare print=<id> only shows the model', async ({ page, models, open }) => {
    await open(`/library?view=discover&print=${models.publications[P11].id}`)
    await expect(title(page)).toHaveText('Print 11')
    await expect(page.getByTestId('library-print-print')).toBeVisible()
    await expect(dialog(page)).toHaveCount(0)
  })

  test('a related model opened from the page opens nothing, and nor does Back to the first', async ({ page, models, open }) => {
    const id = models.publications[P11].id
    models.publications[2].make_of = id
    await open(`/library?view=discover&print=${id}&do=print`)
    await expect(dialog(page)).toBeVisible()
    await page.getByTestId('print-on-cancel').click()
    await page.getByTestId('library-shelf-makes').getByRole('button', { name: 'Quick look at Print 3' }).first().click()
    await page.getByTestId('library-quick-look-page').click()
    // The cancelled dialog stays in the page, hidden (Vuetify keeps its content): not shown is what counts.
    await expect(title(page)).toHaveText('Print 3')
    await expect(dialog(page)).toBeHidden()
    await page.goBack()
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toBeHidden()
  })

  test('a second click of the link opens it again', async ({ page, models, open }) => {
    const id = models.publications[P11].id
    await open(`/library?view=discover&print=${id}&do=print`)
    await expect(dialog(page)).toBeVisible()
    await page.getByTestId('print-on-cancel').click()
    await open(`/library?view=discover&print=${id}&do=print`)
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toBeVisible()
  })
})

test.describe('signed out', () => {
  test('the page opens with no chooser and keeps do; signing in opens it once', async ({ page, models, open }) => {
    const id = models.publications[P11].id
    await open(`/library?view=discover&print=${id}&do=print`)
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toHaveCount(0)
    await expect(page).toHaveURL(/do=print/)
    await signIn(page)
    await page.reload()
    await expect(dialog(page)).toBeVisible()
    await page.getByTestId('print-on-cancel').click()
    await page.reload()
    await expect(title(page)).toHaveText('Print 11')
    await expect(dialog(page)).toHaveCount(0)
  })
})
