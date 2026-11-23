/**
 * How a print ended and how much filament it used: the small pieces the history
 * model and the year grid share. A leaf: it imports nothing, so the store can
 * use it without reaching the store again (npm run circular-check).
 */

/** The tones a status can take (the same names as printers-page/model's TileTone). */
type StatusTone = 'run' | 'ok' | 'warn' | 'err' | 'off' | 'info'

export type HistoryKind = 'finished' | 'stopped' | 'failed' | 'printing' | 'other'

export interface HistoryStatus {
  kind: HistoryKind;
  text: string;
  tone: StatusTone;
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

/** Grams of filament from the length used: the slicer's diameter and density when it said, else 1.75 mm PLA. */
export function grams (mm: number, meta?: { filament_diameter?: number, filament_density?: number }): number {
  const d = Number(meta?.filament_diameter) || 1.75
  const rho = Number(meta?.filament_density) || 1.24
  return mm * Math.PI * (d / 2) ** 2 * rho / 1000
}

/**
 * Grams of filament a print used: the slicer's own figure for the whole
 * print, scaled by how much of the planned length was used; else the length
 * estimate above, which is flagged `estimated`.
 */
export function filamentGrams (mm: number, meta?: { filament_weight_total?: number, filament_total?: number, filament_diameter?: number, filament_density?: number }): { grams: number, estimated: boolean } {
  const weight = Number(meta?.filament_weight_total)
  const total = Number(meta?.filament_total)
  if (weight > 0 && total > 0) return { grams: weight * (mm || 0) / total, estimated: false }
  return { grams: grams(mm || 0, meta), estimated: (mm || 0) > 0 }
}
