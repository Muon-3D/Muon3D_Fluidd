/**
 * KAN-1886: Account › Library and storage › "When you add something new"
 * (who can see it, the licence to offer), and the "Your Library is being
 * deleted" banner in Your data. Runs at desktop and phone (both projects).
 *
 * The console is the e2e fake, answered per test. Its `library_defaults`
 * shape is proj-api's: a PUT with a partial object under that key.
 */
import { test, expect } from '../fixtures'
import { serveConsoleHere } from '../fakes/console'

test.use({ signedIn: true })

test.beforeEach(async ({ page, account, baseURL }) => {
  await serveConsoleHere(page, account, new URL(baseURL!).origin)
})

const libraryPuts = (account: { changes: Array<{ call: string, body: unknown }> }) =>
  account.changes.filter(c => c.call === 'PUT /v1/me/preferences').map(c => c.body)

test.describe('Library defaults for new things', () => {
  test('shows Only you and the suggested CC BY 4.0 before any choice, and saves nothing', async ({ page, open, account }) => {
    await open('/account/library')
    const section = page.getByTestId('library-defaults')
    await expect(section.getByText('When you add something new').first()).toBeVisible()
    await expect(section.getByRole('radio', { name: 'Only you' })).toHaveAttribute('aria-checked', 'true')
    await expect(section.getByRole('radio', { name: 'Anyone' })).toHaveAttribute('aria-checked', 'false')
    await expect(section.getByRole('radio', { name: 'People I choose' })).toBeDisabled()
    await expect(page.getByTestId('library-licence')).toHaveValue('')
    await expect(page.getByTestId('library-licence').locator('option:checked')).toHaveText('CC BY 4.0 (suggested)')
    await expect(page.getByTestId('library-licence-suggested')).toBeVisible()
    expect(libraryPuts(account)).toEqual([])
  })

  test('choosing who can see it PUTs just that, and it stays after a reload', async ({ page, open, account }) => {
    await open('/account/library')
    await page.getByRole('radio', { name: 'Anyone' }).click()
    await expect(page.getByRole('radio', { name: 'Anyone' })).toHaveAttribute('aria-checked', 'true')
    await expect.poll(() => libraryPuts(account)).toEqual([{ library_defaults: { visibility: 'public' } }])
    await expect(page.getByTestId('library-licence-suggested')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('radio', { name: 'Anyone' })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('radio', { name: 'Only you' }).click()
    await expect.poll(() => libraryPuts(account)).toEqual([{ library_defaults: { visibility: 'public' } }, { library_defaults: { visibility: 'private' } }])
  })

  test('choosing a licence PUTs just the SPDX id, and the suggestion note goes', async ({ page, open, account }) => {
    await open('/account/library')
    await page.getByTestId('library-licence').selectOption('CC-BY-4.0')
    await expect.poll(() => libraryPuts(account)).toEqual([{ library_defaults: { licence: 'CC-BY-4.0' } }])
    await expect(page.getByTestId('library-licence-suggested')).toHaveCount(0)
    await page.getByTestId('library-licence').selectOption('CC0-1.0')
    await expect.poll(() => libraryPuts(account)).toEqual([{ library_defaults: { licence: 'CC-BY-4.0' } }, { library_defaults: { licence: 'CC0-1.0' } }])

    await page.reload()
    await expect(page.getByTestId('library-licence')).toHaveValue('CC0-1.0')
  })

  test('a console without preferences leaves both rows disabled, Coming soon', async ({ page, open, account }) => {
    account.preferences = null
    await open('/account/library')
    await expect(page.getByTestId('library-defaults-soon')).toContainText('Coming soon')
    await expect(page.getByRole('radio', { name: 'Anyone' })).toBeDisabled()
    await expect(page.getByTestId('library-licence')).toBeDisabled()
    expect(libraryPuts(account)).toEqual([])
  })

  test('a refused save shows the console error', async ({ page, open, account }) => {
    account.failOn = call => (call === 'PUT /v1/me/preferences' ? 400 : null)
    await open('/account/library')
    await page.getByRole('radio', { name: 'Anyone' }).click()
    await expect(page.getByRole('alert')).toContainText('console')
  })
})

test.describe('Your Library is being deleted', () => {
  test('Your data shows the banner, with the date and Keep my account, while the 14 days run', async ({ page, open, account }) => {
    account.deletion = { requested_at: Math.floor(Date.UTC(2027, 0, 1) / 1000), delete_after: Math.floor(Date.UTC(2027, 0, 15, 12) / 1000) }
    await open('/account/privacy')
    const banner = page.getByTestId('deletion-banner')
    await expect(banner).toHaveCount(1)
    await expect(banner).toContainText('Your Library is being deleted.')
    await expect(banner).toContainText('Everything in it goes on 15 Jan')
    await expect(banner.getByRole('button', { name: 'Keep my account' })).toBeVisible()
  })

  test('Keep my account undoes it, and the banner goes', async ({ page, open, account }) => {
    account.deletion = { requested_at: Math.floor(Date.UTC(2027, 0, 1) / 1000), delete_after: Math.floor(Date.UTC(2027, 0, 15, 12) / 1000) }
    await open('/account/privacy')
    await page.getByRole('button', { name: 'Keep my account' }).click()
    await expect.poll(() => account.changes.map(c => c.call)).toContain('POST /v1/me/deletion/cancel')
  })

  test('no banner on Your data when the account is not being deleted', async ({ page, open }) => {
    await open('/account/privacy')
    await expect(page.getByRole('heading', { name: /Your data/ }).first()).toBeVisible()
    await expect(page.getByTestId('deletion-banner')).toHaveCount(0)
    await expect(page.getByText('Your Library is being deleted.')).toHaveCount(0)
  })
})
