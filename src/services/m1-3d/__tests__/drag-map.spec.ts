import { describe, expect, it } from 'vitest'
import { ACCURATE_RIG, placeAccurate } from '../accurate/klipper-map'
import { clampMm, headToWorld, plateTopForZ, ticks, worldToHead, zForPlateTop } from '../drag-map'

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
