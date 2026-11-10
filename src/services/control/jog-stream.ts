/**
 * A live drag streamed to the printer's MUON_JOG (Klipper muon_jog).
 *
 * Why not G1. Klipper cannot take back a queued move (only M112 can), so a
 * drag sent as G1 moves runs every queued millimetre before it can turn
 * round. MUON_JOG only sets a target: the printer feeds itself short batches
 * and never has more than its max_ahead (15 mm across, 4 mm up and down)
 * queued past where it will stop. So a reversal, a stop or a lost tab takes
 * effect within that, without waiting for anything to land.
 *
 * - **Targets.** The newest target is sent at most every `intervalMs`
 *   (100 ms); a change of direction is sent at once. While the pointer is
 *   held still the target is sent again every `keepaliveMs` (200 ms): the
 *   printer stops the jog when it hears nothing for 0.5 s.
 * - **Release** sends the last target with FINAL=1: the part goes there and
 *   stops, no keepalive needed. **Cancel** sends STOP=1 once if anything was
 *   sent.
 * - **Refused: stop.** The host's refusal (not homed, printing, another
 *   printer) stops the drag before anything is sent; the printer's own
 *   reason for ending a jog (the contact guard, the notch, a lost homing)
 *   comes back through `observe` and stops it too. Nothing more is sent.
 */
import type { DragTarget } from './drag-follow'

export interface JogStatus {
  active: boolean
  reason: string
  sessions: number
}

export interface JogStreamHost {
  /** Why the drag may not start or go on, or ''. */
  refusal: (target: DragTarget) => string
  /** Sends one script; false if it could not be sent. */
  send: (script: string) => boolean
  /** mm/s for the head (X Y) or the plate (Z). */
  speed: (axes: 'XY' | 'Z') => number
}

export interface JogStreamOptions {
  onRefused?: (reason: string) => void
  intervalMs?: number
  keepaliveMs?: number
  now?: () => number
}

export const JOG_INTERVAL_MS = 100
export const JOG_KEEPALIVE_MS = 200
/** How a jog the printer ended by itself, not by a fault, is reported. */
const NOT_REFUSALS = ['', 'arrived', 'stopped', 'the jog changed axes']

const fmt = (v: number) => String(Math.round(v * 1000) / 1000)

/** The MUON_JOG line for a target. */
export function jogCommand (target: DragTarget, speed: number, final = false): string {
  const words = 'Z' in target ? [`Z=${fmt(target.Z)}`] : [`X=${fmt(target.X)}`, `Y=${fmt(target.Y)}`]
  if (Number.isFinite(speed) && speed > 0) words.push(`SPEED=${fmt(speed)}`)
  if (final) words.push('FINAL=1')
  return `MUON_JOG ${words.join(' ')}`
}

const axesOf = (t: DragTarget): 'XY' | 'Z' => 'Z' in t ? 'Z' : 'XY'
const vec = (t: DragTarget): number[] => 'Z' in t ? [t.Z] : [t.X, t.Y]
const sameTarget = (a: DragTarget | null, b: DragTarget | null) =>
  !!a && !!b && axesOf(a) === axesOf(b) && vec(a).every((v, i) => Math.abs(v - vec(b)[i]) < 1e-3)

export class JogStream {
  onRefused: (reason: string) => void
  private readonly interval: number
  private readonly keepalive: number
  private readonly now: () => number
  private active = false
  private latest: DragTarget | null = null
  private sent: DragTarget | null = null
  private sentAt = -Infinity
  /** The direction of the last change sent, per axis, to see a reversal. */
  private heading: number[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  /** The printer's jog count when this drag began; its jog is the next. */
  private baseSessions: number | null = null
  /** Scripts sent in this drag (for tests and the caller's display). */
  sends = 0

  constructor (private readonly host: JogStreamHost, options: JogStreamOptions = {}) {
    this.onRefused = options.onRefused ?? (() => undefined)
    this.interval = options.intervalMs ?? JOG_INTERVAL_MS
    this.keepalive = options.keepaliveMs ?? JOG_KEEPALIVE_MS
    this.now = options.now ?? (() => Date.now())
  }

  get following (): boolean {
    return this.active
  }

  get lastSent (): DragTarget | null {
    return this.sent
  }

  /** A drag begins at `target`; `status` is the printer's muon_jog now. */
  start (target: DragTarget, status?: JogStatus | null) {
    if (!this.active) {
      this.active = true
      this.sent = null
      this.sentAt = -Infinity
      this.heading = []
      this.sends = 0
      this.baseSessions = status ? status.sessions : null
    }
    this.update(target)
  }

  update (target: DragTarget) {
    if (!this.active) return
    this.latest = { ...target }
    this.pump()
  }

  /** The pointer is up: the last target, FINAL=1, then done. */
  release () {
    if (!this.active) return
    const target = this.latest
    if (target && this.sent) this.emit(target, true)
    this.stop()
  }

  /** Stop now: STOP=1 if the printer was sent anything. */
  cancel () {
    if (this.active && this.sent) this.host.send('MUON_JOG STOP=1')
    this.stop()
  }

  /**
   * The printer's muon_jog status. Once this drag's jog has started (the
   * count went up) and is no longer active, a reason other than a normal
   * end stops the drag and is said.
   */
  observe (status: JogStatus | null | undefined) {
    if (!this.active || !status || !this.sent) return
    if (this.baseSessions === null) this.baseSessions = status.active ? status.sessions - 1 : status.sessions
    if (status.sessions <= this.baseSessions || status.active) return
    const reason = status.reason ?? ''
    this.stop()
    if (!NOT_REFUSALS.includes(reason)) this.onRefused(`the printer stopped the drag: ${reason}`)
  }

  private stop () {
    this.active = false
    this.latest = null
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
  }

  private later (ms: number) {
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = setTimeout(() => { this.timer = null; this.pump() }, Math.max(0, ms))
  }

  /** The target turns back on any axis against the last change sent. */
  private reverses (target: DragTarget): boolean {
    if (!this.sent || axesOf(this.sent) !== axesOf(target)) return false
    const from = vec(this.sent)
    return vec(target).some((v, i) => (v - from[i]) * (this.heading[i] ?? 0) < -1e-3)
  }

  private emit (target: DragTarget, final = false): boolean {
    if (!this.host.send(jogCommand(target, this.host.speed(axesOf(target)), final))) return false
    if (this.sent && axesOf(this.sent) === axesOf(target)) {
      const from = vec(this.sent)
      this.heading = vec(target).map((v, i) => Math.abs(v - from[i]) > 1e-3 ? Math.sign(v - from[i]) : (this.heading[i] ?? 0))
    }
    this.sent = { ...target }
    this.sentAt = this.now()
    this.sends++
    return true
  }

  private pump () {
    if (!this.active) return
    const target = this.latest
    if (!target) return
    const reason = this.host.refusal(target)
    if (reason) {
      this.cancel()
      this.onRefused(reason)
      return
    }
    const since = this.now() - this.sentAt
    const changed = !sameTarget(target, this.sent)
    const due = changed ? (this.reverses(target) ? 0 : this.interval) : this.keepalive
    if (since < due) { this.later(due - since); return }
    if (!this.emit(target)) {
      this.stop()
      this.onRefused('The move was not sent.')
      return
    }
    this.later(this.keepalive)
  }
}
