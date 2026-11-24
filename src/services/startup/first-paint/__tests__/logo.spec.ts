import { describe, expect, it } from 'vitest'
import { layoutLogo } from '../logo'
import { LEAD, LOGO_S } from '../progress'

/** A made-up mask: `rows` layers, each `width` wide with gaps. */
function mask (rows: number, width: number) {
  const out: Array<{ x: number, y: number }> = []
  for (let y = 3; y < 3 + rows; y++) for (let x = 5; x < 5 + width; x++) if (x % 7 !== 0) out.push({ x, y })
  return out
}

describe("the wordmark's print schedule", () => {
  it.each([[12, 40], [17, 100], [9, 140], [30, 20]])('takes the same time for %i rows of %i px', (rows, width) => {
    const G = layoutLogo(mask(rows, width), 150)!
    expect(G.L).toBe(rows)
    const first = Math.min(...G.px.map(q => q.at))
    const last = Math.max(...G.px.map(q => q.at))
    expect(first).toBeGreaterThanOrEqual(LEAD)
    expect(first).toBeLessThan(LEAD + G.slot)
    expect(last).toBeCloseTo(LEAD + LOGO_S, 6)
    expect(last).toBeLessThanOrEqual(LEAD + LOGO_S + 1e-9)
  })

  it('lays layer after layer, row 0 first, back and forth', () => {
    const G = layoutLogo(mask(6, 30), 150)!
    expect(G.layers.map(l => l.dir)).toEqual([1, -1, 1, -1, 1, -1])
    for (let li = 1; li < G.L; li++) {
      const prev = Math.max(...G.px.filter(q => q.li === li - 1).map(q => q.at))
      const here = Math.min(...G.px.filter(q => q.li === li).map(q => q.at))
      expect(here).toBeGreaterThanOrEqual(prev - 1e-9)
    }
    // Within a rightward layer a pixel further right comes later; in a leftward one, earlier.
    const right = G.px.filter(q => q.li === 0).sort((a, b) => a.x - b.x)
    expect(right[0].at).toBeLessThan(right[right.length - 1].at)
    const left = G.px.filter(q => q.li === 1).sort((a, b) => a.x - b.x)
    expect(left[0].at).toBeGreaterThan(left[left.length - 1].at)
  })

  it('copes with a blank row and with no pixels', () => {
    const m = mask(5, 20).filter(q => q.y !== 5)
    const G = layoutLogo(m, 150)!
    expect(G.L).toBe(5)
    expect(G.layers[2]).toEqual({ lo: 0, hi: 0, dir: 1 })
    expect(layoutLogo([], 150)).toBeNull()
  })
})
