/**
 * Live drag: the real head follows a drag, one planned move at a time.
 *
 * Shared by Control's trackpad and the 3D view's drag. A drag gives targets
 * as the pointer moves; this sends them through the host's planned move
 * (ControlMixin.moveTo: the no-go planner, the homed and printing gates, the
 * shared hand-move lock and the wait for scripts in flight), and never more
 * than one at a time:
 *
 * - **One in flight.** While the last move hasn't landed (the host says
 *   `waiting()`), only the latest target is kept; it is sent when the wait
 *   ends. Nothing queues up.
 * - **Rate cap.** At most one send per `minIntervalMs` (150 ms: under 7 a
 *   second).
 * - **Refused: stop.** When a step is refused (low over the notch, unhomed,
 *   printing, outside the machine), following stops, `onRefused(reason)` is
 *   called, and nothing more is sent, not even a later point. A step that
 *   crosses the notch low is lifted, crossed and lowered by the planner.
 * - **Release** sends the final target once, if it differs from the last
 *   one sent, then stops.
 * - **Cancel** stops at once and sends nothing more (pointer-cancel, focus
 *   lost, another printer, homing lost, a print starting: the caller calls it).
 *
 * Targets are in G-code coordinates, mm, what moveTo takes: the toolhead as
 * `{ X, Y }`, the plate as `{ Z }`. Fine jog buttons stay on moveBy/moveByXY.
 */

export type DragTarget = { X: number, Y: number } | { Z: number }

/** What the drag needs from the page: in Control, `controlDragHost(this)` on any ControlMixin component. */
export interface DragFollowHost {
  /** Why a move to `target` would be refused now, or '' when it would be sent. Not counting the wait. */
  refusal: (target: DragTarget) => string
  /** The last hand move or a script is still in flight: hold the target. */
  waiting: () => boolean
  /** Send a planned move to `target`. True when it was sent. */
  send: (target: DragTarget) => boolean
  /** Where the part is now, in the targets' coordinates: the first step is measured from it. */
  from?: () => DragTarget | null
}

export interface DragFollowOptions {
  /** Called once when following stops because a step was refused. */
  onRefused?: (reason: string) => void
  /** The least time between two sends, ms. */
  minIntervalMs?: number
  /** How often to look again while a move is in flight, ms. */
  pollMs?: number
  now?: () => number
  /** The longest one step may be, mm, for a target (0 or unset: no limit). */
  maxStep?: (target: DragTarget) => number
}

export const DRAG_MIN_INTERVAL_MS = 150
/** The longest step a drag sends, mm, so a step in flight (which Klipper cannot take back) is short. */
export const DRAG_STEP_MM = 3
const DRAG_STEP_MIN_MM = 0.5

/** About what the part covers at `speed` mm/s in one interval, kept within 0.5 and DRAG_STEP_MM. */
export function dragStepMm (speed: number): number {
  if (!Number.isFinite(speed) || speed <= 0) return DRAG_STEP_MIN_MM
  return Math.min(DRAG_STEP_MM, Math.max(DRAG_STEP_MIN_MM, speed * DRAG_MIN_INTERVAL_MS / 1000))
}

/** `to`, or the point `max` mm from `from` towards it if it is further. */
export function stepToward (from: DragTarget | null, to: DragTarget, max: number): DragTarget {
  if (!from || !(max > 0) || ('Z' in from) !== ('Z' in to)) return { ...to }
  if ('Z' in to && 'Z' in from) {
    const d = to.Z - from.Z
    return Math.abs(d) <= max ? { ...to } : { Z: Math.round((from.Z + Math.sign(d) * max) * 1000) / 1000 }
  }
  const a = from as { X: number, Y: number }
  const b = to as { X: number, Y: number }
  const d = Math.hypot(b.X - a.X, b.Y - a.Y)
  if (d <= max) return { ...b }
  const k = max / d
  return { X: Math.round((a.X + (b.X - a.X) * k) * 1000) / 1000, Y: Math.round((a.Y + (b.Y - a.Y) * k) * 1000) / 1000 }
}
const POLL_MS = 50

