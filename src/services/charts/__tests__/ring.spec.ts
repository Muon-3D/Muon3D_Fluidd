import { describe, expect, it } from 'vitest'
import { SeriesRing } from '../ring'

const row = (t: number, v: number) => ({ date: new Date(t), a: v })

describe('SeriesRing', () => {
  it('never grows past its capacity and drops the oldest first', () => {
    const ring = new SeriesRing(5)
    for (let i = 0; i < 12; i++) ring.push(row(i * 1000, i))
    expect(ring.size).toBe(5)
    expect(ring.oldest()).toBe(7000)
    expect(ring.newest()).toBe(11000)
    expect(ring.latest('a')).toBe(11)
  })

  it('returns points in time order after wrapping', () => {
    const ring = new SeriesRing(4)
    for (let i = 0; i < 7; i++) ring.push(row(i * 1000, i * 10))
    expect(ring.extract('a', 0, 1e9, 100)).toEqual([[3000, 30], [4000, 40], [5000, 50], [6000, 60]])
  })

  it('cuts to the window asked for', () => {
    const ring = new SeriesRing(100)
    for (let i = 0; i < 100; i++) ring.push(row(i * 1000, i))
    const pts = ring.extract('a', 90000, 95000, 100)
    expect(pts[0][0]).toBe(90000)
    expect(pts[pts.length - 1][0]).toBe(95000)
    expect(pts).toHaveLength(6)
  })

  it('skips missing and non-finite readings, and accepts numeric strings', () => {
    const ring = new SeriesRing(10)
    ring.push(row(0, 1))
    ring.push({ date: new Date(1000), a: NaN } as any)
    ring.push({ date: new Date(2000) } as any)
    ring.push({ date: new Date(3000), a: '4.5' } as any)
    expect(ring.extract('a', 0, 1e9, 100)).toEqual([[0, 1], [3000, 4.5]])
    expect(ring.latest('a')).toBe(4.5)
    expect(ring.latest('nope')).toBeNull()
  })

  it('decimates a long history to the pixels available but keeps every spike', () => {
    const ring = new SeriesRing(5000)
    for (let i = 0; i < 5000; i++) ring.push(row(i * 1000, i === 2500 ? 300 : 20 + (i % 7)))
    const pts = ring.extract('a', 0, 1e12, 200)
    expect(pts.length).toBeLessThanOrEqual(200)
    expect(Math.max(...pts.map(p => p[1]))).toBe(300)
    expect(pts[0][0]).toBe(0)
    for (let i = 1; i < pts.length; i++) expect(pts[i][0]).toBeGreaterThanOrEqual(pts[i - 1][0])
  })

  it('seeds from history, replacing what it held', () => {
    const ring = new SeriesRing(10)
    ring.push(row(0, 1))
    ring.seed([row(5000, 5), row(6000, 6)])
    expect(ring.size).toBe(2)
    expect(ring.latest('a')).toBe(6)
  })

  it('ignores a sample older than the newest instead of breaking the order', () => {
    const ring = new SeriesRing(10)
    ring.push(row(5000, 5))
    ring.push(row(4000, 4))
    expect(ring.size).toBe(1)
  })
})
