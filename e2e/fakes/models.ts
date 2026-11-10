/**
 * A fake model service (models.muon3d.com) for e2e tests: the public Library
 * (publications, discover, a print's page and pictures) and the signed-in
 * one (your Library feed, saves, collections), held in memory per test.
 * Shapes follow muon3d-model-service src/public_v2.rs, src/saves.rs and the
 * Library routes; extend it as pages need more.
 */
import type { Page, Route } from '@playwright/test'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'

/** The G-code every fake print serves: gzip-stored like the Library's, with its real size and hash. */
export const GCODE_TEXT = '; e2e print\nG28\nG1 X10 Y10 E1\n'
const GCODE_STORED = gzipSync(Buffer.from(GCODE_TEXT))
const GCODE_SHA256 = createHash('sha256').update(GCODE_STORED).digest('hex')

export const MODELS = 'https://models.muon3d.com'

/** A one-pixel PNG: the photo the fake serves back. */
export const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

export interface FakePublication {
  id: string;
  slug: string;
  title: string;
  creator: { handle: string | null, display_name: string | null };
  tags: string[];
  make_count: number;
  remix_count: number;
  save_count: number;
  created_at: string;
  category: string;
  colour: string;
  /** A G-code sliced for the M1 that Print on… can send. */
  gcode: boolean;
  /** The colours its pictures show it in (#rrggbb), as publishing sets them. */
  colours: string[];
  make_of?: string | null;
  remix_of?: string | null;
}

const COLOURS = ['#4fb3ad', '#e0675b', '#8a979f', '#f4f6f7', '#d9a13e', '#58b97f', '#8f79d6', '#5b93d6']

/** A plain picture for a print: a coloured block, so cards have something to show. */
export function picture (colour: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#22282c"/><rect x="120" y="70" width="160" height="160" rx="24" fill="${colour}"/></svg>`
}

export function publication (n: number, over: Partial<FakePublication> = {}): FakePublication {
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
    slug: `print-${n}`,
    title: `Print ${n}`,
    creator: { handle: `maker${n % 4}`, display_name: `Maker ${n % 4}` },
    tags: n % 2 ? ['m1-ready'] : [],
    make_count: 10 * n,
    remix_count: n % 3,
    save_count: 5 * n,
    created_at: new Date(Date.UTC(2026, 10, 5, 12) - n * 3_600_000).toISOString(),
    category: ['home', 'workshop', 'tools', 'art'][n % 4],
    colour: COLOURS[n % COLOURS.length],
    gcode: true,
    colours: [COLOURS[n % COLOURS.length], COLOURS[(n + 3) % COLOURS.length]],
    ...over
  }
}

export interface FakeSave { id: string, target: string }
export interface FakeCollection { id: string, name: string, items: string[], visibility?: 'private' | 'public' }

/** One of your own prints in the Library (`GET /v1/items`), as the service sends it. */
export interface FakeItem {
  id: string;
  name: string;
  origin: 'slice' | 'design' | 'upload';
  updated_at: string;
  material: string;
  /** False for a design (no G-code until it is sliced). */
  gcode: boolean;
}

/** A run your printers reported (`GET /v1/library/runs`). */
export interface FakeRun { id: string, item: string | null, printer: string, started_at: string, outcome: string }

/** A share of one of your items (`GET /v1/community/shares`); public ones are your published prints. */
export interface FakeShare { id: string, item: string, title: string, audience: 'public' | 'link' }

/** An own print: sliced for an M1 in PETG unless said otherwise. */
export function ownItem (id: string, over: Partial<FakeItem> = {}): FakeItem {
  return { id, name: `Mine ${id}`, origin: 'slice', updated_at: '2026-11-05T10:00:00Z', material: 'PETG', gcode: true, ...over }
}

export function itemJson (i: FakeItem) {
  return {
    id: i.id,
    kind: 'plate',
    format: '3mf',
    name: i.name,
    size_bytes: 1000,
    has_thumbnail: false,
    state: 'ready',
    rev: 1,
    created_at: i.updated_at,
    updated_at: i.updated_at,
    deleted_at: null,
    versioned: true,
    version: 3,
    versions: 3,
    origin: i.origin,
    setups: i.gcode ? [{ printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: i.material, print_seconds: 3600, filament_g: 20, file_id: `${i.id}-g` }] : []
  }
}

