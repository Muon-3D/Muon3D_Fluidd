/**
 * KAN-2724: the LAN sweep must not fill the page's socket pool. Silent
 * addresses (no answer, no refusal) hold a socket until their timeout, and
 * Chrome shares about 256 sockets across the page: the page's own requests
 * to a printer queued behind dead probes.
 *
 * The fake `fetch` below is a silent network: nothing answers, and a request
 * ends only when its signal aborts.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const store = vi.hoisted(() => ({
  listeners: [] as Array<(mutation: { type: string, payload: unknown }) => void>
}))
vi.mock('@/store', () => ({
  default: {
    getters: { get 'config/getInstances' () { return [{ name: 'Sloe', apiUrl: 'http://sloe.local:7125' }, { name: 'Boxwood', apiUrl: 'http://192.168.1.5' }] } },
    subscribe (fn: (mutation: { type: string, payload: unknown }) => void) { store.listeners.push(fn) }
  }
}))
vi.mock('../api', () => ({ cloudApi: { nearby: vi.fn(async () => ({ printers: [] })) } }))

const { discoverPrinters, discoveryState } = await import('../discovery')

interface Call { url: string, signal: AbortSignal, startedAt: number, abortedAt: number | null }
let calls: Call[]
let inFlight: number
let peak: number

function silentNetwork () {
  calls = []
  inFlight = 0
  peak = 0
  vi.stubGlobal('fetch', vi.fn((url: unknown, init: RequestInit = {}) => new Promise((_, reject) => {
    const signal = init.signal as AbortSignal
    const call: Call = { url: String(url), signal, startedAt: Date.now(), abortedAt: null }
    calls.push(call)
    inFlight++
    peak = Math.max(peak, inFlight)
    signal.addEventListener('abort', () => {
      call.abortedAt = Date.now()
      inFlight--
      reject(new DOMException('aborted', 'AbortError'))
    }, { once: true })
  })))
}

const isRange = (c: Call) => /^http:\/\/192\.168\.(137|1)\.\d+\/server\/muon\/identity/.test(c.url) && !c.url.startsWith('http://192.168.1.5/')

async function settle (done: Promise<void>) {
  let finished = false
  void done.then(() => { finished = true })
  for (let i = 0; i < 400 && !finished; i++) await vi.advanceTimersByTimeAsync(500)
  expect(finished).toBe(true)
}

beforeEach(() => {
  vi.useFakeTimers()
  silentNetwork()
  // answersQuickly times a request with performance.now: follow the fake clock.
  vi.spyOn(performance, 'now').mockImplementation(() => Date.now())
  discoveryState.finishedAt = 0
  discoveryState.found = []
})
afterEach(async () => {
  window.dispatchEvent(new Event('pagehide'))
  await vi.advanceTimersByTimeAsync(5000)
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('the LAN sweep is bounded (KAN-2724)', () => {
  it('never has more than 16 probes in flight, over a whole range of silent addresses', async () => {
    await settle(discoverPrinters(true, { nearby: false }))
    expect(calls.filter(isRange).length).toBeGreaterThan(400)
    expect(peak).toBeGreaterThan(1)
    expect(peak).toBeLessThanOrEqual(16)
  })

  it('aborts a hung range probe at 1.5 s, and a hung saved printer at 3 s', async () => {
    await settle(discoverPrinters(true, { nearby: false }))
    const range = calls.filter(isRange)
    expect(range.length).toBeGreaterThan(0)
    for (const c of range) expect(c.abortedAt! - c.startedAt).toBe(1500)
    const saved = calls.find(c => c.url.startsWith('http://sloe.local/server/muon/identity'))!
    expect(saved.abortedAt! - saved.startedAt).toBe(3000)
  })

  it('probes every saved printer before the first address of the range', async () => {
    await settle(discoverPrinters(true, { nearby: false }))
    const firstRange = calls.findIndex(isRange)
    const saved = ['http://sloe.local/server/muon/identity', 'http://192.168.1.5/server/muon/identity']
    for (const url of saved) {
      const i = calls.findIndex(c => c.url.startsWith(url))
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(firstRange)
    }
  })

  it('a second search aborts the first one\'s probes at once', async () => {
    const first = discoverPrinters(true, { nearby: false })
    await vi.advanceTimersByTimeAsync(3000 + 1500 + 100) // into the range
    const mine = calls.filter(c => !c.signal.aborted)
    expect(mine.length).toBeGreaterThan(0)
    const second = discoverPrinters(true, { nearby: false })
    expect(mine.every(c => c.signal.aborted)).toBe(true)
    await settle(second)
    await first
    expect(peak).toBeLessThanOrEqual(16)
    expect(discoveryState.scanning).toBe(false)
  })

  it('a printer connection opening aborts the sweep, and leaves the next look free to sweep again', async () => {
    const sweep = discoverPrinters(true, { nearby: false })
    await vi.advanceTimersByTimeAsync(3000 + 1500 + 100)
    const live = calls.filter(c => !c.signal.aborted)
    expect(live.length).toBeGreaterThan(0)
    for (const fn of store.listeners) fn({ type: 'socket/setSocketConnecting', payload: true })
    expect(live.every(c => c.signal.aborted)).toBe(true)
    await sweep
    expect(inFlight).toBe(0)
    expect(discoveryState.scanning).toBe(false)
    expect(discoveryState.finishedAt).toBe(0)
  })

  it('leaving the page aborts the sweep', async () => {
    const sweep = discoverPrinters(true, { nearby: false })
    await vi.advanceTimersByTimeAsync(3000 + 1500 + 100)
    const live = calls.filter(c => !c.signal.aborted)
    expect(live.length).toBeGreaterThan(0)
    window.dispatchEvent(new Event('pagehide'))
    expect(live.every(c => c.signal.aborted)).toBe(true)
    await sweep
    expect(inFlight).toBe(0)
  })
})
