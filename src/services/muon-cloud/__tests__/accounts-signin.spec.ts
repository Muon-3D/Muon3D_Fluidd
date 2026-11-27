/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-7197: Control signs in through accounts.muon3d.com (authorization code + PKCE S256), behind a
 * build-time flag and only on exactly https://control.muon3d.com.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountsOrigin, accountsSignInEnabled } from '../accounts'
import { captureCallbackEarly, centralLoginEnabled, prepareAuthorize, shouldRedirectToAccounts, signOutCentral, startCentralSignIn, takeCallback, takeCallbackOnce } from '../centralLogin'
import { cloudApi, authServerUrl, storeRefreshToken, storeToken } from '../api'

const CONTROL = 'https://control.muon3d.com'
const ACCOUNTS = 'https://accounts.muon3d.com'
const PENDING = 'muon.cloud.authorize'

function at (origin: string, search = '', pathname = '/') {
  const u = new URL(origin)
  return { origin: u.origin, protocol: u.protocol, hostname: u.hostname, search, pathname }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.stubEnv('VITE_CONTROL_ACCOUNTS_SIGNIN', 'true')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})

describe('the flag and the origin gate', () => {
  it('is off unless the flag is exactly "true"', () => {
    for (const value of [undefined, '', '1', 'TRUE', 'True', 'yes', ' true']) {
      vi.stubEnv('VITE_CONTROL_ACCOUNTS_SIGNIN', value as string)
      expect(accountsSignInEnabled(at(CONTROL))).toBe(false)
    }
    vi.stubEnv('VITE_CONTROL_ACCOUNTS_SIGNIN', 'true')
    expect(accountsSignInEnabled(at(CONTROL))).toBe(true)
  })

  it('is ignored on every origin but exactly https://control.muon3d.com, printers included', () => {
    for (const origin of [
      'https://app.muon3d.com',
      'http://control.muon3d.com',
      'https://control.muon3d.com.evil.example',
      'https://evil-control.muon3d.com',
      'https://accounts.muon3d.com',
      'http://muon3d.local',
      'http://192.168.1.37',
      'http://10.42.0.1',
      'http://localhost:8080',
      'https://abcdefghijklmnopqrst.muonlan.net',
      'https://192-168-1-37.abcdefghijklmnopqrst.muonlan.net'
    ]) {
      expect(accountsSignInEnabled(at(origin)), origin).toBe(false)
    }
  })

  it('runs today\'s path unchanged where the flag is ignored', async () => {
    vi.stubEnv('VITE_CONTROL_ACCOUNTS_SIGNIN', 'true')
    // The page is a printer's address: /authorize and /token stay on the console, never accounts.
    vi.stubGlobal('location', { ...window.location, origin: 'https://abcdefghijklmnopqrst.muonlan.net', protocol: 'https:', hostname: 'abcdefghijklmnopqrst.muonlan.net', pathname: '/', search: '', href: 'https://abcdefghijklmnopqrst.muonlan.net/' })
    expect(authServerUrl()).toBe('https://abcdefghijklmnopqrst.muonlan.net')
    expect(authServerUrl()).not.toContain('accounts')
    expect(shouldRedirectToAccounts(at('https://abcdefghijklmnopqrst.muonlan.net'))).toBe(false)
    expect(centralLoginEnabled(at('http://192.168.1.37'))).toBe(false)
  })

  it('has one other origin, an e2e build\'s, which a production build never names', () => {
    expect(accountsSignInEnabled(at('http://localhost:8092'))).toBe(false)
    vi.stubEnv('VITE_CONTROL_ACCOUNTS_E2E_ORIGIN', 'http://localhost:8092')
    expect(accountsSignInEnabled(at('http://localhost:8092'))).toBe(true)
    expect(accountsSignInEnabled(at('http://localhost:8093'))).toBe(false)
    expect(accountsOrigin(at('http://localhost:8092'))).toBe(ACCOUNTS)
    vi.stubEnv('VITE_CONTROL_ACCOUNTS_URL', 'http://localhost:8092/accounts/')
    expect(accountsOrigin(at('http://localhost:8092'))).toBe('http://localhost:8092/accounts')
    // The fake issuer is never used on a real origin.
    expect(accountsOrigin(at(CONTROL))).toBe(ACCOUNTS)
  })
})

