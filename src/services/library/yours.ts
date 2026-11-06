/**
 * Yours (Library v3, page 2): what you sliced, printed, shared and designed,
 * as shelves of your own prints. Saved and Collections are the community's
 * (shelves.ts); these are the Library's own items and runs.
 *
 * One card shape for all four, so a shelf and its See all grid draw the same
 * card: its picture is the item's thumbnail, its button what that shelf does
 * with it (Print, Print again, Slice).
 */
import type { LibraryItem, LibraryRun } from './api'
import { agoText, printFacts } from './format'

export type OwnShelfId = 'sliced' | 'printed' | 'shared' | 'designs'

/** What the card's button does: print it, print that run again, or open it in Slice. */
export type OwnAction = 'print' | 'again' | 'slice'

export interface OwnCard {
  /** Unique across shelves: `<shelf>:<id>`. */
  key: string;
  shelf: OwnShelfId;
  /** The Library item, when it is still there (a run of a deleted print has none). */
  item: LibraryItem | null;
  /** The run, on Printed. */
  run: LibraryRun | null;
  title: string;
  /** "PLA", for the glass badge. */
  material: string | null;
  /** "1 h 45 min · 37 g". */
  facts: string;
  /** The right-hand note: "sliced 2 days ago", "on Boxwood", "Public", "Create". */
  note: string;
  action: OwnAction | null;
  /** For sorting by newest: when it was sliced, printed or shared. */
  at: string;
}

/** A share as `GET /v1/community/shares` lists it (sharing_routes.rs). */
export interface OwnShare {
  id: string;
  item: string;
  title: string | null;
  version: number | null;
  audience: string;
  state: string;
  expires_at?: string | null;
  created_at?: string | null;
}

export const OWN_SHELVES: Array<{ id: OwnShelfId, title: string, sub: string }> = [
  { id: 'sliced', title: 'Sliced', sub: 'Ready to print, newest first' },
  { id: 'printed', title: 'Printed', sub: 'What your printers made' },
  { id: 'shared', title: 'Shared by you', sub: 'Your public prints' },
  { id: 'designs', title: 'Designs', sub: 'Made in Create' }
]

function live (item: LibraryItem | null | undefined): item is LibraryItem {
  return !!item && item.state !== 'deleted' && !item.deleted_at
}

function printable (item: LibraryItem): boolean {
  return (item.setups?.length ?? 0) > 0
}

/** A print you sliced: Print on the open printer. */
export function slicedCard (item: LibraryItem, now = Date.now()): OwnCard {
  const setup = item.setups?.[0]
  const ago = agoText(item.updated_at, now)
  return {
    key: `sliced:${item.id}`,
    shelf: 'sliced',
    item,
    run: null,
    title: item.name,
    material: setup?.material || null,
    facts: printFacts(setup),
    note: ago ? `sliced ${ago}` : '',
    action: printable(item) ? 'print' : null,
    at: item.updated_at
  }
}

/** A design from Create: Slice it (it has no G-code until it is sliced). */
export function designCard (item: LibraryItem): OwnCard {
  return {
    key: `designs:${item.id}`,
    shelf: 'designs',
    item,
    run: null,
    title: item.name,
    material: null,
    facts: '',
    note: 'Create',
    action: 'slice',
    at: item.updated_at
  }
}

/** A run: Print again when its print and version are still in the Library. */
export function runCard (run: LibraryRun): OwnCard {
  const item = live(run.item) ? run.item : null
  const again = !!run.item_id && run.in_library && (run.version ?? run.item?.version ?? null) !== null
  return {
    key: `printed:${run.id}`,
    shelf: 'printed',
    item,
    run,
    title: run.item?.name || run.file_name || 'A print',
    material: item?.setups?.[0]?.material || null,
    // Only what went wrong is worth a line: a finished print is the shelf's point.
    facts: run.outcome === 'failed' ? 'Failed' : run.outcome === 'cancelled' ? 'Cancelled' : run.outcome === 'running' ? 'Printing now' : '',
    note: run.printer_name ? `on ${run.printer_name}` : '',
    action: again ? 'again' : null,
    at: run.started_at
  }
}

