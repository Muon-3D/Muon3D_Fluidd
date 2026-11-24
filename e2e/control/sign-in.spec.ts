/**
 * The one MUON3D sign-in (KAN-6114; spec docs/control/sign-in.md section 7,
 * as amended for one account): the console's /sign-in page that Control,
 * Library, the slicer and Models all reach through /authorize.
 *
 * The console serving this page is faked per test (`serveAuth`): password,
 * two-step code, passkey, forgot-password, the passkey count for the nudge
 * and the handoff. The browser's passkey sheet is a stub on
 * navigator.credentials.get, set per test to "ok", "cancel" or "unknown".
 */
import AxeBuilder from '@axe-core/playwright'
import type { Page, Request } from '@playwright/test'
import { test, expect } from '../fixtures'

const CONTINUE = '/authorize?client_id=library&redirect_uri=https%3A%2F%2Flibrary.example%2Fcb&state=s1&code_challenge=c&code_challenge_method=S256'
const DEEP = '/authorize?client_id=fluidd&state=deep&redirect_uri=https%3A%2F%2Fcontrol.example%2F'

interface Auth {
  /** Every API request, "METHOD /path". */
  calls: string[];
  /** The `next` of the handoff the page navigated to. */
  handoffNext: string | null;
  mfa: boolean;
  limitAfter: number;
  attempts: number;
  passkeys: number;
  passkeySignIn: 'ok' | 'unknown';
  rekeyed: boolean;
}

async function serveAuth (page: Page, over: Partial<Auth> = {}): Promise<Auth> {
  const state: Auth = { calls: [], handoffNext: null, mfa: false, limitAfter: 99, attempts: 0, passkeys: 1, passkeySignIn: 'ok', rekeyed: true, ...over }
  const json = (route: import('@playwright/test').Route, status: number, body: unknown, headers: Record<string, string> = {}) =>
    route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(body) })
  await page.route('**/v1/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const call = `${request.method()} ${url.pathname}`
    state.calls.push(call)
    const body = (request.postDataJSON?.() ?? {}) as Record<string, string>
    switch (call) {
      case 'GET /v1/config': return json(route, 200, { social: { google: true, apple: true } })
      case 'POST /v1/auth/sign-in':
        state.attempts++
        if (state.attempts > state.limitAfter) return json(route, 429, { error: 'too many attempts; try again in 42 seconds' }, { 'retry-after': '42' })
        if (body.password !== 'correct horse') return json(route, 401, { error: 'that email and password do not match' })
        if (state.mfa) return json(route, 403, { error: 'enter the code from your authenticator app', mfa_required: true, mfa_token: 'mfa-1' })
        return json(route, 200, { token: 'page-session' })
      case 'POST /v1/auth/mfa':
        return body.code === '482913' ? json(route, 200, { token: 'page-session' }) : json(route, 401, { error: 'that code is not right' })
      case 'POST /v1/auth/passkey/options':
        return json(route, 200, { ceremony_id: 'c1', options: { publicKey: { challenge: 'AAAA', rpId: 'localhost', userVerification: 'required' } } })
      case 'POST /v1/auth/passkey':
        return state.passkeySignIn === 'ok' ? json(route, 200, { token: 'page-session' }) : json(route, 401, { error: 'that passkey is not registered here' })
      case 'POST /v1/auth/password/forgot': return json(route, 200, { ok: true })
      case 'GET /v1/me': return json(route, 200, { account: { id: 'a1', email: 'jack@muon3d.com', name: 'Jack' }, sign_in: { password: true, passkeys: state.passkeys, identities: [], two_step: false } })
      case 'POST /v1/me/passkeys/options':
        return json(route, 200, { ceremony_id: 'c2', options: { publicKey: { challenge: 'AAAA', rp: { name: 'MUON3D', id: 'localhost' }, user: { id: 'AQ', name: 'jack', displayName: 'Jack' }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }] } } })
      case 'POST /v1/me/passkeys': {
        state.passkeys = 1
        return json(route, 200, { id: 'p1', name: 'Chrome', session: state.rekeyed ? { access_token: 'rekeyed-session' } : null })
      }
      case 'POST /v1/handoff': return json(route, 200, { code: 'h1', url: '/handoff?code=h1', expires_at: 9999999999 })
      default: return json(route, 200, {})
    }
  })
  await page.route('**/authorize**', route => route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"login_required"}' }))
  await page.route(/\/handoff\?code=/, route => {
    state.handoffNext = new URL(route.request().url()).searchParams.get('next')
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>handed off</title><p id="done">Signed in</p>' })
  })
  return state
}

