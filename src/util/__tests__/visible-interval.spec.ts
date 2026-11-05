import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { visibleInterval } from '../visible-interval'

let state: DocumentVisibilityState = 'visible'
beforeEach(() => {
  vi.useFakeTimers()
  state = 'visible'
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => state)
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function setVisibility (next: DocumentVisibilityState) {
  state = next
  document.dispatchEvent(new Event('visibilitychange'))
}

it('runs on its interval while the tab is visible', () => {
  const fn = vi.fn()
  const stop = visibleInterval(fn, 1000)
  vi.advanceTimersByTime(3500)
  expect(fn).toHaveBeenCalledTimes(3)
  stop()
})

it('skips its turns while the tab is hidden, and catches up once when it is shown', () => {
  const fn = vi.fn()
  const stop = visibleInterval(fn, 1000)
  setVisibility('hidden')
  vi.advanceTimersByTime(60_000)
  expect(fn).not.toHaveBeenCalled()
  setVisibility('visible')
  expect(fn).toHaveBeenCalledTimes(1)
  stop()
})

it('does not catch up on showing a tab it never skipped', () => {
  const fn = vi.fn()
  const stop = visibleInterval(fn, 10_000)
  setVisibility('hidden')
  setVisibility('visible')
  expect(fn).not.toHaveBeenCalled()
  stop()
})

it('stops for good', () => {
  const fn = vi.fn()
  const stop = visibleInterval(fn, 1000)
  stop()
  vi.advanceTimersByTime(5000)
  setVisibility('hidden')
  setVisibility('visible')
  expect(fn).not.toHaveBeenCalled()
})
