import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hotspotState } from '../model'
import { MISSING_POLL_MS, POLL_MS, pollHotspotOnce, startHotspotPoll } from '../poller'

const apStations = vi.fn()
vi.mock('@/aux_api/useAuxApi', () => ({
  useAuxApi: () => ({ apStations })
}))
vi.mock('@/store', () => ({ default: { state: { config: { apiUrl: 'http://boxwood.local' } } } }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { activePrinterId: null } }))

const hidden = (value: boolean) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value ? 'hidden' : 'visible' })
  document.dispatchEvent(new Event('visibilitychange'))
}

beforeEach(() => {
  vi.useFakeTimers()
  apStations.mockReset()
  hotspotState.stations = null
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
})
