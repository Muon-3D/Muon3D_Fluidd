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

/** A share as `GET /v1/community/shares` lists it (sharing_routes.rs). Live public: approved and not expired (community/guard.rs). */
export interface OwnShare {
  id: string;
  item: string;
  title: string | null;
  version: number | null;
  audience: string;
  state: string;
  expires_at?: string | null;
  created_at?: string | null;
  /** Why a refused share was not approved. The service does not send one yet (state is pending, approved, active or revoked); read if it ever does. */
  reason?: string | null;
}

export const OWN_SHELVES: Array<{ id: OwnShelfId, title: string, sub: string }> = [
  { id: 'sliced', title: 'Sliced', sub: 'Ready to print, newest first' },
  { id: 'printed', title: 'Printed', sub: 'What your printers made' },
  { id: 'shared', title: 'Shared by you', sub: 'Your public prints, and any waiting for review' },
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
    note: ago ? `${item.origin && item.origin !== 'slice' ? 'saved' : 'sliced'} ${ago}` : '',
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

/** "Public", "Waiting for review", or "Not approved" with the reason when one is sent (text only). */
function shareNote (share: OwnShare): string {
  if (share.state === 'pending') return 'Waiting for review'
  if (share.state === 'rejected') {
    const reason = typeof share.reason === 'string' ? share.reason.trim() : ''
    return reason ? `Not approved: ${reason}` : 'Not approved'
  }
  return 'Public'
}

/** One of your public prints: the item it shares, printed like any other; it opens your own copy, never the public page. */
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
    note: shareNote(share),
    action: item && live(item) && printable(item) ? 'print' : null,
    at: share.created_at || item?.updated_at || ''
  }
}

/** Which public shares show, best first: live, then under review, then refused. */
const SHARE_RANK: Record<string, number> = { approved: 0, pending: 1, rejected: 2 }

/**
 * Your own public shares: live (approved), waiting for review (pending) and
 * refused (rejected), not expired, one per print (a link share is not one;
 * withdrawn ones are gone). Per print the best state wins, newest within it.
 * Order is the service's, newest first.
 */
export function ownPublicShares (value: unknown, now = Date.now()): OwnShare[] {
  const shares = (value as { shares?: unknown } | null)?.shares
  if (!Array.isArray(shares)) return []
  const best = new Map<string, OwnShare>()
  for (const s of shares) {
    const share = s as OwnShare | null
    if (!share || typeof share !== 'object' || typeof share.id !== 'string' || typeof share.item !== 'string') continue
    if (share.audience !== 'public' || !(share.state in SHARE_RANK)) continue
    if (share.expires_at && !(Date.parse(share.expires_at) > now)) continue
    const held = best.get(share.item)
    if (!held || SHARE_RANK[share.state] < SHARE_RANK[held.state] ||
      (SHARE_RANK[share.state] === SHARE_RANK[held.state] && time(share.created_at ?? '') > time(held.created_at ?? ''))) best.set(share.item, share)
  }
  return shares.filter((s): s is OwnShare => best.get((s as OwnShare)?.item) === s)
}

/**
 * Your prints from the synced Library (store.ts, every item, kept current):
 * Sliced is everything that is not a design (slices, uploads, imports, the
 * phone app's models); Designs is what Create made.
 */
export function itemShelf (id: 'sliced' | 'designs', items: LibraryItem[], now = Date.now()): OwnCard[] {
  const mine = items.filter(live)
  const cards = id === 'designs'
    ? mine.filter(item => item.origin === 'design').map(designCard)
    : mine.filter(item => item.origin !== 'design').map(item => slicedCard(item, now))
  return findOwn(cards, '', 'new')
}

/** Runs, newest first, one card per print: printing the same thing three times is one card. */
export function printedCards (runs: LibraryRun[]): OwnCard[] {
  const seen = new Set<string>()
  const cards: OwnCard[] = []
  for (const run of [...runs].sort((a, b) => time(b.started_at) - time(a.started_at))) {
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
    : (a, b) => time(b.at) - time(a.at))
}

/** An ISO time as a number for sorting; unknown sorts last. */
function time (iso: string): number {
  const at = Date.parse(iso)
  return Number.isFinite(at) ? at : 0
}

/** What a shelf's loader needs from the Library client (store.ts libraryClient()). */
export interface OwnClient {
  runs: (cursor?: string, limit?: number) => Promise<{ runs?: LibraryRun[], cursor?: string | null }>;
  shares: () => Promise<unknown>;
}

/** How many pages of runs See all follows (100 each). */
const RUN_PAGES = 10

/**
 * Printed or Shared by you, read from the service. `all` (See all) follows
 * Printed's cursor; a shelf reads one page. `items` resolves a share to its print.
 */
export async function loadOwnShelf (id: 'printed' | 'shared', client: OwnClient, items: LibraryItem[], all = false): Promise<OwnCard[]> {
  if (id === 'shared') {
    const byId = new Map(items.map(item => [item.id, item]))
    return findOwn(ownPublicShares(await client.shares()).map(share => sharedCard(share, byId)), '', 'new')
  }
  const runs: LibraryRun[] = []
  let cursor = ''
  for (let page = 0; page < (all ? RUN_PAGES : 1); page++) {
    const answer = await client.runs(cursor, 100)
    runs.push(...(Array.isArray(answer.runs) ? answer.runs : []))
    if (!answer.cursor) break
    cursor = answer.cursor
  }
  return printedCards(runs)
}
