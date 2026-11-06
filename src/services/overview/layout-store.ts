import { defaultLayout, layoutKey, readLayout, serverLayoutKey, type OverviewLayout, type TileDefault } from './layout'

/** What is written, in the browser and in the printer's settings. */
export interface SavedLayout extends OverviewLayout { version: 1; savedAt: number }
/** Whose layout, on which printer, and of which page ('overview' when not said). */
export interface LayoutContext { accountId: string | null; printerId: string | null; page?: string }
type Storage_ = Pick<Storage, 'getItem' | 'setItem'>

function checked (raw: unknown, defs: TileDefault[]): { layout: OverviewLayout; savedAt: number } | null {
  const layout = readLayout(raw, defs)
  if (!layout) return null
  const at = (raw as { savedAt?: unknown }).savedAt
  return { layout, savedAt: typeof at === 'number' && Number.isFinite(at) ? at : 0 }
}

function fromBrowser (key: string, storage: Storage_, defs: TileDefault[]) {
  try {
    const text = storage.getItem(key)
    return text ? checked(JSON.parse(text), defs) : null
  } catch { return null }
}

/**
 * The layout to show: this person's copy on this printer from the printer's
 * settings, or, when the printer has none, this browser's. The printer's copy
 * wins rather than the newer `savedAt`, because the clocks of two devices can
 * disagree and a fast one would otherwise pin its layout. A copy that fails
 * the check is ignored, and with none left the default is used, so a bad save
 * can never blank the page.
 */
export function loadLayout (context: LayoutContext, serverLayouts: unknown, storage: Storage_, defs: TileDefault[]): OverviewLayout {
  const server = serverLayouts && typeof serverLayouts === 'object'
    ? checked((serverLayouts as Record<string, unknown>)[serverLayoutKey(context.accountId, context.printerId)], defs)
    : null
  const local = fromBrowser(layoutKey(context.accountId, context.printerId, context.page), storage, defs)
  return (server ?? local)?.layout ?? defaultLayout(defs)
}

/** Keeps the layout in this browser and returns the copy to send to the printer's settings. */
export function saveLayout (context: LayoutContext, layout: OverviewLayout, storage: Storage_, now: number = Date.now()): SavedLayout {
  const record: SavedLayout = { version: 1, savedAt: now, tiles: layout.tiles.map(t => ({ ...t })), hidden: [...layout.hidden] }
  try { storage.setItem(layoutKey(context.accountId, context.printerId, context.page), JSON.stringify(record)) } catch { /* the printer still keeps it */ }
  return record
}
