import { describe, expect, it } from 'vitest'
import { springCurve, springKeyframes } from '../spring'

describe('the spring', () => {
  const curve = springCurve()

  it('starts where the tile was and comes to rest where it is', () => {
    expect(curve.frames[0]).toBe(1)
    expect(curve.frames[curve.frames.length - 1]).toBe(0)
    expect(curve.duration).toBeGreaterThan(200)
    expect(curve.duration).toBeLessThanOrEqual(900)
  })

  it('overshoots a little and settles, rather than stopping dead', () => {
    const least = Math.min(...curve.frames)
    expect(least).toBeLessThan(0)
    expect(least).toBeGreaterThan(-0.15)
  })

  it('animates only transforms, scaled and moved from the old place', () => {
    const frames = springKeyframes({ dx: 100, dy: -40, sx: 0.5, sy: 2 }, curve)
    expect(frames).toHaveLength(curve.frames.length)
    expect(frames[0].transform).toBe('translate(100px, -40px) scale(0.5, 2)')
    expect(frames[frames.length - 1].transform).toBe('translate(0px, 0px) scale(1, 1)')
    for (const f of frames) expect(Object.keys(f).sort()).toEqual(['transform', 'transformOrigin'])
  })
})
