import { describe, expect, it, vi } from 'vitest'
import { PositionPredictor, PredictionLoop } from '../position-predict'

const close = (a: number[] | null, b: number[], d = 1e-6) => {
  expect(a).not.toBeNull()
  a!.forEach((v, i) => expect(Math.abs(v - b[i])).toBeLessThan(d))
}

describe('PositionPredictor', () => {
  it('draws the first report as it is', () => {
    const p = new PositionPredictor()
    expect(p.at(0)).toBeNull()
    p.report({ position: [10, 20, 5], at: 1000 })
    close(p.at(1000), [10, 20, 5])
    close(p.at(5000), [10, 20, 5])
    expect(p.settled(1000)).toBe(true)
  })

  it('extrapolates toward the commanded target at the reported speed', () => {
    const p = new PositionPredictor({ easeMs: 1 })
    p.report({ position: [0, 0, 0], velocity: 100, target: [100, 0, 0], at: 0 })
    // 100 mm/s for 200 ms is 20 mm along X.
    close(p.predicted(200), [20, 0, 0])
    close(p.at(200), [20, 0, 0], 1e-3)
    expect(p.settled(200)).toBe(false)
  })

  it('never passes a known target, however long since the report', () => {
    const p = new PositionPredictor({ easeMs: 1 })
    p.report({ position: [0, 0, 0], velocity: 300, target: [30, 40, 0], at: 0 })
    close(p.at(10_000), [30, 40, 0], 1e-3)
    for (let t = 0; t <= 2000; t += 16) {
      const at = p.at(t)!
      expect(Math.hypot(at[0], at[1])).toBeLessThanOrEqual(50 + 1e-9)
    }
    expect(p.settled(10_000)).toBe(true)
  })

  it('eases into a new report from where the drawing was, without jumping', () => {
    const p = new PositionPredictor({ easeMs: 100 })
    p.report({ position: [0, 0, 0], at: 0 })
    p.report({ position: [10, 0, 0], at: 1000 })
    // Right at the report the drawing is still where it was.
    close(p.at(1000), [0, 0, 0])
    const mid = p.at(1100)![0]
    expect(mid).toBeGreaterThan(5)
    expect(mid).toBeLessThan(10)
    close(p.at(2000), [10, 0, 0], 1e-3)
  })

  it('eases between the drawing and a target without ever leaving the segment to it', () => {
    const p = new PositionPredictor({ easeMs: 80 })
    p.report({ position: [0, 0, 0], velocity: 50, target: [50, 0, 0], at: 0 })
    p.report({ position: [8, 0, 0], velocity: 50, target: [50, 0, 0], at: 200 })
    for (let t = 200; t < 2000; t += 10) {
      const at = p.at(t)!
      expect(at[0]).toBeLessThanOrEqual(50 + 1e-9)
      expect(at[0]).toBeGreaterThanOrEqual(0)
      expect(Math.abs(at[1])).toBeLessThan(1e-9)
    }
  })

  it('snaps to a report too far from the drawing (homing, a reconnect)', () => {
    const p = new PositionPredictor({ snapDistance: 40 })
    p.report({ position: [100, 100, 10], at: 0 })
    p.report({ position: [200, 174, 0], at: 100 })
    close(p.at(100), [200, 174, 0])
  })

  it('with no target, carries on the way it last went for a short horizon only', () => {
    const p = new PositionPredictor({ easeMs: 1, horizonMs: 250 })
    p.report({ position: [0, 0, 0], at: 0 })
    p.report({ position: [10, 0, 0], velocity: 100, at: 100 })
    close(p.predicted(200), [20, 0, 0])
    close(p.predicted(5000), [35, 0, 0])
    expect(p.settled(5000)).toBe(true)
  })

  it('holds still when the speed is 0 or unknown', () => {
    const p = new PositionPredictor()
    p.report({ position: [0, 0, 0], target: [100, 0, 0], velocity: 0, at: 0 })
    close(p.predicted(1000), [0, 0, 0])
    p.report({ position: [0, 0, 0], target: [100, 0, 0], velocity: null, at: 1000 })
    close(p.predicted(2000), [0, 0, 0])
  })

  it('ignores a report that is not three numbers, and forgets on reset', () => {
    const p = new PositionPredictor()
    p.report({ position: [1, 2, 3], at: 0 })
    p.report({ position: [Number.NaN, 2, 3], at: 10 })
    p.report({ position: [1, 2], at: 10 })
    close(p.at(10), [1, 2, 3])
    p.reset()
    expect(p.at(10)).toBeNull()
  })
})

describe('PredictionLoop', () => {
  function fakeFrames () {
    const queue = new Map<number, (t: number) => void>()
    let next = 1
    return {
      raf: (cb: (t: number) => void) => { const h = next++; queue.set(h, cb); return h },
      caf: (h: number) => { queue.delete(h) },
      run (t: number) { const cbs = [...queue.values()]; queue.clear(); cbs.forEach(cb => cb(t)) },
      get size () { return queue.size }
    }
  }

  it('draws each frame until settled, and again when woken', () => {
    const f = fakeFrames()
    let left = 3
    const draw = vi.fn(() => --left > 0)
    const loop = new PredictionLoop(draw, f.raf, f.caf, null)
    loop.wake()
    loop.wake() // one loop, not two
    expect(f.size).toBe(1)
    f.run(1); f.run(2); f.run(3)
    expect(draw).toHaveBeenCalledTimes(3)
    expect(loop.running).toBe(false)
    left = 2
    loop.wake()
    expect(loop.running).toBe(true)
  })

  it('draws nothing while the page is hidden', () => {
    const f = fakeFrames()
    const doc = { visibilityState: 'hidden', addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as Document
    const draw = vi.fn(() => true)
    const loop = new PredictionLoop(draw, f.raf, f.caf, doc)
    loop.wake()
    expect(f.size).toBe(0)
    ;(doc as unknown as { visibilityState: string }).visibilityState = 'visible'
    loop.wake()
    expect(f.size).toBe(1)
    ;(doc as unknown as { visibilityState: string }).visibilityState = 'hidden'
    f.run(1)
    expect(draw).not.toHaveBeenCalled()
    expect(loop.running).toBe(false)
  })

  it('stop cancels the pending frame and unhooks from the page', () => {
    const f = fakeFrames()
    const doc = { visibilityState: 'visible', addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as Document
    const loop = new PredictionLoop(() => true, f.raf, f.caf, doc)
    loop.wake()
    loop.stop()
    expect(f.size).toBe(0)
    expect(doc.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    loop.wake()
    expect(f.size).toBe(0)
  })
})
