import type { TileTone } from '@/services/printers-page/model'
import { fileFilament } from '@/services/control/model'

export type HistoryKind = 'finished' | 'stopped' | 'failed' | 'printing' | 'other'

export interface HistoryStatus {
  kind: HistoryKind;
  text: string;
  tone: TileTone;
}

/**
 * How a print ended, for people. A stopped print says how far it got, by
 * the filament it used of what the slicer planned.
 */
export function historyStatus (status: string, filamentUsed?: number, filamentTotal?: number): HistoryStatus {
  switch (status) {
    case 'completed': return { kind: 'finished', text: 'Finished', tone: 'ok' }
    case 'in_progress':
    case 'printing': return { kind: 'printing', text: 'Printing', tone: 'run' }
    case 'cancelled': {
      const part = filamentUsed && filamentTotal ? Math.min(100, Math.round(filamentUsed / filamentTotal * 100)) : null
      return { kind: 'stopped', text: part !== null ? `Stopped at ${part}%` : 'Stopped', tone: 'err' }
    }
    case 'klippy_shutdown':
    case 'klippy_disconnect':
    case 'server_exit':
    case 'interrupted':
    case 'error': return { kind: 'failed', text: 'Failed', tone: 'err' }
    default: return { kind: 'other', text: status, tone: 'off' }
  }
}

export type HistoryFilter = 'all' | 'finished' | 'stopped' | 'failed'