/** Stubs the browser's passkey sheet. `cancel` dismisses it, as a person can. */
async function stubPasskeys (page: Page, mode: 'ok' | 'cancel' = 'ok') {
  await page.addInitScript(m => {
    const buffer = (n: number) => new Uint8Array([n]).buffer
    ;(window as unknown as { __passkey: string }).__passkey = m
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {
        get: async () => {
          if ((window as unknown as { __passkey: string }).__passkey === 'cancel') throw new DOMException('dismissed', 'NotAllowedError')
          return { id: 'cred', rawId: buffer(1), type: 'public-key', response: { clientDataJSON: buffer(2), authenticatorData: buffer(3), signature: buffer(4) } }
        },
        create: async () => {
          if ((window as unknown as { __passkey: string }).__passkey === 'cancel') throw new DOMException('dismissed', 'NotAllowedError')
          return { id: 'cred', rawId: buffer(1), type: 'public-key', response: { clientDataJSON: buffer(2), attestationObject: buffer(5) } }
        }
      }
    })
  }, mode)
}

async function visit (page: Page, query = `continue=${encodeURIComponent(CONTINUE)}`) {
  await page.goto(`/sign-in?${query}`)
  await expect(page.getByTestId('auth-title')).toBeVisible()
}

async function passwordSignIn (page: Page, email = 'jack@muon3d.com', password = 'correct horse') {
  await page.getByTestId('sign-in-email').fill(email)
  await page.getByTestId('sign-in-continue').click()
  await page.getByTestId('sign-in-password').fill(password)
  await page.getByTestId('sign-in-submit').click()
}

const order = (page: Page) => page.locator('[data-method]').evaluateAll(els => els.map(e => e.getAttribute('data-method')))

test.use({ serviceWorkers: 'block' })

test.describe('the card', () => {
  test('a new browser sees one MUON3D card: passkey, email, then four greyed providers, and no badge', async ({ page }) => {
    await stubPasskeys(page)
    await serveAuth(page)
    await visit(page)
    await expect(page.getByRole('heading', { name: 'Sign in to MUON3D' })).toBeVisible()
    await expect(page.getByTestId('sign-in-continuing')).toHaveText('Continuing to Library')
    expect(await order(page)).toEqual(['passkey', 'email'])
    await expect(page.getByTestId('sign-in-passkey')).toHaveText(/Sign in with a passkey/)
    const providers = page.getByTestId('sign-in-providers').getByRole('button')
    await expect(providers).toHaveText([/Google/, /Apple/, /GitHub/, /Microsoft/])
    await expect(page.getByTestId('sign-in-last-used')).toHaveCount(0)
    await expect(page.locator('.cbtn--primary')).toHaveCount(1)
  })

  test('with no continue, or one for an unknown app, there is no "Continuing to" line', async ({ page }) => {
    await serveAuth(page)
    await visit(page, '')
    await expect(page.getByTestId('sign-in-continuing')).toHaveCount(0)
    await expect(page.getByText('One account for your printers, the slicer and your models.')).toBeVisible()
    await visit(page, `continue=${encodeURIComponent('/authorize?client_id=someone-else&state=x')}`)
    await expect(page.getByTestId('sign-in-continuing')).toHaveCount(0)
  })

  test('each greyed provider is reachable by keyboard, says Coming soon, and does nothing', async ({ page }) => {
    await serveAuth(page)
    await visit(page)
    const before = page.url()
    for (const name of ['Google', 'Apple', 'GitHub', 'Microsoft']) {
      const button = page.getByTestId(`sign-in-provider-${name.toLowerCase()}`)
      await expect(button).toHaveAttribute('aria-disabled', 'true')
      await button.focus()
      await expect(button).toBeFocused()
      await expect(button.getByRole('tooltip')).toBeVisible()
      await expect(button.getByRole('tooltip')).toHaveText('Coming soon')
    }
    const requests: Request[] = []
    page.on('request', r => { if (!r.url().includes('/@') && !r.url().includes('/src/')) requests.push(r) })
    const google = page.getByTestId('sign-in-provider-google')
    await google.click()
    await google.press('Enter')
    await google.press('Space')
    expect(requests.filter(r => r.method() !== 'GET')).toHaveLength(0)
    expect(page.url()).toBe(before)
  })

  test('has no horizontal scroll, and no label cut off', async ({ page }) => {
    await serveAuth(page)
    await visit(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    for (const button of await page.locator('.auth-card .cbtn, .auth-providers button').all()) {
      expect(await button.evaluate(b => b.scrollWidth <= b.clientWidth + 1)).toBe(true)
    }
  })

  test('passes axe in light and in dark', async ({ page }) => {
    await serveAuth(page)
    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme })
      await visit(page)
      const results = await new AxeBuilder({ page }).include('.auth-card').disableRules(['color-contrast']).analyze()
      expect(results.violations, scheme).toEqual([])
    }
  })
})

