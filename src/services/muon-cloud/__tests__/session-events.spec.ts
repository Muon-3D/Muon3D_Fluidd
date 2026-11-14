/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
// KAN-2509: the browser's one live sign-out stream. Tabs are copies of the module sharing one localStorage, one
// origin-wide lock and one console (the fetch stub); a connection is a stream the test writes frames into.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Events = typeof import('../session-events')
type Api = typeof import('../api')

interface Stream {
  authorization: string | undefined;
  push: (text: string) => void;
  close: () => void;
  aborted: boolean;
}

/** The console: `/v1/me/session-events` streams the test controls, `/token` refreshes. */
function fakeConsole () {
  const streams: Stream[] = []
  const refreshes: string[] = []
  const behaviour = {
    streamStatus: 200,
    contentType: 'text/event-stream; charset=utf-8',
    /** Statuses for the next connections, before `streamStatus` applies. */
    queue: [] as number[],
    streamBody: {} as Record<string, unknown>,
    /** The status and body of the next `/token`. */
    token: { status: 200, body: { access_token: 'access-2', refresh_token: 'refresh-2', token_type: 'Bearer', expires_in: 900 } as Record<string, unknown> }
  }
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname
    if (path === '/token') {
      refreshes.push(new URLSearchParams(String(init?.body ?? '')).get('refresh_token') ?? '')
      const { status, body } = behaviour.token
      return { ok: status < 300, status, headers: new Headers(), json: async () => body } as Response
    }
    if (path !== '/v1/me/session-events') throw new Error(`unexpected ${path}`)
    const headers = init?.headers as Record<string, string>
    const status = behaviour.queue.shift() ?? behaviour.streamStatus
    if (status !== 200) {
      return { ok: false, status, headers: new Headers(), body: null, json: async () => behaviour.streamBody, text: async () => JSON.stringify(behaviour.streamBody) } as Response
    }
    let controller!: ReadableStreamDefaultController<Uint8Array>
    const body = new ReadableStream<Uint8Array>({ start (c) { controller = c } })
    const encoder = new TextEncoder()
    const stream: Stream = {
      authorization: headers.authorization,
      aborted: false,
      push: text => controller.enqueue(encoder.encode(text)),
      close: () => { try { controller.close() } catch { /* already closed */ } }
    }
    init?.signal?.addEventListener('abort', () => {
      stream.aborted = true
      try { controller.error(new DOMException('aborted', 'AbortError')) } catch { /* already closed */ }
    })
    streams.push(stream)
    return { ok: true, status: 200, headers: new Headers({ 'content-type': behaviour.contentType }), body } as Response
  })
  return { fetch, streams, refreshes, behaviour }
}

/** `navigator.locks` for one origin: one holder at a time per name, first come first served. */
function originLocks () {
  const requested: string[] = []
  const tails = new Map<string, Promise<unknown>>()
  return {
    requested,
    request: (name: string, work: () => Promise<unknown>) => {
      requested.push(name)
      const run = (tails.get(name) ?? Promise.resolve()).then(work)
      tails.set(name, run.catch(() => {}))
      return run
    }
  }
}

async function openTab (): Promise<{ events: Events, api: Api }> {
  vi.resetModules()
  const api = await import('../api')
  const events = await import('../session-events')
  return { events, api }
}

const settle = async (ms = 0) => { await vi.advanceTimersByTimeAsync(ms) }
const frame = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  localStorage.setItem('muon.cloud.token', 'access-1')
  localStorage.setItem('muon.cloud.refresh', 'refresh-1')
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('reading the stream', () => {
  it('splits frames across chunks, drops the heartbeat and reads CRLF', async () => {
    const { events } = await openTab()
    const frames: Array<[string, string]> = []
    const feed = events.sseParser((event, data) => frames.push([event, data]))
    feed(': ping\n\nevent: session_en')
    feed('ded\r\ndata: {"reason":')
    feed('"password_changed"}\r\n\r\n: ping\n\n')
    feed('event: reauth\ndata: {}\n\n')
    expect(frames).toEqual([['session_ended', '{"reason":"password_changed"}'], ['reauth', '{}']])
  })
})

