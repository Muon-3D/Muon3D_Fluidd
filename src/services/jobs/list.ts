import { jobTitle } from './model'

/** How Jobs orders its files: the newest first, by name, or the longest print first. */
export type JobsSort = 'newest' | 'name' | 'longest'

export const JOBS_SORTS: Array<{ value: JobsSort, label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
  { value: 'longest', label: 'Longest' }
]

interface Sortable {
  kind: 'folder' | 'file';
  name: string;
  modified: number;
  time?: number;
  printing?: boolean;
}

/**
 * Folders first (A to Z), then the files in the chosen order. The file
 * that is printing is pinned above everything, whatever the order.
 */
export function sortListRows<T extends Sortable> (rows: T[], sort: JobsSort): T[] {
  const byName = (a: T, b: T) => jobTitle(a.name).localeCompare(jobTitle(b.name))
  const order: Record<JobsSort, (a: T, b: T) => number> = {
    newest: (a, b) => b.modified - a.modified || byName(a, b),
    name: byName,
    longest: (a, b) => (b.time ?? -1) - (a.time ?? -1) || byName(a, b)
  }
  const printing = rows.filter(r => r.kind === 'file' && r.printing)
  const folders = rows.filter(r => r.kind === 'folder').sort(byName)
  const files = rows.filter(r => r.kind === 'file' && !r.printing).sort(order[sort])
  return [...printing, ...folders, ...files]
}

/** "Yesterday", "2 Nov", "Never": when a file last printed, from the time it started (seconds). */
export function lastPrinted (seconds: number | null | undefined, now: Date = new Date()): string {
  if (!seconds) return 'Never'
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
