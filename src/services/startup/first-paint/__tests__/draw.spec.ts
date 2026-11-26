import { describe, expect, it } from 'vitest'
import { drawFrame, drawRim, PALETTES } from '../draw'
import { layoutLogo } from '../logo'
import type { Frame } from '../progress'

/** A canvas context that only counts what is drawn. */
function recorder () {
  const rects: Array<{ style: string, alpha: number }> = []
  let style = ''
  let alpha = 1
  const noop = () => {}
  const ctx = {
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    closePath: noop,
    fill: noop,
    stroke: noop,
    clearRect: noop,
    set fillStyle (v: string) { style = v },
    get fillStyle () { return style },
    set globalAlpha (v: number) { alpha = v },
    get globalAlpha () { return alpha },
    strokeStyle: '',
    lineWidth: 1,
    lineJoin: 'round',
    fillRect: () => { rects.push({ style, alpha }) }
  } as unknown as CanvasRenderingContext2D
  return { ctx, rects }
}

const frame = (over: Partial<Frame> = {}): Frame => ({ rim: 0.5, target: 0.5, head: 0.1, fin: -1, label: 'Connecting', stage: 1, outcome: 'waiting', t: 1, logoT: 1, done: false, ...over })
const pixels = Array.from({ length: 6 }, (_, y) => Array.from({ length: 30 }, (_, x) => ({ x: x + 10, y: y + 2 }))).flat()
const logo = layoutLogo(pixels, 150)!

describe('drawing', () => {
  it('draws more of the rim as the fill grows', () => {
    const count = (p: number) => { const r = recorder(); drawRim(r.ctx, PALETTES.dark, p, -1, -1); return r.rects.filter(q => q.style === PALETTES.dark.ink).length }
    expect(count(0.2)).toBeLessThan(count(0.6))
    expect(count(0)).toBe(0)
  })

  it('draws the comet only when it is given a head', () => {
    const count = (head: number) => { const r = recorder(); drawRim(r.ctx, PALETTES.dark, 0, head, -1); return r.rects.filter(q => q.style === PALETTES.dark.ink || q.style === PALETTES.dark.teal).length }
    expect(count(-1)).toBe(0)
    expect(count(0.3)).toBeGreaterThan(0)
  })

  it('draws the wordmark layer by layer, and all of it when finished', () => {
    const drawn = (logoT: number, finished: boolean) => {
      const r = recorder()
      drawFrame(r.ctx, PALETTES.light, logo, frame({ logoT, head: -1, rim: 0 }), finished)
      return r.rects.filter(q => q.style === PALETTES.light.ink).length
    }
    const early = drawn(0.6, false)
    const mid = drawn(2, false)
    const end = drawn(5, false)
    const still = drawn(0, true)
    expect(early).toBeLessThan(mid)
    expect(mid).toBeLessThan(end)
    expect(still).toBe(logo.px.length)
  })

  it('draws without a wordmark (nothing to read it from)', () => {
    const r = recorder()
    expect(() => drawFrame(r.ctx, PALETTES.dark, null, frame(), false)).not.toThrow()
  })
})
