/**
 * Account › Notifications, Library and storage, and Plan, to the v3
 * storyboards: where alerts go (and that only the console's keys save),
 * the Library's storage, with its split when the service sends one, and a
 * Plan that cannot charge anyone while payments are closed.
 *
 * The console (serving this page, as it does Control) and the model
 * service are the e2e fakes, answered per test.
 */
import { test, expect } from '../fixtures'
import { serveConsoleHere } from '../fakes/console'

test.use({ signedIn: true })

test.beforeEach(async ({ page, account, baseURL }) => {
  await serveConsoleHere(page, account, new URL(baseURL!).origin)
})

test.describe('Notifications', () => {
  test('a sharing alert saves under its console key, and is still on after a reload', async ({ page, open, account }) => {
    await open('/account/notifications')
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
    const shared = page.getByTestId('notify-email_shared_with_you')
    await expect(shared).toHaveAttribute('aria-checked', 'true')

    await shared.click()
    await expect(shared).toHaveAttribute('aria-checked', 'false')
    await expect.poll(() => account.preferencePatches).toEqual([{ email_shared_with_you: false }])

    await page.reload()
    await expect(page.getByTestId('notify-email_shared_with_you')).toHaveAttribute('aria-checked', 'false')
    await expect(page.getByTestId('notify-email_access_requests')).toHaveAttribute('aria-checked', 'true')
  })

  test('the print alerts have Phone, Email and Bell, each coming soon until the console holds it', async ({ page, open, account }) => {
    await open('/account/notifications')
    const grid = page.getByRole('group', { name: 'Your printers' })
    for (const column of ['Phone', 'Email', 'Bell']) await expect(grid.getByText(column, { exact: true })).toBeVisible()
    for (const row of ['A print finished', 'A print failed or stopped', 'Paused, needs you', 'An update is ready']) await expect(grid.getByText(row)).toBeVisible()
    const cells = grid.getByRole('switch')
    await expect(cells).toHaveCount(12)
    for (const cell of await cells.all()) await expect(cell).toBeDisabled()
    await expect(page.getByTestId('notify-grid-soon')).toContainText('Coming soon')
    await expect(page.getByTestId('notify-security')).toHaveText('Always')
    expect(account.preferencePatches).toEqual([])
  })

  test('a console without preferences keeps "Email choices come soon", and saves nothing', async ({ page, open, account }) => {
    account.preferences = null
    await open('/account/notifications')
    await expect(page.getByTestId('notify-soon')).toContainText('Email choices come soon')
    for (const cell of await page.getByRole('switch').all()) await expect(cell).toBeDisabled()
    await expect(page.getByRole('alert')).toHaveCount(0)
    expect(account.seen.filter(s => s.startsWith('PUT'))).toEqual([])
  })
})

test.describe('Library and storage', () => {
  test('storage is used of the quota on a bar, with no split when the service sends none', async ({ page, open, models }) => {
    models.storage = { used_bytes: 1.2e9, quota_bytes: 5e9 }
    await open('/account/library')
    await expect(page.getByText('What your Library keeps for you, and how much room it takes')).toBeVisible()
    await expect(page.getByTestId('library-storage')).toHaveText(/1\.2 GB\s+of 5 GB/)
    await expect(page.getByRole('meter', { name: 'Library storage used' })).toHaveAttribute('aria-valuenow', '24')
    await expect(page.getByTestId('library-storage-split')).toHaveCount(0)
    for (const name of ['Save every slice', 'Ask after slicing something new', 'Offer to save it when you print']) {
      await expect(page.getByRole('switch', { name })).toBeVisible()
    }
    await page.getByTestId('library-profile-link').click()
    await expect(page).toHaveURL(/\/account\/profile$/)
  })

  test('the split shows uploads, slices and designs when the service sends it', async ({ page, open, models }) => {
    models.storage = { used_bytes: 1.2e9, quota_bytes: 5e9, used_by_kind: { uploads: 4e8, slices: 7e8, designs: 1e8 } }
    await open('/account/library')
    const split = page.getByTestId('library-storage-split')
    await expect(split.getByTestId('library-storage-uploads')).toContainText('400 MB')
    await expect(split.getByTestId('library-storage-slices')).toContainText('700 MB')
    await expect(split.getByTestId('library-storage-designs')).toContainText('100 MB')
  })
})

test.describe('Plan', () => {
  test('payments closed: the plan and what it includes, and nothing to buy or change', async ({ page, open, models }) => {
    models.storage = { used_bytes: 1.2e9, quota_bytes: 5e9 }
    await open('/account/plan')
    await expect(page.getByRole('heading', { name: 'Plan' })).toBeVisible()
    await expect(page.getByTestId('plan-closed')).toHaveText('Paid plans open soon. Nothing here can charge you yet.')
    await expect(page.getByTestId('plan-tile-printers')).toContainText('Unlimited')
    await expect(page.getByTestId('plan-tile-storage')).toContainText(/1\.2 GB of 5 GB/)
    const pane = page.getByTestId('account-plan')
    await expect(pane.getByRole('button', { name: /Change plan|Choose|Buy credits|£|\$|€/ })).toHaveCount(0)
    await expect(page.getByTestId('plan-credits')).toHaveCount(0)
  })
})
