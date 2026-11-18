import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hotspotState } from '../model'
import { MAX_FAILURES, MISSING_POLL_MS, POLL_MS, pollHotspotOnce, startHotspotPoll } from '../poller'

const apStations = vi.fn()
vi.mock('@/aux_api/useAuxApi', () => ({
  useAuxApi: () => ({ apStations })
}))
const line = vi.hoisted(() => ({ connected: true, apiUrl: 'http://boxwood.local', listeners: [] as Array<() => void> }))
vi.mock('@/store', () => ({
  default: {
    state: { get config () { return { apiUrl: line.apiUrl } } },
    getters: { get 'socket/getConnectionState' () { return line.connected } },
    // Stands in for Vuex: calls back when the watched value changes.
    watch: (getter: () => string, cb: () => void) => {
      let last = getter()
      const fn = () => { const now = getter(); if (now !== last) { last = now; cb() } }
      line.listeners.push(fn)
      return () => { line.listeners = line.listeners.filter(l => l !== fn) }
    }
  }
}))
const lineChanged = () => line.listeners.slice().forEach(l => l())
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { activePrinterId: null } }))

const hidden = (value: boolean) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value ? 'hidden' : 'visible' })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.useFakeTimers()
  apStations.mockReset()
  hotspotState.stations = null
  line.connected = true
  line.apiUrl = 'http://boxwood.local'
  line.listeners = []
  hidden(false)
})
afterEach(() => { vi.useRealTimers() })

