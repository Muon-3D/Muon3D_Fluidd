import { describe, expect, it } from 'vitest'
import { HEAT_ALPHA_MAX, HEAT_ALPHA_MIN, heatAlpha, heatColor, heatGradient, heatInk, heatScale, meshFigures, signedMm } from '../heatmap'

describe('the heat map scale', () => {
  it('runs from the lowest to the highest measured point', () => {
    expect(heatScale([[-0.06, 0.01], [0.05, 0]])).toEqual({ min: -0.06, max: 0.05 })
  })

  it('skips cells that were not measured, and has no scale with none', () => {
    expect(heatScale([[null, NaN], [Infinity, 0.02]])).toEqual({ min: 0.02, max: 0.02 })
    expect(heatScale([[null, NaN]])).toBeNull()
    expect(heatScale([])).toBeNull()
  })
})

describe('a cell colour', () => {
  const scale = { min: -0.06, max: 0.05 }

  it('is faint at the lowest point and strong at the highest', () => {
    expect(heatAlpha(-0.06, scale)).toBe(HEAT_ALPHA_MIN)
    expect(heatAlpha(0.05, scale)).toBe(HEAT_ALPHA_MAX)
  })

  it('rises with the height, in proportion', () => {
    const mid = heatAlpha(-0.005, scale)
    expect(mid).toBeCloseTo((HEAT_ALPHA_MIN + HEAT_ALPHA_MAX) / 2, 3)
    expect(heatAlpha(-0.03, scale)).toBeLessThan(mid)
    expect(heatAlpha(0.03, scale)).toBeGreaterThan(mid)
  })

  it('stays inside the scale for a value outside it', () => {
    expect(heatAlpha(-1, scale)).toBe(HEAT_ALPHA_MIN)
    expect(heatAlpha(1, scale)).toBe(HEAT_ALPHA_MAX)
  })

  it('is one middling strength on a flat mesh and for a value that is not a number', () => {
    const flat = heatAlpha(0.02, { min: 0.02, max: 0.02 })
    expect(flat).toBeGreaterThan(HEAT_ALPHA_MIN)
    expect(flat).toBeLessThan(HEAT_ALPHA_MAX)
    expect(heatAlpha(NaN, scale)).toBe(flat)
  })

  it('is the accent colour at that strength, and never NaN', () => {
    expect(heatColor(0.05, scale)).toBe('rgba(128, 214, 209, 0.9)')
    expect(heatColor(-0.06, scale)).toBe('rgba(128, 214, 209, 0.2)')
    expect(heatColor(NaN, scale)).not.toContain('NaN')
  })

  it('has a scale bar from the faintest to the strongest', () => {
    expect(heatGradient()).toBe('linear-gradient(90deg, rgba(128, 214, 209, 0.2), rgba(128, 214, 209, 0.9))')
  })

  it('writes dark numbers on strong cells and light ones on faint cells', () => {
    expect(heatInk(HEAT_ALPHA_MAX)).toBe('dark')
    expect(heatInk(HEAT_ALPHA_MIN)).toBe('light')
  })
})

describe('the figures beside the map', () => {
  it('writes heights with a sign and a true minus, and no negative zero', () => {
    expect(signedMm(0.05)).toBe('+0.05')
    expect(signedMm(-0.06)).toBe('−0.06')
    expect(signedMm(-0.001)).toBe('0.00')
    expect(signedMm(0)).toBe('0.00')
  })

  it('gives spread, highest, lowest and the grid size', () => {
    expect(meshFigures([[-0.04, 0.05, 0.01], [0, 0.02, 0.03]])).toEqual({ spread: 0.09, min: -0.04, max: 0.05, columns: 3, rows: 2 })
  })

  it('has none for a mesh with nothing measured', () => {
    expect(meshFigures([])).toBeNull()
    expect(meshFigures([[null]])).toBeNull()
  })
})
