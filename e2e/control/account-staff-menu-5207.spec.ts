/**
 * KAN-5207: the "Muon3D staff" group in the account menu. Staff see Admin and Fleet,
 * a moderator sees Admin only, and a normal user, or a console that does not send the
 * field yet, sees no group at all. No passkey prompt decides any of it.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures'
import { serveConsoleHere } from '../fakes/console'

test.use({ signedIn: true })

test.beforeEach(async ({ page, account, baseURL }) => {
  await serveConsoleHere(page, account, new URL(baseURL!).origin)
})

const openMenu = async (page: Page, open: (path: string) => Promise<unknown>) => {
  await open('/account')
  await page.locator('[data-tid=account]:visible').first().click()
  await expect(page.getByTestId('account-open').first()).toBeVisible()
}

test('a staff account sees Admin and Fleet; Fleet opens fleet.muon3d.com in this tab', async ({ page, open, account, context }) => {
  account.staff = true
  await page.route('https://fleet.muon3d.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Fleet</title><p>Fleet</p>' }))
  await openMenu(page, open)
  await expect(page.getByTestId('account-staff-group')).toHaveText('Muon3D staff')
  await expect(page.getByTestId('account-admin')).toBeVisible()
  await expect(page.getByTestId('account-fleet')).toBeVisible()
  await expect(page.getByText('Grafana')).toHaveCount(0)
  await page.getByTestId('account-fleet').click()
  await page.waitForURL(/^https:\/\/fleet\.muon3d\.com\//)
  expect(context.pages()).toHaveLength(1)
})

test('Admin goes to /admin', async ({ page, open, account }) => {
  account.staff = 'staff'
  await openMenu(page, open)
  await page.getByTestId('account-admin').click()
  await expect(page).toHaveURL(/\/admin$/)
})

test('a moderator sees the group with Admin only: no Fleet, no Grafana', async ({ page, open, account }) => {
  account.staff = 'moderator'
  await openMenu(page, open)
  await expect(page.getByTestId('account-staff-group')).toBeVisible()
  await expect(page.getByTestId('account-admin')).toBeVisible()
  await expect(page.getByTestId('account-fleet')).toHaveCount(0)
  await expect(page.getByText('Grafana')).toHaveCount(0)
})

for (const [label, value] of [['a normal user (no field)', undefined], ['false', false], ['an unknown value', 'owner'], ['a malformed value', { role: 'staff' }]] as const) {
  test(`${label} sees no staff group at all`, async ({ page, open, account }) => {
    account.staff = value
    await openMenu(page, open)
    await expect(page.getByTestId('account-staff-group')).toHaveCount(0)
    await expect(page.getByTestId('account-admin')).toHaveCount(0)
    await expect(page.getByTestId('account-fleet')).toHaveCount(0)
  })
}