describe('one stream per browser (leader election)', () => {
  it('two tabs hold one stream, sent with the bearer token', async () => {
    const service = fakeConsole()
    const locks = originLocks()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks })
    const [a, b] = [await openTab(), await openTab()]
    a.events.startSessionStream({ onEnded: vi.fn() })
    b.events.startSessionStream({ onEnded: vi.fn() })
    await settle()

    expect(locks.requested.filter(n => n === 'muon.cloud.session-events')).toHaveLength(2)
    expect(service.streams).toHaveLength(1)
    expect(service.streams[0].authorization).toBe('Bearer access-1')
  })

  it('the next tab takes over when the leader\'s tab closes', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const [a, b] = [await openTab(), await openTab()]
    a.events.startSessionStream({ onEnded: vi.fn() })
    b.events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    expect(service.streams).toHaveLength(1)

    a.events.stopSessionStream() // the leader's tab goes: the browser frees its lock
    await settle()

    expect(service.streams[0].aborted).toBe(true)
    expect(service.streams).toHaveLength(2)
    expect(service.streams[1].aborted).toBe(false)
  })

  it('with no navigator.locks there is no stream', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', {})
    const { events } = await openTab()
    events.startSessionStream({ onEnded: vi.fn() })
    await settle(60_000)
    expect(service.fetch).not.toHaveBeenCalled()
  })

  it('a tab that signed out stops, and does not stream when it later gets the lock', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const [a, b] = [await openTab(), await openTab()]
    a.events.startSessionStream({ onEnded: vi.fn() })
    b.events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    b.events.stopSessionStream() // the waiting tab signs out first
    a.events.stopSessionStream()
    await settle(60_000)
    expect(service.streams).toHaveLength(1)
    expect(service.streams[0].aborted).toBe(true)
  })

  it('a new session in the leader reconnects its stream with the new token', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    localStorage.setItem('muon.cloud.token', 'access-other-account')
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    expect(service.streams.map(s => s.authorization)).toEqual(['Bearer access-1', 'Bearer access-other-account'])
    expect(service.streams[0].aborted).toBe(true)
  })
})

describe('what the stream says', () => {
  it('session_ended: the reason goes to onEnded once and the stream is not reopened', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    const onEnded = vi.fn()
    events.startSessionStream({ onEnded })
    await settle()
    service.streams[0].push(': ping\n\n')
    service.streams[0].push(frame('session_ended', { reason: 'password_changed' }))
    service.streams[0].close()
    await settle(120_000)
    expect(onEnded).toHaveBeenCalledTimes(1)
    expect(onEnded).toHaveBeenCalledWith('password_changed', null, 'access-1')
    expect(service.streams).toHaveLength(1)
  })

  it('a reason that is not a plain wire word is not passed on', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    const onEnded = vi.fn()
    events.startSessionStream({ onEnded })
    await settle()
    service.streams[0].push(frame('session_ended', { reason: '<script>' }))
    await settle()
    expect(onEnded).toHaveBeenCalledWith(undefined, null, 'access-1')
  })

  it('reauth: refreshes, then reconnects at once with the new token', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    const onEnded = vi.fn()
    events.startSessionStream({ onEnded })
    await settle()
    service.streams[0].push(frame('reauth', {}))
    service.streams[0].close()
    await settle()
    expect(service.refreshes).toEqual(['refresh-1'])
    expect(service.streams.map(s => s.authorization)).toEqual(['Bearer access-1', 'Bearer access-2'])
    expect(onEnded).not.toHaveBeenCalled()
  })

  it('reauth with a refresh the console refuses: the refusal carries the reason and the stream stops', async () => {
    const service = fakeConsole()
    service.behaviour.token = { status: 400, body: { error: 'invalid_grant', reason: 'password_changed' } }
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events, api } = await openTab()
    const refused = vi.fn()
    api.setSessionHooks({ refused })
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    service.streams[0].push(frame('reauth', {}))
    await settle(120_000)
    expect(refused).toHaveBeenCalledWith('password_changed')
    expect(service.streams).toHaveLength(1)
  })

  it('a 401 (under 30 s left): refreshes first, then reconnects at once', async () => {
    const service = fakeConsole()
    service.behaviour.queue = [401]
    service.behaviour.streamBody = { error: 'your session has ended', refresh: true }
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    // The first 401 reached the refresh and a second connection followed without waiting.
    expect(service.refreshes).toEqual(['refresh-1'])
    expect(service.streams).toHaveLength(1)
    expect(service.streams[0].authorization).toBe('Bearer access-2')
  })
})

describe('reconnecting', () => {
  it('waits 1, 2, 5, 15 then 30 s, and holds at 30 s, when the stream closes with no verdict', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    expect(events.STREAM_BACKOFF_MS).toEqual([1000, 2000, 5000, 15000, 30000])
    service.behaviour.streamStatus = 500
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    const calls = () => service.fetch.mock.calls.length
    expect(calls()).toBe(1)
    for (const [wait, total] of [[1000, 2], [2000, 3], [5000, 4], [15000, 5], [30000, 6], [30000, 7]]) {
      await settle(wait - 1)
      expect(calls()).toBe(total - 1)
      await settle(1)
      expect(calls()).toBe(total)
    }
  })

  it('a stream that showed a ping or frame starts the backoff over', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    for (let i = 0; i < 3; i++) {
      service.streams[service.streams.length - 1].push(': ping\n\n')
      await settle()
      service.streams[service.streams.length - 1].close()
      await settle(30_000)
    }
    service.streams[service.streams.length - 1].push(': ping\n\n')
    await settle()
    expect(service.streams.length).toBe(4)
    // Every one of those sent bytes, so each wait was the first (1 s), not 1, 2, 5.
    service.streams[3].close()
    await settle(1000)
    expect(service.streams).toHaveLength(5)
  })

  it('a 429 waits 30 s before asking again', async () => {
    const service = fakeConsole()
    service.behaviour.streamStatus = 429
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    expect(service.fetch).toHaveBeenCalledTimes(1)
    await settle(29_999)
    expect(service.fetch).toHaveBeenCalledTimes(1)
    await settle(1)
    expect(service.fetch).toHaveBeenCalledTimes(2)
  })

  it('stops for good when the session is signed out, even while it waits to reconnect', async () => {
    const service = fakeConsole()
    service.behaviour.streamStatus = 500
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    events.stopSessionStream()
    await settle(120_000)
    expect(service.fetch).toHaveBeenCalledTimes(1)
  })

  it('no token stored: no stream', async () => {
    localStorage.removeItem('muon.cloud.token')
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    events.startSessionStream({ onEnded: vi.fn() })
    await settle(60_000)
    expect(service.fetch).not.toHaveBeenCalled()
  })
})

