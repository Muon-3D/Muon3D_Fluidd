import { afterEach, describe, expect, it, vi } from 'vitest'
import type { M1View } from '@/services/machine/orientation'

/**
 * M1_VIEW flipped every way: the trackpad (pixelToBed, bedToPixel,
 * nudgeTarget) and the jog keys (jogLayout) must still agree, and a drag to
 * the right on screen must send the same X sign as the "Head right" key.
 */
const VIEWS: M1View[] = [
  { yZeroAt: 'back', xZeroAt: 'left', zPlus: 'up' },
  { yZeroAt: 'front', xZeroAt: 'left', zPlus: 'up' },
  { yZeroAt: 'back', xZeroAt: 'right', zPlus: 'up' },
  { yZeroAt: 'front', xZeroAt: 'right', zPlus: 'down' }
]

async function withView (view: M1View) {
  vi.resetModules()
  vi.doMock('@/services/machine/orientation', async (importOriginal) => {
    const real = await importOriginal<typeof import('@/services/machine/orientation')>()
    return { ...real, ...real.axesFor(view), M1_VIEW: view }
  })
  const trackpad = await import('@/services/control/trackpad')
  const o = await import('@/services/machine/orientation')
  const { jogLayout } = await import('@/components/control/ControlMove.vue')
  return { ...trackpad, o, jogLayout }
}

afterEach(() => { vi.doUnmock('@/services/machine/orientation'); vi.resetModules() })

const bed = { min: [0, -10] as [number, number], max: [200.1, 174.1] as [number, number] }
const box = { width: 400, height: 368 }
const sign = (v: number) => Math.sign(Math.round(v * 1000))

describe.each(VIEWS)('with M1_VIEW %o', view => {
  it('a pixel to the right/up on the trackpad is the way the matching jog key moves', async () => {
    const { pixelToBed, jogLayout, o } = await withView(view)
    const centre = { x: 200, y: 184 }
    const at = pixelToBed(centre, bed, box)!
    const right = pixelToBed({ x: centre.x + 40, y: centre.y }, bed, box)!
    const up = pixelToBed({ x: centre.x, y: centre.y - 40 }, bed, box)!
    const keys = Object.fromEntries(jogLayout(o.Y_BACK, o.X_RIGHT).map(c => [c.id, c]))
    // A drag right sends an X step with the "Head right" key's sign; up (the back) with "Head back"'s.
    expect(sign(right.x - at.x)).toBe(sign(keys.e.dx))
    expect(sign(right.y - at.y)).toBe(0)
    expect(sign(up.y - at.y)).toBe(sign(keys.n.dy))
    expect(sign(up.x - at.x)).toBe(0)
    expect(keys.e.dx).toBe(o.X_RIGHT)
    expect(keys.n.dy).toBe(o.Y_BACK)
  })

  it('bedToPixel undoes pixelToBed', async () => {
    const { pixelToBed, bedToPixel } = await withView(view)
    for (const px of [{ x: 10, y: 20 }, { x: 390, y: 350 }, { x: 200, y: 184 }]) {
      const p = pixelToBed(px, bed, box)!
      const back = bedToPixel(p, bed, box)
      expect(Math.abs(back.x - px.x)).toBeLessThan(1)
      expect(Math.abs(back.y - px.y)).toBeLessThan(1)
    }
  })

  it('an arrow key nudges the target the way its arrow points on the pad', async () => {
    const { nudgeTarget, bedToPixel, o } = await withView(view)
    const from = { x: 100, y: 80 }
    const px = bedToPixel(from, bed, box)
    const right = bedToPixel(nudgeTarget(from, 10, 0, bed, o.Y_BACK, o.X_RIGHT), bed, box)
    const up = bedToPixel(nudgeTarget(from, 0, 10, bed, o.Y_BACK, o.X_RIGHT), bed, box)
    expect(right.x).toBeGreaterThan(px.x)
    expect(up.y).toBeLessThan(px.y)
  })

  it('the Y=0 edge, where the notch sits, is the edge "Head back" goes toward when Y=0 is the back', async () => {
    const { regionRect, jogLayout, o } = await withView(view)
    const r = regionRect({ min: [75, 0], max: [125, 34] }, bed, box)
    const back = jogLayout(o.Y_BACK, o.X_RIGHT).find(c => c.id === 'n')!
    if (view.yZeroAt === 'back') {
      expect(back.dy).toBe(-1)
      expect(r.top).toBeLessThan(box.height / 2)
    } else {
      expect(back.dy).toBe(1)
      expect(r.top + r.height).toBeGreaterThan(box.height / 2)
    }
  })
})
