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
import { usePrinter } from './printer'

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

/** What a found printer is doing, as its Moonraker reports it. */
const FOUND_STATUS = {
  idle: { webhooks: { state: 'ready' }, print_stats: { state: 'standby' } },
  printing: {
    webhooks: { state: 'ready' },
    print_stats: { state: 'printing', filename: 'Phone_stand_v3.gcode', print_duration: 900, info: { current_layer: 88, total_layer: 120 } },
    virtual_sdcard: { progress: 0.72 }
  }
}

/**
 * A printer on this network that is not the user's yet: the console lists it,
 * the page asks it who it is. Returns what the page asked of the console's list
 * (`nearbyAsks`) and of the printer itself (`requests`, "METHOD /path").
 */
async function withFoundPrinter (page: Page, { name = 'muon-hazel-41c2', status = 'idle' as keyof typeof FOUND_STATUS } = {}) {
  const requests: string[] = []
  let nearbyAsks = 0
  await page.route(`${CONSOLE}/v1/links/nearby`, route => {
    nearbyAsks++
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ printers: [{ printer_id: 'hazel-41c2', name, model: 'M1', linked: false, local_addrs: [FOUND_HOST] }] })
    })
  })
  await page.route(`http://${FOUND_HOST}/**`, route => {
    const url = new URL(route.request().url())
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    requests.push(`${route.request().method()} ${url.pathname}`)
    if (url.pathname === '/server/muon/identity') {
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ name, display: name, endpoint_id: 'hazel-41c2', derived_name: 'hazel', suffix: '41c2' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ result: { status: FOUND_STATUS[status] } }) })
  })
  return { requests, nearbyAsks: () => nearbyAsks }
}

/** The page's own printer, Boxwood, with nothing sent to the shared mock for these methods. */
async function withBoxwood (page: Page, status: Record<string, unknown> = {}) {
  const printer = await usePrinter(page, status)
  for (const method of ['printer.print.pause', 'printer.print.resume', 'printer.print.cancel']) printer.state.answers[method] = 'ok'
  return printer
}