describe('a 200 that is no working stream (KAN-2509 review M1)', () => {
  const calls = (service: ReturnType<typeof fakeConsole>) => service.fetch.mock.calls.length

  it('not an event stream: a failure with backoff, never a verdict or a fast loop', async () => {
    const service = fakeConsole()
    service.behaviour.contentType = 'text/html'
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    const onEnded = vi.fn()
    events.startSessionStream({ onEnded })
    await settle()
    expect(calls(service)).toBe(1)
    // The console's body is cancelled unread: nothing in it counts.
    for (const [wait, total] of [[1000, 2], [2000, 3], [5000, 4]]) {
      await settle(wait - 1)
      expect(calls(service)).toBe(total - 1)
      await settle(1)
      expect(calls(service)).toBe(total)
    }
    expect(onEnded).not.toHaveBeenCalled()
  })

  it('a stream that closes before any frame does not start the backoff over', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    for (const [wait, total] of [[1000, 2], [2000, 3], [5000, 4]]) {
      service.streams[service.streams.length - 1].close()
      await settle(wait - 1)
      expect(calls(service)).toBe(total - 1)
      await settle(1)
      expect(calls(service)).toBe(total)
    }
  })
})

describe('a 403 is final for its token (KAN-2509 review L1)', () => {
  it('is not asked again until another session is stored', async () => {
    const service = fakeConsole()
    service.behaviour.queue = [403]
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    events.startSessionStream({ onEnded: vi.fn() })
    await settle(10 * 60_000)
    expect(service.fetch).toHaveBeenCalledTimes(1)
    localStorage.setItem('muon.cloud.token', 'access-new')
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    expect(service.streams.map(s => s.authorization)).toEqual(['Bearer access-new'])
  })
})

describe('a verdict is about the session the stream was opened for (KAN-2509 review H1)', () => {
  it('a session_ended after another tab stored a new session is not taken; the stream asks again with the stored one', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    const onEnded = vi.fn(() => true)
    let current = 'S1'
    events.startSessionStream({ onEnded, sessionId: () => current })
    await settle()
    // Another tab signs in again for the same account: S2 and a new token are stored; the old stream then says S1 ended.
    current = 'S2'
    localStorage.setItem('muon.cloud.token', 'access-s2')
    service.streams[0].push(frame('session_ended', { reason: 'signed_out' }))
    await settle()
    expect(onEnded).not.toHaveBeenCalled()
    expect(service.streams.map(s => s.authorization)).toEqual(['Bearer access-1', 'Bearer access-s2'])
    // The new session really ending is taken, as the session it belongs to.
    service.streams[1].push(frame('session_ended', { reason: 'password_changed' }))
    await settle()
    expect(onEnded).toHaveBeenCalledWith('password_changed', 'S2', 'access-s2')
  })

  it('names the session the connection was opened for, read at open, not at the verdict', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    const onEnded = vi.fn(() => true)
    let current = 'S1'
    events.startSessionStream({ onEnded, sessionId: () => current })
    await settle()
    current = 'S2' // learned by this tab meanwhile, token unchanged
    service.streams[0].push(frame('session_ended', { reason: 'signed_out' }))
    await settle()
    expect(onEnded).toHaveBeenCalledWith('signed_out', 'S1', 'access-1')
  })

  it('reconnectIfTokenChanged reopens with the stored token, and leaves an unchanged one alone', async () => {
    const service = fakeConsole()
    vi.stubGlobal('fetch', service.fetch)
    vi.stubGlobal('navigator', { locks: originLocks() })
    const { events } = await openTab()
    events.startSessionStream({ onEnded: vi.fn() })
    await settle()
    events.reconnectIfTokenChanged()
    await settle()
    expect(service.streams).toHaveLength(1)
    localStorage.setItem('muon.cloud.token', 'access-rotated')
    events.reconnectIfTokenChanged()
    await settle()
    expect(service.streams.map(s => s.authorization)).toEqual(['Bearer access-1', 'Bearer access-rotated'])
  })
})
