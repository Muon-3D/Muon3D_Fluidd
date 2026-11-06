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
