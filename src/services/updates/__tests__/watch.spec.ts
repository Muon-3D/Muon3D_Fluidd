import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installStarted, printerLost, stopWatching, updateWatch, watchUpdates } from '../watch'
import { bannerVisible, offlineScreen } from '../model'
import { BOXWOOD_STAGED } from './fixtures/boxwood-staged'

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
    // Once more shortly after the reconnect (identity may not be ready), then never.
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('asks once more after a reconnect when the first answer is a refusal, and goes on if that one is let through', async () => {
    const get = vi.fn()
      .mockImplementationOnce(refused)
      .mockImplementation(idle)
    watchUpdates('boxwood', get)
    await settle()
    expect(get).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(get).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(get).toHaveBeenCalledTimes(3)
  })

  it('treats a 401 as a refusal too', async () => {
    const get = vi.fn(() => Promise.resolve({ status: 401, data: {} }))
    watchUpdates('boxwood', get)
    await settle()
    await vi.advanceTimersByTimeAsync(5 * 60_000)
    expect(get).toHaveBeenCalledTimes(2)
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

  const stored = (over: Record<string, unknown>) => JSON.stringify({
    jobId: null, phase: 'verifying', from: null, to: '1.1', progress: null, seenAt: Date.now(), lostAt: null, budgetMs: 1_200_000, ...over
  })

  it('keeps an old entry on load, hides the bar until the printer has answered, and drops it once nothing says it is under way', async () => {
    const key = 'muon3d.update.boxwood'
    localStorage.setItem(key, stored({ seenAt: Date.now() - 3 * 3_600_000 }))
    watchUpdates('boxwood', vi.fn(idle))
    // Kept (a finished install must still be heard of), but nothing shows before the printer answers.
    expect(updateWatch.remembered?.phase).toBe('verifying')
    expect(bannerVisible(updateWatch.remembered, Date.now(), updateWatch.answered)).toBe(false)
    await settle()
    expect(updateWatch.answered).toBe(true)
    // Past its time, so still no bar; the first quiet answers are within the grace of the reconnect.
    expect(bannerVisible(updateWatch.remembered, Date.now(), updateWatch.answered)).toBe(false)
    await vi.advanceTimersByTimeAsync(61_000)
    expect(updateWatch.remembered).toBeNull()
    expect(localStorage.getItem(key)).toBeNull()
  })

  it('tells a tab that was discarded mid-install how it ended: updated, even long after its time', async () => {
    const key = 'muon3d.update.boxwood'
    localStorage.setItem(key, stored({ phase: 'rebooting', from: '1.0', to: '1.1', jobId: 'j1', seenAt: Date.now() - 3 * 3_600_000 }))
    const done = () => Promise.resolve({ status: 200, data: { result: { state: 'idle', current_version: '1.1', session: null } } })
    watchUpdates('boxwood', vi.fn(done))
    await settle()
    expect(updateWatch.remembered?.phase).toBe('updated')
  })

  it('tells it a rollback too', async () => {
    localStorage.setItem('muon3d.update.boxwood', stored({ phase: 'rebooting', from: '1.0', to: '1.1', jobId: 'j1', seenAt: Date.now() - 3 * 3_600_000 }))
    const back = () => Promise.resolve({ status: 200, data: { result: { state: 'idle', current_version: '1.0', session: null } } })
    watchUpdates('boxwood', vi.fn(back))
    await settle()
    expect(updateWatch.remembered?.phase).toBe('rolled_back')
  })

  it('clears an install the printer does not report once the grace has passed, and a reload does not restore it', async () => {
    const key = 'muon3d.update.boxwood'
    localStorage.setItem(key, stored({ seenAt: Date.now() - 60_000 }))
    watchUpdates('boxwood', vi.fn(idle))
    expect(updateWatch.remembered?.phase).toBe('verifying')
    await settle()
    // The reconnect starts a grace: the first quiet answer is not believed yet.
    expect(updateWatch.remembered?.phase).toBe('verifying')
    await vi.advanceTimersByTimeAsync(40_000)
    expect(updateWatch.remembered).toBeNull()
    expect(localStorage.getItem(key)).toBeNull()
    updateWatch.printer = ''
    watchUpdates('boxwood', vi.fn(idle))
    expect(updateWatch.remembered).toBeNull()
  })

  it('does not show the restart screen or bar for an old entry before a poll has answered in this page', () => {
    localStorage.setItem('muon3d.update.boxwood', stored({ phase: 'rebooting', from: '1.0', jobId: 'j1', seenAt: Date.now() - 60_000 }))
    watchUpdates('boxwood', () => new Promise(() => undefined))
    expect(updateWatch.answered).toBe(false)
    expect(bannerVisible(updateWatch.remembered, Date.now(), updateWatch.answered)).toBe(false)
  })

  it('with the real staged status (Boxwood), remembers nothing and shows nothing', async () => {
    const real = () => Promise.resolve({ status: 200, data: { result: BOXWOOD_STAGED } })
    watchUpdates('boxwood', vi.fn(real))
    await settle()
    expect(updateWatch.remembered).toBeNull()
    expect(bannerVisible(updateWatch.remembered, Date.now(), updateWatch.answered)).toBe(false)
  })

  it('with the real status and the top-level state left at commit_pending, still shows no bar', async () => {
    const real = () => Promise.resolve({ status: 200, data: { result: { ...BOXWOOD_STAGED, state: 'commit_pending' } } })
    watchUpdates('boxwood', vi.fn(real))
    await settle()
    expect(updateWatch.remembered).toBeNull()
  })

  it('a stale active entry that the route refuses twice shows nothing and is not held for ever', async () => {
    const key = 'muon3d.update.boxwood'
    localStorage.setItem(key, JSON.stringify({ jobId: 'j1', phase: 'installing', from: '1.0', to: '1.1', progress: 40, seenAt: Date.now() - 3 * 3_600_000, lostAt: Date.now() - 3 * 3_600_000, budgetMs: 1_200_000 }))
    const get = vi.fn(refused)
    watchUpdates('boxwood', get)
    await settle()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(get).toHaveBeenCalledTimes(2)
    // Refused: never confirmed, so no bar and no restart screen; and past its time it is dropped.
    expect(updateWatch.answered).toBe(false)
    expect(bannerVisible(updateWatch.remembered, Date.now(), updateWatch.answered)).toBe(false)
    expect(updateWatch.remembered).toBeNull()
    expect(localStorage.getItem(key)).toBeNull()
  })

  it('a stale entry does not become "lost" when the socket drops, so no "Restart delayed"', async () => {
    localStorage.setItem('muon3d.update.boxwood', JSON.stringify({ jobId: 'j1', phase: 'installing', from: '1.0', to: '1.1', progress: 40, seenAt: Date.now() - 3 * 3_600_000, lostAt: Date.now() - 3 * 3_600_000, budgetMs: 1_200_000 }))
    watchUpdates('boxwood', vi.fn(refused))
    await settle()
    printerLost()
    expect(updateWatch.remembered?.lostAt ?? null).toBeNull()
    expect(offlineScreen(updateWatch.remembered, Date.now(), updateWatch.answered)).toBeNull()
  })

  it('an install the printer confirmed does go "lost" when the socket drops, and shows the restart screen', async () => {
    const installing = () => Promise.resolve({ status: 200, data: { result: { state: 'installing', current_version: '1.0', target_version: '1.1', progress: 40, install: { phase: 'installing', job_id: 'j1' } } } })
    watchUpdates('boxwood', vi.fn(installing))
    await settle()
    expect(bannerVisible(updateWatch.remembered, Date.now(), updateWatch.answered)).toBe(true)
    printerLost()
    expect(offlineScreen(updateWatch.remembered, Date.now(), updateWatch.answered)).toBe('updating')
  })

  it('press, reboot, the reconnect refused twice: the bar clears (it is not believed, then it runs out) and does not stay up', async () => {
    const installing = () => Promise.resolve({ status: 200, data: { result: { state: 'installing', current_version: '1.0', target_version: '1.1', progress: 40, install: { phase: 'installing', job_id: 'j1' } } } })
    watchUpdates('boxwood', vi.fn(installing))
    await settle()
    expect(bannerVisible(updateWatch.remembered, Date.now(), updateWatch.answered)).toBe(true)
    // The printer reboots; Fluidd reconnects and is refused, twice.
    printerLost()
    const get = vi.fn(refused)
    watchUpdates('boxwood', get)
    await settle()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(get).toHaveBeenCalledTimes(2)
    expect(updateWatch.answered).toBe(false)
    expect(bannerVisible(updateWatch.remembered, Date.now(), updateWatch.answered)).toBe(false)
    // No requests are made, but time goes on: the entry runs out and is dropped.
    await vi.advanceTimersByTimeAsync(21 * 60_000)
    expect(get).toHaveBeenCalledTimes(2)
    expect(updateWatch.remembered).toBeNull()
  })

  it('keeps time moving while an install is remembered and the route is refused', async () => {
    localStorage.setItem('muon3d.update.boxwood', JSON.stringify({ jobId: 'j1', phase: 'installing', from: '1.0', to: '1.1', progress: 40, seenAt: Date.now(), lostAt: null, budgetMs: 600_000 }))
    watchUpdates('boxwood', vi.fn(refused))
    await settle()
    await vi.advanceTimersByTimeAsync(10_000)
    const before = updateWatch.now
    await vi.advanceTimersByTimeAsync(30_000)
    expect(updateWatch.now).toBeGreaterThan(before)
  })

  it('records the job the printer held at the press, so a different one is this install', async () => {
    const old = () => Promise.resolve({ status: 200, data: { result: { state: 'idle', current_version: '1.0', target_version: '1.1', install: { phase: 'failed', job_id: 'old', started_at: '2026-11-02T12:00:00Z' } } } })
    watchUpdates('boxwood', vi.fn(old))
    await settle()
    installStarted('1.0', '1.1')
    expect(updateWatch.remembered?.startedJobId).toBe('old')
  })
})
