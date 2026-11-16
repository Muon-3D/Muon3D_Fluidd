/**
 * The top bar's Quick actions: what each is, and why one cannot be used now.
 * The commands are Control's (home, motors off, cool down, preheat, the
 * filament macros, Level the bed, Restart Klipper); this only decides which
 * are available, with the same plain-words reasons the controls give.
 */
import type { FilamentMacro } from '@/services/control/filament-change'

export type QuickActionId = 'home' | 'preheat' | 'cool' | 'filament' | 'level' | 'motors' | 'restart'

export interface QuickActionContext {
  /** Control's lock reason: '' when Control is ready. */
  controlLock: string;
  /** Printing, paused or busy. */
  busy: boolean;
  /** The restart refusal Control gives: '' when a restart can be sent. */
  restartRefusal: string;
  /** The material Preheat would heat for, or null when none is set up. */
  preheatName: string | null;
  /** The printer has a filament change macro. */
  changeFilament: boolean;
  /** Why Change filament can't run now (changeFilamentPlan's reason). */
  changeFilamentReason?: string;
  /** The G-code Level the bed runs, or null when the printer has none. */
  levelGcode: string | null;
  /** Why no check can start now (Maintenance's reason), or ''. */
  levelBlocked: string;
}

export interface QuickAction {
  id: QuickActionId;
  label: string;
  icon: string;
  hint?: string;
  /** Why it cannot be used now, or '' when it can. */
  reason: string;
  /** It asks before it runs. */
  confirms: boolean;
  /** Below the rule: it restarts something. */
  danger?: boolean;
}

const WHILE_BUSY = 'Not while the printer is printing.'

/** "Not sent. X" said after a refusal reads as "X" before one. */
export function restartReason (refusal: string): string {
  return refusal.replace(/^Not sent\.\s*/, '')
}

export function quickActions (c: QuickActionContext): QuickAction[] {
  const locked = c.controlLock
  return [
    { id: 'home', label: 'Home all axes', icon: 'home', hint: 'G28', reason: locked || (c.busy ? WHILE_BUSY : ''), confirms: false },
    {
      id: 'preheat',
      label: c.preheatName ? `Preheat ${c.preheatName}` : 'Preheat',
      icon: 'flame',
      reason: locked || (c.preheatName ? '' : 'No material is set up to preheat for.'),
      // Mid-print it overwrites the running print's temperatures.
      confirms: c.busy
    },
    { id: 'cool', label: 'Cool down', icon: 'snow', reason: locked, confirms: false },
    {
      id: 'filament',
      label: 'Change filament',
      icon: 'spool',
      reason: locked || (c.changeFilament ? '' : (c.changeFilamentReason ?? 'This printer has no filament change command (M600).')),
      // Mid-print M600 pauses the print, after its confirm; idle it sends nothing and opens the material panel (changeFilamentPlan).
      confirms: c.busy
    },
    {
      id: 'level',
      label: 'Level the bed',
      icon: 'mesh',
      reason: c.levelGcode === null ? "This printer can't measure the bed." : locked || c.levelBlocked,
      confirms: true
    },
    { id: 'motors', label: 'Turn motors off', icon: 'motorsOff', reason: locked || (c.busy ? WHILE_BUSY : ''), confirms: false },
    { id: 'restart', label: 'Restart Klipper', icon: 'refresh', reason: restartReason(c.restartRefusal), confirms: true, danger: true }
  ]
}
export type { FilamentMacro }

/** A filament macro by any of its usual names, as Control's Filament card finds it. */
export function findFilamentMacro (
  macros: Array<{ name?: unknown, config?: { gcode?: unknown } }>,
  ...names: string[]
): FilamentMacro | null {
  const macro = macros.find(m => typeof m.name === 'string' && names.includes(m.name.toLowerCase()))
  if (!macro) return null
  const gcode = String(macro.config?.gcode ?? '')
  return { name: (macro.name as string).toUpperCase(), takesTemp: /params\.temp\b/i.test(gcode) }
}
