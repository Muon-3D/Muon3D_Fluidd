/**
 * The live sign-out push (KAN-2509): the console's `GET /v1/me/session-events` tells a signed-in browser, in seconds
 * and without it being focused, that its session ended and why.
 *
 * One stream per browser, not per tab. A `navigator.locks` lock is the election: the tab that holds it streams, the
 * others wait for the lock and take over when the holder's tab closes. Without `navigator.locks` there is NO stream
 * (the focus check and the next refused call still end the session).
 *
 * The stream is a `fetch` read as a stream, not an `EventSource`: an `EventSource` cannot send the bearer token.
 *
 * The console sends `event: session_ended` (`data: {"reason": "<wire>"}`) and closes; or `event: reauth` when the access
 * token expires and closes (refresh, then open again); and `: ping` comments. A `401` is the console's "refresh first"
 * (under 30 s left) or a token that is no longer good: both go through the normal refresh, whose own refusal says why.
 *
 * This module only reads the stream. What a delivered reason does (the note, the other tabs, the hold on the recovery
 * codes) is state.ts's, through `onEnded`.
 */
import { cloudBaseUrl, cloudSessionAllowed, cloudTokensPersist, refreshOutcome, sessionRefused, storedToken } from './api'

/** The lock every tab of this origin contends for; whoever holds it streams. */
export const SESSION_EVENTS_LOCK = 'muon.cloud.session-events'

/** localStorage key a leader writes when its session ended, for the `storage` event of every other tab. */
export const ENDED_KEY = 'muon.cloud.ended'

/** The waits before reconnecting after a stream that failed or closed without a verdict, then holding at the last. */
export const STREAM_BACKOFF_MS = [1000, 2000, 5000, 15000, 30000]

/** The wait after the console answered 429 or 403 (too many streams, not for this session). */
export const STREAM_THROTTLED_MS = 30000

export interface SessionStreamDeps {
  /**
   * The session id of the session in storage, read when a connection is opened (never later: by the time a verdict
   * arrives another tab may have stored another session, and the verdict is about the one the stream was opened for).
   */
  sessionId?: () => string | null;
  /**
   * The console said this connection's session ended. `reason` is the wire string (undefined when the frame carried
   * none); `sessionId` and `token` are the session the connection was opened for.
   */
  onEnded: (reason: string | undefined, sessionId: string | null, token: string) => boolean | void;
}

/** A `session_ended` or `reauth` is the last frame: after it the console closes. */
type Verdict = { kind: 'ended', reason: string | undefined } | { kind: 'reauth' }

/** Splits an event stream into frames: `onFrame(event name, data)`. Comments (`: ping`) are dropped. */
export function sseParser (onFrame: (event: string, data: string) => void): (chunk: string) => void {
  let buffer = ''
  let event = ''
  let data: string[] = []
  const line = (text: string) => {
    if (text === '') {
      if (event || data.length) onFrame(event || 'message', data.join('\n'))
      event = ''
      data = []
    } else if (text[0] === ':') {
      // a comment: the console's heartbeat
    } else {
      const at = text.indexOf(':')
      const field = at < 0 ? text : text.slice(0, at)
      let value = at < 0 ? '' : text.slice(at + 1)
      if (value[0] === ' ') value = value.slice(1)
      if (field === 'event') event = value
      else if (field === 'data') data.push(value)
    }
  }
  return (chunk: string) => {
    buffer += chunk
    for (;;) {
      const end = buffer.indexOf('\n')
      if (end < 0) return
      const text = buffer.slice(0, end).replace(/\r$/, '')
      buffer = buffer.slice(end + 1)
      line(text)
    }
  }
}

/** The reason in a frame's data, only when it is a plain wire word. */
function reasonOf (data: string): string | undefined {
  try {
    const reason = (JSON.parse(data) as { reason?: unknown }).reason
    return typeof reason === 'string' && /^[a-z][a-z_]{0,39}$/.test(reason) ? reason : undefined
  } catch {
    return undefined
  }
}

