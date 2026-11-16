import { describe, expect, it } from 'vitest'
import { FrameWatch, wantsCheapGlass } from '../glass-cost'

describe('when the glass plate costs too much', () => {
  it('keeps the real glass on a desktop and swaps it on a phone or a weak device', () => {
    expect(wantsCheapGlass({ width: 1200, cores: 8, memory: 8 })).toBe(false)
    expect(wantsCheapGlass({ width: 1200 })).toBe(false)
    expect(wantsCheapGlass({ width: 390, cores: 8, memory: 8 })).toBe(true)
    expect(wantsCheapGlass({ width: 1200, cores: 4 })).toBe(false)
    expect(wantsCheapGlass({ width: 1200, cores: 4, memory: 4 })).toBe(true)
    expect(wantsCheapGlass({ width: 1200, cores: 2 })).toBe(true)
    expect(wantsCheapGlass({ width: 1200, memory: 2 })).toBe(true)
    expect(wantsCheapGlass({ width: 1200, saveData: true })).toBe(true)
  })

  it('calls the view slow after a window of slow frames, and not before', () => {
    const w = new FrameWatch()
    let t = 1000
    for (let i = 0; i < 24; i++) { w.push(t); t += 80 }
    expect(w.slow).toBe(false)
    w.push(t); t += 80
    expect(w.slow).toBe(true)
  })

  it('does not count idle gaps, and a fast view is never slow', () => {
    const w = new FrameWatch()
    let t = 0
    for (let i = 0; i < 40; i++) { w.push(t); t += i % 2 ? 5000 : 33 }
    expect(w.slow).toBe(false)
    const fast = new FrameWatch()
    for (let i = 0; i < 40; i++) { fast.push(t); t += 17 }
    expect(fast.slow).toBe(false)
  })
})
