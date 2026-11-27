import { defaultLayout, layoutKey, readLayout, serverLayoutKey, type OverviewLayout, type TileDefault } from './layout'

/** What is written, in the browser and in the printer's settings. */
/**
 * Version 2 (I-542) is the page with Hotend, Bed, Position and Print mode in one row and
 * Quick commands across the bottom. A copy saved before it (version 1) predates that row,
 * so it is not read: the new default shows once, with a notice (see `staleLayout`), and
 * the person's next save, or "Keep this layout", writes the new version.
 */
export const LAYOUT_VERSION = 3
/**
 * Version 3 (KAN-5979): Hotend, Bed, Position and Print mode are the same width. A version 2 copy is
 * still read, and those four (only) are set to the shared width once; every other tile keeps its size
 * and order. The next save writes version 3, so a later resize of them is kept.
 */
export const EQUAL_PANELS = ['hotend', 'bed', 'position', 'mode']
export const EQUAL_PANEL_SPAN = 3
export interface SavedLayout extends OverviewLayout { version: typeof LAYOUT_VERSION; savedAt: number }
/** Whose layout, on which printer, and of which page ('overview' when not said). */
export interface LayoutContext { accountId: string | null; printerId: string | null; page?: string }
type Storage_ = Pick<Storage, 'getItem' | 'setItem'>

function checked (raw: unknown, defs: TileDefault[]): { layout: OverviewLayout; savedAt: number } | null {
  const version = (raw as { version?: unknown } | null)?.version
  if (version !== LAYOUT_VERSION && version !== 2) return null
  const read = readLayout(raw, defs)
  if (!read) return null
  const layout = version === 2
    ? { ...read, tiles: read.tiles.map(t => EQUAL_PANELS.includes(t.id) ? { ...t, span: EQUAL_PANEL_SPAN, rows: 1 } : t) }
    : read
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

/** True when this person has a layout saved before version 2 and none since: the page shows the new default and says so. */
export function staleLayout (context: LayoutContext, serverLayouts: unknown, storage: Storage_, defs: TileDefault[]): boolean {
  const fromServer = serverLayouts && typeof serverLayouts === 'object' ? (serverLayouts as Record<string, unknown>)[serverLayoutKey(context.accountId, context.printerId)] : undefined
  if (checked(fromServer, defs) || fromBrowser(layoutKey(context.accountId, context.printerId, context.page), storage, defs)) return false
  let local: unknown
  try { const text = storage.getItem(layoutKey(context.accountId, context.printerId, context.page)); local = text ? JSON.parse(text) : undefined } catch { local = undefined }
  return [fromServer, local].some(r => !!r && typeof r === 'object' && Array.isArray((r as { tiles?: unknown }).tiles))
}

/** Keeps the layout in this browser and returns the copy to send to the printer's settings. */
export function saveLayout (context: LayoutContext, layout: OverviewLayout, storage: Storage_, now: number = Date.now()): SavedLayout {
  const record: SavedLayout = { version: LAYOUT_VERSION, savedAt: now, tiles: layout.tiles.map(t => ({ ...t })), hidden: [...layout.hidden] }
  try { storage.setItem(layoutKey(context.accountId, context.printerId, context.page), JSON.stringify(record)) } catch { /* the printer still keeps it */ }
  return record
}
