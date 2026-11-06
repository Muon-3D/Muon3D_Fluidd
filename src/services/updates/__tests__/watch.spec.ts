import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installStarted, stopWatching, updateWatch, watchUpdates } from '../watch'

const refused = () => Promise.resolve({ status: 403, data: { error: { message: 'Forbidden by policy' } } })
const idle = () => Promise.resolve({ status: 200, data: { result: { phase: 'idle', session: null } } })

/** Lets the poll's awaited request settle. */
const settle = () => vi.advanceTimersByTimeAsync(0)

describe('updateWatch polling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    updateWatch.printer = ''
  })

  afterEach(() => {
    stopWatching()
    vi.useRealTimers()
  })

  it('asks again a minute later when the printer answers', async () => {
    const get = vi.fn(idle)
    watchUpdates('boxwood', get)
    await settle()
    expect(get).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('stops asking once the session is refused the route, even mid-install', async () => {
    // An install remembered from an earlier visit would otherwise poll every 5 s.
    localStorage.setItem('muon3d.update.boxwood', JSON.stringify({
      jobId: 'j1', phase: 'installing', from: '1.0', to: '1.1', progress: 40, seenAt: Date.now(), lostAt: null, budgetMs: 600_000
    }))
    const get = vi.fn(refused)
    watchUpdates('boxwood', get)
    await settle()
    expect(get).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10 * 60_000)
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('treats a 401 as a refusal too', async () => {
    const get = vi.fn(() => Promise.resolve({ status: 401, data: {} }))
    watchUpdates('boxwood', get)
    await settle()
    await vi.advanceTimersByTimeAsync(5 * 60_000)
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('keeps asking after a failure that is not a refusal', async () => {
    const get = vi.fn(() => Promise.reject(new Error('network')))
    watchUpdates('boxwood', get)
    await settle()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('tries again when it is started afresh (a reconnect or another printer)', async () => {
    const get = vi.fn(refused)
    watchUpdates('boxwood', get)
    await settle()
    watchUpdates('boxwood', get)
    await settle()
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('asks once when an install is started, even after a refusal', async () => {
    const get = vi.fn(refused)
    watchUpdates('boxwood', get)
    await settle()
    installStarted('1.0', '1.1')
    await settle()
    expect(get).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(get).toHaveBeenCalledTimes(2)
  })
})
