/**
 * The Library's shelves and feed (Library v2, 5 Nov 2026): what MuonLibrary
 * draws, from the model service's public routes (src/public_v2.rs). All of
 * it is public: no account, no assertion.
 *
 * - Popular this week: `GET /v1/public/publications?sort=trending` (makes,
 *   prints, saves and downloads over 7 days, decayed);
 * - Made for M1: publications tagged `m1-ready`, else the catalogue's
 *   M1-tested prints from `GET /v1/public/discover`;
 * - From the community: the newest publications, a remix said as one.
 *
 * A publication is printed from its card through its G-code, if it has one
 * (publicationPrint), with the size and SHA-256 its publication lists.
 */
import { MODELS_URL, type PublicPublication, type ItemSetup } from './api'
import { LIBRARY_URL, loadDiscover, safePicture, type DiscoverCatalogue } from './discover'
import type { StoredFileFacts } from './print-on'

export interface ShelfCard {
  /** 'pub:<id>' or 'cat:<slug>': unique across shelves and kinds. */
  key: string;
  kind: 'publication' | 'catalogue';
  /** The publication's id, or the catalogue item's slug. */
  id: string;
  slug: string;
  title: string;
  picture: string | null;
  creator: string;
  handle: string | null;
  makes: number;
  remixes: number;
  /** How many people saved it (the heart); 0 from a service that doesn't say. */
  saves: number;
  /** "2 h 5 min · 98 g · PLA", when known. */
  facts: string;
  /** Made for M1: tagged m1-ready, or a catalogue print Muon3D tested on one. */
  m1: boolean;
  tags: string[];
  remixOf: { id: string, slug: string, title: string } | null;
  /** A make: the public print it was made from (model service KAN-1594). */
  makeOf: { id: string, slug: string, title: string } | null;
  createdAt: string | null;
  /** Its page on library.muon3d.com. */
  href: string;
}

/** A publication summary as `GET /v1/public/publications` answers it. */
export interface PublicationSummary {
  id: string;
  slug: string;
  title: string;
  category?: string;
  tags?: string[];
  creator: { handle: string | null, display_name: string | null };
  created_at: string;
  make_count?: number;
  remix_count?: number;
  save_count?: number;
  remix_of?: { id: string, slug: string, title: string } | null;
  make_of?: { id: string, slug: string, title: string } | null;
  thumbnail_url?: string | null;
}

export interface PublicationsPage {
  items: PublicationSummary[];
  next_cursor: string | null;
}

const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0

export function isSummary (item: unknown): item is PublicationSummary {
  const value = item as PublicationSummary | null
  return !!value && text(value.id) && text(value.slug) && text(value.title) &&
    typeof value.creator === 'object' && value.creator !== null
}

export function minutesText (seconds: number): string {
  const total = Math.max(1, Math.round(seconds / 60))
  if (total < 60) return `${total} min`
  return total % 60 ? `${Math.floor(total / 60)} h ${total % 60} min` : `${Math.floor(total / 60)} h`
}

export function creatorName (creator: PublicationSummary['creator']): string {
  return creator.display_name || (creator.handle ? `@${creator.handle}` : 'Muon3D maker')
}

export function summaryCard (item: PublicationSummary): ShelfCard {
  const tags = Array.isArray(item.tags) ? item.tags.filter(text) : []
  return {
    key: `pub:${item.id}`,
    kind: 'publication',
    id: item.id,
    slug: item.slug,
    title: item.title,
    picture: safePicture(item.thumbnail_url),
    creator: creatorName(item.creator),
    handle: item.creator.handle,
    makes: item.make_count ?? 0,
    remixes: item.remix_count ?? 0,
    saves: item.save_count ?? 0,
    facts: '',
    m1: tags.includes('m1-ready'),
    tags,
    remixOf: item.remix_of ?? null,
    makeOf: item.make_of ?? null,
    createdAt: item.created_at ?? null,
    href: `${LIBRARY_URL}/p/${encodeURIComponent(item.slug)}`
  }
}

export function catalogueShelfCard (item: DiscoverCatalogue): ShelfCard {
  const facts = [
    item.print_time_s ? minutesText(item.print_time_s) : '',
    item.filament_g ? `${Math.round(item.filament_g)} g` : '',
    item.material ?? ''
  ].filter(Boolean).join(' · ')
  return {
    key: `cat:${item.slug}`,
    kind: 'catalogue',
    id: item.slug,
    slug: item.slug,
    title: item.title,
    picture: safePicture(item.thumbnail_url),
    creator: item.author,
    handle: null,
    makes: 0,
    remixes: 0,
    saves: 0,
    facts,
    m1: true,
    tags: [],
    remixOf: null,
    makeOf: null,
    createdAt: null,
    // A catalogue entry is not a publication: `/p/` would not find it.
    href: `${LIBRARY_URL}/search?q=${encodeURIComponent(item.title)}&sources=muon3d`
  }
}

/** Once each, in order. */
export function unique (cards: ShelfCard[]): ShelfCard[] {
  return cards.filter((card, index) => cards.findIndex(other => other.key === card.key) === index)
}

