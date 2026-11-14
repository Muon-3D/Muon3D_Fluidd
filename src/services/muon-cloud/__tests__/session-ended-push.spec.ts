/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 */
// KAN-2509: a session the console ended reaches every tab, with the reason. The leader's stream (or a refused
// refresh) delivers it; the other tabs get it from `muon.cloud.ended` (the `storage` event); the recovery codes'
// hold defers it like any other drop; /signed-out says why.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ENDED_KEY } from '../session-events'
import { cloudApi, sessionRefused as refusedFromApi, storedRefreshToken, storedToken, storeRefreshToken, storeToken } from '../api'
import { cloudState, holdSignOut, initCloud, publishEnded, releaseSignOut, setSignedOutNavigation, signOut } from '../state'
import { readSignedOut } from '@/services/account/signed-out-note'

vi.mock('../iroh', () => ({ browserEndpoint: vi.fn(), forgetBrowserKey: vi.fn(), IrohPrinter: class {} }))
// The console's logout form: not a page jsdom can leave.
vi.mock('../centralLogin', async (original) => ({ ...await original<typeof import('../centralLogin')>(), signOutCentral: vi.fn() }))

const account = { id: 'acct-1', email: 'sam@example.test', name: 'Sam', created_at: 1 }

function json (status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, headers: new Headers(), json: async () => body, text: async () => JSON.stringify(body) } as Response
}

interface Live { push: (text: string) => void, close: () => void, aborted: boolean }

/** The console, as far as this tab meets it. */
function fakeConsole (options: { sessionId?: string, notices?: Response, refresh?: Response } = {}) {
  const streams: Live[] = []
  const paths: string[] = []
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input)).pathname
    paths.push(path)
    switch (path) {
      case '/v1/me': return json(200, { account, endpoint_id: null, session_id: options.sessionId ?? 'sess-1' })
      case '/v1/printers': return json(200, { printers: [] })
      case '/v1/fleet/layout': return json(200, { layout: {} })
      case '/v1/me/notices': return options.notices ?? json(200, { notices: [], unread: 0, next: null })
      case '/token': return options.refresh ?? json(400, { error: 'invalid_grant' })
      case '/v1/auth/sign-out': return json(200, { ok: true })
      case '/v1/me/session-events': {
        let controller!: ReadableStreamDefaultController<Uint8Array>
        const body = new ReadableStream<Uint8Array>({ start (c) { controller = c } })
        const encoder = new TextEncoder()
        const live: Live = { aborted: false, push: t => controller.enqueue(encoder.encode(t)), close: () => { try { controller.close() } catch { /* closed */ } } }
        init?.signal?.addEventListener('abort', () => { live.aborted = true; try { controller.error(new DOMException('aborted', 'AbortError')) } catch { /* closed */ } })
        streams.push(live)
        return { ok: true, status: 200, headers: new Headers({ 'content-type': 'text/event-stream' }), body } as Response
      }
      default: throw new Error(`unexpected ${path}`)
    }
  })
  return { fetch, streams, paths }
}

function locks () {
  const tails = new Map<string, Promise<unknown>>()
  return {
    request: (name: string, work: () => Promise<unknown>) => {
      const run = (tails.get(name) ?? Promise.resolve()).then(work)
      tails.set(name, run.catch(() => {}))
      return run
    }
  }
}

const ended = (reason: string, sessionId: string | null = 'sess-1') => JSON.stringify({ reason, session_id: sessionId, at: Date.now() })
/** What another tab's write of `muon.cloud.ended` does here. */
const otherTabWrites = (value: string) => window.dispatchEvent(new StorageEvent('storage', { key: ENDED_KEY, newValue: value }))
const sessionEnded = (reason: string) => `event: session_ended\ndata: ${JSON.stringify({ reason })}\n\n`

const go = vi.fn()

/** Signed in as this tab would be after a page load: the account is known and its session id learned from /v1/me. */
async function signedIn (service: ReturnType<typeof fakeConsole>, withLocks = true) {
  localStorage.clear()
  sessionStorage.clear()
  storeToken('access-1')
  storeRefreshToken('refresh-1')
  vi.stubGlobal('fetch', service.fetch)
  vi.stubGlobal('navigator', withLocks ? { locks: locks() } : {})
  await initCloud()
  expect(cloudState.account?.id).toBe('acct-1')
}

