/**
 * The knob on the model's base turns and presses as the person scrolls and
 * clicks to use the printer's screen (Jack, 11 Nov). This is only the picture:
 * nothing here sends anything to the printer.
 */

/** One wheel notch (or one detent) turns the knob this much, radians. */
export const KNOB_DETENT = Math.PI / 12
/** A click pushes the knob in this far, mm, for this long. */
export const KNOB_PRESS_MM = 0.9
export const KNOB_PRESS_MS = 140
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
