/**
 * Account › Profile (Control v3, one identity): the one place to edit the
 * photo, name, @username, about and who can see it, plus the private email
 * and age. Each field is written where it lives: name, privacy and age to
 * the console (/v1/me, /v1/me/community-identity); username, photo and about
 * to the Library service (/v1/community/profile, .../handle, .../avatar).
 *
 * Both services are faked (e2e/fakes/console.ts, models.ts). Account's pages
 * only work where the console serves Control, so the fake console is served
 * at Control's own address, as account-access.spec.ts does.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { answerConsole, type ConsoleState } from '../fakes/console'
import { fakeCommunity, PNG_1X1, type ModelServiceState } from '../fakes/models'
import { VITE_PORT } from '../ports'

test.use({ signedIn: true })

const ORIGIN = `http://localhost:${VITE_PORT}`
const ADULT = { declared_age: 34, declared_at: 1_790_000_000, can_community: true, can_public: true, identity_public: false, revision: 1, projection_pending: false }

async function openProfile (page: Page, account: ConsoleState, models: ModelServiceState, query = '') {
  account.account.created_at = Date.parse('2026-10-14T12:00:00Z') / 1000
  account.identity ??= { ...ADULT }
  models.community ??= fakeCommunity()
  await page.addInitScript(([url]) => { localStorage.setItem('muon.cloud.url', url) }, [ORIGIN])
  await page.route(`${ORIGIN}/v1/**`, route => answerConsole(route, account))
  await page.goto(`/account/profile${query}`)
  await ready(page)
  await expect(page.getByTestId('account-profile')).toBeVisible()
}

const changes = (account: ConsoleState, prefix: string) => account.changes.filter(c => c.call.startsWith(prefix))

test('the page has the header tile and the three groups, and none of the old cards or the Library settings link', async ({ page, account, models }) => {
  await openProfile(page, account, models)
  await expect(page.getByTestId('profile-tile-name')).toHaveText('Jack')
  await expect(page.getByTestId('profile-tile-address')).toHaveText('@jack · library.muon3d.com/@jack')
  await expect(page.getByTestId('profile-tile-visibility')).toHaveText('Private')
  await expect(page.getByTestId('profile-tile-since')).toHaveText('Maker since Oct 2026')
  for (const group of ['Your public profile', 'How others see you', 'Private to you']) {
    await expect(page.getByRole('heading', { name: group })).toBeVisible()
  }
  // The rows: photo, name, username, about, who can see it; then email and age.
  for (const row of ['photo', 'name', 'username', 'about', 'visibility', 'email', 'age']) {
    await expect(page.getByTestId(`profile-row-${row}`)).toBeVisible()
  }
  await expect(page.getByTestId('profile-email')).toHaveText('jack@example.test')
  await expect(page.getByTestId('profile-age')).toHaveText('Over 18')
  // Gone: the two old cards, "your photo is set in Library", and the Library settings link.
  const pane = page.getByTestId('account-pane')
  await expect(pane.getByText('Library identity')).toHaveCount(0)
  await expect(pane.getByText('Account name')).toHaveCount(0)
  await expect(pane.getByText('Your photo is set in Library')).toHaveCount(0)
  await expect(pane.locator('a[href*="library.muon3d.com/#/settings"]')).toHaveCount(0)
})

test('"How others see you" shows the Library card, a person on a printer and the top bar, and follows Public/Private', async ({ page, account, models }) => {
  await openProfile(page, account, models)
  const previews = page.getByTestId('profile-previews')
  await expect(previews).toBeVisible()
  await expect(previews.getByText('Cable clip, 6 mm')).toBeVisible()
  await expect(page.getByTestId('profile-preview-card')).toContainText('a maker')
  await expect(page.getByTestId('profile-preview-person')).toContainText('@jack · Owner')
  await expect(page.getByTestId('profile-preview-topbar')).toContainText('show the same photo and name')
  await page.getByTestId('profile-public').click()
  await expect(page.getByTestId('profile-preview-card')).toContainText('Jack')
})

test('renaming sends PATCH /v1/me and shows "Updating the Library…" until the Library reports the new name', async ({ page, account, models }) => {
  account.identity = { ...ADULT, identity_public: true }
  models.community = fakeCommunity({ identity_public: true })
  await openProfile(page, account, models)
  await page.getByTestId('profile-name-change').click()
  await page.getByTestId('account-name').fill('Jack Smith')
  await page.getByTestId('account-name-save').click()
  await expect(page.getByTestId('profile-name-value')).toHaveText('Jack Smith')
  expect(changes(account, 'PATCH /v1/me')[0]).toEqual({ call: 'PATCH /v1/me', body: { name: 'Jack Smith' } })
  await expect(page.getByTestId('profile-updating')).toHaveText('Updating the Library…')
  await expect(page.getByTestId('profile-tile-name')).toHaveText('Jack Smith')
  // The projection lands: the Library's copy of the name is now the new one.
  models.community!.public_name = 'Jack Smith'
  await expect(page.getByTestId('profile-updating')).toHaveCount(0, { timeout: 15_000 })
})

test('renaming while Private does not wait for a name the Library never reports', async ({ page, account, models }) => {
  models.community = fakeCommunity({ public_name: null, identity_public: false })
  await openProfile(page, account, models)
  await page.getByTestId('profile-name-change').click()
  await page.getByTestId('account-name').fill('Jack Smith')
  await page.getByTestId('account-name-save').click()
  await expect(page.getByTestId('profile-tile-name')).toHaveText('Jack Smith')
  expect(changes(account, 'PATCH /v1/me')[0].body).toEqual({ name: 'Jack Smith' })
  await expect(page.getByTestId('profile-saved')).toBeVisible()
  await expect(page.getByTestId('profile-updating')).toHaveCount(0)
  // And it stays gone: nothing is polling for a name that never comes.
  await page.waitForTimeout(4000)
  await expect(page.getByTestId('profile-updating')).toHaveCount(0)
})

test('the console refusing a rename is said in words, and the old name stays', async ({ page, account, models }) => {
  account.failOn = request => request === 'PATCH /v1/me' ? 500 : null
  await openProfile(page, account, models)
  await page.getByTestId('profile-name-change').click()
  await page.getByTestId('account-name').fill('Jack Smith')
  await page.getByTestId('account-name-save').click()
  await expect(page.getByTestId('profile-name-error')).toContainText('service answered')
  await expect(page.getByTestId('profile-tile-name')).toHaveText('Jack')
  await expect(page.getByTestId('profile-updating')).toHaveCount(0)
})

test.describe('username', () => {
  test('a free username shows Free and where the page moves, then saves with PUT .../handle', async ({ page, account, models }) => {
    await openProfile(page, account, models)
    await page.getByTestId('profile-username-change').click()
    await page.getByTestId('community-handle').fill('jacksmith')
    await expect(page.getByTestId('profile-handle-status')).toHaveText('Free')
    await expect(page.getByTestId('profile-handle-note')).toContainText('Your page moves to library.muon3d.com/@jacksmith. Links to @jack keep working for 12 months. You can change it again on')
    await page.getByTestId('community-claim').click()
    await expect(page.getByTestId('profile-username-value')).toHaveText('@jacksmith')
    await expect(page.getByTestId('profile-tile-address')).toHaveText('@jacksmith · library.muon3d.com/@jacksmith')
    expect(models.seen).toContain('PUT /v1/community/profile/handle')
    expect(models.communityWrites).toContainEqual({ call: 'PUT /v1/community/profile/handle', body: { handle: 'jacksmith' } })
    expect(models.community!.handle).toBe('jacksmith')
  })

  test('a taken username says so and cannot be saved', async ({ page, account, models }) => {
    await openProfile(page, account, models)
    await page.getByTestId('profile-username-change').click()
    await page.getByTestId('community-handle').fill('taken')
    await expect(page.getByTestId('profile-handle-status')).toHaveText('That username is taken.')
    await expect(page.getByTestId('community-claim')).toBeDisabled()
  })

  test('@muon3d is reserved: refused with the reason', async ({ page, account, models }) => {
    await openProfile(page, account, models)
    await page.getByTestId('profile-username-change').click()
    await page.getByTestId('community-handle').fill('@muon3d')
    await expect(page.getByTestId('profile-handle-status')).toHaveText('That username is reserved.')
    await expect(page.getByTestId('community-claim')).toBeDisabled()
    expect(models.seen.filter(s => s.includes('/v1/community/handles/'))).toEqual([])
  })

  test('a too-short username is refused before the service is asked', async ({ page, account, models }) => {
    await openProfile(page, account, models)
    await page.getByTestId('profile-username-change').click()
    await page.getByTestId('community-handle').fill('ab')
    await expect(page.getByTestId('profile-handle-status')).toContainText('3–24')
    await expect(page.getByTestId('community-claim')).toBeDisabled()
  })

  test('changed within 30 days: held, with the day it opens again', async ({ page, account, models }) => {
    models.community = fakeCommunity({ handle_changed_at: new Date(Date.now() - 3 * 86_400_000).toISOString() })
    await openProfile(page, account, models)
    await page.getByTestId('profile-username-change').click()
    await expect(page.getByTestId('profile-handle-cooldown')).toContainText('Available again on')
    await expect(page.getByTestId('community-handle')).toBeDisabled()
    await expect(page.getByTestId('community-claim')).toBeDisabled()
    expect(models.seen).not.toContain('PUT /v1/community/profile/handle')
  })

  test('the service saying the 30 days are not up is shown as it is', async ({ page, account, models }) => {
    // The page's clock says it is free; the service disagrees.
    models.community = fakeCommunity({ handle_changed_at: new Date(Date.now() - 31 * 86_400_000).toISOString() })
    await openProfile(page, account, models)
    models.community.handle_changed_at = new Date().toISOString()
    await page.getByTestId('profile-username-change').click()
    await page.getByTestId('community-handle').fill('another.name')
    await expect(page.getByTestId('profile-handle-status')).toHaveText('Free')
    await page.getByTestId('community-claim').click()
    await expect(page.getByTestId('profile-username-error')).toContainText('once every 30 days')
    await expect(page.getByTestId('profile-username-value')).toHaveText('@jack')
  })
})

const PNG = Buffer.from(PNG_1X1, 'base64')

test('a photo is uploaded as raw bytes with PUT .../avatar and shown in the tile; there is no Remove yet', async ({ page, account, models }) => {
  await openProfile(page, account, models)
  await expect(page.getByTestId('profile-tile-photo').locator('img')).toHaveCount(0)
  await page.getByTestId('profile-photo-input').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByTestId('profile-tile-photo').locator('img')).toBeVisible()
  expect(models.seen).toContain('PUT /v1/community/profile/avatar')
  expect(models.avatar).toEqual({ type: 'image/png', bytes: PNG.length, body: PNG_1X1 })
  // Your own preview is read from the authenticated route, never from avatar_url.
  expect(models.seen).toContain('GET /v1/community/profile/avatar')
  // The service has no way to remove a photo (KAN-1594): the button is not there, and nothing is sent.
  await expect(page.getByTestId('profile-photo-remove')).toHaveCount(0)
  expect(models.seen.filter(s => s.startsWith('DELETE'))).toEqual([])
})

test('a photo is shown from the authenticated route when the profile has no avatar_url', async ({ page, account, models }) => {
  models.community = fakeCommunity({ avatar_url: null })
  models.avatar = { type: 'image/png', bytes: PNG.length, body: PNG_1X1 }
  await openProfile(page, account, models)
  await expect(page.getByTestId('profile-tile-photo').locator('img')).toBeVisible()
})

test('a replaced photo is just another PUT', async ({ page, account, models }) => {
  await openProfile(page, account, models)
  await page.getByTestId('profile-photo-input').setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByTestId('profile-tile-photo').locator('img')).toBeVisible()
  await page.getByTestId('profile-photo-input').setInputFiles({ name: 'b.webp', mimeType: 'image/webp', buffer: Buffer.from('RIFFxxxxWEBP') })
  await expect.poll(() => models.avatar?.type).toBe('image/webp')
  expect(models.seen.filter(s => s === 'PUT /v1/community/profile/avatar')).toHaveLength(2)
})

test('a photo that is not JPEG, PNG or WebP is refused before it is sent', async ({ page, account, models }) => {
  await openProfile(page, account, models)
  await page.getByTestId('profile-photo-input').setInputFiles({ name: 'me.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') })
  await expect(page.getByTestId('profile-photo-error')).toContainText('JPEG, PNG or WebP')
  expect(models.seen).not.toContain('PUT /v1/community/profile/avatar')
})

test('a photo the service cannot read says so, and the old photo stays', async ({ page, account, models }) => {
  models.avatarInvalid = true
  await openProfile(page, account, models)
  await page.getByTestId('profile-photo-input').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByTestId('profile-photo-error')).toContainText('could not be read')
  await expect(page.getByTestId('profile-tile-photo').locator('img')).toHaveCount(0)
})

test('the about line is saved to the Library', async ({ page, account, models }) => {
  await openProfile(page, account, models)
  await page.getByTestId('profile-about-change').click()
  await page.getByTestId('profile-about-input').fill('Prints too much PETG.')
  await page.getByTestId('profile-about-save').click()
  await expect(page.getByTestId('profile-about-value')).toHaveText('Prints too much PETG.')
  expect(models.community!.bio).toBe('Prints too much PETG.')
  expect(models.seen).toContain('PUT /v1/community/profile')
})

test.describe('who can see it', () => {
  test('Public sends identity_public; with the page switched off it says what is missing and does not turn it on', async ({ page, account, models }) => {
    models.community = fakeCommunity({ page_on: false })
    await openProfile(page, account, models)
    await page.getByTestId('profile-public').click()
    await expect(page.getByTestId('profile-tile-visibility')).toHaveText('Public')
    expect(changes(account, 'PATCH /v1/me/community-identity')[0].body).toEqual({ identity_public: true })
    await expect(page.getByTestId('profile-public-missing')).toContainText("isn't on yet")
    await expect(page.getByTestId('profile-view-page')).toHaveCount(0)
    // The client never sets page_on: the Library service decides.
    expect(models.community.page_on).toBe(false)
    expect(models.seen).not.toContain('PUT /v1/community/profile')
  })

  test('Public with no username yet says to choose one', async ({ page, account, models }) => {
    models.community = fakeCommunity({ handle: null, public_name: null })
    await openProfile(page, account, models)
    await page.getByTestId('profile-public').click()
    await expect(page.getByTestId('profile-public-missing')).toContainText('username')
  })

  test('Public when under 18 is not sent; the row says why', async ({ page, account, models }) => {
    account.identity = { ...ADULT, declared_age: 15, can_public: false }
    await openProfile(page, account, models)
    await expect(page.getByTestId('profile-age')).toHaveText('Under 18')
    await page.getByTestId('profile-public').click()
    await expect(page.getByTestId('profile-public-missing')).toContainText('18')
    expect(changes(account, 'PATCH /v1/me/community-identity')).toEqual([])
  })

  test('Public with everything in place links to the page by handle', async ({ page, account, models }) => {
    await openProfile(page, account, models)
    await page.getByTestId('profile-public').click()
    await expect(page.getByTestId('profile-view-page')).toHaveAttribute('href', 'https://library.muon3d.com/@jack')
    await expect(page.getByTestId('profile-public-missing')).toHaveCount(0)
  })

  test('going Private shows "Updating the Library…" until the Library reports it', async ({ page, account, models }) => {
    account.identity = { ...ADULT, identity_public: true }
    models.community = fakeCommunity({ identity_public: true })
    await openProfile(page, account, models)
    await page.getByTestId('profile-private').click()
    await expect(page.getByTestId('profile-tile-visibility')).toHaveText('Private')
    await expect(page.getByTestId('profile-updating')).toBeVisible()
    models.community.identity_public = false
    await expect(page.getByTestId('profile-updating')).toHaveCount(0, { timeout: 15_000 })
  })
})

test('"Being checked" stays off until the service reports a review', async ({ page, account, models }) => {
  // The model service has no review field today: nothing says "Being checked".
  await openProfile(page, account, models)
  await expect(page.getByTestId('profile-name-review')).toHaveCount(0)
  await expect(page.getByTestId('profile-photo-review')).toHaveCount(0)
  await expect(page.getByText('Being checked')).toHaveCount(0)
})

test('the age is confirmed once, then shown as a status line', async ({ page, account, models }) => {
  account.identity = { ...ADULT, declared_age: null, declared_at: null, can_community: false, can_public: false }
  await openProfile(page, account, models)
  await expect(page.getByTestId('profile-username-change')).toBeDisabled()
  await page.getByTestId('community-age').fill('22')
  await page.getByTestId('community-confirm-age').click()
  await expect(page.getByTestId('profile-age')).toHaveText('Over 18')
  await expect(page.getByTestId('community-age')).toHaveCount(0)
  expect(changes(account, 'PATCH /v1/me/community-identity')[0].body).toEqual({ declared_age: 22 })
  await expect(page.getByTestId('profile-username-change')).toBeEnabled()
})

test.describe('?return=', () => {
  for (const [label, ret, shown] of [
    ['the Library', 'https://library.muon3d.com/@jack', true],
    ['the Library staging site', 'https://staging.library.muon3d.com/library', true],
    ['a path on this site', '/library?view=discover&creator=jack', true],
    ['a protocol-relative address', '//evil.com', false],
    ['another host', 'https://evil.example/library', false],
    ['an http address', 'http://library.muon3d.com/', false]
  ] as const) {
    test(`${label}: ${shown ? 'has' : 'has no'} Back to the Library, and a save makes it stand out (no second link)`, async ({ page, account, models }) => {
      await openProfile(page, account, models, `?return=${encodeURIComponent(ret)}`)
      const back = page.getByTestId('account-library-return')
      await expect(page.getByTestId('profile-return')).toHaveCount(0)
      await page.getByTestId('profile-about-change').click()
      await page.getByTestId('profile-about-input').fill('Hello')
      await page.getByTestId('profile-about-save').click()
      await expect(page.getByTestId('profile-saved')).toBeVisible()
      await expect(page.getByTestId('profile-return')).toHaveCount(0)
      if (shown) {
        await expect(back).toHaveCount(1)
        await expect(back).toHaveAttribute('href', ret)
        await expect(back).toHaveClass(/acct-back--saved/)
      } else {
        await expect(back).toHaveCount(0)
      }
    })
  }
})

test.describe('when something is down', () => {
  test('the console failing leaves one message and a way to try again', async ({ page, account, models }) => {
    let down = true
    account.failOn = request => down && request === 'GET /v1/me/community-identity' ? 503 : null
    await openProfile(page, account, models)
    await expect(page.getByTestId('profile-error')).toContainText('service answered')
    down = false
    await page.getByTestId('profile-retry').click()
    await expect(page.getByTestId('profile-tile')).toBeVisible()
  })

  test('the Library failing keeps the page, says so, and holds the public rows', async ({ page, account, models }) => {
    models.failOn = request => request === 'GET /v1/community/profile' ? 503 : null
    await openProfile(page, account, models)
    await expect(page.getByTestId('profile-library-error')).toBeVisible()
    await expect(page.getByTestId('profile-tile-name')).toHaveText('Jack')
    await expect(page.getByTestId('profile-username-change')).toBeDisabled()
    await expect(page.getByTestId('profile-about-change')).toBeDisabled()
  })
})

test('on a phone or a desktop, nothing runs off the edge of the page', async ({ page, account, models }) => {
  await openProfile(page, account, models)
  await page.getByTestId('profile-username-change').click()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('signing out mid-edit leaves no profile, draft or "Updating" behind', async ({ page, account, models, isMobile }) => {
  account.identity = { ...ADULT, identity_public: true }
  models.community = fakeCommunity({ identity_public: true })
  await openProfile(page, account, models)
  await page.getByTestId('profile-name-change').click()
  await page.getByTestId('account-name').fill('Half typed')
  await page.getByTestId('account-name-save').click()
  await expect(page.getByTestId('profile-updating')).toBeVisible()
  await page.getByTestId('profile-about-change').click()
  await page.getByTestId('profile-about-input').fill('A draft')
  if (isMobile) await page.getByTestId('account-pane').getByRole('link', { name: 'Account', exact: true }).click()
  await page.getByTestId('account-sign-out').click()
  await expect(page.getByTestId('account-profile')).toHaveCount(0)
  await expect(page.getByTestId('profile-updating')).toHaveCount(0)
  await expect(page.getByText('A draft')).toHaveCount(0)
})

test.describe('signed out', () => {
  test.use({ signedIn: false })

  test('asks to sign in, with no profile on show', async ({ page }) => {
    await page.addInitScript(([url]) => { localStorage.setItem('muon.cloud.url', url) }, [ORIGIN])
    await page.goto('/account/profile')
    await ready(page)
    await expect(page.getByTestId('account-signed-out')).toBeVisible()
    await expect(page.getByTestId('account-profile')).toHaveCount(0)
  })
})