function sleep (ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) return resolve()
    const done = () => { clearTimeout(timer); resolve() }
    const timer = setTimeout(() => { signal.removeEventListener('abort', done); resolve() }, ms)
    signal.addEventListener('abort', done, { once: true })
  })
}

/** How one connection came out. */
type Outcome =
  | { kind: 'verdict', verdict: Verdict }
  | { kind: 'unauthorized' }
  | { kind: 'throttled' }
  | { kind: 'forbidden' }
  | { kind: 'closed' }
  | { kind: 'aborted' }

/** One connection: open it, read frames until a verdict, the stream's end, or an abort. */
async function connect (token: string, signal: AbortSignal, heardFrom: () => void): Promise<Outcome> {
  let response: Response
  try {
    response = await fetch(`${cloudBaseUrl()}/v1/me/session-events`, {
      headers: { authorization: `Bearer ${token}`, accept: 'text/event-stream' },
      cache: 'no-store',
      signal
    })
  } catch {
    return signal.aborted ? { kind: 'aborted' } : { kind: 'closed' }
  }
  const refuse = (outcome: Outcome): Outcome => {
    response.body?.cancel().catch(() => {})
    return outcome
  }
  if (response.status === 401) return refuse({ kind: 'unauthorized' })
  if (response.status === 429) return refuse({ kind: 'throttled' })
  // Not for this session: asking again with the same token changes nothing.
  if (response.status === 403) return refuse({ kind: 'forbidden' })
  // A 200 that is not an event stream (a captive portal, a proxy's page) is a failure, not a stream.
  if (!response.ok || !response.body || !(response.headers?.get?.('content-type') ?? '').includes('text/event-stream')) return refuse({ kind: 'closed' })
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const heard: { verdict: Verdict | null } = { verdict: null }
  const feed = sseParser((event, data) => {
    if (heard.verdict) return
    if (event === 'session_ended') heard.verdict = { kind: 'ended', reason: reasonOf(data) }
    else if (event === 'reauth') heard.verdict = { kind: 'reauth' }
  })
  try {
    while (!heard.verdict) {
      const { done, value } = await reader.read()
      if (done) break
      // The first bytes (a frame or the console's ping) show a working stream: only then does the backoff start over.
      heardFrom()
      feed(decoder.decode(value, { stream: true }))
    }
  } catch {
    return signal.aborted ? { kind: 'aborted' } : { kind: 'closed' }
  } finally {
    reader.cancel().catch(() => {})
  }
  return heard.verdict ? { kind: 'verdict', verdict: heard.verdict } : { kind: 'closed' }
}

/**
 * A leader tab that is frozen or suspended keeps the lock and its stream goes quiet: the other tabs hear nothing until it
 * wakes. Their fallbacks are the focus check and the next refused call (KAN-1389), which end the session as before.
 *
 * The module's one stream: the lock request of this tab, and the connection the leader holds open. */
let running: AbortController | null = null
let connection: AbortController | null = null
/** The token the open connection was made with. */
let connectionToken: string | null = null

/**
 * The stored token is not the one the open connection was made with (another tab signed in again, rotated the pair or
 * switched account): reconnect with the stored one, so a verdict is always about the session in storage.
 */
export function reconnectIfTokenChanged (): void {
  if (connection && connectionToken !== storedToken()) connection.abort()
}

/** Resolves when `signal` aborts: a connection told never to retry for its token waits for a new one. */
function untilAborted (signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) return resolve()
    signal.addEventListener('abort', () => resolve(), { once: true })
  })
}

