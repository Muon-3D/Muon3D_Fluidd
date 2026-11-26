/**
 * The admin portal at control.muon3d.com/admin (KAN-6100) and the staff items in the
 * account menu (KAN-6113), against the design spec docs/control/admin-portal.md
 * (muon3d-design #68, section 7) and Jack's D-204: one staff session of 60 minutes,
 * 15 minutes of inactivity logging it out. The console's obs endpoints do not exist yet
 * (KAN-6115): e2e/fakes/admin.ts answers them as the spec says they will. Time is real;
 * a test shortens a limit instead of waiting for it.
 */
import type { Page } from '@playwright/test'
import { test, expect, ready } from '../fixtures'
import { serveConsoleHere } from '../fakes/console'
import { adminState, allowPasskey, calls, cancelPasskey, serveAdmin, type AdminState } from '../fakes/admin'

test.use({ signedIn: true })

let admin: AdminState
let origin = ''

test.beforeEach(async ({ page, account, baseURL }) => {
  admin = adminState()
  origin = new URL(baseURL!).origin
  account.staff = true
  await serveConsoleHere(page, account, origin)
  await serveAdmin(page, admin, origin)
  await allowPasskey(page)
})

async function visit (page: Page, path: string) {
  await page.goto(path)
  await ready(page)
}
const queries = () => calls(admin, '/v1/admin/obs/query')
const obsCalls = () => admin.seen.filter(s => s.path.startsWith('/v1/admin/obs/'))
const chip = (page: Page) => page.getByTestId('admin-chip')
async function confirm (page: Page) {
  await page.getByTestId('admin-confirm').click()
  await expect(chip(page)).toContainText(/Session|Idle/)
}

