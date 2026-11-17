/**
 * Settings › People and access on a Muon printer (Control v3, access-printer):
 * what an owner, an operator and a viewer each see, the links to Account,
 * the empty states, and that Remove and Leave each ask first and send nothing
 * before the yes.
 *
 * The printer's `muon_access` answers are laid over the shared mock for this
 * page only (page.route), and the console is the fake one: the printer is in
 * the account under the EndpointId the mock reports.
 */
import type { Page } from '@playwright/test'
import { test, expect, PRINTER } from '../fixtures'
import { usePrinter } from './printer'
import { MOCK_PORT } from '../ports'
import type { ConsoleState } from '../fakes/console'

test.use({ signedIn: true })

/** The mock's own EndpointId (/server/muon/identity): the account names the printer by it. */
const ID = 'mockendpointboxwood367a'
const COMPONENTS = ['database', 'file_manager', 'klippy_apis', 'machine', 'data_store', 'webcam', 'update_manager', 'history', 'authorization', 'muon_access', 'muon_protection']

type Role = 'owner' | 'operator' | 'viewer'

/** The printer says who this browser is: its owner may change who can use it. */
async function printerSays (page: Page, role: Role) {
  const sets: string[] = []
  const state = {
    owner: { kind: 'account', email: 'jack@example.test', name: 'Jack' },
    entry: 'protected',
    you: { level: role === 'owner' ? 'admin' : 'member', role: role === 'viewer' ? 'viewer' : 'operator', trusted: false, principal: 'you' },
    ways: { email: { on: true }, link: { on: true }, password: { on: false }, approve: { on: true } },
    privateUploads: false,
    dataMode: 'shared',
    levelsPreset: 'standard'
  }
  const caps = { protection: role === 'owner' ? 'allowed' : 'refused' }
  await page.route(new RegExp(`:${MOCK_PORT}/server/muon/access/`), route => {
    const name = new URL(route.request().url()).pathname.split('/').pop() ?? ''
    if (name.startsWith('set_')) {
      sets.push(name)
      return route.fulfill({ json: { result: { applied: true } } })
    }
    if (name === 'get') return route.fulfill({ json: { result: state } })
    if (name === 'capabilities') return route.fulfill({ json: { result: { actions: caps } } })
    return route.fulfill({ status: 404, json: { error: { code: 404, message: 'Not Found' } } })
  })
  return { sets }
}

function inAccount (account: ConsoleState, role: Role, over: Record<string, unknown> = {}) {
  account.printers = [{
    id: ID,
    name: 'Boxwood',
    model: 'M1',
    state: 'idle',
    online: true,
    linked_at: 1,
    ...(role === 'owner' ? {} : { shared: true, role, share_id: 'share-you', sharer: { account_id: 'acct-jack', display_name: 'Jack' } }),
    ...over
  }]
}

async function openAccess (page: Page, open: (path: string) => Promise<void>) {
  await usePrinter(page, {}, { components: COMPONENTS })
  await open('/settings#access')
  await expect(page.getByTestId('people-access')).toBeVisible()
}

/** What the page asked the console to change about printers. */
const printerChanges = (account: ConsoleState) => account.changes.map(c => c.call).filter(call => call.includes('/v1/printers/'))

const OWNER_GROUPS = ['pa-invite', 'pa-people', 'pa-devices', 'pa-entry', 'pa-roles', 'pa-older-tools', 'pa-developer', 'pa-unlink']

test('the owner sees every group, with "Only you so far", and empty Waiting and Invite links hidden', async ({ page, open, account }) => {
  await printerSays(page, 'owner')
  inAccount(account, 'owner')
  await openAccess(page, open)
  for (const tid of OWNER_GROUPS) await expect(page.getByTestId(tid), tid).toBeVisible()
  await expect(page.getByTestId('pa-you-role')).toContainText('You: owner')
  await expect(page.getByTestId('pa-people-empty')).toContainText('Only you so far')
  await expect(page.getByTestId('pa-waiting')).toHaveCount(0)
  await expect(page.getByTestId('pa-links')).toHaveCount(0)
  await expect(page.getByTestId('pa-leave')).toHaveCount(0)
  await expect(page.getByTestId('pa-lock')).toHaveCount(0)
  // The fixed role table: five rows, Viewer only watching.
  const roles = page.getByTestId('pa-roles')
  await expect(roles.locator('[data-role-row]')).toHaveCount(5)
  await expect(roles.locator('[data-role-row="watch"] .pa-who--y')).toHaveCount(3)
  await expect(roles.locator('[data-role-row="people"] .pa-who--y')).toHaveText(['Owner'])
})

