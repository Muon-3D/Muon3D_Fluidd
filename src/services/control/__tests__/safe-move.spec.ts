import { describe, it, expect } from 'vitest'
import { endOwnMotion, meshSpan, noteOwnMotion, NOTCH_MARGIN_MM, ownMotion, ownMotionActive, OWN_MOTION_MARGIN_MS, readNoGo, planMove, planXYMove, segmentHits, zNudgeRefusal, type NoGoConfig, type Limits } from '../safe-move'

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
  })

  it('with no notch height, counts every height as within the notch (it blocks crossings, not raising)', () => {
    expect((readNoGo({ no_go_region_1_min: [75, 0], no_go_region_1_max: [125, 34] }) as NoGoConfig).traverseZ).toBe(Infinity)
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

describe('the notch rule (Klipper\'s: toolhead Z below no_go_traverse_z)', () => {
  it('is the notch itself: a low path through the old tolerance band is one straight move', () => {
    expect(planXYMove({ x: 130, y: 30, z: 1 }, { x: 130, y: 20 }, m1, LIMITS))
      .toEqual({ ok: true, steps: [{ X: 130, Y: 20 }], lifted: false })
    expect(planXYMove({ x: 10, y: 40, z: 1 }, { x: 190, y: 40 }, m1, LIMITS))
      .toEqual({ ok: true, steps: [{ X: 190, Y: 40 }], lifted: false })
  })

  it('refuses a move into the notch within notch height, and allows it with the plate lower', () => {
    expect(planXYMove({ x: 70, y: 7, z: 5.9 }, { x: 100, y: 7 }, m1, LIMITS).ok).toBe(false)
    expect(planXYMove({ x: 70, y: 7, z: 6 }, { x: 100, y: 7 }, m1, LIMITS))
      .toEqual({ ok: true, steps: [{ X: 100, Y: 7 }], lifted: false })
  })

  it('counts an unknown plate height (Z not homed) as within notch height', () => {
    expect(planXYMove({ x: 70, y: 7, z: 20 }, { x: 100, y: 7 }, m1, LIMITS, false))
      .toEqual({ ok: false, reason: expect.stringMatching(/Home Z first/) })
    expect(planXYMove({ x: 60, y: 20, z: 20 }, { x: 160, y: 20 }, m1, LIMITS, false).ok).toBe(false)
    expect(planXYMove({ x: 60, y: 60, z: 20 }, { x: 160, y: 60 }, m1, LIMITS, false))
      .toEqual({ ok: true, steps: [{ X: 160, Y: 60 }], lifted: false })
  })

  it('has no notch when the printer declares none', () => {
    expect(readNoGo({ mesh_min: [10, 10] })).toBeNull()
    expect(planXYMove({ x: 70, y: 7, z: 1 }, { x: 100, y: 7 }, null, LIMITS, false).ok).toBe(true)
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

describe('the mesh margin', () => {
  it('is the spread of the active mesh, and 0 with none active', () => {
    expect(meshSpan({ profile_name: 'default', mesh_matrix: [[-0.3, 0.1], [0.2, 0.4]] })).toBeCloseTo(0.7)
    expect(meshSpan({ profile_name: '', mesh_matrix: [[-0.3, 0.4]] })).toBe(0)
    expect(meshSpan(undefined)).toBe(0)
  })

  it('raises the crossing height and the "high enough already" line', () => {
    expect(planMove({ x: 60, y: 10, z: 6.2 }, { x: 140, y: 10, z: 6.2 }, m1, LIMITS, 0.5))
      .toEqual({ ok: true, steps: [{ Z: 6.5 }, { X: 140, Y: 10 }, { Z: 6.2 }], lifted: true })
    expect(planMove({ x: 60, y: 10, z: 6.6 }, { x: 140, y: 10, z: 6.6 }, m1, LIMITS, 0.5)).toEqual({ ok: true, steps: [{ X: 140, Y: 10, Z: 6.6 }], lifted: false })
  })
})

/* KAN-2120 (Opus review): the own-move window is as narrow as it can be. */
describe('the own-move window', () => {
  it('lasts the move\'s travel time plus a small margin, with no fixed minimum', () => {
    expect(noteOwnMotion('p', 1000, 500)).toBe(500 + OWN_MOTION_MARGIN_MS)
    expect(ownMotionActive('p', 1000 + 500 + OWN_MOTION_MARGIN_MS - 1)).toBe(true)
    expect(ownMotionActive('p', 1000 + 500 + OWN_MOTION_MARGIN_MS + 1)).toBe(false)
    endOwnMotion()
  })

  it('never starts or extends for a move sent while the printer was already busy', () => {
    noteOwnMotion('p', 1000, 100)
    const until = ownMotion.until
    expect(noteOwnMotion('p', 2000, 60_000, false)).toBe(0)
    expect(ownMotion.until).toBe(until)
    endOwnMotion()
    expect(noteOwnMotion('p', 3000, 100, false)).toBe(0)
    expect(ownMotionActive('p', 3001)).toBe(false)
  })

  it('is ours only while the commanded position is on this page’s own path: a macro moving the head inside the window is not', () => {
    noteOwnMotion('p', 1000, 500, true, [100, 100, 10], [60, 100, 10])
    // Just sent: the printer may still report the start as commanded, then the target.
    expect(ownMotionActive('p', 1050, [60, 100, 10, 0])).toBe(true)
    expect(ownMotionActive('p', 1100, [100, 100, 10, 0])).toBe(true)
    // The panel's park macro starts lowering Z inside the window: the commanded position is no longer on our path.
    expect(ownMotionActive('p', 1100, [100, 100, 4, 0])).toBe(false)
    expect(ownMotionActive('p', 1100, [120, 100, 10, 0])).toBe(false)
    // A path recorded but no commanded position to check: not ours.
    expect(ownMotionActive('p', 1100)).toBe(false)
    endOwnMotion()
  })

  it('a re-target inside the window joins its path without extending it', () => {
    noteOwnMotion('p', 1000, 500, true, [100, 100, 10], [60, 100, 10])
    const until = ownMotion.until
    expect(noteOwnMotion('p', 1200, 60_000, false, [140, 80, 10])).toBe(0)
    expect(ownMotion.until).toBe(until)
    expect(ownMotionActive('p', 1300, [140, 80, 10, 0])).toBe(true)
    expect(ownMotionActive('p', 1300, [100, 100, 10, 0])).toBe(true)
    expect(ownMotionActive('p', 1300, [140, 80, 2, 0])).toBe(false)
    endOwnMotion()
    // Outside an open window a busy-time move adds nothing.
    expect(noteOwnMotion('p', 5000, 100, false, [1, 2, 3])).toBe(0)
    expect(ownMotion.path).toEqual([])
  })

  it('ends when the printer stops being busy, and is only for its own printer', () => {
    noteOwnMotion('p', Date.now(), 60_000)
    expect(ownMotionActive('other')).toBe(false)
    expect(ownMotionActive('p')).toBe(true)
    endOwnMotion()
    expect(ownMotionActive('p')).toBe(false)
  })
})

/* Opus review of the notch (12 Nov): Control is the only guard on these moves until Klipper #117. */
describe('the notch guard, conservative while Control is the only guard', () => {
  it('keeps a 2 mm margin around the notch: a low move ending 1 mm outside is refused, 3 mm outside goes', () => {
    expect(NOTCH_MARGIN_MM).toBe(2)
    expect(planMove({ x: 100, y: 60, z: 1 }, { x: 100, y: 35, z: 1 }, m1, LIMITS)).toMatchObject({ ok: false })
    expect(planMove({ x: 100, y: 60, z: 1 }, { x: 100, y: 37, z: 1 }, m1, LIMITS)).toMatchObject({ ok: true, lifted: false })
    // A low crossing that grazes the margin lifts over it.
    expect(planMove({ x: 60, y: 35, z: 1 }, { x: 140, y: 35, z: 1 }, m1, LIMITS)).toMatchObject({ ok: true, lifted: true })
    expect(zNudgeRefusal({ x: 100, y: 35, z: 6.5 }, -1, m1)).not.toBe('')
  })

  it('X or Y not homed: the head may be over the notch, so only raising Z goes', () => {
    // M84, the head pushed by hand to Y 10, X and Z homed, then an X jog at Z 2 across x 75 to 125 (stale Y 100).
    expect(planMove({ x: 60, y: 100, z: 2 }, { x: 140, y: 100, z: 2 }, m1, LIMITS, 0, true, false)).toEqual({ ok: false, reason: expect.stringMatching(/^Home X and Y first/) })
    expect(planMove({ x: 60, y: 100, z: 2 }, { x: 60, y: 100, z: 1 }, m1, LIMITS, 0, true, false)).toMatchObject({ ok: false })
    expect(planMove({ x: 60, y: 100, z: 2 }, { x: 60, y: 100, z: 20 }, m1, LIMITS, 0, true, false)).toMatchObject({ ok: true })
    // No notch on the printer: nothing to guard.
    expect(planMove({ x: 60, y: 100, z: 2 }, { x: 140, y: 100, z: 2 }, null, LIMITS, 0, true, false)).toMatchObject({ ok: true })
  })

  it('reads every region present, whatever its numbering', () => {
    const only2 = readNoGo({ no_go_region_2_min: '75, 0', no_go_region_2_max: '125, 34', no_go_traverse_z: 6 }) as NoGoConfig
    expect(only2.regions).toEqual([{ min: [75, 0], max: [125, 34] }])
    expect(planMove({ x: 60, y: 10, z: 1 }, { x: 140, y: 10, z: 1 }, only2, LIMITS)).toMatchObject({ ok: true, lifted: true })
    expect(readNoGo({ no_go_region_3_min: '1, 1' })).toBe('invalid')
  })

  it('a notch with no height (no_go_traverse_z missing, empty or 0) counts every Z as within it', () => {
    for (const z of [null, '', 0, undefined]) {
      const n = readNoGo({ no_go_region_1_min: '75, 0', no_go_region_1_max: '125, 34', no_go_traverse_z: z }) as NoGoConfig
      expect(n.traverseZ).toBe(Infinity)
      expect(planMove({ x: 60, y: 10, z: 150 }, { x: 140, y: 10, z: 150 }, n, LIMITS)).toMatchObject({ ok: false })
      expect(planMove({ x: 100, y: 60, z: 150 }, { x: 100, y: 10, z: 150 }, n, LIMITS)).toMatchObject({ ok: false })
      expect(planMove({ x: 60, y: 100, z: 150 }, { x: 140, y: 100, z: 150 }, n, LIMITS)).toMatchObject({ ok: true })
    }
  })
})
