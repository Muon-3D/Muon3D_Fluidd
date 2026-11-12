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
 * hand move Control's mounted pages send (ControlMixin's moveBy / moveTo, the
 * probe check) goes through `planMove`, which reads the regions the printer
 * declares (never a hard-coded copy) and either lifts to the traverse height
 * before crossing, or refuses. (Upstream Fluidd's toolhead widgets, which
 * send moves directly, are no longer mounted by any page.)
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

/**
 * The last hand move sent on a printer with no-go regions, shared by every
 * component (Overview's tiles and Control's cards all move the same head), so
 * the next move is planned from where the head will be, not from a position
 * the printer hasn't updated yet. `target` is in G-code coordinates, which
 * Klipper reports exactly (no mesh or skew in them).
 */
export const handMoveLock: { target: number[] | null, until: number, printer: string } = { target: null, until: 0, printer: '' }

/**
 * How long a hand move's wait lasts at most. Expiring while the head is
 * still physically moving is fine: the lock is about the COMMANDED position
 * (toolhead.position moves to the target when Klipper queues the move), so a
 * move sent after it is planned from the commanded end position and Klipper
 * queues it behind the one still running (see `ownMotion` below, KAN-2120).
 */
export const SETTLE_MS = 8000

/** Added to a move's own travel time before its lock expires, ms. */
export const SETTLE_MARGIN_MS = 3000

/**
 * How long a hand move's lock lasts: SETTLE_MS, or the move's travel time
 * (distance ÷ speed, `travelMs`) plus SETTLE_MARGIN_MS when that is longer,
 * so a slow jog or a lift across the notch isn't treated as landed while
 * the head is still on its way.
 */
export function settleMs (travelMs = 0): number {
  return Number.isFinite(travelMs) && travelMs > 0 ? Math.max(SETTLE_MS, Math.ceil(travelMs) + SETTLE_MARGIN_MS) : SETTLE_MS
}

/**
 * G-code scripts sent and not yet answered. Klipper runs scripts in order,
 * so a hand move sent behind one (homing, the probe check, a macro, another
 * jog) would run from wherever that one leaves the head, not from the
 * position it was planned from. Counted in SocketActions.printerGcodeScript;
 * an answer, an error or a dropped connection all end a script.
 */
export const scriptsInFlight = { count: 0 }

export function trackScript (answer: Promise<unknown> | undefined) {
  if (!answer) return
  scriptsInFlight.count++
  const done = () => { scriptsInFlight.count = Math.max(0, scriptsInFlight.count - 1) }
  answer.then(done, done)
}

/**
 * Whether the reported head position is this connection's. False until the
 * printer's status subscription answers, and again from a dropped connection
 * or lost control until it answers again: in between, Control keeps the last
 * position it was told, which may no longer be where the head is.
 */
export const headStatus = { fresh: false }

/**
 * Note a hand move to `gcodeTarget` on `printer` (any key naming the printer
 * and session). Released by: the printer reporting the head there, SETTLE_MS
 * passing (a move Klipper refuses never arrives; there is no per-script error
 * to hook), control being lost (`releaseHandMove`), or another printer.
 */
export function lockHandMove (gcodeTarget: number[], printer: string, now = Date.now(), travelMs = 0) {
  handMoveLock.target = gcodeTarget.slice(0, 3)
  handMoveLock.until = now + settleMs(travelMs)
  handMoveLock.printer = printer
}

export function releaseHandMove () {
  handMoveLock.target = null
  ownMotion.until = 0
}

/**
 * KAN-2120: the window in which the printer's "busy" is this page's own hand
 * move. Klipper's idle_timeout reads Printing while ANY G-code runs, a jog
 * included, so "busy" alone cannot tell a hand move from a print or a macro.
 * A hand move sets this for its travel time plus the settle margin (the same
 * `settleMs` as the lock above); unlike the lock it is not cleared when the
 * commanded position arrives, because the head is still physically moving
 * then and idle_timeout still says Printing. Only a real print
 * (print_stats printing or paused) locks the move controls; a busy printer
 * outside this window (homing, a macro, another client) still refuses moves.
 */
export const ownMotion: { printer: string, until: number } = { printer: '', until: 0 }

export function noteOwnMotion (printer: string, now = Date.now(), travelMs = 0): number {
  const ms = settleMs(travelMs)
  ownMotion.printer = printer
  ownMotion.until = now + ms
  return ms
}

/** Is the printer's current busy this page's own hand move on `printer`? */
export function ownMotionActive (printer: string, now = Date.now()): boolean {
  return ownMotion.printer === printer && now < ownMotion.until
}

/** Is the last hand move on `printer` still on its way? Clears itself on arrival, after SETTLE_MS, or for another printer. */
export function handMoveSettling (gcodePosition: number[] | undefined, printer: string, now = Date.now()): boolean {
  const target = handMoveLock.target
  if (!target) return false
  if (printer !== handMoveLock.printer) { handMoveLock.target = null; return false }
  const arrived = Array.isArray(gcodePosition) && target.every((v, i) => Math.abs(Number(gcodePosition[i]) - v) < 0.02)
  if (arrived || now > handMoveLock.until) { handMoveLock.target = null; return false }
  return true
}

