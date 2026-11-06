/**
 * @vitest-environment-options { "url": "http://muon-m1.local/" }
 *
 * KAN-1800 (H2/B9): on the printer's own plain-HTTP address, anything on the
 * network can read or inject script into the origin, so the long-lived cloud
 * tokens live in this tab's memory only, never in localStorage.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

async function load () {
  vi.resetModules()
  return import('../api')
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('cloud tokens on an insecure origin', () => {
  it('treats http on a LAN name or address as insecure, and https or loopback as secure', async () => {
    const { cloudTokensPersist } = await load()
    expect(cloudTokensPersist({ protocol: 'http:', hostname: 'muon-m1.local' })).toBe(false)
    expect(cloudTokensPersist({ protocol: 'http:', hostname: '10.42.0.1' })).toBe(false)
    expect(cloudTokensPersist({ protocol: 'http:', hostname: '192.168.1.20' })).toBe(false)
    expect(cloudTokensPersist({ protocol: 'https:', hostname: 'control.muon3d.com' })).toBe(true)
    expect(cloudTokensPersist({ protocol: 'http:', hostname: 'localhost' })).toBe(true)
    expect(cloudTokensPersist({ protocol: 'http:', hostname: '127.0.0.1' })).toBe(true)
    expect(cloudTokensPersist({ protocol: 'http:', hostname: '[::1]' })).toBe(true)
    expect(cloudTokensPersist({ protocol: 'http:', hostname: '[fe80::1]' })).toBe(false)
    expect(cloudTokensPersist({ protocol: 'http:', hostname: 'localhost.example.com' })).toBe(false)
    expect(cloudTokensPersist({ protocol: 'https:', hostname: 'muon-m1.local' })).toBe(true)
  })

  it('keeps the access and refresh tokens out of localStorage and sessionStorage', async () => {
    const api = await load()
    api.storeToken('access-1')
    api.storeRefreshToken('refresh-1')
    expect(api.storedToken()).toBe('access-1')
    expect(api.storedRefreshToken()).toBe('refresh-1')
    expect(localStorage.getItem(api.TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(api.REFRESH_KEY)).toBeNull()
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

  it('forgets the session when the page reloads', async () => {
    const first = await load()
    first.storeToken('access-1')
    first.storeRefreshToken('refresh-1')
    const second = await load()
    expect(second.storedToken()).toBeNull()
    expect(second.storedRefreshToken()).toBeNull()
  })

  it('a refresh rotates the in-memory pair and still writes nothing to storage', async () => {
    const api = await load()
    api.storeToken('access-0')
    api.storeRefreshToken('refresh-0')
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ access_token: 'access-2', refresh_token: 'refresh-2' }), text: async () => '' } as Response)))
    expect(await api.refreshSession()).toBe(true)
    expect(api.storedToken()).toBe('access-2')
    expect(api.storedRefreshToken()).toBe('refresh-2')
    expect(localStorage.getItem(api.TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(api.REFRESH_KEY)).toBeNull()
    vi.unstubAllGlobals()
  })

  it('sign-out clears the in-memory pair', async () => {
    const api = await load()
    api.storeToken('access-1')
    api.storeRefreshToken('refresh-1')
    api.storeToken(null)
    api.storeRefreshToken(null)
    expect(api.storedToken()).toBeNull()
    expect(api.storedRefreshToken()).toBeNull()
  })
})

describe('every cloud token writer on an insecure origin', () => {
  function noCloudTokenStored () {
    for (const store of [localStorage, sessionStorage]) {
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i)!
        expect(key === 'muon.cloud.token' || key === 'muon.cloud.refresh', `${key} in storage`).toBe(false)
        expect(store.getItem(key)).not.toMatch(/^(access|refresh)-/)
      }
    }
  }

  it('sign-in, rekey, refresh, central-login checks and sign-out leave no muon.cloud token in storage', async () => {
    vi.resetModules()
    vi.stubGlobal('navigator', {})
    const account = { id: 'a1', email: 'a@example.test', name: 'A' }
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const path = new URL(String(url), 'http://muon-m1.local').pathname
      const body = path === '/v1/auth/sign-in'
        ? { token: 'access-signin', account }
        : path === '/token'
          ? { access_token: 'access-rotated', refresh_token: 'refresh-rotated' }
          : path === '/v1/me' ? { account } : { printers: [], members: [] }
      return { ok: true, status: 200, redirected: false, url: String(url), body: null, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response
    }))
    const api = await import('../api')
    const state = await import('../state')
    const central = await import('../centralLogin')
    const client = await import('../../account/client')

    // Password sign-in (the in-page path on the printer's address).
    expect(await state.signIn('a@example.test', 'pw')).toBeNull()
    expect(api.storedToken()).toBe('access-signin')
    noCloudTokenStored()

    // A credential change hands this tab a new pair.
    client.adoptRekeyedSession({ session: { access_token: 'access-rekey', refresh_token: 'refresh-rekey' } })
    expect(api.storedRefreshToken()).toBe('refresh-rekey')
    noCloudTokenStored()

    // Refresh rotation.
    expect(await api.refreshSession()).toBe(true)
    expect(api.storedToken()).toBe('access-rotated')
    noCloudTokenStored()

    // The central login's code exchange and silent check are off on this
    // origin; running them must not write either.
    expect(central.centralLoginEnabled()).toBe(false)
    await central.checkCentralSession()
    await state.initCloud()
    noCloudTokenStored()

    // Sign-out.
    await state.signOut()
    expect(api.storedToken()).toBeNull()
    expect(api.storedRefreshToken()).toBeNull()
    noCloudTokenStored()
    vi.unstubAllGlobals()
  })
})