test.describe('signed out', () => {
  test.use({ signedIn: false })
  test('shows the sign-in card only: no nav, no section names, and signing in asks for this very page back', async ({ page }) => {
    await visit(page, '/admin/logs?level=error')
    await expect(page.getByTestId('admin-signin')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Admin' })).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('Traffic and latency')
    await expect(page.locator('body')).not.toContainText('Staff tools')
    expect(admin.seen).toEqual([])
    const authorize = page.waitForRequest(r => r.url().includes('/authorize'))
    await page.getByTestId('admin-signin-go').click()
    expect(new URL((await authorize).url()).pathname).toBe('/authorize')
    expect(await page.evaluate(() => Object.values(sessionStorage).join(' '))).toContain('/admin/logs?level=error')
  })
})

test.describe('who gets in', () => {
  test('a signed-in account that is not staff sees "Staff only" with its e-mail, and nothing is asked of the console', async ({ page, account }) => {
    account.staff = undefined
    await visit(page, '/admin')
    const card = page.getByTestId('admin-card-not-staff')
    await expect(card).toContainText('Staff only')
    await expect(page.getByTestId('admin-card-account')).toHaveText('jack@example.test')
    await expect(page.getByRole('navigation', { name: 'Admin' })).toHaveCount(0)
    expect(admin.seen).toEqual([])
    await expect(page.getByTestId('admin-card-back')).toBeVisible()
  })

  test('a moderator gets "Staff only" on /admin but can still open the review queue', async ({ page, account }) => {
    account.staff = 'moderator'; admin.role = 'moderator'
    await visit(page, '/admin')
    await expect(page.getByTestId('admin-card-not-staff')).toBeVisible()
    await page.goto('/admin/tools/review')
    await expect(page.getByRole('heading', { name: 'Review queue' })).toBeVisible()
    expect(obsCalls()).toEqual([])
  })

  test('staff who have not confirmed see the shell over skeletons and the passkey card; nothing is fetched until it succeeds', async ({ page }) => {
    await visit(page, '/admin/traffic')
    await expect(page.getByTestId('admin-card-not-confirmed')).toContainText("Confirm it's you")
    await expect(page.getByTestId('admin-card-not-confirmed')).toContainText('60 minutes')
    await expect(chip(page)).toHaveText('Not confirmed')
    await expect(page.getByRole('navigation', { name: 'Admin' })).toBeAttached()
    expect(obsCalls()).toEqual([])
    await confirm(page)
    await expect(page.getByTestId('admin-card-not-confirmed')).toHaveCount(0)
    await expect(page.getByTestId('admin-section-traffic')).toBeVisible()
    expect(admin.ceremonies).toBe(1)
  })

  test('staff with no passkey are told to add one, with a link to security settings', async ({ page }) => {
    admin.passkey = false
    await visit(page, '/admin')
    await page.getByTestId('admin-confirm').click()
    const card = page.getByTestId('admin-card-no-passkey')
    await expect(card).toContainText('Add a passkey first')
    await expect(page.getByTestId('admin-card-security')).toHaveAttribute('href', /\/account\/security/)
  })

  test('a cancelled passkey says so under the button and keeps the card', async ({ page }) => {
    await cancelPasskey(page)
    await visit(page, '/admin')
    await page.getByTestId('admin-confirm').click()
    await expect(page.getByTestId('admin-card-not-confirmed')).toContainText("That didn't work. Try your passkey again.")
    expect(obsCalls()).toEqual([])
  })

  test('the portal is not offered on a console that has not been told who is staff (no `staff` on /v1/me)', async ({ page, account }) => {
    delete account.staff
    await visit(page, '/admin')
    await expect(page.getByTestId('admin-card-not-staff')).toBeVisible()
  })
})

test.describe('the session (D-204)', () => {
  test('after confirming the chip reads Session 59:5x and counts down; the window is 3600 s', async ({ page }) => {
    await visit(page, '/admin')
    await confirm(page)
    await expect(chip(page)).toHaveText(/^Session (60:00|59:5\d)$/)
    const first = await chip(page).innerText()
    await expect(chip(page)).not.toHaveText(first)
    expect(admin.confirmedAt).toBeGreaterThan(0)
    expect(admin.lease).toBe(3600)
  })

  test('5 minutes before the 60-minute limit: amber banner and chip; "Confirm now" renews in place and the page is unchanged', async ({ page }) => {
    await visit(page, '/admin/traffic?range=24h&job=muon-models')
    admin.lease = 290
    await confirm(page)
    const banner = page.getByTestId('admin-banner-absolute')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText('Your 60-minute session ends in')
    await expect(chip(page)).toHaveClass(/adm-chip--warn/)
    admin.lease = 3600
    await page.getByTestId('admin-banner-confirm').click()
    await expect(banner).toHaveCount(0)
    await expect(chip(page)).toHaveText(/^Session (60:00|59:5\d)$/)
    expect(admin.ceremonies).toBe(2)
    expect(new URL(page.url()).search).toBe('?range=24h&job=muon-models')
  })

  test('at 60 minutes the session ends on the same page, says so, and one tap restores it with its filters and lines', async ({ page }) => {
    await visit(page, '/admin/logs?rid=req-abc')
    admin.lease = 10
    await confirm(page)
    await expect(page.getByTestId('admin-line')).toHaveCount(2)
    const ended = page.getByTestId('admin-card-ended')
    await expect(ended).toContainText('Session ended')
    await expect(ended).toContainText('Your 60-minute admin session has ended')
    await expect(chip(page)).toHaveText('Session ended')
    // The page behind is kept, blurred and out of the accessibility tree.
    await expect(page.locator('main.adm-main')).toHaveAttribute('aria-hidden', 'true')
    const before = obsCalls().length
    admin.lease = 3600
    await page.getByTestId('admin-confirm').click()
    await expect(ended).toHaveCount(0)
    await expect(page.getByTestId('admin-line')).toHaveCount(2)
    expect(new URL(page.url()).search).toBe('?rid=req-abc')
    expect(obsCalls().length).toBeGreaterThanOrEqual(before)
  })

  test('2 minutes before the idle limit "Still there?" appears; "Stay signed in" counts as activity and needs no passkey', async ({ page }) => {
    await visit(page, '/admin')
    admin.idle = 100
    await confirm(page)
    const banner = page.getByTestId('admin-banner-idle')
    await expect(banner).toContainText('Still there?')
    await expect(chip(page)).toHaveText(/^Idle /)
    admin.idle = 900
    await page.getByTestId('admin-banner-stay').click()
    await expect(banner).toHaveCount(0)
    expect(calls(admin, '/v1/admin/session/touch')).toHaveLength(1)
    expect(admin.ceremonies).toBe(1)
  })

  test('15 minutes without activity ends the session with the inactivity message, keeping the page', async ({ page }) => {
    await visit(page, '/admin/errors?job=muon-models')
    admin.idle = 4
    await confirm(page)
    const ended = page.getByTestId('admin-card-ended')
    await expect(ended).toContainText('You were inactive for 15 minutes')
    expect(new URL(page.url()).pathname).toBe('/admin/errors')
    admin.idle = 900
    await page.getByTestId('admin-confirm').click()
    await expect(ended).toHaveCount(0)
    expect(new URL(page.url()).search).toBe('?job=muon-models')
  })

  test('background calls never count as activity: the console is told which they are', async ({ page }) => {
    await visit(page, '/admin')
    await confirm(page)
    await expect(page.getByTestId('admin-tile-ov-rps')).toContainText('12')
    expect(queries().length).toBeGreaterThan(0)
    expect(queries().every(q => q.background === false)).toBe(true)
    await expect.poll(() => calls(admin, '/v1/admin/obs/alerts').length).toBeGreaterThan(0)
    expect(calls(admin, '/v1/admin/obs/alerts').every(q => q.background)).toBe(true)
    expect(calls(admin, '/v1/admin/session').every(q => q.background)).toBe(true)
  })

  test('End session ends only the staff session: the card says so, the replayed token gets 403 "ended", and Control stays signed in', async ({ page }) => {
    await visit(page, '/admin/accounts')
    await confirm(page)
    await chip(page).click()
    await expect(page.getByTestId('admin-chip-menu')).toContainText('Signs out after 15 minutes without activity')
    await page.getByTestId('admin-end-session').click()
    await expect(page.getByTestId('admin-toast')).toHaveText('Admin session ended.')
    await expect(page.getByTestId('admin-card-ended')).toContainText('You ended your admin session')
    expect(calls(admin, '/v1/admin/session/end')).toHaveLength(1)
    const replay = await page.evaluate(async origin => {
      const r = await fetch(`${origin}/v1/admin/obs/query`, { method: 'POST', headers: { authorization: 'Bearer e2e-session', 'content-type': 'application/json' }, body: JSON.stringify({ panels: ['ov-rps'], range: '6h' }) })
      return { status: r.status, body: await r.json() }
    }, origin)
    expect(replay.status).toBe(403)
    expect(replay.body.reason).toBe('ended')
    expect(await page.evaluate(() => localStorage.getItem('muon.cloud.token'))).toBe('e2e-session')
    expect(new URL(page.url()).pathname).toBe('/admin/accounts')
  })
})

test.describe('panels', () => {
  test.beforeEach(async ({ page }) => {
    await visit(page, '/admin')
    await confirm(page)
  })

  test('the overview has 8 tiles; with machine-queue and tracker down "Services up" reads 3 of 5, amber, and names both', async ({ page }) => {
    await expect(page.locator('[data-tid^=admin-tile-]')).toHaveCount(8)
    const services = page.getByTestId('admin-tile-ov-services')
    await expect(services).toContainText('3 of 5')
    await expect(services).toContainText('machine-queue and tracker are down')
    await expect(services.locator('.tile__dot--warning')).toHaveCount(1)
    await expect(services).toHaveAttribute('aria-label', /warning$/)
  })

  test('a failing panel says "No data from ..." alone and Retry asks for that panel only', async ({ page }) => {
    admin.failPanels.add('ov-rps-job')
    await page.reload(); await ready(page)
    await confirmIfAsked(page)
    const bad = page.getByTestId('admin-panel-ov-rps-job')
    await expect(bad).toContainText('No data from')
    await expect(page.getByTestId('admin-chart-ov-p95-job')).toBeVisible()
    admin.failPanels.clear()
    const before = queries().length
    await page.getByTestId('admin-retry-ov-rps-job').click()
    await expect(page.getByTestId('admin-chart-ov-rps-job')).toBeVisible()
    expect(queries().length).toBe(before + 1)
    expect(queries().at(-1)!.body.panels).toEqual(['ov-rps-job'])
  })

  test('a placeholder is dashed and tagged, names its metric, and never reaches the console as a query', async ({ page }) => {
    const panel = page.getByTestId('admin-panel-ov-signins')
    await expect(panel).toHaveAttribute('data-kind', 'placeholder')
    await expect(panel).toContainText('PLACEHOLDER')
    await expect(panel).toContainText('Not instrumented yet')
    await expect(panel).toContainText('muon_console_signins_total{method,result}')
    await expect(panel).toContainText('Needs: muon-console (signin.rs)')
    await expect(panel).toHaveCSS('border-top-style', 'dashed')
    await expect(panel.getByRole('button')).toHaveCount(0)
    expect(queries().flatMap(q => q.body.panels)).not.toContain('ov-signins')
    expect(queries().flatMap(q => q.body.panels)).not.toContain('ov-prints')
  })

  test('with job=machine-queue every panel shows the unavailable state naming 127.0.0.1:9466', async ({ page }) => {
    await page.goto('/admin/traffic?job=machine-queue')
    await expect(page.getByTestId('admin-unavailable-tr-route')).toContainText('127.0.0.1:9466')
    await expect(page.getByTestId('admin-tile-tr-rps')).toContainText('No data')
  })

  test('choosing 24h re-queries the visible panels and the URL, and reloading keeps it', async ({ page }) => {
    const before = queries().length
    await page.getByRole('button', { name: '24h' }).click()
    await expect(page).toHaveURL(/range=24h/)
    await expect.poll(() => queries().length).toBeGreaterThan(before)
    expect(queries().at(-1)!.body.range).toBe('24h')
    await page.reload(); await ready(page)
    await confirmIfAsked(page)
    await expect(page.getByRole('button', { name: '24h' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('every query names panels by id and nothing in it is PromQL', async ({ page }) => {
    await expect(page.getByTestId('admin-tile-ov-rps')).toBeVisible()
    for (const q of queries()) expect(Object.keys(q.body).sort()).toEqual(expect.arrayContaining(['panels', 'range']))
    expect(JSON.stringify(queries().map(q => q.body))).not.toMatch(/rate\(|sum by|\{job=/)
  })

  test('"Show as table" gives the same data to the keyboard', async ({ page }) => {
    await page.getByTestId('admin-table-ov-rps-job').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('admin-panel-ov-rps-job').locator('table')).toContainText('muon-console')
  })

  test('without the console endpoints the page says so and the staff tools still work', async ({ page }) => {
    admin.noObs = true
    await page.getByRole('link', { name: 'Traffic and latency' }).click()
    await expect(page.getByTestId('admin-data-error')).toContainText('not available')
    await page.getByRole('link', { name: 'Accounts', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible()
    await expect(page.getByLabel('Exact email, account ID or handle')).toBeVisible()
  })

  test('auto-refresh asks once per interval, stops with the tab hidden and refreshes at once on return', async ({ page }) => {
    await page.clock.install()
    await page.reload(); await ready(page)
    await confirmIfAsked(page)
    await expect(page.getByTestId('admin-tile-ov-rps')).toContainText('12')
    const base = queries().length
    await page.clock.fastForward(31_000)
    await expect.poll(() => queries().length).toBe(base + 1)
    expect(queries().at(-1)!.background).toBe(true)
    const hide = (state: 'hidden' | 'visible') => page.evaluate(s => {
      Object.defineProperty(document, 'visibilityState', { value: s, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))
    }, state)
    await hide('hidden')
    await page.clock.fastForward(31_000)
    await page.clock.fastForward(31_000)
    expect(queries().length).toBe(base + 1)
    await hide('visible')
    await expect.poll(() => queries().length).toBe(base + 2)
  })
})

/** After a reload the staff session is still open on the console, so the page opens straight in. */
async function confirmIfAsked (page: Page) {
  await expect(chip(page)).toContainText(/Session|Not confirmed/)
  if ((await chip(page).innerText()) === 'Not confirmed') await confirm(page)
}

test.describe('logs', () => {
  test.beforeEach(async ({ page }) => {
    await visit(page, '/admin/logs')
    await confirm(page)
  })

  test('choosing service and level shows only those lines, and the filters are in the URL', async ({ page }) => {
    await expect(page.getByTestId('admin-line')).toHaveCount(4)
    await page.locator('summary', { hasText: 'Service' }).click()
    await page.getByTestId('admin-service-muon-console').check()
    await page.getByTestId('admin-level-info').uncheck()
    await page.getByTestId('admin-level-warn').uncheck()
    await expect(page).toHaveURL(/service=muon-console/)
    await expect(page).toHaveURL(/level=error/)
    const lines = page.getByTestId('admin-line')
    await expect(lines).toHaveCount(1)
    await expect(lines.first()).toContainText('muon-console')
    await expect(lines.first()).toContainText('error')
  })

  test('a request id shows lines from more than one service, oldest first, and a line expands to its fields', async ({ page }) => {
    await page.getByTestId('admin-rid').fill('req-abc')
    await page.getByTestId('admin-search').click()
    const lines = page.getByTestId('admin-line')
    await expect(lines).toHaveCount(2)
    await expect(lines.nth(0)).toContainText('muon-console')
    await expect(lines.nth(1)).toContainText('muon-models')
    await lines.nth(0).click()
    await expect(page.getByTestId('admin-line-fields')).toContainText('request_id')
    await expect(page.getByTestId('admin-line-fields')).toContainText('req-abc')
  })

  test('an empty result says what to do, and the placeholder logs are marked', async ({ page }) => {
    await page.getByTestId('admin-q').fill('no such text anywhere')
    await page.getByTestId('admin-search').click()
    await expect(page.getByTestId('admin-no-lines')).toHaveText('No lines match. Widen the range or clear a filter.')
    await expect(page.getByText('Loki, 14 days kept (nginx access 7 days).')).toBeVisible()
  })

  test('live tail polls as a background call that does not count as activity', async ({ page }) => {
    await page.clock.install()
    await page.getByTestId('admin-tail').click()
    await expect(page.getByTestId('admin-tail')).toHaveAttribute('aria-pressed', 'true')
    const before = calls(admin, '/v1/admin/obs/logs').length
    await page.clock.fastForward(5_500)
    await expect.poll(() => calls(admin, '/v1/admin/obs/logs').length).toBeGreaterThan(before)
    expect(calls(admin, '/v1/admin/obs/logs').at(-1)!.background).toBe(true)
  })
})

test.describe('alerts', () => {
  test('lists what is firing (not the Watchdog), every rule, and says the alerting pipeline works', async ({ page }) => {
    await visit(page, '/admin/alerts')
    await confirm(page)
    await expect(page.getByTestId('admin-watchdog')).toContainText('Working')
    await expect(page.getByTestId('admin-delivery')).toContainText('Waiting for SMTP settings')
    await expect(page.getByTestId('admin-alert-MuonServiceDown')).toContainText('critical')
    await expect(page.getByTestId('admin-alert-Watchdog')).toHaveCount(0)
    await expect(page.getByTestId('admin-rule-MuonHighLoad')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: /^Alerts/ })).toContainText('1')
  })
})

test.describe('the account menu (KAN-6113)', () => {
  const menu = (page: Page) => page.locator('[data-tid=account]:visible').first()

  test('staff see Admin and Fleet; Fleet opens fleet.muon3d.com in this same tab after a passkey', async ({ page, open, context }) => {
    await page.route('https://fleet.muon3d.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Fleet</title><p>Fleet</p>' }))
    await open('/account')
    await menu(page).click()
    await expect(page.getByTestId('account-admin')).toBeVisible()
    await page.getByTestId('account-fleet').click()
    await page.waitForURL(/^https:\/\/fleet\.muon3d\.com\/sign-in#assertion=/)
    expect(context.pages()).toHaveLength(1)
    expect(admin.ceremonies).toBe(1)
  })

  test('Admin opens the portal', async ({ page, open }) => {
    await open('/account')
    await menu(page).click()
    await page.getByTestId('account-admin').click()
    await expect(page).toHaveURL(/\/admin$/)
  })

  for (const staff of [undefined, false, 'moderator'] as const) {
    test(`an account whose staff field is ${String(staff)} sees neither item, and no admin request is made`, async ({ page, open, account }) => {
      account.staff = staff
      await open('/account')
      await menu(page).click()
      await expect(page.getByTestId('account-open').first()).toBeVisible()
      await expect(page.getByTestId('account-fleet')).toHaveCount(0)
      await expect(page.getByTestId('account-admin')).toHaveCount(0)
      expect(admin.seen).toEqual([])
    })
  }
})
