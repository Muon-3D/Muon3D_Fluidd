/**
 * @vitest-environment-options { "url": "https://abcdefghijklmnopqrst.lan.muon3d.com/" }
 *
 * KAN-2198: Control served by a printer on its own HTTPS name signs in as the
 * `printer-local` client, keeps the access token in memory only, and signs in
 * again (once a minute at most) when the console refuses it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

const CONSOLE = 'https://control.muon3d.com'
/** No upload in progress. */
const idle = async () => false

async function load () {
  vi.resetModules()
  const api = await import('../api')
  const login = await import('../centralLogin')
  return { api, login }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('the console behind the sign-in', () => {
  it('is off on the printer origin when no console is configured', async () => {
    const { login } = await load()
    expect(login.centralLoginEnabled()).toBe(false)
  })
})

describe('the sign-in client', () => {
  it('is printer-local here', async () => {
    const { api } = await load()
    expect(api.clientId()).toBe('printer-local')
    expect(api.clientId({ protocol: 'https:', hostname: 'control.muon3d.com' })).toBe('fluidd')
    expect(api.clientId({ protocol: 'http:', hostname: '192.168.1.50' })).toBe('fluidd')
  })

  it('goes into /authorize with this address as the redirect', async () => {
    vi.stubEnv('VUE_MUON_CLOUD_URL', CONSOLE)
    const { login } = await load()
    expect(login.centralLoginEnabled()).toBe(true)
    const url = new URL(await login.prepareAuthorize({ silent: false }))
    expect(url.origin).toBe(CONSOLE)
    expect(url.searchParams.get('client_id')).toBe('printer-local')
    expect(url.searchParams.get('redirect_uri')).toBe('https://abcdefghijklmnopqrst.lan.muon3d.com/')
  })

  it('is printer-local in the code exchange', async () => {
    vi.stubEnv('VUE_MUON_CLOUD_URL', CONSOLE)
    const bodies: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      bodies.push(String(init.body))
      return new Response(JSON.stringify({ access_token: 'a', token_type: 'Bearer' }), { status: 200 })
    }))
    const { api } = await load()
    await api.cloudApi.exchangeCode('c0de', 'https://abcdefghijklmnopqrst.lan.muon3d.com/', 'verifier')
    expect(new URLSearchParams(bodies[0]).get('client_id')).toBe('printer-local')
    vi.unstubAllGlobals()
  })

  it('says plainly that the account cannot use this printer, and does not ask again', async () => {
    const { login } = await load()
    sessionStorage.setItem('muon.cloud.authorize', JSON.stringify({ state: 's1', verifier: 'v', returnTo: '/', silent: false }))
    const result = login.takeCallback({ search: `?error=access_denied&state=s1&iss=${encodeURIComponent(CONSOLE)}` }, CONSOLE)
    expect(result).toEqual({
      outcome: 'error',
      message: 'This account cannot use this printer. Sign in with the printer\'s owner account, or open Muon Control.',
      returnTo: '/'
    })
  })
})

describe('the token stays in memory', () => {
  it('writes neither token to localStorage or sessionStorage, and still reads them back', async () => {
    const { api } = await load()
    expect(api.cloudSessionAllowed()).toBe(true)
    expect(api.cloudTokensPersist()).toBe(false)
    api.storeToken('access-1')
    api.storeRefreshToken('refresh-1')
    expect(api.storedToken()).toBe('access-1')
    expect(api.storedRefreshToken()).toBe('refresh-1')
    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
    api.storeToken(null)
    expect(api.storedToken()).toBeNull()
  })

  it('removes a token an older build left in localStorage', async () => {
    localStorage.setItem('muon.cloud.token', 'old')
    localStorage.setItem('muon.cloud.refresh', 'old')
    await load()
    expect(localStorage.getItem('muon.cloud.token')).toBeNull()
    expect(localStorage.getItem('muon.cloud.refresh')).toBeNull()
  })

  it('keeps the PKCE record only until the code comes back', async () => {
    vi.stubEnv('VUE_MUON_CLOUD_URL', CONSOLE)
    const { login } = await load()
    await login.prepareAuthorize({ silent: false })
    const pending = JSON.parse(sessionStorage.getItem('muon.cloud.authorize')!)
    login.takeCallback({ search: `?code=c0de&state=${pending.state}&iss=${encodeURIComponent(CONSOLE)}` }, CONSOLE)
    expect(sessionStorage.getItem('muon.cloud.authorize')).toBeNull()
  })
})

describe('a refused token', () => {
  it('starts a fresh top-level sign-in', async () => {
    vi.stubEnv('VUE_MUON_CLOUD_URL', CONSOLE)
    const { login } = await load()
    const go = vi.fn()
    await expect(login.signInAgainOnPrinterOrigin(Date.now(), go, idle)).resolves.toBe(true)
    expect(go).toHaveBeenCalledTimes(1)
    expect(new URL(go.mock.calls[0][0]).searchParams.get('client_id')).toBe('printer-local')
  })

  it('does not leave the page while a file is uploading to the printer', async () => {
    vi.stubEnv('VUE_MUON_CLOUD_URL', CONSOLE)
    const { login } = await load()
    const go = vi.fn()
    await expect(login.signInAgainOnPrinterOrigin(Date.now(), go, async () => true)).resolves.toBe(false)
    expect(go).not.toHaveBeenCalled()
  })

  it('reads the uploads from the store by default', async () => {
    vi.stubEnv('VUE_MUON_CLOUD_URL', CONSOLE)
    // The real store takes a minute to load here; its shape is all that counts.
    const uploads: unknown[] = [{ filepath: 'cube.gcode', size: 10, loaded: 1, percent: 10, speed: 0, cancelled: false }]
    vi.doMock('@/store', () => ({ default: { state: { files: { uploads } } } }))
    const { login } = await load()
    const go = vi.fn()
    await expect(login.signInAgainOnPrinterOrigin(Date.now(), go)).resolves.toBe(false)
    expect(go).not.toHaveBeenCalled()
    uploads.length = 0
    await expect(login.signInAgainOnPrinterOrigin(Date.now(), go)).resolves.toBe(true)
    expect(go).toHaveBeenCalledTimes(1)
    vi.doUnmock('@/store')
  })

  it('does not loop when a sign-in came back within the last minute', async () => {
    vi.stubEnv('VUE_MUON_CLOUD_URL', CONSOLE)
    const { login } = await load()
    await login.prepareAuthorize({ silent: false })
    const pending = JSON.parse(sessionStorage.getItem('muon.cloud.authorize')!)
    login.takeCallback({ search: `?code=c0de&state=${pending.state}&iss=${encodeURIComponent(CONSOLE)}` }, CONSOLE)
    const go = vi.fn()
    await expect(login.signInAgainOnPrinterOrigin(Date.now() + 30_000, go, idle)).resolves.toBe(false)
    expect(go).not.toHaveBeenCalled()
    await expect(login.signInAgainOnPrinterOrigin(Date.now() + 61_000, go, idle)).resolves.toBe(true)
    expect(go).toHaveBeenCalledTimes(1)
  })
})
