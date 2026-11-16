/**
 * The Move tile's trackpad: the bed drawn to scale, the head on it, and the
 * no-go regions the printer declares. Pure mapping between bed millimetres
 * and the trackpad's pixels, so it can be checked at any size (desktop and
 * phone) without a browser.
 *
 * The bed is drawn as you stand in front of the printer: X left to right,
 * the back of the machine at the top (services/machine/orientation).
 *
 * A tap only picks a target. Nothing here sends anything: the Move tile
 * sends a picked target through ControlMixin.moveTo, which runs the no-go
 * planner, only when "Move here" is pressed.
 */
import { colFraction, rowFraction, xAtCol, yAtRow } from '@/services/machine/orientation'
import type { NoGoConfig, NoGoRegion } from './safe-move'

export interface Bed {
  min: [number, number]
  max: [number, number]
}

export interface Box {
  width: number
  height: number
}

export interface Point { x: number, y: number }

export interface Rect { left: number, top: number, width: number, height: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const tenth = (v: number) => Math.round(v * 10) / 10

/** The bed from the toolhead's axis limits, or null when they don't make a bed. */
export function bedFrom (axisMin: number[], axisMax: number[]): Bed | null {
  const nums = [axisMin[0], axisMin[1], axisMax[0], axisMax[1]].map(Number)
  if (!nums.every(Number.isFinite) || nums[2] <= nums[0] || nums[3] <= nums[1]) return null
  return { min: [nums[0], nums[1]], max: [nums[2], nums[3]] }
}

/** The trackpad's width / height, so it is drawn to scale. */
export function aspectOf (bed: Bed): number {
  return (bed.max[0] - bed.min[0]) / (bed.max[1] - bed.min[1])
}

/** Where a bed point sits on the trackpad, in pixels from its top-left corner. */
export function bedToPixel (p: Point, bed: Bed, box: Box): Point {
  const fx = colFraction(p.x, bed.min[0], bed.max[0])
  const fy = rowFraction(p.y, bed.min[1], bed.max[1])
  return { x: fx * box.width, y: fy * box.height }
}

/**
 * The bed point under a pixel of the trackpad, kept on the bed and rounded
 * to 0.1 mm. Null when the trackpad has no size (not laid out yet).
 */
export function pixelToBed (px: Point, bed: Bed, box: Box): Point | null {
  if (!(box.width > 0) || !(box.height > 0) || !Number.isFinite(px.x) || !Number.isFinite(px.y)) return null
  const fx = clamp(px.x / box.width, 0, 1)
  const fy = clamp(px.y / box.height, 0, 1)
  const x = xAtCol(fx, bed.min[0], bed.max[0])
  const y = yAtRow(fy, bed.min[1], bed.max[1])
  return { x: clamp(tenth(x), bed.min[0], bed.max[0]), y: clamp(tenth(y), bed.min[1], bed.max[1]) }
}

/** A region (grown by `pad` mm), as a rectangle on the trackpad in pixels, cut to the bed. */
export function regionRect (r: NoGoRegion, bed: Bed, box: Box, pad = 0): Rect {
  const x0 = clamp(r.min[0] - pad, bed.min[0], bed.max[0])
  const x1 = clamp(r.max[0] + pad, bed.min[0], bed.max[0])
  const y0 = clamp(r.min[1] - pad, bed.min[1], bed.max[1])
  const y1 = clamp(r.max[1] + pad, bed.min[1], bed.max[1])
  const a = bedToPixel({ x: x0, y: y0 }, bed, box)
  const b = bedToPixel({ x: x1, y: y1 }, bed, box)
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y)
  }
}

/** Is a bed point inside any region (not counting the tolerance band)? */
export function inNoGo (p: Point, noGo: NoGoConfig | null | 'invalid'): boolean {
  if (!noGo || noGo === 'invalid') return false
  return noGo.regions.some(r => p.x >= r.min[0] && p.x <= r.max[0] && p.y >= r.min[1] && p.y <= r.max[1])
}

/**
 * A target nudged by a step with the arrow keys, kept on the bed. Up is the
 * back of the machine, right is the right: `dxRight` and `dyBack` are steps
 * on screen, `yBack` and `xRight` the signs that turn them into axis steps.
 */
export function nudgeTarget (p: Point, dxRight: number, dyBack: number, bed: Bed, yBack: number, xRight = 1): Point {
  return {
    x: clamp(tenth(p.x + dxRight * xRight), bed.min[0], bed.max[0]),
    y: clamp(tenth(p.y + dyBack * yBack), bed.min[1], bed.max[1])
  }
}
