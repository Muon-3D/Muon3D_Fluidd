/**
 * @vitest-environment-options { "url": "http://muon-m1.local/" }
 *
 * KAN-2192 (the whole of H2/B9, after KAN-1800): on the printer's own
 * plain-HTTP address anything on the network can read or inject script into
 * the origin. So the page holds no Muon3D account secret at all: no token in
 * storage or in memory, no password or code sent, and no bearer on any
 * request. Account features are a link to the console instead.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

async function load () {
  vi.resetModules()
  return import('../api')
}

type Call = { url: string, init: RequestInit | undefined }

/** A console that answers everything, and a record of what reached it. */
function stubConsole (): Call[] {
  const calls: Call[] = []
  const account = { id: 'a1', email: 'a@example.test', name: 'A' }
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), init })
    const path = new URL(String(url), 'http://muon-m1.local').pathname
    const body = path === '/v1/auth/sign-in' || path === '/v1/auth/sign-up' || path === '/v1/auth/mfa'
      ? { token: 'access-signin', account }
      : path === '/token'
        ? { access_token: 'access-rotated', refresh_token: 'refresh-rotated' }
        : path === '/v1/me' ? { account } : { printers: [], members: [], relay_url: 'https://relay.example.test' }
    return { ok: true, status: 200, redirected: false, url: String(url), body: null, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response
  }))
  return calls
}

function noCloudSecretStored () {
  for (const store of [localStorage, sessionStorage]) {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i)!
      expect(['muon.cloud.token', 'muon.cloud.refresh', 'muon.cloud.key'].includes(key), `${key} in storage`).toBe(false)
      expect(store.getItem(key)).not.toMatch(/^(access|refresh)-/)
    }
  }
}