/** For the leader: connect, and on every way a connection ends decide what is next, until the session is over. */
async function lead (stop: AbortSignal, deps: SessionStreamDeps): Promise<void> {
  let attempt = 0
  let lastWas401 = false
  while (!stop.aborted) {
    const token = storedToken()
    if (!token) return
    const own = new AbortController()
    connection = own
    connectionToken = token
    const sessionId = deps.sessionId?.() ?? null
    const stopped = () => own.abort()
    stop.addEventListener('abort', stopped, { once: true })
    try {
      const outcome = await connect(token, own.signal, () => { attempt = 0 })
      if (stop.aborted) return
      if (outcome.kind === 'aborted') {
        // Restarted for another session: connect again at once, with the new token.
        lastWas401 = false
        continue
      }
      if (outcome.kind === 'verdict' && outcome.verdict.kind === 'ended') {
        // The session in storage is another than the one this stream was opened for (another tab signed in again):
        // the verdict is the old session's. Ask again with the stored one, which answers for itself.
        if (storedToken() !== token) {
          lastWas401 = false
          continue
        }
        // false: not taken (the stored session changed in the meantime): ask again.
        if (deps.onEnded(outcome.verdict.reason, sessionId, token) === false) continue
        return
      }
      if (outcome.kind === 'forbidden') {
        await untilAborted(own.signal)
        lastWas401 = false
        continue
      }
      if (outcome.kind === 'throttled') {
        await sleep(STREAM_THROTTLED_MS, own.signal)
        lastWas401 = false
        continue
      }
      if (outcome.kind === 'verdict' || outcome.kind === 'unauthorized') {
        // `reauth` (the token ran out) and a 401 (under 30 s left, or no longer good): the normal refresh, whose own
        // refusal carries the reason. The first 401 reconnects at once, a second in a row waits like any failure.
        const again = outcome.kind === 'unauthorized' && lastWas401
        lastWas401 = outcome.kind === 'unauthorized'
        const refreshed = await refreshOutcome()
        if (stop.aborted) return
        if (refreshed === 'refused') {
          // refreshOutcome announced a refusal of a stored pair itself; a session with no refresh token (a printer's
          // own address) has nothing to refuse, so the end is announced here. Both land on the one refused path.
          sessionRefused(token)
          return
        }
        if (refreshed === 'ok' && !again) continue
      } else {
        lastWas401 = false
      }
      await sleep(STREAM_BACKOFF_MS[Math.min(attempt, STREAM_BACKOFF_MS.length - 1)], own.signal)
      attempt++
    } finally {
      stop.removeEventListener('abort', stopped)
      if (connection === own) connection = null
    }
  }
}

/** Whether this page can take part: `navigator.locks`, a page that may send the bearer, tokens shared between tabs. */
export function sessionStreamAvailable (): boolean {
  const locks = typeof navigator !== 'undefined' ? (navigator as any).locks : undefined
  if (!locks || typeof locks.request !== 'function') return false
  // Where tokens are not shared between tabs (a printer's own secure address keeps them per tab, in memory), one
  // leader's stream could not speak for the other tabs' sessions.
  return cloudSessionAllowed() && cloudTokensPersist()
}

/**
 * Takes part in the election for this browser's one stream, or, when this tab already does, reconnects the leader's
 * stream for the session now stored (a new sign-in, another account). Does nothing where `sessionStreamAvailable` is false.
 */
export function startSessionStream (deps: SessionStreamDeps): void {
  if (running) {
    connection?.abort()
    return
  }
  if (!sessionStreamAvailable()) return
  const locks = (navigator as any).locks
  const stop = new AbortController()
  running = stop
  const done = () => { if (running === stop) running = null }
  try {
    // The lock is held for as long as `lead` runs: the browser frees it when this tab goes, and the next waiting tab leads.
    Promise.resolve(locks.request(SESSION_EVENTS_LOCK, () => (stop.signal.aborted ? undefined : lead(stop.signal, deps))))
      .catch(() => {})
      .finally(done)
  } catch {
    done()
  }
}

/** The session is over (or this tab signed out): stop streaming and leave the election. */
export function stopSessionStream (): void {
  const stop = running
  running = null
  stop?.abort()
}