export function filterHistory<T extends { filename: string, status: string }> (items: T[], filter: HistoryFilter, query: string): T[] {
  const q = query.trim().toLowerCase()
  return items.filter(item => {
    if (filter !== 'all' && historyStatus(item.status).kind !== filter) return false
    return !q || item.filename.toLowerCase().includes(q)
  })
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Today", "Yesterday", "Sat 10 Oct", or "Sat 10 Oct 2025" from another year. */
export function dayLabel (seconds: number, now: Date = new Date()): string {
  const d = new Date(seconds * 1000)
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((start(now) - start(d)) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  const label = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
  return d.getFullYear() === now.getFullYear() ? label : `${label} ${d.getFullYear()}`
}

/** The prints by the day they started, newest first, each day's in the order given. */
export function groupByDay<T extends { start_time: number }> (items: T[], now: Date = new Date()): Array<{ label: string, items: T[] }> {
  const groups: Array<{ label: string, items: T[] }> = []
  for (const item of [...items].sort((a, b) => b.start_time - a.start_time)) {
    const label = dayLabel(item.start_time, now)
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

/** Filament in metres, for people: "12.4 m", "0.85 m", "1,240 m". */
export function metres (mm: number): string {
  const m = mm / 1000
  if (m >= 100) return `${Math.round(m).toLocaleString('en-GB')} m`
  if (m >= 10) return `${m.toFixed(1)} m`
  return `${m.toFixed(2)} m`
}

/** How many of the prints loaded finished, as "41 of the last 50 finished". */
export function finishedShare (items: Array<{ status: string }>): string {
  const done = items.filter(i => historyStatus(i.status).kind === 'finished').length
  return `${done} of the last ${items.length} finished`
}

/**
 * The slicer's facts worth showing for a print, in order, from its
 * metadata: what people check when a print went wrong.
 */
export function slicerFacts (meta: Record<string, unknown> | undefined): Array<{ label: string, value: string }> {
  if (!meta) return []
  const facts: Array<{ label: string, value: string }> = []
  const num = (key: string) => (typeof meta[key] === 'number' ? meta[key] as number : null)
  const add = (label: string, value: string | null) => { if (value) facts.push({ label, value }) }
  add('Slicer', [meta.slicer, meta.slicer_version].filter(Boolean).join(' ') || null)
  add('Material', typeof meta.filament_type === 'string' ? meta.filament_type.split(';')[0] : null)
  add('Layer height', num('layer_height') !== null ? `${num('layer_height')} mm` : null)
  add('Nozzle', num('first_layer_extr_temp') !== null ? `${num('first_layer_extr_temp')}° first layer` : null)
  add('Bed', num('first_layer_bed_temp') !== null ? `${num('first_layer_bed_temp')}° first layer` : null)
  add('Height', num('object_height') !== null ? `${num('object_height')} mm` : null)
  add('Planned filament', num('filament_weight_total') !== null ? `${Math.round(num('filament_weight_total')!)} g` : null)
  return facts
}

/**
 * The result pill the History table shows: Done, Failed or Cancelled. A
 * cancelled print keeps how far it got in `detail`, for its details.
 */
export function historyResult (status: string, filamentUsed?: number, filamentTotal?: number): HistoryStatus & { detail: string } {
  const was = historyStatus(status, filamentUsed, filamentTotal)
  switch (was.kind) {
    case 'finished': return { ...was, text: 'Done', detail: 'Done' }
    case 'stopped': return { ...was, text: 'Cancelled', tone: 'warn', detail: was.text }
    default: return { ...was, detail: was.text }
  }
}

/** The prints that started within the last `days` days; 0 keeps them all. */
export function inRange<T extends { start_time: number }> (items: T[], days: number, now: Date = new Date()): T[] {
  if (!days) return items
  const from = now.getTime() / 1000 - days * 86400
  return items.filter(i => i.start_time >= from)
}

export const RANGE_DAYS = [7, 30, 90, 0]

export function rangeLabel (days: number): string {
  return days ? `Last ${days} days` : 'All time'
}

/** Grams of filament from the length used: the slicer's diameter and density when it said, else 1.75 mm PLA. */
export function grams (mm: number, meta?: { filament_diameter?: number, filament_density?: number }): number {
  const d = Number(meta?.filament_diameter) || 1.75
  const rho = Number(meta?.filament_density) || 1.24
  return mm * Math.PI * (d / 2) ** 2 * rho / 1000
}

export interface HistoryRollup {
  prints: number;
  done: number;
  notDone: number;
  successPercent: number | null;
  printSeconds: number;
  averageSeconds: number;
  grams: number;
  material: { name: string, colour: string | null } | null;
}

interface RollupItem { status: string, filament_used: number, print_duration: number, metadata?: unknown }

/** The four tiles: how many prints, how many came out, the time, the filament, and the usual material. */
export function historyRollup (items: RollupItem[]): HistoryRollup {
  let done = 0
  let notDone = 0
  let seconds = 0
  let weight = 0
  const materials = new Map<string, { n: number, colour: string | null }>()
  for (const i of items) {
    const kind = historyStatus(i.status).kind
    if (kind === 'finished') done++
    else if (kind === 'stopped' || kind === 'failed') notDone++
    seconds += i.print_duration || 0
    const meta = i.metadata as Record<string, unknown> | undefined
    weight += grams(i.filament_used || 0, meta as never)
    const fil = fileFilament(meta)
    if (fil) {
      const seen = materials.get(fil.name)
      materials.set(fil.name, { n: (seen?.n ?? 0) + 1, colour: seen?.colour ?? fil.colour })
    }
  }
  const top = [...materials.entries()].sort((a, b) => b[1].n - a[1].n)[0]
  return {
    prints: items.length,
    done,
    notDone,
    successPercent: done + notDone ? Math.round(done / (done + notDone) * 100) : null,
    printSeconds: seconds,
    averageSeconds: items.length ? Math.round(seconds / items.length) : 0,
    grams: weight,
    material: top ? { name: top[0], colour: top[1].colour } : null
  }
}

/** A big number and its small unit: 64 h, 1.5 h, 38 m. */
export function tileDuration (seconds: number): { value: string, unit: string } {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return { value: String(minutes), unit: 'm' }
  const hours = minutes / 60
  return { value: hours >= 10 ? String(Math.round(hours)) : String(Math.round(hours * 10) / 10), unit: 'h' }
}

/** A big number and its small unit: 1.2 kg, 41 g, 11.4 g. */
export function tileWeight (g: number): { value: string, unit: string } {
  if (g >= 1000) return { value: String(Math.round(g / 100) / 10), unit: 'kg' }
  return { value: g >= 100 ? String(Math.round(g)) : String(Math.round(g * 10) / 10), unit: 'g' }
}

/** "Yesterday 21:02", "2 Nov 16:20", "31 Dec 2025 09:30": when a print ended. */
export function finishedAt (item: { start_time: number, end_time?: string | null, total_duration?: number }, now: Date = new Date()): string {
  const seconds = item.end_time ? Number(item.end_time) : item.start_time + (item.total_duration || 0)
  const d = new Date(seconds * 1000)
  const clock = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  const label = dayLabel(seconds, now)
  if (label === 'Today' || label === 'Yesterday') return `${label} ${clock}`
  const year = d.getFullYear() === now.getFullYear() ? '' : ` ${d.getFullYear()}`
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${year} ${clock}`
}
