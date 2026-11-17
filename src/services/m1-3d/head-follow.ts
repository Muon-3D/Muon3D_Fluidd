/**
 * The camera keeps the nozzle on the stage while it moves (Jack, 11 Nov): a head
 * that runs toward an edge, or past it because the camera is close or looking
 * down, takes the camera with it, just far enough to stay inside the margin, and
 * the camera comes back as the head does, instead of the head leaving the picture
 * and returning. No three.js here, so it is cheap to test.
 */

/** The share of the stage's half-width and half-height the nozzle may use; past it the camera pans. */
export const HEAD_MARGIN = 0.9

/** Each frame the pan closes this share of the gap: about 200 ms to settle at 30 frames a second. */
export const PAN_EASE = 0.3

/**
 * How far to shift the camera, as shares of the stage's half-width and
 * half-height (right and up), to bring a point at (x, y) (-1 to 1 across the
 * stage, as the projection says) back inside the margin. Zero while it is inside.
 */
export function panNeeded (x: number, y: number, margin = HEAD_MARGIN): { right: number, up: number } {
  const over = (v: number) => v > margin ? v - margin : v < -margin ? v + margin : 0
  return { right: over(x), up: over(y) }
}

/** One step of the pan toward where it is wanted; snaps when close, so an idle stage stops drawing. */
export function easePan (now: number, goal: number, ease = PAN_EASE): number {
  const next = now + (goal - now) * ease
  return Math.abs(goal - next) < 0.05 ? goal : next
}
