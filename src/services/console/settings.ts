import { Globals } from '@/globals'
import escapeRegExp from '@/util/escape-regexp'
import type { ConsoleEntry, ConsoleFilter, ConsoleFilterType } from '@/store/console/types'

/** A chip above the Console's input. `send` runs it on a tap; otherwise it goes in the input to be edited. */
export interface QuickCommand {
  id: string;
  command: string;
  label: string;
  send: boolean;
}

export type ConsoleTextSize = 'sm' | 'md' | 'lg'

/** Settings › Console, kept in uiSettings.console on the printer. */
export interface ConsoleConfig {
  timestamps: boolean;
  linesKept: number;
  textSize: ConsoleTextSize;
  suggest: boolean;
  enterSends: boolean;
  historyCount: number;
  /** Each person's quick commands on this printer, by quickCommandsKey(account). */
  quickCommands: Record<string, QuickCommand[]>;
}

export const LINES_KEPT = [200, 500, 1000]
export const HISTORY_COUNTS = [10, 20, 50, 100]

export const defaultConsoleConfig = (): ConsoleConfig => ({
  timestamps: true,
  linesKept: Globals.CONSOLE_HISTORY_RETENTION,
  textSize: 'md',
  suggest: true,
  enterSends: true,
  historyCount: Globals.CONSOLE_COMMAND_HISTORY,
  quickCommands: {}
})

/** The settings with every missing or unusable value at its default. */
export function consoleConfig (saved: Partial<ConsoleConfig> | null | undefined): ConsoleConfig {
  const d = defaultConsoleConfig()
  const s = saved ?? {}
  return {
    timestamps: typeof s.timestamps === 'boolean' ? s.timestamps : d.timestamps,
    linesKept: LINES_KEPT.includes(s.linesKept as number) ? s.linesKept as number : d.linesKept,
    textSize: ['sm', 'md', 'lg'].includes(s.textSize as string) ? s.textSize as ConsoleTextSize : d.textSize,
    suggest: typeof s.suggest === 'boolean' ? s.suggest : d.suggest,
    enterSends: typeof s.enterSends === 'boolean' ? s.enterSends : d.enterSends,
    historyCount: HISTORY_COUNTS.includes(s.historyCount as number) ? s.historyCount as number : d.historyCount,
    quickCommands: s.quickCommands && typeof s.quickCommands === 'object' ? s.quickCommands : {}
  }
}

/** The chips everyone starts with, as the Console had them. */
export const DEFAULT_QUICK_COMMANDS: QuickCommand[] = ['G28', 'M105', 'BED_MESH_CALIBRATE', 'QUERY_PROBE', 'FIRMWARE_RESTART', 'STATUS']
  .map(command => ({ id: command.toLowerCase(), command, label: '', send: true }))

/** One person's key in uiSettings.console.quickCommands; no account is "anonymous". A dot would split the path. */
export function quickCommandsKey (accountId: string | null | undefined): string {
  return (accountId || 'anonymous').replace(/[^a-z0-9_-]/gi, '_')
}

const isQuickCommand = (q: unknown): q is QuickCommand =>
  !!q && typeof q === 'object' && typeof (q as QuickCommand).command === 'string' && !!(q as QuickCommand).command.trim()

/** This person's chips: what they saved, else the defaults. */
export function quickCommandsFor (config: ConsoleConfig, key: string): QuickCommand[] {
  const saved = config.quickCommands[key]
  if (!Array.isArray(saved)) return DEFAULT_QUICK_COMMANDS.map(q => ({ ...q }))
  return saved.filter(isQuickCommand).map((q, i) => ({
    id: typeof q.id === 'string' && q.id ? q.id : `q${i}`,
    command: q.command.trim(),
    label: typeof q.label === 'string' ? q.label.trim() : '',
    send: q.send !== false
  }))
}

/** What a chip says: its label, else its command. */
export const chipText = (q: QuickCommand): string => q.label || q.command

/** The list with one chip moved from `from` to `to`. */
export function moveQuickCommand (list: QuickCommand[], from: number, to: number): QuickCommand[] {
  const next = [...list]
  if (from < 0 || from >= next.length) return next
  const [moved] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(next.length, to)), 0, moved)
  return next
}

/** The list with `q` added (no id yet) or replaced (by id). */
export function saveQuickCommand (list: QuickCommand[], q: QuickCommand): QuickCommand[] {
  const clean = { ...q, command: q.command.trim(), label: q.label.trim() }
  if (clean.id && list.some(x => x.id === clean.id)) return list.map(x => (x.id === clean.id ? clean : x))
  const used = new Set(list.map(x => x.id))
  let n = list.length
  while (used.has(`q${n}`)) n++
  return [...list, { ...clean, id: `q${n}` }]
}

/** The expression a filter hides lines with, as the console store compiles it. Throws on a bad pattern. */
export function compileFilter (filter: Pick<ConsoleFilter, 'type' | 'value'>): RegExp {
  switch (filter.type) {
    case 'starts-with':
      return new RegExp(`^${escapeRegExp(filter.value)}.*`, 'i')
    case 'expression':
      return new RegExp(filter.value)
    default:
      return new RegExp(`.*${escapeRegExp(filter.value)}.*`, 'i')
  }
}

/** Why a filter can't be saved, or null when it can. */
export function filterProblem (filter: Pick<ConsoleFilter, 'type' | 'value'>): string | null {
  if (!filter.value.trim()) return filter.type === 'expression' ? 'Type a pattern to match.' : 'Type the text to match.'
  if (filter.type !== 'expression') return null
  try {
    compileFilter(filter)
    return null
  } catch (e) {
    const reason = e instanceof Error ? e.message.replace(/^Invalid regular expression:\s*/, '') : String(e)
    return `That pattern can't be used: ${reason}`
  }
}

export const PREVIEW_LINES = 200

export interface FilterPreview {
  /** How many lines the preview looked at (up to PREVIEW_LINES). */
  of: number;
  /** The lines the filter would hide, oldest first. */
  hidden: ConsoleEntry[];
}

/** What the filter would hide of the last 200 lines. Nothing, for a filter that can't be saved. */
export function previewFilter (filter: Pick<ConsoleFilter, 'type' | 'value'>, entries: ConsoleEntry[]): FilterPreview {
  const last = entries.slice(-PREVIEW_LINES)
  if (filterProblem(filter)) return { of: last.length, hidden: [] }
  const expression = compileFilter(filter)
  return { of: last.length, hidden: last.filter(e => expression.test(e.message)) }
}

/** The line under a filter's name: `starts with "// timelapse"`. */
export function describeFilter (filter: Pick<ConsoleFilter, 'type' | 'value'>): string {
  if (filter.type === 'expression') return `matches /${filter.value}/`
  return `${filter.type === 'starts-with' ? 'starts with' : 'contains'} "${filter.value}"`
}

export const FILTER_TYPES: Array<{ value: ConsoleFilterType, label: string }> = [
  { value: 'contains', label: 'Contain' },
  { value: 'starts-with', label: 'Start with' },
  { value: 'expression', label: 'Pattern' }
]
