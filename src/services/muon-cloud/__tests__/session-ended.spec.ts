/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
// KAN-1389: a call the console refuses signs the user out whoever made it, and a tab that comes back checks the session.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudApi, setSessionRecovery, storedRefreshToken, storedToken, storeRefreshToken, storeToken } from '../api'
import { FOCUS_CHECK_MS, checkOnFocus, resetFocusCheck } from '../focus-check'
import { cloudState } from '../state'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

function json (status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body, text: async () => JSON.stringify(body) } as Response
}
const withLocks = () => vi.stubGlobal('navigator', { locks: { request: (_n: string, work: () => Promise<unknown>) => work() } })
const account = (id: string) => ({ id, email: `${id}@example.test`, name: id, created_at: 1 })
const signedIn = (id = 'a') => {
  storeToken(`access-${id}`)
  storeRefreshToken(`refresh-${id}`)
  cloudState.account = account(id)
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  resetFocusCheck()
  withLocks()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
  setSessionRecovery(null)
  cloudState.account = null
})

describe('any refused console call signs the user out', () => {
  const refusing = () => vi.fn(async (url: string) => (
    new URL(url).pathname === '/token' ? json(400, { error: 'invalid_grant' }) : json(401, { error: 'sign in first' })
  ))

  it('a refused notices call (not the printer poll) drops the session', async () => {
    signedIn()
    vi.stubGlobal('fetch', refusing())
    await cloudApi.notices().catch(() => {})
    expect(cloudState.account).toBeNull()
    expect(storedToken()).toBeNull()
    expect(storedRefreshToken()).toBeNull()
  })

  it('a refused account call drops the session too', async () => {
    signedIn()
    vi.stubGlobal('fetch', refusing())
    const { accountApi } = await import('@/services/account/api')
    await accountApi.sessions().catch(() => {})
    expect(cloudState.account).toBeNull()
    expect(storedToken()).toBeNull()
  })

  it('a 429 from the refresh does not sign out', async () => {
    signedIn()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (
      new URL(url).pathname === '/token' ? json(429, { error: 'slow down' }) : json(401, { error: 'sign in first' })
    )))
    await cloudApi.notices().catch(() => {})
    expect(cloudState.account).not.toBeNull()
    expect(storedToken()).toBe('access-a')
    expect(storedRefreshToken()).toBe('refresh-a')
  })

  it('a 503 from the refresh does not sign out', async () => {
    signedIn()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (
      new URL(url).pathname === '/token' ? json(503, { error: 'down' }) : json(401, { error: 'sign in first' })
    )))
    await cloudApi.notices().catch(() => {})
    expect(cloudState.account).not.toBeNull()
    expect(storedToken()).toBe('access-a')
  })

  it('being offline does not sign out', async () => {
    signedIn()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    await cloudApi.notices().catch(() => {})
    expect(cloudState.account).not.toBeNull()
    expect(storedToken()).toBe('access-a')
  })
})

describe('a refusal that belongs to a previous account does not sign out the current one (KAN-2249)', () => {
  /** A's call is 401; A's refresh is held; B signs in meanwhile; then the refusal lands. */
  async function lateRefusal (call: () => Promise<unknown>) {
    signedIn('a')
    let release!: () => void
    const held = new Promise<void>(resolve => { release = resolve })
    const refreshAsked = vi.fn()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (new URL(url).pathname === '/token') {
        refreshAsked()
        await held
        return json(400, { error: 'invalid_grant' })
      }
      return json(401, { error: 'sign in first' })
    }))
    const pending = call().catch(() => {})
    await vi.waitFor(() => expect(refreshAsked).toHaveBeenCalled())
    signedIn('b')
    release()
    await pending
  }

  it('a call with no account guard: B stays signed in', async () => {
    await lateRefusal(() => cloudApi.notices())
    expect(cloudState.account?.id).toBe('b')
    expect(storedToken()).toBe('access-b')
    expect(storedRefreshToken()).toBe('refresh-b')
  })

  it('a call guarded by stillMine: B stays signed in', async () => {
    let mine = true
    await lateRefusal(() => cloudApi.putLayout({}, () => mine && (mine = cloudState.account?.id === 'a')))
    expect(cloudState.account?.id).toBe('b')
    expect(storedToken()).toBe('access-b')
  })
})

describe('the session is checked when the tab gets focus', () => {
  const refusing = () => vi.fn(async (url: string) => (
    new URL(url).pathname === '/token' ? json(400, { error: 'invalid_grant' }) : json(401, { error: 'sign in first' })
  ))

  it('focus on a signed-in tab asks /v1/me, with no polling started, and a refusal signs out', async () => {
    signedIn()
    const fetcher = refusing()
    vi.stubGlobal('fetch', fetcher)
    window.dispatchEvent(new Event('focus'))
    await vi.waitFor(() => expect(cloudState.account).toBeNull())
    expect(fetcher.mock.calls.some(([url]) => new URL(url as string).pathname === '/v1/me')).toBe(true)
  })

  it('becoming visible asks too', async () => {
    signedIn()
    const fetcher = refusing()
    vi.stubGlobal('fetch', fetcher)
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.waitFor(() => expect(cloudState.account).toBeNull())
  })

  it('a signed-out tab asks nothing', () => {
    const check = vi.fn(async () => {})
    expect(checkOnFocus(() => false, check)).toBe(false)
    expect(check).not.toHaveBeenCalled()
  })

  it('is throttled to once every 30 seconds', () => {
    const check = vi.fn(async () => {})
    const t = 1_000_000
    expect(checkOnFocus(() => true, check, t)).toBe(true)
    expect(checkOnFocus(() => true, check, t + 1000)).toBe(false)
    expect(checkOnFocus(() => true, check, t + FOCUS_CHECK_MS - 1)).toBe(false)
    expect(check).toHaveBeenCalledTimes(1)
    expect(checkOnFocus(() => true, check, t + FOCUS_CHECK_MS)).toBe(true)
    expect(check).toHaveBeenCalledTimes(2)
  })

  it('an unreachable console on focus leaves the session alone', async () => {
    signedIn()
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline') }))
    window.dispatchEvent(new Event('focus'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(cloudState.account).not.toBeNull()
  })
})
