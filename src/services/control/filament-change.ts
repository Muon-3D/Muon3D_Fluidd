/**
 * What the filament buttons send (KAN-1700, the Control side of KAN-1699).
 *
 * Jack, 6 Nov 2026: "Change filament" made the motors energise, and a toast
 * said the nozzle was touching the plate. On the M1, M600 runs PAUSE at once,
 * and PAUSE lifts Z and parks the head at the back corner, with or without
 * a print; with the contact latch stuck the park was refused, again on every
 * click (lead-prn's trace).
 *
 * The rules now:
 * - Idle, "Change filament" sends nothing: it opens the material panel
 *   (material and colour, plus Load and Unload).
 * - Load and Unload heat the nozzle and run the extruder (UNLOAD_FILAMENT
 *   heats to 250 °C on the M1), so each asks first and names the heat.
 * - Mid-print, "Change filament" is M600, which pauses the print, after its
 *   own confirm.
 * - Nothing is sent while the printer is paused, busy with another script,
 *   or showing its own prompt; the caller also refuses a second send until
 *   the first one has landed.
 */
export interface FilamentMacro {
  name: string
  /** It reads params.TEMP, so it is told the material's nozzle heat. */
  takesTemp: boolean
  /** The nozzle heat it sets itself (M104/M109 S…, or TEMP's default), when the macro says. */
  heatsTo?: number | null
}

export interface Confirm { title: string, text: string, yes: string, no: string }

export type FilamentPlan =
  | { kind: 'pause' | 'load' | 'unload', command: string, confirm: Confirm }
  /** Idle Change filament: open the material panel, send nothing. */
  | { kind: 'panel' }
  | { kind: 'none', reason: string }

export interface FilamentState {
  printing: boolean
  paused: boolean
  /** Klipper is running another script (idle_timeout "Printing" with no print), or this page just sent one. */
  running: boolean
  /** The printer is showing its own prompt (action:prompt_begin). */
  promptOpen: boolean
}

const withTemp = (macro: FilamentMacro, temp: number | null) =>
  macro.takesTemp && temp ? `${macro.name} TEMP=${temp}` : macro.name

/** The nozzle heat a macro sets itself, read from its G-code, else null. */
export function macroHeat (gcode: string): number | null {
  const m = /params\.temp\s*\|\s*default\(\s*(\d{2,3})/i.exec(gcode) ??
    /\bM10[49]\b[^\n]*\bS(\d{2,3})\b/i.exec(gcode) ??
    /SET_HEATER_TEMPERATURE\b[^\n]*\bTARGET=(\d{2,3})\b/i.exec(gcode)
  return m ? Number(m[1]) : null
}

function blocked (state: FilamentState): string | null {
  if (state.promptOpen) return 'Answer the printer\'s prompt first.'
  if (state.paused) return 'The print is paused. Change the filament with the printer\'s prompt, then resume.'
  return null
}

/** "Change filament": mid-print M600 (pauses the print); idle, the material panel. */
export function changeFilamentPlan (state: FilamentState, change: FilamentMacro | null, temp: number | null): FilamentPlan {
  const why = blocked(state)
  if (why) return { kind: 'none', reason: why }
  if (!state.printing) return { kind: 'panel' }
  if (!change) return { kind: 'none', reason: 'This printer has no filament change macro (M600).' }
  return {
    kind: 'pause',
    command: withTemp(change, temp),
    confirm: {
      title: 'Pause the print to change filament?',
      text: 'The print pauses so the filament can be changed. Follow the steps on the printer, then resume.',
      yes: 'Pause and change',
      no: 'Keep printing'
    }
  }
}

/** Load or Unload: never mid-print, and always after a confirm that names the heat. */
export function loadUnloadPlan (state: FilamentState, kind: 'load' | 'unload', macro: FilamentMacro | null, temp: number | null): FilamentPlan {
  const why = blocked(state)
  if (why) return { kind: 'none', reason: why }
  if (state.printing) return { kind: 'none', reason: 'Not while printing.' }
  if (state.running) return { kind: 'none', reason: 'Wait until the printer finishes what it\'s doing.' }
  if (!macro) return { kind: 'none', reason: `This printer has no ${kind === 'load' ? 'LOAD_FILAMENT' : 'UNLOAD_FILAMENT'} macro.` }
  const heat = macro.takesTemp && temp ? temp : (macro.heatsTo ?? null)
  const hot = heat ? `Heats the nozzle to ${heat} °C` : 'Heats the nozzle'
  return kind === 'unload'
    ? {
        kind,
        command: withTemp(macro, temp),
        confirm: {
          title: 'Unload the filament?',
          text: `${hot}, then runs the extruder to pull the filament out. The head doesn't move. Keep clear of the nozzle; it gets hot.`,
          yes: 'Heat and unload',
          no: 'Cancel'
        }
      }
    : {
        kind,
        command: withTemp(macro, temp),
        confirm: {
          title: 'Load the filament?',
          text: `${hot}, then runs the extruder to pull the new filament in and purge. Put the filament in the entry first. The printer may home and move to purge. Keep clear of the nozzle; it gets hot.`,
          yes: 'Heat and load',
          no: 'Cancel'
        }
      }
}

export const UNLOADING_NOTE = 'Unloading. When the filament is out, put the new one in and press Load.'
export const LOADING_NOTE = 'Loading. Follow the steps on the printer.'
