/**
 * Account › Apps and agents, to the 6 Nov storyboard (settings/account-apps):
 * the token list (ends · used · printers, Look/Change pills), Make a token as
 * a sheet with the printer choice and no Bypass while it is Coming soon, and
 * the token shown once with "copy setup instructions" for an AI agent.
 */
import { test, expect } from '../fixtures'
import { FAKE_TOKEN, serveConsoleHere } from '../fakes/console'

test.use({ signedIn: true })

const now = () => Math.floor(Date.now() / 1000)

test.beforeEach(async ({ page, account, baseURL }) => {
  account.printers = [{ id: 'p-box', name: 'Boxwood', model: 'M1', version: '1', linked_at: 0, last_seen: now(), online: true, online_since: null } as never]
  account.tokens = [
    { id: 't-claude', name: 'Claude agent', prefix: 'mpat_Cl4', scopes: ['printers:read', 'printers:files', 'printers:queue', 'printers:camera'], printer_ids: ['p-box'], ask_mode: 'ask', expires_at: now() + 23 * 86_400 - 60, created_at: now() - 7 * 86_400, last_used_at: now() - 7200, status: 'active' },
    { id: 't-laptop', name: 'Laptop scripts', prefix: 'mpat_La9', scopes: ['printers:read'], printer_ids: null, ask_mode: 'ask', expires_at: now() - 9 * 86_400, created_at: now() - 40 * 86_400, last_used_at: null, status: 'expired' }
  ]
  await page.addInitScript(() => {
    const w = window as unknown as { __copied: string[] }
    w.__copied = []
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { w.__copied.push(text) } } })
  })
  await serveConsoleHere(page, account, new URL(baseURL!).origin)
})

test('the token list: ends, used and printers on one line, Look and Change pills, ended ones greyed', async ({ page, open }) => {
  await open('/account/apps')
  const active = page.getByTestId('tokens-row-active')
  await expect(active.getByTestId('tokens-row-line')).toHaveText('Ends in 23 days · used 2 hours ago · Boxwood only')
  await expect(active.locator('.tok__chip')).toHaveText(['Look', 'Change: files, queue, camera'])
  await expect(page.getByTestId('tokens-row-expired')).toContainText('Ended')
  await expect(page.getByTestId('tokens-printer-note')).toContainText("open that printer's People and access")
})

test('make a token, see it once, copy the setup text for an AI agent', async ({ page, open, account }) => {
  await open('/account/apps')
  await page.getByTestId('tokens-make').click()
  const sheet = page.getByTestId('tokens-form')
  await expect(sheet).toContainText('Make a token')
  // Bypass stays hidden while it is Coming soon; the four always ask.
  await expect(sheet.getByTestId('tokens-mode-bypass')).toHaveCount(0)
  await expect(sheet.getByTestId('tokens-always-ask')).toHaveText('Starting a print, heating, moving and publishing always ask you first, whatever it can do.')
  await sheet.getByTestId('tokens-name').fill('Cursor agent')
  await sheet.getByTestId('tokens-printers-some').check()
  await sheet.getByTestId('tokens-printer-p-box').check()
  await sheet.getByTestId('tokens-create').click()

  const fresh = page.getByTestId('tokens-fresh')
  await expect(fresh).toContainText('Copy your token now')
  await expect(fresh).toContainText("You won't see it again. Treat it like a password.")
  await expect(fresh.getByTestId('tokens-secret')).toHaveAttribute('type', 'password')
  await fresh.getByTestId('tokens-copy-setup').click()
  await expect(fresh.getByTestId('tokens-copy-setup')).toHaveText('setup instructions copied')
  const copied = await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)
  expect(copied).toHaveLength(1)
  expect(copied[0]).toContain('Address: https://mcp.muon3d.com/mcp')
  expect(copied[0]).toContain(`Authorization: Bearer ${FAKE_TOKEN}`)
  expect(account.changes.find(c => c.call === 'POST /v1/tokens')?.body).toMatchObject({ name: 'Cursor agent', printer_ids: ['p-box'], ask_mode: 'ask' })

  // Shown once: Done takes it away for good, and the URL never carried it.
  await fresh.getByTestId('tokens-done').click()
  await expect(page.getByTestId('tokens-fresh')).toBeHidden()
  await expect(page.getByTestId('tokens-secret')).toHaveCount(0)
  await expect(page.getByText('Cursor agent is ready.')).toBeVisible()
  expect(await page.content()).not.toContain(FAKE_TOKEN)
  expect(page.url()).not.toContain(FAKE_TOKEN)
})

test('revoking asks first, and says it is everywhere', async ({ page, open }) => {
  await open('/account/apps')
  await page.getByTestId('tokens-row-active').getByTestId('tokens-revoke').click()
  await expect(page.getByTestId('confirm')).toContainText('Revoke Claude agent everywhere?')
  await page.getByTestId('confirm-cancel').click()
})
