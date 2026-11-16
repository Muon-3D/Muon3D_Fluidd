import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const painted = vi.hoisted(() => vi.fn())
vi.mock('@/services/startup/idle', () => ({ appPainted: painted }))

describe('liveStageMayMount', () => {
  beforeEach(() => {
    vi.resetModules()
    painted.mockResolvedValue(undefined)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] })
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  const settled = (p: Promise<unknown>) => {
    let done = false
    p.then(() => { done = true })
    return () => done
  }

  it('waits for Overview paint before starting its maximum-wait deadline', async () => {
    let paint!: () => void
    painted.mockReturnValueOnce(new Promise<void>(resolve => { paint = resolve }))
    const { liveStageMayMount, QUIET_INPUT_MS } = await import('../stage-mount')
    const done = settled(liveStageMayMount())
    await vi.advanceTimersByTimeAsync(20_000)
    expect(done()).toBe(false)
    window.dispatchEvent(new Event('pointerdown'))
    paint()
    await vi.advanceTimersByTimeAsync(200)
    expect(done()).toBe(false)
    await vi.advanceTimersByTimeAsync(QUIET_INPUT_MS)
    expect(done()).toBe(true)
  })

  it('waits for the browser idle callback even after input is quiet', async () => {
    const idle = vi.fn()
    vi.stubGlobal('requestIdleCallback', idle)
    const { liveStageMayMount } = await import('../stage-mount')
    const done = settled(liveStageMayMount())
    await vi.advanceTimersByTimeAsync(2000)
    expect(done()).toBe(false)
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 })
    idle.mock.calls[0][0]()
    await Promise.resolve()
    await Promise.resolve()
    expect(done()).toBe(true)
  })

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
    const pending = liveStageMayMount()
    const done = settled(pending)
    for (let t = 0; t < MAX_WAIT_MS - 500; t += 500) {
      window.dispatchEvent(new Event('keydown'))
      await vi.advanceTimersByTimeAsync(500)
      expect(done()).toBe(false)
    }
    await vi.advanceTimersByTimeAsync(1000)
    expect(done()).toBe(true)
    const rechecked = settled(liveStageMayMount(await pending))
    await vi.advanceTimersByTimeAsync(0)
    expect(rechecked()).toBe(true)
  })
})