beforeEach(() => {
  go.mockReset()
  setSignedOutNavigation(go)
})
afterEach(async () => {
  while (holds > 0) { releaseSignOut(false); holds-- }
  vi.stubGlobal('fetch', vi.fn(async () => json(200, {})))
  await signOut()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

let holds = 0
const hold = () => { holdSignOut(); holds++ }
const release = (dropNow = true) => { releaseSignOut(dropNow); holds-- }

describe('another tab\'s `muon.cloud.ended` (the storage event)', () => {
  it('signs this tab out with the reason and goes to /signed-out', async () => {
    await signedIn(fakeConsole())
    otherTabWrites(ended('password_changed'))
    await vi.waitFor(() => expect(cloudState.account).toBeNull())
    expect(readSignedOut()).toMatchObject({ scope: 'browser', email: 'sam@example.test', reason: 'password_changed' })
    expect(go).toHaveBeenCalledTimes(1)
    expect(storedToken()).toBeNull()
  })

  it('a record of another session id is ignored: the tab stays as it is', async () => {
    await signedIn(fakeConsole())
    otherTabWrites(ended('password_changed', 'sess-of-another-account'))
    otherTabWrites(ended('password_changed', null))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(cloudState.account?.id).toBe('acct-1')
    expect(readSignedOut()).toBeNull()
    expect(go).not.toHaveBeenCalled()
  })

  it('a tab with no stored session of its own to compare does nothing', async () => {
    await signedIn(fakeConsole())
    cloudState.account = null
    otherTabWrites(ended('password_changed'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(go).not.toHaveBeenCalled()
  })

  it('then the token going (the existing drop) changes nothing more', async () => {
    await signedIn(fakeConsole())
    otherTabWrites(ended('email_changed'))
    await vi.waitFor(() => expect(cloudState.account).toBeNull())
    window.dispatchEvent(new StorageEvent('storage', { key: 'muon.cloud.token', newValue: null }))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(readSignedOut()?.reason).toBe('email_changed')
    expect(go).toHaveBeenCalledTimes(1)
  })
})

describe('the leader\'s stream', () => {
  it('session_ended: writes muon.cloud.ended for the other tabs, then signs out here with the reason', async () => {
    const service = fakeConsole()
    await signedIn(service)
    await vi.waitFor(() => expect(service.streams).toHaveLength(1))
    service.streams[0].push(sessionEnded('signed_out_everywhere'))
    await vi.waitFor(() => expect(cloudState.account).toBeNull())
    expect(JSON.parse(localStorage.getItem(ENDED_KEY) ?? '{}')).toMatchObject({ reason: 'signed_out_everywhere', session_id: 'sess-1' })
    expect(readSignedOut()).toMatchObject({ scope: 'everywhere', reason: 'signed_out_everywhere' })
    expect(go).toHaveBeenCalledTimes(1)
  })

  it('signing out here closes the stream', async () => {
    const service = fakeConsole()
    await signedIn(service)
    await vi.waitFor(() => expect(service.streams).toHaveLength(1))
    await signOut()
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(service.streams[0].aborted).toBe(true)
    expect(service.streams).toHaveLength(1)
    expect(service.fetch.mock.calls.filter(([url]) => String(url).endsWith('/session-events'))).toHaveLength(1)
    expect(go).not.toHaveBeenCalled()
  })

  it('without navigator.locks no stream is opened', async () => {
    const service = fakeConsole()
    await signedIn(service, false)
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(service.paths).not.toContain('/v1/me/session-events')
  })
})

describe('the recovery codes\' hold (KAN-1389)', () => {
  it('a drop from another tab waits for the hold, keeps the account up, and goes when it is released', async () => {
    await signedIn(fakeConsole())
    hold()
    otherTabWrites(ended('two_step_changed'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(cloudState.account?.id).toBe('acct-1')
    expect(go).not.toHaveBeenCalled()
    expect(readSignedOut()).toBeNull()

    release()
    await vi.waitFor(() => expect(cloudState.account).toBeNull())
    expect(readSignedOut()).toMatchObject({ reason: 'two_step_changed' })
    expect(go).toHaveBeenCalledTimes(1)
  })

  it('a session_ended on the leader\'s own stream is deferred the same way', async () => {
    const service = fakeConsole()
    await signedIn(service)
    await vi.waitFor(() => expect(service.streams).toHaveLength(1))
    hold()
    service.streams[0].push(sessionEnded('password_changed'))
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(cloudState.account?.id).toBe('acct-1')
    expect(go).not.toHaveBeenCalled()
    release()
    await vi.waitFor(() => expect(go).toHaveBeenCalledTimes(1))
    expect(readSignedOut()?.reason).toBe('password_changed')
  })

  it('released with dropNow false (the caller signs out itself): nothing is dropped here', async () => {
    await signedIn(fakeConsole())
    hold()
    otherTabWrites(ended('password_changed'))
    release(false)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(cloudState.account?.id).toBe('acct-1')
    expect(go).not.toHaveBeenCalled()
  })
})

describe('the reason on a refused call (the refresh\'s 401)', () => {
  it('a refresh refused with a reason signs out with it and goes to /signed-out', async () => {
    await signedIn(fakeConsole({
      notices: json(401, { error: 'your session has ended; sign in again', reason: 'password_changed' }),
      refresh: json(401, { error: 'invalid_grant', reason: 'password_changed' })
    }))
    await cloudApi.notices().catch(() => {})
    await vi.waitFor(() => expect(cloudState.account).toBeNull())
    expect(readSignedOut()).toMatchObject({ reason: 'password_changed', email: 'sam@example.test' })
    expect(go).toHaveBeenCalledTimes(1)
    expect(storedRefreshToken()).toBeNull()
  })

  it('a refresh refused with no reason signs out as before: no note, no navigation', async () => {
    await signedIn(fakeConsole({ notices: json(401, { error: 'sign in first' }), refresh: json(400, { error: 'invalid_grant' }) }))
    await cloudApi.notices().catch(() => {})
    await vi.waitFor(() => expect(cloudState.account).toBeNull())
    expect(readSignedOut()).toBeNull()
    expect(go).not.toHaveBeenCalled()
  })
})

describe('a verdict about an older session (KAN-2509 review H1)', () => {
  it('another tab stored a new token for the same account: the old stream\'s session_ended changes nothing, tokens stay, the stream reopens', async () => {
    const service = fakeConsole()
    await signedIn(service)
    await vi.waitFor(() => expect(service.streams).toHaveLength(1))
    // Another tab signs in again as the same account: its pair is stored, and this tab's stream is still the old one's.
    storeToken('access-s2')
    storeRefreshToken('refresh-s2')
    service.streams[0].push(sessionEnded('signed_out'))
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(cloudState.account?.id).toBe('acct-1')
    expect(storedToken()).toBe('access-s2')
    expect(storedRefreshToken()).toBe('refresh-s2')
    expect(localStorage.getItem(ENDED_KEY)).toBeNull()
    expect(go).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(service.streams).toHaveLength(2))
    expect((service.fetch.mock.calls[service.fetch.mock.calls.length - 1][1] as RequestInit).headers).toMatchObject({ authorization: 'Bearer access-s2' })
  })

  it('another account\'s token stored in the window: likewise nothing is dropped', async () => {
    const service = fakeConsole()
    await signedIn(service)
    await vi.waitFor(() => expect(service.streams).toHaveLength(1))
    storeToken('access-of-another-account')
    service.streams[0].push(sessionEnded('password_changed'))
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(storedToken()).toBe('access-of-another-account')
    expect(localStorage.getItem(ENDED_KEY)).toBeNull()
    expect(go).not.toHaveBeenCalled()
  })

  it('the tab that sees the stored token change reconnects its stream (reconcile of the same account)', async () => {
    const service = fakeConsole()
    await signedIn(service)
    await vi.waitFor(() => expect(service.streams).toHaveLength(1))
    localStorage.setItem('muon.cloud.token', 'access-s2')
    window.dispatchEvent(new StorageEvent('storage', { key: 'muon.cloud.token', newValue: 'access-s2' }))
    await vi.waitFor(() => expect(service.streams).toHaveLength(2))
    expect(service.streams[0].aborted).toBe(true)
  })

  it('publishEnded refuses a token that is no longer the stored one, and names the connection\'s session when it writes', async () => {
    await signedIn(fakeConsole())
    storeToken('access-s2')
    expect(publishEnded('password_changed', 'sess-1', 'access-1')).toBe(false)
    expect(storedToken()).toBe('access-s2')
    expect(cloudState.account?.id).toBe('acct-1')
    expect(localStorage.getItem(ENDED_KEY)).toBeNull()
    expect(publishEnded('password_changed', 'sess-old', 'access-s2')).toBe(true)
    expect(JSON.parse(localStorage.getItem(ENDED_KEY) ?? '{}').session_id).toBe('sess-old')
  })
})

describe('a refusal that joins a run already on its way (KAN-2509 review M2)', () => {
  it('the reasonless run takes the reason of the caller that came after it', async () => {
    await signedIn(fakeConsole())
    refusedFromApi('access-1') // the refresh's own hook: no reason
    refusedFromApi('access-1', 'password_changed') // the call that met the refusal: has it
    await vi.waitFor(() => expect(cloudState.account).toBeNull())
    await vi.waitFor(() => expect(go).toHaveBeenCalledTimes(1))
    expect(readSignedOut()?.reason).toBe('password_changed')
  })
})

describe('the note does not linger (KAN-2509 review L5)', () => {
  it('on /signed-out already: no new note is left for the next visit to /', async () => {
    await signedIn(fakeConsole())
    window.history.pushState({}, '', '/signed-out')
    try {
      otherTabWrites(ended('password_changed'))
      await vi.waitFor(() => expect(cloudState.account).toBeNull())
      expect(readSignedOut()).toBeNull()
      expect(go).not.toHaveBeenCalled()
    } finally {
      window.history.pushState({}, '', '/')
    }
  })
})
