/**
 * The agent activity stream, `GET /v1/agents/events` (KAN-1359 Phase A).
 *
 * Its auth is the bearer session, so EventSource can't be used: this reads
 * `fetch()`'s body and parses Server-Sent Events itself (the WHATWG
 * event-stream rules), and sends `Last-Event-ID` itself when it reconnects.
 * The console pings every 15 s; a stream quiet for longer than
 * `QUIET_MS` is treated as dead and opened again.
 */

export interface SseMessage {
  /** `event:`, `message` when the block had none. */
  event: string;
  data: string;
  /** The last `id:` seen so far, this block's or an earlier one's. */
  id: string;
}

export interface SseParser {
  /** Some more of the stream, already decoded to text. Any chunk boundary works. */
  push: (text: string) => void;
}

/**
 * An incremental parser: `onMessage` for every dispatched block, and
 * `onComment` for a `:` line (the console's `: ping`).
 */
export function createSseParser (onMessage: (message: SseMessage) => void, onComment: (text: string) => void = () => {}): SseParser {
  let buffer = ''
  let started = false
  // A chunk that ended on CR: an LF opening the next chunk belongs to it.
  let skipLf = false
  let event = ''
  let data: string[] = []
  let lastId = ''

  const line = (text: string) => {
    if (text === '') {
      if (data.length) onMessage({ event: event || 'message', data: data.join('\n'), id: lastId })
      event = ''
      data = []
      return
    }
    if (text.startsWith(':')) {
      onComment(text.slice(1).replace(/^ /, ''))
      return
    }
    const colon = text.indexOf(':')
    const field = colon < 0 ? text : text.slice(0, colon)
    const value = colon < 0 ? '' : text.slice(colon + 1).replace(/^ /, '')
    if (field === 'event') event = value
    else if (field === 'data') data.push(value)
    else if (field === 'id' && !value.includes('\0')) lastId = value
  }

  return {
    push (text: string) {
      if (!started && text.length) {
        started = true
        if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
      }
      if (skipLf && text.startsWith('\n')) text = text.slice(1)
      skipLf = false
      buffer += text
      let start = 0
      for (let i = 0; i < buffer.length; i++) {
        const c = buffer[i]
        if (c !== '\n' && c !== '\r') continue
        line(buffer.slice(start, i))
        if (c === '\r') {
          if (i + 1 < buffer.length) {
            if (buffer[i + 1] === '\n') i++
          } else {
            skipLf = true
          }
        }
        start = i + 1
      }
      buffer = buffer.slice(start)
    }
  }
}

/** No byte for this long (a ping is due every 15 s): the stream is dead. */
export const QUIET_MS = 45_000
export const BACKOFF_BASE_MS = 1_000
export const BACKOFF_CAP_MS = 30_000
/** After a stream that ended cleanly (the console drops a lagging listener). */
export const RESUME_MS = 1_000
/** Signed out, or a console without the stream: look again this often. */
export const IDLE_RETRY_MS = 60_000

export type StreamStatus = 'idle' | 'connecting' | 'live' | 'waiting' | 'unavailable'

export interface AgentStreamOptions {
  baseUrl: () => string;
  token: () => string | null;
  /** Swap the session for a fresh one after a 401; true when it worked. */
  refresh: () => Promise<boolean>;
  onMessage: (message: SseMessage) => void;
  /** Each time the stream opens (a 200 with `text/event-stream`). */
  onOpen?: () => void;
  onStatus?: (status: StreamStatus) => void;
  fetch?: typeof fetch;
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  random?: () => number;
}

/**
 * One stream, kept open: it reconnects with the last id it read, backs off
 * when the console can't be reached, and stops at `stop()`.
 */
export class AgentStream {
  private readonly options: AgentStreamOptions
  private running = false
  private controller: AbortController | null = null
  private timer: unknown = null
  private failures = 0
  lastEventId = ''

  constructor (options: AgentStreamOptions) {
    this.options = options
  }

  private get set () { return this.options.setTimeout ?? ((fn: () => void, ms: number) => setTimeout(fn, ms)) }
  private get clear () { return this.options.clearTimeout ?? ((h: unknown) => clearTimeout(h as ReturnType<typeof setTimeout>)) }

  start () {
    if (this.running) return
    this.running = true
    this.failures = 0
    this.connect()
  }

  stop () {
    this.running = false
    if (this.timer !== null) this.clear(this.timer)
    this.timer = null
    this.controller?.abort()
    this.controller = null
    this.options.onStatus?.('idle')
  }

  /** Forget the resume point (after a `reset`, the console starts again from now). */
  setLastEventId (id: string) {
    this.lastEventId = id
  }

  private later (ms: number, status: StreamStatus) {
    if (!this.running) return
    this.options.onStatus?.(status)
    if (this.timer !== null) this.clear(this.timer)
    this.timer = this.set(() => {
      this.timer = null
      this.connect()
    }, ms)
  }

  private backoff (): number {
    const exp = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** this.failures)
    this.failures++
    const random = this.options.random ?? Math.random
    return Math.round(exp / 2 + random() * exp / 2)
  }

  private async connect (refreshed = false): Promise<void> {
    if (!this.running) return
    const token = this.options.token()
    if (!token) return this.later(IDLE_RETRY_MS, 'unavailable')
    const controller = new AbortController()
    this.controller = controller
    this.options.onStatus?.('connecting')
    const headers: Record<string, string> = { authorization: `Bearer ${token}`, accept: 'text/event-stream' }
    if (this.lastEventId) headers['last-event-id'] = this.lastEventId
    const doFetch = this.options.fetch ?? fetch
    let response: Response
    try {
      response = await doFetch(`${this.options.baseUrl()}/v1/agents/events`, { headers, signal: controller.signal, cache: 'no-store' })
    } catch {
      if (controller.signal.aborted || !this.running) return
      return this.later(this.backoff(), 'waiting')
    }
    if (!this.running || controller.signal.aborted) return
    if (response.status === 401 && !refreshed) {
      if (await this.options.refresh().catch(() => false)) return this.connect(true)
      return this.later(IDLE_RETRY_MS, 'unavailable')
    }
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !type.includes('text/event-stream') || !response.body) {
      // 429: too many streams for the account; 5xx: the console is having trouble.
      if (response.status === 429 || response.status >= 500) return this.later(this.backoff(), 'waiting')
      // A console without the stream (404, or a JSON fallback), or a session refused it.
      return this.later(IDLE_RETRY_MS, 'unavailable')
    }
    this.options.onOpen?.()
    this.options.onStatus?.('live')
    let heard = false
    const parser = createSseParser(message => {
      heard = true
      this.failures = 0
      this.lastEventId = message.id
      this.options.onMessage(message)
    }, () => { heard = true; this.failures = 0 })
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let quiet: unknown = null
    const arm = () => {
      if (quiet !== null) this.clear(quiet)
      quiet = this.set(() => {
        controller.abort()
        reader.cancel().catch(() => {})
      }, QUIET_MS)
    }
    arm()
    try {
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        arm()
        parser.push(decoder.decode(value, { stream: true }))
      }
      parser.push(decoder.decode())
    } catch { /* aborted or dropped: reconnect below */ } finally {
      if (quiet !== null) this.clear(quiet)
    }
    if (!this.running || this.controller !== controller) return
    this.later(heard ? RESUME_MS : this.backoff(), 'waiting')
  }
}
