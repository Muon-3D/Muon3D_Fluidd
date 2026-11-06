/**
 * Consumables and wear: how far along the parts that wear out are. The printer
 * keeps no replacement date for a nozzle or a plate, so these count the
 * printer's own hours and prints against a service interval, as a reminder
 * to look, not a measurement of the part.
 */

/** The nozzle is worth a look after this many hours of printing. */
export const NOZZLE_SERVICE_HOURS = 400
/** The build plate is worth a look after this many prints. */
export const PLATE_SERVICE_PRINTS = 500
/** The printer as a whole: a service reminder after this many print hours. */
export const SERVICE_PRINT_HOURS = 500

export type UsageTone = 'ok' | 'warn'

export interface Usage {
  /** 0 to 100, whole numbers. */
  percent: number;
  tone: UsageTone;
}

/** A bar's fill for `used` of `limit`, going amber from four fifths on. */
export function usageOf (used: number | null, limit: number): Usage | null {
  if (used === null || !Number.isFinite(used) || used < 0 || !(limit > 0)) return null
  const percent = Math.min(100, Math.round(100 * used / limit))
  return { percent, tone: percent >= 80 ? 'warn' : 'ok' }
}

/** The share of a spool left, 0 to 100, or null when Spoolman did not say both weights. */
export function spoolLeft (remaining: number | undefined, total: number | undefined): number | null {
  if (typeof remaining !== 'number' || typeof total !== 'number' || !Number.isFinite(remaining) || !(total > 0)) return null
  return Math.min(100, Math.max(0, Math.round(100 * remaining / total)))
}
