import { describe, expect, it } from 'vitest'
import { spoolLeft, usageOf } from '../consumables'

describe('a wear bar', () => {
  it('fills in proportion to the hours or prints used', () => {
    expect(usageOf(212, 400)).toEqual({ percent: 53, tone: 'ok' })
    expect(usageOf(0, 400)).toEqual({ percent: 0, tone: 'ok' })
  })

  it('goes amber from four fifths and stops at full', () => {
    expect(usageOf(319, 400)!.tone).toBe('ok')
    expect(usageOf(320, 400)!.tone).toBe('warn')
    expect(usageOf(900, 400)).toEqual({ percent: 100, tone: 'warn' })
  })

  it('has no bar when the count is unknown or the limit is not a number', () => {
    expect(usageOf(null, 400)).toBeNull()
    expect(usageOf(NaN, 400)).toBeNull()
    expect(usageOf(-1, 400)).toBeNull()
    expect(usageOf(10, 0)).toBeNull()
  })
})

describe('what is left on a spool', () => {
  it('is the share of the spool left', () => {
    expect(spoolLeft(720, 1000)).toBe(72)
    expect(spoolLeft(1200, 1000)).toBe(100)
    expect(spoolLeft(-5, 1000)).toBe(0)
  })

  it('is unknown unless Spoolman gave both weights', () => {
    expect(spoolLeft(undefined, 1000)).toBeNull()
    expect(spoolLeft(500, undefined)).toBeNull()
    expect(spoolLeft(500, 0)).toBeNull()
  })
})