export async function loadPublications (
  query: { sort?: 'new' | 'popular' | 'trending', tag?: string, cursor?: string | null, limit?: number },
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal
): Promise<PublicationsPage> {
  const params = new URLSearchParams()
  params.set('sort', query.sort ?? 'new')
  if (query.tag) params.set('tag', query.tag)
  if (query.cursor) params.set('cursor', query.cursor)
  params.set('limit', String(query.limit ?? 12))
  const response = await fetcher(`${MODELS_URL}/v1/public/publications?${params}`, { method: 'GET', credentials: 'omit', signal })
  if (!response.ok) throw new Error(response.status === 404 ? 'The Library isn\'t open yet.' : 'The Library didn\'t answer. Try again.')
  const body = await response.json().catch(() => null) as Partial<PublicationsPage> | null
  if (!body || !Array.isArray(body.items)) throw new Error('The Library sent an answer this version of Control can\'t read.')
  return { items: body.items.filter(isSummary), next_cursor: text(body.next_cursor) ? body.next_cursor : null }
}

export interface DiscoverShelves {
  popular: ShelfCard[];
  m1: ShelfCard[];
}

/**
 * Popular this week and Made for M1. One shelf failing doesn't empty the
 * other; both failing is an error the page shows with Try again.
 */
export async function loadShelves (fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<DiscoverShelves> {
  const [trending, tagged, discover] = await Promise.allSettled([
    loadPublications({ sort: 'trending', limit: 12 }, fetcher, signal),
    loadPublications({ sort: 'trending', tag: 'm1-ready', limit: 12 }, fetcher, signal),
    loadDiscover(fetcher, signal)
  ])
  if (trending.status === 'rejected' && discover.status === 'rejected') throw trending.reason
  const feed = discover.status === 'fulfilled' ? discover.value : null
  const popular = trending.status === 'fulfilled' && trending.value.items.length
    ? trending.value.items.map(summaryCard)
    : (feed?.trending ?? []).filter(isSummary).map(summaryCard)
  const m1 = [
    ...(tagged.status === 'fulfilled' ? tagged.value.items.map(summaryCard).map(card => ({ ...card, m1: true })) : []),
    ...(feed?.m1_ready ?? []).filter(item => !!item && text(item.slug) && text(item.title)).map(catalogueShelfCard)
  ]
  return { popular: unique(popular), m1: unique(m1).slice(0, 12) }
}

export interface FeedPost {
  key: string;
  card: ShelfCard;
  verb: 'made' | 'shared' | 'remixed';
}

export interface FeedPageOut {
  posts: FeedPost[];
  cursor: string | null;
}

/** The newest publications as posts: "Okoro shared Spiral vase", "Ines made Pocket robot". */
export async function loadFeedPage (cursor: string | null, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<FeedPageOut> {
  const page = await loadPublications({ sort: 'new', cursor, limit: 12 }, fetcher, signal)
  return {
    posts: page.items.map(summaryCard).map(card => ({ key: card.key, card, verb: card.makeOf ? 'made' : card.remixOf ? 'remixed' : 'shared' })),
    cursor: page.next_cursor
  }
}

/** "12 min", "3 h", "yesterday", "4 Nov": how long ago, for a post. */
export function ago (iso: string | null, now = Date.now()): string {
  if (!iso) return ''
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''
  const minutes = Math.max(0, Math.round((now - then) / 60000))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h`
  if (hours < 48) return 'yesterday'
  return new Date(then).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/** What Print on… needs for a public print: an item, its G-codes as setups, and the facts to check them against. */
export interface PublicationPrint {
  item: { id: string, name: string, version: number, setups: ItemSetup[], shared: { expected: Record<string, StoredFileFacts> } };
}

/**
 * A publication as Print on… takes it, or null when it has no G-code with
 * a setup and a checksum (it is sliced first, on its page). Every G-code
 * is a setup, so Print on… picks the one that fits each printer; the bytes
 * are checked against that file's listed size and SHA-256 before anything
 * is sent (downloadSharedGcode).
 */
export function publicationPrint (publication: PublicPublication, id: string): PublicationPrint | null {
  const files = publication.files.filter(file => file.role === 'gcode' && !!file.setup && text(file.sha256))
  if (!files.length) return null
  return {
    item: {
      id,
      name: publication.title,
      version: publication.version,
      setups: files.map(file => ({ ...(file.setup as NonNullable<typeof file.setup>), file_id: file.id, print_seconds: file.print_seconds ?? null, filament_g: file.filament_g ?? null })),
      shared: { expected: Object.fromEntries(files.map(file => [file.id, { sha256: file.sha256, size_bytes: file.size_bytes, encoding: file.encoding }])) }
    }
  }
}

/** The facts line for a publication with a G-code. */
export function publicationFacts (publication: PublicPublication): string {
  const file = publication.files.find(f => f.role === 'gcode' && !!f.setup)
  if (!file?.setup) return ''
  return [
    file.print_seconds ? minutesText(file.print_seconds) : '',
    file.filament_g ? `${Math.round(file.filament_g)} g` : '',
    file.setup.material
  ].filter(Boolean).join(' · ')
}

/** One publication, as `GET /v1/public/publications/:id` answers it (no account needed). */
export async function loadPublication (id: string, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<PublicPublication> {
  const response = await fetcher(`${MODELS_URL}/v1/public/publications/${encodeURIComponent(id)}`, { method: 'GET', credentials: 'omit', signal })
  if (!response.ok) throw new Error(response.status === 404 ? 'That print is no longer public.' : 'The Library didn\'t answer. Try again.')
  const body = await response.json().catch(() => null) as PublicPublication | null
  if (!body || typeof body.title !== 'string' || typeof body.version !== 'number' || !Array.isArray(body.files)) {
    throw new Error('The Library sent an answer this version of Control can\'t read.')
  }
  return body
}
