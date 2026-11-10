import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/startup/idle', () => ({ appPainted: () => Promise.resolve() }))

describe('liveStageMayMount', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] })
  })
  afterEach(() => vi.useRealTimers())

  const settled = (p: Promise<void>) => {
    let done = false
    p.then(() => { done = true })
    return () => done
  }

  it('waits while the person is using the page, then mounts once it is quiet', async () => {
    const { liveStageMayMount, QUIET_INPUT_MS } = await import('../stage-mount')
    window.dispatchEvent(new Event('pointerdown'))
    const done = settled(liveStageMayMount())
    await vi.advanceTimersByTimeAsync(QUIET_INPUT_MS / 2)
    expect(done()).toBe(false)
    await vi.advanceTimersByTimeAsync(QUIET_INPUT_MS)
    expect(done()).toBe(true)
  })

  it('gives the Overview a quiet stretch from the ask, even with no input at all', async () => {
    const { liveStageMayMount, QUIET_INPUT_MS } = await import('../stage-mount')
    await vi.advanceTimersByTimeAsync(5000)
    const done = settled(liveStageMayMount())
    await vi.advanceTimersByTimeAsync(QUIET_INPUT_MS - 100)
    expect(done()).toBe(false)
    await vi.advanceTimersByTimeAsync(300)
    expect(done()).toBe(true)
  })

  it('mounts after MAX_WAIT_MS even while the person keeps using the page', async () => {
    const { liveStageMayMount, MAX_WAIT_MS } = await import('../stage-mount')
    const done = settled(liveStageMayMount())
    for (let t = 0; t < MAX_WAIT_MS - 500; t += 500) {
      window.dispatchEvent(new Event('keydown'))
      await vi.advanceTimersByTimeAsync(500)
      expect(done()).toBe(false)
    }
    await vi.advanceTimersByTimeAsync(1000)
    expect(done()).toBe(true)
  })
})
