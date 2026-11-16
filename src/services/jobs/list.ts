import { jobTitle } from './model'

/**
 * How Jobs orders its files: by a column of the list (name, material, time,
 * size, last printed), the newest first (the default: recent jobs), or by a
 * fact that has no column. `longest` is the Time column.
 */
export type JobsSort = 'newest' | 'name' | 'material' | 'longest' | 'size' | 'printed' | 'filament' | 'layer' | 'modified'

export const SORT_KEYS: JobsSort[] = ['newest', 'name', 'material', 'longest', 'size', 'printed', 'filament', 'layer', 'modified']

/** The list's columns: a click on a header orders by it, a second click turns it round. */
export const JOBS_COLUMNS: Array<{ value: JobsSort, label: string }> = [
  { value: 'name', label: 'Name' },
  { value: 'material', label: 'Material' },
  { value: 'longest', label: 'Time' },
  { value: 'size', label: 'Size' },
  { value: 'printed', label: 'Last printed' }
]

/** The orders with no column, in the header's ... menu. */
export const MORE_SORTS: Array<{ value: JobsSort, label: string }> = [
  { value: 'newest', label: 'Recent first' },
  { value: 'filament', label: 'Filament' },
  { value: 'layer', label: 'Layer height' }
]

/** The way an order goes first: A to Z for words and the finest layer, the most (or latest) first for the rest. */
const RISING: JobsSort[] = ['name', 'material', 'layer']

/** Which way the list runs now, for the arrow on the column. */
export function sortDirection (sort: JobsSort, reverse: boolean): 'asc' | 'desc' {
  return RISING.includes(sort) !== reverse ? 'asc' : 'desc'
}

/** A click on a column header: the same column turns round; another starts its usual way. */
export function nextColumnSort (current: { sort: JobsSort, reverse: boolean }, column: JobsSort): { sort: JobsSort, reverse: boolean } {
  return current.sort === column ? { sort: column, reverse: !current.reverse } : { sort: column, reverse: false }
}

interface Sortable {
  kind: 'folder' | 'file';
  name: string;
  modified: number;
  time?: number;
  size?: number;
  filament?: number;
  layer?: number;
  material?: string;
  lastPrinted?: number | null;
  printing?: boolean;
}

/**
 * Folders first (A to Z, or Z to A when the names are turned round), then the files in the chosen order, turned round
 * with `reverse`. The file that is printing is pinned above everything,
 * whatever the order. A file with no value for the fact goes last either way.
 */
export function sortListRows<T extends Sortable> (rows: T[], sort: JobsSort, reverse = false): T[] {
  const byName = (a: T, b: T) => jobTitle(a.name).localeCompare(jobTitle(b.name))
  const number = (get: (r: T) => number | undefined, desc: boolean) => (a: T, b: T) => {
    const x = get(a)
    const y = get(b)
    if (x === undefined && y === undefined) return byName(a, b)
    if (x === undefined) return 1
    if (y === undefined) return -1
    return (x === y ? 0 : (x - y) * (desc !== reverse ? -1 : 1)) || byName(a, b)
  }
  const word = (get: (r: T) => string | undefined) => (a: T, b: T) => {
    const x = get(a) || undefined
    const y = get(b) || undefined
    if (x === undefined && y === undefined) return byName(a, b)
    if (x === undefined) return 1
    if (y === undefined) return -1
    return x.localeCompare(y) * (reverse ? -1 : 1) || byName(a, b)
  }
  const order: Record<JobsSort, (a: T, b: T) => number> = {
    newest: number(r => r.modified, true),
    material: word(r => r.material),
    printed: number(r => r.lastPrinted ?? undefined, true),
    modified: number(r => r.modified, true),
    name: (a, b) => byName(a, b) * (reverse ? -1 : 1),
    longest: number(r => r.time, true),
    size: number(r => r.size, true),
    filament: number(r => r.filament, true),
    layer: number(r => r.layer, false)
  }
  const printing = rows.filter(r => r.kind === 'file' && r.printing)
  const folders = rows.filter(r => r.kind === 'folder').sort((a, b) => byName(a, b) * (sort === 'name' && reverse ? -1 : 1))
  const files = rows.filter(r => r.kind === 'file' && !r.printing).sort(order[sort])
  return [...printing, ...folders, ...files]
}

/**
 * "Yesterday", "2 Nov", "Never": when a file last printed, from the time it
 * started (seconds). A file with a print on record but no time says so.
 */
export function lastPrinted (seconds: number | null | undefined, printed = false, now: Date = new Date()): string {
  if (!seconds) return printed ? 'Printed before' : 'Never'
  const d = new Date(seconds * 1000)
  const day = (x: Date) => Math.floor(new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime() / 86400000)
  const ago = day(now) - day(d)
  if (ago <= 0) return 'Today'
  if (ago === 1) return 'Yesterday'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const text = `${d.getDate()} ${months[d.getMonth()]}`
  return d.getFullYear() === now.getFullYear() ? text : `${text} ${d.getFullYear()}`
}

/** "PLA" from a slicer's "PLA;PLA", or an empty string. */
export function materialOf (filamentType: string | undefined): string {
  return filamentType?.split(';')[0]?.trim() ?? ''
}

/** "1 h 12 m", "38 m", "56 m": a print's time in the list. */
export function listDuration (seconds: number | undefined): string {
  if (!seconds) return '—'
  const total = Math.round(seconds / 60)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (!h) return `${Math.max(1, m)} m`
  return `${h} h ${String(m).padStart(2, '0')} m`
}

/** Layers in a file: what the slicer counted, or the part's height over the layer height. */
export function layerCountOf (meta: { layer_count?: number, object_height?: number, layer_height?: number }): number | null {
  if (meta.layer_count) return meta.layer_count
  if (meta.object_height && meta.layer_height) return Math.round(meta.object_height / meta.layer_height)
  return null
}
