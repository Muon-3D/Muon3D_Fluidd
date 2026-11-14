/**
 * Following public collections (Library M6): someone else's public collection
 * opens read-only with Follow / Following; a followed one appears in Yours >
 * Following, and Unfollow there takes it off again. Signed out it says Sign in
 * to follow; a private or missing one is "not available".
 */
import { test, expect } from '../fixtures'
import type { ModelServiceState } from '../fakes/models'

function stock (models: ModelServiceState) {
  models.others.push({ id: 'other-1', name: 'Maker picks', items: [models.publications[0].id, models.publications[1].id], visibility: 'public' })
}

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('Follow a public collection, see it in Yours > Following, Unfollow removes it', async ({ page, models, open }) => {
    stock(models)
    await open('/library?view=mine&collection=other-1')
    await expect(page.getByTestId('library-collection-title')).toHaveText('Maker picks')
    await expect(page.getByTestId('library-collection-cards').locator('.mcard__title')).toHaveText(['Print 1', 'Print 2'])
    // Read-only: none of your own collection's controls.
    await expect(page.getByTestId('library-collection-rename')).toHaveCount(0)
    const follow = page.getByTestId('library-collection-follow')
    await expect(follow).toHaveText('Follow')
    await expect(follow).toHaveAttribute('aria-pressed', 'false')
    await follow.click()
    await expect(follow).toHaveText('Following')
    await expect(follow).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(() => models.follows).toEqual(['other-1'])

    await page.getByTestId('library-collection-back').click()
    const row = page.getByTestId('library-following-other-1')
    await expect(row).toContainText('Maker picks')
    await expect(row).toContainText('2 prints')
    // The shelf's tile opens the public view again, already Following.
    await page.getByTestId('library-following-open-other-1').click()
    await expect(page.getByTestId('library-collection-follow')).toHaveAttribute('aria-pressed', 'true')
    await page.getByTestId('library-collection-back').click()

    await page.getByTestId('library-following-unfollow-other-1').click()
    await expect(page.getByTestId('library-following-other-1')).toHaveCount(0)
    await expect(page.getByTestId('library-shelf-following-empty')).toContainText('You don\'t follow any collections yet.')
    await expect.poll(() => models.follows).toEqual([])
  })

  test('Unfollow from the collection view updates the shelf', async ({ page, models, open }) => {
    stock(models)
    models.follows.push('other-1')
    await open('/library?view=mine&collection=other-1')
    const follow = page.getByTestId('library-collection-follow')
    await expect(follow).toHaveAttribute('aria-pressed', 'true')
    await follow.click()
    await expect(follow).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => models.follows).toEqual([])
    await page.getByTestId('library-collection-back').click()
    await expect(page.getByTestId('library-shelf-following-empty')).toBeVisible()
  })

  test('the service\'s limit text shows, and Follow goes back', async ({ page, models, open }) => {
    stock(models)
    models.followLimit = true
    await open('/library?view=mine&collection=other-1')
    const follow = page.getByTestId('library-collection-follow')
    await follow.click()
    await expect(page.getByTestId('library-collection-note')).toHaveText('You can follow up to 500 collections.')
    await expect(follow).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => models.follows).toEqual([])
  })

  test('your own public collection has no Follow', async ({ page, models, open }) => {
    models.saves.push({ id: 'save-1', target: models.publications[0].id })
    models.collections.push({ id: 'col-1', name: 'Workshop', items: ['save-1'], visibility: 'public' })
    await open('/library?view=mine&collection=col-1')
    await expect(page.getByTestId('library-collection-title')).toHaveText('Workshop')
    await expect(page.getByTestId('library-collection-follow')).toHaveCount(0)
  })

  test('a private or missing collection says it is not available', async ({ page, open }) => {
    await open('/library?view=mine&collection=nobody-1')
    await expect(page.getByTestId('library-collection-unavailable')).toContainText('This collection is not available.')
    await expect(page.getByTestId('library-collection-follow')).toHaveCount(0)
  })
})

test.describe('signed out', () => {
  test('the public view reads, and Follow asks to sign in', async ({ page, models, open }) => {
    stock(models)
    await open('/library?view=mine&collection=other-1')
    await expect(page.getByTestId('library-collection-title')).toHaveText('Maker picks')
    await expect(page.getByTestId('library-collection-sign-in')).toHaveText('Sign in to follow')
    await expect(page.getByTestId('library-collection-follow')).toHaveCount(0)
  })
})
