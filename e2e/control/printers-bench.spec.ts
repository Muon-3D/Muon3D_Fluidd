/**
 * All printers, the Bench (KAN-2257, control-ctx "All printers"; Jack, 12
 * Nov: "I like 6 for the main printer menu, maybe the groups can be
 * 'benches'", then "benches, I like this menu").
 *
 * What a person sees: a third view beside Grid and List. Each of their groups
 * is a bench with its printers drawn standing on it, coloured by state;
 * printers shared with them sit on a shelf tagged with who shared them;
 * printers found nearby wait on hatched ground with one thing to do each. A
 * printer dragged onto "New bench" starts one. A bench folds away and stays
 * folded. The choice of view is kept.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { CONSOLE } from '../fakes/console'
import { usePrinter } from './printer'

const FOUND_HOST = '192.168.77.6'

async function openPrinters (page: Page) {
  await page.goto('/')
  await ready(page)
}

function cloudPrinter (id: string, name: string, extra: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000)
  return { id, name, model: 'M1', version: '1.0.0', linked_at: 1_700_000_000, last_seen: now, online: true, online_since: 1_700_000_000, role: 'operator', ...extra }
}

interface Layout { groups: Array<{ id: string, name: string, printers: string[] }> }

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

/** `linked`: the found printer is already linked to another account, so its one action is to ask its owner. */
async function withFoundPrinter (page: Page, { linked = false } = {}) {
  await page.route(`${CONSOLE}/v1/links/nearby`, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ printers: [{ printer_id: 'larch-41c2', name: 'muon-larch-41c2', model: 'M1', linked, local_addrs: [FOUND_HOST] }] })
  }))
  await page.route(`http://${FOUND_HOST}/**`, route => {
    const url = new URL(route.request().url())
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    // The printer itself says whose it is: linked to an account that is not the signed-in one.
    if (linked && url.pathname === '/server/muon/link') {
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ result: { phase: 'linked', account: 'someone.else@example.com' } }) })
    }
    if (url.pathname === '/server/muon/identity') {
      return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ name: 'muon-larch-41c2', display: 'muon-larch-41c2', endpoint_id: 'larch-41c2', derived_name: 'larch', suffix: '41c2' }) })
    }
    return route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ result: { status: { webhooks: { state: 'ready' }, print_stats: { state: 'standby' } } } }) })
  })
}

async function toBench (page: Page) {
  await page.getByTestId('view-bench').click()
  await expect(page.getByTestId('view-bench')).toHaveAttribute('aria-pressed', 'true')
}

test('Bench is a third view: this browser\'s printer stands on its bench, drawn printing with its part growing', async ({ page }) => {
  await openPrinters(page)
  await toBench(page)
  // Signed out, the printers saved in this browser are one bench.
  const bench = page.getByTestId('group-saved')
  await expect(bench).toBeVisible()
  await expect(bench.getByRole('heading', { name: 'Saved in this browser' })).toBeVisible()
  const boxwood = bench.locator('[data-tid^="printer-tile-"]').first()
  await expect(boxwood).toContainText('Boxwood')
  // The mock is mid-print: the drawing is in the printing colour, its part grown, its head working.
  const drawing = boxwood.locator('svg.pdraw')
  await expect(drawing).toHaveClass(/pdraw--run/)
  await expect(drawing).not.toHaveClass(/pdraw--still/)
  const grown = await drawing.locator('clipPath rect').getAttribute('height')
  expect(Number(grown)).toBeGreaterThan(30)
  // The count is in status-coloured dots.
  await expect(bench.getByTestId('bench-summary')).toContainText('1 printing')
  // Printing now leads Grid and List only; on the Bench every printer is on its bench.
  await expect(page.getByTestId('printing-now')).toHaveCount(0)
  // Hover (a mouse): Open, and Pause for the printer Control is on.
  if (test.info().project.name === 'phone') return
  await boxwood.hover()
  await expect(boxwood.getByTestId('bench-action-open')).toBeVisible()
  await expect(boxwood.getByTestId('bench-action-pause')).toBeVisible()
})

test('a printer still heating shows Heating and its temperature in amber, not the percent', async ({ page }) => {
  await usePrinter(page, { extruder: { temperature: 180, target: 220, can_extrude: false } })
  await openPrinters(page)
  await toBench(page)
  const boxwood = page.getByTestId('group-saved').locator('[data-tid^="printer-tile-"]').first()
  const state = boxwood.locator('.bprint__state')
  await expect(state).toHaveText('Heating · 180°')
  const amber = await page.evaluate(() => {
    const probe = document.createElement('i')
    probe.style.color = 'var(--m3d-warning)'
    document.body.appendChild(probe)
    const colour = getComputedStyle(probe).color
    probe.remove()
    return colour
  })
  await expect.poll(() => state.evaluate(el => getComputedStyle(el).color)).toBe(amber)
})

