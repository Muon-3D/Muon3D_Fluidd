/**
 * Account › Your data, to the 6 Nov storyboard (settings/account-data): a
 * copy is a request (what, format, check it's you) followed on its row, with
 * no download; Delete account unlinks owned printers first, needs DELETE
 * typed, and waits 14 days.
 */
import { test, expect } from '../fixtures'
import { serveConsoleHere } from '../fakes/console'

test.use({ signedIn: true })

const now = () => Math.floor(Date.now() / 1000)

test.beforeEach(async ({ page, account, baseURL }) => {
  account.exports = [{ id: 'exp-old', status: 'expired', requested_at: now() - 30 * 86_400, size_bytes: 214e6, expires_at: now() - 23 * 86_400 }]
  account.account.deletion = null
  await serveConsoleHere(page, account, new URL(baseURL!).origin)
})

test('request a copy: what, format, check it is you, then a row with its stages, and nothing downloads', async ({ page, open, account }) => {
  const downloads: string[] = []
  page.on('download', d => downloads.push(d.suggestedFilename()))
  await open('/account/privacy')
  await expect(page.getByTestId('account-privacy')).toContainText('Ask for a copy of everything Muon3D holds about you')
  await expect(page.getByText(/Email me a copy|Download Library/)).toHaveCount(0)
  await page.getByTestId('privacy-request').click()
  const sheet = page.getByTestId('privacy-sheet')
  await expect(sheet).toContainText('Request a copy of your data')
  await expect(sheet).toContainText('Nothing downloads now.')
  await sheet.getByText('JSON only').click()
  await sheet.getByTestId('privacy-continue').click()
  await expect(sheet).toContainText("Confirm it's you")
  await expect(sheet).toContainText("We'll also tell you by email")
  await sheet.getByTestId('privacy-send').click()
  await expect(page.getByTestId('privacy-export-note')).toContainText("We'll email jack@example.test when it's ready")
  const row = page.getByTestId('privacy-request-exp-2')
  await expect(row).toContainText('Confirmed')
  await expect(row.getByTestId('privacy-stages')).toContainText('Gathering')
  await expect(page.getByTestId('privacy-requests')).toContainText('Requests · 2')
  await expect(page.getByTestId('privacy-request-exp-old')).toContainText('Expired')
  expect(account.changes.find(c => c.call === 'POST /v1/me/exports')?.body).toEqual({ parts: ['account', 'library', 'history'], format: 'json' })
  // One at a time: asking again shows the open one.
  await page.getByTestId('privacy-request').click()
  await expect(page.getByTestId('privacy-export-note')).toContainText('You already asked on')
  expect(downloads).toEqual([])
})

test('delete: unlink the printers you own first, type DELETE, then 14 days to undo', async ({ page, open, account }) => {
  account.printers = [{ id: 'p-box', name: 'Boxwood', model: 'M1', version: '1', linked_at: 0, last_seen: now(), online: true, online_since: null } as never]
  await open('/account/privacy')
  await expect(page.getByTestId('account-data-delete')).toContainText('unlink the printers you own first')
  await page.getByTestId('account-data-delete').click()
  await page.getByTestId('delete-open').click()
  const dialog = page.getByTestId('delete-dialog')
  await expect(dialog).toContainText('You own a printer')
  await expect(dialog.getByTestId('delete-next')).toBeDisabled()
  await dialog.getByTestId('delete-unlink-p-box').click()
  await expect(page.getByTestId('confirm')).toContainText('Unlink Boxwood?')
  await page.getByTestId('confirm-ok').click()
  await expect(dialog.getByTestId('delete-next')).toBeEnabled()
  expect(account.changes.map(c => c.call)).toContain('DELETE /v1/printers/p-box')
  await dialog.getByTestId('delete-next').click()

  await expect(dialog.getByTestId('delete-continue')).toBeDisabled()
  await dialog.getByTestId('delete-type').fill('DEL')
  await expect(dialog.getByTestId('delete-continue')).toBeDisabled()
  await dialog.getByTestId('delete-type').fill('DELETE')
  await dialog.getByTestId('delete-continue').click()
  await dialog.getByTestId('delete-password').fill('e2e-password')
  await dialog.getByTestId('delete-confirm').click()
  await expect(dialog).toContainText('Your account will be deleted on')
  await expect(dialog).toContainText('Changed your mind? Sign in before')
  expect(account.changes.filter(c => c.call === 'DELETE /v1/me')).toHaveLength(1)
})
