import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DragFollow, controlDragHost, dragStepMm, stepToward, type DragTarget } from '../drag-follow'

/** A host whose move lands when the test says so, refusing what the test says. */
function host () {
  const h = {
    sent: [] as DragTarget[],
    inFlight: false,
    refuse: ((): string => '') as (t: DragTarget) => string,
    land () { h.inFlight = false }
  }
  return {
    h,
    api: {
      refusal: (t: DragTarget) => h.refuse(t),
      waiting: () => h.inFlight,
      send: (t: DragTarget) => { h.sent.push(t); h.inFlight = true; return true }
    }
  }
}

describe('DragFollow', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(0) })
  afterEach(() => { vi.useRealTimers() })

  it('sends the first target at once, then holds one in flight and coalesces to the latest', () => {
    const { h, api } = host()
    const f = new DragFollow(api)
    f.start({ X: 10, Y: 10 })
    expect(h.sent).toEqual([{ X: 10, Y: 10 }])
    for (let i = 11; i <= 30; i++) f.update({ X: i, Y: 10 })
    vi.advanceTimersByTime(1000)
    // Still in flight: nothing more, however many updates.
    expect(h.sent).toHaveLength(1)
    h.land()
    vi.advanceTimersByTime(60)
    // Only the newest target, never the ones in between.
    expect(h.sent).toEqual([{ X: 10, Y: 10 }, { X: 30, Y: 10 }])
  })

  it('caps the rate even when every move lands at once', () => {
    const { h, api } = host()
    api.send = (t: DragTarget) => { h.sent.push(t); return true } // never in flight
    const f = new DragFollow(api, { minIntervalMs: 150 })
    f.start({ X: 0, Y: 0 })
    for (let t = 1; t <= 100; t++) {
      vi.advanceTimersByTime(10) // one pointer move every 10 ms for a second
      f.update({ X: t, Y: 0 })
    }
    vi.advanceTimersByTime(200)
    // A second at no more than one per 150 ms: at most 8, and the final point sent.
    expect(h.sent.length).toBeLessThanOrEqual(8)
    expect(h.sent.length).toBeGreaterThanOrEqual(6)
    expect(h.sent[h.sent.length - 1]).toEqual({ X: 100, Y: 0 })
  })

  it('stops on a refusal, says why once, and sends nothing after, not even a later good point', () => {
    const { h, api } = host()
    const refused = vi.fn()
    const f = new DragFollow(api, { onRefused: refused })
    f.start({ X: 50, Y: 50 })
    h.land()
    h.refuse = t => ('Y' in t && t.Y < 20 ? 'That spot is over the bed notch.' : '')
    vi.advanceTimersByTime(200)
    f.update({ X: 100, Y: 10 })
    expect(refused).toHaveBeenCalledWith('That spot is over the bed notch.')
    expect(f.following).toBe(false)
    f.update({ X: 150, Y: 80 })
    f.release()
    vi.advanceTimersByTime(1000)
    expect(h.sent).toEqual([{ X: 50, Y: 50 }])
    expect(refused).toHaveBeenCalledTimes(1)
  })

  it('a send the host does not make stops following too', () => {
    const { h, api } = host()
    api.send = () => false
    const refused = vi.fn()
    const f = new DragFollow(api, { onRefused: refused })
    f.start({ Z: 5 })
    expect(refused).toHaveBeenCalledWith('The move was not sent.')
    expect(f.following).toBe(false)
    expect(h.sent).toEqual([])
  })

  it('on release sends the final target once, after the move in flight lands', () => {
    const { h, api } = host()
    const f = new DragFollow(api)
    f.start({ X: 1, Y: 1 })
    f.update({ X: 5, Y: 5 })
    f.release()
    expect(h.sent).toHaveLength(1)
    h.land()
    vi.advanceTimersByTime(200)
    expect(h.sent).toEqual([{ X: 1, Y: 1 }, { X: 5, Y: 5 }])
    expect(f.following).toBe(false)
    h.land()
    vi.advanceTimersByTime(1000)
    expect(h.sent).toHaveLength(2)
  })

  it('on release sends nothing more when the last target was already sent', () => {
    const { h, api } = host()
    const f = new DragFollow(api)
    f.start({ X: 1, Y: 1 })
    f.release()
    vi.advanceTimersByTime(1000)
    expect(h.sent).toEqual([{ X: 1, Y: 1 }])
    expect(f.following).toBe(false)
  })

  it('cancel stops at once: the target waiting for the move in flight is never sent', () => {
    const { h, api } = host()
    const f = new DragFollow(api)
    f.start({ X: 1, Y: 1 })
    f.update({ X: 9, Y: 9 })
    f.cancel()
    h.land()
    vi.advanceTimersByTime(1000)
    f.update({ X: 20, Y: 20 })
    f.release()
    vi.advanceTimersByTime(1000)
    expect(h.sent).toEqual([{ X: 1, Y: 1 }])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('a second start while following is the same drag, not a second sender', () => {
    const { h, api } = host()
    const f = new DragFollow(api)
    f.start({ X: 1, Y: 1 })
    f.start({ X: 2, Y: 2 })
    f.start({ X: 3, Y: 3 })
    h.land()
    vi.advanceTimersByTime(200)
    expect(h.sent).toEqual([{ X: 1, Y: 1 }, { X: 3, Y: 3 }])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('controlDragHost uses the mixin\'s refusal, wait and moveTo', () => {
    const vm = { moveRefusal: vi.fn(() => 'no'), handMoveWait: vi.fn(() => 'Wait'), moveTo: vi.fn(() => true) }
    const api = controlDragHost(vm)
    expect(api.refusal({ X: 1, Y: 2 })).toBe('no')
    expect(api.waiting()).toBe(true)
    expect(api.send({ Z: 3 })).toBe(true)
    expect(vm.moveTo).toHaveBeenCalledWith({ Z: 3 })
  })

  it('sends short steps: each at most maxStep from the last, the first from where the part is', () => {
    const { h, api } = host()
    const f = new DragFollow({ ...api, from: () => ({ Z: 10 }) }, { maxStep: () => 3 })
    f.start({ Z: 30 })
    expect(h.sent).toEqual([{ Z: 13 }])
    for (let i = 0; i < 6; i++) { h.land(); vi.advanceTimersByTime(200) }
    expect(h.sent.map(t => (t as { Z: number }).Z)).toEqual([13, 16, 19, 22, 25, 28, 30])
  })

  it('a reversal drops the target the other way: the next step after the one in flight goes back', () => {
    const { h, api } = host()
    const f = new DragFollow({ ...api, from: () => ({ Z: 10 }) }, { maxStep: () => 2 })
    f.start({ Z: 40 })
    f.update({ Z: 50 })
    f.update({ Z: 0 })
    h.land()
    vi.advanceTimersByTime(200)
    expect(h.sent).toEqual([{ Z: 12 }, { Z: 10 }])
  })

  it('on release goes on in short steps to the final target, then stops', () => {
    const { h, api } = host()
    const f = new DragFollow({ ...api, from: () => ({ X: 0, Y: 0 }) }, { maxStep: () => 3 })
    f.start({ X: 6, Y: 8 })
    f.release()
    for (let i = 0; i < 6; i++) { h.land(); vi.advanceTimersByTime(200) }
    expect(h.sent).toEqual([{ X: 1.8, Y: 2.4 }, { X: 3.6, Y: 4.8 }, { X: 5.4, Y: 7.2 }, { X: 6, Y: 8 }])
    expect(f.following).toBe(false)
  })

  it('a step is checked by the planner before it is sent, and a refusal stops the drag', () => {
    const { h, api } = host()
    h.refuse = t => 'Z' in t && t.Z < 9 ? 'Too low over the notch' : ''
    const reasons: string[] = []
    const f = new DragFollow({ ...api, from: () => ({ Z: 10 }) }, { maxStep: () => 1, onRefused: r => reasons.push(r) })
    f.start({ Z: 0 })
    h.land()
    vi.advanceTimersByTime(200)
    expect(h.sent).toEqual([{ Z: 9 }])
    expect(reasons).toEqual(['Too low over the notch'])
    expect(f.following).toBe(false)
  })

  it('step size: about 150 ms of travel, between 0.5 and 3 mm', () => {
    expect(dragStepMm(10)).toBe(1.5)
    expect(dragStepMm(100)).toBe(3)
    expect(dragStepMm(1)).toBe(0.5)
    expect(dragStepMm(NaN)).toBe(0.5)
    expect(stepToward({ Z: 5 }, { Z: 4 }, 3)).toEqual({ Z: 4 })
    expect(stepToward(null, { Z: 40 }, 3)).toEqual({ Z: 40 })
  })
})
