import { describe, expect, it, vi } from 'vitest'
import { applyUpdateWhenIdle, refreshServiceWorker } from '../service-worker-update'

function worker (initial: ServiceWorkerState) {
  const events = new EventTarget()
  return Object.assign(events, {
    state: initial,
    postMessage: vi.fn(),
    change (state: ServiceWorkerState) {
      this.state = state
      events.dispatchEvent(new Event('statechange'))
    }
  })
}

describe('refreshServiceWorker', () => {
  it('checks for a new worker and waits for the waiting worker to activate', async () => {
    const waiting = worker('installed')
    const registration = { update: vi.fn(async () => {}), waiting, installing: null }
    const container = { getRegistration: vi.fn(async () => registration) }
    let finished = false
    const recovery = refreshServiceWorker(container as any).then(() => { finished = true })
    await new Promise(resolve => setTimeout(resolve))
    expect(registration.update).toHaveBeenCalledTimes(1)
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    expect(finished).toBe(false)
    waiting.change('activated')
    await recovery
    expect(finished).toBe(true)
  })

  it('lets an update finish installing before requesting activation', async () => {
    const installing = worker('installing')
    const container = { getRegistration: async () => ({ update: async () => {}, waiting: null, installing }) }
    const recovery = refreshServiceWorker(container as any)
    await new Promise(resolve => setTimeout(resolve))
    expect(installing.postMessage).not.toHaveBeenCalled()
    installing.change('installed')
    expect(installing.postMessage).toHaveBeenCalledTimes(1)
    installing.change('activated')
    await recovery
  })

  it('bounds recovery when the update check never resolves', async () => {
    vi.useFakeTimers()
    try {
      const container = { getRegistration: async () => ({ update: () => new Promise(() => {}) }) }
      const recovery = refreshServiceWorker(container as any, 5000)
      await vi.advanceTimersByTimeAsync(5000)
      await expect(recovery).resolves.toBeUndefined()
    } finally { vi.useRealTimers() }
  })

  it('supports browsers without a registered worker', async () => {
    await expect(refreshServiceWorker({ getRegistration: async () => undefined } as any)).resolves.toBeUndefined()
    await expect(refreshServiceWorker(null)).resolves.toBeUndefined()
  })
})

describe('applyUpdateWhenIdle (KAN-1279)', () => {
  it('applies at once when no printer action is in flight', () => {
    const apply = vi.fn()
    const r = applyUpdateWhenIdle(() => false, apply)
    expect(r.immediate).toBe(true)
    expect(apply).toHaveBeenCalledOnce()
  })

  it('waits for a running action, then applies once', () => {
    vi.useFakeTimers()
    try {
      let busy = true
      const apply = vi.fn()
      const r = applyUpdateWhenIdle(() => busy, apply, 100)
      expect(r.immediate).toBe(false)
      vi.advanceTimersByTime(500)
      expect(apply).not.toHaveBeenCalled()
      busy = false
      vi.advanceTimersByTime(500)
      expect(apply).toHaveBeenCalledOnce()
    } finally { vi.useRealTimers() }
  })

  it('does not apply after being cancelled', () => {
    vi.useFakeTimers()
    try {
      const apply = vi.fn()
      applyUpdateWhenIdle(() => true, apply, 100).cancel()
      vi.advanceTimersByTime(1000)
      expect(apply).not.toHaveBeenCalled()
    } finally { vi.useRealTimers() }
  })
})