test("the owner's people, requests and links come from the console for this printer", async ({ page, open, account }) => {
  await printerSays(page, 'owner')
  inAccount(account, 'owner')
  account.shares[ID] = [{ id: 's1', printer_id: ID, email: 'harry@example.test', role: 'operator', ends_at: null, created_at: 1 }]
  account.invites[ID] = [{ id: 'i1', printer_id: ID, email: 'alex@example.test', role: 'operator', ends_at: null, created_at: 1 }]
  account.links[ID] = [{ id: 'l1', printer_id: ID, role: 'viewer', approve_each: true, max_uses: 1, uses: 0, expires_at: 1900000000, created_at: 1, url: 'https://muon3d.com/j/7KQ2-MX9P-4D' }]
  account.approvals = [{ id: 'ap1', kind: 'link_join', printer_id: ID, link_id: 'l1', role: 'viewer', state: 'pending', requester: { email: 'rui@example.test' }, created_at: 1, expires_at: 1900000000 }]
  await openAccess(page, open)
  await expect(page.getByTestId('pa-person')).toHaveCount(1)
  await expect(page.getByTestId('pa-person')).toContainText('harry@example.test')
  await expect(page.getByTestId('pa-request')).toContainText('rui@example.test wants to join as Viewer')
  await expect(page.getByTestId('pa-pending-invite')).toContainText('alex@example.test')
  await expect(page.getByTestId('pa-link')).toContainText('Viewer · single use')
})

test('Remove asks first: Cancel sends nothing, Remove takes the person off this printer', async ({ page, open, account }) => {
  await printerSays(page, 'owner')
  inAccount(account, 'owner')
  account.shares[ID] = [{ id: 's1', printer_id: ID, email: 'harry@example.test', role: 'operator', ends_at: null, created_at: 1 }]
  await openAccess(page, open)
  await page.getByTestId('pa-person-remove').click()
  await expect(page.getByTestId('confirm')).toContainText('Remove harry@example.test from Boxwood?')
  await page.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  expect(printerChanges(account)).toEqual([])

  await page.getByTestId('pa-person-remove').click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printerChanges(account)).toEqual([`DELETE /v1/printers/${ID}/shares/s1`])
})

test('an operator sees no owner group, one lock line, the people read-only, and a link to their devices in Account', async ({ page, open, account }) => {
  await printerSays(page, 'operator')
  inAccount(account, 'operator')
  await openAccess(page, open)
  await expect(page.getByTestId('pa-you-role')).toContainText('You: operator')
  for (const tid of ['pa-people-readonly', 'pa-can-do', 'pa-your-devices', 'pa-leave', 'pa-lock']) await expect(page.getByTestId(tid), tid).toBeVisible()
  for (const tid of OWNER_GROUPS) await expect(page.getByTestId(tid), tid).toHaveCount(0)
  // On a Muon printer the old Moonraker key and users card is never drawn for a member.
  await expect(page.locator('#auth')).toHaveCount(0)
  await expect(page.getByText(/API key|Add user/i)).toHaveCount(0)
  // Hidden, not greyed: no disabled owner controls anywhere on the page.
  await expect(page.getByTestId('people-access').locator('button:disabled, select:disabled')).toHaveCount(0)
  // The console's owner-only lists are never asked for.
  expect(account.seen.filter(s => /\/(shares|invites|links)$/.test(s))).toEqual([])

  await page.getByTestId('pa-your-devices-account').click()
  // Account is its own top-level page, never inside the printer's view.
  await expect(page).toHaveURL(/\/account\/devices$/)
  expect(new URL(page.url()).pathname).toBe('/account/devices')
})

