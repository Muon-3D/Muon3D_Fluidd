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
 * - Load and Unload send their macro at once, as they always did.
 * - Mid-print, "Change filament" is M600, which pauses the print, after its
 *   own confirm.
 * - Nothing is sent while the printer is paused, busy with another script,
 *   or showing its own prompt, or while this page's last filament send is
 *   still landing (the page-wide send window), so a double click sends once.
 */
export interface FilamentMacro {
  name: string
  /** It reads params.TEMP, so it is told the material's nozzle heat. */
  takesTemp: boolean
}

export interface Confirm { title: string, text: string, yes: string, no: string }

export type FilamentPlan =
  /** Mid-print M600: sent after its confirm. */
  | { kind: 'pause', command: string, confirm: Confirm }
  /** Load and Unload: sent at once. */
  | { kind: 'load' | 'unload', command: string }
  /** Idle Change filament: open the material panel, send nothing. */
  | { kind: 'panel' }
  | { kind: 'none', reason: string }

export interface FilamentState {
  printing: boolean
  paused: boolean
  /** Klipper is running another script: idle_timeout says Printing with no print. */
  running: boolean
  /** The printer is showing its own prompt (action:prompt_begin). */
  promptOpen: boolean
  /** This page sent a filament command a moment ago (the page-wide send window). */
  sending?: boolean
}

export const SENDING = 'Sent. Wait a moment for the printer to start.'

const withTemp = (macro: FilamentMacro, temp: number | null) =>
  macro.takesTemp && temp ? `${macro.name} TEMP=${temp}` : macro.name

function blocked (state: FilamentState): string | null {
  if (state.promptOpen) return 'Answer the printer\'s prompt first.'
  if (state.paused) return 'The print is paused. Change the filament with the printer\'s prompt, then resume.'
  if (state.sending) return SENDING
  return null
}

/** "Change filament": mid-print M600 (pauses the print) after a confirm; idle, the material panel. */
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

/** Load or Unload: never mid-print, paused, prompting or busy; otherwise sent at once. */
export function loadUnloadPlan (state: FilamentState, kind: 'load' | 'unload', macro: FilamentMacro | null, temp: number | null): FilamentPlan {
  const why = blocked(state)
  if (why) return { kind: 'none', reason: why }
  if (state.printing) return { kind: 'none', reason: 'Not while printing.' }
  if (state.running) return { kind: 'none', reason: 'Wait until the printer finishes what it\'s doing.' }
  if (!macro) return { kind: 'none', reason: `This printer has no ${kind === 'load' ? 'LOAD_FILAMENT' : 'UNLOAD_FILAMENT'} macro.` }
  return { kind, command: withTemp(macro, temp) }
}

export const UNLOADING_NOTE = 'Unloading. When the filament is out, put the new one in and press Load.'
export const LOADING_NOTE = 'Loading. Follow the steps on the printer.'
