import { describe, expect, it } from 'vitest'
import { pathCrumbs, windowRows, WINDOW_FROM } from '../manager'

describe('windowRows', () => {
  it('shows every row for a short folder, so small lists draw as before', () => {
    expect(windowRows({ total: WINDOW_FROM - 1, scrollTop: 0, viewport: 400, rowHeight: 40 }))
      .toEqual({ start: 0, end: WINDOW_FROM - 1, padTop: 0, padBottom: 0, windowed: false })
  })

  it('draws only the rows in view, plus a few either side, for a large folder', () => {
    const w = windowRows({ total: 5000, scrollTop: 4000, viewport: 400, rowHeight: 40, overscan: 5 })
    expect(w.windowed).toBe(true)
    expect(w.start).toBe(95)
    expect(w.end).toBe(110 + 5)
    expect(w.padTop).toBe(95 * 40)
    expect(w.padBottom).toBe((5000 - 115) * 40)
    expect(w.end - w.start).toBeLessThan(40)
  })

  it('keeps the whole scroll height: padding plus drawn rows is always total rows tall', () => {
    for (const scrollTop of [0, 1, 777, 123456, 1e9]) {
      const w = windowRows({ total: 3000, scrollTop, viewport: 500, rowHeight: 36 })
      expect(w.padTop + (w.end - w.start) * 36 + w.padBottom).toBe(3000 * 36)
      expect(w.start).toBeGreaterThanOrEqual(0)
      expect(w.end).toBeLessThanOrEqual(3000)
    }
  })
})

describe('pathCrumbs', () => {
  it('starts at the root and has a crumb for each folder, each with the path that opens it', () => {
    expect(pathCrumbs('gcodes', 'parts/brackets')).toEqual([
      { label: 'gcodes', path: '' },
      { label: 'parts', path: 'parts' },
      { label: 'brackets', path: 'parts/brackets' }
    ])
  })

  it('is just the root at the top', () => {
    expect(pathCrumbs('config', '')).toEqual([{ label: 'config', path: '' }])
  })
})
