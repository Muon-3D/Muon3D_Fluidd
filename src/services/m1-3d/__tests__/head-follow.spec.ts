import { describe, expect, it } from 'vitest'
import { HEAD_MARGIN, easePan, panNeeded } from '../head-follow'

describe('the camera keeps the nozzle on the stage', () => {
  it('does not move while the nozzle is inside the margin', () => {
    expect(panNeeded(0, 0)).toEqual({ right: 0, up: 0 })
    expect(panNeeded(HEAD_MARGIN, -HEAD_MARGIN)).toEqual({ right: 0, up: 0 })
    expect(panNeeded(0.5, -0.7)).toEqual({ right: 0, up: 0 })
  })

  it('pans toward a nozzle that has gone past the margin, just far enough to bring it back to it', () => {
    const r = panNeeded(1.2, 0)
    expect(r.right).toBeCloseTo(1.2 - HEAD_MARGIN)
    expect(r.up).toBe(0)
    const l = panNeeded(-1.5, 0.95)
    expect(l.right).toBeCloseTo(-1.5 + HEAD_MARGIN)
    expect(l.up).toBeCloseTo(0.95 - HEAD_MARGIN)
  })

  it('also pans for a nozzle that is off the stage altogether', () => {
    expect(panNeeded(3, -4).right).toBeGreaterThan(2)
    expect(panNeeded(3, -4).up).toBeLessThan(-3)
  })

  it('eases toward the pan and then stops exactly, so an idle stage draws nothing', () => {
    let pan = 0
    const seen: number[] = []
    for (let i = 0; i < 60 && pan !== 100; i++) {
      pan = easePan(pan, 100)
      seen.push(pan)
    }
    expect(seen[0]).toBeGreaterThan(0)
    expect(seen[0]).toBeLessThan(100)
    expect(pan).toBe(100)
    expect(seen.length).toBeLessThan(30)
    expect(easePan(pan, 100)).toBe(100)
  })

  it('eases back to nothing as the head comes home', () => {
    let pan = 80
    for (let i = 0; i < 60 && pan !== 0; i++) pan = easePan(pan, 0)
    expect(pan).toBe(0)
  })
})
