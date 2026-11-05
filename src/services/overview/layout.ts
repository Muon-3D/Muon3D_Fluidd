/**
 * The Overview layout: which tiles are on the page, in what order and size,
 * and which are put away. Pure functions over plain data, so a saved layout
 * can be checked before it is trusted. A layout that does not check out is
 * never partly used: the caller falls back to the default.
 */
export interface TileDefault { id: string; span: number; rows?: number }
export interface PlacedTile { id: string; span: number; rows: number }
export interface OverviewLayout { tiles: PlacedTile[]; hidden: string[] }

/** Columns wide of the 12-column grid, and rows tall. */
export const MIN_SPAN = 3
export const MAX_SPAN = 12
export const MIN_ROWS = 1
export const MAX_ROWS = 4

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const whole = (n: unknown, fallback: number) => typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : fallback

function place (id: string, span: unknown, rows: unknown, fallback: { span: number; rows?: number }): PlacedTile {
  return { id, span: clamp(whole(span, fallback.span), MIN_SPAN, MAX_SPAN), rows: clamp(whole(rows, fallback.rows ?? 1), MIN_ROWS, MAX_ROWS) }
}

export function defaultLayout (defs: TileDefault[]): OverviewLayout {
  return { tiles: defs.map(d => place(d.id, d.span, d.rows, d)), hidden: [] }
}

export function moveTile (layout: OverviewLayout, id: string, toIndex: number): OverviewLayout {
  const from = layout.tiles.findIndex(t => t.id === id)
  if (from < 0) return layout
  const tiles = [...layout.tiles]
  const [tile] = tiles.splice(from, 1)
  tiles.splice(clamp(whole(toIndex, from), 0, tiles.length), 0, tile)
  return { ...layout, tiles }
}

export function moveBy (layout: OverviewLayout, id: string, by: number): OverviewLayout {
  const from = layout.tiles.findIndex(t => t.id === id)
  return from < 0 ? layout : moveTile(layout, id, from + by)
}

export function resizeTile (layout: OverviewLayout, id: string, span: number, rows: number): OverviewLayout {
  if (!layout.tiles.some(t => t.id === id)) return layout
  return { ...layout, tiles: layout.tiles.map(t => t.id === id ? place(id, span, rows, t) : t) }
}

export function nudgeSize (layout: OverviewLayout, id: string, dSpan: number, dRows: number): OverviewLayout {
  const t = layout.tiles.find(x => x.id === id)
  return t ? resizeTile(layout, id, t.span + dSpan, t.rows + dRows) : layout
}

export function removeTile (layout: OverviewLayout, id: string): OverviewLayout {
  if (!layout.tiles.some(t => t.id === id)) return layout
  return { tiles: layout.tiles.filter(t => t.id !== id), hidden: [...layout.hidden, id] }
}

/** A hidden tile goes in at the given place (the end when not said), at the size it has by default. */
export function addTile (layout: OverviewLayout, id: string, defs: TileDefault[], at?: number): OverviewLayout {
  const def = defs.find(d => d.id === id)
  if (!def || !layout.hidden.includes(id)) return layout
  const tiles = [...layout.tiles]
  tiles.splice(at === undefined ? tiles.length : clamp(whole(at, tiles.length), 0, tiles.length), 0, place(id, def.span, def.rows, def))
  return { tiles, hidden: layout.hidden.filter(h => h !== id) }
}

/**
 * Checks something read from storage or the server. Unknown and repeated tiles
 * are dropped, sizes are clamped, and tiles the saved copy never heard of come
 * back hidden. Returns null when nothing usable is there.
 */
export function readLayout (raw: unknown, defs: TileDefault[]): OverviewLayout | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const { tiles: rawTiles, hidden: rawHidden } = raw as { tiles?: unknown; hidden?: unknown }
  if (!Array.isArray(rawTiles)) return null
  const byId = new Map(defs.map(d => [d.id, d]))
  const seen = new Set<string>()
  const tiles: PlacedTile[] = []
  for (const entry of rawTiles) {
    const e = entry as { id?: unknown; span?: unknown; rows?: unknown } | null
    const def = e && typeof e === 'object' && typeof e.id === 'string' ? byId.get(e.id) : undefined
    if (!def || !e || seen.has(def.id)) continue
    seen.add(def.id)
    tiles.push(place(def.id, e.span, e.rows, def))
  }
  const hidden: string[] = []
  const chosen: string[] = []
  for (const id of Array.isArray(rawHidden) ? rawHidden : []) {
    if (typeof id === 'string' && byId.has(id) && !seen.has(id)) { seen.add(id); hidden.push(id); chosen.push(id) }
  }
  for (const d of defs) if (!seen.has(d.id)) hidden.push(d.id)
  // Everything dropped, and no one chose to hide it all: that is damage, not a choice.
  if (tiles.length === 0 && !(rawTiles.length === 0 && chosen.length === defs.length)) return null
  return { tiles, hidden }
}

const safe = (s: string) => s.replace(/[^a-z0-9_-]/gi, '_')

/** The browser's key for one person on one printer; no account is "anonymous". */
export function layoutKey (accountId: string | null, printerId: string | null): string {
  return `muon.overview.layout.v3.${safe(accountId ?? 'anonymous')}.${safe(printerId ?? 'printer')}`
}

/** The key inside the printer's settings (uiSettings.overview.layouts), where a dot would split the path. */
export function serverLayoutKey (accountId: string | null, printerId: string | null): string {
  return `${safe(accountId ?? 'anonymous')}__${safe(printerId ?? 'printer')}`
}
