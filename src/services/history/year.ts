import { filamentGrams, historyStatus } from './model'

/**
 * The year of printing behind History's grid and spool ring (design-lab A and
 * C): one cell per local calendar day, Monday to Sunday down, weeks across,
 * the last cell today. Everything here is plain data in, plain data out.
 *
 * - A day is the local day (this device's time zone) the print STARTED in.
 * - Everything counts finished prints only: a day's prints, its hours (the
 *   print_duration, as History's rollup measures it) and its filament. Stopped
 *   and failed prints are listed on their day but add nothing.
 * - A streak is consecutive days with at least one finished print.
 */

/** The most jobs asked for in one go; a reply that says there are more is shown as the latest of them. */
export const YEAR_LIMIT = 5000

export type YearMetric = 'hours' | 'prints' | 'filament'

export const YEAR_METRICS: Array<{ value: YearMetric, label: string }> = [
  { value: 'hours', label: 'Hours' },
  { value: 'prints', label: 'Prints' },
  { value: 'filament', label: 'Filament' }
]

/** What of a history item the year reads. */
export interface YearJob {
  job_id: string;
  filename: string;
  status: string;
  start_time: number;
  print_duration: number;
  filament_used: number;
  metadata?: unknown;
}

export interface YearPrint {
  id: string;
  filename: string;
  finished: boolean;
  hours: number;
  grams: number;
  mm: number;
  startedAt: Date;
}

export interface YearDay {
  /** Position in the year, 0 = the first Monday. */
  index: number;
  /** Local date as YYYY-MM-DD. */
  key: string;
  date: Date;
  /** Column: weeks from the first. */
  week: number;
  /** Row: 0 Monday to 6 Sunday. */
  dow: number;
  prints: YearPrint[];
  /** Prints that finished. */
  n: number;
  hours: number;
  grams: number;
  mm: number;
}

export interface Year {
  days: YearDay[];
  weeks: number;
  /** Unix seconds of the first day's local midnight: ask the printer for jobs since then. */
  since: number;
  timeZone: string;
}

export interface YearTotals {
  prints: number;
  hours: number;
  grams: number;
  mm: number;
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const pad = (n: number) => String(n).padStart(2, '0')

/** The local calendar day of a moment, as YYYY-MM-DD. */
export function dayKey (date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** This device's time zone, for the label under the grid. */
export function deviceTimeZone (): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time'
  } catch {
    return 'local time'
  }
}

/**
 * The year ending today: 52 weeks back to a Monday, then to today. Days are
 * made from calendar fields, never by adding 24 hours, so a day of 23 or 25
 * hours (daylight saving) is still one day.
 */
export function buildYear (jobs: YearJob[], now: Date = new Date()): Year {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  const back = 52 * 7 + ((now.getDay() + 6) % 7)
  const first = new Date(y, m, d - back)
  const days: YearDay[] = []
  const byKey = new Map<string, YearDay>()
  for (let i = 0; i <= back; i++) {
    const date = new Date(y, m, d - back + i)
    const day: YearDay = { index: i, key: dayKey(date), date, week: Math.floor(i / 7), dow: i % 7, prints: [], n: 0, hours: 0, grams: 0, mm: 0 }
    days.push(day)
    byKey.set(day.key, day)
  }
  for (const job of jobs) {
    const kind = historyStatus(job.status).kind
    if (kind === 'printing' || kind === 'other') continue
    const startedAt = new Date(job.start_time * 1000)
    const day = byKey.get(dayKey(startedAt))
    if (!day) continue
    const mm = Number(job.filament_used) || 0
    const grams = filamentGrams(mm, job.metadata as never).grams
    const hours = Math.max(0, Number(job.print_duration) || 0) / 3600
    const finished = kind === 'finished'
    day.prints.push({ id: job.job_id, filename: job.filename, finished, hours, grams, mm, startedAt })
    if (!finished) continue
    day.n++
    day.hours += hours
    day.grams += grams
    day.mm += mm
  }
  for (const day of days) day.prints.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
  return { days, weeks: days[days.length - 1].week + 1, since: Math.floor(first.getTime() / 1000), timeZone: deviceTimeZone() }
}

/** Unix seconds of the first day of the year ending on `now`: ask the printer for jobs since then. */
export function yearSince (now: Date = new Date()): number {
  return buildYear([], now).since
}

/**
 * Totals and streaks. The current streak is the run that reaches today; a
 * today with no finished print yet doesn't end it (there is still time), so it
 * then counts back from yesterday.
 */
