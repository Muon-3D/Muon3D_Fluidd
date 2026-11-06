import { describe, expect, it } from 'vitest'
import { lastPrinted, layerCountOf, listDuration, materialOf, sortListRows } from '../list'

const file = (name: string, modified: number, time?: number, printing = false, extra: Record<string, number> = {}) => ({ kind: 'file' as const, name, modified, time, printing, ...extra })
const folder = (name: string) => ({ kind: 'folder' as const, name, modified: 0 })

describe('sortListRows', () => {
  const rows = [file('b.gcode', 10, 100), folder('zeta'), file('a.gcode', 30, 50), file('c.gcode', 20, 900, true), folder('alpha'), file('d.gcode', 5)]

  it('pins what is printing, then folders A to Z, then the files newest first', () => {
    expect(sortListRows(rows, 'newest').map(r => r.name)).toEqual(['c.gcode', 'alpha', 'zeta', 'a.gcode', 'b.gcode', 'd.gcode'])
  })

  it('orders by name, and by the longest print with files that have no time last', () => {
    expect(sortListRows(rows, 'name').map(r => r.name)).toEqual(['c.gcode', 'alpha', 'zeta', 'a.gcode', 'b.gcode', 'd.gcode'])
    expect(sortListRows(rows, 'longest').map(r => r.name)).toEqual(['c.gcode', 'alpha', 'zeta', 'b.gcode', 'a.gcode', 'd.gcode'])
  })
})

describe('sortListRows by a fact', () => {
  const rows = [file('a.gcode', 1, 1, false, { size: 10, filament: 5, layer: 0.2 }), file('b.gcode', 2, 1, false, { size: 30, filament: 1, layer: 0.1 }), file('c.gcode', 3, 1, false, { size: 20 })]
  it('puts the biggest first, the finest layer first, and turns round', () => {
    expect(sortListRows(rows, 'size').map(r => r.name)).toEqual(['b.gcode', 'c.gcode', 'a.gcode'])
    expect(sortListRows(rows, 'size', true).map(r => r.name)).toEqual(['a.gcode', 'c.gcode', 'b.gcode'])
    expect(sortListRows(rows, 'layer').map(r => r.name)).toEqual(['b.gcode', 'a.gcode', 'c.gcode'])
    expect(sortListRows(rows, 'filament').map(r => r.name)).toEqual(['a.gcode', 'b.gcode', 'c.gcode'])
  })
  it('keeps files with no value last, even turned round', () => {
    expect(sortListRows(rows, 'layer', true).map(r => r.name)).toEqual(['a.gcode', 'b.gcode', 'c.gcode'])
    expect(sortListRows(rows, 'name', true).map(r => r.name)).toEqual(['c.gcode', 'b.gcode', 'a.gcode'])
  })
})

describe('lastPrinted', () => {
  const now = new Date(2026, 10, 6, 12, 0)
  const at = (y: number, m: number, d: number) => new Date(y, m, d, 9).getTime() / 1000
  it('says Never, Today, Yesterday, a day and month, and the year when it is another', () => {
    expect(lastPrinted(undefined, false, now)).toBe('Never')
    expect(lastPrinted(null, true, now)).toBe('Printed before')
    expect(lastPrinted(at(2026, 10, 6), true, now)).toBe('Today')
    expect(lastPrinted(at(2026, 10, 5), true, now)).toBe('Yesterday')
    expect(lastPrinted(at(2026, 10, 2), true, now)).toBe('2 Nov')
    expect(lastPrinted(at(2025, 9, 18), true, now)).toBe('18 Oct 2025')
  })
})

describe('list facts', () => {
  it('reads the material, the time and the layers', () => {
    expect(materialOf('PLA;PLA')).toBe('PLA')
    expect(materialOf(undefined)).toBe('')
    expect(listDuration(38 * 60)).toBe('38 m')
    expect(listDuration(4 * 3600 + 8 * 60)).toBe('4 h 08 m')
    expect(listDuration(undefined)).toBe('—')
    expect(layerCountOf({ layer_count: 25 })).toBe(25)
    expect(layerCountOf({ object_height: 5, layer_height: 0.2 })).toBe(25)
    expect(layerCountOf({})).toBeNull()
  })
})
