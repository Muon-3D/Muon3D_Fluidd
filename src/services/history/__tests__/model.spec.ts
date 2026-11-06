import { describe, expect, it, test } from 'vitest'
import { dayLabel, filterHistory, finishedAt, emptyState, filamentGrams, finishedShare, grams, groupByDay, historyResult, historyRollup, historyStatus, inRange, metres, rangeLabel, slicerFacts, tileDuration, tileWeight } from '../model'

describe('how a print ended', () => {
  test.each([
    ['completed', 'Finished', 'finished'],
    ['in_progress', 'Printing', 'printing'],
    ['error', 'Failed', 'failed'],
    ['klippy_shutdown', 'Failed', 'failed'],
    ['interrupted', 'Failed', 'failed'],
    ['cancelled', 'Stopped', 'stopped']
  ])('%s is %s', (status, text, kind) => {
    expect(historyStatus(status)).toMatchObject({ text, kind })
  })

  it('says how far a stopped print got', () => {
    expect(historyStatus('cancelled', 420, 4200).text).toBe('Stopped at 10%')
  })

  it('shows an unknown status as it is', () => {
    expect(historyStatus('something_new')).toEqual({ kind: 'other', text: 'something_new', tone: 'off' })
  })
})

describe('filtering', () => {
  const items = [
    { filename: 'a/Benchy.gcode', status: 'completed' },
    { filename: 'cube.gcode', status: 'cancelled' },
    { filename: 'benchy_v2.gcode', status: 'error' }
  ]

  it('keeps one kind', () => {
    expect(filterHistory(items, 'stopped', '').map(i => i.filename)).toEqual(['cube.gcode'])
    expect(filterHistory(items, 'failed', '').map(i => i.filename)).toEqual(['benchy_v2.gcode'])
  })

  it('finds by file name, any case', () => {
    expect(filterHistory(items, 'all', 'BENCHY')).toHaveLength(2)
    expect(filterHistory(items, 'finished', 'benchy')).toHaveLength(1)
  })
})

describe('days', () => {
  const now = new Date(2026, 9, 11, 18, 0)
  const at = (y: number, mo: number, d: number, h = 12) => new Date(y, mo, d, h).getTime() / 1000

  it('names today and yesterday, then the day', () => {
    expect(dayLabel(at(2026, 9, 11, 1), now)).toBe('Today')
    expect(dayLabel(at(2026, 9, 10, 23), now)).toBe('Yesterday')
    expect(dayLabel(at(2026, 9, 3), now)).toBe('Sat 3 Oct')
    expect(dayLabel(at(2025, 11, 31), now)).toBe('Wed 31 Dec 2025')
  })

  it('groups prints by the day they started, newest first', () => {
    const groups = groupByDay([
      { start_time: at(2026, 9, 10, 9) },
      { start_time: at(2026, 9, 11, 9) },
      { start_time: at(2026, 9, 10, 15) }
    ], now)
    expect(groups.map(g => [g.label, g.items.length])).toEqual([['Today', 1], ['Yesterday', 2]])
    expect(groups[1].items[0].start_time).toBe(at(2026, 9, 10, 15))
  })
})

describe('numbers', () => {
  test.each([[850, '0.85 m'], [12_400, '12.4 m'], [1_240_000, '1,240 m']])('%d mm is %s', (mm, text) => {
    expect(metres(mm)).toBe(text)
  })

  it('counts the finished', () => {
    expect(finishedShare([{ status: 'completed' }, { status: 'error' }, { status: 'completed' }])).toBe('2 of the last 3 finished')
  })

  it('picks the slicer facts people check, in order', () => {
    expect(slicerFacts({ slicer: 'OrcaSlicer', slicer_version: '2.3.0', filament_type: 'PLA;PETG', layer_height: 0.2, first_layer_extr_temp: 220, filament_weight_total: 26.1, size: 4 }))
      .toEqual([
        { label: 'Slicer', value: 'OrcaSlicer 2.3.0' },
        { label: 'Material', value: 'PLA' },
        { label: 'Layer height', value: '0.2 mm' },
        { label: 'Nozzle', value: '220° first layer' },
        { label: 'Planned filament', value: '26 g' }
      ])
    expect(slicerFacts(undefined)).toEqual([])
  })
})