test.describe('last used', () => {
  test('after an email sign-in the email block is first with the badge, and only the method is stored', async ({ page }) => {
    await stubPasskeys(page)
    const auth = await serveAuth(page, { passkeys: 1 })
    await visit(page)
    await passwordSignIn(page)
    await expect(page.locator('#done')).toBeVisible()
    expect(auth.handoffNext).toBe(CONTINUE)

    const stored = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)))
    expect(JSON.parse(stored['muon.signin.last'])).toEqual({ v: 1, method: 'email' })
    expect(JSON.stringify(stored)).not.toContain('jack@muon3d.com')

    await visit(page)
    expect(await order(page)).toEqual(['email', 'passkey'])
    await expect(page.getByTestId('sign-in-last-used')).toHaveText('Last used')
    await expect(page.getByTestId('sign-in-continue')).toHaveClass(/cbtn--primary/)
    await expect(page.getByTestId('sign-in-passkey')).not.toHaveClass(/cbtn--primary/)
    await expect(page.getByRole('heading', { name: 'Sign in to MUON3D' })).toBeVisible()
  })

  test('after a passkey sign-in the passkey is first with the badge, and the nudge never shows', async ({ page }) => {
    await stubPasskeys(page)
    const auth = await serveAuth(page, { passkeys: 0 })
    await visit(page)
    await page.getByTestId('sign-in-passkey').click()
    await expect(page.locator('#done')).toBeVisible()
    expect(auth.calls).not.toContain('GET /v1/me')
    await visit(page)
    expect(await order(page)).toEqual(['passkey', 'email'])
    await expect(page.getByTestId('sign-in-last-used')).toBeVisible()
    await expect(page.getByTestId('sign-in-passkey')).toHaveClass(/cbtn--primary/)
  })

  test('the same badge shows for every surface, because there is one page', async ({ page }) => {
    await serveAuth(page)
    await visit(page)
    await passwordSignIn(page)
    await expect(page.locator('#done')).toBeVisible()
    for (const client of ['library', 'slicer', 'models', 'fluidd']) {
      await visit(page, `continue=${encodeURIComponent(`/authorize?client_id=${client}&state=x`)}`)
      await expect(page.getByTestId('sign-in-last-used')).toBeVisible()
    }
    await visit(page, `continue=${encodeURIComponent('/authorize?client_id=slicer&state=x')}`)
    await expect(page.getByTestId('sign-in-continuing')).toHaveText('Continuing to Slicer')
  })
})

test.describe('deep links', () => {
  test('a Library continue survives every card step, and the handoff carries it unchanged', async ({ page }) => {
    const auth = await serveAuth(page, { mfa: true })
    await visit(page)
    await page.getByTestId('sign-in-email').fill('jack@muon3d.com')
    await page.getByTestId('sign-in-continue').click()
    await page.getByTestId('sign-in-forgot').click()
    await page.getByTestId('sign-in-back').click()
    expect(new URL(page.url()).searchParams.get('continue')).toBe(CONTINUE)
    await passwordSignIn(page)
    await expect(page.getByRole('heading', { name: 'Enter your code' })).toBeVisible()
    await page.getByTestId('sign-in-code').fill('482 913')
    await page.getByTestId('sign-in-submit').click()
    await expect(page.locator('#done')).toBeVisible()
    expect(auth.handoffNext).toBe(CONTINUE)
  })

  test('a Control deep link (the /authorize it asked with) is handed off exactly as it came', async ({ page }) => {
    const auth = await serveAuth(page)
    await visit(page, `continue=${encodeURIComponent(DEEP)}`)
    await expect(page.getByTestId('sign-in-continuing')).toHaveText('Continuing to Control')
    await passwordSignIn(page)
    await expect(page.locator('#done')).toBeVisible()
    expect(auth.handoffNext).toBe(DEEP)
  })

  test('a continue that is not /authorize is ignored, and signing in still works', async ({ page }) => {
    const auth = await serveAuth(page)
    await visit(page, `continue=${encodeURIComponent('https://evil.example/steal')}`)
    await expect(page.getByTestId('sign-in-continuing')).toHaveCount(0)
    await passwordSignIn(page)
    await expect(page.locator('#done')).toBeVisible()
    expect(auth.handoffNext).not.toContain('evil.example')
  })
})

