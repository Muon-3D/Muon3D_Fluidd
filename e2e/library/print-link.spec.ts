/**
 * The site's Print link (`/library?view=discover&print=<id>`): signed in, the
 * model's page opens and Print on… opens once over it. A reload or Back does
 * not open it again; signed out the page opens with no chooser.
 */
import { test, expect } from '../fixtures'

const P11 = 10

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('opens the model\'s page and Print on… once; a reload does not open it again', async ({ page, models, open }) => {
    const id = models.publications[P11].id
    await open(`/library?view=discover&print=${id}`)
    await expect(page.getByTestId('library-print-title')).toHaveText('Print 11')
    await expect(page.getByTestId('print-on')).toBeVisible()
    await expect(page.getByTestId('print-on').getByRole('heading', { name: 'Print 11' })).toBeVisible()
    await page.getByTestId('print-on-cancel').click()
    await expect(page.getByTestId('print-on')).toBeHidden()
    // The model's page is still the place the person is on.
    await expect(page.getByTestId('library-print-title')).toHaveText('Print 11')
    await page.reload()
    await expect(page.getByTestId('library-print-title')).toHaveText('Print 11')
    await expect(page.getByTestId('print-on')).toHaveCount(0)
  })
})

test.describe('signed out', () => {
  test('the model\'s page opens with no chooser', async ({ page, models, open }) => {
    const id = models.publications[P11].id
    await open(`/library?view=discover&print=${id}`)
    await expect(page.getByTestId('library-print-title')).toHaveText('Print 11')
    await expect(page.getByTestId('print-on')).toHaveCount(0)
  })
})
