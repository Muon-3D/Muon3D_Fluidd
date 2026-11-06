/**
 * A fake model service (models.muon3d.com) for e2e tests: the public Library
 * (publications, discover, a print's page and pictures) and the signed-in
 * one (your Library feed, saves, collections), held in memory per test.
 * Shapes follow muon3d-model-service src/public_v2.rs, src/saves.rs and the
 * Library routes; extend it as pages need more.
 */
import type { Page, Route } from '@playwright/test'

export const MODELS = 'https://models.muon3d.com'

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
  colour: string;
  /** A G-code sliced for the M1 that Print on… can send. */
  gcode: boolean;
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
    colour: COLOURS[n % COLOURS.length],
    gcode: true,
    ...over
  }
}

export interface FakeSave { id: string, target: string }
export interface FakeCollection { id: string, name: string, items: string[] }

export interface ModelServiceState {
  publications: FakePublication[];
  saves: FakeSave[];
  collections: FakeCollection[];
  /** Answer every request with this status (outage tests), or null. */
  failWith: number | null;
  /** Answer matching requests with a status instead ("GET /v1/public/discover"): one shelf down. */
  failOn: (request: string) => number | null;
  /** Hold every answer this long (loading states). */
  delayMs: number;
  /** Requests seen, for assertions ("method path"). */
  seen: string[];
}

export function modelService (over: Partial<ModelServiceState> = {}): ModelServiceState {
  return {
    publications: Array.from({ length: 12 }, (_, i) => publication(i + 1)),
    saves: [],
    collections: [],
    failWith: null,
    failOn: () => null,
    delayMs: 0,
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
    category: 'home',
    tags: p.tags,
    ai_generated: 'no',
    creator: p.creator,
    created_at: p.created_at,
    score: p.make_count,
    make_count: p.make_count,
    remix_count: p.remix_count,
    save_count: p.save_count,
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
      ? [{ id: `${p.id}-g`, name: 'gcode.gcode', role: 'gcode', format: 'gcode', encoding: 'gzip', size_bytes: 120, sha256: 'a'.repeat(64), setup: { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PLA' } }]
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
    const one = path.match(/^\/v1\/public\/publications\/([^/]+)$/)
    if (one) {
      const p = all.find(q => q.id === one[1] || q.slug === one[1])
      return p ? json(route, detail(p, all)) : json(route, { error: { code: 'not_found' } }, 404)
    }

    // Signed in: the assertion the console handed out must come with it.
    if (!request.headers().authorization) return json(route, { error: { code: 'unauthorized' } }, 401)
    if (path === '/v1/library') return json(route, { enabled: true, account: { promise_version: '2026-10-01' }, promise: { version: '2026-10-01' }, storage: { used_bytes: 0, quota_bytes: 2e9 } })
    if (path === '/v1/items') return json(route, { items: [], rev: 1, more: false, reset: true })
    if (path === '/v1/library/sections') return json(route, { all: 0, printed: 0, sliced: 0, saved: state.saves.length })
    if (path === '/v1/library/preferences') return json(route, { autosave: true, ask: false, save_from_print_check: true, updated_at: null })
    if (path === '/v1/library/runs') return json(route, { runs: [], cursor: null })
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
    if (col) {
      const c = state.collections.find(x => x.id === col[1])
      if (!c) return json(route, { error: { code: 'not_found' } }, 404)
      if (col[2] && method === 'PUT') {
        if (!c.items.includes(col[2])) c.items.push(col[2])
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
  return { id: c.id, name: c.name, description: '', visibility: 'private', created_at: '2026-11-05T12:00:00Z', updated_at: '2026-11-05T12:00:00Z', item_count: c.items.length }
}
