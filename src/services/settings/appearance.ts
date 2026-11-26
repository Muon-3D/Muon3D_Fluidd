/**
 * Appearance (KAN-6105, KAN-6106): the accent colour and Light/Dark/Auto are
 * the person's own, kept in this browser (as the Control preferences are),
 * not in each printer's settings. A printer that saved a theme before this
 * hands it over once, the first time the browser has none of its own, so
 * nobody loses what they chose. The printer's copy is left where it is.
 */
import type { ThemeConfig, ThemeMode } from '@/store/config/types'
import { ACCENTS, systemPrefersDark, themeModeOf } from './general'

export const APPEARANCE_KEY = 'muon3d.appearance'

export interface Appearance {
  color: string;
  mode: ThemeMode;
}

type Store = Pick<Storage, 'getItem' | 'setItem'>

const MODES: ThemeMode[] = ['dark', 'light', 'auto']

function browserStore (): Store | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}

/** What this browser holds, or null when nothing (or nothing readable) is saved. */
export function readAppearance (storage: Store | null = browserStore()): Partial<Appearance> | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(APPEARANCE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as { color?: unknown, mode?: unknown } | null
    if (!value || typeof value !== 'object') return null
    const out: Partial<Appearance> = {}
    if (typeof value.color === 'string' && /^#[0-9a-f]{6}$/i.test(value.color)) out.color = value.color.toLowerCase()
    if (typeof value.mode === 'string' && (MODES as string[]).includes(value.mode)) out.mode = value.mode as ThemeMode
    return out.color || out.mode ? out : null
  } catch {
    return null
  }
}

export function writeAppearance (appearance: Partial<Appearance>, storage: Store | null = browserStore()): void {
  if (!storage) return
  try { storage.setItem(APPEARANCE_KEY, JSON.stringify(appearance)) } catch { /* the page still shows it this session */ }
}

/** The printer's own theme, as far as it was ever changed from the defaults. */
export function legacyAppearance (theme: Pick<ThemeConfig, 'color' | 'isDark'> & { mode?: ThemeMode }): Partial<Appearance> | null {
  const color = (theme.color ?? '').trim().toLowerCase()
  const out: Partial<Appearance> = {}
  if (/^#[0-9a-f]{6}$/.test(color) && color !== ACCENTS[0].color) out.color = color
  const mode = themeModeOf(theme)
  if (mode !== 'dark') out.mode = mode
  return out.color || out.mode ? out : null
}

/**
 * What to show: this browser's choice, each part falling back to the printer's
 * saved theme. `migrate` is set when the browser had nothing and the printer
 * did, so the caller keeps it in this browser from now on.
 */
export function resolveAppearance (
  stored: Partial<Appearance> | null,
  theme: Pick<ThemeConfig, 'color' | 'isDark'> & { mode?: ThemeMode }
): { appearance: Appearance, migrate: Partial<Appearance> | null } {
  const legacy = legacyAppearance(theme)
  const migrate = !stored && legacy ? legacy : null
  const own = stored ?? legacy ?? {}
  return {
    appearance: { color: own.color ?? ACCENTS[0].color, mode: own.mode ?? 'dark' },
    migrate
  }
}

/** Whether the screen is dark under a mode. */
export function isDarkFor (mode: ThemeMode): boolean {
  return mode === 'auto' ? systemPrefersDark() : mode === 'dark'
}
