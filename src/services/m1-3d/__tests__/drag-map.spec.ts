import { describe, expect, it } from 'vitest'
import { ACCURATE_RIG, placeAccurate } from '../accurate/klipper-map'
import { PlacementSmoother } from '../smooth-placement'
import { clampMm, headToWorld, placementToNozzle, plateDragZ, plateTopForZ, releasePlace, ticks, worldToHead, zForPlateTop } from '../drag-map'

describe('drag-map', () => {
  it('reads back the Klipper X and Y it drew', () => {
    for (const [x, y] of [[0, 0], [100, 90], [200, 174], [37.5, 12.25]]) {
      const back = worldToHead(headToWorld(x, y))
      expect(back.X).toBeCloseTo(x, 9)
      expect(back.Y).toBeCloseTo(y, 9)
    }
  })

  it('puts the target where the model puts the nozzle for the same Klipper X and Y', () => {
    // placeAccurate turns Klipper mm into rail states; the rail's nozzle runs from travel[0] to travel[1] about its rest.
    const r = ACCURATE_RIG
    const nozzle = (x: number, y: number) => {
      const p = placeAccurate({ x, y, z: 10, led: false, progress: 0 })
      const half = (lo: number, hi: number) => (hi - lo) / 2
      return { x: r.nozzleX + p.headX * half(r.travelX[0], r.travelX[1]), z: r.nozzleZ + p.headZ * half(r.travelZ[0], r.travelZ[1]) }
    }
    for (const [x, y] of [[50, 40], [100, 100], [150, 150]]) {
      const w = headToWorld(x, y)
      expect(w.x).toBeCloseTo(nozzle(x, y).x, 6)
      expect(w.z).toBeCloseTo(nozzle(x, y).z, 6)
    }
  })

  it('places the nozzle marker from the drawn head, so it glides with the model rather than snapping to the raw pose', () => {
    // Steady state: the drawn place is the pose's own, and the marker is where the pose says.
    for (const [x, y] of [[50, 40], [100, 100], [150, 150]]) {
      const w = placementToNozzle(placeAccurate({ x, y, z: 10, led: false, progress: 0 }))
      expect(w.x).toBeCloseTo(headToWorld(x, y).x, 6)
      expect(w.z).toBeCloseTo(headToWorld(x, y).z, 6)
      expect(w.y).toBe(headToWorld(x, y).y)
    }
    // A jump to a far place: the first smoothed frame is between the two, as the head is; the raw pose is already there.
    const known = { headX: true, headZ: true, z: true }
    const near = placeAccurate({ x: 20, y: 20, z: 10, led: false, progress: 0 })
    const far = placeAccurate({ x: 180, y: 160, z: 10, led: false, progress: 0 })
    const smoother = new PlacementSmoother()
    smoother.step(near, known, 0)
    const drawn = placementToNozzle(smoother.step(far, known, 16))
    const from = placementToNozzle(near)
    const to = placementToNozzle(far)
    expect(drawn.x).toBeGreaterThan(from.x)
    expect(drawn.x).toBeLessThan(to.x)
    expect(drawn.z).toBeGreaterThan(from.z)
    expect(drawn.z).toBeLessThan(to.z)
  })

  it('keeps the nozzle marker inside the end stops', () => {
    const r = ACCURATE_RIG
    const w = placementToNozzle({ headX: 1.05, headZ: -1.05 })
    expect(w.x).toBe(r.travelX[1])
    expect(w.z).toBe(r.travelZ[0])
  })

  it('has Klipper +X to the right and +Y toward the front (model +Z), as the jog pad does', () => {
    expect(headToWorld(150, 90).x).toBeGreaterThan(headToWorld(50, 90).x)
    expect(headToWorld(100, 150).z).toBeGreaterThan(headToWorld(100, 30).z)
  })

  it('reads the plate Z back from its top', () => {
    for (const z of [0, 10, 120.5]) expect(zForPlateTop(plateTopForZ(z))).toBeCloseTo(z, 9)
    // The plate goes up as Z grows: the gap from the nozzle to the plate.
    expect(plateTopForZ(20)).toBeGreaterThan(plateTopForZ(5))
  })

  it('clamps and rounds a target to the machine', () => {
    expect(clampMm(-3, 0, 200)).toBe(0)
    expect(clampMm(250, 0, 200.1)).toBe(200.1)
    expect(clampMm(12.345, 0, 200)).toBe(12.3)
  })

  it('marks every 50 mm along an axis', () => {
    expect(ticks(0, 200.1)).toEqual([0, 50, 100, 150, 200])
    expect(ticks(-10, 174.1)).toEqual([0, 50, 100, 150])
  })
})

describe('plateDragZ', () => {
  it('caps one drag at 50 mm either way', () => {
    expect(plateDragZ(20, 400, 0, 160)).toBe(70)
    expect(plateDragZ(100, -400, 0, 160)).toBe(50)
  })
  it('stops 2 mm off the nozzle, or where the plate already is if lower', () => {
    expect(plateDragZ(10, -30, 0, 160)).toBe(2)
    expect(plateDragZ(1, -30, 0, 160)).toBe(1)
    expect(plateDragZ(10, -30, 5, 160)).toBe(5)
  })
  it('stays inside the axis', () => {
    expect(plateDragZ(150, 40, 0, 160)).toBe(160)
  })
})

describe('releasePlace', () => {
  const min = [0, -10, -4]
  const max = [200.1, 174.1, 160]
  it('sends the target in G-code coordinates', () => {
    expect(releasePlace({ X: 120, Y: 80 }, [0.5, -0.2, 0.1], min, max)).toEqual({ X: 119.5, Y: 80.2 })
    expect(releasePlace({ Z: 12 }, [0, 0, 0.3], min, max)).toEqual({ Z: 11.7 })
  })
  it('keeps the G-code value inside the limits moveTo checks', () => {
    expect(releasePlace({ X: 200.1, Y: 174.1 }, [-1, -1, 0], min, max)).toEqual({ X: 200.1, Y: 174.1 })
    expect(releasePlace({ X: -5, Y: -20 }, [0, 0, 0], min, max)).toEqual({ X: 0, Y: -10 })
  })
  it('never sends a toolhead target as Z or the other way round', () => {
    expect(Object.keys(releasePlace({ Z: 5 }, [0, 0, 0], min, max))).toEqual(['Z'])
    expect(Object.keys(releasePlace({ X: 5, Y: 5 }, [0, 0, 0], min, max)).sort()).toEqual(['X', 'Y'])
  })
})
