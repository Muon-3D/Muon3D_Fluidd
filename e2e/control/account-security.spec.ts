/**
 * Account › Sign-in and security, and the Account page's layout, to the
 * 6 Nov storyboards (settings/account-security) and the account bar
 * (KAN-1947): beside the page on a desktop, at the top of the list on a
 * phone. The console serves this page, as it does Control, from the e2e
 * fake (e2e/fakes/console.ts, its `security`).
 */
import { test, expect } from '../fixtures'
import { consoleSecurity, FAKE_RECOVERY_CODES, serveConsoleHere } from '../fakes/console'

test.use({ signedIn: true })

const DAY = 86_400
const now = () => Math.floor(Date.now() / 1000)

test.beforeEach(async ({ page, account, baseURL }) => {
  await serveConsoleHere(page, account, new URL(baseURL!).origin)
})

test('the summary, every way to sign in in one list, and only the linked providers', async ({ page, open, account }) => {
  account.security = consoleSecurity({
    passkeys: [{ id: 'k1', name: 'iPhone', created_at: now() - 30 * DAY, last_used_at: now() - DAY }],
    identities: [{ provider: 'google', email: 'jack@gmail.test', created_at: now() - 60 * DAY }]
  })
  await open('/account/security')
  await expect(page.getByRole('heading', { name: 'Sign-in and security' })).toBeVisible()
  await expect(page.getByTestId('security-meter')).toHaveAttribute('aria-valuenow', '2')
  await expect(page.getByTestId('security-next')).toHaveText('turn on 2-step')
  const ways = page.getByTestId('security-signing-in')
  for (const way of ['Email', 'Passkeys · 1', 'Password', 'Google']) await expect(ways.getByText(way, { exact: true })).toBeVisible()
  await expect(ways.getByText('Apple', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Linking comes soon')).toHaveCount(0)
  await expect(page.getByText('Asked when you make a token that changes things, request your data, or confirm from away.')).toBeVisible()
  await expect(page.getByTestId('security-emails')).toHaveText('Always')
})

test('turning on 2-step walks the QR code, the code and the recovery codes, shown once', async ({ page, open, account }) => {
  account.security = consoleSecurity({ passkeys: [{ id: 'k1', name: 'iPhone', created_at: now() - DAY, last_used_at: null }] })
  await open('/account/security')
  const toggle = page.getByTestId('security-two-step')
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await toggle.click()
  await expect(page.getByText('Scan with your authenticator app')).toBeVisible()
  await expect(page.getByText('Then type the 6-digit code it shows.')).toBeVisible()
  await page.getByTestId('two-step-code').fill('123456')
  await page.getByRole('button', { name: 'Turn on' }).click()
  const codes = page.getByTestId('recovery-codes')
  await expect(codes).toContainText(FAKE_RECOVERY_CODES[0])
  await expect(page.getByText("Copy or save them now: they're shown only this once.")).toBeVisible()
  await expect(page.getByTestId('recovery-codes-copy')).toBeVisible()
  await expect(page.getByTestId('recovery-codes-save')).toBeVisible()
  await page.getByTestId('recovery-codes-done').click()
  await expect(page.getByTestId('recovery-codes')).toHaveCount(0)
  await expect(page.getByTestId('security-two-step')).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByTestId('security-codes-line')).toContainText('10 of 10')
  // Shown once: the page never shows them again.
  await page.reload()
  await expect(page.getByText(FAKE_RECOVERY_CODES[0])).toHaveCount(0)
  expect(page.url()).not.toContain('code')
})

test('Google unlinks after asking, and the last way in cannot be removed', async ({ page, open, account }) => {
  account.security = consoleSecurity({
    password: false,
    identities: [{ provider: 'google', email: 'jack@gmail.test', created_at: now() - DAY }]
  })
  await open('/account/security')
  await expect(page.getByTestId('security-unlink-google')).toBeDisabled()
  await expect(page.getByTestId('security-last-way')).toHaveText("Your only way to sign in, so it can't be unlinked.")

  account.security.password = true
  await page.reload()
  await page.getByTestId('security-unlink-google').click()
  await expect(page.getByTestId('confirm')).toContainText('Unlink Google?')
  await expect(page.getByTestId('confirm-message')).toHaveText("You'll sign in with your password.")
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => account.changes.map(c => c.call)).toContain('DELETE /v1/me/identities/google')
  await expect(page.getByTestId('security-provider-google')).toHaveCount(0)
})

test('the account bar: you, the sections and Sign out, on the right on a desktop and at the top on a phone', async ({ page, open, account }, info) => {
  account.security = consoleSecurity()
  await open(info.project.name === 'phone' ? '/account' : '/account/security')
  const side = page.getByTestId('account-side')
  await expect(side.getByTestId('account-side-name')).toHaveText('Jack')
  await expect(side.getByTestId('account-sign-out')).toBeVisible()
  if (info.project.name === 'phone') {
    const bar = await side.boundingBox()
    expect(bar!.y).toBeLessThan(260)
    expect(bar!.width).toBeGreaterThan(300)
  } else {
    const bar = await side.boundingBox()
    const pane = await page.getByTestId('account-pane').boundingBox()
    expect(bar!.x).toBeGreaterThan(pane!.x + pane!.width - 1)
    expect(pane!.width).toBeGreaterThan(900)
  }
})
