/**
 * Safe moves for hand jogging and the trackpad.
 *
 * The M1 bed has a notch the nozzle must not cross low down. The printer
 * declares it in `[bed_mesh]`:
 *
 *     no_go_region_1_min: 75, 0
 *     no_go_region_1_max: 125, 34
 *     no_go_boundary_tolerance: 10
 *     no_go_traverse_z: 6
 *
 * bed_mesh honours it itself; a plain `G1 X.. Y..` from the UI does not. Every
 * XY move Control sends goes through `planXYMove`, which reads the regions the
 * printer declares (never a hard-coded copy) and either lifts to the traverse
 * height before crossing, or refuses.
 */

export interface NoGoRegion {
  min: [number, number]
  max: [number, number]
}

export interface NoGoConfig {
  regions: NoGoRegion[]
  /** Padding around every region, mm. */
  tolerance: number
  /** Below this Z the nozzle must not be inside a region. */
  traverseZ: number
}

export interface Limits {
  min: [number, number, number]
  max: [number, number, number]
}

export interface Place { X?: number, Y?: number, Z?: number }

export type MovePlan =
  | { ok: true, steps: Place[], lifted: boolean }
  | { ok: false, reason: string }

const pair = (value: unknown): [number, number] | null => {
  const parts = Array.isArray(value)
    ? value
    : typeof value === 'string' ? value.split(',') : null
  if (!parts || parts.length !== 2) return null
  const nums = parts.map(p => Number(typeof p === 'string' ? p.trim() : p))
  return nums.every(Number.isFinite) ? [nums[0], nums[1]] : null
}

/**
 * The no-go regions from `configfile.settings.bed_mesh`, or null when the
 * printer declares none. A region that does not parse makes the whole config
 * unusable rather than silently dropped: `planXYMove` then refuses low moves.
 */
export function readNoGo (bedMesh: Record<string, unknown> | undefined | null): NoGoConfig | null | 'invalid' {
  if (!bedMesh) return null
  const regions: NoGoRegion[] = []
  for (let n = 1; n < 100; n++) {
    const rawMin = bedMesh[`no_go_region_${n}_min`]
    const rawMax = bedMesh[`no_go_region_${n}_max`]
    if (rawMin === undefined && rawMax === undefined) break
    const min = pair(rawMin)
    const max = pair(rawMax)
    if (!min || !max) return 'invalid'
    regions.push({
      min: [Math.min(min[0], max[0]), Math.min(min[1], max[1])],
      max: [Math.max(min[0], max[0]), Math.max(min[1], max[1])]
    })
  }
  if (!regions.length) return null
  const tolerance = Number(bedMesh.no_go_boundary_tolerance ?? 0)
  const traverseZ = Number(bedMesh.no_go_traverse_z)
  if (!Number.isFinite(tolerance) || tolerance < 0 || !Number.isFinite(traverseZ)) return 'invalid'
  return { regions, tolerance, traverseZ }
}

const inside = (x: number, y: number, r: NoGoRegion, pad: number) =>
  x >= r.min[0] - pad && x <= r.max[0] + pad && y >= r.min[1] - pad && y <= r.max[1] + pad

/** Does the straight segment aâ†’b touch the region grown by `pad`? (Liangâ€“Barsky) */
export function segmentHits (a: [number, number], b: [number, number], r: NoGoRegion, pad: number): boolean {
  const xmin = r.min[0] - pad
  const xmax = r.max[0] + pad
  const ymin = r.min[1] - pad
  const ymax = r.max[1] + pad
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  let t0 = 0
  let t1 = 1
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0
    const t = q / p
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t } else { if (t < t0) return false; if (t < t1) t1 = t }
    return true
  }
  return clip(-dx, a[0] - xmin) && clip(dx, xmax - a[0]) && clip(-dy, a[1] - ymin) && clip(dy, ymax - a[1])
}

const round = (v: number) => Math.round(v * 1000) / 1000

/**
 * Plan an absolute move of the head to `to`.
 *
 * `from.z` must be the LOWEST of the head's known heights (toolhead and gcode
 * position): with a mesh active the two differ, and the safe reading is the
 * lower one. `to.z` is the height to end at, in G-code coordinates; for an XY
 * move it is where the head is now.
 *
 * A single straight move is returned whenever it is safe, so ordinary jogs
 * are unchanged. A low path through a region (or its tolerance band) becomes
 * up to the traverse height, across, then down to `to.z`. Raising Z alone is
 * always allowed, even when the regions cannot be read: it is the way out.
 */
export function planMove (
  from: { x: number, y: number, z: number },
  to: { x: number, y: number, z: number },
  noGo: NoGoConfig | null | 'invalid',
  limits: Limits
): MovePlan {
  const known = (vs: number[]) => vs.every(Number.isFinite)
  if (!known([to.x, to.y, to.z])) return { ok: false, reason: 'The head position is not known.' }
  for (let i = 0; i < 3; i++) {
    const v = [to.x, to.y, to.z][i]
    if (v < limits.min[i] || v > limits.max[i]) return { ok: false, reason: 'That spot is outside the machine.' }
  }
  if (noGo === null) return { ok: true, steps: [{ X: round(to.x), Y: round(to.y), Z: round(to.z) }], lifted: false }
  if (!known([from.x, from.y, from.z])) return { ok: false, reason: 'The head position is not known.' }
  const movesXY = round(to.x) !== round(from.x) || round(to.y) !== round(from.y)
  const target: Place = movesXY ? { X: round(to.x), Y: round(to.y), Z: round(to.z) } : { Z: round(to.z) }
  const direct: MovePlan = { ok: true, steps: [target], lifted: false }
  if (!movesXY && to.z >= from.z) return direct

  if (noGo === 'invalid') {
    return { ok: false, reason: 'The printer’s no-go regions could not be read, so Control will only raise the head. Check [bed_mesh] in printer.cfg.' }
  }

  // Ending low inside a region is refused outright; the tolerance band only
  // makes the crossing check more cautious.
  if (to.z < noGo.traverseZ && noGo.regions.some(r => inside(to.x, to.y, r, 0))) {
    return { ok: false, reason: `That spot is over the bed notch. Raise Z to ${noGo.traverseZ} mm first.` }
  }
  if (!movesXY) return direct

  // A combined move changes Z along the way, so judge it at its lowest point.
  const lowest = Math.min(from.z, to.z)
  const crosses = noGo.regions.some(r => segmentHits([from.x, from.y], [to.x, to.y], r, noGo.tolerance))
  if (lowest >= noGo.traverseZ || !crosses) return direct

  const over = Math.max(noGo.traverseZ, to.z)
  if (over > limits.max[2]) return { ok: false, reason: 'The safe crossing height is above the Z limit.' }
  const steps: Place[] = [{ Z: round(over) }, { X: round(to.x), Y: round(to.y) }]
  if (to.z < over) steps.push({ Z: round(to.z) })
  return { ok: true, steps, lifted: true }
}

/** An XY move that ends at the height it started. */
export function planXYMove (
  from: { x: number, y: number, z: number },
  to: { x: number, y: number },
  noGo: NoGoConfig | null | 'invalid',
  limits: Limits
): MovePlan {
  const plan = planMove(from, { x: to.x, y: to.y, z: from.z }, noGo, limits)
  if (plan.ok && !plan.lifted) return { ok: true, steps: [{ X: plan.steps[0].X, Y: plan.steps[0].Y }], lifted: false }
  return plan
}
