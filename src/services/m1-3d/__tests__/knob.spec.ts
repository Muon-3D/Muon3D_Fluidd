import { describe, expect, it } from 'vitest'
import { KNOB_DETENT, KnobWheel, MAX_STEPS_PER_SECOND, knobGoal, wheelDetents } from '../knob'

describe('the model knob\'s turn', () => {
  it('turns one detent for one wheel notch, down clockwise', () => {
    expect(wheelDetents(100)).toBe(1)
    expect(wheelDetents(-100)).toBe(-1)
    expect(knobGoal(0, 1)).toBeCloseTo(KNOB_DETENT)
    expect(knobGoal(KNOB_DETENT, -1)).toBeCloseTo(0)
  })

  it('takes a trackpad\'s small deltas as small turns and a flick as no more than three', () => {
    expect(wheelDetents(10)).toBeCloseTo(0.1)
    expect(wheelDetents(5000)).toBe(3)
    expect(wheelDetents(-5000)).toBe(-3)
  })

  it('reads line and page wheel modes too', () => {
    expect(wheelDetents(3, 1)).toBeCloseTo(0.48)
    expect(wheelDetents(1, 2)).toBe(3)
  })

  it('adds up across scrolls', () => {
    let goal = 0
    for (let i = 0; i < 4; i++) goal = knobGoal(goal, wheelDetents(100))
    expect(goal).toBeCloseTo(4 * KNOB_DETENT)
  })
})

describe('a trackpad\'s wheel (KAN-3597)', () => {
  it('turns one detent per mouse notch, as before', () => {
    const wheel = new KnobWheel()
    let total = 0
    // One notch every 125 ms, the pace the cap allows.
    for (let i = 0; i < 72; i++) total += wheel.turn(100, 0, i * 125)
    expect(total).toBe(72)
  })

  it('takes a burst of small deltas as a few steps, not a spin', () => {
    const wheel = new KnobWheel()
    let total = 0
    // A two-second swipe with its momentum: 120 events of 8 px, 960 px in all.
    for (let i = 0; i < 120; i++) total += wheel.turn(8, 0, i * 16)
    expect(total).toBe(8)
  })

  it('never turns more than MAX_STEPS_PER_SECOND from a long flick', () => {
    const wheel = new KnobWheel()
    let total = 0
    for (let i = 0; i < 400; i++) total += wheel.turn(30, 0, i * 2)
    expect(total).toBeLessThanOrEqual(MAX_STEPS_PER_SECOND)
  })

  it('counts line-mode events by their pixels, and lets go of a part-step after a pause', () => {
    const wheel = new KnobWheel()
    expect(wheel.turn(1, 1, 0)).toBe(0)
    expect(wheel.turn(100, 0, 10)).toBe(1)
    let total = 0
    for (const t of [20, 30, 40]) total += wheel.turn(30, 0, t)
    // 90 px is not a step; after a pause it is forgotten, so another 90 is not either.
    for (const t of [1000, 1010, 1020]) total += wheel.turn(30, 0, t)
    expect(total).toBe(0)
  })

  it('turns up and down', () => {
    const wheel = new KnobWheel()
    let total = 0
    for (let i = 0; i < 30; i++) total += wheel.turn(-8, 0, i * 16)
    expect(total).toBe(-2)
  })

  it('caps single large events too: 30 events of 150 px in a second are no more than 8 detents', () => {
    const wheel = new KnobWheel()
    let total = 0
    for (let i = 0; i < 30; i++) total += wheel.turn(150, 0, i * 30)
    expect(total).toBeLessThanOrEqual(MAX_STEPS_PER_SECOND)
    expect(total).toBeGreaterThan(0)
    // And line-mode flicks (3 lines is 48 px each) in both directions.
    const other = new KnobWheel()
    let net = 0
    for (let i = 0; i < 40; i++) net += Math.abs(other.turn(i % 2 ? -3 : 3, 1, i * 20))
    expect(net).toBeLessThanOrEqual(MAX_STEPS_PER_SECOND)
  })
})
