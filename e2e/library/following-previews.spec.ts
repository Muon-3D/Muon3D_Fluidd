/**
 * KAN-3598: Following asks the model service for the right thing, a service
 * that cannot read the address is told plainly (not in its sentence about "the
 * JSON body"), and previews draw: your own prints' and Discover's.
 * KAN-3599: the Library opened from All printers stays without a printer.
 */
import { test, expect, PRINTER } from '../fixtures'
import { ownItem } from '../fakes/models'

/** Goes to a page by its nav link: the rail on a desktop, the More sheet's row on a phone. */
async function go (page: import('@playwright/test').Page, isMobile: boolean, name: string, more: string) {
  if (isMobile) {
    await page.getByTestId('tab-more').click()
    await page.getByTestId(more).click()
  } else {
    await page.getByRole('link', { name, exact: true }).first().click()
  }
}
const drawn = (img: import('@playwright/test').Locator) => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('Following asks GET /v1/community/collections/followed with the assertion and no body, and lists what it answers', async ({ page, models, open }) => {
    models.others.push({ id: 'other-1', name: 'Maker picks', items: [models.publications[0].id], visibility: 'public' })
    models.follows.push('other-1')
    const asked = page.waitForRequest(r => r.url().endsWith('/models/v1/community/collections/followed'))
    await open('/library?view=mine')
    const request = await asked
    expect(request.method()).toBe('GET')
    expect(request.postData()).toBeNull()
    expect(request.headers().authorization).toMatch(/^Bearer .+/)
    expect(request.headers()['content-type']).toBeUndefined()
    await expect(page.getByTestId('library-following-other-1')).toContainText('Maker picks')
  })

  test('a service that reads the address as a collection says Following is not available, not its sentence about the JSON body', async ({ page, models, open }) => {
    models.followedReadAsId = true
    await open('/library?view=mine')
    const following = page.getByTestId('library-following')
    await expect(following).toContainText('Following is not available from the Library yet')
    await expect(following).not.toContainText('JSON body')
    // The rest of Yours keeps working.
    await expect(page.getByTestId('library-collections')).toBeVisible()
  })

  test('your own prints\' previews draw', async ({ page, models, open }) => {
    models.items.push(ownItem('a', { name: 'Hex planter' }), ownItem('b', { name: 'Desk bracket' }))
    await open('/library?view=mine')
    const pictures = page.getByTestId('library-shelf-sliced').locator('.mcard__pic img')
    await expect(pictures).toHaveCount(2)
    for (const i of [0, 1]) await expect.poll(() => drawn(pictures.nth(i))).toBe(true)
  })

  test('Library from All printers opens at /library with no printer, and the printer pages stay a click away', async ({ page, open, isMobile }) => {
    await open(`${PRINTER}`)
    await go(page, isMobile, 'All printers', 'more-all-printers')
    await expect(page).toHaveURL(/\/$/)
    // On All printers the Library is the header's own button.
    await page.getByTestId('header-library').click()
    await expect(page.getByTestId('library-page')).toBeVisible()
    await expect(page).toHaveURL(/\/library$/)
    expect(new URL(page.url()).pathname).not.toContain('boxwood')
    // No printer is open: Print on is not offered a printer by name.
    await expect(page.getByTestId('library-page')).not.toContainText('Boxwood')
    // From a printer's own page, the Library stays beside that printer.
    await page.goto(`${PRINTER}/jobs`)
    await go(page, isMobile, 'Library', 'more-library')
    await expect(page).toHaveURL(new RegExp(`${PRINTER}/library$`))
  })
})

test('Discover previews draw', async ({ page, open }) => {
  await open('/library?view=discover')
  const pictures = page.getByTestId('library-shelf-popular').locator('.mcard__pic img')
  await expect(pictures.first()).toBeVisible()
  await expect.poll(() => drawn(pictures.first())).toBe(true)
})
