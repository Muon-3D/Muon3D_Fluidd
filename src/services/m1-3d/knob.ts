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
