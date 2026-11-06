import { describe, expect, it } from 'vitest'
import { aspectOf, bedFrom, bedToPixel, inNoGo, nudgeTarget, pixelToBed, regionRect } from '../trackpad'
import { readNoGo } from '../safe-move'
import { Y_BACK, Y_TOWARD_FRONT } from '@/services/machine/orientation'

const bed = bedFrom([0, 0, 0], [200, 180, 160])!
const desktop = { width: 400, height: 360 }
/** A phone's trackpad: the tile is full width on a 375 px screen. */
const phone = { width: 311, height: 279.9 }
const m1 = readNoGo({ no_go_region_1_min: '75, 0', no_go_region_1_max: '125, 34', no_go_boundary_tolerance: 10, no_go_traverse_z: 6 })

describe('the bed', () => {
  it('comes from the axis limits, and is refused when they do not make one', () => {
    expect(bed).toEqual({ min: [0, 0], max: [200, 180] })
    expect(bedFrom([0, 0], [0, 180])).toBeNull()
    expect(bedFrom([0, Number.NaN], [200, 180])).toBeNull()
    expect(aspectOf(bed)).toBeCloseTo(200 / 180)
  })
})

describe.each([['desktop', desktop], ['phone', phone]])('mapping on %s', (_, box) => {
  it('puts the corners where the machine has them: X left to right, the back at the top', () => {
    expect(bedToPixel({ x: 0, y: 0 }, bed, box).x).toBe(0)
    expect(bedToPixel({ x: 200, y: 0 }, bed, box).x).toBeCloseTo(box.width)
    // Y grows toward the front on the M1, so Y 0 is the back edge (the top).
    const top = Y_TOWARD_FRONT ? 0 : 180
    expect(bedToPixel({ x: 0, y: top }, bed, box).y).toBeCloseTo(0)
    expect(bedToPixel({ x: 0, y: 180 - top }, bed, box).y).toBeCloseTo(box.height)
  })

  it('maps a pixel back to the same bed point, to 0.1 mm', () => {
    for (const p of [{ x: 12.3, y: 45.6 }, { x: 100, y: 17 }, { x: 199.9, y: 0.1 }]) {
      const px = bedToPixel(p, bed, box)
      const back = pixelToBed(px, bed, box)!
      expect(back.x).toBeCloseTo(p.x, 1)
      expect(back.y).toBeCloseTo(p.y, 1)
    }
  })

  it('keeps a pick outside the drawing on the bed', () => {
    const p = pixelToBed({ x: -40, y: box.height + 40 }, bed, box)!
    expect(p.x).toBe(0)
    expect([0, 180]).toContain(p.y)
  })

  it('draws the M1 notch to scale, and its tolerance band around it', () => {
    if (!m1 || m1 === 'invalid') throw new Error('no regions')
    const notch = regionRect(m1.regions[0], bed, box)
    expect(notch.left).toBeCloseTo(75 / 200 * box.width)
    expect(notch.width).toBeCloseTo(50 / 200 * box.width)
    expect(notch.height).toBeCloseTo(34 / 180 * box.height)
    const band = regionRect(m1.regions[0], bed, box, m1.tolerance)
    expect(band.width).toBeCloseTo(70 / 200 * box.width)
    // The band is cut at the bed's edge, not drawn off it.
    expect(band.top).toBeGreaterThanOrEqual(0)
    expect(band.top + band.height).toBeLessThanOrEqual(box.height + 1e-9)
  })
})

it('refuses to map a pick before the trackpad is laid out', () => {
  expect(pixelToBed({ x: 10, y: 10 }, bed, { width: 0, height: 0 })).toBeNull()
  expect(pixelToBed({ x: Number.NaN, y: 10 }, bed, desktop)).toBeNull()
})

describe('targets', () => {
  it('knows a target inside the notch, but not one in its tolerance band', () => {
    expect(inNoGo({ x: 100, y: 10 }, m1)).toBe(true)
    expect(inNoGo({ x: 130, y: 10 }, m1)).toBe(false)
    expect(inNoGo({ x: 100, y: 10 }, null)).toBe(false)
    expect(inNoGo({ x: 100, y: 10 }, 'invalid')).toBe(false)
  })

  it('nudges a target with the arrow keys, up being the back, and keeps it on the bed', () => {
    expect(nudgeTarget({ x: 100, y: 100 }, 10, 0, bed, Y_BACK)).toEqual({ x: 110, y: 100 })
    expect(nudgeTarget({ x: 100, y: 100 }, 0, 1, bed, Y_BACK)).toEqual({ x: 100, y: 100 + Y_BACK })
    expect(nudgeTarget({ x: 199.95, y: 0.05 }, 1, 10, bed, Y_BACK)).toEqual({ x: 200, y: Y_BACK > 0 ? 10.1 : 0 })
  })
})