describe('/authorize through accounts', () => {
  it('asks accounts for a code with PKCE S256, as client fluidd, returning to the page root, with no openid and no nonce', async () => {
    const url = new URL(await prepareAuthorize({ silent: false, returnTo: '/library' }))
    expect(url.origin + url.pathname).toBe(`${ACCOUNTS}/authorize`)
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      response_type: 'code',
      client_id: 'fluidd',
      redirect_uri: `${CONTROL}/`,
      code_challenge_method: 'S256'
    })
    expect(url.searchParams.has('scope')).toBe(false)
    expect(url.searchParams.has('nonce')).toBe(false)
    expect(url.searchParams.has('prompt')).toBe(false)
    expect(url.toString()).not.toContain('openid')
  })

  it('uses prompt=none only for the bounce-back', async () => {
    const url = new URL(await prepareAuthorize({ silent: true }))
    expect(url.searchParams.get('prompt')).toBe('none')
  })

  it('keeps the verifier and state in sessionStorage only', async () => {
    await prepareAuthorize({ silent: false })
    expect(sessionStorage.getItem(PENDING)).toContain('verifier')
    expect(JSON.stringify({ ...localStorage })).not.toContain('verifier')
  })

  it('is the console\'s own /authorize when the flag is off', async () => {
    vi.stubEnv('VITE_CONTROL_ACCOUNTS_SIGNIN', '')
    const url = new URL(await prepareAuthorize({ silent: false }))
    expect(url.origin).toBe(CONTROL)
  })
})

describe('the return from accounts', () => {
  async function trip (silent = false) {
    const url = new URL(await prepareAuthorize({ silent, returnTo: '/library?sort=recent' }))
    return url.searchParams.get('state')!
  }
  const back = (query: string) => {
    window.history.replaceState(null, '', `/?${query}`)
    return window.location.search
  }

  it('takes a code whose state is ours and whose iss is accounts, and scrubs code, state and iss from the address', async () => {
    const state = await trip()
    const search = back(`code=abc&state=${state}&iss=${encodeURIComponent(ACCOUNTS)}`)
    const result = takeCallback({ search })
    expect(result).toMatchObject({ outcome: 'code', code: 'abc', returnTo: '/library?sort=recent' })
    expect(window.location.search).toBe('?sort=recent')
    expect(window.location.href).not.toMatch(/code=|state=|iss=/)
    expect(sessionStorage.getItem(PENDING)).toBeNull()
  })

  it('refuses the console as issuer: only accounts is the issuer', async () => {
    const state = await trip()
    const search = back(`code=abc&state=${state}&iss=${encodeURIComponent(CONTROL)}`)
    expect(takeCallback({ search })).toMatchObject({ outcome: 'error' })
    expect(window.location.search).toBe('?sort=recent')
    expect(sessionStorage.getItem(PENDING)).toBeNull()
  })

  it('refuses a missing iss and a wrong state, and still scrubs and clears the verifier', async () => {
    await trip()
    expect(takeCallback({ search: back('code=abc&state=wrong&iss=' + encodeURIComponent(ACCOUNTS)) })).toMatchObject({ outcome: 'error' })
    expect(window.location.search).not.toContain('code')
    expect(sessionStorage.getItem(PENDING)).toBeNull()
    const state = await trip()
    expect(takeCallback({ search: back(`code=abc&state=${state}`) })).toMatchObject({ outcome: 'error' })
    expect(sessionStorage.getItem(PENDING)).toBeNull()
  })

  it('scrubs a return that has an iss but no state, and exchanges nothing', async () => {
    await trip()
    expect(takeCallback({ search: back(`code=abc&iss=${encodeURIComponent(ACCOUNTS)}`) })).toMatchObject({ outcome: 'error' })
    expect(window.location.search).not.toMatch(/code|iss/)
    expect(sessionStorage.getItem(PENDING)).toBeNull()
  })

  it('is scrubbed at start-up, before anything else, and still delivered once to the app', async () => {
    const state = await trip()
    back(`code=abc&state=${state}&iss=${encodeURIComponent(ACCOUNTS)}`)
    captureCallbackEarly()
    expect(window.location.search).toBe('?sort=recent')
    expect(sessionStorage.getItem(PENDING)).toBeNull()
    expect(takeCallbackOnce()).toMatchObject({ outcome: 'code', code: 'abc' })
    expect(takeCallbackOnce().outcome).toBe('none')
  })

  it('refuses a replay: the second return finds nothing pending', async () => {
    const state = await trip()
    const search = back(`code=abc&state=${state}&iss=${encodeURIComponent(ACCOUNTS)}`)
    expect(takeCallback({ search }).outcome).toBe('code')
    expect(takeCallback({ search }).outcome).toBe('error')
  })

  it('login_required after the bounce-back is "signed_out", for the normal accounts sign-in to follow', async () => {
    const state = await trip(true)
    const search = back(`error=login_required&state=${state}&iss=${encodeURIComponent(ACCOUNTS)}`)
    expect(takeCallback({ search })).toMatchObject({ outcome: 'signed_out' })
  })

  it('exchanges the code at accounts /token, and refreshes there', async () => {
    const calls: Array<{ url: string, body: string }> = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: String(init.body) })
      return new Response(JSON.stringify({ access_token: 'a', refresh_token: 'r', token_type: 'Bearer', expires_in: 900 }), { status: 200, headers: { 'content-type': 'application/json' } })
    }))
    await cloudApi.exchangeCode('abc', `${CONTROL}/`, 'verifier')
    expect(calls[0].url).toBe(`${ACCOUNTS}/token`)
    expect(calls[0].body).toContain('code_verifier=verifier')
    expect(calls[0].body).toContain('client_id=fluidd')
  })
})

