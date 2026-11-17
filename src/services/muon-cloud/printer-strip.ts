import type { DirectoryEntry, PrinterHealth } from './directory'
import type { PrinterStatus } from './status'

export type StripState = 'printing' | 'ready' | 'heating' | 'paused' | 'fault' | 'asleep' | 'new'

export const STRIP_LABELS: Record<StripState, string> = {
  printing: 'Printing', ready: 'Ready', heating: 'Heating', paused: 'Paused', fault: 'Fault', asleep: 'Offline', new: 'Not yet reported'
}

export function stripState (health: PrinterHealth, status?: Pick<PrinterStatus, 'state' | 'extruder' | 'bed'>): StripState {
  if (health === 'offline') return 'asleep'
  if (status?.state === 'klipper startup') return 'new'
  if (health === 'error' || /error|shutdown/.test(status?.state ?? '')) return 'fault'
  if (health === 'paused' || health === 'locked' || status?.state === 'paused') return 'paused'
  if ([status?.extruder, status?.bed].some(h => h && Number.isFinite(h.target) && Number.isFinite(h.temperature) && h.target > 0 && h.temperature < h.target - 5)) return 'heating'
  if (health === 'printing' || status?.state === 'printing') return 'printing'
  return health === 'online' ? 'ready' : 'new'
}

export function stripEntries (entries: DirectoryEntry[]): DirectoryEntry[] {
  const seen = new Set<string>()
  return entries.filter(e => {
    if (e.section === 'found' || e.active || seen.has(e.key)) return false
    seen.add(e.key)
    return true
  })
}

export function stripCapacity (width: number, count: number, found: number): number {
  const available = Math.max(0, width - 180)
  const all = Math.floor(available / 48)
  return count <= all && !found ? count : Math.min(count, Math.max(0, Math.floor((available - 48) / 48)))
}
