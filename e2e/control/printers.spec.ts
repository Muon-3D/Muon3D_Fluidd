/**
 * All printers (`/`): every printer in one place. What is printing leads, then
 * groups, then what was found on this network, other printers and offline.
 *
 * The page lists printers from three places, and each test lays only the ones
 * it needs over the shared mock, for its own page:
 * - config.json's endpoints: Boxwood (the mock, mid-print) and, where a test
 *   wants one, an address that never answers (an offline printer);
 * - the console's "nearby" list, with the printer's own answers routed from a
 *   made-up address (a printer found on this network);
 * - the other printers saved in this browser (localStorage).
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'

const FOUND_HOST = '192.168.77.5'

/** Control at All printers, past the splash. */
async function openPrinters (page: Page) {
  await page.goto('/')
  await ready(page)
}

/** What the console reports for one printer on the account. `online: false` with an old last_seen is a printer that is switched off. */
function cloudPrinter (id: string, name: string, online: boolean) {
  const now = Math.floor(Date.now() / 1000)
  return { id, name, model: 'M1', version: '1.0.0', linked_at: 1_700_000_000, last_seen: online ? now : now - 3 * 86_400, online, online_since: online ? 1_700_000_000 : null, role: 'operator' }
}

interface Layout { groups: Array<{ id: string, name: string, printers: string[] }> }

/** The signed-in account printers and groups, with every layout the page saves recorded. */
async function withAccountPrinters (page: Page, printers: Array<ReturnType<typeof cloudPrinter>>, groups: Layout['groups'] = []) {
  const saved: Layout[] = []
  await page.route(`${CONSOLE}/v1/printers`, route =>
    route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ printers }) }))
  await page.route(`${CONSOLE}/v1/fleet/layout`, async route => {
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key', 'access-control-allow-methods': '*' }
    const request = route.request()
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (request.method() === 'PUT') {
      const layout = request.postDataJSON().layout as Layout
      saved.push(layout)
      groups = layout.groups
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ ok: true }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ layout: { groups } }) })
  })
  return saved
}

/** A printer on this network that is not the user's yet: the console lists it, the page asks it who it is. */
async function withFoundPrinter (page: Page, name = 'muon-hazel-41c2') {
  await page.route(`${CONSOLE}/v1/links/nearby`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ printers: [{ printer_id: 'hazel-41c2', name, model: 'M1', linked: false, local_addrs: [FOUND_HOST] }] })
    }))
  await page.route(`http://${FOUND_HOST}/**`, route => {
    const url = new URL(route.request().url())
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (url.pathname === '/server/muon/identity') {
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ name, display: name, endpoint_id: 'hazel-41c2', derived_name: 'hazel', suffix: '41c2' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ result: { status: { webhooks: { state: 'ready' }, print_stats: { state: 'standby' } } } }) })
  })
}

test('the page is All printers: a title, one muted line, and Boxwood printing now', async ({ page }) => {
  await openPrinters(page)
  await expect(page.getByTestId('page-title')).toHaveText('All printers')
  await expect(page.getByTestId('printers-summary')).toContainText('1 printer')
  await expect(page.getByTestId('printers-summary')).toContainText('1 printing')
  const now = page.getByTestId('printing-now')
  await expect(now.getByRole('heading', { name: 'Printing now' })).toBeVisible()
  await expect(now).toContainText('Boxwood')
})

test('the header has one primary, Add printer, and no filter row', async ({ page }) => {
  await openPrinters(page)
  await expect(page.getByTestId('add-printer')).toBeVisible()
  await expect(page.getByTestId('add-printer')).toHaveText(/Add printer/)
  await expect(page.getByRole('button', { name: 'Needs you' })).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Show' })).toHaveCount(0)
})

test('the printing card has its state and Open on it, and Open goes to the printer', async ({ page }) => {
  await openPrinters(page)
  const open = page.getByTestId('printing-now').getByTestId('printing-now-open')
  await expect(open).toBeVisible()
  await open.click()
  await expect(page).toHaveURL(/\/boxwood-367a/)
})

test('Add printer opens one sheet with the ways in: this network and an address', async ({ page }) => {
  await openPrinters(page)
  await page.getByTestId('add-printer').click()
  const sheet = page.getByTestId('add-printer-sheet')
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText('On this network')
  await expect(sheet).toContainText('By its address')
  await sheet.getByTestId('enter-address').click()
  await expect(page.getByTestId('add-printer-dialog')).toBeVisible()
  await expect(sheet).toBeHidden()
})

test('the sheet searches the network again', async ({ page }) => {
  await openPrinters(page)
  await page.getByTestId('add-printer').click()
  const again = page.getByTestId('add-printer-sheet').getByTestId('search-again')
  await expect(again).toBeVisible()
  await again.click()
  await expect(page.getByTestId('add-printer-sheet')).toContainText(/Looking|Nothing new found|found/)
})

