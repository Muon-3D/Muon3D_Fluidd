import { Y_TOWARD_FRONT } from '@/services/machine/orientation'
import { ACCURATE_RIG } from './accurate/klipper-map'

/**
 * Printer millimetres to the accurate M1's world and back, for dragging the
 * toolhead and the plate on the Overview stage. The same mapping the model is
 * posed with (klipper-map.ts placeAccurate), so a target drawn at a point is
 * the place the printer is sent to:
 * - the nozzle's world X is Klipper's X less half the plate (X 0 is the
 *   plate's left edge);
 * - its world Z is Klipper's Y from the plate's back edge, toward the front
 *   on the M1 (orientation.ts);
 * - the head never moves in world Y; the nozzle tip is at `tipY`;
 * - Z is the gap from the tip to the plate's underside, so the plate's top is
 *   at tipY + Z + the glass's thickness.
 * No three.js here, so it is cheap to test.
 */
export interface WorldPoint { x: number, y: number, z: number }

const r = ACCURATE_RIG

/** The world point of the nozzle tip at Klipper (X, Y). */
export function headToWorld (x: number, y: number): WorldPoint {
  return { x: x - r.plateHalfX, y: r.tipY, z: Y_TOWARD_FRONT ? y - r.plateHalfZ : r.plateHalfZ - y }
}

/** Klipper (X, Y) for a world point on the nozzle's plane. */
export function worldToHead (p: { x: number, z: number }): { X: number, Y: number } {
  return { X: p.x + r.plateHalfX, Y: Y_TOWARD_FRONT ? p.z + r.plateHalfZ : r.plateHalfZ - p.z }
}

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

/** The furthest one drag can take the plate, either way, so a flick at a grazing angle can't send it to the end of its travel. */
export const PLATE_DRAG_MM = 50
/** A drag stops the plate this far from the nozzle (Z 0 is the tip touching it), or where it already is if lower. */
export const PLATE_DRAG_FLOOR_MM = 2

/** The plate's Z for a drag that has moved `by` mm from `z0`: capped per drag, kept off the nozzle, inside the axis. */
export function plateDragZ (z0: number, by: number, zMin: number, zMax: number): number {
  const step = Math.max(-PLATE_DRAG_MM, Math.min(PLATE_DRAG_MM, by))
  return clampMm(z0 + step, Math.max(zMin, Math.min(z0, PLATE_DRAG_FLOOR_MM)), zMax)
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
