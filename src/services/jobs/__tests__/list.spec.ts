import { describe, expect, it } from 'vitest'
import { lastPrinted, layerCountOf, listDuration, materialOf, sortListRows } from '../list'

const file = (name: string, modified: number, time?: number, printing = false) => ({ kind: 'file' as const, name, modified, time, printing })
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

describe('lastPrinted', () => {
  const now = new Date(2026, 10, 6, 12, 0)
  const at = (y: number, m: number, d: number) => new Date(y, m, d, 9).getTime() / 1000
  it('says Never, Today, Yesterday, a day and month, and the year when it is another', () => {
    expect(lastPrinted(undefined, now)).toBe('Never')
    expect(lastPrinted(at(2026, 10, 6), now)).toBe('Today')
    expect(lastPrinted(at(2026, 10, 5), now)).toBe('Yesterday')
    expect(lastPrinted(at(2026, 10, 2), now)).toBe('2 Nov')
    expect(lastPrinted(at(2025, 9, 18), now)).toBe('18 Oct 2025')
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
