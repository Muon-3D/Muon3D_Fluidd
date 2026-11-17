/**
 * One of your prints (Library v3, page 9): ‹ Yours, its name and what
 * happened to it; Open in Slice once, the rest in ···; one Print tile with
 * your printers and one primary; its Versions and when it Printed. When it
 * can't be read it says why, with Retry, instead of reading for ever.
 */
import { test, expect } from '../fixtures'
import { ownItem, type ModelServiceState } from '../fakes/models'
import type { Page } from '@playwright/test'

test.use({ signedIn: true })

/** Desk bracket, printed twice: once on Walnut (finished), once on Hazel (stopped). */
function stock (models: ModelServiceState) {
  models.items.push(ownItem('a', { name: 'Desk bracket', material: 'PETG' }), ownItem('b', { name: 'Other' }))
  models.runs.push(
    { id: 'r1', item: 'a', printer: 'Walnut', started_at: '2026-11-05T09:00:00Z', outcome: 'finished' },
    { id: 'r2', item: 'a', printer: 'Hazel', started_at: '2026-11-04T09:00:00Z', outcome: 'cancelled' },
    { id: 'r3', item: 'b', printer: 'Walnut', started_at: '2026-11-03T09:00:00Z', outcome: 'finished' }
  )
}

const tile = (page: Page) => page.getByTestId('library-own-print-tile')

test('from Yours: ‹ Yours, its name and line, one Print tile, Open in Slice once, Versions and Printed', async ({ page, models, open }) => {
  stock(models)
  await open('/library?view=mine')
  await page.getByTestId('library-shelf-sliced').getByRole('button', { name: 'Open Desk bracket' }).first().click()
  await expect(page.getByTestId('library-print-name')).toHaveText('Desk bracket')
  await expect(page.getByTestId('library-own-line')).toContainText('Version 3 · saved from Slice')
  // One Open in Slice, one Print.
  await expect(page.getByRole('button', { name: 'Open in Slice' })).toHaveCount(1)
  await expect(page.getByTestId('library-print-on')).toHaveCount(1)
  await expect(tile(page)).toContainText('Material')
  await expect(tile(page)).toContainText('PETG')
  // No printers in the fake account: the tile says so, with where to add one.
  await expect(tile(page).getByRole('link', { name: 'Add a printer ›' })).toBeVisible()
  const versions = page.getByTestId('library-versions')
  await expect(versions.locator('.lprint__row')).toHaveCount(3)
  await expect(versions.locator('.lprint__row').first()).toContainText('Version 3')
  await expect(versions.locator('.lprint__row').first()).toContainText('Current')
  await expect(versions.getByTestId('library-restore')).toHaveCount(2)
  const printed = page.getByTestId('library-own-printed')
  await expect(printed.locator('.lprint__row')).toHaveCount(2)
  await expect(printed.locator('.lprint__row').first()).toContainText('Walnut')
  await expect(printed.locator('.lprint__row').first()).toContainText('Done')
  await expect(printed.locator('.lprint__row').nth(1)).toContainText('Stopped')
  await page.getByTestId('library-own-back').click()
  await expect(page.getByTestId('library-yours-shelves')).toBeVisible()
})

test('Print on… opens for this print; ··· holds Rename, the downloads and Delete', async ({ page, models, open }) => {
  stock(models)
  await open('/library/a')
  await page.getByTestId('library-print-on').click()
  await expect(page.getByTestId('print-on').getByRole('heading', { name: 'Desk bracket' })).toBeVisible()
  await page.getByTestId('print-on-cancel').click()
  await page.getByTestId('library-print-more').click()
  await expect(page.getByTestId('library-rename')).toBeVisible()
  await expect(page.getByTestId('library-download-gcode')).toBeVisible()
  await expect(page.getByTestId('library-delete')).toContainText('Delete…')
})

test('Delete asks first; Delete takes it out of your Library and back to Yours', async ({ page, models, open }) => {
  stock(models)
  await open('/library/a')
  await page.getByTestId('library-print-more').click()
  await page.getByTestId('library-delete').click()
  await expect(page.getByText('Delete Desk bracket?')).toBeVisible()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await expect(page.getByTestId('library-yours-shelves')).toBeVisible()
  expect(models.items.map(i => i.id)).toEqual(['b'])
})

test('a print that is gone says so, with the way back to Yours', async ({ page, models, open }) => {
  stock(models)
  await open('/library/zzz')
  await expect(page.getByTestId('library-print-missing')).toContainText('This print isn\'t in your Library')
})

test('when the Library does not answer it says so with Try again, not that the print is gone', async ({ page, models, open }) => {
  stock(models)
  let down = true
  // The synced list would have it, so the list fails too: then the print itself is asked for, and fails.
  models.failOn = request => down && request.startsWith('GET /v1/items') ? 503 : null
  await open('/library/a')
  await expect(page.getByTestId('library-own-error')).toBeVisible()
  await expect(page.getByTestId('library-print-missing')).toHaveCount(0)
  down = false
  await page.getByTestId('library-own-retry').click()
  await expect(page.getByTestId('library-print-name')).toHaveText('Desk bracket')
})

test('with the Library off it says so, instead of reading for ever', async ({ page, models, open }) => {
  stock(models)
  models.libraryOff = true
  await open('/library/a')
  await expect(page.getByTestId('library-own-off')).toContainText('Your Library is off')
})
