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
 * declares (never a hard-coded copy). No keys, no notch.
 *
 * The rule is Klipper's (bed_mesh._move_to_next_probe lifts when toolhead
 * Z < no_go_traverse_z; muon_guard refuses a client move across the notch
 * below it): the notch only matters while the plate is within notch height,
 * toolhead Z below `no_go_traverse_z`. Then a move ending over the notch is
 * refused and one crossing it lifts over; higher up, moves are free. The zone
 * is the notch itself: `no_go_boundary_tolerance` is bed_mesh's probe-snapping
 * distance, not part of it. While Z is not homed the plate height is unknown,
 * so it counts as within notch height. (Upstream Fluidd's toolhead widgets,
 * which send moves directly, are no longer mounted by any page.)
 */

export interface NoGoRegion {
  min: [number, number]
  max: [number, number]
}

export interface NoGoConfig {
  regions: NoGoRegion[]
  /** bed_mesh's probe-snapping distance, mm. Not part of the notch. */
  tolerance: number
  /** Notch height: below this toolhead Z the nozzle must not be inside a region. */
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
 * Extra room kept around every notch region, mm, for the crossing, end and
 * Z-nudge checks. Control is the ONLY guard on these hand moves today: the
 * Klipper-side notch check (muon_guard, Klipper PR #117, KAN-1731) is not
 * merged. This stays until that is merged and checked on a real M1; the
 * printer's no_go_boundary_tolerance (10 mm on the M1) is bed_mesh's
 * probe-snapping distance, not a guard, and is not used here.
 */
export const NOTCH_MARGIN_MM = 2

/**
 * The no-go regions from `configfile.settings.bed_mesh`, or null when the
 * printer declares none. Every `no_go_region_N_min/max` pair present is read,
 * whatever its numbering. A region that does not parse (or has only one
 * corner) makes the whole config unusable rather than silently dropped:
 * moves then only raise the head. When regions exist but `no_go_traverse_z`
 * is missing or not above 0, the notch height is unknown, so every height
 * counts as within it (traverseZ is Infinity: nothing crosses or ends low
 * over a region).
 */
export function readNoGo (bedMesh: Record<string, unknown> | undefined | null): NoGoConfig | null | 'invalid' {
  if (!bedMesh) return null
  const numbers = new Set<number>()
  for (const key of Object.keys(bedMesh)) {
    const m = /^no_go_region_(\d+)_(min|max)$/.exec(key)
    if (m && bedMesh[key] !== undefined) numbers.add(Number(m[1]))
  }
  const regions: NoGoRegion[] = []
  for (const n of [...numbers].sort((a, b) => a - b)) {
    const min = pair(bedMesh[`no_go_region_${n}_min`])
    const max = pair(bedMesh[`no_go_region_${n}_max`])
    if (!min || !max) return 'invalid'
    regions.push({
      min: [Math.min(min[0], max[0]), Math.min(min[1], max[1])],
      max: [Math.max(min[0], max[0]), Math.max(min[1], max[1])]
    })
  }
  if (!regions.length) return null
  const tolerance = Number(bedMesh.no_go_boundary_tolerance ?? 0)
  const rawZ = bedMesh.no_go_traverse_z
  const z = rawZ === null || rawZ === undefined || (typeof rawZ === 'string' && rawZ.trim() === '') ? NaN : Number(rawZ)
  const traverseZ = Number.isFinite(z) && z > 0 ? z : Infinity
  if (!Number.isFinite(tolerance) || tolerance < 0) return 'invalid'
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
  ownMotion.path = []
}

/**
 * KAN-2120: the window in which the printer's "busy" is this page's own hand
 * move. Klipper's idle_timeout reads Printing while ANY G-code runs, a jog
 * included, so "busy" alone cannot tell a hand move from a print or a macro.
 *
 * Kept as narrow as it can be, so a macro started elsewhere (the panel,
 * another client, the console, the printer itself) is never mistaken for it:
 * - it only starts when the printer was NOT busy as the move was sent (a move
 *   sent while it is busy never starts or extends it);
 * - it lasts the move's own travel time plus OWN_MOTION_MARGIN_MS, no more;
 * - it ends at the first busy -> not busy change after the move
 *   (`endOwnMotion`, from ControlMixin), so a later busy is never "ours".
 * Only a real print (print_stats printing or paused) says "printing"; a busy
 * printer outside this window still refuses every hand move.
 */
export const ownMotion: { printer: string, until: number, path: number[][] } = { printer: '', until: 0, path: [] }

/** Slack on top of a hand move's travel time for the printer to report it finished, ms. */
export const OWN_MOTION_MARGIN_MS = 2000

/**
 * Start the window for a hand move just sent from `from` to `target` (both commanded, G-code coordinates, X Y Z).
 * Returns its length, ms (0 when it didn't start). A move sent while the printer is busy never opens or extends the
 * window, but when it is this page's re-target inside an open window its target joins the window's path.
 */
export function noteOwnMotion (printer: string, now = Date.now(), travelMs = 0, printerWasIdle = true, target?: number[], from?: number[]): number {
  if (!printerWasIdle) {
    if (target && ownMotion.printer === printer && now < ownMotion.until && ownMotion.path.length) ownMotion.path.push(target.slice(0, 3))
    return 0
  }
  const ms = (Number.isFinite(travelMs) && travelMs > 0 ? Math.ceil(travelMs) : 0) + OWN_MOTION_MARGIN_MS
  ownMotion.printer = printer
  ownMotion.until = now + ms
  ownMotion.path = target ? [...(from ? [from.slice(0, 3)] : []), target.slice(0, 3)] : []
  return ms
}

/** The printer stopped being busy: whatever it does next is not this page's move. */
export function endOwnMotion () {
  ownMotion.until = 0
  ownMotion.path = []
}

/** How close, mm, the printer's commanded position must be to this page's target to be its own move. */
export const OWN_MOTION_TOLERANCE_MM = 0.01

/**
 * Is the printer's current busy this page's own hand move on `printer`? Inside the window that is only so while the
 * printer's commanded position (`commanded`, G-code coordinates) is a point on this page's own path: where its first
 * move started (until the printer reports the new commanded position) or one of its targets. A macro or another client
 * that moves the head anywhere else inside the window (the panel's park, a G28, filament auto-load) is not ours
 * (Opus review of #392 with #399). With a path recorded and no commanded position to check, it is not ours either.
 */
export function ownMotionActive (printer: string, now = Date.now(), commanded?: number[]): boolean {
  if (ownMotion.printer !== printer || now >= ownMotion.until) return false
  if (!ownMotion.path.length) return true
  if (!commanded) return false
  const at = (p: number[]) => p.every((v, i) => Number.isFinite(Number(commanded[i])) && Math.abs(v - Number(commanded[i])) < OWN_MOTION_TOLERANCE_MM)
  return ownMotion.path.some(at)
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
 * are unchanged. A low path through the notch becomes up to the crossing
 * height, across, then down to `to.z`. Raising Z alone is always allowed,
 * even when the regions cannot be read: it is the way out. With `zHomed`
 * false the plate height is unknown, so any path into or across the notch is
 * refused (there is no height to lift to).
 */
export function planMove (
  from: { x: number, y: number, z: number },
  to: { x: number, y: number, z: number },
  noGo: NoGoConfig | null | 'invalid',
  limits: Limits,
  margin = 0,
  zHomed = true,
  xyHomed = true
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
    return { ok: false, reason: 'The printer’s notch could not be read, so Control will only raise the head. Check [bed_mesh] in printer.cfg.' }
  }

  // X or Y not homed: the head's place is unknown, so it may be over the notch and low. Only raising Z (above) goes.
  if (!xyHomed) return { ok: false, reason: 'Home X and Y first: until the head’s place is known, Control keeps it off the notch.' }

  const pad = NOTCH_MARGIN_MM
  if (!zHomed) {
    const touches = noGo.regions.some(r => inside(to.x, to.y, r, pad) || (movesXY && segmentHits([from.x, from.y], [to.x, to.y], r, pad)))
    return touches ? { ok: false, reason: 'Home Z first: until the plate height is known, the head stays off the notch.' } : direct
  }

  const clear = noGo.traverseZ + margin
  if (to.z < clear && noGo.regions.some(r => inside(to.x, to.y, r, pad))) {
    return { ok: false, reason: Number.isFinite(clear) ? `That spot is over the bed notch. Raise Z to ${round(clear)} mm first.` : 'That spot is over the bed notch, and the printer doesn’t say the notch height (no_go_traverse_z), so the head stays off it.' }
  }
  if (!movesXY) return direct

  // A combined move changes Z along the way, so judge it at its lowest point.
  const lowest = Math.min(from.z, to.z)
  const crosses = noGo.regions.some(r => segmentHits([from.x, from.y], [to.x, to.y], r, pad))
  if (lowest >= clear || !crosses) return direct

  const over = Math.max(clear, to.z)
  if (!Number.isFinite(over)) return { ok: false, reason: 'That path crosses the bed notch, and the printer doesn’t say the notch height (no_go_traverse_z), so the head goes around it.' }
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
  limits: Limits,
  zHomed = true,
  xyHomed = true
): MovePlan {
  const plan = planMove(from, { x: to.x, y: to.y, z: from.z }, noGo, limits, 0, zHomed, xyHomed)
  if (plan.ok && !plan.lifted) return { ok: true, steps: [{ X: plan.steps[0].X, Y: plan.steps[0].Y }], lifted: false }
  return plan
}

/**
 * Why a Z-offset nudge of `by` mm (SET_GCODE_OFFSET … MOVE=1, which moves
 * the head) must not be sent with the head idle at `head`, or ''. Raising is
 * always allowed. Lowering is refused when the regions can't be read, and
 * when the head is over the notch and would end below
 * the crossing height. `margin` is the active mesh's spread, as in planMove.
 */
export function zNudgeRefusal (
  head: { x: number, y: number, z: number },
  by: number,
  noGo: NoGoConfig | null | 'invalid',
  margin = 0,
  xyHomed = true
): string {
  if (!(by < 0) || noGo === null) return ''
  // X or Y not homed: the head may be over the notch, so only raising goes (as planMove).
  if (noGo !== 'invalid' && !xyHomed) return 'Home X and Y first: until the head’s place is known, the nozzle will only be raised.'
  if (noGo === 'invalid') return 'The printer’s notch could not be read, so the nozzle will only be raised. Check [bed_mesh] in printer.cfg.'
  if (![head.x, head.y, head.z, margin].every(Number.isFinite)) return 'The head position is not known.'
  const clear = noGo.traverseZ + margin
  const over = noGo.regions.some(r => inside(head.x, head.y, r, NOTCH_MARGIN_MM))
  if (over && head.z + by < clear) return Number.isFinite(clear) ? `The head is over the bed notch. Move it away, or raise Z to ${round(clear)} mm, before lowering the nozzle.` : 'The head is over the bed notch. Move it away before lowering the nozzle.'
  return ''
}