describe('when this load goes to accounts', () => {
  it('goes with no token of any kind, once, and not from the pages that sign in or out themselves', async () => {
    expect(shouldRedirectToAccounts(at(CONTROL))).toBe(true)
    expect(shouldRedirectToAccounts(at(CONTROL, '', '/sign-in'))).toBe(false)
    expect(shouldRedirectToAccounts(at(CONTROL, '', '/signed-out'))).toBe(false)
    expect(shouldRedirectToAccounts(at(CONTROL, '?code=x&state=y&iss=z'))).toBe(false)
    const go = vi.fn()
    await startCentralSignIn({ silent: true }, go)
    expect(shouldRedirectToAccounts(at(CONTROL))).toBe(false) // a trip is pending
    sessionStorage.clear()
    storeToken('t')
    expect(shouldRedirectToAccounts(at(CONTROL))).toBe(false)
    storeToken(null)
    storeRefreshToken('r') // a refresh token keeps the session alive on its own
    expect(shouldRedirectToAccounts(at(CONTROL))).toBe(false)
    storeRefreshToken(null)
    sessionStorage.setItem('muon.cloud.silent', '1') // this tab already asked
    expect(shouldRedirectToAccounts(at(CONTROL))).toBe(false)
  })

  it('never, with the flag off', () => {
    vi.stubEnv('VITE_CONTROL_ACCOUNTS_SIGNIN', '')
    expect(shouldRedirectToAccounts(at(CONTROL))).toBe(false)
  })
})

describe('signing out', () => {
  it('posts to accounts /logout with client_id, a registered post_logout_redirect_uri and a state', () => {
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
    signOutCentral(document)
    const form = document.body.querySelector('form')!
    expect(form.action).toBe(`${ACCOUNTS}/logout`)
    const fields = Object.fromEntries(Array.from(form.querySelectorAll('input')).map(i => [i.name, i.value]))
    expect(fields.client_id).toBe('fluidd')
    expect(fields.post_logout_redirect_uri).toBe(`${CONTROL}/`)
    expect(fields.state).toMatch(/\S{8,}/)
    form.remove()
  })
})
