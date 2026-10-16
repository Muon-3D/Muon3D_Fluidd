/**
 * The bed's shape with its tilt taken out, for showing it: a plane is fitted
 * through the measured points by least squares and each point is shown as
 * its height above or below that plane. The printer already follows the
 * tilt, so what's left (the curvature) is what tells you how flat the plate
 * is. Display only: nothing here changes what the printer has or saves.
 */

export interface LevelledMesh {
  /** Each point's height above (+) or below (−) the fitted plane in mm, rows by Y ascending as the input; NaN where the input wasn't a number. */
  residuals: number[][];
  /** The X of each column and the Y of each row, in mm (or in points, without the mesh's corners). */
  xs: number[];
  ys: number[];
  /** Lowest and highest residual, and the distance between them: the curvature, high to low. */
  min: number;
  max: number;
  range: number;
  /** The fitted plane, z = a + b·x + c·y. */
  plane: { a: number; b: number; c: number };
  /** How far the plane rises from its lowest corner of the measured area to its highest, in mm. */
  tilt: number;
}

/** Evenly spaced positions from `from` to `to`, or 0, 1, 2… without them. */
function spaced (count: number, from?: number, to?: number): number[] {
  const known = typeof from === 'number' && typeof to === 'number' && Number.isFinite(from) && Number.isFinite(to)
  return Array.from({ length: count }, (_, i) => {
    if (!known) return i
    return count > 1 ? from + (to - from) * i / (count - 1) : from
  })
}

/**
 * Fits a plane through `matrix` (rows by Y ascending, cells by X ascending,
 * as Klipper reports it) and returns the heights off it. `meshMin` and
 * `meshMax` are the measured area's corners in mm; without them the fit is
 * the same shape (a plane stays a plane however the axes are scaled) but
 * the tilt is per point, not per mm. Null without a single number to fit.
 */
export function levelMesh (matrix: Array<Array<number | null>> | undefined, meshMin?: number[], meshMax?: number[]): LevelledMesh | null {
  const rows = matrix ?? []
  const columns = rows.reduce((n, row) => Math.max(n, row?.length ?? 0), 0)
  if (!rows.length || !columns) return null
  const xs = spaced(columns, meshMin?.[0], meshMax?.[0])
  const ys = spaced(rows.length, meshMin?.[1], meshMax?.[1])

  const points: Array<[number, number, number]> = []
  rows.forEach((row, r) => (row ?? []).forEach((z, c) => {
    if (typeof z === 'number' && Number.isFinite(z)) points.push([xs[c], ys[r], z])
  }))
  if (!points.length) return null

  // Least squares about the points' centre, which keeps the sums small.
  const n = points.length
  const mx = points.reduce((s, p) => s + p[0], 0) / n
  const my = points.reduce((s, p) => s + p[1], 0) / n
  const mz = points.reduce((s, p) => s + p[2], 0) / n
  let sxx = 0; let syy = 0; let sxy = 0; let sxz = 0; let syz = 0
  for (const [x, y, z] of points) {
    const dx = x - mx; const dy = y - my; const dz = z - mz
    sxx += dx * dx; syy += dy * dy; sxy += dx * dy; sxz += dx * dz; syz += dy * dz
  }
  let b = 0
  let c = 0
  const det = sxx * syy - sxy * sxy
  if (det > 1e-12 * Math.max(1, sxx * syy)) {
    b = (sxz * syy - syz * sxy) / det
    c = (syz * sxx - sxz * sxy) / det
  } else if (sxx > 0 && sxx >= syy) {
    // The points lie on a line (one row, one column, or one point each way): fit the slope along it.
    b = sxz / sxx
  } else if (syy > 0) {
    c = syz / syy
  }
  const a = mz - b * mx - c * my

  const residuals = rows.map((row, r) => Array.from({ length: columns }, (_, k) => {
    const z = row?.[k]
    return typeof z === 'number' && Number.isFinite(z) ? z - (a + b * xs[k] + c * ys[r]) : NaN
  }))
  const finite = residuals.flat().filter(Number.isFinite)
  const min = Math.min(...finite)
  const max = Math.max(...finite)
  const tilt = Math.abs(b) * (xs[xs.length - 1] - xs[0]) + Math.abs(c) * (ys[ys.length - 1] - ys[0])
  return { residuals, xs, ys, min, max, range: max - min, plane: { a, b, c }, tilt }
}

/** Shapes flatter than this are drawn as if this high, so a near-perfect plate isn't blown up into noise. */
const SMALLEST_SHOWN_MM = 0.005

/** The most the height is ever stretched. */
const MOST_STRETCH = 10000

/** Round steps for the stretch, so the number on screen is one people can read at a glance. */
const STEPS = [1, 1.5, 2, 3, 5, 7]

/**
 * How many times to stretch the height so a shape `range` mm high to low
 * stands `fraction` of the plate's shorter side tall: rounded down to a
 * round number (1, 1.5, 2, 3, 5 or 7, times a power of ten), at least 1.
 */
export function heightStretch (range: number, shorterSide: number, fraction = 0.3): number {
  if (!(shorterSide > 0) || !(fraction > 0)) return 1
  const ideal = shorterSide * fraction / Math.max(SMALLEST_SHOWN_MM, Number.isFinite(range) ? range : 0)
  if (ideal <= 1) return 1
  const decade = Math.pow(10, Math.floor(Math.log10(ideal)))
  // Largest round step not above the ideal; a hair of slack absorbs floating point.
  const step = [...STEPS].reverse().find(s => s * decade <= ideal * (1 + 1e-9)) ?? 1
  return Math.min(MOST_STRETCH, step * decade)
}

/** A residual in microns, signed: "+42 µm", "−8 µm", "0 µm". */
export function microns (mm: number): string {
  const um = Math.round(mm * 1000)
  if (um === 0) return '0 µm'
  return `${um > 0 ? '+' : '−'}${Math.abs(um)} µm`
}
