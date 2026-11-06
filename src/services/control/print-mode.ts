/**
 * Print mode: Quiet, Normal and Turbo, Harry's [fan_modes] Klipper module
 * (klippy/extras/fan_modes.py, Muon3D_Klipper #107, branch feat/m1-machine).
 *
 * - Set: `SET_PRINT_MODE MODE=quiet|normal|turbo`.
 * - Read back: `printer.fan_modes.mode`, and the modes it offers in
 *   `printer.fan_modes.modes`.
 * - Today a mode changes only the part-fan curve (the speed factors are a
 *   TODO there), and it is not saved: Klipper starts in its default_mode
 *   (normal) after every restart. What Klipper reports is what is shown.
 *
 * A printer without fan_modes has no print modes: the cards are hidden.
 */

export interface PrintModeCard {
  id: string
  label: string
  blurb: string
  icon: string
}

const KNOWN: Record<string, Omit<PrintModeCard, 'id'>> = {
  quiet: { label: 'Quiet', blurb: 'Softer cooling fan', icon: 'fan' },
  normal: { label: 'Normal', blurb: 'The everyday mix', icon: 'fan' },
  turbo: { label: 'Turbo', blurb: 'Full cooling', icon: 'bolt' }
}

/** The order the cards go in: the known three first, then any others the printer offers. */
const ORDER = ['quiet', 'normal', 'turbo']

const NAME = /^[a-z0-9_]{1,32}$/

export interface PrintModes {
  /** The mode Klipper reports now, lower case; '' when it reports none. */
  current: string
  cards: PrintModeCard[]
}

/** "fast_print" → "Fast print". */
function plain (id: string): string {
  const s = id.replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * The print modes a printer offers, from its `fan_modes` status; null when
 * it has none (no [fan_modes], or its commands list lacks SET_PRINT_MODE).
 */
export function readPrintModes (fanModes: unknown, commands?: Record<string, unknown> | null): PrintModes | null {
  if (!fanModes || typeof fanModes !== 'object') return null
  if (commands && Object.keys(commands).length && !('SET_PRINT_MODE' in commands)) return null
  const status = fanModes as { mode?: unknown, modes?: unknown }
  const listed = Array.isArray(status.modes) ? status.modes : ORDER
  const ids = [...new Set(listed.map(m => String(m).trim().toLowerCase()).filter(m => NAME.test(m)))]
  if (!ids.length) return null
  ids.sort((a, b) => {
    const ia = ORDER.indexOf(a)
    const ib = ORDER.indexOf(b)
    return (ia < 0 ? ORDER.length : ia) - (ib < 0 ? ORDER.length : ib)
  })
  const current = typeof status.mode === 'string' ? status.mode.trim().toLowerCase() : ''
  return {
    current,
    cards: ids.map(id => ({ id, ...(KNOWN[id] ?? { label: plain(id), blurb: '', icon: 'fan' }) }))
  }
}

/** The command that selects `mode`, or null when the printer doesn't offer it. */
export function printModeCommand (mode: string, modes: PrintModes | null): string | null {
  const id = mode.trim().toLowerCase()
  if (!modes || !NAME.test(id) || !modes.cards.some(c => c.id === id)) return null
  return `SET_PRINT_MODE MODE=${id}`
}

/** "Quiet", "Turbo"; '' for no mode. */
export function printModeLabel (mode: string): string {
  const id = mode.trim().toLowerCase()
  if (!id) return ''
  return KNOWN[id]?.label ?? plain(id)
}

/**
 * Pressure advance as a fine adjustment around the profile's value: the
 * nudges offered and the bounds kept. `base` is the configured value (the
 * slicer or material profile sets it at print start on the M1); a nudge is
 * one thousandth, and the value stays between 0 and twice the base (0.2 when
 * the base is 0).
 */
export function pressureAdvanceRange (base: number | null): { min: number, max: number, step: number } {
  const b = Number.isFinite(base) && (base as number) > 0 ? base as number : 0
  return { min: 0, max: Math.round((b > 0 ? b * 2 : 0.2) * 1000) / 1000, step: 0.001 }
}