const round = (v: number) => Math.round(v * 1000) / 1000

/**
 * Plan an absolute move of the head to `to`.
 *
 * Everything here is in TOOLHEAD coordinates: the real place of the nozzle,
 * the frame Klipper's own no-go handling uses. The caller converts to G-code
 * coordinates (minus the mesh and G-code offsets) to send.
 *
 * `margin` is how much the real height can differ between where the head is
 * and the region it crosses: the span of the active bed mesh. Crossing
 * heights and the "high enough already" check add it, so a lift judged here
 * still clears the notch where the mesh is lower.
 *
 * A single straight move is returned whenever it is safe, so ordinary jogs
 * are unchanged. A low path through a region (or its tolerance band) becomes
 * up to the crossing height, across, then down to `to.z`. Raising Z alone is
 * always allowed, even when the regions cannot be read: it is the way out.
 */
export function planMove (
  from: { x: number, y: number, z: number },
  to: { x: number, y: number, z: number },
  noGo: NoGoConfig | null | 'invalid',
  limits: Limits,
  margin = 0
): MovePlan {
  const known = (vs: number[]) => vs.every(Number.isFinite)
  if (!known([to.x, to.y, to.z])) return { ok: false, reason: 'The head position is not known.' }
  for (let i = 0; i < 3; i++) {
    const v = [to.x, to.y, to.z][i]
    if (v < limits.min[i] || v > limits.max[i]) return { ok: false, reason: 'That spot is outside the machine.' }
  }
  if (noGo === null) return { ok: true, steps: [{ X: round(to.x), Y: round(to.y), Z: round(to.z) }], lifted: false }
  if (!known([from.x, from.y, from.z, margin]) || margin < 0) return { ok: false, reason: 'The head position is not known.' }
  const movesXY = round(to.x) !== round(from.x) || round(to.y) !== round(from.y)
  const target: Place = movesXY ? { X: round(to.x), Y: round(to.y), Z: round(to.z) } : { Z: round(to.z) }
  const direct: MovePlan = { ok: true, steps: [target], lifted: false }
  if (!movesXY && to.z >= from.z) return direct

  if (noGo === 'invalid') {
    return { ok: false, reason: 'The printer’s no-go regions could not be read, so Control will only raise the head. Check [bed_mesh] in printer.cfg.' }
  }

  const clear = noGo.traverseZ + margin
  // Ending low inside a region is refused outright; the tolerance band only
  // makes the crossing check more cautious.
  if (to.z < clear && noGo.regions.some(r => inside(to.x, to.y, r, 0))) {
    return { ok: false, reason: `That spot is over the bed notch. Raise Z to ${round(clear)} mm first.` }
  }
  if (!movesXY) return direct

  // A combined move changes Z along the way, so judge it at its lowest point.
  const lowest = Math.min(from.z, to.z)
  const crosses = noGo.regions.some(r => segmentHits([from.x, from.y], [to.x, to.y], r, noGo.tolerance))
  if (lowest >= clear || !crosses) return direct

  const over = Math.max(clear, to.z)
  if (over > limits.max[2]) return { ok: false, reason: 'The safe crossing height is above the Z limit.' }
  const steps: Place[] = [{ Z: round(over) }, { X: round(to.x), Y: round(to.y) }]
  if (to.z < over) steps.push({ Z: round(to.z) })
  return { ok: true, steps, lifted: true }
}

/** How far the active mesh's heights spread: the margin a crossing needs. 0 with no mesh active. */
export function meshSpan (bedMesh: { profile_name?: string, mesh_matrix?: number[][] } | undefined | null): number {
  if (!bedMesh?.profile_name || !Array.isArray(bedMesh.mesh_matrix)) return 0
  const values = bedMesh.mesh_matrix.flat().map(Number).filter(Number.isFinite)
  return values.length ? Math.max(...values) - Math.min(...values) : 0
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

/**
 * Why a Z-offset nudge of `by` mm (SET_GCODE_OFFSET … MOVE=1, which moves
 * the head) must not be sent with the head idle at `head`, or ''. Raising is
 * always allowed. Lowering is refused when the regions can't be read, and
 * when the head is over a region (or its tolerance band) and would end below
 * the crossing height. `margin` is the active mesh's spread, as in planMove.
 */
export function zNudgeRefusal (
  head: { x: number, y: number, z: number },
  by: number,
  noGo: NoGoConfig | null | 'invalid',
  margin = 0
): string {
  if (!(by < 0) || noGo === null) return ''
  if (noGo === 'invalid') return 'The printer’s no-go regions could not be read, so the nozzle will only be raised. Check [bed_mesh] in printer.cfg.'
  if (![head.x, head.y, head.z, margin].every(Number.isFinite)) return 'The head position is not known.'
  const clear = noGo.traverseZ + margin
  const over = noGo.regions.some(r => inside(head.x, head.y, r, noGo.tolerance))
  if (over && head.z + by < clear) return `The head is over the bed notch. Move it away, or raise Z to ${round(clear)} mm, before lowering the nozzle.`
  return ''
}