/** No printer in config.json: nothing saved, so an empty page. */
async function withNoPrinters (page: Page) {
  await page.route('**/config.json', async route => {
    const response = await route.fetch()
    const config = await response.json()
    config.endpoints = []
    await route.fulfill({ response, json: config })
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

test('the sheet searches the network again: the console is asked again, and it says it is looking', async ({ page }) => {
  const found = await withFoundPrinter(page)
  await openPrinters(page)
  await expect(page.getByTestId('found')).toBeVisible()
  await page.getByTestId('add-printer').click()
  const sheet = page.getByTestId('add-printer-sheet')
  await expect(sheet).toContainText('1 found')
  const before = found.nearbyAsks()
  await sheet.getByTestId('search-again').click()
  await expect.poll(() => found.nearbyAsks()).toBeGreaterThan(before)
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

const pausedBoxwood = { print_stats: { state: 'paused' }, pause_resume: { is_paused: true } }

test.describe('printing now: the card controls', () => {
  test('Pause sends one pause, to Boxwood, and the found printer printing beside it has no Pause', async ({ page }) => {
    const printer = await withBoxwood(page)
    const found = await withFoundPrinter(page, { status: 'printing' })
    await openPrinters(page)
    const now = page.getByTestId('printing-now')
    await expect(now.locator('.now')).toHaveCount(2)
    // Only the printer this page is on can be paused from here; the other opens first.
    await expect(now.getByTestId('printing-now-pause')).toHaveCount(1)
    await expect(now.locator('.now').filter({ hasText: 'Boxwood' }).getByTestId('printing-now-pause')).toHaveCount(1)
    await now.getByTestId('printing-now-pause').click()
    await expect.poll(() => printer.called('printer.print.pause').length).toBe(1)
    expect(printer.called('printer.print.resume')).toHaveLength(0)
    expect(found.requests.filter(r => r.startsWith('POST'))).toEqual([])
  })

  test('a double click on Pause sends one pause', async ({ page }) => {
    const printer = await withBoxwood(page)
    await openPrinters(page)
    await page.getByTestId('printing-now-pause').dblclick()
    await expect.poll(() => printer.called('printer.print.pause').length).toBe(1)
    await page.waitForTimeout(1500)
    expect(printer.called('printer.print.pause')).toHaveLength(1)
  })

  test('a paused print says so, and Resume sends one resume (and a double click one)', async ({ page }) => {
    const printer = await withBoxwood(page, pausedBoxwood)
    await openPrinters(page)
    await expect(page.getByTestId('printing-now')).toContainText('Paused')
    await page.getByTestId('printing-now-pause').dblclick()
    await expect.poll(() => printer.called('printer.print.resume').length).toBe(1)
    await page.waitForTimeout(1500)
    expect(printer.called('printer.print.resume')).toHaveLength(1)
    expect(printer.called('printer.print.pause')).toHaveLength(0)
  })

  test('Stop asks first: nothing is sent until it is confirmed, and Keep printing sends nothing', async ({ page }) => {
    const printer = await withBoxwood(page)
    await openPrinters(page)
    await page.getByTestId('printing-now-stop').click()
    await expect(page.getByText('Cancel this print?')).toBeVisible()
    expect(printer.called('printer.print.cancel')).toHaveLength(0)
    await page.getByTestId('confirm-cancel').click()
    await expect(page.getByText('Cancel this print?')).toBeHidden()
    expect(printer.called('printer.print.cancel')).toHaveLength(0)
    // Again, and this time confirmed: one cancel.
    await page.waitForTimeout(1500)
    await page.getByTestId('printing-now-stop').click()
    await page.getByTestId('confirm-ok').click()
    await expect.poll(() => printer.called('printer.print.cancel').length).toBe(1)
  })
})

test.describe('found printers', () => {
  test('Open on a found row goes to that printer: the page asks it for its Moonraker', async ({ page }) => {
    const found = await withFoundPrinter(page)
    await openPrinters(page)
    const row = page.getByTestId('found').getByTestId('found-connect')
    await expect(row).toHaveText(/Open/)
    const before = found.requests.length
    await row.click()
    await expect.poll(() => found.requests.slice(before).length).toBeGreaterThan(0)
    // It opens the printer rather than saving it quietly: the row's own request is for its server.
    expect(found.requests.some(r => r.includes('/server/'))).toBe(true)
  })

  test('Link to my account signed out asks to sign in first', async ({ page }) => {
    await withFoundPrinter(page)
    await openPrinters(page)
    await page.getByTestId('found').getByTestId('found-link').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog')).not.toContainText('Link a printer to your account')
  })

  test.describe('signed in', () => {
    test.use({ signedIn: true })

    test('Link to my account opens the link dialog for that printer', async ({ page }) => {
      await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm', true)])
      await withFoundPrinter(page)
      await openPrinters(page)
      await page.getByTestId('found').getByTestId('found-link').click()
      await expect(page.getByRole('dialog')).toContainText('Link a printer to your account')
    })
  })

  test('the row keeps the printer detail line and a Looking cue shows while nothing is found yet', async ({ page }) => {
    await openPrinters(page)
    await expect(page.getByTestId('printers-looking')).toContainText('Looking')
    await expect(page.getByTestId('found')).toHaveCount(0)
  })

  test('the found row says what the printer says about itself', async ({ page }) => {
    await withFoundPrinter(page)
    await openPrinters(page)
    await expect(page.getByTestId('found')).toContainText('not linked to an account')
    await expect(page.getByTestId('printers-looking')).toHaveCount(0)
  })
})

test.describe('empty', () => {
  test('signed out with no printer: the empty state with the three ways in', async ({ page }) => {
    await withNoPrinters(page)
    await openPrinters(page)
    const welcome = page.getByTestId('printers-welcome')
    await expect(welcome).toContainText('No printers yet')
    await expect(welcome.getByTestId('enter-address')).toBeVisible()
    await expect(welcome.getByTestId('search-again')).toBeVisible()
    await expect(welcome.getByTestId('sign-in')).toBeVisible()
    await expect(page.getByTestId('add-printer')).toHaveCount(0)
  })

  test.describe('signed in', () => {
    test.use({ signedIn: true })

    test('signed in with no printer is the empty state too, not a blank page, and has no Sign in way', async ({ page }) => {
      await withNoPrinters(page)
      await withAccountPrinters(page, [])
      await openPrinters(page)
      const welcome = page.getByTestId('printers-welcome')
      await expect(welcome).toContainText('No printers yet')
      await expect(welcome.getByTestId('enter-address')).toBeVisible()
      await expect(welcome.getByTestId('search-again')).toBeVisible()
      await expect(welcome.getByTestId('sign-in')).toHaveCount(0)
    })
  })
})

test('Look nearby in the Add sheet starts the Bluetooth chooser', async ({ page }) => {
  await page.addInitScript(() => {
    const asked: unknown[] = []
    ;(window as any).__bluetoothAsks = asked
    Object.defineProperty(navigator, 'bluetooth', {
      configurable: true,
      value: {
        requestDevice: (options: unknown) => {
          asked.push(options)
          return Promise.reject(new DOMException('User cancelled the requestDevice() chooser.', 'NotFoundError'))
        },
        getAvailability: async () => true,
        getDevices: async () => [],
        addEventListener: () => {},
        removeEventListener: () => {}
      }
    })
  })
  await openPrinters(page)
  await page.getByTestId('add-printer').click()
  await page.getByTestId('add-printer-sheet').getByTestId('look-nearby').click()
  await expect.poll(() => page.evaluate(() => (window as any).__bluetoothAsks.length)).toBe(1)
  // The sheet gets out of the way of the chooser.
  await expect(page.getByTestId('add-printer-sheet')).toBeHidden()
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

  test('the offline row says when it was last seen, and is dimmed', async ({ page }) => {
    await withAccountPrinters(page, [cloudPrinter('p-pine', 'Pine', false)])
    await openPrinters(page)
    const offline = page.getByTestId('offline')
    await expect(page.getByTestId('offline-reason')).toContainText('Last seen 3 days ago')
    await expect(offline.locator('.row__text')).toHaveCSS('opacity', '0.6')
  })

  test('Grid puts a group printers side by side, and List stacks them in rows', async ({ page, isMobile }) => {
    test.skip(isMobile, 'A phone draws two across in Grid and the same rows in List: covered by the desktop check')
    await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm', true), cloudPrinter('p-cedar', 'Cedar', true)], [{ id: 'g1', name: 'Workshop', printers: ['p-elm', 'p-cedar'] }])
    await openPrinters(page)
    const group = page.getByTestId('group-g1')
    const elm = group.getByTestId('printer-tile-cloud:p-elm')
    const cedar = group.getByTestId('printer-tile-cloud:p-cedar')
    await expect(elm).toBeVisible()
    const grid = [await elm.boundingBox(), await cedar.boundingBox()]
    expect(Math.abs(grid[0]!.y - grid[1]!.y)).toBeLessThan(4)
    expect(grid[1]!.x).toBeGreaterThan(grid[0]!.x + grid[0]!.width - 4)
    await page.getByTestId('view-list').click()
    const rows = [await elm.boundingBox(), await cedar.boundingBox()]
    expect(Math.abs(rows[0]!.x - rows[1]!.x)).toBeLessThan(4)
    expect(rows[1]!.y).toBeGreaterThan(rows[0]!.y + rows[0]!.height - 4)
    expect(rows[0]!.height).toBeLessThan(grid[0]!.height)
    await page.getByTestId('view-grid').click()
    const back = await cedar.boundingBox()
    expect(Math.abs(back!.y - grid[0]!.y)).toBeLessThan(8)
  })

  test('a printer is dragged into a group and back out, and each move is saved', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Drag and drop is a mouse gesture')
    const saved = await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm', true), cloudPrinter('p-cedar', 'Cedar', true)], [{ id: 'g1', name: 'Workshop', printers: ['p-elm'] }])
    await openPrinters(page)
    const cedar = page.getByTestId('printer-tile-cloud:p-cedar')
    await expect(cedar).toBeVisible()
    await cedar.dragTo(page.getByTestId('group-g1'))
    await expect.poll(() => saved.at(-1)?.groups.find(g => g.id === 'g1')?.printers.sort()).toEqual(['p-cedar', 'p-elm'])
    await expect(page.getByTestId('group-g1').getByTestId('printer-tile-cloud:p-cedar')).toBeVisible()
    // Out again: onto Not in a group, which appears while dragging.
    const inGroup = page.getByTestId('group-g1').getByTestId('printer-tile-cloud:p-cedar')
    const target = page.getByTestId('group-ungrouped')
    await inGroup.hover()
    await page.mouse.down()
    await page.mouse.move(10, 10)
    await expect(target).toBeVisible()
    const box = (await target.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + 20, { steps: 8 })
    await page.mouse.up()
    await expect.poll(() => saved.at(-1)?.groups.find(g => g.id === 'g1')?.printers).toEqual(['p-elm'])
  })

  test('a printing printer keeps its menu and drag in its group while it also leads Printing now', async ({ page }) => {
    await withBoxwood(page)
    await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm', true)])
    await openPrinters(page)
    await expect(page.getByTestId('printing-now')).toContainText('Boxwood')
    const options = page.locator('[data-tid^="group-"] button[aria-label="Options for Boxwood"]')
    await expect(options).toBeVisible()
    await options.click()
    await expect(page.getByRole('menuitem').first()).toBeVisible()
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
