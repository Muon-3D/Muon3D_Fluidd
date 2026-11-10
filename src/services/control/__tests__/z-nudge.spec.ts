import { describe, expect, it } from 'vitest'
import { readNoGo, zNudgeRefusal } from '../safe-move'

const m1 = readNoGo({ no_go_region_1_min: [75, 0], no_go_region_1_max: [125, 34], no_go_boundary_tolerance: 10, no_go_traverse_z: 6 })

describe('a Z-offset nudge with the head idle', () => {
  it('refuses lowering over the notch below the crossing height', () => {
    expect(zNudgeRefusal({ x: 100, y: 10, z: 2 }, -0.05, m1)).toMatch(/over the bed notch/)
    // The notch is the region itself: bed_mesh's tolerance band is not part of it.
    expect(zNudgeRefusal({ x: 130, y: 10, z: 2 }, -0.01, m1)).toBe('')
  })

  it('allows raising anywhere, and lowering away from the notch or high above it', () => {
    expect(zNudgeRefusal({ x: 100, y: 10, z: 2 }, 0.05, m1)).toBe('')
    expect(zNudgeRefusal({ x: 160, y: 100, z: 0.2 }, -0.05, m1)).toBe('')
    expect(zNudgeRefusal({ x: 100, y: 10, z: 8 }, -0.05, m1)).toBe('')
  })

  it('counts the mesh spread in the crossing height', () => {
    expect(zNudgeRefusal({ x: 100, y: 10, z: 6.3 }, -0.05, m1, 0.5)).toMatch(/raise Z to 6.5 mm/)
  })

  it('only raises when the regions cannot be read, and allows anything with none declared', () => {
    expect(zNudgeRefusal({ x: 160, y: 100, z: 5 }, -0.01, 'invalid')).toMatch(/could not be read/)
    expect(zNudgeRefusal({ x: 160, y: 100, z: 5 }, 0.01, 'invalid')).toBe('')
    expect(zNudgeRefusal({ x: 100, y: 10, z: 0.2 }, -0.05, null)).toBe('')
  })
})
