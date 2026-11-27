/**
 * The Quick commands tile's default set (I-542). Priority order: a narrower
 * tile drops from the tail. An entry shows only when the printer has it, by
 * macro (or command) name, so a printer without a Purge line never gets a dead
 * button. Test and dev macros are not here; they stay under All commands.
 *
 * Pure: the tile feeds it the names the printer has and its width.
 */
export interface QuickDefault {
  id: string;
  title: string;
  /** A name from services/macros/icon's icons. */
  icon: string;
  /** Macro or command names that can stand for this entry, first found wins. Empty: always there. */
  names: string[];
  /** Sent as typed G-code when it is not a macro on the printer (Lights off). */
  gcode?: string;
}

// Home all is not here (KAN-5980): the Trackpad's header has the one Home all.
export const QUICK_DEFAULTS: QuickDefault[] = [
  { id: 'load', title: 'Load filament', icon: 'spool', names: ['LOAD_FILAMENT'] },
  { id: 'unload', title: 'Unload filament', icon: 'spool', names: ['UNLOAD_FILAMENT'] },
  { id: 'purge', title: 'Purge line', icon: 'nozzle', names: ['PURGE_LINE'] },
  { id: 'clean', title: 'Clean nozzle', icon: 'maintenance', names: ['CLEAN_NOZZLE'] },
  { id: 'cut', title: 'Cut filament', icon: 'spool', names: ['CUT_FILAMENT'] },
  { id: 'park', title: 'Park printer', icon: 'home', names: ['PARK_PRINTER'] },
  { id: 'center', title: 'Center', icon: 'home', names: ['CENTER'] },
  { id: 'lights-off', title: 'Lights off', icon: 'bulb', names: ['LED_MODE'], gcode: 'LED_MODE MODE=off' },
  { id: 'mesh', title: 'Bed mesh', icon: 'mesh', names: ['BED_MESH_CALIBRATE'] },
  { id: 'pid-hotend', title: 'PID hotend', icon: 'maintenance', names: ['CALIBRATE_HEATING_HOTEND'] },
  { id: 'pid-bed', title: 'PID bed', icon: 'maintenance', names: ['CALIBRATE_HEATING_BED'] },
  { id: 'probe', title: 'Calibrate probe', icon: 'mesh', names: ['CALIBRATE_PROBE'] },
  { id: 'zpark', title: 'Z park', icon: 'home', names: ['Z_PARK'] }
]

/**
 * Defaults that move the head or plate, or calibrate, so they wait while a print
 * runs (busy): sent mid-print they would home, probe or heat in the middle of the
 * job. Filament load/unload/cut and Lights off stay available.
 */
export const QUICK_BUSY_BLOCKED: ReadonlySet<string> = new Set(['purge', 'clean', 'park', 'center', 'mesh', 'pid-hotend', 'pid-bed', 'probe', 'zpark'])

/** Left out of the default on purpose (test, dev and one-off macros): they stay under All commands. */
export const QUICK_LEFT_OUT = ['BUZZ_EXTRUDER', 'STEPLOSS_TEST', 'TEST_SPEED', 'LED_INFO', 'LED_READY', 'CHOME', 'FINETUNE_RESONANCE', 'RESET_CALIBRATION']

export interface ChosenQuick extends QuickDefault {
  /** The name on the printer that matched (upper case), or '' for an entry with none. */
  found: string;
}

/** The defaults the printer has, in priority order. `have` holds upper-case macro and command names. */
export function defaultQuick (have: Set<string>): ChosenQuick[] {
  return QUICK_DEFAULTS.flatMap(d => {
    if (!d.names.length) return [{ ...d, found: '' }]
    const found = d.names.find(n => have.has(n))
    return found ? [{ ...d, found }] : []
  })
}

export const TILE_MIN = 128
export const TILE_GAP = 10

/**
 * Two rows at every width. How many fit in a row follows the width; the last
 * tile is always All commands, so `shown` entries fill 2 * fit - 1 places at
 * most. The row is then no longer than it needs to be (half of what is shown,
 * rounded up), so the tiles grow rather than leaving a third of the width empty.
 */
export function quickSlots (width: number, available: number): { perRow: number; shown: number } {
  const fit = Math.max(2, Math.floor((width + TILE_GAP) / (TILE_MIN + TILE_GAP)))
  const shown = Math.max(0, Math.min(available, 2 * fit - 1))
  return { perRow: Math.max(2, Math.ceil((shown + 1) / 2)), shown }
}
