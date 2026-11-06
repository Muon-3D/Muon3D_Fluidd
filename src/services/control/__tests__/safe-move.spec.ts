import { describe, it, expect } from 'vitest'
import { readNoGo, planMove, planXYMove, segmentHits, type NoGoConfig, type Limits } from '../safe-move'

// The M1's [bed_mesh], as the printer reports it in configfile.settings.
const M1_BED_MESH = {
  no_go_region_1_min: [75, 0],
  no_go_region_1_max: [125, 34],
  no_go_boundary_tolerance: 10,
  no_go_traverse_z: 6
}
const LIMITS: Limits = { min: [0, 0, 0], max: [200, 180, 180] }
const m1 = readNoGo(M1_BED_MESH) as NoGoConfig

describe('readNoGo', () => {
  it('reads the M1 notch from configfile settings', () => {
    expect(m1).toEqual({ regions: [{ min: [75, 0], max: [125, 34] }], tolerance: 10, traverseZ: 6 })
  })

  it('accepts the "75, 0" string form and unordered corners', () => {
    expect(readNoGo({ no_go_region_1_min: '125, 34', no_go_region_1_max: '75,0', no_go_traverse_z: '6' }))
      .toEqual({ regions: [{ min: [75, 0], max: [125, 34] }], tolerance: 0, traverseZ: 6 })
  })

  it('is null when the printer declares no regions', () => {
    expect(readNoGo({ probe_count: '4,3' })).toBeNull()
    expect(readNoGo(undefined)).toBeNull()
  })

  it('is invalid, not empty, when a region does not parse', () => {
    expect(readNoGo({ no_go_region_1_min: 'x', no_go_region_1_max: [125, 34], no_go_traverse_z: 6 })).toBe('invalid')
    expect(readNoGo({ no_go_region_1_min: [75, 0], no_go_region_1_max: [125, 34] })).toBe('invalid')
  })
})

describe('segmentHits', () => {
  const r = { min: [75, 0] as [number, number], max: [125, 34] as [number, number] }
  it('sees a row traverse through the notch even though both ends miss it', () => {
    // The crash from 2026-09-17: probe points (70,7) -> (130,7).
    expect(segmentHits([70, 7], [130, 7], r, 0)).toBe(true)
  })
  it('misses a path that passes clear of the padded region', () => {
    expect(segmentHits([10, 60], [190, 60], r, 10)).toBe(false)
  })
  it('counts the tolerance band', () => {
    expect(segmentHits([10, 40], [190, 40], r, 0)).toBe(false)
    expect(segmentHits([10, 40], [190, 40], r, 10)).toBe(true)
  })
})

describe('planXYMove', () => {
  it('moves straight when the path is clear', () => {
    expect(planXYMove({ x: 10, y: 100, z: 2 }, { x: 190, y: 100 }, m1, LIMITS))
      .toEqual({ ok: true, steps: [{ X: 190, Y: 100 }], lifted: false })
  })

  it('lifts to the traverse height to cross the notch low down, then comes back down', () => {
    expect(planXYMove({ x: 70, y: 7, z: 0.4 }, { x: 130, y: 7 }, m1, LIMITS))
      .toEqual({ ok: true, steps: [{ Z: 6 }, { X: 130, Y: 7 }, { Z: 0.4 }], lifted: true })
  })

  it('crosses directly when already at or above the traverse height', () => {
    expect(planXYMove({ x: 70, y: 7, z: 6 }, { x: 130, y: 7 }, m1, LIMITS))
      .toEqual({ ok: true, steps: [{ X: 130, Y: 7 }], lifted: false })
  })

  it('refuses a low move that ends over the notch', () => {
    const plan = planXYMove({ x: 10, y: 100, z: 1 }, { x: 100, y: 10 }, m1, LIMITS)
    expect(plan.ok).toBe(false)
  })

  it('refuses outside the bed', () => {
    expect(planXYMove({ x: 10, y: 100, z: 10 }, { x: 250, y: 10 }, m1, LIMITS).ok).toBe(false)
  })

  it('refuses every low move when the regions cannot be read', () => {
    expect(planXYMove({ x: 10, y: 100, z: 1 }, { x: 20, y: 100 }, 'invalid', LIMITS).ok).toBe(false)
  })

  it('refuses when the position is unknown', () => {
    expect(planXYMove({ x: NaN, y: 100, z: 10 }, { x: 20, y: 100 }, m1, LIMITS).ok).toBe(false)
  })

  it('refuses a crossing when the traverse height is above the Z limit', () => {
    const low: Limits = { min: [0, 0, 0], max: [200, 180, 5] }
    expect(planXYMove({ x: 70, y: 7, z: 1 }, { x: 130, y: 7 }, m1, low).ok).toBe(false)
  })

  it('needs no regions on printers that declare none', () => {
    expect(planXYMove({ x: 70, y: 7, z: 0.2 }, { x: 130, y: 7 }, null, LIMITS))
      .toEqual({ ok: true, steps: [{ X: 130, Y: 7 }], lifted: false })
  })
})

describe('planMove (with Z)', () => {
  it('refuses lowering Z into the notch while the head is over it', () => {
    expect(planMove({ x: 100, y: 10, z: 8 }, { x: 100, y: 10, z: 2 }, m1, LIMITS).ok).toBe(false)
  })

  it('lets Z come down beside the notch', () => {
    expect(planMove({ x: 100, y: 80, z: 8 }, { x: 100, y: 80, z: 2 }, m1, LIMITS))
      .toEqual({ ok: true, steps: [{ Z: 2 }], lifted: false })
  })

  it('judges a combined move at its lowest point and splits it to cross high', () => {
    expect(planMove({ x: 60, y: 10, z: 10 }, { x: 140, y: 10, z: 1 }, m1, LIMITS))
      .toEqual({ ok: true, steps: [{ Z: 6 }, { X: 140, Y: 10 }, { Z: 1 }], lifted: true })
  })

  it('raises first when the move ends above the traverse height', () => {
    expect(planMove({ x: 60, y: 10, z: 1 }, { x: 140, y: 10, z: 20 }, m1, LIMITS))
      .toEqual({ ok: true, steps: [{ Z: 20 }, { X: 140, Y: 10 }], lifted: true })
  })

  it('keeps an ordinary combined move as one move', () => {
    expect(planMove({ x: 10, y: 100, z: 5 }, { x: 120, y: 100, z: 40 }, m1, LIMITS))
      .toEqual({ ok: true, steps: [{ X: 120, Y: 100, Z: 40 }], lifted: false })
  })

  it('still allows raising Z when the regions cannot be read, and nothing else', () => {
    expect(planMove({ x: 100, y: 10, z: 1 }, { x: 100, y: 10, z: 11 }, 'invalid', LIMITS).ok).toBe(true)
    expect(planMove({ x: 100, y: 10, z: 11 }, { x: 100, y: 10, z: 1 }, 'invalid', LIMITS).ok).toBe(false)
  })
})
