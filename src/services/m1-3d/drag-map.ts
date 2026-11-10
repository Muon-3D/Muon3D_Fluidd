import { M1_VIEW, axesFor, type M1View } from '@/services/machine/orientation'
import { ACCURATE_RIG } from './accurate/klipper-map'

/**
 * Printer millimetres to the accurate M1's world and back, for dragging the
 * toolhead and the plate on the Overview stage. The same mapping the model is
 * posed with (klipper-map.ts placeAccurate), so a target drawn at a point is
 * the place the printer is sent to:
 * - the nozzle's world X is Klipper's X from the plate's X 0 edge (the left
 *   one on the M1), less half the plate;
 * - its world Z is Klipper's Y from the plate's Y 0 edge (the back one on
 *   the M1);
 * - which edges those are is M1_VIEW (orientation.ts), the one constant the
 *   trackpad, the jog keys and the model all read;
 * - the head never moves in world Y; the nozzle tip is at `tipY`;
 * - Z is the gap from the tip to the plate's underside, so the plate's top is
 *   at tipY + Z + the glass's thickness.
 * No three.js here, so it is cheap to test.
 */
export interface WorldPoint { x: number, y: number, z: number }

const r = ACCURATE_RIG

/** Klipper (X, Y) to the nozzle's world point and back, for a view of the M1. Tests flip the view. */
export function headMapFor (view: M1View) {
  const { X_TOWARD_RIGHT: right, Y_TOWARD_FRONT: front } = axesFor(view)
  return {
    headToWorld: (x: number, y: number): WorldPoint => ({
      x: right ? x - r.plateHalfX : r.plateHalfX - x,
      y: r.tipY,
      z: front ? y - r.plateHalfZ : r.plateHalfZ - y
    }),
    worldToHead: (p: { x: number, z: number }): { X: number, Y: number } => ({
      X: right ? p.x + r.plateHalfX : r.plateHalfX - p.x,
      Y: front ? p.z + r.plateHalfZ : r.plateHalfZ - p.z
    })
  }
}

const HEAD_MAP = headMapFor(M1_VIEW)

/** The world point of the nozzle tip at Klipper (X, Y). */
export const headToWorld = HEAD_MAP.headToWorld

/** Klipper (X, Y) for a world point on the nozzle's plane. */
export const worldToHead = HEAD_MAP.worldToHead

/** The world Y of the nozzle's plane, where a toolhead drag is read. */
export const HEAD_PLANE_Y = r.tipY

/** The world Y of the plate's top with the bed at Klipper Z. */
export function plateTopForZ (z: number): number {
  return r.tipY + z + r.plateThickness
}

/** Klipper Z for the plate's top at world Y. */
export function zForPlateTop (top: number): number {
  return top - r.tipY - r.plateThickness
}

/** Rounds to a tenth of a millimetre and keeps a value inside [lo, hi]. */
export function clampMm (v: number, lo: number, hi: number): number {
  return Math.round(Math.min(hi, Math.max(lo, v)) * 10) / 10
}

/** Marks every `step` mm from `lo` to `hi`, both ends included when they fall on a step. */
export function ticks (lo: number, hi: number, step = 50): number[] {
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v) || 0)
  return out
}

/** A drag stops the plate this far from the nozzle (Z 0 is the tip touching it), or where it already is if lower. */
export const PLATE_DRAG_FLOOR_MM = 2

/**
 * The plate's Z for a drag that has moved `by` mm from `z0`: kept off the
 * nozzle, inside the axis. No cap per drag (Jack, #340): the plate follows
 * the pointer, in short steps the follower sends.
 */
export function plateDragZ (z0: number, by: number, zMin: number, zMax: number): number {
  return clampMm(z0 + by, Math.max(zMin, Math.min(z0, PLATE_DRAG_FLOOR_MM)), zMax)
}

/**
 * What a drag's release sends to moveTo: the target in G-code coordinates
 * (toolhead less the offsets in force), kept inside the axis limits as
 * G-code, since moveTo checks a G-code value against them.
 */
export function releasePlace (
  target: { X: number, Y: number } | { Z: number },
  offset: readonly number[],
  min: readonly number[],
  max: readonly number[]
): { X: number, Y: number } | { Z: number } {
  const g = (v: number, i: number) => clampMm(v - (offset[i] ?? 0), min[i], max[i])
  return 'Z' in target ? { Z: g(target.Z, 2) } : { X: g(target.X, 0), Y: g(target.Y, 1) }
}
