import { describe, expect, it } from 'vitest'
import { KNOB_DETENT, knobGoal, wheelDetents } from '../knob'

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
