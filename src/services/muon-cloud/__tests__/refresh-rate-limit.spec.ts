/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REFRESH_BACKOFF_BASE_MS, REFRESH_RETRY_AFTER_CAP_MS, refreshSession, resetRefreshBackoff, setSessionRecovery, storedRefreshToken, storedToken, storeRefreshToken, storeToken } from '../api'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))

const withLocks = () => vi.stubGlobal('navigator', { locks: { request: (_n: string, work: () => Promise<unknown>) => work() } })

function answer (status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null }
  } as unknown as Response
}

const NEW_PAIR = { access_token: 'access-1', refresh_token: 'refresh-1', token_type: 'Bearer', expires_in: 900 }

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-04T12:00:00Z'))
  localStorage.clear()
  storeToken('access-0')
  storeRefreshToken('refresh-0')
  resetRefreshBackoff()
  withLocks()
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
  setSessionRecovery(null)
  resetRefreshBackoff()
})

describe('a refresh the console rate-limits or fails (KAN-1472)', () => {
  it('keeps the session on a 429 and does not try the silent recovery', async () => {
    const recover = vi.fn(async () => false)
    setSessionRecovery(recover)
    vi.stubGlobal('fetch', vi.fn(async () => answer(429, { error: 'slow_down' })))
    expect(await refreshSession()).toBe(false)
    expect(storedToken()).toBe('access-0')
    expect(storedRefreshToken()).toBe('refresh-0')
    expect(recover).not.toHaveBeenCalled()
  })

  it('keeps the session on a 503', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer(503, { error: 'temporarily_unavailable' })))
    expect(await refreshSession()).toBe(false)
    expect(storedToken()).toBe('access-0')
    expect(storedRefreshToken()).toBe('refresh-0')
  })

  it('waits out Retry-After, then refreshes', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(answer(429, { error: 'slow_down' }, { 'retry-after': '30' }))
      .mockResolvedValueOnce(answer(200, NEW_PAIR))
    vi.stubGlobal('fetch', fetch)
    expect(await refreshSession()).toBe(false)
    // Inside the wait: no request goes out.
    await vi.advanceTimersByTimeAsync(29_000)
    expect(await refreshSession()).toBe(false)
    expect(fetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1_500)
    expect(await refreshSession()).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(storedToken()).toBe('access-1')
    expect(storedRefreshToken()).toBe('refresh-1')
  })

  it('waits at least the base step on Retry-After: 0', async () => {
    const fetch = vi.fn(async () => answer(429, {}, { 'retry-after': '0' }))
    vi.stubGlobal('fetch', fetch)
    await refreshSession()
    await refreshSession()
    expect(fetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(REFRESH_BACKOFF_BASE_MS + 100)
    await refreshSession()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('a new session does not inherit the old one\'s wait', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(answer(429, {}, { 'retry-after': '600' }))
      .mockResolvedValueOnce(answer(200, NEW_PAIR))
    vi.stubGlobal('fetch', fetch)
    expect(await refreshSession()).toBe(false)
    // Sign out and in again: a different refresh token.
    storeRefreshToken(null)
    storeToken('access-9')
    storeRefreshToken('refresh-9')
    expect(await refreshSession()).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('caps an absurd Retry-After', async () => {
    const fetch = vi.fn(async () => answer(429, {}, { 'retry-after': '86400' }))
    vi.stubGlobal('fetch', fetch)
    await refreshSession()
    await vi.advanceTimersByTimeAsync(REFRESH_RETRY_AFTER_CAP_MS + 1000)
    await refreshSession()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('without Retry-After backs off exponentially', async () => {
    const fetch = vi.fn(async () => answer(429, {}))
    vi.stubGlobal('fetch', fetch)
    await refreshSession()
    await vi.advanceTimersByTimeAsync(REFRESH_BACKOFF_BASE_MS + 100)
    await refreshSession()
    expect(fetch).toHaveBeenCalledTimes(2)
    // The second wait is twice the first.
    await vi.advanceTimersByTimeAsync(REFRESH_BACKOFF_BASE_MS + 100)
    await refreshSession()
    expect(fetch).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(REFRESH_BACKOFF_BASE_MS)
    await refreshSession()
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('still signs out on a real refusal (invalid_grant)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer(400, { error: 'invalid_grant' })))
    expect(await refreshSession()).toBe(false)
    expect(storedToken()).toBeNull()
    expect(storedRefreshToken()).toBeNull()
  })

  it('still signs out on a 401 from /token', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => answer(401, { error: 'invalid_client' })))
    expect(await refreshSession()).toBe(false)
    expect(storedToken()).toBeNull()
  })
})
