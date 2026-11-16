/**
 * Account › Your devices, to the 6 Nov storyboard (settings/account-devices):
 * the devices signed in to the account, Sign out everywhere else asking
 * first and keeping Bluetooth pairings, and the devices paired at a printer
 * saying plainly they're not available yet (no console list of them).
 */
import { test, expect } from '../fixtures'
import { serveConsoleHere } from '../fakes/console'

test.use({ signedIn: true })

const now = () => Math.floor(Date.now() / 1000)
const session = (id: string, label: string, current = false, ago = 600) => ({
  id,
  device: label,
  device_label: label,
  endpoint_id: null,
  kind: 'browser',
  client_id: null,
  created_at: now() - 10 * 86_400,
  last_used_at: now() - ago,
  expires_at: now() + 20 * 86_400,
  current
})

test.beforeEach(async ({ page, account, baseURL }) => {
  account.sessions = [session('here', 'Chrome on Windows', true, 0), session('app', 'Muon3D app on Pixel 8'), session('mac', 'Safari on Mac', false, 86_400)]
  await serveConsoleHere(page, account, new URL(baseURL!).origin)
})

test('the devices signed in, this one marked, with the 30-day rule', async ({ page, open }) => {
  await open('/account/sessions')
  await expect(page.getByRole('heading', { name: 'Your devices' })).toBeVisible()
  await expect(page.getByTestId('sessions-signed-in-title')).toHaveText('Signed in to your account · 3')
  await expect(page.getByTestId('sessions-this-device')).toContainText('This device')
  await expect(page.getByTestId('sessions-device')).toHaveCount(2)
  await expect(page.getByText('A device unused for 30 days signs out by itself.')).toBeVisible()
})

test('sign out everywhere else asks first, keeps the pairings, and leaves this device', async ({ page, open, account }) => {
  await open('/account/sessions')
  await page.getByTestId('sessions-everywhere-else').click()
  await expect(page.getByTestId('confirm')).toContainText('Sign out 2 other devices?')
  await expect(page.getByTestId('confirm-message')).toHaveText('Muon3D app on Pixel 8 and Safari on Mac. Bluetooth pairings to your printers stay.')
  await page.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  expect(account.changes.map(c => c.call)).not.toContain('DELETE /v1/me/sessions')

  await page.getByTestId('sessions-everywhere-else').click()
  await page.getByTestId('confirm-ok').click()
  await expect(page.getByText('Every other device is signed out. Bluetooth pairings to your printers stay.')).toBeVisible()
  await expect(page.getByTestId('sessions-device')).toHaveCount(0)
  await expect(page.getByTestId('sessions-this-device')).toBeVisible()
  // Only the account's sessions: nothing sent to any printer's pairings.
  expect(account.changes.map(c => c.call).filter(call => !call.endsWith('/v1/me/assertion'))).toEqual(['DELETE /v1/me/sessions'])
})

test('devices paired at a printer say they are not available yet, and where per-printer removal is', async ({ page, open }) => {
  await open('/account/sessions')
  await expect(page.getByTestId('sessions-paired-unavailable')).toContainText('Not available yet')
  await expect(page.getByText("To take one off a single printer, use that printer's People and access.")).toBeVisible()
})
