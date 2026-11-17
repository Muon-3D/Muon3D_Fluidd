/**
 * Account › Printers and access, Your devices and Apps and agents (Control v3,
 * access-account): the nav's names and groups, each printer with your role,
 * an owner's row going to the printer's People and access, a member's Open
 * and Leave (asked first, nothing sent before the yes), and the empty state.
 *
 * Account's pages only work where the console serves Control, so this spec
 * serves the fake console at Control's own address.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready, PRINTER } from '../fixtures'
import { answerConsole, type ConsoleState } from '../fakes/console'
import { VITE_PORT } from '../ports'

test.use({ signedIn: true })

const ORIGIN = `http://localhost:${VITE_PORT}`

async function consoleHere (page: Page, account: ConsoleState) {
  await page.addInitScript(([url]) => { localStorage.setItem('muon.cloud.url', url) }, [ORIGIN])
  await page.route(`${ORIGIN}/v1/**`, route => answerConsole(route, account))
}

async function openAccount (page: Page, account: ConsoleState, section: string) {
  await consoleHere(page, account)
  await page.goto(`/account/${section}`)
  await ready(page)
  await expect(page.getByTestId('account-pane')).toBeVisible()
}

/** The avatar menu: in the top bar, or on a phone in the tab bar's More sheet. */
async function openAccountMenu (page: Page, isMobile: boolean) {
  if (isMobile) await page.getByTestId('tab-more').click()
  await page.locator('[data-tid="account"]:visible').first().click()
}

const printerChanges = (account: ConsoleState) => account.changes.map(c => c.call).filter(call => call.includes('/v1/printers/'))

const OWNED = { id: 'prn-boxwood', name: 'Boxwood', model: 'M1', state: 'idle', online: true, linked_at: 1 }
const WALNUT = { id: 'prn-walnut', name: 'Walnut', model: 'M1', state: 'idle', online: true, linked_at: 1, shared: true, role: 'operator' as const, share_id: 'share-walnut', sharer: { account_id: 'acct-harry', display_name: 'Harry C.' } }
const HAZEL = { id: 'prn-hazel', name: 'Hazel', model: 'M1', state: 'idle', online: true, linked_at: 1, shared: true, role: 'viewer' as const, share_id: 'share-hazel', ends_at: 1900000000 }

test('the Account nav has the agreed names, in three groups', async ({ page, account, isMobile }) => {
  await consoleHere(page, account)
  await page.goto('/account')
  await ready(page)
  const nav = page.getByRole('navigation', { name: 'Account sections' })
  await expect(nav).toBeVisible()
  await expect(nav.locator('.acct-nav__group')).toHaveText(['You', 'Access', 'Everything else'])
  await expect(nav.locator('.acct-nav__item .acct-nav__label')).toHaveText([
    'Profile', 'Sign-in and security', 'Printers and access', 'Your devices', 'Apps and agents',
    'Notifications', 'Library and storage', 'Plan', 'Your data', 'Sign out'
  ])
  if (isMobile) return
  for (const gone of ['Devices and sessions', 'Access tokens', 'Connected apps', 'Privacy and data']) {
    await expect(nav.getByText(gone, { exact: true })).toHaveCount(0)
  }
})