function bearerOf (call: Call): string | undefined {
  const headers = (call.init?.headers ?? {}) as Record<string, string>
  return headers.authorization ?? headers.Authorization
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('which pages may hold a Muon3D session', () => {
  it('refuses http on a LAN name or address, and allows https and loopback', async () => {
    const { cloudSessionAllowed, cloudTokensPersist } = await load()
    for (const allowed of [cloudSessionAllowed, cloudTokensPersist]) {
      expect(allowed({ protocol: 'http:', hostname: 'muon-m1.local' })).toBe(false)
      expect(allowed({ protocol: 'http:', hostname: 'muon3d.local' })).toBe(false)
      expect(allowed({ protocol: 'http:', hostname: '10.42.0.1' })).toBe(false)
      expect(allowed({ protocol: 'http:', hostname: '192.168.1.20' })).toBe(false)
      expect(allowed({ protocol: 'http:', hostname: '[fe80::1]' })).toBe(false)
      expect(allowed({ protocol: 'http:', hostname: 'localhost.example.com' })).toBe(false)
      expect(allowed({ protocol: 'https:', hostname: 'control.muon3d.com' })).toBe(true)
      expect(allowed({ protocol: 'https:', hostname: 'muon-m1.local' })).toBe(true)
      expect(allowed({ protocol: 'http:', hostname: 'localhost' })).toBe(true)
      expect(allowed({ protocol: 'http:', hostname: '127.0.0.1' })).toBe(true)
      expect(allowed({ protocol: 'http:', hostname: '[::1]' })).toBe(true)
    }
  })

  it('links to the same route on the console', async () => {
    const { controlUrl } = await load()
    expect(controlUrl('/account')).toMatch(/^https:\/\/[a-z.]*muon3d\.com\/#\/account$/)
    expect(controlUrl('library')).toMatch(/\/#\/library$/)
    expect(controlUrl()).toMatch(/\/#\/$/)
  })
})

describe('a plain-HTTP printer page holds no token', () => {
  it('drops a token it is handed: nothing in storage and nothing in memory', async () => {
    const api = await load()
    api.storeToken('access-1')
    api.storeRefreshToken('refresh-1')
    expect(api.storedToken()).toBeNull()
    expect(api.storedRefreshToken()).toBeNull()
    noCloudSecretStored()
    expect(sessionStorage.length).toBe(0)
  })

  it('clears tokens an older build left in localStorage, on first load', async () => {
    localStorage.setItem('muon.cloud.token', 'old-access')
    localStorage.setItem('muon.cloud.refresh', 'old-refresh')
    localStorage.setItem('muon.cloud.url', 'https://control.muon3d.com')
    const api = await load()
    expect(localStorage.getItem('muon.cloud.token')).toBeNull()
    expect(localStorage.getItem('muon.cloud.refresh')).toBeNull()
    expect(api.storedToken()).toBeNull()
    expect(api.storedRefreshToken()).toBeNull()
    // Only cloud tokens go: other settings stay.
    expect(localStorage.getItem('muon.cloud.url')).toBe('https://control.muon3d.com')
  })
})

describe('a plain-HTTP printer page sends no credential', () => {
  it('refuses password sign-in, sign-up and the code step before any request leaves', async () => {
    const calls = stubConsole()
    await load()
    const state = await import('../state')
    await expect(state.signIn('a@example.test', 'pw')).rejects.toMatchObject({ code: 'insecure_origin' })
    await expect(state.signUp('a@example.test', 'pw', 'A', 30)).rejects.toMatchObject({ code: 'insecure_origin' })
    await expect(state.signInWithCode('mfa-token', '123456')).rejects.toMatchObject({ code: 'insecure_origin' })
    expect(calls).toHaveLength(0)
    expect(state.cloudState.account).toBeNull()
    noCloudSecretStored()
  })

  it('refuses the hand-off sign-in, the code exchange and a refresh', async () => {
    const calls = stubConsole()
    const api = await load()
    await expect(api.cloudApi.signInFor('a@example.test', 'pw')).rejects.toMatchObject({ code: 'insecure_origin' })
    await expect(api.cloudApi.signUpFor('a@example.test', 'pw', 'A', 30)).rejects.toMatchObject({ code: 'insecure_origin' })
    await expect(api.cloudApi.handoff('access-1')).rejects.toMatchObject({ code: 'insecure_origin' })
    await expect(api.cloudApi.exchangeCode('code', 'http://muon-m1.local/', 'verifier')).rejects.toMatchObject({ code: 'insecure_origin' })
    expect(await api.refreshSession()).toBe(false)
    expect(calls).toHaveLength(0)
    noCloudSecretStored()
  })

  it('never puts a bearer on a request, and still makes the calls that need no account', async () => {
    const calls = stubConsole()
    const api = await load()
    // A token cannot be smuggled in through storage either.
    localStorage.setItem('muon.cloud.token', 'access-planted')
    expect(api.storedToken()).toBeNull()
    await api.cloudApi.config()
    await api.cloudApi.nearby()
    expect(calls).toHaveLength(2)
    for (const call of calls) expect(bearerOf(call)).toBeUndefined()
  })

  it('makes no account-client call: no password, token or reset request leaves the page', async () => {
    const calls = stubConsole()
    await load()
    const client = await import('../../account/client')
    const signIn = await import('../../account/sign-in')
    await expect(signIn.passwordSignIn('a@example.test', 'pw')).rejects.toThrow(/not encrypted/)
    await expect(signIn.forgotPassword('a@example.test')).rejects.toThrow(/not encrypted/)
    client.adoptRekeyedSession({ session: { access_token: 'access-rekey', refresh_token: 'refresh-rekey' } })
    expect(calls).toHaveLength(0)
    noCloudSecretStored()
  })

  it('start-up, the central-login checks and sign-out leave nothing behind', async () => {
    const calls = stubConsole()
    const api = await load()
    const state = await import('../state')
    const central = await import('../centralLogin')
    expect(central.centralLoginEnabled()).toBe(false)
    await central.checkCentralSession()
    await state.initCloud()
    expect(state.cloudState.ready).toBe(true)
    expect(state.cloudState.account).toBeNull()
    await state.signOut()
    expect(api.storedToken()).toBeNull()
    for (const call of calls) expect(bearerOf(call)).toBeUndefined()
    noCloudSecretStored()
  })
})

describe('a plain-HTTP printer page makes only the calls that need no account', () => {
  it('refuses every other console route, with or without a token, before any request leaves', async () => {
    const calls = stubConsole()
    const api = await load()
    // The link, invite and assertion routes carry a code or act for the account.
    await expect(api.cloudApi.join('INVITE-CODE')).rejects.toMatchObject({ code: 'insecure_origin' })
    await expect(api.cloudApi.claim('12345678')).rejects.toMatchObject({ code: 'insecure_origin' })
    await expect(api.cloudApi.assertion('https://models.muon3d.com')).rejects.toMatchObject({ code: 'insecure_origin' })
    await expect(api.cloudApi.me()).rejects.toMatchObject({ code: 'insecure_origin' })
    await expect(api.cloudApi.printers()).rejects.toMatchObject({ code: 'insecure_origin' })
    await expect(api.cloudApi.signOut()).rejects.toMatchObject({ code: 'insecure_origin' })
    expect(calls).toHaveLength(0)
  })

  it('still asks the console to start a link on this network, with no bearer', async () => {
    const calls = stubConsole()
    const api = await load()
    await api.cloudApi.startLink('printer-1')
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toMatch(/\/v1\/links\/start$/)
    expect(bearerOf(calls[0])).toBeUndefined()
  })

  it('sign-out sends nothing', async () => {
    const calls = stubConsole()
    await load()
    const state = await import('../state')
    await state.signOut()
    expect(calls).toHaveLength(0)
  })

  it('ignores a console address saved in this origin\'s storage', async () => {
    // Anything on the network can write this page's storage.
    localStorage.setItem('muon.cloud.url', 'https://hostile.example')
    const calls = stubConsole()
    const api = await load()
    expect(api.cloudBaseUrl()).not.toContain('hostile.example')
    await api.cloudApi.nearby()
    expect(calls[0].url).not.toContain('hostile.example')
    expect(api.controlUrl('/account')).not.toContain('hostile.example')
  })
})
