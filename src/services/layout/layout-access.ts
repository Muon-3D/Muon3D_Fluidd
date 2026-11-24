/**
 * Where a person's page layouts (Overview and Control) are kept (KAN-6106).
 *
 * Today each person's layout lives in the printer's own settings, under their
 * key, with a copy in this browser. KAN-6107 moves it to a per-account
 * Moonraker namespace. Everything that reads or writes a saved layout goes
 * through here, so that move is a change to this file alone: the pages and
 * the printer's Layout settings never touch the settings paths themselves.
 */
import { saveLayout, type LayoutContext } from '@/services/overview/layout-store'
import { defaultLayout, serverLayoutKey, type TileDefault } from '@/services/overview/layout'
import { cloudState } from '@/services/muon-cloud/state'

export type LayoutPage = 'overview' | 'control'

export const LAYOUT_PAGES: ReadonlyArray<{ page: LayoutPage, label: string }> = [
  { page: 'overview', label: 'Overview' },
  { page: 'control', label: 'Control' }
]

interface Store {
  state?: { config?: { apiUrl?: string | null, uiSettings?: Record<string, { layouts?: Record<string, unknown> } | undefined> } };
  dispatch: (type: string, payload?: unknown) => unknown;
}

/** Whose layout, on which printer, as the pages and this module agree on it. */
export function layoutContext (store: Store, route: { params?: Record<string, string | undefined> } | null | undefined, page: LayoutPage): LayoutContext {
  return {
    accountId: cloudState.account?.id ?? null,
    printerId: cloudState.activePrinterId ?? route?.params?.printer ?? store.state?.config?.apiUrl ?? null,
    ...(page === 'control' ? { page } : {})
  }
}

/** Every saved layout for a page, by person and printer; undefined until the printer's settings arrive. */
export function savedLayouts (store: Store, page: LayoutPage): Record<string, unknown> | undefined {
  return store.state?.config?.uiSettings?.[page]?.layouts
}

/** The one saved layout this person has here, if any. */
export function hasSavedLayout (store: Store, context: LayoutContext, page: LayoutPage): boolean {
  const own = savedLayouts(store, page)?.[serverLayoutKey(context.accountId, context.printerId)]
  return !!own && typeof own === 'object'
}

/**
 * Keeps one layout as this person's. Only their key on this printer, never the
 * whole map: another person's tab saving from an older copy must not wipe it.
 */
export function saveServerLayout (store: Store, page: LayoutPage, context: LayoutContext, record: unknown) {
  return store.dispatch('config/saveByPath', {
    path: `uiSettings.${page}.layouts.${serverLayoutKey(context.accountId, context.printerId)}`,
    value: record,
    server: true
  })
}

/** When this person's saved layout was written, or null with none. */
export function layoutSavedAt (store: Store, context: LayoutContext, page: LayoutPage): number | null {
  const own = savedLayouts(store, page)?.[serverLayoutKey(context.accountId, context.printerId)] as { savedAt?: unknown } | null | undefined
  return own && typeof own === 'object' && typeof own.savedAt === 'number' ? own.savedAt : null
}

/** The page's tiles, as the registry defaults them (loaded on demand: the widgets are heavy). */
export async function layoutDefs (page: LayoutPage): Promise<TileDefault[]> {
  return page === 'control'
    ? (await import('@/components/control/registry')).controlTiles as TileDefault[]
    : (await import('@/components/widgets/overview/registry')).overviewTiles as TileDefault[]
}

/** True when the saved copy is the default arrangement: nothing for the person to keep or reset. */
export function layoutIsDefault (store: Store, context: LayoutContext, page: LayoutPage, defs: TileDefault[]): boolean {
  const own = savedLayouts(store, page)?.[serverLayoutKey(context.accountId, context.printerId)] as { tiles?: unknown, hidden?: unknown } | null | undefined
  if (!own || typeof own !== 'object') return true
  const base = defaultLayout(defs)
  return JSON.stringify({ tiles: own.tiles, hidden: own.hidden }) === JSON.stringify({ tiles: base.tiles, hidden: base.hidden })
}

function browserStorage (): Pick<Storage, 'getItem' | 'setItem'> | null {
  try { return localStorage } catch { return null }
}

/**
 * Puts this person's page back to the default by saving the default itself,
 * here and on the printer. Not deleting: a browser holding an older copy
 * would bring the old arrangement back, and the newer default wins instead.
 */
export function resetLayout (store: Store, page: LayoutPage, context: LayoutContext, defs: TileDefault[], storage: Pick<Storage, 'getItem' | 'setItem'> | null = browserStorage()) {
  const base = defaultLayout(defs)
  const record = saveLayout(context, base, storage ?? { getItem: () => null, setItem: () => undefined })
  return saveServerLayout(store, page, context, record)
}
