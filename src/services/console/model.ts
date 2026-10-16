import type { ConsoleEntry, GcodeHelp } from '@/store/console/types'

export type EntryKind = 'command' | 'error' | 'warning' | 'info'

export type LogFilter = 'all' | 'commands' | 'warnings' | 'errors'

/** A console line's text: the store keeps sanitised HTML, with <br /> for line breaks. */
export function entryText (message: string): string {
  return message
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

/** Klipper starts an error with !!; a warning says so. */
export function entryKind (entry: Pick<ConsoleEntry, 'message' | 'type'>): EntryKind {
  if (entry.type === 'command') return 'command'
  const text = entryText(entry.message)
  if (text.startsWith('!!')) return 'error'
  if (/\bwarn(ing)?\b/i.test(text)) return 'warning'
  return 'info'
}

/** The lines a filter and a search keep, in order. Warnings include errors: both want a look. */
export function filterEntries<T extends Pick<ConsoleEntry, 'message' | 'type'>> (entries: T[], filter: LogFilter, find: string): T[] {
  const q = find.trim().toLowerCase()
  return entries.filter(e => {
    const kind = entryKind(e)
    if (filter === 'commands' && kind !== 'command') return false
    if (filter === 'warnings' && kind !== 'warning' && kind !== 'error') return false
    if (filter === 'errors' && kind !== 'error') return false
    return !q || entryText(e.message).toLowerCase().includes(q)
  })
}

/**
 * A printer error a customer may meet, with a stable code support can look up.
 *
 * `say` is for customers: plain words, never advice to open the printer or
 * change its software. A fault adds "restart, then contact support with the
 * code"; a mistake in use adds only the code. `detail` is the fuller account
 * for Muon staff, shown only in developer mode.
 */
export interface PrinterError {
  code: string;
  pattern: RegExp;
  /** A fault ends with restart-then-support; a slip in use ends with just the code. */
  kind: 'fault' | 'use';
  say: (m: RegExpMatchArray) => string;
  detail: (m: RegExpMatchArray) => string;
}

const part = (heater: string) => heater === 'extruder' ? 'nozzle' : heater.replace(/_/g, ' ')
const motor = (stepper: string) => stepper.replace(/^stepper_/, '').toUpperCase()

export const PRINTER_ERRORS: PrinterError[] = [
  {
    code: 'E-HOME-01',
    pattern: /Must home axis first/i,
    kind: 'use',
    say: () => 'The printer needs to home before it can move. Press Home all on Control.',
    detail: () => 'Home the printer first: Home all on Control, or G28.'
  },
  {
    code: 'E-MOVE-01',
    pattern: /Move out of range/i,
    kind: 'use',
    say: () => 'A move went past the edge of the print area. Home the printer and try again.',
    detail: () => "A move went past the printer's limits. Check the coordinates, or home again."
  },
  {
    code: 'E-MOTOR-01',
    pattern: /TMC '([^']+)' reports/i,
    kind: 'fault',
    say: m => `The ${motor(m[1])} motor reported a problem.`,
    detail: m => `The ${motor(m[1])} motor driver saw a fault. One that clears is harmless; if it keeps happening, check that motor's cable.`
  },
  {
    code: 'E-HEAT-01',
    pattern: /Heater (\S+) not heating at expected rate/i,
    kind: 'fault',
    say: m => `The ${part(m[1])} didn't heat as expected, so the printer stopped to be safe.`,
    detail: m => `The ${part(m[1])} heated slower than expected, so Klipper shut down to be safe. Check its heater and thermistor wiring, and that no fan blows on it.`
  },
  {
    code: 'E-LINK-01',
    pattern: /Lost communication with MCU/i,
    kind: 'fault',
    say: () => "Part of the printer's electronics stopped answering, so it stopped to be safe.",
    detail: () => 'Klipper lost touch with a control board. Check its cable and power, then Firmware restart.'
  },
  {
    code: 'E-TIME-01',
    pattern: /Timer too close/i,
    kind: 'fault',
    say: () => 'The printer fell behind and stopped to be safe.',
    detail: () => 'The computer fell behind the control board, usually because it was busy. Firmware restart, and if it repeats, look at what else is running.'
  },
  {
    code: 'E-COLD-01',
    pattern: /Extrude below minimum temp/i,
    kind: 'use',
    say: () => 'The nozzle is too cold to push filament. Heat it first.',
    detail: () => 'The nozzle is too cold to push filament. Heat it first.'
  },
  {
    code: 'E-TEMP-01',
    pattern: /ADC out of range/i,
    kind: 'fault',
    say: () => 'A temperature reading went out of range, so the printer stopped heating to be safe.',
    detail: () => 'A temperature reading went out of range: often a loose thermistor, or a heater running too hot. Check the wiring before heating again.'
  },
  {
    code: 'E-CMD-01',
    pattern: /Unknown command:?\s*"?([A-Za-z0-9_]+)"?/,
    kind: 'use',
    say: m => `The printer doesn't know the command ${m[1].toUpperCase()}. Check the spelling.`,
    detail: m => `Klipper doesn't know ${m[1].toUpperCase()}. Check the spelling, or whether a macro by that name is installed.`
  }
]

