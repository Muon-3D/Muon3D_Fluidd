import { describe, expect, it } from 'vitest'
import { heightStretch, levelMesh, microns } from '../mesh-level'

// An M1-sized measured area, 5 × 5 points: 10..190 mm across, 10..170 mm deep.
const MIN = [10, 10]
const MAX = [190, 170]
const XS = [10, 55, 100, 145, 190]
const YS = [10, 50, 90, 130, 170]

/** A 5 × 5 grid of f(x, y), rows by Y ascending as Klipper reports it. */
const grid = (f: (x: number, y: number) => number) => YS.map(y => XS.map(x => f(x, y)))

const plane = (x: number, y: number) => 0.3 + 0.001 * x - 0.0005 * y
// A bowl, lowest in the middle: 0 at the middle, 0.1 mm up at the corners.
const bowl = (x: number, y: number) => 0.1 * (((x - 100) / 90) ** 2 + ((y - 90) / 80) ** 2) / 2

const flat = (m: number[][]) => m.flat()

describe('levelling a mesh', () => {
  it('takes a tilted plane to zero everywhere', () => {
    const level = levelMesh(grid(plane), MIN, MAX)
    expect(level).not.toBeNull()
    for (const r of flat(level!.residuals)) expect(Math.abs(r)).toBeLessThan(1e-9)
    expect(level!.range).toBeLessThan(1e-9)
  })

  it('reports the tilt it took out, in mm across the measured area', () => {
    // 0.001 mm/mm over 180 mm, plus 0.0005 mm/mm over 160 mm.
    expect(levelMesh(grid(plane), MIN, MAX)!.tilt).toBeCloseTo(0.18 + 0.08, 9)
  })

  it('keeps the bowl when the bowl sits on a tilted plane', () => {
    const tilted = levelMesh(grid((x, y) => plane(x, y) + bowl(x, y)), MIN, MAX)!
    const alone = levelMesh(grid(bowl), MIN, MAX)!
    flat(tilted.residuals).forEach((r, i) => expect(r).toBeCloseTo(flat(alone.residuals)[i], 9))
    // Middle low, corners high, 0.1 mm between them.
    expect(tilted.residuals[2][2]).toBeLessThan(0)
    expect(tilted.residuals[0][0]).toBeGreaterThan(0)
    expect(tilted.range).toBeCloseTo(0.1, 9)
  })

  it('returns residuals that average to zero', () => {
    const level = levelMesh(grid((x, y) => plane(x, y) + bowl(x, y)), MIN, MAX)!
    const sum = flat(level.residuals).reduce((s, r) => s + r, 0)
    expect(Math.abs(sum)).toBeLessThan(1e-9)
  })

  it('places points at the mesh corners and evenly between', () => {
    const level = levelMesh(grid(plane), MIN, MAX)!
    expect(level.xs).toEqual(XS)
    expect(level.ys).toEqual(YS)
  })

  it('finds the same shape without the corners, counting in points', () => {
    const m = grid((x, y) => plane(x, y) + bowl(x, y))
    const withCorners = levelMesh(m, MIN, MAX)!
    const without = levelMesh(m)!
    expect(without.xs).toEqual([0, 1, 2, 3, 4])
    flat(without.residuals).forEach((r, i) => expect(r).toBeCloseTo(flat(withCorners.residuals)[i], 9))
  })

  it('skips points that are not numbers and leaves them NaN', () => {
    const m: Array<Array<number | null>> = grid((x, y) => plane(x, y) + bowl(x, y))
    m[1][3] = NaN
    m[3][1] = null
    const level = levelMesh(m, MIN, MAX)!
    expect(level.residuals[1][3]).toBeNaN()
    expect(level.residuals[3][1]).toBeNaN()
    expect(Number.isFinite(level.range)).toBe(true)
  })

  it('has nothing to show without a number', () => {
    expect(levelMesh(undefined)).toBeNull()
    expect(levelMesh([])).toBeNull()
    expect(levelMesh([[]])).toBeNull()
    expect(levelMesh([[NaN, NaN], [NaN, NaN]])).toBeNull()
  })

  it('fits a line through a single row', () => {
    const level = levelMesh([[0, 0.1, 0.2]])!
    for (const r of flat(level.residuals)) expect(Math.abs(r)).toBeLessThan(1e-12)
  })
})

describe('stretching the height to fill the view', () => {
  it('stands the shape about 30% of the shorter side tall, rounded down to a round number', () => {
    // 0.3 × 160 mm / 0.1 mm = 480 → 300.
    expect(heightStretch(0.1, 160)).toBe(300)
    // 0.3 × 180 / 0.27 = 200 exactly.
    expect(heightStretch(0.27, 180)).toBe(200)
    // 0.3 × 180 / 0.05 = 1080 → 1000.
    expect(heightStretch(0.05, 180)).toBe(1000)
  })

  it('never blows a near-perfect plate up past 5 µm high to low', () => {
    // 0.3 × 160 / 0.005 = 9600 → 7000, for 0, 1 µm or NaN alike.
    expect(heightStretch(0, 160)).toBe(7000)
    expect(heightStretch(0.001, 160)).toBe(7000)
    expect(heightStretch(NaN, 160)).toBe(7000)
  })

  it('never squashes a shape already tall enough', () => {
    expect(heightStretch(100, 160)).toBe(1)
    expect(heightStretch(0.1, 0)).toBe(1)
  })
})

describe('residuals in microns', () => {
  it('signs them and rounds to the micron', () => {
    expect(microns(0.0424)).toBe('+42 µm')
    expect(microns(-0.008)).toBe('−8 µm')
    expect(microns(0.0004)).toBe('0 µm')
  })
})
