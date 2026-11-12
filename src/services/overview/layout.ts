/**
 * The Overview layout: which tiles are on the page, in what order and size,
 * and which are put away. Pure functions over plain data, so a saved layout
 * can be checked before it is trusted. A layout that does not check out is
 * never partly used: the caller falls back to the default.
 */
/** One size a widget offers: S, M or L, in columns of the 12 and rows. */
export interface SizeVariant { key: string; span: number; rows: number }
export interface TileDefault {
  id: string;
  span: number;
  rows?: number;
  /** The sizes the widget offers. When given, a size is always one of these. */
  sizes?: SizeVariant[];
  /** On the page in the default layout; true when not said. */
  defaultOn?: boolean;
  /** Saved ids that now mean this widget. */
  legacy?: string[];
}
export interface PlacedTile { id: string; span: number; rows: number }
export interface OverviewLayout { tiles: PlacedTile[]; hidden: string[] }

/** Columns wide of the 12-column grid, and rows tall. */
export const MIN_SPAN = 3
export const MAX_SPAN = 12
export const MIN_ROWS = 1
export const MAX_ROWS = 4

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const whole = (n: unknown, fallback: number) => typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : fallback

/**
 * The size a widget may have: the nearest of the sizes it offers that fits in
 * `cols` columns. A size that does not fit is not allowed. Rows count for more
 * than columns (a tall tile is a different shape), and a tie goes to the smaller.
 * When none fits, the narrowest is used rather than none.
 */
export function snapSize (sizes: SizeVariant[], span: number, rows: number, cols = MAX_SPAN): SizeVariant | null {
  if (!sizes.length) return null
  const fitting = sizes.filter(s => s.span <= cols)
  const pool = fitting.length ? fitting : [sizes.reduce((a, b) => (b.span < a.span ? b : a))]
  const cost = (s: SizeVariant) => Math.abs(s.span - span) + 4 * Math.abs(s.rows - rows)
  return pool.reduce((best, s) => {
    const d = cost(s) - cost(best)
    return d < 0 || (d === 0 && s.span * s.rows < best.span * best.rows) ? s : best
  })
}

/** Which of the widget's sizes a placed tile is, if it is one. */
export function sizeKeyOf (def: Pick<TileDefault, 'sizes'>, tile: { span: number; rows: number }): string | null {
  return def.sizes?.find(s => s.span === tile.span && s.rows === tile.rows)?.key ?? null
}

function place (id: string, span: unknown, rows: unknown, fallback: TileDefault, cols = MAX_SPAN): PlacedTile {
  const wantSpan = clamp(whole(span, fallback.span), MIN_SPAN, MAX_SPAN)
  const wantRows = clamp(whole(rows, fallback.rows ?? 1), MIN_ROWS, MAX_ROWS)
  const snapped = fallback.sizes ? snapSize(fallback.sizes, wantSpan, wantRows, cols) : null
  return snapped ? { id, span: snapped.span, rows: snapped.rows } : { id, span: wantSpan, rows: wantRows }
}

/** The widgets that are on by default, in order; the rest are put away until added. */
export function defaultLayout (defs: TileDefault[]): OverviewLayout {
  return {
    tiles: defs.filter(d => d.defaultOn !== false).map(d => place(d.id, d.span, d.rows, d)),
    hidden: defs.filter(d => d.defaultOn === false).map(d => d.id)
  }
}

export function moveTile (layout: OverviewLayout, id: string, toIndex: number): OverviewLayout {
  const from = layout.tiles.findIndex(t => t.id === id)
  if (from < 0) return layout
  const tiles = [...layout.tiles]
  const [tile] = tiles.splice(from, 1)
  tiles.splice(clamp(whole(toIndex, from), 0, tiles.length), 0, tile)
  return { ...layout, tiles }
}

export interface Slot { id: string; left: number; top: number; width: number; height: number }

/**
 * Where a held tile goes when the pointer is over the grid but on no tile: the
 * empty end of a row, the start of one, or above or below every tile. Returns
 * the place among the other tiles (what `moveTile` takes), or null in a gap
 * between rows. Slots are in layout order.
 */
export function dropIndex (slots: Slot[], id: string, x: number, y: number): number | null {
  const others = slots.filter(s => s.id !== id)
  if (!others.length) return null
  const row = others.filter(s => y >= s.top && y < s.top + s.height)
  if (row.length) {
    const before = row.filter(s => s.left + s.width / 2 <= x)
    return before.length ? others.indexOf(before[before.length - 1]) + 1 : others.indexOf(row[0])
  }
  if (y < Math.min(...others.map(s => s.top))) return 0
  if (y >= Math.max(...others.map(s => s.top + s.height))) return others.length
  return null
}

export function moveBy (layout: OverviewLayout, id: string, by: number): OverviewLayout {
  const from = layout.tiles.findIndex(t => t.id === id)
  return from < 0 ? layout : moveTile(layout, id, from + by)
}

