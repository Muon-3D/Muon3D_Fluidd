import { afterEach, describe, expect, it } from 'vitest'
import {
  buildYear, dayKey, dayLabelText, formatGrams, formatHours, level, metricValue, monthLabels, moveCell, ringText, spoolPath, yearSince, yearTotals,
  type YearJob
} from '../year'

const REAL_TZ = process.env.TZ

/** Run with this device's time zone set (the unit tests run in forked processes, so TZ is ours). */
function inZone (zone: string) {
  process.env.TZ = zone
}

afterEach(() => {
  if (REAL_TZ === undefined) delete process.env.TZ
  else process.env.TZ = REAL_TZ
})

// 3 g for every 1000 mm, so grams are exact in the tests.
const META = { filament_total: 1000, filament_weight_total: 3 }

function job (id: string, startIso: string, over: Partial<YearJob> = {}): YearJob {
  return {
    job_id: id,
    filename: `${id}.gcode`,
    status: 'completed',
    start_time: Date.parse(startIso) / 1000,
    print_duration: 3600,
    filament_used: 1000,
    metadata: META,
    ...over
  }
}

describe('the days of the year', () => {
  it('runs from a Monday 52 weeks back to today, one cell per local day', () => {
    inZone('Europe/London')
    const year = buildYear([], new Date(2026, 10, 12, 15, 0)) // Thu 12 Nov 2026
    expect(year.days[0].dow).toBe(0)
    expect(year.days[0].key).toBe('2025-11-10') // a Monday, 52 weeks and 3 days back
    expect(new Date(2025, 10, 10).getDay()).toBe(1)
    expect(year.days.at(-1)?.key).toBe('2026-11-12')
    expect(year.days).toHaveLength(52 * 7 + 4)
    expect(year.weeks).toBe(53)
    expect(year.days.every((d, i) => d.index === i && d.week === Math.floor(i / 7) && d.dow === i % 7)).toBe(true)
  })

  it('names the device time zone and the unix time to ask the printer from', () => {
    inZone('Europe/London')
    const year = buildYear([], new Date(2026, 10, 12))
    expect(year.timeZone).toBe('Europe/London')
    expect(year.since).toBe(Date.UTC(2025, 10, 10) / 1000) // midnight in London, in November, is UTC
  })

  it('keeps one cell per calendar day across the 25-hour day when the clocks go back (New York, 1 Nov 2026)', () => {
    inZone('America/New_York')
    const year = buildYear([], new Date(2026, 10, 3, 9, 0))
    const keys = year.days.map(d => d.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toContain('2026-11-01')
    const i = keys.indexOf('2026-11-01')
    expect(keys.slice(i - 1, i + 2)).toEqual(['2026-10-31', '2026-11-01', '2026-11-02'])
    expect(year.days[i].dow).toBe(6) // 1 Nov 2026 is a Sunday
  })

  it('keeps one cell per calendar day across the 23-hour day when they go forward (New York, 8 Mar 2026)', () => {
    inZone('America/New_York')
    const year = buildYear([], new Date(2026, 2, 10, 9, 0))
    const keys = year.days.map(d => d.key)
    expect(new Set(keys).size).toBe(keys.length)
    const i = keys.indexOf('2026-03-08')
    expect(keys.slice(i - 1, i + 2)).toEqual(['2026-03-07', '2026-03-08', '2026-03-09'])
  })

  it('does the same in London when the clocks go back (25 Oct 2026)', () => {
    inZone('Europe/London')
    const year = buildYear([], new Date(2026, 9, 27, 9, 0))
    const keys = year.days.map(d => d.key)
    expect(new Set(keys).size).toBe(keys.length)
    const i = keys.indexOf('2026-10-25')
    expect(keys.slice(i - 1, i + 2)).toEqual(['2026-10-24', '2026-10-25', '2026-10-26'])
  })
})

describe('which day a print falls on', () => {
  it('is the local day it started, not the UTC day', () => {
    // The same instant, 03:30 UTC on 12 Nov: the evening of the 11th in New York, the afternoon of the 12th in Auckland.
    const at = '2026-11-12T03:30:00Z'
    inZone('America/New_York')
    const ny = buildYear([job('a', at)], new Date(2026, 10, 14))
    expect(ny.days.find(d => d.prints.length)?.key).toBe('2026-11-11')
    inZone('Pacific/Auckland')
    const nz = buildYear([job('a', at)], new Date(2026, 10, 14))
    expect(nz.days.find(d => d.prints.length)?.key).toBe('2026-11-12')
  })

  it('splits at local midnight, one minute either side', () => {
    inZone('America/New_York')
    const year = buildYear([
      job('late', '2026-11-12T04:59:00Z'), // 23:59 on the 11th (EST)
      job('early', '2026-11-12T05:00:00Z') // 00:00 on the 12th
    ], new Date(2026, 10, 14))
    expect(year.days.find(d => d.key === '2026-11-11')?.prints.map(p => p.id)).toEqual(['late'])
    expect(year.days.find(d => d.key === '2026-11-12')?.prints.map(p => p.id)).toEqual(['early'])
  })

  it('puts both 01:30s of the 25-hour day on that one day', () => {
    inZone('America/New_York')
    const year = buildYear([
      job('first', '2026-11-01T05:30:00Z'), // 01:30 EDT
      job('second', '2026-11-01T06:30:00Z') // 01:30 EST, an hour later by the clock
    ], new Date(2026, 10, 3))
    const day = year.days.find(d => d.key === '2026-11-01')
    expect(day?.prints.map(p => p.id)).toEqual(['first', 'second'])
    expect(day?.n).toBe(2)
  })

  it('keeps the 23-hour day whole too', () => {
    inZone('America/New_York')
    const year = buildYear([
      job('before', '2026-03-08T06:59:00Z'), // 01:59 EST on the 8th
      job('after', '2026-03-08T07:00:00Z') // 03:00 EDT, the same day
    ], new Date(2026, 2, 10))
    expect(year.days.find(d => d.key === '2026-03-08')?.n).toBe(2)
  })

  it('ignores prints from before the year and still-running ones', () => {
    inZone('Europe/London')
    const year = buildYear([
      job('old', '2025-11-09T12:00:00Z'), // the Sunday before the first Monday
      job('now', '2026-11-12T09:00:00Z', { status: 'in_progress' }),
      job('odd', '2026-11-12T09:00:00Z', { status: 'something_new' })
    ], new Date(2026, 10, 12, 15))
    expect(yearTotals(year.days)).toMatchObject({ prints: 0, hours: 0, grams: 0 })
  })
})

describe('what a day adds up to', () => {
  const now = new Date(2026, 10, 12, 15)

  it('counts finished prints only: stopped and failed ones are listed but add nothing', () => {
    inZone('Europe/London')
    const year = buildYear([
      job('a', '2026-11-10T08:00:00Z', { print_duration: 7200, filament_used: 2000 }),
      job('b', '2026-11-10T14:00:00Z', { print_duration: 1800, filament_used: 500 }),
      job('c', '2026-11-10T20:00:00Z', { status: 'cancelled', print_duration: 900, filament_used: 250 }),
      job('d', '2026-11-10T21:00:00Z', { status: 'error', print_duration: 0, filament_used: 0 })
    ], now)
    const day = year.days.find(d => d.key === '2026-11-10')!
    expect(day.n).toBe(2) // a and b finished; c was stopped, d failed
    expect(day.hours).toBeCloseTo(2 + 0.5)
    expect(day.grams).toBeCloseTo(6 + 1.5)
    expect(day.mm).toBe(2500)
    expect(metricValue(day, 'prints')).toBe(2)
    expect(metricValue(day, 'hours')).toBeCloseTo(2.5)
    expect(metricValue(day, 'filament')).toBeCloseTo(7.5)
    expect(day.prints.map(p => p.id)).toEqual(['a', 'b', 'c', 'd'])
    expect(day.prints.map(p => p.finished)).toEqual([true, true, false, false])
  })

  it('measures hours by print_duration, as History does, not the longer total_duration', () => {
    inZone('Europe/London')
    const year = buildYear([{ ...job('a', '2026-11-10T08:00:00Z', { print_duration: 3600 }), total_duration: 9000 } as YearJob], now)
    expect(yearTotals(year.days).hours).toBeCloseTo(1)
  })

  it('totals the year', () => {
    inZone('Europe/London')
    const year = buildYear([
      job('a', '2026-11-10T08:00:00Z'),
      job('b', '2026-11-11T08:00:00Z', { print_duration: 5400, filament_used: 4000 }),
      job('c', '2026-05-01T08:00:00Z', { status: 'cancelled' })
    ], now)
    const t = yearTotals(year.days)
    expect(t.prints).toBe(2)
    expect(t.hours).toBeCloseTo(1 + 1.5)
    expect(t.grams).toBeCloseTo(3 + 12)
    expect(t.mm).toBe(5000)
    expect(t.activeDays).toBe(2)
  })

  it('shades by the metric', () => {
    inZone('Europe/London')
    const year = buildYear([
      job('a', '2026-11-10T08:00:00Z', { print_duration: 1 * 3600 }),
      job('b', '2026-11-11T08:00:00Z', { print_duration: 5 * 3600, filament_used: 30_000 }),
      job('c', '2026-11-11T18:00:00Z', { print_duration: 5 * 3600, filament_used: 30_000 })
    ], now)
    const tenth = year.days.find(d => d.key === '2026-11-10')!
    const eleventh = year.days.find(d => d.key === '2026-11-11')!
    expect(level(year.days[0], 'hours')).toBe(0)
    expect(level(tenth, 'hours')).toBe(1)
    expect(level(eleventh, 'hours')).toBe(4) // 10 h
    expect(level(tenth, 'prints')).toBe(2) // one print is the second shade
    expect(level(eleventh, 'prints')).toBe(3) // 2 prints is below 4
    expect(level(tenth, 'filament')).toBe(1) // 3 g
    expect(level(eleventh, 'filament')).toBe(4) // 180 g
  })
})

describe('streaks', () => {
  const now = new Date(2026, 10, 12, 15)
  const on = (...dates: string[]) => dates.map((d, i) => job(`j${i}`, `${d}T10:00:00Z`))

  it('finds the longest run and the one that reaches today', () => {
    inZone('Europe/London')
    const year = buildYear(on('2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-11-11', '2026-11-12'), now)
    expect(yearTotals(year.days)).toMatchObject({ longestStreak: 4, currentStreak: 2, activeDays: 6 })
  })

  it('keeps the current streak alive while today is still empty', () => {
    inZone('Europe/London')
    const year = buildYear(on('2026-11-09', '2026-11-10', '2026-11-11'), now)
    expect(yearTotals(year.days)).toMatchObject({ longestStreak: 3, currentStreak: 3 })
  })

  it('ends the current streak when yesterday and today are both empty', () => {
    inZone('Europe/London')
    const year = buildYear(on('2026-11-09', '2026-11-10'), now)
    expect(yearTotals(year.days)).toMatchObject({ longestStreak: 2, currentStreak: 0 })
  })

  it('does not count a day with only a stopped or failed print', () => {
    inZone('Europe/London')
    const year = buildYear([
      job('a', '2026-11-10T10:00:00Z'),
      job('b', '2026-11-11T10:00:00Z', { status: 'cancelled' }),
      job('c', '2026-11-12T10:00:00Z')
    ], now)
    expect(yearTotals(year.days)).toMatchObject({ longestStreak: 1, currentStreak: 1 })
  })

  it('counts a streak across the clocks changing', () => {
    inZone('America/New_York')
    const year = buildYear(on('2026-10-31', '2026-11-01', '2026-11-02'), new Date(2026, 10, 2, 20))
    expect(yearTotals(year.days)).toMatchObject({ longestStreak: 3, currentStreak: 3 })
  })

  it('is zero for an empty year', () => {
    expect(yearTotals(buildYear([], now).days)).toMatchObject({ prints: 0, longestStreak: 0, currentStreak: 0, activeDays: 0 })
  })
})

describe('the words', () => {
  it('formats hours and grams for people', () => {
    expect(formatHours(0.25)).toBe('15 min')
    expect(formatHours(1)).toBe('1 h')
    expect(formatHours(3.2)).toBe('3 h 12 min')
    expect(formatGrams(41.4)).toBe('41 g')
    expect(formatGrams(2400)).toBe('2.4 kg')
  })

  it('labels a day with its date and its numbers', () => {
    inZone('Europe/London')
    const year = buildYear([job('a', '2026-11-10T08:00:00Z', { print_duration: 11520, filament_used: 13_800 })], new Date(2026, 10, 12))
    expect(dayLabelText(year.days.find(d => d.key === '2026-11-10')!)).toBe('Tue 10 Nov 2026: 1 print, 3 h 12 min, 41 g of filament')
    expect(dayLabelText(year.days.find(d => d.key === '2026-11-09')!)).toBe('Mon 9 Nov 2026: no finished prints')
  })

  it('asks for jobs since the first Monday, midnight local', () => {
    inZone('America/New_York')
    expect(yearSince(new Date(2026, 10, 12, 15))).toBe(Date.UTC(2025, 10, 10, 5) / 1000) // 00:00 EST is 05:00 UTC
  })

  it('puts the metric in the middle of the ring', () => {
    inZone('Europe/London')
    const year = buildYear([job('a', '2026-11-11T08:00:00Z', { print_duration: 7200, filament_used: 300_000 })], new Date(2026, 10, 12))
    const t = yearTotals(year.days)
    expect(ringText(t, 'hours')).toEqual({ big: '2 h', sub: 'of printing' })
    expect(ringText(t, 'prints')).toEqual({ big: '1', sub: 'prints this year' })
    expect(ringText(t, 'filament')).toEqual({ big: '0.9 kg', sub: '300 m of filament' })
  })

  it('names each month over its first Monday', () => {
    inZone('Europe/London')
    const labels = monthLabels(buildYear([], new Date(2026, 10, 12)).days)
    expect(labels[0]).toEqual({ week: 0, text: 'Nov' })
    expect(labels.map(l => l.text)).toEqual(['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'])
    expect(new Set(labels.map(l => l.week)).size).toBe(labels.length)
  })

  it('is deterministic by day key', () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('moving between days', () => {
  const count = 367

  it('goes a week with left and right, a day with up and down', () => {
    expect(moveCell(100, 'ArrowRight', count)).toBe(107)
    expect(moveCell(100, 'ArrowLeft', count)).toBe(93)
    expect(moveCell(100, 'ArrowDown', count)).toBe(101)
    expect(moveCell(100, 'ArrowUp', count)).toBe(99)
  })

  it('stops at the edges', () => {
    expect(moveCell(3, 'ArrowLeft', count)).toBe(3)
    expect(moveCell(count - 2, 'ArrowRight', count)).toBe(count - 2)
    expect(moveCell(7, 'ArrowUp', count)).toBe(7) // Monday: nothing above
    expect(moveCell(13, 'ArrowDown', count)).toBe(13) // Sunday: nothing below
    expect(moveCell(count - 1, 'ArrowDown', count)).toBe(count - 1) // today, the last day
  })

  it('jumps with Home, End, PageUp, PageDown', () => {
    expect(moveCell(100, 'Home', count)).toBe(98)
    expect(moveCell(100, 'End', count)).toBe(104)
    expect(moveCell(count - 3, 'End', count)).toBe(count - 1)
    expect(moveCell(100, 'PageUp', count)).toBe(72)
    expect(moveCell(10, 'PageUp', count)).toBe(0)
    expect(moveCell(100, 'PageDown', count)).toBe(128)
    expect(moveCell(count - 5, 'PageDown', count)).toBe(count - 1)
    expect(moveCell(100, 'Home', count, true)).toBe(0)
    expect(moveCell(100, 'End', count, true)).toBe(count - 1)
    expect(moveCell(100, 'x', count)).toBe(100)
  })
})

describe('the ring', () => {
  it('draws a closed sector for every day, on its own band', () => {
    const a = spoolPath({ week: 0, dow: 0 }, 53)
    const b = spoolPath({ week: 0, dow: 6 }, 53)
    expect(a).toMatch(/^M[-\d. ]+A[\d. ]+ 0 0 1 [-\d. ]+L[-\d. ]+A[\d. ]+ 0 0 0 [-\d. ]+Z$/)
    expect(a).not.toBe(b)
    expect(spoolPath({ week: 52, dow: 0 }, 53)).not.toBe(a)
  })
})
