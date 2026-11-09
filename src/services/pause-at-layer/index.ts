/**
 * SET_PAUSE_AT_LAYER and SET_PAUSE_NEXT_LAYER are macros from the mainsail
 * config, not part of Klipper, so a printer without them (the M1) has no
 * pause-at-layer. The command list the printer reports is what it will run.
 */
export function printerHasPauseAtLayer (commands: Record<string, unknown> | null | undefined): boolean {
  const names = Object.keys(commands ?? {})
  // No list yet: nothing to judge by, and the macro list still gates the entry points.
  if (!names.length) return true
  return names.some(name => name.toUpperCase() === 'SET_PAUSE_AT_LAYER')
}
