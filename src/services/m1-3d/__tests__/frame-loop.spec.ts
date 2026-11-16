import { describe, expect, it, vi } from 'vitest'
import { createFrameLoop } from '../frame-loop'

type Callback = (now: number) => void

function clock () {
  const queue = new Map<number, Callback>()
  let next = 1
  return {
    request: (fn: (now: number) => void) => { queue.set(next, fn); return next++ },
    cancel: (id: number) => { queue.delete(id) },
    run: () => { const all = [...queue.values()]; queue.clear(); all.forEach(fn => fn(16)) },
    size: () => queue.size
  }
}

describe('the 3D view\'s frame loop', () => {
  it('asks for one frame at a time', () => {
    const c = clock()
    const draw = vi.fn()
    const loop = createFrameLoop(draw, c)
    loop.invalidate(); loop.invalidate()
    expect(c.size()).toBe(1)
    c.run()
    expect(draw).toHaveBeenCalledTimes(1)
  })

  it('draws nothing while hidden and cancels the frame in flight', () => {
    const c = clock()
    const draw = vi.fn()
    const loop = createFrameLoop(draw, c)
    loop.invalidate()
    loop.setOpen(false)
    expect(c.size()).toBe(0)
    c.run()
    loop.invalidate()
    loop.invalidate()
    expect(c.size()).toBe(0)
    expect(draw).not.toHaveBeenCalled()
  })

  it('draws again, once, when the view shows again', () => {
    const c = clock()
    const draw = vi.fn()
    const loop = createFrameLoop(draw, c)
    loop.setOpen(false)
    loop.setOpen(true)
    expect(c.size()).toBe(1)
    c.run()
    expect(draw).toHaveBeenCalledTimes(1)
  })

  it('draws nothing from a callback that was already running when the gate shut', () => {
    const draw = vi.fn()
    let late: ((n: number) => void) | null = null
    const loop = createFrameLoop(draw, { request: fn => { late = fn; return 1 }, cancel: () => undefined })
    loop.invalidate()
    loop.setOpen(false)
    late!(16)
    expect(draw).not.toHaveBeenCalled()
  })

  it('stops for good when disposed', () => {
    const c = clock()
    const draw = vi.fn()
    const loop = createFrameLoop(draw, c)
    loop.invalidate()
    loop.stop()
    loop.setOpen(true)
    loop.invalidate()
    expect(c.size()).toBe(0)
    expect(draw).not.toHaveBeenCalled()
  })
})
