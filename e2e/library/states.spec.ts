/**
 * Library states (v3, page 12): every empty, loading and error state is the
 * same tile in the same place: an icon, one line, one more, at most one
 * button. Signed out, being deleted, not answering; and an action that failed
 * is said in the page, not at its foot.
 */
import { test, expect } from '../fixtures'
import { ownItem } from '../fakes/models'

test('signed out, Yours is one tile with Sign in', async ({ page, open }) => {
  await open('/library?view=mine')
  const tile = page.getByTestId('library-signed-out')
  await expect(tile).toContainText('Sign in to see yours')
  await expect(tile.getByRole('button')).toHaveText('Sign in')
  await expect(tile.getByRole('button')).toHaveCount(1)
})

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('a Library being deleted says when, with Keep my Library', async ({ page, models, open }) => {
    models.libraryOff = 'deleting'
    await open('/library?view=mine')
    const tile = page.getByTestId('library-off')
    await expect(tile).toContainText('Your Library is being deleted')
    await expect(tile).toContainText('Turn it back on before then to keep it.')
    await expect(tile.getByRole('button', { name: 'Keep my Library' })).toBeVisible()
    // No old "Turn it on" panel, and no second error line at the foot.
    await expect(page.getByText('Your Library is off')).toHaveCount(0)
  })

  test('a Library that did not answer says so in one tile, and Try again reads it', async ({ page, models, open }) => {
    models.items.push(ownItem('a', { name: 'Desk bracket' }))
    let down = true
    models.failOn = request => down && request.startsWith('GET /v1/library') && !request.startsWith('GET /v1/library/') ? 503 : null
    await open('/library?view=mine')
    const tile = page.getByTestId('library-error')
    await expect(tile).toContainText('Your Library didn\'t answer')
    down = false
    await tile.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByTestId('library-shelf-sliced')).toContainText('Desk bracket')
    await expect(page.getByTestId('library-error')).toHaveCount(0)
  })
})
