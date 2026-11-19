import { describe, expect, it } from 'vitest'
import { PlacementSmoother, PLACE_TAU_MS } from '../smooth-placement'
import { RESTING } from '../pose'

const all = { headX: true, headZ: true, z: true }
const none = { headX: false, headZ: false, z: false }

function run (s: PlacementSmoother, target: { headX: number, headZ: number, z: number }, known: typeof all, from: number, ms: number, frame = 16) {
  let out = s.current
  for (let t = from; t <= from + ms; t += frame) out = s.step(target, known, t)
  return out
}

describe('PlacementSmoother', () => {
  it('reaches the target and then stops moving', () => {
    const s = new PlacementSmoother()
    s.step({ headX: 0.8, headZ: 0.2, z: 0.9 }, all, 0)
    const out = run(s, { headX: 0.8, headZ: 0.2, z: 0.9 }, all, 16, 1500)
    expect(out).toEqual({ headX: 0.8, headZ: 0.2, z: 0.9 })
    expect(s.moving).toBe(false)
  })

  it('does not snap after the stage has been idle: a new target long after arriving starts from a small step', () => {
    const s = new PlacementSmoother()
    s.step({ headX: 0.2, headZ: 0.2, z: 0.2 }, all, 0)
    run(s, { headX: 0.2, headZ: 0.2, z: 0.2 }, all, 16, 1500)
    expect(s.moving).toBe(false)
    // Five seconds idle, then the printer reports a far place.
    const first = s.step({ headX: 0.9, headZ: 0.9, z: 0.9 }, all, 6600)
    expect(first.headX).toBeGreaterThan(0.2)
    expect(first.headX).toBeLessThan(0.4)
    expect(s.moving).toBe(true)
  })

  it('does not jump: the first frame toward a far target covers only part of the way', () => {
    const s = new PlacementSmoother()
    s.step(RESTING, all, 0)
    const out = s.step({ headX: 1, headZ: RESTING.headZ, z: RESTING.z }, all, 16)
    expect(out.headX).toBeGreaterThan(RESTING.headX)
    expect(out.headX).toBeLessThan(RESTING.headX + 0.3 * (1 - RESTING.headX))
    expect(s.moving).toBe(true)
  })

  it('takes the same time at 30 and 120 frames a second', () => {
    const a = new PlacementSmoother()
    const b = new PlacementSmoother()
    a.step(RESTING, all, 0)
    b.step(RESTING, all, 0)
    const t = { headX: 1, headZ: RESTING.headZ, z: RESTING.z }
    const x = run(a, t, all, 33, 2 * PLACE_TAU_MS, 33).headX
    const y = run(b, t, all, 8, 2 * PLACE_TAU_MS, 8).headX
    expect(Math.abs(x - y)).toBeLessThan(0.08)
  })

  it('an unknown position keeps the last drawn place instead of jumping to the default', () => {
    const s = new PlacementSmoother()
    s.step({ headX: 0.9, headZ: 0.1, z: 0.7 }, all, 0)
    const settled = run(s, { headX: 0.9, headZ: 0.1, z: 0.7 }, all, 16, 1500)
    // The printer now says nothing known: the target is the model's resting pose, which must not be followed.
    const out = run(s, RESTING, none, 1600, 600)
    expect(out).toEqual(settled)
    expect(s.moving).toBe(false)
  })

  it('a place that arrives after unknown is flown to from the drawn place', () => {
    const s = new PlacementSmoother()
    run(s, { headX: 0.9, headZ: 0.1, z: 0.7 }, all, 0, 1500)
    run(s, RESTING, none, 1600, 300)
    const first = s.step({ headX: 0.2, headZ: 0.1, z: 0.7 }, all, 1920)
    expect(first.headX).toBeLessThan(0.9)
    expect(first.headX).toBeGreaterThan(0.6)
  })

  it('a target changed mid-move continues from where the part is drawn, without a jump', () => {
    const s = new PlacementSmoother()
    s.step(RESTING, all, 0)
    const mid = run(s, { headX: 1, headZ: RESTING.headZ, z: RESTING.z }, all, 16, 80)
    const next = s.step({ headX: 0, headZ: RESTING.headZ, z: RESTING.z }, all, 112)
    expect(Math.abs(next.headX - mid.headX)).toBeLessThan(0.3)
    expect(next.headX).toBeLessThan(mid.headX)
    expect(next.headX).toBeGreaterThan(0)
  })
})