test.describe('passkeys', () => {
  test('dismissing the browser sheet leaves a muted line and no red alert', async ({ page }) => {
    await stubPasskeys(page, 'cancel')
    await serveAuth(page)
    await visit(page)
    await page.getByTestId('sign-in-passkey').click()
    await expect(page.getByTestId('sign-in-passkey-cancelled')).toHaveText('Passkey sign-in cancelled.')
    await expect(page.getByTestId('sign-in-error')).toHaveCount(0)
    await expect(page.getByTestId('sign-in-passkey')).toBeEnabled()
  })

  test('a passkey the console does not know shows its own alert, and the button works again', async ({ page }) => {
    await stubPasskeys(page)
    await serveAuth(page, { passkeySignIn: 'unknown' })
    await visit(page)
    await page.getByTestId('sign-in-passkey').click()
    await expect(page.getByTestId('sign-in-error')).toContainText('That passkey isn\'t set up for Muon3D.')
    await expect(page.getByTestId('sign-in-passkey')).toBeEnabled()
  })

  test('a browser without WebAuthn has email first and says so', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'PublicKeyCredential', { value: undefined, configurable: true }) })
    await serveAuth(page)
    await visit(page)
    await expect(page.getByTestId('sign-in-passkey')).toHaveCount(0)
    expect(await order(page)).toEqual(['email'])
    await expect(page.getByTestId('sign-in-continue')).toHaveClass(/cbtn--primary/)
    await expect(page.getByTestId('sign-in-no-passkeys')).toHaveText('This browser can\'t use passkeys.')
  })

  test('where conditional mediation is available, a passkey chosen from autofill signs in with no button press', async ({ page }) => {
    await page.addInitScript(() => {
      const credential = window.PublicKeyCredential as unknown as { isConditionalMediationAvailable?: () => Promise<boolean> }
      credential.isConditionalMediationAvailable = async () => true
      const buffer = (n: number) => new Uint8Array([n]).buffer
      Object.defineProperty(navigator, 'credentials', {
        configurable: true,
        value: {
          get: async (options: { mediation?: string }) => {
            if (options.mediation !== 'conditional') throw new DOMException('dismissed', 'NotAllowedError')
            await new Promise(resolve => setTimeout(resolve, 200))
            return { id: 'cred', rawId: buffer(1), type: 'public-key', response: { clientDataJSON: buffer(2), authenticatorData: buffer(3), signature: buffer(4) } }
          },
          create: async () => null
        }
      })
    })
    const auth = await serveAuth(page)
    await visit(page)
    await expect(page.locator('#done')).toBeVisible()
    expect(auth.calls).toContain('POST /v1/auth/passkey')
  })
})

