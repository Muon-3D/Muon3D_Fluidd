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

export type M1View = typeof M1_VIEW

/**
 * The axis helpers for a view. The module's own exports below are this for
 * M1_VIEW; tests call it with the view flipped, so a flip is known to keep
 * the trackpad and the jog keys agreeing.
 */
export function axesFor (view: M1View) {
  const yTowardFront = view.yZeroAt === 'back'
  const xTowardRight = view.xZeroAt === 'left'
  return {
    Y_TOWARD_FRONT: yTowardFront,
    X_TOWARD_RIGHT: xTowardRight,
    X_RIGHT: xTowardRight ? 1 : -1,
    Y_BACK: yTowardFront ? -1 : 1,
    colFraction (x: number, min: number, max: number): number {
      const f = (x - min) / Math.max(1e-9, max - min)
      return xTowardRight ? f : 1 - f
    },
    xAtCol (fraction: number, min: number, max: number): number {
      const f = xTowardRight ? fraction : 1 - fraction
      return min + f * (max - min)
    },
    rowFraction (y: number, min: number, max: number): number {
      const f = (y - min) / Math.max(1e-9, max - min)
      return yTowardFront ? f : 1 - f
    },
    yAtRow (fraction: number, min: number, max: number): number {
      const f = yTowardFront ? fraction : 1 - fraction
      return min + f * (max - min)
    }
  }
}

const AXES = axesFor(M1_VIEW)

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
export const Y_TOWARD_FRONT = AXES.Y_TOWARD_FRONT

/** X grows to the right as you face the printer. */
export const X_TOWARD_RIGHT = AXES.X_TOWARD_RIGHT

/** The sign of an X step that moves the head to the right. */
export const X_RIGHT = AXES.X_RIGHT

/** How far across a plate drawn as you face it an X sits: 0 the left edge, 1 the right. */
export const colFraction = AXES.colFraction

/** The X at a fraction across a plate drawn as you face it. */
export const xAtCol = AXES.xAtCol

/** How far down a plate drawn with its back at the top a Y sits: 0 is the back edge, 1 the front. */
export const rowFraction = AXES.rowFraction

/** The Y at a fraction down a plate drawn with its back at the top. */
export const yAtRow = AXES.yAtRow

/** The sign of a Y step that moves the head toward the back of the machine. */
export const Y_BACK = AXES.Y_BACK

/** Rows of a grid ordered by Y ascending (Klipper's probed_matrix), back row first. */
export function backRowFirst<T> (rows: T[]): T[] {
  return Y_TOWARD_FRONT ? [...rows] : [...rows].reverse()
}