test('the view is kept, and Grid and List are as they were', async ({ page }) => {
  await openPrinters(page)
  await toBench(page)
  await page.reload()
  await ready(page)
  await expect(page.getByTestId('view-bench')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.bench').first()).toBeVisible()
  await page.getByTestId('view-grid').click()
  await expect(page.locator('.bench')).toHaveCount(0)
  await expect(page.getByTestId('printing-now')).toBeVisible()
})

test('a bench folds away, and stays folded', async ({ page }) => {
  await openPrinters(page)
  await toBench(page)
  const bench = page.getByTestId('group-saved')
  await expect(bench.locator('[data-tid^="printer-tile-"]').first()).toBeVisible()
  await bench.getByTestId('bench-fold').click()
  await expect(bench.locator('[data-tid^="printer-tile-"]').first()).toBeHidden()
  await page.reload()
  await ready(page)
  await expect(page.getByTestId('group-saved').locator('[data-tid^="printer-tile-"]').first()).toBeHidden()
  await page.getByTestId('group-saved').getByTestId('bench-fold').click()
  await expect(page.getByTestId('group-saved').locator('[data-tid^="printer-tile-"]').first()).toBeVisible()
})

test.describe('signed in', () => {
  test.use({ signedIn: true })

  test('your groups are benches; a printer shared with you sits on its shelf tagged with who shared it', async ({ page }) => {
    await withAccountPrinters(page, [
      cloudPrinter('p-elm', 'Elm'),
      cloudPrinter('p-cedar', 'Cedar'),
      cloudPrinter('p-elder', 'Elder', { shared: true, sharer: { account_id: 'a-mara', display_name: 'Mara' } })
    ], [{ id: 'g1', name: 'Workshop bench', printers: ['p-elm', 'p-cedar'] }])
    await openPrinters(page)
    await toBench(page)
    const workshop = page.getByTestId('group-g1')
    await expect(workshop.getByRole('heading', { name: 'Workshop bench' })).toBeVisible()
    await expect(workshop.getByTestId('printer-tile-cloud:p-elm')).toBeVisible()
    await expect(workshop.getByTestId('printer-tile-cloud:p-cedar')).toBeVisible()
    const shared = page.getByTestId('group-shared')
    await expect(shared.getByRole('heading', { name: 'Shared with you' })).toBeVisible()
    await expect(shared.getByTestId('printer-tile-cloud:p-elder').getByTestId('shared-by')).toHaveText('from Mara')
    // The same tag, from the same data, in Grid and in List, and only on the shared one.
    for (const view of ['grid', 'list']) {
      await page.getByTestId(`view-${view}`).click()
      await expect(page.getByTestId(`view-${view}`)).toHaveAttribute('aria-pressed', 'true')
      const elder = page.getByTestId('group-shared').getByTestId('printer-tile-cloud:p-elder')
      await expect(elder.getByTestId('shared-by')).toHaveText('from Mara')
      await expect(page.getByTestId('shared-by')).toHaveCount(1)
    }
  })

  test('on a phone the second row of printers on a bench stands on the bench too', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await withAccountPrinters(page, [
      cloudPrinter('p-elm', 'Elm'),
      cloudPrinter('p-cedar', 'Cedar'),
      cloudPrinter('p-ash', 'Ash')
    ], [{ id: 'g1', name: 'Workshop bench', printers: ['p-elm', 'p-cedar', 'p-ash'] }])
    await openPrinters(page)
    await toBench(page)
    const workshop = page.getByTestId('group-g1')
    const first = (await workshop.getByTestId('printer-tile-cloud:p-elm').boundingBox())!
    const third = (await workshop.getByTestId('printer-tile-cloud:p-ash').boundingBox())!
    // Three don't fit one row at 390 px: Ash wraps onto a second row.
    expect(third.y).toBeGreaterThan(first.y + first.height - 1)
    // The bench top draws its line and legs again every row: the drawing repeats downwards,
    // once per row, so Ash's feet are on a line like the first row's.
    const top = await workshop.locator('.bench__top').evaluate(el => {
      const cs = getComputedStyle(el)
      return { repeat: cs.backgroundRepeat, size: cs.backgroundSize, height: el.getBoundingClientRect().height }
    })
    expect(top.repeat).toMatch(/^repeat-y(, repeat-y)*$/)
    const tile = Number(top.size.split(',')[0].trim().split(' ').pop()!.replace('px', ''))
    expect(Math.abs(tile - (third.y - first.y))).toBeLessThan(2)
    // And the bench top is as tall as its two rows, so the last row's line is inside it.
    expect(top.height).toBeGreaterThanOrEqual(2 * tile - 1)
    // The first row's feet are on the bench line too: the drawing's bottom is where the line
    // is drawn, 170px down the bench top (not floating above it, or sunk below).
    const topBox = (await workshop.locator('.bench__top').boundingBox())!
    const stand = (await workshop.getByTestId('printer-tile-cloud:p-elm').locator('.bprint__stand').boundingBox())!
    expect(Math.abs(stand.y + stand.height - (topBox.y + 170))).toBeLessThanOrEqual(4)
    // And Ash's, one row down.
    const ashStand = (await workshop.getByTestId('printer-tile-cloud:p-ash').locator('.bprint__stand').boundingBox())!
    expect(Math.abs(ashStand.y + ashStand.height - (topBox.y + tile + 170))).toBeLessThanOrEqual(4)
  })

  test('a printer dragged onto New bench starts a bench, and it is saved', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Drag and drop is a mouse gesture')
    const saved = await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm'), cloudPrinter('p-cedar', 'Cedar')], [{ id: 'g1', name: 'Workshop bench', printers: ['p-elm', 'p-cedar'] }])
    // Tall enough that the printer and New bench are both on screen: a drag can't scroll the page.
    await page.setViewportSize({ width: 1440, height: 1800 })
    await openPrinters(page)
    await toBench(page)
    const cedar = page.getByTestId('group-g1').getByTestId('printer-tile-cloud:p-cedar')
    await expect(cedar).toBeVisible()
    // By hand: once a drag starts, "Not in a group" appears and moves New bench down.
    await cedar.hover()
    await page.mouse.down()
    await page.mouse.move(10, 10, { steps: 4 })
    const target = page.getByTestId('new-bench')
    const box = (await target.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 })
    await page.mouse.move(box.x + box.width / 2 + 8, box.y + box.height / 2, { steps: 2 })
    await expect(target).toHaveClass(/printers__new-bench--over/)
    await page.mouse.up()
    await expect.poll(() => saved.at(-1)?.groups.length).toBe(2)
    const made = saved.at(-1)!.groups[1]
    expect(made.printers).toEqual(['p-cedar'])
    expect(saved.at(-1)!.groups[0].printers).toEqual(['p-elm'])
    // It is named for renaming straight away.
    await expect(page.getByRole('textbox', { name: 'Bench name' })).toBeFocused()
  })

  test('a printer found nearby waits on its own ground with exactly one thing to do', async ({ page }) => {
    await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm')])
    await withFoundPrinter(page)
    await openPrinters(page)
    await toBench(page)
    const found = page.getByTestId('found')
    await expect(found.getByRole('heading', { name: 'Found nearby · not yours yet' })).toBeVisible({ timeout: 30_000 })
    const larch = found.locator('[data-tid^="printer-tile-"]').first()
    await expect(larch).toContainText('Larch')
    // One button, shown without hovering, and drawn faintly.
    await expect(larch.locator('[data-tid^="bench-action-"]')).toHaveCount(1)
    await expect(larch.locator('[data-tid^="bench-action-"]')).toBeVisible()
    await expect(larch.locator('svg.pdraw')).toHaveClass(/pdraw--dim/)
    // Not linked to anyone: Add, and it opens the link dialog for that printer.
    await expect(larch.getByTestId('bench-action-link')).toHaveText('Add')
    await larch.getByTestId('bench-action-link').click()
    await expect(page.getByRole('dialog')).toContainText('Link a printer to your account')
  })

  test('a found printer linked to another account offers Ask its owner, and it opens the request dialog', async ({ page }) => {
    await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm')])
    await withFoundPrinter(page, { linked: true })
    await openPrinters(page)
    await toBench(page)
    const larch = page.getByTestId('found').locator('[data-tid^="printer-tile-"]').first()
    await expect(larch).toContainText('Larch', { timeout: 30_000 })
    await expect(larch.locator('[data-tid^="bench-action-"]')).toHaveCount(1)
    await expect(larch.getByTestId('bench-action-ask')).toHaveText('Ask its owner')
    await larch.getByTestId('bench-action-ask').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByTestId('access-code').or(page.getByTestId('access-outcome'))).toBeVisible()
  })

  test('nothing matching the search says so in Bench as in Grid and List, and Clear search brings the benches back', async ({ page }, info) => {
    test.skip(info.project.name === 'phone', 'Search is not on the phone header')
    await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm'), cloudPrinter('p-cedar', 'Cedar')], [{ id: 'g1', name: 'Workshop bench', printers: ['p-elm', 'p-cedar'] }])
    await openPrinters(page)
    await toBench(page)
    await expect(page.getByTestId('group-g1')).toBeVisible()
    await page.getByTestId('printers-search').fill('zzz')
    await expect(page.getByTestId('printers-none')).toContainText('No printer matches "zzz"')
    await expect(page.locator('.bench')).toHaveCount(0)
    await page.getByTestId('printers-none').getByRole('button', { name: 'Clear search' }).click()
    await expect(page.getByTestId('printers-none')).toHaveCount(0)
    await expect(page.getByTestId('group-g1')).toBeVisible()
  })

  test('New bench works from the keyboard: Enter makes a bench, named for renaming', async ({ page }) => {
    await withAccountPrinters(page, [cloudPrinter('p-elm', 'Elm')], [{ id: 'g1', name: 'Workshop bench', printers: ['p-elm'] }])
    await openPrinters(page)
    await toBench(page)
    const target = page.getByTestId('new-bench')
    await expect(target).toHaveAttribute('role', 'button')
    await expect(target).toHaveAccessibleName('New bench')
    await target.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('textbox', { name: 'Bench name' })).toBeFocused()
  })
})
