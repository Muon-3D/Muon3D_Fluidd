import { describe, expect, it } from 'vitest'
import { headSpeedFor, motionLimits, normaliseSteps, presetOf } from '../motion-limits'

describe('motion limits', () => {
  it('maps Gentle, Normal and Fast to a quarter, half and four fifths of max_velocity', () => {
    expect([headSpeedFor('gentle', 300), headSpeedFor('normal', 300), headSpeedFor('fast', 300)]).toEqual([75, 150, 240])
    expect(presetOf(150, 300)).toBe('normal')
    expect(presetOf(149.6, 300)).toBe('normal')
    expect(presetOf(130, 300)).toBeNull()
  })

  it('caps a Muon printer from its config, and at 50 mm and 8 mm/s only when the config says nothing', () => {
    expect(motionLimits({ maxVelocity: 300, maxExtrudeOnlyDistance: 30, maxExtrudeOnlyVelocity: 6 }, true))
      .toEqual({ head: 300, plate: 300, extrudeLength: 30, extrudeSpeed: 6 })
    expect(motionLimits({ maxVelocity: 300, maxZVelocity: 15 }, true))
      .toEqual({ head: 300, plate: 15, extrudeLength: 50, extrudeSpeed: 8 })
  })

  it('gives another printer its own limits, and today\'s caps when its config says nothing', () => {
    expect(motionLimits({ maxVelocity: '500', maxZVelocity: 20 }, false))
      .toEqual({ head: 500, plate: 20, extrudeLength: 200, extrudeSpeed: 50 })
    expect(motionLimits({}, false).head).toBeNull()
    expect(motionLimits({ maxVelocity: 0 }, false).head).toBeNull()
  })

  it('saves step sizes once each, smallest first, and drops what is not a size', () => {
    expect(normaliseSteps([10, '1', 50, 1, 0, -2, 'x', 0.5])).toEqual([0.5, 1, 10, 50])
  })
})