test.describe('email and password', () => {
  test('Continue shows the address with Change; a wrong password says so and empties the field', async ({ page }) => {
    await serveAuth(page)
    await visit(page)
    await page.getByTestId('sign-in-email').fill('jack@muon3d.com')
    await page.getByTestId('sign-in-continue').click()
    await expect(page.getByTestId('sign-in-email-readonly')).toHaveValue('jack@muon3d.com')
    await expect(page.getByTestId('sign-in-change')).toBeVisible()
    await page.getByTestId('sign-in-password').fill('wrong')
    await page.getByTestId('sign-in-submit').click()
    await expect(page.getByTestId('sign-in-error')).toContainText('That email and password don\'t match.')
    await expect(page.getByTestId('sign-in-password')).toHaveValue('')
  })

  test('an address that is not one stays on the card with a field error', async ({ page }) => {
    await serveAuth(page)
    await visit(page)
    await page.getByTestId('sign-in-email').fill('nope')
    await page.getByTestId('sign-in-continue').click()
    await expect(page.getByTestId('sign-in-email-error')).toHaveText('Enter your email address.')
  })

  test('an account with two-step sign-in is asked for its code, and lands signed in with the right one', async ({ page }) => {
    await serveAuth(page, { mfa: true })
    await visit(page)
    await passwordSignIn(page)
    await page.getByTestId('sign-in-code').fill('000000')
    await page.getByTestId('sign-in-submit').click()
    await expect(page.getByTestId('sign-in-error')).toContainText('That code isn\'t right.')
    await page.getByTestId('sign-in-code').fill('482 913')
    await page.getByTestId('sign-in-submit').click()
    await expect(page.locator('#done')).toBeVisible()
  })

  test('forgot password shows Check your email, with a Send again that counts down from a minute', async ({ page }) => {
    await serveAuth(page)
    await visit(page)
    await page.getByTestId('sign-in-email').fill('jack@muon3d.com')
    await page.getByTestId('sign-in-continue').click()
    await page.getByTestId('sign-in-forgot').click()
    await page.getByTestId('sign-in-submit').click()
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
    await expect(page.getByTestId('sign-in-sent')).toContainText('jack@muon3d.com')
    await expect(page.getByTestId('sign-in-send-again')).toBeDisabled()
    await expect(page.getByTestId('sign-in-send-again')).toHaveText(/Send again in 0:5\d|Send again in 1:00/)
    await expect(page.getByTestId('sign-in-back')).toBeVisible()
  })

  test('too many attempts shows a countdown from Retry-After, disables Sign in, and leaves the passkey usable', async ({ page }) => {
    await stubPasskeys(page)
    await serveAuth(page, { limitAfter: 1 })
    await visit(page)
    await passwordSignIn(page, 'jack@muon3d.com', 'wrong')
    await expect(page.getByTestId('sign-in-error')).toContainText('That email and password don\'t match.')
    await page.getByTestId('sign-in-password').fill('again')
    await page.getByTestId('sign-in-submit').click()
    await expect(page.getByTestId('sign-in-error')).toContainText('Too many attempts')
    await expect(page.getByTestId('sign-in-error')).toContainText(/Try again in (4[0-2]) seconds/)
    await expect(page.getByTestId('sign-in-submit')).toBeDisabled()
    await page.getByTestId('sign-in-back').click()
    await expect(page.getByTestId('sign-in-passkey')).toBeEnabled()
  })

  test('with the network off the card says offline, and recovers without a reload', async ({ page, context }) => {
    await serveAuth(page)
    await visit(page)
    await context.setOffline(true)
    await expect(page.getByTestId('sign-in-error')).toContainText('You\'re offline')
    for (const id of ['sign-in-passkey', 'sign-in-continue']) await expect(page.getByTestId(id)).toHaveAttribute('aria-disabled', 'true')
    await context.setOffline(false)
    await expect(page.getByTestId('sign-in-error')).toHaveCount(0)
  })
})

test.describe('add a passkey', () => {
  test('after a password sign-in with no passkey, Add a passkey makes one and lands on the surface it was going to', async ({ page }) => {
    await stubPasskeys(page)
    const auth = await serveAuth(page, { passkeys: 0 })
    await visit(page)
    await passwordSignIn(page)
    await expect(page.getByRole('heading', { name: 'Sign in faster next time' })).toBeVisible()
    await page.getByTestId('sign-in-nudge-add').click()
    await expect(page.getByTestId('sign-in-nudge-done')).toBeVisible()
    await expect(page.locator('#done')).toBeVisible()
    expect(auth.calls).toContain('POST /v1/me/passkeys')
    expect(auth.handoffNext).toBe(CONTINUE)
    expect(JSON.parse((await page.evaluate(() => localStorage.getItem('muon.signin.last')))!)).toEqual({ v: 1, method: 'passkey' })
  })

  test('Not now lands there too, and the nudge does not come back next time', async ({ page }) => {
    await stubPasskeys(page)
    const auth = await serveAuth(page, { passkeys: 0 })
    await visit(page)
    await passwordSignIn(page)
    await page.getByTestId('sign-in-nudge-skip').click()
    await expect(page.locator('#done')).toBeVisible()
    expect(auth.handoffNext).toBe(CONTINUE)
    await visit(page)
    await passwordSignIn(page)
    await expect(page.locator('#done')).toBeVisible()
    await expect(page.getByTestId('sign-in-nudge')).toHaveCount(0)
  })

  test('is not shown to someone who already has a passkey', async ({ page }) => {
    await stubPasskeys(page)
    await serveAuth(page, { passkeys: 2 })
    await visit(page)
    await passwordSignIn(page)
    await expect(page.locator('#done')).toBeVisible()
  })
})
