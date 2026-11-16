import { describe, expect, it, vi } from 'vitest'
import data from '../library.json'
import { LIBRARY_CHIPS, MaterialLibrary, brandCounts, presetFromEntry, searchLibrary, type LibraryEntry } from '../library'
import { DEFAULT_MATERIALS } from '@/store/config/default-materials'

const entries = data.entries as LibraryEntry[]

describe('library.json', () => {
  it('covers the starter brands with sane, unique entries', () => {
    const brands = brandCounts(entries).map(b => b.brand)
    expect(brands).toEqual(['Generic', 'Bambu Lab', 'Polymaker', 'eSun', 'Prusament', 'Elegoo', 'Sunlu', 'Overture'])
    expect(new Set(entries.map(e => e.id)).size).toBe(entries.length)
    for (const e of entries) {
      expect(e.nozzle.min).toBeLessThanOrEqual(e.nozzle.default)
      expect(e.nozzle.default).toBeLessThanOrEqual(e.nozzle.max)
      expect(e.bed.min).toBeLessThanOrEqual(e.bed.default)
      expect(e.bed.default).toBeLessThanOrEqual(e.bed.max)
      expect(e.fan).toBeGreaterThanOrEqual(0)
      expect(e.fan).toBeLessThanOrEqual(100)
      expect(e.colour).toMatch(/^#[0-9A-F]{6}$/i)
    }
  })

  it('marks only the four defaults as tested on M1, at the default temperatures', () => {
    const tested = entries.filter(e => e.testedOnM1)
    expect(tested.map(e => e.name).sort()).toEqual(['ABS', 'PETG', 'PLA', 'TPU'])
    for (const d of DEFAULT_MATERIALS) {
      const e = tested.find(t => t.name === d.name)!
      expect([e.nozzle.default, e.bed.default]).toEqual([d.nozzle, d.bed])
    }
  })

  it('flags every carbon-fibre entry abrasive', () => {
    expect(entries.filter(e => /-CF$/.test(e.type)).every(e => e.abrasive)).toBe(true)
  })
})

describe('searchLibrary', () => {
  it('matches brand, name and type, every word', () => {
    const found = searchLibrary(entries, { text: 'polymaker petg' })
    expect(found.map(e => e.name)).toEqual(['PolyLite PETG', 'PolyMax PETG', 'PolyLite PETG-CF'])
  })

  it('stacks brand and chips', () => {
    const found = searchLibrary(entries, { brand: 'Bambu Lab', chips: ['cf'] })
    expect(found.length).toBeGreaterThan(0)
    expect(found.every(e => e.brand === 'Bambu Lab' && e.abrasive)).toBe(true)
    expect(searchLibrary(entries, { chips: ['tested'] })).toHaveLength(4)
    expect(LIBRARY_CHIPS.map(c => c.label)).toContain('ABS/ASA')
  })
})

describe('presetFromEntry', () => {
  it('copies the middle of the range, the fan % and where it came from', () => {
    const e = entries.find(x => x.id === 'polymaker-polylite-pla')!
    const p = presetFromEntry(e)
    expect(p.name).toBe('Polymaker PolyLite PLA')
    expect(p.values.extruder).toEqual({ value: 210, type: 'heater', active: true })
    expect(p.values.heater_bed).toEqual({ value: 60, type: 'heater', active: true })
    expect(p).toMatchObject({ origin: 'library', libraryId: e.id, source: 'Polymaker PolyLite PLA', partFan: 100, maker: { nozzle: [190, 230], bed: [50, 70] } })
  })
})

describe('MaterialLibrary', () => {
  it('lets a failed load be retried', async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ entries: entries.slice(0, 2) })
    const lib = new MaterialLibrary(loader)
    await expect(lib.load()).rejects.toThrow('offline')
    await expect(lib.load()).resolves.toHaveLength(2)
    await lib.load()
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