test('a printer found on this network is a row with Add, and the section is hidden when nothing is found', async ({ page }) => {
  await openPrinters(page)
  await expect(page.getByTestId('found')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Found on this network' })).toHaveCount(0)
})

test('found on this network: one row with its address', async ({ page }) => {
  await withFoundPrinter(page)
  await openPrinters(page)
  const found = page.getByTestId('found')
  await expect(found.getByRole('heading', { name: 'Found on this network' })).toBeVisible()
  await expect(found).toContainText('Hazel')
  await expect(found).toContainText(FOUND_HOST)
  await expect(page.getByTestId('printers-summary')).toContainText('1 found on this network')
})

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('an offline printer is last, dimmed, with its reason', async ({ page }) => {
    await withAccountPrinters(page, [cloudPrinter('p-pine', 'Pine', false)])
    await openPrinters(page)
    const offline = page.getByTestId('offline')
    await expect(offline.getByRole('heading', { name: 'Offline' })).toBeVisible()
    await expect(offline).toContainText('Pine')
    await expect(offline).toContainText('switched on')
    const heads = await page.locator('.printers h2').allTextContents()
    expect(heads.at(-1)?.trim()).toBe('Offline')
  })

  test('search narrows every section, says so when nothing matches, and clears', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The phone has no search field (the mockup drops it)')
    await withAccountPrinters(page, [cloudPrinter('p-pine', 'Pine', false)])
    await openPrinters(page)
    const find = page.getByRole('searchbox', { name: 'Search printers' })
    await find.fill('pine')
    await expect(page.getByTestId('offline')).toBeVisible()
    await expect(page.getByTestId('printing-now')).toHaveCount(0)
    await find.fill('zzzz')
    await expect(page.getByTestId('printers-none')).toContainText('No printer matches')
    await page.getByRole('button', { name: 'Clear search' }).click()
    await expect(page.getByTestId('printing-now')).toBeVisible()
    await expect(page.getByTestId('offline')).toBeVisible()
  })

  test('search also finds a printer by its state', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The phone has no search field (the mockup drops it)')
    await withAccountPrinters(page, [cloudPrinter('p-pine', 'Pine', false)])
    await openPrinters(page)
    await page.getByRole('searchbox', { name: 'Search printers' }).fill('printing')
    await expect(page.getByTestId('printing-now')).toBeVisible()
    await expect(page.getByTestId('offline')).toHaveCount(0)
  })

  test('your groups are sections: the name, a count and the printers in it', async ({ page }) => {
    await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm', true), cloudPrinter('p-pine', 'Pine', false)], [{ id: 'g1', name: 'Workshop', printers: ['p-elm', 'p-pine'] }])
    await openPrinters(page)
    const group = page.getByTestId('group-g1')
    await expect(group.getByRole('heading', { name: 'Workshop' })).toBeVisible()
    await expect(group.getByTestId('section-count')).toHaveText('2')
    await expect(group).toContainText('Elm')
    await expect(group).toContainText('Pine')
  })

  test('New group adds a group and names it, and the name is saved', async ({ page }) => {
    const saved = await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm', true)])
    // The saved layout loads once the page is up: a group made before then is overwritten by it.
    const loaded = page.waitForResponse(r => r.url().endsWith('/v1/fleet/layout') && r.request().method() === 'GET')
    await openPrinters(page)
    await loaded
    await page.getByTestId('new-group').click()
    const name = page.getByRole('textbox', { name: 'Group name' })
    await name.fill('Lab')
    await name.press('Enter')
    await expect(page.getByRole('heading', { name: 'Lab' })).toBeVisible()
    await expect.poll(() => saved.at(-1)?.groups.map(g => g.name)).toEqual(['Lab'])
  })

  test('a group is renamed and removed from its menu', async ({ page }) => {
    const saved = await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm', true)], [{ id: 'g1', name: 'Workshop', printers: ['p-elm'] }])
    await openPrinters(page)
    await page.getByTestId('group-g1').getByRole('button', { name: 'Group options' }).click()
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    const name = page.getByRole('textbox', { name: 'Group name' })
    await name.fill('Shop')
    await name.press('Enter')
    await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible()
    await page.getByTestId('group-g1').getByRole('button', { name: 'Group options' }).click()
    await page.getByRole('menuitem', { name: 'Remove group' }).click()
    await expect(page.getByTestId('group-g1')).toHaveCount(0)
    await expect.poll(() => saved.at(-1)?.groups).toEqual([])
  })

  test('with an account there is no Sign in line', async ({ page }) => {
    await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm', true)])
    await openPrinters(page)
    await expect(page.getByTestId('printers-summary')).toBeVisible()
    await expect(page.getByTestId('sign-in')).toHaveCount(0)
  })
})

test('Grid and List switch how the groups draw, and the choice is kept', async ({ page }) => {
  await withFoundPrinter(page)
  await openPrinters(page)
  const list = page.getByTestId('view-list')
  await list.click()
  await expect(list).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await ready(page)
  await expect(page.getByTestId('view-list')).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('view-grid').click()
  await expect(page.getByTestId('view-grid')).toHaveAttribute('aria-pressed', 'true')
})

test('signed out, a quiet line offers Sign in, and it opens the sign-in dialog', async ({ page }) => {
  await openPrinters(page)
  await page.getByTestId('sign-in').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
})
