/**
 * Settings › General (v3 storyboard): the five accent colours, light or dark,
 * the one-choice pickers over today's multi-choice settings, the model line,
 * what is each person's own on a printer, and what a restored copy changes.
 */
import type { PersonalSettings, PrintEtaCalculation, PrintProgressCalculation, ThemeConfig, ThemeMode, UiSettings } from '@/store/config/types'

export interface Accent {
  color: string;
  name: string;
}

/** Five accents that keep text readable on glass; the first is the default. */
export const ACCENTS: readonly Accent[] = [
  { color: '#80d6d1', name: 'Teal' },
  { color: '#7aa7ff', name: 'Blue' },
  { color: '#c9a7ff', name: 'Purple' },
  { color: '#ffb36b', name: 'Orange' },
  { color: '#9be38f', name: 'Green' }
]

/** The swatch for a stored colour, or null for a colour from before the swatches (it stays until one is picked). */
export function accentFor (color: string | null | undefined): Accent | null {
  const c = (color ?? '').trim().toLowerCase()
  return ACCENTS.find(a => a.color === c) ?? null
}

/** Dark, Light or Auto: a theme saved before Auto existed is the one its isDark says. */
export function themeModeOf (theme: Pick<ThemeConfig, 'isDark'> & { mode?: ThemeMode }): ThemeMode {
  if (theme.mode === 'dark' || theme.mode === 'light' || theme.mode === 'auto') return theme.mode
  return theme.isDark ? 'dark' : 'light'
}

export function systemPrefersDark (): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true
  } catch {
    return true
  }
}

export type ProgressChoice = 'file' | 'layers' | 'slicer'
export type EtaChoice = 'slicer' | 'file' | 'average'

const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every(v => b.includes(v))

/** The one choice a stored list makes, or null when it is a mix from before (kept until someone picks). */
export function progressChoiceOf (stored: readonly PrintProgressCalculation[] | null | undefined): ProgressChoice | null {
  const list = stored ?? []
  for (const choice of ['file', 'layers', 'slicer'] as const) {
    if (same(list, [choice])) return choice
  }
  return null
}

export function progressStoredFor (choice: ProgressChoice): PrintProgressCalculation[] {
  return [choice]
}

export function etaChoiceOf (stored: readonly PrintEtaCalculation[] | null | undefined): EtaChoice | null {
  const list = stored ?? []
  if (same(list, ['slicer'])) return 'slicer'
  if (same(list, ['file'])) return 'file'
  if (same(list, ['file', 'slicer'])) return 'average'
  return null
}

/** Average is the existing "more than one: their average". */
export function etaStoredFor (choice: EtaChoice): PrintEtaCalculation[] {
  return choice === 'average' ? ['file', 'slicer'] : [choice]
}

/** "Muon M1 · serial M1-0042"; no serial when the printer reports none. */
export function modelLine (isMuon: boolean | null, serial?: string | null): string {
  const model = isMuon ? 'Muon M1' : 'Klipper printer'
  const s = typeof serial === 'string' ? serial.trim() : ''
  return s ? `${model} · serial ${s}` : model
}

