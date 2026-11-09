import { X_TOWARD_RIGHT, Y_TOWARD_FRONT } from '@/services/machine/orientation'
import { RESTING, type ModelPlacement, type ModelPose } from '../pose'

/**
 * Where the accurate M1's parts are, in the GLB's world frame (millimetres:
 * +X along the cross rail, +Z toward the front, +Y up, origin at the middle
 * of the glass plate's top with the bed at its modelled height). Measured
 * once from the shipped asset (its node transforms and mesh bounds) and from
 * the README's rig limits, and checked against the asset in
 * __tests__/klipper-map.spec.ts.
 *
 * UNVERIFIED against a printer: that Klipper's X 0 / Y 0 sit at the glass
 * plate's left and back edges (the same assumption the simple model makes,
 * pose.ts), that the plate is 200 by 180 mm, that Z 0 is the tip touching the
 * plate's underside, and the signs. None of it is in printer.cfg here.
 */
export const ACCURATE_RIG = {
  /** The nozzle with the head at the rig's rest (state 0 of both rails). */
  nozzleX: 0.6,
  nozzleZ: -2.05,
  /** The nozzle tip, up toward the plate; the head never moves in Y. */
  tipY: -70.2,
  /** The head's end stops: the nozzle's world X and Z. */
  travelX: [-101.6, 102.8],
  travelZ: [-92.0, 87.9],
  /** The plate's top at the bed's lowest and highest. */
  plateTop: [-76.8, 73.7],
  /** Top of the glass to its underside, the print surface. */
  plateThickness: 4.11,
  /** The glass plate's half size in X and Z: Klipper's X 0 and Y 0 are its left and back edges. */
  plateHalfX: 100,
  plateHalfZ: 90
} as const

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

/** The state (0 lowest, 1 highest) a plate top at this world Y needs. */
const bedState = (top: number) => (top - ACCURATE_RIG.plateTop[0]) / (ACCURATE_RIG.plateTop[1] - ACCURATE_RIG.plateTop[0])

/** The plate's top, world Y, for a bed state. */
export const plateTopAt = (z: number) => ACCURATE_RIG.plateTop[0] + z * (ACCURATE_RIG.plateTop[1] - ACCURATE_RIG.plateTop[0])

/** -1 to 1 across a rail whose nozzle goes from `lo` to `hi`, the nozzle at `rest` for 0. */
const railState = (at: number, lo: number, hi: number, rest: number) => {
  const half = (hi - lo) / 2
  return clamp((at - rest) / half, -1, 1)
}

/**
 * The state for the accurate M1's nodes (node-binding.ts) that puts the
 * nozzle over the plate point Klipper means, and the plate that far above
 * it, stopping at the rig's travel limits. X runs left to right from the
 * plate's left edge, Y from its back edge toward the front on the M1
 * (orientation.ts), Z is the gap from the tip to the plate. An axis that
 * isn't homed is drawn at the model's resting pose.
 */
export function placeAccurate (pose: ModelPose): ModelPlacement {
  const r = ACCURATE_RIG
  return {
    headX: pose.x === null
      ? RESTING.headX
      : railState((X_TOWARD_RIGHT ? pose.x - r.plateHalfX : r.plateHalfX - pose.x), r.travelX[0], r.travelX[1], r.nozzleX),
    headZ: pose.y === null
      ? RESTING.headZ
      : railState((Y_TOWARD_FRONT ? pose.y - r.plateHalfZ : r.plateHalfZ - pose.y), r.travelZ[0], r.travelZ[1], r.nozzleZ),
    z: pose.z === null
      ? RESTING.z
      : clamp(bedState(r.tipY + pose.z + r.plateThickness), 0, 1)
  }
}