/**
 * What a common printer error means, in a sentence; null for the rest.
 * Customers get the plain sentence and its code; `detailed` (developer mode)
 * gets the code and the full account.
 */
export function explain (message: string, detailed = false): string | null {
  const text = entryText(message)
  for (const e of PRINTER_ERRORS) {
    const m = text.match(e.pattern)
    if (!m) continue
    if (detailed) return `${e.code}: ${e.detail(m)}`
    return e.kind === 'fault'
      ? `${e.say(m)} Restart the printer; if it happens again, contact support with code ${e.code}.`
      : `${e.say(m)} (${e.code})`
  }
  return null
}

export interface Suggestion {
  /** What Tab puts in the line. */
  text: string;
  hint: string;
  from: 'history' | 'command';
}

/**
 * What the line could become: commands sent before that start with what's
 * typed (newest first, each once, with how often), then, while the first
 * word is being typed, Klipper's commands that start with it, with their
 * help.
 */
export function suggestions (typed: string, commands: GcodeHelp, history: string[], limit = 6): Suggestion[] {
  const line = typed.trimStart()
  if (!line) return []
  const lower = line.toLowerCase()
  const counts = new Map<string, number>()
  for (const h of history) counts.set(h, (counts.get(h) ?? 0) + 1)
  const fromHistory: Suggestion[] = [...counts.keys()]
    .filter(h => h.toLowerCase().startsWith(lower) && h.toLowerCase() !== lower)
    .map(h => ({ text: h, hint: counts.get(h)! > 1 ? `used ${counts.get(h)} times` : 'used before', from: 'history' as const }))
  const word = line.split(/\s/)[0].toUpperCase()
  const typingWord = !/\s/.test(line)
  const sentAlready = new Set(fromHistory.map(h => h.text.toUpperCase()))
  const fromCommands: Suggestion[] = typingWord
    ? Object.keys(commands)
      .filter(c => c.toUpperCase().startsWith(word) && c.toUpperCase() !== word && !sentAlready.has(c.toUpperCase()))
      .sort((a, b) => a.length - b.length || a.localeCompare(b))
      .map(c => ({ text: c.toUpperCase(), hint: commands[c] ?? '', from: 'command' as const }))
    : []
  return [...fromHistory, ...fromCommands].slice(0, limit)
}

/** The help for the command being typed, once its name is complete. */
export function commandHelp (typed: string, commands: GcodeHelp): string | null {
  const word = typed.trim().split(/\s/)[0]?.toUpperCase()
  if (!word) return null
  const key = Object.keys(commands).find(c => c.toUpperCase() === word)
  return key ? (commands[key] || null) : null
}
