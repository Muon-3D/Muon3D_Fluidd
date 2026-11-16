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
}

export interface DragFollowOptions {
  /** Called once when following stops because a step was refused. */
  onRefused?: (reason: string) => void
  /** The least time between two sends, ms. */
  minIntervalMs?: number
  /** How often to look again while a move is in flight, ms. */
  pollMs?: number
  now?: () => number
}

export const DRAG_MIN_INTERVAL_MS = 150
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
    const reason = this.host.refusal(target)
    if (reason || !this.host.send(target)) {
      this.stop()
      this.onRefused(reason || 'The move was not sent.')
      return
    }
    this.sent = target
    this.sentAt = this.now()
    this.sends++
    if (this.releasing) this.stop()
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
