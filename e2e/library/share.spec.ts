/**
 * Share a print (Library v3, page 11): one page of tiles, opened from Yours
 * (Share a print, then choose one) or from one of your prints (Share…).
 * Files come from Yours; Details; Licence and credit; Who can see it.
 * Publish sends it for review. Without a public profile it says where to
 * set one up.
 */
import { test, expect } from '../fixtures'
import { ownItem, type ModelServiceState } from '../fakes/models'
import type { Page } from '@playwright/test'

test.use({ signedIn: true })

function stock (models: ModelServiceState) {
  models.items.push(ownItem('a', { name: 'Desk bracket', material: 'PETG' }), ownItem('d', { name: 'Unsliced idea', gcode: false }))
}

const share = (page: Page) => page.getByTestId('library-share')

test('from one of your prints: Share… fills in the print; Publish sends it for review with what you chose', async ({ page, models, open }) => {
  stock(models)
  await open('/library/a')
  await page.getByTestId('library-own-share').click()
  await expect(share(page).getByRole('heading', { name: 'Share a print' })).toBeVisible()
  await expect(page.getByTestId('library-share-file')).toContainText('Desk bracket · version 3')
  await expect(page.getByTestId('library-share-file')).toContainText('Sliced for M1')
  await expect(page.getByTestId('library-share-title')).toHaveValue('Desk bracket')
  // Nothing goes out until the rights are confirmed.
  const publish = page.getByTestId('library-share-publish')
  await expect(publish).toBeDisabled()
  await page.getByTestId('library-share-description').fill('Clamps to a 25 mm desk.')
  await page.getByTestId('library-share-category-workshop').click()
  await page.getByTestId('library-share-tag').fill('Desk Clamp')
  await page.getByTestId('library-share-tag').press('Enter')
  await page.getByTestId('library-share-licence-choose').selectOption('CC-BY-SA-4.0')
  await page.getByTestId('library-share-rights').click()
  await expect(publish).toBeEnabled()
  await publish.click()
  await expect(page.getByTestId('library-share-done')).toContainText('Sent for review')
  expect(models.published).toEqual([{
    item: 'a',
    body: {
      version: 3,
      title: 'Desk bracket',
      publication: { licence: 'CC-BY-SA-4.0', rights_confirmed: true, category: 'workshop', tags: ['desk-clamp'], description: 'Clamps to a 25 mm desk.', ai_generated: 'no' }
    }
  }])
  await page.getByTestId('library-share-done-back').click()
  await expect(page.getByTestId('library-print-name')).toHaveText('Desk bracket')
})

test('from Yours: Share a print, choose one; a print with no G-code says to slice it first', async ({ page, models, open }) => {
  stock(models)
  await open('/library?view=mine')
  await page.getByTestId('library-share-open').click()
  await expect(page).toHaveURL(/share=new/)
  await page.getByTestId('library-share-choose').selectOption({ label: 'Unsliced idea' })
  await expect(page.getByTestId('library-share-files')).toContainText('no G-code yet')
  await page.getByTestId('library-share-rights').click()
  await expect(page.getByTestId('library-share-publish')).toBeDisabled()
  await page.getByRole('button', { name: 'Change' }).click()
  await page.getByTestId('library-share-choose').selectOption({ label: 'Desk bracket' })
  await expect(page.getByTestId('library-share-title')).toHaveValue('Desk bracket')
  await expect(page.getByTestId('library-share-publish')).toBeEnabled()
  // ‹ Yours goes back without sending anything.
  await page.getByTestId('library-share-back').click()
  await expect(page.getByTestId('library-yours-shelves')).toBeVisible()
  expect(models.published).toEqual([])
})

test('Only me sends nothing: it stays in Yours', async ({ page, models, open }) => {
  stock(models)
  await open('/library?view=mine&share=a')
  await page.getByTestId('library-share-audience-private').click()
  await expect(page.getByTestId('library-share-audience')).toContainText('Only you')
  await page.getByTestId('library-share-publish').click()
  await expect(page.getByTestId('library-yours-shelves')).toBeVisible()
  expect(models.published).toEqual([])
})

test('without a public profile it says so, and where to set one up', async ({ page, models, open }) => {
  stock(models)
  models.profile = 'none'
  await open('/library?view=mine&share=a')
  await expect(page.getByTestId('library-share-setup')).toContainText('Set up your public profile first')
  await expect(page.getByTestId('library-share-setup').getByRole('link', { name: 'Set up your profile' })).toBeVisible()
  // No Publish until it is set up; Check again looks again once it is.
  await expect(page.getByTestId('library-share-publish')).toHaveCount(0)
  models.profile = 'ready'
  await page.getByTestId('library-share-check-again').click()
  await expect(page.getByTestId('library-share-publish')).toBeVisible()
})

test('a publish that fails says why, and nothing is shown as sent', async ({ page, models, open }) => {
  stock(models)
  models.failOn = request => request.startsWith('POST /v1/items/a/publish') ? 503 : null
  await open('/library?view=mine&share=a')
  await page.getByTestId('library-share-rights').click()
  await page.getByTestId('library-share-publish').click()
  await expect(page.getByTestId('library-share-error')).toBeVisible()
  await expect(page.getByTestId('library-share-done')).toHaveCount(0)
})