/** With `defs`, the size snaps to one the widget offers. */
export function resizeTile (layout: OverviewLayout, id: string, span: number, rows: number, defs?: TileDefault[]): OverviewLayout {
  if (!layout.tiles.some(t => t.id === id)) return layout
  const def = defs?.find(d => d.id === id)
  return { ...layout, tiles: layout.tiles.map(t => t.id === id ? place(id, span, rows, def ?? t) : t) }
}

/**
 * One step bigger or smaller. A widget with set sizes steps to the next size
 * in that direction (by columns, or by rows for an up or down step); one
 * without moves a column or a row.
 */
export function nudgeSize (layout: OverviewLayout, id: string, dSpan: number, dRows: number, defs?: TileDefault[]): OverviewLayout {
  const t = layout.tiles.find(x => x.id === id)
  if (!t) return layout
  const sizes = defs?.find(d => d.id === id)?.sizes
  if (!sizes?.length) return resizeTile(layout, id, t.span + dSpan, t.rows + dRows)
  const dir = dSpan || dRows
  if (!dir) return layout
  const key = dSpan ? (s: { span: number; rows: number }) => s.span * 100 + s.rows : (s: { span: number; rows: number }) => s.rows * 100 + s.span
  const here = key(t)
  const next = sizes.filter(s => (dir > 0 ? key(s) > here : key(s) < here)).sort((a, b) => dir * (key(a) - key(b)))[0]
  return next ? resizeTile(layout, id, next.span, next.rows, defs) : layout
}

export function removeTile (layout: OverviewLayout, id: string): OverviewLayout {
  if (!layout.tiles.some(t => t.id === id)) return layout
  return { tiles: layout.tiles.filter(t => t.id !== id), hidden: [...layout.hidden, id] }
}

/**
 * A hidden tile goes in at the given place (the end when not said), at the
 * size asked for: its default when not said, and the nearest that fits in
 * `cols` columns when the one asked for does not.
 */
export function addTile (layout: OverviewLayout, id: string, defs: TileDefault[], at?: number, sizeKey?: string, cols = MAX_SPAN): OverviewLayout {
  const def = defs.find(d => d.id === id)
  if (!def || !layout.hidden.includes(id)) return layout
  const asked = sizeKey ? def.sizes?.find(s => s.key === sizeKey) : undefined
  const tiles = [...layout.tiles]
  tiles.splice(at === undefined ? tiles.length : clamp(whole(at, tiles.length), 0, tiles.length), 0, place(id, asked?.span ?? def.span, asked?.rows ?? def.rows, def, cols))
  return { tiles, hidden: layout.hidden.filter(h => h !== id) }
}

/**
 * Checks something read from storage or the server. Old ids are mapped to the
 * widget that replaced them, unknown and repeated tiles are dropped, sizes
 * snap to ones the widget offers, and tiles the saved copy never heard of come
 * back hidden. Returns null when nothing usable is there.
 */
export function readLayout (raw: unknown, defs: TileDefault[]): OverviewLayout | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const { tiles: rawTiles, hidden: rawHidden } = raw as { tiles?: unknown; hidden?: unknown }
  if (!Array.isArray(rawTiles)) return null
  const byId = new Map(defs.map(d => [d.id, d]))
  // A widget's own id always wins over an old id that names it.
  for (const d of defs) for (const old of d.legacy ?? []) if (!byId.has(old)) byId.set(old, d)
  const seen = new Set<string>()
  const tiles: PlacedTile[] = []
  for (const entry of rawTiles) {
    const e = entry as { id?: unknown; span?: unknown; rows?: unknown } | null
    const def = e && typeof e === 'object' && typeof e.id === 'string' ? byId.get(e.id) : undefined
    if (!def || !e || seen.has(def.id)) continue
    seen.add(def.id)
    // A tile saved under an old id keeps its place but takes the new widget's own size.
    const renamed = e.id !== def.id
    tiles.push(place(def.id, renamed ? undefined : e.span, renamed ? undefined : e.rows, def))
  }
  const hidden: string[] = []
  const chosen: string[] = []
  for (const old of Array.isArray(rawHidden) ? rawHidden : []) {
    const def = typeof old === 'string' ? byId.get(old) : undefined
    if (def && !seen.has(def.id)) { seen.add(def.id); hidden.push(def.id); chosen.push(def.id) }
  }
  for (const d of defs) if (!seen.has(d.id)) hidden.push(d.id)
  // Everything dropped, and no one chose to hide it all: that is damage, not a choice.
  if (tiles.length === 0 && !(rawTiles.length === 0 && chosen.length === defs.length)) return null
  return { tiles, hidden }
}

const safe = (s: string) => s.replace(/[^a-z0-9_-]/gi, '_')

/** The browser's key for one person on one printer and page (Overview or Control); no account is "anonymous". */
export function layoutKey (accountId: string | null, printerId: string | null, page = 'overview'): string {
  return `muon.${safe(page)}.layout.v3.${safe(accountId ?? 'anonymous')}.${safe(printerId ?? 'printer')}`
}

/** The key inside the printer's settings (uiSettings.overview.layouts), where a dot would split the path. */
export function serverLayoutKey (accountId: string | null, printerId: string | null): string {
  return `${safe(accountId ?? 'anonymous')}__${safe(printerId ?? 'printer')}`
}
