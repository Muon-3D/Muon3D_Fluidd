/**
 * KAN-1389: a password change signs out every session, this one included. Two
 * browsers (two contexts, each with its own storage) are signed in to the same
 * fake console. In A the person changes the password: A goes to the signed-out
 * page with "Your password was changed. Sign in again." Then B, when it gets
 * focus, finds its session ended and shows the signed-out page too.
 *
 * The console here is the e2e fake (e2e/fakes/console.ts) plus a shared
 * session list kept in this file: the real new console is not run. The new
 * console's answer (`signed_out: true`, no `session`) is what the fake sends.
 */
import { test, expect, ready } from '../fixtures'
import { answerConsole, consoleState, type ConsoleState } from '../fakes/console'
import { MOCK_PORT, VITE_PORT } from '../ports'
import type { BrowserContext, Page } from '@playwright/test'

const ORIGIN = `http://localhost:${VITE_PORT}`

/** The sessions the fake console still honours, shared by both browsers. */
function fakeConsole () {
  const alive = new Set<string>()
  const account: ConsoleState = consoleState()
  return { alive, account }
}

async function browser (context: BrowserContext, shared: ReturnType<typeof fakeConsole>, token: string) {
  await context.addInitScript(([url, access, refresh]) => {
    localStorage.setItem('muon.cloud.url', url)
    localStorage.setItem('muon.cloud.token', access)
    localStorage.setItem('muon.cloud.refresh', refresh)
    // The focus check runs at most every 30 s; the test moves this page's clock instead of waiting.
    const real = Date.now.bind(Date)
    ;(window as any).__skew = 0
    Date.now = () => real() + (window as any).__skew
  }, [ORIGIN, token, `refresh-${token}`])
  await context.route('**/config.json', async route => {
    const response = await route.fetch()
    const config = await response.json()
    config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
    config.endpoints = [`http://localhost:${MOCK_PORT}`]
    await route.fulfill({ response, json: config })
  })
  await context.route(`${ORIGIN}/v1/**`, async route => {
    const auth = route.request().headers().authorization ?? ''
    // The printer poll (every 10 s) would also find the session ended; the fake keeps answering it, so only the focus check can.
    const polled = new URL(route.request().url()).pathname === '/v1/printers'
    if (!polled && !shared.alive.has(auth.replace('Bearer ', ''))) {
      return route.fulfill({ status: 401, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ error: 'auth_session_ended' }) })
    }
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (request.method() === 'GET' && path === '/v1/me') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify({ account: { ...shared.account.account, display_name: 'Jack' }, endpoint_id: null, sign_in: { password: true, two_step: false, passkeys: 0, identities: [] } })
      })
    }
    if (request.method() === 'GET' && (path === '/v1/me/passkeys' || path === '/v1/me/identities' || path === '/v1/me/events')) {
      const key = path.split('/').pop()!
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ [key]: [] }) })
    }
    if (request.method() === 'PUT' && path === '/v1/me/password') {
      // The new console: every session of the account ends, this one's too, and the answer carries no `session`.
      shared.alive.clear()
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, signed_out: true }) })
    }
    return answerConsole(route, shared.account)
  })
  // The refresh and the silent sign-in both say the session is over.
  await context.route(`${ORIGIN}/token`, route => route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"invalid_grant"}' }))
  await context.route(`${ORIGIN}/authorize**`, route => route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"login_required"}' }))
  // The console's /logout sends the browser back to /, which goes on to /signed-out.
  await context.route(`${ORIGIN}/logout`, route => route.fulfill({ status: 303, headers: { location: `${ORIGIN}/` } }))
}

async function openSecurity (page: Page) {
  await page.goto('/account/security')
  await ready(page)
  await expect(page.getByTestId('security-change-password')).toBeVisible()
}

test.setTimeout(180_000)

test('a password change in one browser signs out both, and each says so', async ({ page, browser: launcher }) => {
  const shared = fakeConsole()
  shared.alive.add('access-a').add('access-b')
  await browser(page.context(), shared, 'access-a')
  const contextB = await launcher.newContext({ baseURL: ORIGIN, colorScheme: 'dark', viewport: page.viewportSize() ?? undefined, hasTouch: false })
  try {
    await browser(contextB, shared, 'access-b')
    const other = await contextB.newPage()

    await openSecurity(page)
    await openSecurity(other)

    await page.getByTestId('security-change-password').click()
    await page.getByLabel('New password').fill('a brand new password')
    await page.getByRole('button', { name: 'Change password' }).last().click()

    // A: to the signed-out page, with the reason.
    await expect(page.getByTestId('signed-out-page')).toBeVisible()
    await expect(page.getByTestId('signed-out-line')).toHaveText('Your password was changed. Sign in again.')

    // B: still showing the Account page until it is looked at again; on focus it finds the session ended.
    await expect(other.getByTestId('security-change-password')).toBeVisible()
    await other.evaluate(() => { (window as any).__skew += 60_000; window.dispatchEvent(new Event('focus')) })
    await expect(other.getByTestId('security-change-password')).toHaveCount(0)
    await expect(other.getByTestId('account-signed-out')).toBeVisible()
  } finally {
    await contextB.close()
  }
})