/** Your community profile as `GET /v1/community/profile` answers it (muon3d-model-service community/store.rs). */
export interface FakeCommunity {
  handle: string | null;
  /** RFC 3339: when the handle last changed (the 30-day limit). */
  handle_changed_at: string | null;
  public_name: string | null;
  identity_public: boolean;
  can_community: boolean;
  can_public: boolean;
  page_on: boolean;
  bio: string | null;
  avatar_url: string | null;
  links: string[];
  indexable: boolean;
  /** Handles other people hold: `GET /v1/community/handles/:h` says taken, reserved or held. */
  handles: Record<string, 'taken' | 'reserved' | 'held'>;
}

export function fakeCommunity (over: Partial<FakeCommunity> = {}): FakeCommunity {
  return {
    handle: 'jack',
    handle_changed_at: null,
    public_name: 'Jack',
    identity_public: false,
    can_community: true,
    can_public: true,
    page_on: true,
    bio: null,
    avatar_url: null,
    links: [],
    indexable: false,
    handles: { taken: 'taken', muon3d: 'reserved' },
    ...over
  }
}

export interface ModelServiceState {
  publications: FakePublication[];
  saves: FakeSave[];
  collections: FakeCollection[];
  /** Your own Library: items, runs and shares (Yours). */
  items: FakeItem[];
  runs: FakeRun[];
  shares: FakeShare[];
  /** Your Library turned off (consented before, withdrawn), so Control does not turn it on for you; 'deleting' with a deletion date. */
  libraryOff: boolean | 'deleting';
  /** The Library's storage, as the service sends it on `GET /v1/library`; none by default. */
  storage: { used_bytes: number, quota_bytes: number, used_by_kind?: Record<string, number> } | null;
  /** Your public profile (Share a print needs one): set up, or not yet (403 community_setup_required). */
  profile: 'ready' | 'none' | 'page-off';
  /** The editable community profile (Account › Profile); null leaves the older `profile` answers above. */
  community: FakeCommunity | null;
  /** The bytes of the photo last uploaded, and its content type. */
  avatar: { type: string, bytes: number, body: string } | null;
  /** What the community profile routes were sent (writes): JSON bodies as parsed. */
  communityWrites: Array<{ call: string, body: unknown }>;
  /** The service cannot read the next photo (avatar_invalid). */
  avatarInvalid: boolean;
  /** What Publish sent, in order (`POST /v1/items/:id/publish` bodies). */
  published: Array<{ item: string, body: Record<string, unknown> }>;
  /** Answer every request with this status (outage tests), or null. */
  failWith: number | null;
  /** Answer matching requests with a status instead ("GET /v1/public/discover"): one shelf down. */
  failOn: (request: string) => number | null;
  /** Hold every answer this long (loading states). */
  delayMs: number;
  /** Answer search with 404, as a model service from before search did. */
  noSearch: boolean;
  /** Requests seen, for assertions ("method path"). */
  seen: string[];
  /**
   * The origins let in, exactly, as MODELS_CORS_ORIGINS does on the real
   * service; any other origin gets no CORS headers, so the browser refuses
   * the answer. null lets every origin in.
   */
  corsOrigins: string[] | null;
}

export function modelService (over: Partial<ModelServiceState> = {}): ModelServiceState {
  return {
    publications: Array.from({ length: 12 }, (_, i) => publication(i + 1)),
    saves: [],
    collections: [],
    items: [],
    runs: [],
    shares: [],
    libraryOff: false,
    storage: null,
    profile: 'ready',
    community: null,
    avatar: null,
    communityWrites: [],
    avatarInvalid: false,
    corsOrigins: null,
    published: [],
    failWith: null,
    failOn: () => null,
    delayMs: 0,
    noSearch: false,
    seen: [],
    ...over
  }
}

function summary (p: FakePublication, all: FakePublication[]) {
  const parent = (id?: string | null) => {
    const found = id ? all.find(q => q.id === id) : null
    return found ? { id: found.id, slug: found.slug, title: found.title } : null
  }
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    tags: p.tags,
    ai_generated: 'no',
    creator: p.creator,
    created_at: p.created_at,
    score: p.make_count,
    make_count: p.make_count,
    remix_count: p.remix_count,
    save_count: p.save_count,
    colours: p.colours,
    material: p.gcode ? 'PLA' : null,
    size_mm: null,
    make_of: parent(p.make_of),
    remix_of: parent(p.remix_of),
    thumbnail_url: `${MODELS}/v1/public/publications/${p.id}/images/thumb`
  }
}