describe('the v3 result pill', () => {
  it('says Done, Failed or Cancelled, keeping how far a cancelled print got', () => {
    expect(historyResult('completed')).toMatchObject({ kind: 'finished', text: 'Done', tone: 'ok' })
    expect(historyResult('error')).toMatchObject({ kind: 'failed', text: 'Failed', tone: 'err' })
    expect(historyResult('cancelled', 420, 4200)).toMatchObject({ kind: 'stopped', text: 'Cancelled', tone: 'warn', detail: 'Stopped at 10%' })
    expect(historyResult('cancelled')).toMatchObject({ text: 'Cancelled', detail: 'Stopped' })
  })
})

describe('the date range', () => {
  const now = new Date(2026, 10, 6, 12, 0)
  const ago = (days: number) => now.getTime() / 1000 - days * 86400

  it('keeps the prints that started within the last N days, or all of them', () => {
    const items = [{ start_time: ago(1) }, { start_time: ago(29) }, { start_time: ago(31) }]
    expect(inRange(items, 30, now)).toHaveLength(2)
    expect(inRange(items, 7, now)).toHaveLength(1)
    expect(inRange(items, 0, now)).toHaveLength(3)
  })

  it('names the range', () => {
    expect(rangeLabel(30)).toBe('Last 30 days')
    expect(rangeLabel(0)).toBe('All time')
  })
})

describe('the rollup tiles', () => {
  const item = (status: string, mm: number, secs: number, type = 'PLA', colour = '#80d6d1') => ({
    status, filament_used: mm, print_duration: secs, metadata: { filament_type: type, filament_colors: [colour] }
  })

  it('counts prints, the success rate, time, filament and the usual material', () => {
    const r = historyRollup([item('completed', 1000, 3600), item('completed', 1000, 7200), item('error', 1000, 3600), item('cancelled', 0, 600)])
    expect(r.prints).toBe(4)
    expect(r.done).toBe(2)
    expect(r.notDone).toBe(2)
    expect(r.successPercent).toBe(50)
    expect(r.printSeconds).toBe(15000)
    expect(r.averageSeconds).toBe(3750)
    expect(r.material).toEqual({ name: 'PLA', colour: '#80D6D1' })
  })

  it('has no success rate with nothing to rate', () => {
    expect(historyRollup([]).successPercent).toBeNull()
    expect(historyRollup([item('in_progress', 10, 10)]).successPercent).toBeNull()
  })

  it('weighs filament from its length, the slicer density and diameter when known', () => {
    expect(grams(1000, undefined)).toBeCloseTo(2.98, 1)
    expect(grams(1000, { filament_diameter: 2.85, filament_density: 1.27 })).toBeCloseTo(8.1, 1)
  })

  test.each([[64 * 3600, { value: '64', unit: 'h' }], [38 * 60, { value: '38', unit: 'm' }], [0, { value: '0', unit: 'm' }], [90 * 60, { value: '1.5', unit: 'h' }]])('%d s reads %j', (s, out) => {
    expect(tileDuration(s)).toEqual(out)
  })

  test.each([[1200, { value: '1.2', unit: 'kg' }], [41, { value: '41', unit: 'g' }], [11.4, { value: '11.4', unit: 'g' }]])('%d g reads %j', (g, out) => {
    expect(tileWeight(g)).toEqual(out)
  })
})

describe('when it finished', () => {
  const now = new Date(2026, 10, 6, 12, 0)
  const at = (y: number, mo: number, d: number, h: number, m: number) => new Date(y, mo, d, h, m).getTime() / 1000

  it('says Today or Yesterday with the time, else the date and time', () => {
    expect(finishedAt({ start_time: at(2026, 10, 5, 20, 0), end_time: String(at(2026, 10, 5, 21, 2)) }, now)).toBe('Yesterday 21:02')
    expect(finishedAt({ start_time: at(2026, 10, 6, 8, 0), end_time: null, total_duration: 600 }, now)).toBe('Today 08:10')
    expect(finishedAt({ start_time: at(2026, 10, 2, 15, 0), end_time: String(at(2026, 10, 2, 16, 20)) }, now)).toBe('2 Nov 16:20')
    expect(finishedAt({ start_time: at(2025, 11, 31, 9, 0), end_time: String(at(2025, 11, 31, 9, 30)) }, now)).toBe('31 Dec 2025 09:30')
  })
})

