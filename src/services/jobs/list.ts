import { jobTitle } from './model'

/** How Jobs orders its files: the newest first, by name, the longest print first, or by a fact of the file. */
export type JobsSort = 'newest' | 'name' | 'longest' | 'size' | 'filament' | 'layer' | 'modified'

export const JOBS_SORTS: Array<{ value: JobsSort, label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'longest', label: 'Longest' }
]

/** The rest, in the header's ... menu. */
export const MORE_SORTS: Array<{ value: JobsSort, label: string }> = [
  { value: 'size', label: 'Size' },
  { value: 'filament', label: 'Filament' },
  { value: 'layer', label: 'Layer height' },
  { value: 'modified', label: 'Modified' }
]

export type JobsFilter = 'all' | 'never' | 'before'

export const JOBS_FILTERS: Array<{ value: JobsFilter, label: string }> = [
  { value: 'all', label: 'All files' },
  { value: 'never', label: 'Never printed' },
  { value: 'before', label: 'Printed before' }
]

interface Sortable {
  kind: 'folder' | 'file';
  name: string;
  modified: number;
  time?: number;
  size?: number;
  filament?: number;
  layer?: number;
  printing?: boolean;
}

/**
 * Folders first (A to Z), then the files in the chosen order, turned round
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
  const order: Record<JobsSort, (a: T, b: T) => number> = {
    newest: number(r => r.modified, true),
    modified: number(r => r.modified, true),
    name: (a, b) => byName(a, b) * (reverse ? -1 : 1),
    longest: number(r => r.time, true),
    size: number(r => r.size, true),
    filament: number(r => r.filament, true),
    layer: number(r => r.layer, false)
  }
  const printing = rows.filter(r => r.kind === 'file' && r.printing)
  const folders = rows.filter(r => r.kind === 'folder').sort(byName)
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
