/**
 * One profile photo across Control (KAN-1826): the top bar's account button
 * shows your photo from the authenticated GET /v1/community/profile/avatar
 * (initials when the Library has none), follows a change made on
 * Account › Profile at once, and lets go of it on sign-out.
 *
 * Console and model service are the fakes (e2e/fakes/console.ts, models.ts),
 * served at Control's own address as account-profile.spec.ts does.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { answerConsole, type ConsoleState } from '../fakes/console'
import { fakeCommunity, PNG_1X1, type ModelServiceState } from '../fakes/models'
import { VITE_PORT } from '../ports'

test.use({ signedIn: true })

const ORIGIN = `http://localhost:${VITE_PORT}`
const ADULT = { declared_age: 34, declared_at: 1_790_000_000, can_community: true, can_public: true, identity_public: false, revision: 1, projection_pending: false }
const PNG = Buffer.from(PNG_1X1, 'base64')

async function openProfile (page: Page, account: ConsoleState, models: ModelServiceState) {
  account.identity ??= { ...ADULT }
  models.community ??= fakeCommunity()
  await page.addInitScript(([url]) => { localStorage.setItem('muon.cloud.url', url) }, [ORIGIN])
  await page.route(`${ORIGIN}/v1/**`, route => answerConsole(route, account))
  await page.goto('/account/profile')
  await ready(page)
  await expect(page.getByTestId('account-profile')).toBeVisible()
}

const face = (page: Page) => page.locator('[data-tid="account-face"]:visible').first()
const avatarReads = (models: ModelServiceState) => models.seen.filter(s => s === 'GET /v1/community/profile/avatar')

test('the top bar shows your photo, read once from the authenticated route', async ({ page, account, models }) => {
  models.avatar = { type: 'image/png', bytes: PNG.length, body: PNG_1X1 }
  await openProfile(page, account, models)
  await expect(face(page).locator('img')).toBeVisible()
  await expect(face(page).locator('img')).toHaveAttribute('src', /^blob:/)
  // The top bar and the Profile page share one read.
  expect(avatarReads(models)).toHaveLength(2) // the top bar's, and the Profile page's refresh after the profile loads
})

test('a 404 from the Library leaves the initials in the top bar', async ({ page, account, models }) => {
  await openProfile(page, account, models)
  await expect(face(page)).toHaveText('J')
  await expect(face(page).locator('img')).toHaveCount(0)
  expect(models.seen).toContain('GET /v1/community/profile/avatar')
})

test('a photo changed on Profile shows in the top bar at once, with no reload', async ({ page, account, models }) => {
  await openProfile(page, account, models)
  await expect(face(page).locator('img')).toHaveCount(0)
  await page.getByTestId('profile-photo-input').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG })
  await expect(face(page).locator('img')).toBeVisible()
  expect(models.seen).toContain('PUT /v1/community/profile/avatar')
})

test('signing out clears the photo from the top bar', async ({ page, account, models, isMobile }) => {
  models.avatar = { type: 'image/png', bytes: PNG.length, body: PNG_1X1 }
  await openProfile(page, account, models)
  await expect(face(page).locator('img')).toBeVisible()
  if (isMobile) await page.getByTestId('account-pane').getByRole('link', { name: 'Account', exact: true }).click()
  await page.getByTestId('account-sign-out').click()
  await expect(page.getByTestId('account-profile')).toHaveCount(0)
  await expect(page.locator('[data-tid="account-face"] img')).toHaveCount(0)
})