/** One of your public prints: the item it shares, printed like any other. */
export function sharedCard (share: OwnShare, items: Map<string, LibraryItem>): OwnCard {
  const item = items.get(share.item) ?? null
  const setup = item?.setups?.[0]
  return {
    key: `shared:${share.id}`,
    shelf: 'shared',
    item: live(item) ? item : null,
    run: null,
    title: share.title || item?.name || 'A print',
    material: setup?.material || null,
    facts: printFacts(setup),
    note: 'Public',
    action: item && live(item) && printable(item) ? 'print' : null,
    at: share.created_at || item?.updated_at || ''
  }
}

/** Public, live shares: the prints you published (a link share is not one). */
export function publicShares (value: unknown): OwnShare[] {
  const shares = (value as { shares?: unknown } | null)?.shares
  if (!Array.isArray(shares)) return []
  return shares.filter((s): s is OwnShare =>
    !!s && typeof s === 'object' && typeof (s as OwnShare).id === 'string' && typeof (s as OwnShare).item === 'string' &&
    (s as OwnShare).audience === 'public' && (s as OwnShare).state !== 'revoked' && (s as OwnShare).state !== 'withdrawn')
}

/** Items still in the Library, from a `/v1/items` page. */
export function liveItems (value: unknown): LibraryItem[] {
  const items = (value as { items?: unknown } | null)?.items
  return Array.isArray(items) ? (items as LibraryItem[]).filter(live) : []
}

/** Runs, newest first, one card per print: printing the same thing three times is one card. */
export function printedCards (runs: LibraryRun[]): OwnCard[] {
  const seen = new Set<string>()
  const cards: OwnCard[] = []
  for (const run of [...runs].sort((a, b) => b.started_at.localeCompare(a.started_at))) {
    const id = run.item_id ?? `file:${run.file_name ?? run.id}`
    if (seen.has(id)) continue
    seen.add(id)
    cards.push(runCard(run))
  }
  return cards
}

export type OwnSort = 'new' | 'name'

/** See all: matching the search (title or material), newest first or by name. */
export function findOwn (cards: OwnCard[], query: string, sort: OwnSort): OwnCard[] {
  const q = query.trim().toLowerCase()
  const found = q ? cards.filter(c => c.title.toLowerCase().includes(q) || (c.material ?? '').toLowerCase().includes(q)) : cards
  return [...found].sort(sort === 'name'
    ? (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    : (a, b) => b.at.localeCompare(a.at))
}

/** What a shelf's loader needs from the Library client (store.ts libraryClient()). */
export interface OwnClient {
  sliced: () => Promise<unknown>;
  designs: () => Promise<unknown>;
  runs: (cursor?: string, limit?: number) => Promise<{ runs?: LibraryRun[] }>;
  shares: () => Promise<unknown>;
}

/** One shelf's cards, newest first. `items` resolves a share to its print. */
export async function loadOwnShelf (id: OwnShelfId, client: OwnClient, items: LibraryItem[], now = Date.now()): Promise<OwnCard[]> {
  switch (id) {
    case 'sliced': return findOwn(liveItems(await client.sliced()).map(item => slicedCard(item, now)), '', 'new')
    case 'designs': return findOwn(liveItems(await client.designs()).map(designCard), '', 'new')
    case 'printed': {
      const page = await client.runs('', 100)
      return printedCards(Array.isArray(page.runs) ? page.runs : [])
    }
    case 'shared': {
      const byId = new Map(items.map(item => [item.id, item]))
      return findOwn(publicShares(await client.shares()).map(share => sharedCard(share, byId)), '', 'new')
    }
  }
}
