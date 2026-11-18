/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudApi, CloudError, ME_TIMEOUT_MS, storeToken } from '../api'

// 17.1 review: /v1/me had no timeout, so an offline hotspot left the page waiting on it. A timeout is "offline" (status 0), not an error.
describe('cloudApi.me() timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const saved = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => saved.set(key, value),
      removeItem: (key: string) => saved.delete(key),
      clear: () => saved.clear()
    })
    vi.stubGlobal('location', { protocol: 'https:', hostname: 'console.example.test', origin: 'https://console.example.test' })
    localStorage.setItem('muon.cloud.url', 'https://console.example.test')
    storeToken('session')
  })
  afterEach(() => {
    storeToken(null)
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const hangs = () => vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
  }))

  it('is about 8 s', () => expect(ME_TIMEOUT_MS).toBe(8000))

  it('a hung request ends after the timeout as the "could not be reached" (status 0) offline error', async () => {
    vi.stubGlobal('fetch', hangs())
    const result = cloudApi.me().catch(e => e)
    let settled = false
    result.then(() => { settled = true }, () => {})
    await vi.advanceTimersByTimeAsync(ME_TIMEOUT_MS - 1)
    expect(settled).toBe(false)
    await vi.advanceTimersByTimeAsync(2)
    const error = await result
    expect(error).toBeInstanceOf(CloudError)
    expect(error.status).toBe(0)
  })

  it('a prompt answer is untouched, and its timer is cleared', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ account: { id: 'a1' } }), { status: 200 })))
    await expect(cloudApi.me()).resolves.toMatchObject({ account: { id: 'a1' } })
    expect(vi.getTimerCount()).toBe(0)
  })

  // Other console calls have the longer default bound (12 s, KAN-4369), so none hangs offline.
  it('puts the longer default timeout on other calls', async () => {
    const fetchMock = vi.fn<[string, RequestInit?], Promise<Response>>(async () => new Response('{"printers":[]}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await cloudApi.printers()
    expect(fetchMock.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })
})