describe('filament weight', () => {
  it('prefers the slicer figure, scaled by how much of the planned filament was used', () => {
    expect(filamentGrams(6900, { filament_weight_total: 40, filament_total: 13800 })).toEqual({ grams: 20, estimated: false })
    expect(filamentGrams(13800, { filament_weight_total: 40, filament_total: 13800 })).toEqual({ grams: 40, estimated: false })
  })

  it('falls back to the length estimate, marked estimated, when the slicer gave no figure', () => {
    const out = filamentGrams(1000, undefined)
    expect(out.estimated).toBe(true)
    expect(out.grams).toBeCloseTo(grams(1000), 5)
    expect(filamentGrams(1000, { filament_weight_total: 40 }).estimated).toBe(true)
    expect(filamentGrams(1000, { filament_weight_total: 40, filament_total: 0 }).estimated).toBe(true)
    expect(filamentGrams(1000, { filament_total: 5000 }).estimated).toBe(true)
  })

  it('says the rollup is estimated unless every print had the slicer figure', () => {
    const exact = { status: 'completed', filament_used: 1000, print_duration: 60, metadata: { filament_weight_total: 3, filament_total: 1000 } }
    const guess = { status: 'completed', filament_used: 1000, print_duration: 60, metadata: {} }
    expect(historyRollup([exact, exact])).toMatchObject({ grams: 6, estimated: false })
    expect(historyRollup([exact, guess]).estimated).toBe(true)
  })
})

describe('a print still in progress', () => {
  it('counts as a print, with its time, but not toward the success rate', () => {
    const r = historyRollup([
      { status: 'completed', filament_used: 1000, print_duration: 3600 },
      { status: 'in_progress', filament_used: 500, print_duration: 600 }
    ])
    expect(r).toMatchObject({ prints: 2, done: 1, notDone: 0, successPercent: 100, printSeconds: 4200 })
  })
})

describe('why the list is empty', () => {
  const now = new Date(2026, 10, 6, 12, 0)
  const ago = (days: number) => now.getTime() / 1000 - days * 86400
  const job = (status: string, days: number, filename = 'a.gcode') => ({ status, start_time: ago(days), filename })
  const state = (items: ReturnType<typeof job>[], filter: 'all' | 'finished' | 'stopped' | 'failed', query: string, range: number) =>
    emptyState(items, filter, query, range, now)

  it('has nothing to say while there are rows', () => {
    expect(state([job('completed', 1)], 'all', '', 30)).toBeNull()
  })

  it('says no prints yet when the printer has none', () => {
    expect(state([], 'all', '', 30)).toMatchObject({ kind: 'none', title: 'No prints yet', widen: false })
  })

  it('says only older prints exist, and offers the wider range', () => {
    expect(state([job('completed', 60), job('error', 90)], 'all', '', 30))
      .toMatchObject({ kind: 'older', title: 'No prints in the last 30 days', hint: '2 older prints are in the history.', widen: true })
  })

  it('says a search found nothing in the range but older matches exist, and offers the wider range', () => {
    expect(state([job('completed', 1, 'cube.gcode'), job('completed', 60, 'gear.gcode')], 'all', 'gear', 30))
      .toMatchObject({ kind: 'search-range', title: 'No print matches "gear" in the last 30 days', hint: '1 older print matches.', widen: true })
  })

  it('keeps the spelling hint when nothing matches in any range', () => {
    expect(state([job('completed', 1, 'cube.gcode')], 'all', 'zzz', 30))
      .toMatchObject({ kind: 'search', title: 'No print matches "zzz"', widen: false })
    expect(state([job('completed', 1, 'cube.gcode')], 'all', 'zzz', 0).kind).toBe('search')
  })

  it('names a result filter, and offers the wider range only when it would help', () => {
    expect(state([job('completed', 1), job('error', 60)], 'failed', '', 30))
      .toMatchObject({ kind: 'filter-range', title: 'No failed prints in the last 30 days', widen: true })
    expect(state([job('completed', 1)], 'failed', '', 30))
      .toMatchObject({ kind: 'filter', title: 'No failed prints in the last 30 days', hint: 'Try a wider date range.', widen: false })
    expect(state([job('completed', 1)], 'stopped', '', 0)).toMatchObject({ title: 'No cancelled prints yet' })
  })
})
