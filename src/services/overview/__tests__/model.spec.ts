import { describe, expect, it } from 'vitest'
import { chartLines, filamentFact, heaterTile, longDuration } from '../model'

describe('a heater tile', () => {
  it('is off without a target', () => {
    expect(heaterTile(26, 0).status).toBe('off')
  })

  it('is at temperature within two degrees', () => {
    expect(heaterTile(213.5, 215)).toMatchObject({ status: 'at temperature', progress: 1 })
  })

  it('is heating below its target, and says how far it has come', () => {
    const tile = heaterTile(118.5, 215)
    expect(tile.status).toBe('heating')
    expect(tile.progress).toBeCloseTo(0.5, 1)
  })

  it('is cooling above it', () => {
    expect(heaterTile(240, 215).status).toBe('cooling')
  })
})

describe('the print\'s facts', () => {
  it('give filament in grams when the slicer said how heavy', () => {
    expect(filamentFact(1040, 2510, 7.5)).toBe('3.1 of 7.5 g')
  })

  it('in metres when it did not', () => {
    expect(filamentFact(1040, 2510, null)).toBe('1.04 of 2.51 m')
  })

  it('give durations in minutes and hours', () => {
    expect(longDuration(600)).toBe('10 min')
    expect(longDuration(3900)).toBe('1 h 5 min')
    expect(longDuration(7200)).toBe('2 h')
  })
})

describe('the temperature graph', () => {
  const now = 1_000_000
  const at = (s: number, extruder: number, bed: number) => ({ date: new Date(now - s * 1000), extruder, extruderTarget: 215, heater_bed: bed, heater_bedTarget: 60 })
  const data = [at(1200, 20, 20), at(600, 214, 59), at(300, 215, 60), at(0, 215, 60)]

  it('shows only the window asked for', () => {
    const { lines } = chartLines(data, ['extruder'], 900, now)
    expect(lines[0].path.split('L')).toHaveLength(3)
  })

  it('fits every reading and target, with room around them', () => {
    const { min, max } = chartLines(data, ['extruder', 'heater_bed'], 900, now)
    expect(min).toBeLessThan(59)
    expect(max).toBeGreaterThan(215)
  })

  it('draws each target as a flat line', () => {
    const { lines } = chartLines(data, ['extruder', 'heater_bed'], 900, now, 600, 160)
    const nozzle = lines.find(l => l.key === 'extruder')!
    const bed = lines.find(l => l.key === 'heater_bed')!
    expect(nozzle.targetY).not.toBeNull()
    expect(nozzle.targetY!).toBeLessThan(bed.targetY!)
  })

  it('draws nothing with no readings', () => {
    expect(chartLines([], ['extruder'], 900, now).lines).toEqual([])
  })
})
