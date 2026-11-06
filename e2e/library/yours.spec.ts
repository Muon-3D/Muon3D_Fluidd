/**
 * Yours (Library v3, page 2): Continue once, Collections, then one shelf each
 * for Sliced, Printed, Saved, Shared by you and Designs, each with See all.
 * No tab row and no chips. What you see and do: each card's button, its
 * page, See all with search and sort, an empty shelf, and a shelf that failed.
 */
import { test, expect } from '../fixtures'
import { ownItem, type ModelServiceState } from '../fakes/models'
import type { Page } from '@playwright/test'

const shelf = (page: Page, id: string) => page.getByTestId(`library-shelf-${id}`)

/** A Library with something on every shelf. */
function stock (models: ModelServiceState) {
  models.items.push(
    ownItem('a', { name: 'Hex planter', updated_at: '2026-11-05T12:00:00Z' }),
    ownItem('b', { name: 'Desk bracket', material: 'PLA', updated_at: '2026-11-04T12:00:00Z' }),
    ownItem('d', { name: 'Ring organiser', origin: 'design', gcode: false })
  )
  models.runs.push({ id: 'r1', item: 'b', printer: 'Walnut', started_at: '2026-11-05T09:00:00Z', outcome: 'finished' })
  models.shares.push({ id: 'sh1', item: 'a', title: 'Hex planter', audience: 'public' }, { id: 'sh2', item: 'b', title: 'Link only', audience: 'link' })
  models.saves.push({ id: 'save-1', target: models.publications[0].id })
}

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('Continue once, Collections, then Sliced, Printed, Saved, Shared by you and Designs; no tabs or chips', async ({ page, models, open }) => {
    stock(models)
    await open('/library?view=mine')
    await expect(page.getByTestId('library-continue')).toContainText('Hex planter')
    await expect(page.getByText('Pick up where you left off')).toHaveCount(0)
    await expect(shelf(page, 'designs')).toContainText('Ring organiser')
    const order = await page.locator('[data-tid="library-yours-shelves"] > section').evaluateAll(els => els.map(e => e.getAttribute('data-tid')))
    expect(order).toEqual(['library-collections', 'library-shelf-sliced', 'library-shelf-printed', 'library-saved', 'library-shelf-shared', 'library-shelf-designs'])
    await expect(shelf(page, 'sliced')).toContainText('Hex planter')
    await expect(shelf(page, 'sliced')).toContainText('Desk bracket')
    await expect(shelf(page, 'printed')).toContainText('on Walnut')
    await expect(page.getByTestId('library-saved')).toContainText('Print 1')
    // Only the public share is one of your published prints.
    await expect(shelf(page, 'shared')).toContainText('Hex planter')
    await expect(shelf(page, 'shared')).not.toContainText('Link only')
    // A published print is printed as the item it shares, once your prints have synced.
    await expect(shelf(page, 'shared').getByRole('button', { name: 'Print on Boxwood: Hex planter' })).toBeVisible()
    // No section tab row: the only tabs are the Discover/Yours switch (the old row added All, Printed, Sliced, Saved).
    await expect(page.getByRole('tab')).toHaveText(['Discover', 'Yours'])
  })

  test('each card does what its button says: Print on Boxwood, Print again, Slice, and its picture opens its page', async ({ page, models, open }) => {
    stock(models)
    await open('/library?view=mine')
    await shelf(page, 'sliced').getByRole('button', { name: 'Print on Boxwood: Hex planter' }).click()
    const dialog = page.getByTestId('print-on')
    await expect(dialog).toContainText('Print from your Library')
    await expect(dialog.getByRole('heading', { name: 'Hex planter' })).toBeVisible()
    // Print on… itself is page 10 (its own e2e); start again without it.
    await open('/library?view=mine')

    await shelf(page, 'printed').getByRole('button', { name: 'Print again: Desk bracket' }).click()
    await expect(page).toHaveURL(/\/print\?library=b&version=1/)
    await page.goBack()

    await shelf(page, 'designs').getByRole('button', { name: 'Slice: Ring organiser' }).click()
    await expect(page).toHaveURL(/\/slice\?library=d/)
    await page.goBack()

    await shelf(page, 'sliced').getByRole('button', { name: 'Open Desk bracket' }).first().click()
    await expect(page).toHaveURL(/\/library\/b(\?|$)/)
  })

  test('Continue prints the last print again, or opens it', async ({ page, models, open }) => {
    stock(models)
    await open('/library?view=mine')
    await page.getByTestId('library-continue-print').click()
    await expect(page.getByTestId('print-on').getByRole('heading', { name: 'Hex planter' })).toBeVisible()
    await open('/library?view=mine')
    await page.getByTestId('library-continue-open').click()
    await expect(page).toHaveURL(/\/library\/a(\?|$)/)
  })

  test('See all opens the whole shelf as a grid with search and sort, and ‹ Yours comes back', async ({ page, models, open }) => {
    for (let i = 1; i <= 14; i++) models.items.push(ownItem(`s${i}`, { name: `Part ${String(i).padStart(2, '0')}`, updated_at: `2026-11-${String(i).padStart(2, '0')}T10:00:00Z` }))
    await open('/library?view=mine')
    // The shelf shows twelve; See all has every one.
    await expect(shelf(page, 'sliced').locator('.mcard')).toHaveCount(12)
    await page.getByTestId('library-shelf-sliced-all').click()
    await expect(page).toHaveURL(/view=mine/)
    await expect(page).toHaveURL(/shelf=sliced/)
    const grid = page.getByTestId('library-grid-sliced')
    await expect(grid.locator('.mcard')).toHaveCount(14)
    await expect(page.getByTestId('library-grid-count')).toHaveText('14 prints')
    await expect(grid.locator('.mcard__title').first()).toHaveText('Part 14')
    await page.getByTestId('library-grid-sort-name').click()
    await expect(grid.locator('.mcard__title').first()).toHaveText('Part 01')
    await page.getByTestId('library-grid-find').fill('part 07')
    await expect(grid.locator('.mcard')).toHaveCount(1)
    await page.getByTestId('library-grid-find').fill('nothing like it')
    await expect(page.getByTestId('library-grid-nomatch')).toBeVisible()
    await page.getByTestId('library-grid-nomatch').getByRole('button', { name: 'Clear search' }).click()
    await expect(grid.locator('.mcard')).toHaveCount(14)
    await page.getByTestId('library-grid-back').click()
    await expect(page.getByTestId('library-yours-shelves')).toBeVisible()
    await expect(page).not.toHaveURL(/shelf=/)
  })

  test('an empty Library says what to do on Sliced, and Open Slice goes there', async ({ page, models, open }) => {
    await open('/library?view=mine')
    await expect(page.getByTestId('library-shelf-sliced-empty')).toContainText('Slice something')
    await expect(page.getByTestId('library-shelf-printed-empty')).toBeVisible()
    await expect(page.getByTestId('library-shelf-saved-empty')).toBeVisible()
    // Shared by you hides once its read has answered with nothing, not merely before it answers.
    await expect.poll(() => models.seen.some(r => r.startsWith('GET /v1/community/shares'))).toBe(true)
    await expect(shelf(page, 'shared')).toHaveCount(0)
    await expect(shelf(page, 'designs')).toHaveCount(0)
    await expect(page.getByTestId('library-continue')).toHaveCount(0)
    await page.getByTestId('library-go-slice').click()
    await expect(page).toHaveURL(/\/slice(\?|$)/)
  })

  test('a shelf that failed says so with Retry, and the others keep working', async ({ page, models, open }) => {
    stock(models)
    let down = true
    models.failOn = request => down && request.startsWith('GET /v1/library/runs') ? 503 : null
    await open('/library?view=mine')
    await expect(page.getByTestId('library-shelf-printed-error')).toBeVisible()
    await expect(shelf(page, 'sliced')).toContainText('Hex planter')
    down = false
    await page.getByTestId('library-shelf-printed-error').getByRole('button', { name: 'Retry' }).click()
    await expect(shelf(page, 'printed')).toContainText('Desk bracket')
  })
})

test.describe('signed in, Library off', () => {
  test.use({ signedIn: true })

  test('Saved and Collections stay; your own shelves and their See all wait for the Library', async ({ page, models, open }) => {
    models.libraryOff = true
    models.saves.push({ id: 'save-1', target: models.publications[0].id })
    await open('/library?view=mine')
    await expect(page.getByTestId('library-saved')).toContainText('Print 1')
    await expect(page.getByTestId('library-collections')).toBeVisible()
    await expect(shelf(page, 'sliced')).toHaveCount(0)
    await open('/library?view=mine&shelf=sliced')
    await expect(page.getByTestId('library-grid-sliced')).toHaveCount(0)
    await expect(page.getByTestId('library-saved')).toBeVisible()
  })
})

test('signed out, Yours asks you to sign in and shows no shelves', async ({ page, open }) => {
  await open('/library?view=mine')
  await expect(page.getByTestId('library-signed-out')).toContainText('Sign in to see yours')
  await expect(page.getByTestId('library-yours-shelves')).toHaveCount(0)
})