test('Leave asks first and says the owner cannot leave; Cancel sends nothing', async ({ page, open, account }) => {
  await printerSays(page, 'operator')
  inAccount(account, 'operator')
  await openAccess(page, open)
  await page.getByTestId('pa-leave-button').click()
  await expect(page.getByTestId('confirm')).toContainText('Leave Boxwood?')
  await expect(page.getByTestId('confirm-message')).toContainText("The owner can't leave; they unlink instead.")
  await page.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  expect(printerChanges(account)).toEqual([])

  await page.getByTestId('pa-leave-button').click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printerChanges(account)).toEqual([`DELETE /v1/printers/${ID}/shares/share-you`])
})

test('a viewer sees no list of people, their end date and who to ask', async ({ page, open, account }) => {
  await printerSays(page, 'viewer')
  inAccount(account, 'viewer', { ends_at: Math.floor(new Date(2026, 10, 30, 12).getTime() / 1000) })
  await openAccess(page, open)
  await expect(page.getByTestId('pa-you-line')).toHaveText("You're a Viewer until 30 Nov")
  await expect(page.getByTestId('pa-need-to-print')).toContainText('Only the owner can change your role. Ask Jack.')
  await expect(page.getByTestId('pa-people-readonly')).toHaveCount(0)
  await expect(page.getByTestId('pa-lock')).toContainText("Viewers don't see the list of people")
  for (const tid of OWNER_GROUPS) await expect(page.getByTestId(tid), tid).toHaveCount(0)
  // On a Muon printer the old Moonraker key and users card is never drawn for a member.
  await expect(page.locator('#auth')).toHaveCount(0)
  await expect(page.getByText(/API key|Add user/i)).toHaveCount(0)
})

test('the owner reaches Account from the printer at its top-level address, with no printer frame and a way back', async ({ page, open, account }) => {
  await printerSays(page, 'owner')
  inAccount(account, 'owner')
  await openAccess(page, open)
  await expect(page.getByTestId('pa-devices-account')).toHaveAttribute('href', '/account/devices')
  await expect(page.getByTestId('pa-account-link')).toHaveAttribute('href', '/account/printers')
  await page.getByTestId('pa-account-link').click()
  await expect(page).toHaveURL(/\/account\/printers$/)
  expect(new URL(page.url()).pathname).toBe('/account/printers')
  // No printer frame: no printer rail, no printer sections.
  await expect(page.locator('.app-rail')).toHaveCount(0)
  await expect(page.locator('[data-tid^="rail-"]')).toHaveCount(0)
  await expect(page.getByTestId('account-printer-return')).toContainText('Back to Boxwood')
  // Back to the page it was opened from.
  await page.getByTestId('account-printer-return').click()
  await expect(page).toHaveURL(new RegExp(`${PRINTER}/settings#access$`))
})

test('an old printer-scoped Account address opens the top-level Account', async ({ page, open }) => {
  await open('/account/printers')
  await expect(page).toHaveURL(/\/account\/printers$/)
  expect(new URL(page.url()).pathname).toBe('/account/printers')
  await expect(page.locator('.app-rail')).toHaveCount(0)
})

test('developer mode is one row linking to its own section; this page has no switch for it', async ({ page, open, account }) => {
  await printerSays(page, 'owner')
  inAccount(account, 'owner')
  await openAccess(page, open)
  const row = page.getByTestId('pa-developer')
  await expect(row).toContainText("The first time it's turned on, the printer's screen confirms it.")
  await expect(row.locator('button, [role="switch"]')).toHaveCount(0)
  await expect(page.getByTestId('people-access').getByRole('button', { name: /developer|turn off|leave developer/i })).toHaveCount(0)
  await row.click()
  await expect(page).toHaveURL(/settings#developer$/)
  await expect(page.getByTestId('developer-mode')).toBeVisible()
})

test('a new Moonraker key is asked for first', async ({ page, open, account }) => {
  await printerSays(page, 'owner')
  inAccount(account, 'owner')
  await openAccess(page, open)
  await page.getByTestId('pa-api-key').click()
  await page.getByTestId('api-key-new').click()
  await expect(page.getByTestId('confirm')).toContainText('Make a new API key for Boxwood?')
  await page.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toHaveCount(0)
})
