/**
 * KAN-1389: a password change signs out every session, this one included. Two
 * browsers (two contexts, each with its own storage) are signed in to the same
 * fake console. In A the person changes the password: A goes to the signed-out
 * page with "Your password was changed. Sign in again." B, which is not
 * focused and does nothing, is told by the console's live stream
 * (`GET /v1/me/session-events`, KAN-2509) and shows the signed-out page with
 * the reason, within seconds. The fake's other answers carry no reason, so
 * only the stream can produce B's line.
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
  // Resolved by the password change: what every other session's open stream waits for.
  let end!: (changer: string) => void
  const ended = new Promise<string>(resolve => { end = resolve })
  return { alive, account, ended, end, streams: new Set<string>() }
}

async function browser (context: BrowserContext, shared: ReturnType<typeof fakeConsole>, token: string) {
  await context.addInitScript(([url, access, refresh]) => {
    localStorage.setItem('muon.cloud.url', url)
    localStorage.setItem('muon.cloud.token', access)
    localStorage.setItem('muon.cloud.refresh', refresh)
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
    if (request.method() === 'GET' && path === '/v1/me/session-events') {
      // The live push: open until the password changes, then `session_ended` and close. The session that made the
      // change is not signalled (its own answer says so), as the console does.
      shared.streams.add(auth)
      const changer = await shared.ended
      if (`Bearer ${changer}` === auth) return new Promise<void>(() => {})
      return route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        headers: { 'access-control-allow-origin': '*' },
        body: 'event: session_ended\ndata: {"reason":"password_changed"}\n\n'
      })
    }
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
      shared.end(auth.replace('Bearer ', ''))
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
    // The push can only reach a browser whose stream is open at the console.
    await expect.poll(() => [...shared.streams].sort()).toEqual(['Bearer access-a', 'Bearer access-b'])

    await page.getByTestId('security-change-password').click()
    await page.getByLabel('New password').fill('a brand new password')
    await page.getByRole('button', { name: 'Change password' }).last().click()

    // A: to the signed-out page, with the reason.
    await expect(page.getByTestId('signed-out-page')).toBeVisible()
    await expect(page.getByTestId('signed-out-line')).toHaveText('Your password was changed. Sign in again.')

    // B: nobody looked at it, no focus, no click: the stream told it, and it says why.
    await expect(other.getByTestId('signed-out-page')).toBeVisible()
    await expect(other.getByTestId('signed-out-line')).toHaveText('You were signed out because your password changed.')
  } finally {
    await contextB.close()
  }
})