function detail (p: FakePublication, all: FakePublication[]) {
  const s = summary(p, all)
  return {
    ...s,
    share_id: p.id,
    version: 1,
    description: `${p.title}, sliced for the M1.`,
    licence: 'CC-BY-4.0',
    counts: { makes: p.make_count, remixes: p.remix_count, saves: p.save_count, comments: 0 },
    images: [{ id: 'thumb', name: 'Image 1', format: 'svg', size_bytes: 1, url: s.thumbnail_url }],
    files: p.gcode
      ? [{ id: `${p.id}-g`, name: 'gcode.gcode', role: 'gcode', format: 'gcode', encoding: 'gzip', size_bytes: GCODE_STORED.length, sha256: GCODE_SHA256, setup: { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA' } }]
      : [],
    remix_of: s.remix_of
  }
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) })

/** Serve `state` as models.muon3d.com for this page. */
export async function serveModels (page: Page, state: ModelServiceState) {
  await page.route(`${MODELS}/**`, async route => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname
    const method = request.method()
    state.seen.push(`${method} ${path}${url.search}`)
    const origin = request.headers().origin
    // Playwright's fulfill skips the browser's CORS check, so a refused origin is the TypeError fetch would give.
    if (state.corsOrigins && origin && !state.corsOrigins.includes(origin)) return route.abort('accessdenied')
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key', 'access-control-allow-methods': '*' } })
    if (state.delayMs) await new Promise(resolve => setTimeout(resolve, state.delayMs))
    const failure = state.failWith ?? state.failOn(`${method} ${path}${url.search}`)
    if (failure) return json(route, { error: { code: 'unavailable', message: 'Down for a moment.' } }, failure)
    const all = state.publications

    const image = path.match(/^\/v1\/public\/publications\/([^/]+)\/images\//)
    if (image) {
      const p = all.find(q => q.id === image[1])
      return route.fulfill({ status: p ? 200 : 404, contentType: 'image/svg+xml', body: picture(p?.colour ?? '#444') })
    }
    if (path === '/v1/public/discover') {
      const trending = [...all].sort((a, b) => b.make_count - a.make_count).slice(0, 12).map(p => summary(p, all))
      return json(route, { featured: [], m1_ready: [], trending, new: all.slice(0, 12).map(p => summary(p, all)), news: [] })
    }
    if (path === '/v1/public/publications') {
      const sort = url.searchParams.get('sort') ?? 'new'
      const tag = url.searchParams.get('tag')
      const limit = Number(url.searchParams.get('limit') ?? 24)
      let list = tag ? all.filter(p => p.tags.includes(tag)) : [...all]
      if (sort !== 'new') list.sort((a, b) => b.make_count - a.make_count)
      const cursor = url.searchParams.get('cursor')
      const start = !cursor ? 0 : cursor.startsWith('o:') ? Number(cursor.slice(2)) : list.findIndex(p => p.id === cursor) + 1
      list = list.slice(start)
      const page = list.slice(0, limit)
      const more = list.length > limit
      const next = !more ? null : sort === 'new' ? page[page.length - 1].id : `o:${start + limit}`
      return json(route, { items: page.map(p => summary(p, all)), next_cursor: next })
    }
    const related = path.match(/^\/v1\/public\/publications\/([^/]+)\/(makes|remixes)$/)
    if (related) {
      const field = related[2] === 'makes' ? 'make_of' : 'remix_of'
      const items = all.filter(p => p[field] === related[1]).map(p => summary(p, all))
      return json(route, { items: items.slice(0, Number(url.searchParams.get('limit') ?? 12)), next_cursor: null })
    }
    if (path === '/v1/public/search') {
      if (state.noSearch) return json(route, { error: { code: 'not_found' } }, 404)
      const q = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      if (q.length < 2 || q.length > 64) return json(route, { error: { code: 'query', message: 'Search for 2 to 64 characters.' } }, 400)
      const found = all.filter(p => [p.title, p.creator.handle ?? '', p.creator.display_name ?? '', ...p.tags].join(' ').toLowerCase().includes(q))
      const start = Number((url.searchParams.get('cursor') ?? 'o:0').slice(2)) || 0
      const limit = Number(url.searchParams.get('limit') ?? 24)
      const page = found.slice(start, start + limit)
      return json(route, { items: page.map(p => summary(p, all)), next_cursor: found.length > start + limit ? `o:${start + limit}` : null })
    }
    const one = path.match(/^\/v1\/public\/publications\/([^/]+)$/)
    if (one) {
      const p = all.find(q => q.id === one[1] || q.slug === one[1])
      return p ? json(route, detail(p, all)) : json(route, { error: { code: 'not_found' } }, 404)
    }

    // Signed in: the assertion the console handed out must come with it.
    if (!request.headers().authorization) return json(route, { error: { code: 'unauthorized' } }, 401)
    const share = path.match(/^\/v1\/shares\/([^/]+)\/files\/([^/]+)$/)
    if (share && method === 'POST') {
      const p = all.find(q => q.id === share[1])
      if (!p || share[2] !== `${p.id}-g`) return json(route, { error: { code: 'not_found' } }, 404)
      return route.fulfill({ status: 200, contentType: 'application/octet-stream', headers: { 'access-control-allow-origin': '*' }, body: GCODE_STORED })
    }
    if (path === '/v1/library') {
      // Off: the promise is the one this Control shows (src/services/library/promise.ts), so it may offer to turn it on.
      if (state.libraryOff) return json(route, { enabled: false, account: { promise_version: '2026-09-26', consented_at: '2026-10-02T00:00:00Z', ...(state.libraryOff === 'deleting' ? { purge_after: '2026-11-27T00:00:00Z' } : {}) }, promise: { version: '2026-09-26' }, promise_version: '2026-09-26', storage: { used_bytes: 0, quota_bytes: 2e9 } })
      return json(route, { enabled: true, account: { promise_version: '2026-10-01' }, promise: { version: '2026-10-01' }, storage: { used_bytes: 0, quota_bytes: 2e9 }, ...(state.storage ?? {}) })
    }
    const own = path.match(/^\/v1\/items\/([^/]+)(\/versions)?$/)
    if (own && !own[2] && method === 'DELETE') {
      const it = state.items.find(i => i.id === own[1])
      if (!it) return json(route, { error: { code: 'not_found' } }, 404)
      state.items = state.items.filter(i => i !== it)
      return json(route, { ...itemJson(it), state: 'deleted', deleted_at: new Date().toISOString() })
    }
    if (own && method === 'GET') {
      const it = state.items.find(i => i.id === own[1])
      if (!it) return json(route, { error: { code: 'not_found', message: 'No such print.' } }, 404)
      if (!own[2]) return json(route, itemJson(it))
      // Its versions, newest first: the current one and two older (the last 10 are kept).
      const versions = [1, 2, 3].map(n => ({
        number: n,
        origin: 'slice',
        state: 'ready',
        created_at: new Date(Date.parse(it.updated_at) - (3 - n) * 86_400_000).toISOString(),
        summary: null,
        files: [{ id: `${it.id}-g${n}`, role: 'gcode', format: 'gcode', encoding: 'gzip', size_bytes: 1, sha256: 'x', setup: { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: n === 3 ? it.material : 'PLA' } }]
      })).reverse()
      return json(route, { versions })
    }
    if (path === '/v1/items') {
      const origin = url.searchParams.get('origin')
      const items = state.items.filter(i => !origin || i.origin === origin).map(itemJson)
      return json(route, { items, rev: 1, more: false, reset: true })
    }
    if (path === '/v1/library/sections') return json(route, { all: state.items.length, printed: state.runs.length, sliced: state.items.filter(i => i.origin === 'slice').length, saved: state.saves.length })
    if (path === '/v1/library/preferences') return json(route, { autosave: true, ask: false, save_from_print_check: true, updated_at: null })
    if (path === '/v1/library/runs') {
      const runs = state.runs.map(r => {
        const it = state.items.find(i => i.id === r.item)
        return {
          id: r.id,
          item_id: it ? it.id : null,
          version: it ? 1 : null,
          printer_id: 'p1',
          printer_name: r.printer,
          file_name: it ? `${it.name}.gcode` : 'loose.gcode',
          started_at: r.started_at,
          ended_at: null,
          outcome: r.outcome,
          progress_pct: null,
          duration_s: null,
          in_library: !!it,
          item: it ? itemJson(it) : null
        }
      })
      return json(route, { runs, cursor: null })
    }
    const c = state.community
    if (c && path.startsWith('/v1/community/') && (path === '/v1/community/profile' || path.startsWith('/v1/community/profile/') || path.startsWith('/v1/community/handles/'))) {
      if (method === 'PUT' && path !== '/v1/community/profile/avatar') state.communityWrites.push({ call: `${method} ${path}`, body: request.postDataJSON() })
      const fail = (status: number, code: string, message: string) => json(route, { error: { code, message } }, status)
      if (path === '/v1/community/profile' && method === 'GET') return json(route, c)
      if (path === '/v1/community/profile' && method === 'PUT') {
        const body = request.postDataJSON() as { bio?: string | null, page_on?: boolean }
        if (body.bio !== undefined) c.bio = body.bio
        if (body.page_on !== undefined) c.page_on = body.page_on
        return json(route, c)
      }
      const asked = path.match(/^\/v1\/community\/handles\/([^/]+)$/)
      if (asked && method === 'GET') return json(route, { handle: asked[1], status: c.handles[asked[1].toLowerCase()] ?? 'available' })
      if (path === '/v1/community/profile/handle' && method === 'PUT') {
        const { handle } = request.postDataJSON() as { handle: string }
        if (c.handle_changed_at && Date.now() - Date.parse(c.handle_changed_at) < 30 * 86_400_000) return fail(429, 'handle_cooldown', 'A handle can change once every 30 days.')
        const status = c.handles[handle.toLowerCase()]
        if (status) return fail(409, `handle_${status}`, 'This handle is not available.')
        c.handle = handle
        c.handle_changed_at = new Date().toISOString()
        return json(route, c)
      }
      if (path === '/v1/community/profile/avatar') {
        if (method === 'PUT') {
          const type = request.headers()['content-type'] ?? ''
          const bytes = request.postDataBuffer()?.length ?? 0
          // As the service refuses: raw JPEG, PNG or WebP only, at most 4 MiB.
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(type)) return fail(400, 'avatar_format', 'Choose JPEG, PNG or WebP.')
          if (bytes > 4 * 1024 * 1024) return fail(400, 'avatar_too_large', 'Choose a photo of at most 4 MiB.')
          if (state.avatarInvalid) return fail(400, 'avatar_invalid', 'The profile photo could not be read.')
          state.avatar = { type, bytes, body: (request.postDataBuffer() ?? Buffer.alloc(0)).toString('base64') }
          c.avatar_url = `${MODELS}/v1/public/avatars/00000000-0000-4000-8000-000000000001`
          return json(route, c)
        }
        if (method === 'GET') return c.avatar_url || state.avatar ? route.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: Buffer.from(PNG_1X1, 'base64') }) : json(route, { error: { code: 'not_found', message: 'No photo.' } }, 404)
      }
    }
    if (path === '/v1/community/profile' && method === 'GET') {
      // As the service answers: 200, with no handle yet, or the page off.
      if (state.profile === 'none') return json(route, { handle: null, public_name: null, identity_public: false, can_community: true, can_public: true, page_on: false, bio: null })
      return json(route, { handle: 'jack', public_name: 'Jack', identity_public: true, can_community: true, can_public: true, page_on: state.profile !== 'page-off', bio: null })
    }
    const publish = path.match(/^\/v1\/items\/([^/]+)\/publish$/)
    if (publish && method === 'POST') {
      if (state.profile === 'none') return json(route, { error: { code: 'community_setup_required', message: 'Set up your public profile first.' } }, 403)
      const it = state.items.find(i => i.id === publish[1])
      if (!it) return json(route, { error: { code: 'not_found' } }, 404)
      const body = request.postDataJSON() as Record<string, unknown>
      state.published.push({ item: it.id, body })
      const id = `share-${state.shares.length + 1}`
      state.shares.push({ id, item: it.id, title: String(body.title), audience: 'public' })
      return json(route, { id, key: 'k', state: 'pending', audience: 'public', title: body.title, version: body.version }, 201)
    }
    if (path === '/v1/community/shares' && method === 'GET') {
      return json(route, { shares: state.shares.map(sh => ({ id: sh.id, item: sh.item, title: sh.title, version: 1, audience: sh.audience, state: 'approved', expires_at: '2099-01-01T00:00:00Z' })) })
    }
    if (path === '/v1/community/saves' && method === 'GET') {
      return json(route, { saves: state.saves.map(s => saveJson(s, all)), next_cursor: null })
    }
    if (path === '/v1/community/saves' && method === 'PUT') {
      const body = request.postDataJSON() as { id: string }
      let save = state.saves.find(s => s.target === body.id)
      if (!save) state.saves.push(save = { id: `save-${state.saves.length + 1}`, target: body.id })
      return json(route, saveJson(save, all))
    }
    const unsave = path.match(/^\/v1\/community\/saves\/([^/]+)$/)
    if (unsave && method === 'DELETE') {
      state.saves = state.saves.filter(s => s.id !== unsave[1])
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    }
    if (path === '/v1/community/saves/lookup') {
      const targets = JSON.parse(url.searchParams.get('targets') ?? '[]') as Array<{ id: string }>
      return json(route, { saves: state.saves.filter(s => targets.some(t => t.id === s.target)).map(s => ({ target: { kind: 'publication', id: s.target }, save_id: s.id })) })
    }
    if (path === '/v1/community/collections' && method === 'GET') return json(route, { collections: state.collections.map(collectionJson) })
    if (path === '/v1/community/collections' && method === 'POST') {
      const body = request.postDataJSON() as { name: string }
      const made = { id: `col-${state.collections.length + 1}`, name: body.name, items: [] }
      state.collections.unshift(made)
      return json(route, collectionJson(made), 201)
    }
    const col = path.match(/^\/v1\/community\/collections\/([^/]+)(?:\/items\/([^/]+))?$/)
    const reorder = path.match(/^\/v1\/community\/collections\/([^/]+)\/reorder$/)
    if (reorder && method === 'POST') {
      const c = state.collections.find(x => x.id === reorder[1])
      if (!c) return json(route, { error: { code: 'not_found' } }, 404)
      const ids = (request.postDataJSON() as { save_ids: string[] }).save_ids
      // The service takes only the same set, each once (saves.rs reorder).
      if (ids.length !== c.items.length || new Set(ids).size !== ids.length || ids.some(id => !c.items.includes(id))) return json(route, { error: { code: 'invalid_order', message: 'That is not this collection.' } }, 400)
      c.items = [...ids]
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
    }
    if (col) {
      const c = state.collections.find(x => x.id === col[1])
      if (!c) return json(route, { error: { code: 'not_found' } }, 404)
      if (col[2] && method === 'PUT') {
        if (!c.items.includes(col[2])) c.items.push(col[2])
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
      }
      if (col[2] && method === 'DELETE') {
        c.items = c.items.filter(id => id !== col[2])
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
      }
      if (!col[2] && method === 'PATCH') {
        const body = request.postDataJSON() as { name?: string, visibility?: 'private' | 'public' }
        if (body.name !== undefined) c.name = body.name
        if (body.visibility !== undefined) c.visibility = body.visibility
        return json(route, collectionJson(c))
      }
      if (!col[2] && method === 'DELETE') {
        state.collections = state.collections.filter(x => x !== c)
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } })
      }
      return json(route, { ...collectionJson(c), items: c.items.map(id => state.saves.find(s => s.id === id)).filter(Boolean).map(s => { const j = saveJson(s as FakeSave, all); return { save_id: j.id, target: j.target, card: j.card } }) })
    }
    return json(route, { error: { code: 'not_found', message: `e2e fake has no ${method} ${path}` } }, 404)
  })
}

function saveJson (s: FakeSave, all: FakePublication[]) {
  const p = all.find(q => q.id === s.target)
  return {
    id: s.id,
    target: { kind: 'publication', id: s.target },
    card: p
      ? { title: p.title, thumbnail_url: null, creator: p.creator.handle, source: 'community', availability: 'available', url: `/p/${p.slug}` }
      : { title: 'No longer available', thumbnail_url: null, creator: null, source: 'community', availability: 'unavailable', url: null },
    created_at: '2026-11-05T12:00:00Z'
  }
}

function collectionJson (c: FakeCollection) {
  return { id: c.id, name: c.name, description: '', visibility: c.visibility ?? 'private', created_at: '2026-11-05T12:00:00Z', updated_at: '2026-11-05T12:00:00Z', item_count: c.items.length }
}