export function yearTotals (days: YearDay[]): YearTotals {
  let prints = 0; let hours = 0; let grams = 0; let mm = 0; let activeDays = 0
  let longest = 0; let run = 0
  for (const day of days) {
    prints += day.n; hours += day.hours; grams += day.grams; mm += day.mm
    if (day.n) { activeDays++; run++; longest = Math.max(longest, run) } else run = 0
  }
  let current = 0
  let i = days.length - 1
  if (i >= 0 && !days[i].n) i--
  for (; i >= 0 && days[i].n; i--) current++
  return { prints, hours, grams, mm, activeDays, longestStreak: longest, currentStreak: current }
}

export function metricValue (day: YearDay, metric: YearMetric): number {
  return metric === 'hours' ? day.hours : metric === 'prints' ? day.n : day.grams
}

const STEPS: Record<YearMetric, [number, number, number]> = {
  hours: [1.5, 4, 8],
  prints: [1, 2, 4],
  filament: [20, 60, 120]
}

/** 0 for nothing, 1 to 4 for more and more of the metric: the shade of a cell. */
export function level (day: YearDay, metric: YearMetric): 0 | 1 | 2 | 3 | 4 {
  const v = metricValue(day, metric)
  if (!(v > 0)) return 0
  const [a, b, c] = STEPS[metric]
  return v < a ? 1 : v < b ? 2 : v < c ? 3 : 4
}

export function formatHours (hours: number): string {
  const minutes = Math.round(hours * 60)
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}

export function formatGrams (grams: number): string {
  return grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${Math.round(grams)} g`
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** "Tue 10 Nov 2026". */
export function dayText (date: Date): string {
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** What a cell says to a screen reader and on hover: the date and the day's three numbers. */
export function dayLabelText (day: YearDay): string {
  const when = dayText(day.date)
  if (!day.n) return `${when}: no finished prints`
  return `${when}: ${plural(day.n, 'print')}, ${formatHours(day.hours)}, ${formatGrams(day.grams)} of filament`
}

/** The big number in the ring and the words under it, for the metric. */
export function ringText (totals: YearTotals, metric: YearMetric): { big: string, sub: string } {
  switch (metric) {
    case 'hours': return { big: `${Math.round(totals.hours)} h`, sub: 'of printing' }
    case 'prints': return { big: String(totals.prints), sub: 'prints this year' }
    default: return { big: `${(totals.grams / 1000).toFixed(1)} kg`, sub: `${Math.round(totals.mm / 1000)} m of filament` }
  }
}

/** The month names along the top of the grid, each over the first Monday's column in that month. */
export function monthLabels (days: YearDay[]): Array<{ week: number, text: string }> {
  const labels: Array<{ week: number, text: string }> = []
  let last = -1
  for (const day of days) {
    if (day.dow !== 0) continue
    const month = day.date.getMonth()
    if (month === last) continue
    last = month
    labels.push({ week: day.week, text: MONTHS[month] })
  }
  return labels
}

/**
 * Where a key moves from a cell: left and right a week, up and down a day
 * within the week, Home and End the ends of the week (with Ctrl, the ends of
 * the year), PageUp and PageDown four weeks. Off the grid it stays put.
 */
export function moveCell (index: number, key: string, count: number, ctrl = false): number {
  const dow = index % 7
  const clamp = (i: number) => Math.min(count - 1, Math.max(0, i))
  switch (key) {
    case 'ArrowLeft': return index - 7 >= 0 ? index - 7 : index
    case 'ArrowRight': return index + 7 < count ? index + 7 : index
    case 'ArrowUp': return dow > 0 ? index - 1 : index
    case 'ArrowDown': return dow < 6 && index + 1 < count ? index + 1 : index
    case 'Home': return ctrl ? 0 : index - dow
    case 'End': return ctrl ? count - 1 : clamp(index - dow + 6)
    case 'PageUp': return clamp(index - 28)
    case 'PageDown': return clamp(index + 28)
    default: return index
  }
}

/** The ring's sweep in degrees: from the top, clockwise, a gap at the end. */
export const SPOOL_SWEEP = 318
const SPOOL_START = -90 + (360 - SPOOL_SWEEP) / 2

/** An annular sector for a day on the ring: its weekday is the ring, its week the angle. */
export function spoolPath (day: Pick<YearDay, 'week' | 'dow'>, weeks: number): string {
  const step = SPOOL_SWEEP / weeks
  const r0 = 64 + day.dow * 12.4
  const r1 = r0 + 10.6
  const a0 = SPOOL_START + day.week * step + 0.5
  const a1 = SPOOL_START + (day.week + 1) * step - 0.5
  const pt = (r: number, deg: number) => {
    const a = deg * Math.PI / 180
    return `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`
  }
  return `M${pt(r1, a0)}A${r1} ${r1} 0 0 1 ${pt(r1, a1)}L${pt(r0, a1)}A${r0} ${r0} 0 0 0 ${pt(r0, a0)}Z`
}
