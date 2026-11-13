/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest'
import { MODELS_URL, type PublicPublication } from '../api'
import { ago, cardMatches, loadFeedPage, loadGrid, loadPublication, loadShelves, publicationPrint, summaryCard, type PublicationSummary } from '../shelves'

const summary = (over: Partial<PublicationSummary> = {}): PublicationSummary => ({
  id: 'p1',
  slug: 'spiral-vase',
  title: 'Spiral vase',
  tags: ['vase'],
  creator: { handle: 'okoro', display_name: 'Okoro' },
  created_at: '2026-11-05T10:00:00Z',
  make_count: 4,
  remix_count: 1,
  remix_of: null,
  thumbnail_url: 'https://library.muon3d.com/models/v1/public/images/1.png',
  ...over
})

function answer (routes: Record<string, unknown>) {
  return vi.fn(async (url: string) => {
    const path = url.replace(MODELS_URL, '')
    const key = Object.keys(routes).find(route => path.startsWith(route))
    if (!key) return new Response('{}', { status: 500 })
    const body = routes[key]
    return body instanceof Response ? body : new Response(JSON.stringify(body), { status: 200 })
  }) as unknown as typeof fetch
}

describe('Library v2 shelves', () => {
  it('turns a publication into a card: its picture, maker, makes, and Made for M1 from its m1-ready tag', () => {
    const card = summaryCard(summary({ tags: ['vase', 'm1-ready'] }))
    expect(card).toMatchObject({ key: 'pub:p1', kind: 'publication', creator: 'Okoro', makes: 4, m1: true })
    expect(card.href).toBe('https://library.muon3d.com/p/spiral-vase')
  })

  it('carries the publication\'s category, for the category chips', () => {
    expect(summaryCard(summary({ category: 'workshop' })).category).toBe('workshop')
    expect(summaryCard(summary({ category: undefined })).category).toBeNull()
  })

  it('drops a picture that is not https or the model service', () => {
    expect(summaryCard(summary({ thumbnail_url: 'javascript:alert(1)' })).picture).toBeNull()
  })

  it('reads Popular from trending and Made for M1 from m1-ready prints, then the catalogue', async () => {
    const fetcher = answer({
      '/v1/public/publications?sort=trending&tag=m1-ready': { items: [summary({ id: 'm', slug: 'm' })], next_cursor: null },
      '/v1/public/publications?sort=trending': { items: [summary(), summary({ id: 'p2', slug: 'p2' })], next_cursor: null },
      '/v1/public/discover': { m1_ready: [{ slug: 'dice', title: 'Calibration dice', author: 'Muon Labs', print_time_s: 2280, filament_g: 9, material: 'PLA' }], trending: [], new: [] }
    })
    const shelves = await loadShelves(fetcher)
    expect(shelves.popular.map(card => card.id)).toEqual(['p1', 'p2'])
    expect(shelves.m1.map(card => card.key)).toEqual(['pub:m', 'cat:dice'])
    expect(shelves.m1.every(card => card.m1)).toBe(true)
    expect(shelves.m1[1].facts).toBe('38 min · 9 g · PLA')
  })

  it('keeps Discover\'s own shelves when the publications list fails; a shelf neither source answers says why', async () => {
    const fallback = answer({ '/v1/public/discover': { m1_ready: [], trending: [summary()], new: [] } })
    const kept = await loadShelves(fallback)
    expect(kept.popular.map(card => card.id)).toEqual(['p1'])
    expect(kept.errors).toEqual({})
    const down = await loadShelves(answer({}))
    expect(down.popular).toEqual([])
    expect(down.errors.popular).toMatch(/didn't answer/)
    expect(down.errors.m1).toMatch(/didn't answer/)
    expect(down.unreachable).toBe(false)
  })

  it('knows when nothing could be reached at all (fetch itself failed), whatever the browser calls it', async () => {
    const offline = (async () => { throw new TypeError('Load failed') }) as unknown as typeof fetch
    expect((await loadShelves(offline)).unreachable).toBe(true)
  })

  it('reads the feed newest first: a remix is said as one, and the cursor carries on', async () => {
    const fetcher = answer({
      '/v1/public/publications?sort=new': { items: [summary({ remix_of: { id: 'x', slug: 'x', title: 'Vase' } }), summary({ id: 'p2', slug: 'p2' })], next_cursor: 'p2' }
    })
    const page = await loadFeedPage(null, fetcher)
    expect(page.posts.map(post => post.verb)).toEqual(['remixed', 'shared'])
    expect(page.cursor).toBe('p2')
  })

  it('says a make as one, naming the print it was made from, with its saves', async () => {
    const fetcher = answer({
      '/v1/public/publications?sort=new': { items: [summary({ save_count: 7, make_of: { id: 'x', slug: 'robot', title: 'Pocket robot' } })], next_cursor: null }
    })
    const [post] = (await loadFeedPage(null, fetcher)).posts
    expect(post.verb).toBe('made')
    expect(post.card.makeOf?.title).toBe('Pocket robot')
    expect(post.card.saves).toBe(7)
  })

  it('reads a service without save counts or makes as none', () => {
    expect(summaryCard(summary())).toMatchObject({ saves: 0, makeOf: null })
  })

  it('says how long ago', () => {
    const now = Date.parse('2026-11-05T12:00:00Z')
    expect(ago('2026-11-05T11:48:00Z', now)).toBe('12 min')
    expect(ago('2026-11-05T09:00:00Z', now)).toBe('3 h')
    expect(ago('2026-11-04T09:00:00Z', now)).toBe('yesterday')
    expect(ago(null, now)).toBe('')
  })
})

describe('Library v2: printing a public print from its card', () => {
  const publication = (files: PublicPublication['files']): PublicPublication => ({ title: 'Spiral vase', version: 3, files })
  const gcode = (id: string, material: string, sha256 = 'a'.repeat(64)) => ({
    id,
    role: 'gcode' as const,
    format: 'gcode' as const,
    encoding: 'gzip' as const,
    size_bytes: 100,
    sha256,
    setup: { printer_model: 'Muon3D M1', nozzle_mm: 0.4, material },
    print_seconds: 600,
    filament_g: 12
  })

  it('offers every G-code to Print on…, each with the checksum its publication lists', () => {
    const print = publicationPrint(publication([gcode('f1', 'PLA'), gcode('f2', 'PETG', 'b'.repeat(64))]), 'p1')
    expect(print?.item.setups.map(setup => [setup.file_id, setup.material])).toEqual([['f1', 'PLA'], ['f2', 'PETG']])
    expect(print?.item.shared.expected.f2.sha256).toBe('b'.repeat(64))
    expect(print?.item).toMatchObject({ id: 'p1', name: 'Spiral vase', version: 3 })
    expect(publicationPrint({ ...publication([gcode('f1', 'PLA')]), slug: 'spiral-vase' }, 'p1')?.item.shared.slug).toBe('spiral-vase')
  })

  it('offers nothing for a print with no G-code, or none it can check', () => {
    expect(publicationPrint(publication([]), 'p1')).toBeNull()
    expect(publicationPrint(publication([gcode('f1', 'PLA', '')]), 'p1')).toBeNull()
  })

  it('reads one publication without an account', async () => {
    const fetcher = answer({ '/v1/public/publications/p1': publication([gcode('f1', 'PLA')]) })
    expect((await loadPublication('p1', fetcher)).title).toBe('Spiral vase')
    expect((fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1]).toMatchObject({ credentials: 'omit' })
    await expect(loadPublication('gone', answer({ '/v1/public/publications/gone': new Response('', { status: 404 }) }))).rejects.toThrow(/no longer public/)
  })
})

describe('Library v3 See all and search', () => {
  it('reads a shelf as a grid page from its own list, Made for M1 marked as such', async () => {
    const fetcher = answer({ '/v1/public/publications?sort=trending&tag=m1-ready': { items: [summary()], next_cursor: 'o:24' } })
    const page = await loadGrid('m1', {}, fetcher)
    expect(page.cards.map(c => [c.id, c.m1])).toEqual([['p1', true]])
    expect(page.cursor).toBe('o:24')
  })

  it('searches the service, passing the cursor on', async () => {
    const fetcher = answer({ '/v1/public/search?q=vase': { items: [summary()], next_cursor: null } })
    const page = await loadGrid('search', { query: ' vase ' }, fetcher)
    expect(page.cards.map(c => c.id)).toEqual(['p1'])
    expect(page.local).toBeFalsy()
  })

  it('without the search route (404), searches the newest prints here', async () => {
    const fetcher = answer({
      '/v1/public/search': new Response('', { status: 404 }),
      '/v1/public/publications?sort=new': { items: [summary(), summary({ id: 'p2', slug: 'p2', title: 'Gear' })], next_cursor: null }
    })
    const page = await loadGrid('search', { query: 'gear' }, fetcher)
    expect(page.cards.map(c => c.id)).toEqual(['p2'])
    expect(page.local).toBe(true)
  })

  it('refuses a one-letter search, and says when searching too fast', async () => {
    await expect(loadGrid('search', { query: 'a' }, answer({}))).rejects.toThrow(/two letters/)
    await expect(loadGrid('search', { query: 'vase' }, answer({ '/v1/public/search': new Response('', { status: 429 }) }))).rejects.toThrow(/Too many searches/)
  })

  it('finds a card by every word of a query, in its title, maker or tags', () => {
    const card = summaryCard(summary({ tags: ['vase'] }))
    expect(cardMatches(card, 'spiral okoro')).toBe(true)
    expect(cardMatches(card, 'vase')).toBe(true)
    expect(cardMatches(card, 'spiral gear')).toBe(false)
  })
})