describe('hotspot poller (KAN-4297)', () => {
  it('asks at once, then about every 10 s', async () => {
    apStations.mockResolvedValue({ data: { up: true, count: 2, auto_off_at: null } })
    const stop = startHotspotPoll()
    await vi.advanceTimersByTimeAsync(0)
    expect(apStations).toHaveBeenCalledTimes(1)
    expect(hotspotState.stations?.count).toBe(2)
    await vi.advanceTimersByTimeAsync(POLL_MS)
    expect(apStations).toHaveBeenCalledTimes(2)
    stop()
    await vi.advanceTimersByTimeAsync(POLL_MS * 3)
    expect(apStations).toHaveBeenCalledTimes(2)
  })

  it('pauses while the page is hidden and asks again when it is back', async () => {
    apStations.mockResolvedValue({ data: { up: true, count: 1, auto_off_at: null } })
    const stop = startHotspotPoll()
    await vi.advanceTimersByTimeAsync(0)
    hidden(true)
    await vi.advanceTimersByTimeAsync(POLL_MS * 5)
    expect(apStations).toHaveBeenCalledTimes(1)
    hidden(false)
    await vi.advanceTimersByTimeAsync(0)
    expect(apStations).toHaveBeenCalledTimes(2)
    stop()
  })

  it('hides the count and slows to a minute when the printer has no such route', async () => {
    apStations.mockResolvedValue({ data: { up: true, count: 1, auto_off_at: null } })
    await pollHotspotOnce()
    expect(hotspotState.stations).not.toBeNull()
    apStations.mockRejectedValue({ response: { status: 404 } })
    const stop = startHotspotPoll()
    await vi.advanceTimersByTimeAsync(0)
    expect(hotspotState.stations).toBeNull()
    const calls = apStations.mock.calls.length
    await vi.advanceTimersByTimeAsync(POLL_MS * 2)
    expect(apStations).toHaveBeenCalledTimes(calls)
    await vi.advanceTimersByTimeAsync(MISSING_POLL_MS)
    expect(apStations).toHaveBeenCalledTimes(calls + 1)
    stop()
  })

  it('keeps the last answer through a transient failure', async () => {
    apStations.mockResolvedValueOnce({ data: { up: true, count: 3, auto_off_at: null } })
    await pollHotspotOnce()
    apStations.mockRejectedValueOnce(new Error('timeout'))
    await pollHotspotOnce()
    expect(hotspotState.stations?.count).toBe(3)
  })

  it('clears the count after 3 failures in a row, not before', async () => {
    apStations.mockResolvedValueOnce({ data: { up: true, count: 3, auto_off_at: null } })
    await pollHotspotOnce()
    apStations.mockRejectedValue(new Error('503'))
    for (let i = 1; i < MAX_FAILURES; i++) {
      await pollHotspotOnce()
      expect(hotspotState.stations?.count).toBe(3)
    }
    await pollHotspotOnce()
    expect(hotspotState.stations).toBeNull()
  })

  it('a success resets the failure count', async () => {
    apStations.mockResolvedValue({ data: { up: true, count: 3, auto_off_at: null } })
    await pollHotspotOnce()
    apStations.mockRejectedValue(new Error('503'))
    await pollHotspotOnce()
    await pollHotspotOnce()
    apStations.mockResolvedValue({ data: { up: true, count: 4, auto_off_at: null } })
    await pollHotspotOnce()
    apStations.mockRejectedValue(new Error('503'))
    await pollHotspotOnce()
    await pollHotspotOnce()
    expect(hotspotState.stations?.count).toBe(4)
  })

  it('a disconnect clears the count and stops polling; reconnecting asks again at once', async () => {
    apStations.mockResolvedValue({ data: { up: true, count: 2, auto_off_at: null } })
    const stop = startHotspotPoll()
    await vi.advanceTimersByTimeAsync(0)
    expect(hotspotState.stations?.count).toBe(2)
    line.connected = false
    lineChanged()
    expect(hotspotState.stations).toBeNull()
    const calls = apStations.mock.calls.length
    await vi.advanceTimersByTimeAsync(POLL_MS * 5)
    expect(apStations).toHaveBeenCalledTimes(calls)
    line.connected = true
    lineChanged()
    await vi.advanceTimersByTimeAsync(0)
    expect(apStations).toHaveBeenCalledTimes(calls + 1)
    expect(hotspotState.stations?.count).toBe(2)
    stop()
  })

  it('does not ask at all while disconnected', async () => {
    line.connected = false
    const stop = startHotspotPoll()
    await vi.advanceTimersByTimeAsync(POLL_MS * 3)
    expect(apStations).not.toHaveBeenCalled()
    stop()
  })

  it('a printer switch clears the old count at once and asks the new printer immediately', async () => {
    apStations.mockResolvedValueOnce({ data: { up: true, count: 5, auto_off_at: null } })
    const stop = startHotspotPoll()
    await vi.advanceTimersByTimeAsync(0)
    expect(hotspotState.stations?.count).toBe(5)
    let answer: (v: unknown) => void = () => {}
    apStations.mockReturnValueOnce(new Promise(resolve => { answer = resolve }))
    line.apiUrl = 'http://walnut.local'
    lineChanged()
    expect(hotspotState.stations).toBeNull()
    expect(apStations).toHaveBeenCalledTimes(2)
    answer({ data: { up: true, count: 1, auto_off_at: null } })
    await vi.advanceTimersByTimeAsync(0)
    expect(hotspotState.stations?.count).toBe(1)
    stop()
  })

  it('two callers share one timer, and cleanup waits for both', async () => {
    apStations.mockResolvedValue({ data: { up: true, count: 1, auto_off_at: null } })
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const stopA = startHotspotPoll()
    const stopB = startHotspotPoll()
    await vi.advanceTimersByTimeAsync(0)
    expect(apStations).toHaveBeenCalledTimes(1)
    expect(line.listeners).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(POLL_MS)
    expect(apStations).toHaveBeenCalledTimes(2)
    stopA()
    stopA() // stopping twice must not release B's hold
    expect(removeSpy.mock.calls.filter(c => c[0] === 'visibilitychange')).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(POLL_MS)
    expect(apStations).toHaveBeenCalledTimes(3)
    stopB()
    expect(removeSpy.mock.calls.filter(c => c[0] === 'visibilitychange')).toHaveLength(1)
    expect(line.listeners).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(POLL_MS * 3)
    expect(apStations).toHaveBeenCalledTimes(3)
    removeSpy.mockRestore()
  })
})