const same = (a: DragTarget | null, b: DragTarget | null): boolean => {
  if (!a || !b) return a === b
  const r = (v: number | undefined) => v === undefined ? undefined : Math.round(v * 1000)
  const pa = a as Record<string, number>
  const pb = b as Record<string, number>
  return ['X', 'Y', 'Z'].every(k => r(pa[k]) === r(pb[k]))
}

export class DragFollow {
  /** Called once when following stops because a step was refused. Settable after construction. */
  onRefused: (reason: string) => void
  private readonly minInterval: number
  private readonly pollMs: number
  private readonly now: () => number
  private readonly maxStep: (target: DragTarget) => number
  private active = false
  private releasing = false
  private latest: DragTarget | null = null
  private sent: DragTarget | null = null
  private sentAt = -Infinity
  private timer: ReturnType<typeof setTimeout> | null = null
  /** Sends made in this drag (for tests and the caller's display). */
  sends = 0

  constructor (private readonly host: DragFollowHost, options: DragFollowOptions = {}) {
    this.onRefused = options.onRefused ?? (() => undefined)
    this.minInterval = options.minIntervalMs ?? DRAG_MIN_INTERVAL_MS
    this.pollMs = options.pollMs ?? POLL_MS
    this.now = options.now ?? (() => Date.now())
    this.maxStep = options.maxStep ?? (() => 0)
  }

  /** A drag is following (started, not yet finished, refused or cancelled). */
  get following (): boolean {
    return this.active
  }

  /** The last target sent in this drag, or null. */
  get lastSent (): DragTarget | null {
    return this.sent
  }

  /** A drag begins at `target`. A drag already following carries on to it. */
  start (target: DragTarget) {
    if (!this.active) {
      this.active = true
      this.releasing = false
      this.sent = null
      this.sends = 0
    }
    this.update(target)
  }

  /** The pointer moved: the newest target replaces any not yet sent. */
  update (target: DragTarget) {
    if (!this.active || this.releasing) return
    this.latest = { ...target }
    this.pump()
  }

  /** The pointer is up: send the final target once (if it isn't the last sent), then stop. */
  release () {
    if (!this.active) return
    this.releasing = true
    this.pump()
  }

  /** Stop now. Nothing more is sent. */
  cancel () {
    this.stop()
  }

  private stop () {
    this.active = false
    this.releasing = false
    this.latest = null
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
  }

  private later (ms: number) {
    if (this.timer !== null) return
    this.timer = setTimeout(() => { this.timer = null; this.pump() }, Math.max(0, ms))
  }

  private pump () {
    if (!this.active) return
    const target = this.latest
    if (!target || same(target, this.sent)) {
      if (this.releasing) this.stop()
      return
    }
    if (this.host.waiting()) { this.later(this.pollMs); return }
    const since = this.now() - this.sentAt
    if (since < this.minInterval) { this.later(this.minInterval - since); return }
    // One short step from where the part is (or was last sent) towards the newest target. A target
    // the other way replaces one not yet sent, so a reversal costs at most the step in flight.
    const step = stepToward(this.sent ?? this.host.from?.() ?? null, target, this.maxStep(target))
    const reason = this.host.refusal(step)
    if (reason || !this.host.send(step)) {
      this.stop()
      this.onRefused(reason || 'The move was not sent.')
      return
    }
    this.sent = step
    this.sentAt = this.now()
    this.sends++
    if (same(step, target)) {
      if (this.releasing) this.stop()
    } else this.later(this.pollMs)
  }
}

/** The part of ControlMixin a drag uses. */
export interface ControlMoveContext {
  moveRefusal: (place: { X?: number, Y?: number, Z?: number }) => string
  handMoveWait: () => string
  moveTo: (place: { X?: number, Y?: number, Z?: number }) => boolean
}

/**
 * A host for any component with ControlMixin (Control's Movement tile, the
 * 3D view): its planner's refusal, its hand-move wait and its moveTo.
 *
 *   this.follow = new DragFollow(controlDragHost(this), { onRefused: r => { this.refused = r } })
 */
export function controlDragHost (vm: ControlMoveContext): DragFollowHost {
  return {
    refusal: target => vm.moveRefusal(target),
    waiting: () => !!vm.handMoveWait(),
    send: target => vm.moveTo(target)
  }
}
