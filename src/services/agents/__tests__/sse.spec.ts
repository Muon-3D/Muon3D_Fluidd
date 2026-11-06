import { describe, expect, it, vi } from 'vitest'
import { AgentStream, createSseParser, IDLE_RETRY_MS, QUIET_MS, RESUME_MS, type SseMessage } from '../sse'

const FRAME = 'id: 7\nevent: agent.action\ndata: {"v":1,"phase":"started"}\n\n: ping\n\nid: 8\nevent: reset\ndata: {}\n\n'

function parseAll (chunks: string[]) {
  const messages: SseMessage[] = []
  const comments: string[] = []
  const parser = createSseParser(m => messages.push(m), c => comments.push(c))
  chunks.forEach(c => parser.push(c))
  return { messages, comments }
}

describe('createSseParser', () => {
  const whole = parseAll([FRAME])

  it('reads events, ids and the ping comment', () => {
    expect(whole.messages).toEqual([
      { event: 'agent.action', data: '{"v":1,"phase":"started"}', id: '7' },
      { event: 'reset', data: '{}', id: '8' }
    ])
    expect(whole.comments).toEqual(['ping'])
  })

  it('gives the same answer whatever the chunk boundaries', () => {
    expect(parseAll(FRAME.split(''))).toEqual(whole)
    for (let at = 1; at < FRAME.length; at++) {
      expect(parseAll([FRAME.slice(0, at), FRAME.slice(at)])).toEqual(whole)
    }
  })

  it('takes CRLF and CR line ends, also split between chunks', () => {
    const crlf = FRAME.replace(/\n/g, '\r\n')
    expect(parseAll([crlf])).toEqual(whole)
    expect(parseAll(crlf.split(''))).toEqual(whole)
    expect(parseAll([FRAME.replace(/\n/g, '\r')])).toEqual(whole)
  })

  it('joins multi-line data, keeps the last id, and ignores a block with no data', () => {
    const { messages } = parseAll(['\ufeffid: 3\ndata: a\ndata:b\n\nevent: x\n\ndata: c\n\n'])
    expect(messages).toEqual([
      { event: 'message', data: 'a\nb', id: '3' },
      { event: 'message', data: 'c', id: '3' }
    ])
  })

  it('holds an unfinished block until its blank line', () => {
    const { messages } = parseAll(['id: 1\ndata: {"a":', '1}\n'])
    expect(messages).toEqual([])
  })
})

function body (text: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start (controller) {
      text.forEach(t => controller.enqueue(encoder.encode(t)))
      controller.close()
    }
  })
}

const sse = (text: string[], status = 200) => new Response(body(text), { status, headers: { 'content-type': 'text/event-stream' } })

function harness (answers: Array<() => Response | Promise<Response>>, token: string | null = 'tok') {
  const timers: Array<{ fn: () => void, ms: number }> = []
  const calls: RequestInit[] = []
  const messages: SseMessage[] = []
  const statuses: string[] = []
  const fetch = vi.fn(async (_url: string, init: RequestInit) => {
    calls.push(init)
    const next = answers.shift()
    if (!next) return new Promise<Response>(() => {})
    return next()
  })
  const refresh = vi.fn(async () => true)
  const stream = new AgentStream({
    baseUrl: () => 'https://console.test',
    token: () => token,
    refresh,
    onMessage: m => messages.push(m),
    onStatus: s => statuses.push(s),
    fetch: fetch as unknown as typeof globalThis.fetch,
    setTimeout: (fn, ms) => { const t = { fn, ms }; timers.push(t); return t },
    clearTimeout: t => { const i = timers.indexOf(t as never); if (i >= 0) timers.splice(i, 1) },
    random: () => 1
  })
  const settle = () => new Promise(resolve => setTimeout(resolve, 0))
  /** Run the next timer that isn't the quiet watch. */
  const fire = async (ms?: number) => {
    const i = timers.findIndex(t => ms === undefined ? t.ms !== QUIET_MS : t.ms === ms)
    expect(i).toBeGreaterThanOrEqual(0)
    const [t] = timers.splice(i, 1)
    t.fn()
    await settle(); await settle()
  }
  return { stream, fetch, calls, messages, statuses, timers, refresh, settle, fire }
}

const headersOf = (init: RequestInit) => init.headers as Record<string, string>

describe('AgentStream', () => {
  it('sends the bearer token, then reconnects with the last id it read as Last-Event-ID', async () => {
    const h = harness([() => sse(['id: 41\nevent: agent.action\ndata: {}\n', '\n']), () => sse([': ping\n\n'])])
    h.stream.start()
    await h.settle(); await h.settle(); await h.settle()
    expect(headersOf(h.calls[0]).authorization).toBe('Bearer tok')
    expect(headersOf(h.calls[0])['last-event-id']).toBeUndefined()
    expect(h.messages.map(m => m.id)).toEqual(['41'])
    expect(h.timers.some(t => t.ms === RESUME_MS)).toBe(true)
    await h.fire(RESUME_MS)
    expect(h.fetch).toHaveBeenCalledTimes(2)
    expect(headersOf(h.calls[1])['last-event-id']).toBe('41')
    expect(h.fetch.mock.calls[1][0]).toBe('https://console.test/v1/agents/events')
  })

  it('backs off when the console cannot be reached, and stops on stop()', async () => {
    const h = harness([() => { throw new TypeError('offline') }])
    h.stream.start()
    await h.settle(); await h.settle()
    expect(h.statuses).toContain('waiting')
    expect(h.timers[0].ms).toBe(1000)
    h.stream.stop()
    expect(h.timers).toEqual([])
  })

  it('refreshes the session once after a 401', async () => {
    const h = harness([() => new Response('', { status: 401 }), () => sse([': ping\n\n'])])
    h.stream.start()
    await h.settle(); await h.settle(); await h.settle()
    expect(h.refresh).toHaveBeenCalledTimes(1)
    expect(h.fetch).toHaveBeenCalledTimes(2)
  })

  it('a console without the stream is looked at again only after a minute', async () => {
    const h = harness([() => new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } })])
    h.stream.start()
    await h.settle(); await h.settle()
    expect(h.statuses[h.statuses.length - 1]).toBe('unavailable')
    expect(h.timers.map(t => t.ms)).toEqual([IDLE_RETRY_MS])
  })

  it('no token: no request', async () => {
    const h = harness([], null)
    h.stream.start()
    await h.settle()
    expect(h.fetch).not.toHaveBeenCalled()
  })

  it('a stream quiet past QUIET_MS is dropped and opened again', async () => {
    const hanging = () => {
      const stream = new ReadableStream<Uint8Array>({ start (c) { c.enqueue(new TextEncoder().encode(': ping\n\n')) } })
      return new Response(stream, { headers: { 'content-type': 'text/event-stream' } })
    }
    const h = harness([hanging])
    h.stream.start()
    await h.settle(); await h.settle()
    expect(h.timers.some(t => t.ms === QUIET_MS)).toBe(true)
    // The quiet watch drops the stream; a reconnect is due.
    await h.fire(QUIET_MS)
    await h.settle()
    expect(h.timers.some(t => t.ms === RESUME_MS)).toBe(true)
  })
})
