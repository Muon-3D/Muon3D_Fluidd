/**
 * The one place to flip how the M1 is drawn and labelled, top-down, standing
 * in front of it. Still to be confirmed on Boxwood (Jack and Harry asked,
 * 6 Nov): which physical edge Y=0 is, which side X=0 is, and which way the
 * plate moves on Z+. Change a value here and the trackpad, the jog keys, the
 * bed mesh and the 3D views all follow.
 *
 * - yZeroAt: the edge Y=0 sits on. 'back' means Y grows toward you.
 * - xZeroAt: the side X=0 sits on.
 * - zPlus: which way the plate moves on Z+ (the M1 prints upside down: the
 *   plate is above the nozzle and Z+ separates them, so the plate goes up).
 */
export const M1_VIEW = { yZeroAt: 'back', xZeroAt: 'left', zPlus: 'up' } as {
  yZeroAt: 'front' | 'back'
  xZeroAt: 'left' | 'right'
  zPlus: 'up' | 'down'
}

/**
 * Which way the printer's axes run as you stand in front of it. Everything
 * that draws the plate reads this, so they all agree: the move pad, the bed
 * mesh views, and the live M1 with the print under its plate.
 *
 * X runs left to right. Y runs from the back toward you: the M1 prints
 * hanging under its plate, and for a part to come out the way it was sliced
 * (not mirrored) with Z building downward, its Y has to grow toward the
 * front. Klipper's +Y moves the head forward (Jack, on Boxwood, 2026-10-11).
 */
export const Y_TOWARD_FRONT = M1_VIEW.yZeroAt === 'back'

/** X grows to the right as you face the printer. */
export const X_TOWARD_RIGHT = M1_VIEW.xZeroAt === 'left'

/** The sign of an X step that moves the head to the right. */
export const X_RIGHT = X_TOWARD_RIGHT ? 1 : -1

/** How far across a plate drawn as you face it an X sits: 0 the left edge, 1 the right. */
export function colFraction (x: number, min: number, max: number): number {
  const f = (x - min) / Math.max(1e-9, max - min)
  return X_TOWARD_RIGHT ? f : 1 - f
}

/** The X at a fraction across a plate drawn as you face it. */
export function xAtCol (fraction: number, min: number, max: number): number {
  const f = X_TOWARD_RIGHT ? fraction : 1 - fraction
  return min + f * (max - min)
}

/** How far down a plate drawn with its back at the top a Y sits: 0 is the back edge, 1 the front. */
export function rowFraction (y: number, min: number, max: number): number {
  const f = (y - min) / Math.max(1e-9, max - min)
  return Y_TOWARD_FRONT ? f : 1 - f
}

/** The Y at a fraction down a plate drawn with its back at the top. */
export function yAtRow (fraction: number, min: number, max: number): number {
  const f = Y_TOWARD_FRONT ? fraction : 1 - fraction
  return min + f * (max - min)
}

/** The sign of a Y step that moves the head toward the back of the machine. */
export const Y_BACK = Y_TOWARD_FRONT ? -1 : 1

/** Rows of a grid ordered by Y ascending (Klipper's probed_matrix), back row first. */
export function backRowFirst<T> (rows: T[]): T[] {
  return Y_TOWARD_FRONT ? [...rows] : [...rows].reverse()
}
