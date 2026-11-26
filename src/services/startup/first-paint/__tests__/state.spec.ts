import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The view's chunk never arrives.
vi.mock('../view', () => new Promise(() => {}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetModules()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('starting first paint', () => {
  it('holds the loader, and lets it go on its own if the view never loads', async () => {
    const { firstPaintState, startFirstPaint } = await import('../state')
    startFirstPaint()
    expect(firstPaintState.holding).toBe(true)
    vi.advanceTimersByTime(19_000)
    expect(firstPaintState.holding).toBe(true)
    vi.advanceTimersByTime(1500)
    expect(firstPaintState.holding).toBe(false)
  })
})
