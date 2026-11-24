/**
 * Where a person's page layouts (Overview and Control) are kept (KAN-6106).
 *
 * Today each person's layout lives in the printer's own settings, under their
 * key, with a copy in this browser. KAN-6107 moves it to a per-account
 * Moonraker namespace. Everything that reads or writes a saved layout goes
 * through here, so that move is a change to this file alone: the pages and
 * the printer's Layout settings never touch the settings paths themselves.
 */
import type { LayoutContext } from '@/services/overview/layout-store'
import { layoutKey, serverLayoutKey } from '@/services/overview/layout'
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

/** Puts this person's page back to the default: no saved copy here or in this browser. */
export function resetLayout (store: Store, page: LayoutPage, context: LayoutContext, storage: Pick<Storage, 'removeItem'> = localStorage) {
  try { storage.removeItem(layoutKey(context.accountId, context.printerId, context.page)) } catch { /* the printer's copy goes below */ }
  return saveServerLayout(store, page, context, null)
}
