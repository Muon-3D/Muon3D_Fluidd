import { RESTING, type ModelPlacement } from './pose'

/** Which of the model's three axes the printer knows the place of (homed, with a reported position). */
export interface Known { headX: boolean, headZ: boolean, z: boolean }

/** Time constant, ms: about 95% of the way in 3 x this, so a jump to a new place takes ~200 ms. */
export const PLACE_TAU_MS = 70

/** One nominal frame, ms: the step the first frame after an idle stage takes. */
const FRAME_MS = 16

/** Closer than this (model units, 0 to 1 over a rail) is arrived. */
const ARRIVED = 0.0005

/**
 * What the model draws of the head and the bed, never jumping (Jack, 19 Nov: "I don't like the toolhead and plate jumping
 * around"). Each frame it moves a time-based share (frame-rate independent) toward the latest place the printer reports,
 * so a new target mid-move simply continues from where the part is drawn now, and a place that arrives after "unknown"
 * is flown to from the drawn place. An axis whose place is unknown keeps its last drawn place: never 0, never a default.
 * `moving` is true only while it is still closing the gap, so an idle stage stops drawing.
 *
 * Known place (homed, reported): glide from the DRAWN place to the new target (about 200 ms), whatever the target does
 * meanwhile, so a retarget mid-move continues from where the part is, never from a stale or default place. The very
 * first frame of a stage has nothing drawn yet, so a known axis starts on its place instead of flying in from the model's rest.
 * Unknown place (not homed, or no report yet; KAN-5983): the part holds where it is drawn, even through a homing (the
 * printer's own number is not a place while it homes), and once the place is known it eases there from the drawn one.
 * Reduced motion (`animate` false): a known place is taken at once (a short snap, with nothing in between).
 */
export class PlacementSmoother {
  private shown: ModelPlacement = { ...RESTING }
  private last: number | null = null
  private first = true
  moving = false

  /** The place to draw at `now` (ms), given the latest target and which axes of it are known. */
  step (target: ModelPlacement, known: Known, now: number, animate = true): ModelPlacement {
    const snap = !animate || this.first
    this.first = false
    // A pause (idle stage, hidden tab, slow frame) must not turn into one big step: the first frame after idle
    // counts as one normal frame, and no frame counts for more than ~3 frames' worth.
    const dt = this.last === null ? FRAME_MS : Math.min(50, Math.max(0, now - this.last))
    this.last = now
    const k = 1 - Math.exp(-dt / PLACE_TAU_MS)
    let moving = false
    for (const axis of ['headX', 'headZ', 'z'] as const) {
      if (!known[axis] || !Number.isFinite(target[axis])) continue
      const gap = target[axis] - this.shown[axis]
      if (snap || Math.abs(gap) < ARRIVED) {
        this.shown[axis] = target[axis]
      } else {
        this.shown[axis] += gap * k
        moving = true
      }
    }
    this.moving = moving
    // Idle: forget the clock, so the next update after a pause starts gliding from a zero step instead of snapping.
    if (!moving) this.last = null
    return { ...this.shown }
  }

  /** The place drawn now. */
  get current (): ModelPlacement {
    return { ...this.shown }
  }
}