/** The serial a printer's /server/muon/identity reports, if it does. */
export function serialFromIdentity (identity: unknown): string | null {
  if (!identity || typeof identity !== 'object') return null
  const record = identity as Record<string, unknown>
  const source = (record.result && typeof record.result === 'object' ? record.result : record) as Record<string, unknown>
  for (const key of ['serial', 'serial_number']) {
    const v = source[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

/** The Look and Ask before settings: each person's own on this printer. */
export const PERSONAL_THEME_KEYS = ['color', 'isDark', 'mode'] as const
export const PERSONAL_GENERAL_KEYS = [
  'confirmOnEstop',
  'confirmOnSaveConfigAndRestart',
  'confirmOnPowerDeviceChange',
  'showUploadAndPrint'
] as const

export type { PersonalSettings }

/** The printer-wide values of the personal settings: what someone sees before they change one. */
export function pickPersonal (ui: Pick<UiSettings, 'theme' | 'general'>): Required<PersonalSettings> {
  const theme: PersonalSettings['theme'] = {}
  const general: PersonalSettings['general'] = {}
  for (const key of PERSONAL_THEME_KEYS) {
    if (ui.theme[key] !== undefined) (theme as Record<string, unknown>)[key] = ui.theme[key]
  }
  for (const key of PERSONAL_GENERAL_KEYS) {
    if (ui.general[key] !== undefined) (general as Record<string, unknown>)[key] = ui.general[key]
  }
  return { theme, general }
}

/** Someone's own values over the printer's. */
export function mergePersonal (shared: PersonalSettings, mine: PersonalSettings | null | undefined): Required<PersonalSettings> {
  return {
    theme: { ...shared.theme, ...(mine?.theme ?? {}) },
    general: { ...shared.general, ...(mine?.general ?? {}) }
  }
}

export const isPersonalPath = (path: string): boolean => {
  const [section, key] = path.split('.')
  return (section === 'theme' && (PERSONAL_THEME_KEYS as readonly string[]).includes(key)) ||
    (section === 'general' && (PERSONAL_GENERAL_KEYS as readonly string[]).includes(key))
}

export interface RestoreChange {
  label: string;
  value: string;
}

type Json = Record<string, unknown>

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

const LABELS: Record<string, string> = {
  'uiSettings.general.instanceName': 'Name',
  'uiSettings.theme.color': 'Accent colour',
  'uiSettings.theme.mode': 'Light or dark',
  'uiSettings.theme.isDark': 'Light or dark',
  'uiSettings.general.locale': 'Language',
  'uiSettings.general.dateFormat': 'Dates',
  'uiSettings.general.timeFormat': 'Times',
  'uiSettings.general.confirmOnEstop': 'Ask before an emergency stop',
  'uiSettings.general.confirmOnSaveConfigAndRestart': 'Ask before saving the configuration',
  'uiSettings.general.confirmOnPowerDeviceChange': 'Ask before turning off a power switch',
  'uiSettings.general.showUploadAndPrint': 'Printing straight after upload',
  'uiSettings.general.printProgressCalculation': 'Progress is measured by',
  'uiSettings.general.printEtaCalculation': 'Time left comes from',
  'uiSettings.general.topNavPowerToggle': 'Power switch in the printer chip',
  'uiSettings.general.enableKeyboardShortcuts': 'Shortcuts',
  'uiSettings.general.showSaveConfigAndRestart': 'Save and restart in the top bar',
  'uiSettings.editor.saveAndRestart': 'Save and restart',
  'uiSettings.editor.textSize': 'Text size',
  'uiSettings.general.sectionsToIgnorePendingConfigurationChanges': 'Changes not to list',
  'uiSettings.general.enableDiagnostics': 'Charts page',
  'uiSettings.dashboard.overviewMacros': 'Macros on Overview',
  'uiSettings.console.hideLines': 'Console filters',
  'uiSettings.console.filters': 'Console filters'
}

const SECTIONS: Record<string, string> = {
  'uiSettings.general': 'General',
  'uiSettings.theme': 'Look',
  'uiSettings.dashboard': 'Overview',
  'uiSettings.overview': 'Overview',
  'uiSettings.console': 'Console',
  'uiSettings.editor': 'Files and editor',
  'uiSettings.fileSystem': 'Files and editor',
  'uiSettings.gcodePreview': 'G-code preview and 3D',
  'uiSettings.toolhead': 'Moving and extruding',
  'uiSettings.spoolman': 'Materials',
  'uiSettings.tableHeaders': 'Tables',
  'uiSettings.personal': 'Look and Ask before',
  macros: 'Macros',
  layout: 'Page layout',
  console: 'Console history',
  charts: 'Charts',
  cameras: 'Cameras',
  webcams: 'Cameras'
}

function leaves (value: unknown, path: string, out: Map<string, unknown>) {
  if (isObject(value)) {
    for (const key of Object.keys(value)) leaves(value[key], path ? `${path}.${key}` : key, out)
  } else {
    out.set(path, value)
  }
}

/** A personal value reads as its own setting: personal.<who>.theme.color is the accent colour. */
const labelPath = (path: string) => path.replace(/^uiSettings\.personal\.[^.]+\./, 'uiSettings.')

function show (path: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return 'None'
  if (labelPath(path) === 'uiSettings.theme.color' && typeof value === 'string') return accentFor(value)?.name ?? value
  if (labelPath(path) === 'uiSettings.theme.isDark') return value ? 'Dark' : 'Light'
  if (labelPath(path) === 'uiSettings.theme.mode' && typeof value === 'string') return value[0].toUpperCase() + value.slice(1)
  if (typeof value === 'boolean') return value ? 'On' : 'Off'
  if (Array.isArray(value)) return String(value.length)
  return String(value)
}

function arrayChange (before: unknown, after: unknown[]): string {
  if (!Array.isArray(before)) return `${after.length} added`
  const was = before.map(v => JSON.stringify(v))
  const now = after.map(v => JSON.stringify(v))
  const added = now.filter(v => !was.includes(v)).length
  if (after.length > before.length && was.every(v => now.includes(v))) return `${added} added`
  if (after.length === before.length) return 'Changed'
  return `${before.length} → ${after.length}`
}

/**
 * What restoring `copy` over `current` changes: one row a known setting
 * (old → new), and one row for each other part of Control ("3 changed").
 * Only the parts the copy holds are compared; restoring writes those whole.
 */
export function restoreChanges (current: Json | null | undefined, copy: Json): RestoreChange[] {
  const before = new Map<string, unknown>()
  const after = new Map<string, unknown>()
  for (const key of Object.keys(copy)) {
    leaves((current ?? {})[key], key, before)
    leaves(copy[key], key, after)
  }

  const changed = [...new Set([...before.keys(), ...after.keys()])]
    .filter(path => after.has(path) && JSON.stringify(before.get(path)) !== JSON.stringify(after.get(path)))

  const rows: RestoreChange[] = []
  const grouped = new Map<string, number>()
  for (const path of changed) {
    const label = LABELS[labelPath(path)] ?? LABELS[labelPath(path).split('.').slice(0, 3).join('.')]
    if (label) {
      if (rows.some(r => r.label === label)) continue
      const was = before.get(path)
      const now = after.get(path)
      const value = Array.isArray(now) ? arrayChange(was, now) : `${show(path, was)} → ${show(path, now)}`
      rows.push({ label, value })
    } else {
      const parts = path.split('.')
      const section = SECTIONS[parts.slice(0, 2).join('.')] ?? SECTIONS[parts[0]] ?? parts[0]
      grouped.set(section, (grouped.get(section) ?? 0) + 1)
    }
  }
  for (const [label, count] of grouped) {
    if (!rows.some(r => r.label === label)) rows.push({ label, value: `${count} changed` })
  }
  return rows
}

/** "boxwood-control-2026-10-30.json". */
export function copyFileName (slug: string, date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return `${slug || 'control'}-control-${day}.json`
}