test('every printer is listed with your role: an owner row goes to People, a member row offers Open and Leave', async ({ page, account }) => {
  account.printers = [OWNED, WALNUT, HAZEL]
  await openAccount(page, account, 'printers')
  await expect(page.getByTestId('printers-role')).toHaveText(['Owner', 'Operator', 'Viewer'])
  const owned = page.getByTestId('printers-owned')
  await expect(owned.getByTestId('printers-people')).toHaveAttribute('href', /\/settings#access$/)
  await expect(owned.getByTestId('printers-leave')).toHaveCount(0)
  await expect(owned).not.toContainText('Unlink')
  const walnut = page.getByTestId('printers-shared').filter({ hasText: 'Walnut' })
  await expect(walnut.getByTestId('printers-open')).toBeVisible()
  await expect(walnut.getByTestId('printers-leave')).toBeVisible()
  await expect(walnut).toContainText('Owner Harry C.')
})

test("the owner's People goes to the printer's People and access", async ({ page, account }) => {
  account.printers = [OWNED]
  await openAccount(page, account, 'printers')
  const people = page.getByTestId('printers-people')
  const href = await people.getAttribute('href')
  expect(href).toMatch(/^\/[^/]+\/settings#access$/)
})

test('Leave asks first: Cancel sends nothing, Leave ends your share', async ({ page, account }) => {
  account.printers = [WALNUT]
  await openAccount(page, account, 'printers')
  await page.getByTestId('printers-leave').click()
  await expect(page.getByTestId('confirm')).toContainText('Leave Walnut?')
  await expect(page.getByTestId('confirm-message')).toContainText('Your files on it stay with Harry C.')
  await page.getByTestId('confirm-cancel').click()
  await expect(page.getByTestId('confirm')).toHaveCount(0)
  expect(printerChanges(account)).toEqual([])

  await page.getByTestId('printers-leave').click()
  await page.getByTestId('confirm-ok').click()
  await expect.poll(() => printerChanges(account)).toEqual(['DELETE /v1/printers/prn-walnut/shares/share-walnut'])
})

test('no printers: the empty state offers Add a printer and Join with a code', async ({ page, account }) => {
  account.printers = []
  await openAccount(page, account, 'printers')
  await expect(page.getByTestId('printers-empty')).toContainText('No printers yet')
  await expect(page.getByTestId('printers-empty-link')).toBeVisible()
  await expect(page.getByTestId('printers-join')).toBeVisible()
})

test('Printers and access links to Your devices and to Apps and agents', async ({ page, account }) => {
  await openAccount(page, account, 'printers')
  await page.getByTestId('printers-to-devices').click()
  await expect(page.getByTestId('account-sessions')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Your devices' })).toBeVisible()
  await page.goBack()
  await page.getByTestId('printers-to-apps').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Apps and agents' })).toBeVisible()
})

test('the old addresses still open: devices is Your devices, tokens is Apps and agents with both halves', async ({ page, account }) => {
  await openAccount(page, account, 'devices')
  await expect(page.getByRole('heading', { level: 1, name: 'Your devices' })).toBeVisible()
  await consoleHere(page, account)
  await page.goto('/account/tokens')
  await ready(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Apps and agents' })).toBeVisible()
  await expect(page.getByTestId('account-apps')).toBeVisible()
  await expect(page.getByTestId('account-tokens')).toBeVisible()
})

test('Your data holds Delete account', async ({ page, account }) => {
  await openAccount(page, account, 'privacy')
  await page.getByTestId('account-data-delete').click()
  await expect(page).toHaveURL(/\/account\/delete$/)
})

test('3. the account menu inside a printer opens the top-level Account, with no printer frame', async ({ page, open, account, isMobile }) => {
  // Where the console serves Control; on a printer's own address the menu opens the console's Account, as today.
  await consoleHere(page, account)
  await open('/settings')
  await openAccountMenu(page, isMobile)
  await page.getByTestId('account-open').click()
  await expect(page).toHaveURL(/\/account$/)
  expect(new URL(page.url()).pathname).toBe('/account')
  await expect(page.locator('.app-rail')).toHaveCount(0)
  await expect(page.getByTestId('account-printer-return')).toBeVisible()
  await page.getByTestId('account-printer-return').click()
  await expect(page).toHaveURL(new RegExp(`${PRINTER}/settings$`))
})

// Account is top-level (Jack, 6 Nov; identity storyboard frame 3).
const pathOf = (page: Page) => { const u = new URL(page.url()); return `${u.pathname}${u.search}${u.hash}` }

test('1. a printer-scoped Account address redirects to /account, keeping the section and the query', async ({ page }) => {
  await page.goto(`${PRINTER}/account/printers?from=old#top`)
  await ready(page)
  await expect.poll(() => pathOf(page)).toBe('/account/printers?from=old#top')
})

test('2. /account stays top-level with a printer open, and has no printer rail', async ({ page, open }) => {
  await open('/settings')
  await page.goto('/account/profile')
  await ready(page)
  await expect.poll(() => new URL(page.url()).pathname).toBe('/account/profile')
  await expect(page.locator('.app-rail')).toHaveCount(0)
})

test('4. the Back chip returns to the printer page you came from', async ({ page, open, account, isMobile }) => {
  await consoleHere(page, account)
  await open('/settings#access')
  await openAccountMenu(page, isMobile)
  await page.getByTestId('account-open').click()
  await expect.poll(() => new URL(page.url()).pathname).toBe('/account')
  const chip = page.getByTestId('account-printer-return')
  await expect(chip).toContainText('Back to Boxwood')
  await expect(chip).toHaveAttribute('href', `${PRINTER}/settings#access`)
  await chip.click()
  await expect.poll(() => pathOf(page)).toBe(`${PRINTER}/settings#access`)
})

test('4. with no printer open there is no Back chip', async ({ page }) => {
  await page.route('**/config.json', async route => {
    const response = await route.fetch()
    const config = await response.json()
    await route.fulfill({ response, json: { ...config, endpoints: [], blacklist: [...(config.blacklist ?? []), 'localhost', '127.0.0.1'] } })
  })
  await page.addInitScript(() => { localStorage.setItem('appInstances', '[]') })
  await page.goto('/account')
  await ready(page)
  await expect(page.getByTestId('account-page')).toBeVisible()
  await expect(page.getByTestId('account-printer-return')).toHaveCount(0)
  await expect(page.getByTestId('estop')).toHaveCount(0)
})

test('5. E-STOP stays in the top bar on Account while a printer is open', async ({ page, open }) => {
  await open('/settings')
  await page.goto('/account')
  await ready(page)
  await expect(page.getByTestId('estop').first()).toBeVisible()
  await expect(page.locator('.app-rail')).toHaveCount(0)
})

test('6. ?return= still works on /account/profile: the Library link lands there and returns', async ({ page }) => {
  const back = 'https://library.muon3d.com/@jack'
  await page.goto(`/account/profile?return=${encodeURIComponent(back)}`)
  await ready(page)
  await expect.poll(() => new URL(page.url()).pathname).toBe('/account/profile')
  await expect(page.getByTestId('account-library-return')).toHaveAttribute('href', back)
  // The printer chip gives way to the Library's way back.
  await expect(page.getByTestId('account-printer-return')).toHaveCount(0)
})
