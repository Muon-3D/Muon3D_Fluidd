/**
 * The head's position as it should be drawn: smooth and predictive, never a
 * jump every status update.
 *
 * Klipper reports the head a few times a second (motion_report.live_position
 * and live_velocity), and the place it was last sent to (toolhead.position,
 * the commanded end of the queued moves). Between reports this extrapolates
 * from the last report toward the commanded target at the reported speed,
 * never past the target; with no target known it carries on along the last
 * seen direction for a short horizon only. Each new report is eased into
 * over `easeMs` from where the drawing was, so a correction never jumps, and
 * a report too far from the drawing (homing, a reconnect, another printer)
 * is snapped to at once.
 *
 * Pure: time is passed in, so it is tested without a browser. The
 * `PredictionLoop` below drives it with requestAnimationFrame, only while the
 * page is visible and only while something is still moving.
 *
 * Used by Control's Movement tile (the trackpad head and the readouts) and
 * exported for anything else that draws the head (Overview, the 3D view).
 */

export type Vec3 = [number, number, number]

export interface PositionReport {
  /** Where the printer says the head is now (motion_report.live_position), mm. */
  position: ArrayLike<number>
  /** Its speed, mm/s (motion_report.live_velocity). Unknown or 0: no extrapolation. */
  velocity?: number | null
  /** Where it is going (toolhead.position, the commanded end), when known. */
  target?: ArrayLike<number> | null
  /** When the report arrived, ms (performance.now() or Date.now(), the same clock as `at`). */
  at: number
}

export interface PredictOptions {
  /** A report further than this from the drawing is snapped to, not eased, mm. */
  snapDistance?: number
  /** How long easing into a new report takes (time constant), ms. */
  easeMs?: number
  /** With no target, how long to keep extrapolating along the last direction, ms. */
  horizonMs?: number
}

const DEFAULTS: Required<PredictOptions> = { snapDistance: 40, easeMs: 90, horizonMs: 250 }

const vec = (a: ArrayLike<number> | null | undefined): Vec3 | null => {
  if (!a || a.length < 3) return null
  const v: Vec3 = [Number(a[0]), Number(a[1]), Number(a[2])]
  return v.every(Number.isFinite) ? v : null
}
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2])
const along = (a: Vec3, dir: Vec3, d: number): Vec3 => [a[0] + dir[0] * d, a[1] + dir[1] * d, a[2] + dir[2] * d]
const lerp = (a: Vec3, b: Vec3, k: number): Vec3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]

export class PositionPredictor {
  private readonly opts: Required<PredictOptions>
  private last: { position: Vec3, velocity: number, target: Vec3 | null, at: number, dir: Vec3 | null } | null = null
  /** Where the drawing was when the last report arrived: the start of the ease. */
  private from: Vec3 | null = null

  constructor (options: PredictOptions = {}) {
    this.opts = { ...DEFAULTS, ...options }
  }

  /** Forget everything: the next report is drawn as it is (a printer switch). */
  reset () {
    this.last = null
    this.from = null
  }

  /** A new report from the printer. Ignored when its position isn't three numbers. */
  report (r: PositionReport) {
    const position = vec(r.position)
    if (!position || !Number.isFinite(r.at)) return
    const shown = this.last ? this.at(r.at) : null
    const prev = this.last
    const velocity = Number(r.velocity)
    // The direction of travel: toward the target when there is one, else the way it last went.
    let dir: Vec3 | null = null
    const target = vec(r.target ?? null)
    if (target && len(sub(target, position)) > 1e-3) {
      const d = sub(target, position)
      dir = along([0, 0, 0], d, 1 / len(d))
    } else if (prev && len(sub(position, prev.position)) > 1e-3) {
      const d = sub(position, prev.position)
      dir = along([0, 0, 0], d, 1 / len(d))
    }
    this.last = { position, velocity: Number.isFinite(velocity) && velocity > 0 ? velocity : 0, target, at: r.at, dir }
    this.from = shown && len(sub(shown, position)) <= this.opts.snapDistance ? shown : position
  }

  /** Where the printer's report says the head is at `now`, before easing: extrapolated, never past the target. */
  predicted (now: number): Vec3 | null {
    const l = this.last
    if (!l) return null
    const dt = Math.max(0, now - l.at)
    if (!l.dir || !l.velocity) return l.position
    if (l.target) {
      const remaining = len(sub(l.target, l.position))
      return along(l.position, l.dir, Math.min(remaining, l.velocity * dt / 1000))
    }
    return along(l.position, l.dir, l.velocity * Math.min(dt, this.opts.horizonMs) / 1000)
  }

  /** Where to draw the head at `now`: the prediction, eased into from where the drawing was. */
  at (now: number): Vec3 | null {
    const p = this.predicted(now)
    if (!p || !this.last || !this.from) return p
    const k = 1 - Math.exp(-Math.max(0, now - this.last.at) / this.opts.easeMs)
    return lerp(this.from, p, k)
  }

  /** Nothing more to animate until the next report: the ease is done and the prediction has stopped (at the target, or past its horizon). */
  settled (now: number, epsilon = 0.005): boolean {
    const l = this.last
    const shown = this.at(now)
    const p = this.predicted(now)
    if (!l || !shown || !p) return true
    if (len(sub(shown, p)) >= epsilon) return false
    if (!l.dir || !l.velocity) return true
    if (l.target) return len(sub(p, l.target)) < epsilon
    return now - l.at >= this.opts.horizonMs
  }
}

type Frame = (cb: (t: number) => void) => number

/**
 * Calls `draw(now)` once a frame while it is running and the page is
 * visible; stops itself when `draw` returns false (settled), and is started
 * again by `wake()` (a new report). Hidden tabs draw nothing.
 */
export class PredictionLoop {
  private handle: number | null = null
  private stopped = false
  private readonly onVisibility = () => this.wake()

  constructor (
    private readonly draw: (now: number) => boolean,
    private readonly raf: Frame = (cb) => typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(cb) : window.setTimeout(() => cb(performance.now()), 16),
    private readonly caf: (h: number) => void = (h) => typeof window.cancelAnimationFrame === 'function' ? window.cancelAnimationFrame(h) : window.clearTimeout(h),
    private readonly doc: Document | null = typeof document === 'undefined' ? null : document
  ) {
    this.doc?.addEventListener('visibilitychange', this.onVisibility)
  }

  get running (): boolean {
    return this.handle !== null
  }

  private visible (): boolean {
    return !this.doc || this.doc.visibilityState !== 'hidden'
  }

  /** Start drawing (again), if it isn't already and the page can be seen. */
  wake () {
    if (this.stopped || this.handle !== null || !this.visible()) return
    const frame = (now: number) => {
      this.handle = null
      if (this.stopped || !this.visible()) return
      if (this.draw(now)) this.handle = this.raf(frame)
    }
    this.handle = this.raf(frame)
  }

  /** For good: on destroy. */
  stop () {
    this.stopped = true
    if (this.handle !== null) this.caf(this.handle)
    this.handle = null
    this.doc?.removeEventListener('visibilitychange', this.onVisibility)
  }
}
