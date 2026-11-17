/**
 * The knob on the model's base turns and presses as the person scrolls and
 * clicks to use the printer's screen (Jack, 11 Nov). This is only the picture:
 * nothing here sends anything to the printer.
 */

/** One wheel notch (or one detent) turns the knob this much, radians. */
export const KNOB_DETENT = Math.PI / 12
/** A click pushes the knob in toward the case this far, mm, for this long (a short press, about a fifth of a second). */
export const KNOB_PRESS_MM = 3
export const KNOB_PRESS_MS = 220
/** A wheel event's detents: a notch is about 100 units of delta, a trackpad sends many small ones; capped so a flick isn't a spin. */
export function wheelDetents (deltaY: number, deltaMode = 0): number {
  const px = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY
  const d = px / 100
  return Math.max(-3, Math.min(3, d))
}

/** A wheel event this small, in pixels, is a trackpad's (a mouse wheel's notch is about 100, a line 16 or more). */
export const TRACKPAD_EVENT_PX = 40
/** A trackpad has to travel this far, in pixels, for one knob step (KAN-3597: a swipe sends hundreds of small events and was a spin). */
export const TRACKPAD_STEP_PX = 120
/** A trackpad's travel not yet worth a step is let go after this long without scrolling. */
export const TRACKPAD_IDLE_MS = 250
/** However far a trackpad swipe or its momentum goes, no more than this many steps in one second. */
export const MAX_STEPS_PER_SECOND = 8

/**
 * Turns wheel events into knob detents. A mouse wheel's notch is a detent, as
 * before. A trackpad sends many small deltas: they add up, and only each whole
 * TRACKPAD_STEP_PX of travel is a detent, so a swipe is a few clicks of the
 * knob, not a spin; what has not yet made a step is let go after a pause.
 */
export class KnobWheel {
  private carry = 0
  private lastAt = -Infinity
  private recent: number[] = []

  turn (deltaY: number, deltaMode = 0, now = performance.now()): number {
    const px = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY
    if (!Number.isFinite(px) || px === 0) return 0
    if (now - this.lastAt > TRACKPAD_IDLE_MS) this.carry = 0
    this.lastAt = now
    if (Math.abs(px) >= TRACKPAD_EVENT_PX) {
      this.carry = 0
      return wheelDetents(px)
    }
    this.carry += px
    const steps = Math.trunc(this.carry / TRACKPAD_STEP_PX)
    if (!steps) return 0
    this.carry -= steps * TRACKPAD_STEP_PX
    return this.limit(steps, now)
  }

  /** A trackpad's steps, no more than MAX_STEPS_PER_SECOND in any second, so momentum cannot spin it. */
  private limit (steps: number, now: number): number {
    this.recent = this.recent.filter(t => now - t < 1000)
    const n = Math.min(Math.abs(steps), MAX_STEPS_PER_SECOND - this.recent.length)
    if (n <= 0) return 0
    for (let i = 0; i < n; i++) this.recent.push(now)
    return Math.sign(steps) * n
  }
}

/** Where the knob is going after a turn of `detents` from `goal`. Scroll down turns it clockwise. */
export function knobGoal (goal: number, detents: number): number {
  return goal + detents * KNOB_DETENT
}

/** The share of the push the knob is in after `elapsedMs` of a press: in quickly, out again by KNOB_PRESS_MS; 0 outside it. Set by the clock, not the frame rate, so a slow frame still shows it going in. */
export function knobPressDepth (elapsedMs: number): number {
  if (!(elapsedMs >= 0) || elapsedMs >= KNOB_PRESS_MS) return 0
  const inMs = KNOB_PRESS_MS * 0.3
  if (elapsedMs < inMs) {
    const t = elapsedMs / inMs
    return 1 - (1 - t) ** 3
  }
  const t = (elapsedMs - inMs) / (KNOB_PRESS_MS - inMs)
  return 1 - (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
}
