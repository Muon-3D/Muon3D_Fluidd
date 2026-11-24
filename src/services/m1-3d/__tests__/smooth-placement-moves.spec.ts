import { describe, expect, it } from 'vitest'
import { PlacementSmoother } from '../smooth-placement'
import { RESTING } from '../pose'

/**
 * KAN-5983: the head and the bed never jump. A known place is glided to from the DRAWN place; an unknown one holds;
 * reduced motion snaps; the first frame of a stage starts on the printer's place.
 */
const all = { headX: true, headZ: true, z: true }
const none = { headX: false, headZ: false, z: false }
const FAR = { headX: 1, headZ: RESTING.headZ, z: RESTING.z }

describe('PlacementSmoother, smooth moves (KAN-5983)', () => {
  it('a known place glides from the drawn place: no frame steps past the target or back, and it arrives in about 200 ms', () => {
    const s = new PlacementSmoother()
    s.step(RESTING, all, 0)
    let prev = s.current.headX
    let arrivedAt = -1
    for (let t = 16; t <= 600; t += 16) {
      const x = s.step(FAR, all, t).headX
      expect(x).toBeGreaterThanOrEqual(prev)
      expect(x).toBeLessThanOrEqual(1)
      // Never a leap: each frame covers a bounded share of what is left.
      // (The last half-thousandth is settled in one go, so it is left out.)
      if (1 - prev > 0.002) expect(x - prev).toBeLessThanOrEqual((1 - prev) * 0.5 + 1e-9)
      prev = x
      if (arrivedAt < 0 && x > 1 - 0.05 * (1 - RESTING.headX)) arrivedAt = t
    }
    expect(arrivedAt).toBeGreaterThan(100)
    expect(arrivedAt).toBeLessThan(260)
  })

  it('retargeting every frame (reports coming in) never makes a frame jump', () => {
    const s = new PlacementSmoother()
    s.step(RESTING, all, 0)
    let prev = s.current.headX
    for (let t = 16; t <= 1000; t += 16) {
      // The report keeps moving the goal, even back and forth.
      const goal = 0.5 + 0.5 * Math.sin(t / 90)
      const x = s.step({ ...FAR, headX: goal }, all, t).headX
      if (Math.abs(goal - prev) > 0.002) expect(Math.abs(x - prev)).toBeLessThanOrEqual(Math.abs(goal - prev) * 0.5 + 1e-9)
      prev = x
    }
  })

  it("holds still through a homing (all axes unknown) and does not follow the printer's own numbers", () => {
    const s = new PlacementSmoother()
    s.step({ headX: 0.8, headZ: 0.3, z: 0.6 }, all, 0)
    const held = s.current
    for (let t = 16; t < 2000; t += 16) {
      expect(s.step({ headX: -1, headZ: -1, z: 0 }, none, t)).toEqual(held)
      expect(s.moving).toBe(false)
    }
    // Each axis eases in from the held place as it becomes known, not as a jump.
    const first = s.step({ headX: 0.1, headZ: 0.3, z: 0.6 }, { headX: true, headZ: false, z: false }, 2016)
    expect(first.headX).toBeLessThan(0.8)
    expect(first.headX).toBeGreaterThan(0.6)
    expect(first.headZ).toBe(held.headZ)
  })

  it('with reduced motion a known place is taken at once, and the stage then stops', () => {
    const s = new PlacementSmoother()
    s.step(RESTING, all, 0, false)
    const out = s.step(FAR, all, 16, false)
    expect(out.headX).toBe(1)
    expect(s.moving).toBe(false)
  })

  it("the first frame of a stage starts on the printer's place, not flying in from the model's rest", () => {
    const s = new PlacementSmoother()
    const out = s.step({ headX: 0.9, headZ: 0.1, z: 0.8 }, all, 0)
    expect(out).toEqual({ headX: 0.9, headZ: 0.1, z: 0.8 })
    expect(s.moving).toBe(false)
  })

  it('an unknown first frame keeps the rest pose, and the place that comes after glides', () => {
    const s = new PlacementSmoother()
    expect(s.step({ headX: 0.9, headZ: 0.1, z: 0.8 }, none, 0)).toEqual(RESTING)
    const next = s.step({ headX: 0.9, headZ: 0.1, z: 0.8 }, all, 16)
    expect(next.headX).toBeGreaterThan(RESTING.headX)
    expect(next.headX).toBeLessThan(0.9)
  })
})
