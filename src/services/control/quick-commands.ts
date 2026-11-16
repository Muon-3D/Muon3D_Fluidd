/**
 * Quick commands: Control's macros, as rows like the top bar's Quick actions
 * (layout/QuickActionsMenu.vue): an icon, a plain-words name, the macro name
 * as a muted hint, the reason when it can't run, and restarts in red below a
 * rule.
 *
 * Left out because they already have a place (CONTROL-V4.md): what Quick
 * actions do (home, preheat, cool down, change filament, level the bed,
 * motors off, restart Klipper) and what the Filament tile does (load,
 * unload). They stay in Settings › Macros and the console.
 */
import type { MacroGroupId } from '@/services/macros/arrange'

/** Macros covered by Quick actions or the Filament tile. */
const COVERED = [
  /^G28$/, /^HOME(_ALL)?$/, /^HOME_?XYZ$/,
  /^PREHEAT(_|$)/, /^COOL_?DOWN$/, /^TURN_OFF_HEATERS$/,
  /^M600$/, /^(CHANGE_FILAMENT|FILAMENT_CHANGE)$/,
  /^BED_MESH_CALIBRATE$/, /^(LEVEL_BED|BED_LEVEL|AUTO_LEVEL|AUTO_BED_LEVEL)$/,
  /^M84$/, /^M18$/, /^MOTORS_OFF$/, /^DISABLE_MOTORS$/,
  /^RESTART$/,
  /^(LOAD|UNLOAD)_FILAMENT$/, /^M70[12]$/, /^FILAMENT_(LOAD|UNLOAD)$/
]

/** Whether a macro already has a place in Quick actions or the Filament tile. */
export function coveredElsewhere (name: string): boolean {
  const n = name.toUpperCase()
  return COVERED.some(re => re.test(n))
}

/** The restarts that sit below the rule, in red. RESTART is Quick actions' "Restart Klipper". */
export const RESTART_COMMANDS = [{ name: 'FIRMWARE_RESTART', label: 'Restart the firmware' }]

/** First words read as verbs that take "the": PARK_HEAD → "Park the head". */
const VERB_THE = new Set(['park', 'clean', 'wipe', 'check', 'home', 'center', 'centre', 'raise', 'lower', 'heat', 'cool', 'test', 'calibrate', 'level', 'move', 'reset', 'prime', 'cut', 'measure', 'present'])
/** First words that read better with "a": PURGE_LINE → "Purge a line". */
const VERB_A = new Set(['purge'])
/** Names that say a check in other words. */
const VERB_ALIAS: Record<string, string> = { query: 'check' }
const DETERMINERS = new Set(['the', 'a', 'an', 'all', 'each', 'every'])
const ACRONYMS = /^(led|leds|pid|psu|cpu|pla|abs|petg|tpu|usb|mcu|xy|xyz|ui)$/

/**
 * The plain-words name of a macro: its description when it has a short one,
 * else its name cleaned (PARK_HEAD → "Park the head", QUERY_PROBE → "Check
 * the probe"). G-code names (M106) stay as they are.
 */
export function quickCommandLabel (name: string, description = ''): string {
  const d = description.trim().replace(/^"+|"+$/g, '').replace(/\.$/, '').trim()
  if (d && d.length <= 40 && !/^g-?code macro$/i.test(d)) return d.charAt(0).toUpperCase() + d.slice(1)
  const upper = name.toUpperCase()
  if (/^[GM]\d+(\.\d+)?$/.test(upper)) return upper
  const words = upper.split('_').filter(Boolean).map(w => w.toLowerCase())
  if (!words.length) return upper
  if (VERB_ALIAS[words[0]]) words[0] = VERB_ALIAS[words[0]]
  const takesArticle = words.length > 1 && !DETERMINERS.has(words[1]) && !/^\d/.test(words[1]) && !/^[xyz]$/.test(words[1])
  const out = words.map(w => (ACRONYMS.test(w) || /^[a-z]$/.test(w) ? w.toUpperCase() : w))
  if (takesArticle && VERB_THE.has(words[0])) out.splice(1, 0, 'the')
  else if (takesArticle && VERB_A.has(words[0]) && !/s$/.test(words[1])) out.splice(1, 0, 'a')
  out[0] = out[0].charAt(0).toUpperCase() + out[0].slice(1)
  return out.join(' ')
}

/** The row's icon, by what the macro is for. */
export function quickCommandIcon (group: MacroGroupId | string, name: string): string {
  if (/RESTART/i.test(name)) return 'refresh'
  if (/PROBE|QUERY|CHECK|TEST/i.test(name)) return 'check'
  if (/PURGE|PRIME/i.test(name)) return 'firstLayer'
  if (/CLEAN|WIPE|BRUSH/i.test(name)) return 'nozzle'
  const byGroup: Record<string, string> = {
    filament: 'spool', moving: 'home', nozzle: 'nozzle', calibration: 'mesh', lights: 'bulb', fans: 'fan', printing: 'jobs'
  }
  return byGroup[group] ?? 'macro'
}

export interface QuickCommandState {
  /** Control's lock reason: '' when Control is ready. */
  controlLock: string
  busy: boolean
  disabledWhilePrinting: boolean
}

/** Why a quick command can't run now, or ''. */
export function quickCommandReason (s: QuickCommandState): string {
  if (s.controlLock) return s.controlLock
  if (s.disabledWhilePrinting && s.busy) return 'Not while the printer is printing.'
  return ''
}
