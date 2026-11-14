import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import LibraryPrintPage from '../v2/LibraryPrintPage.vue'
import { loadRelated, type ShelfCard } from '@/services/library/shelves'
import { LibraryError } from '@/services/library/api'
import { setLibraryClient } from '@/services/library/store'

const MODELS = 'https://library.muon3d.com/models'

const card = (over: Partial<ShelfCard> = {}): ShelfCard => ({
  key: 'pub:p1',
  kind: 'publication',
  id: 'p1',
  slug: 'pocket-robot',
  title: 'Pocket robot',
  picture: null,
  creator: 'Wren Atelier',
  handle: 'wren',
  makes: 0,
  remixes: 0,
  saves: 0,
  facts: '',
  m1: false,
  tags: [],
  remixOf: null,
  makeOf: null,
  createdAt: null,
  href: '',
  ...over
})

const summary = (id: string) => ({ id, slug: `s-${id}`, title: `Print ${id}`, creator: { handle: 'm', display_name: 'M' }, tags: [], counts: { makes: 0, remixes: 0, saves: 0 }, created_at: '2026-11-01T00:00:00Z' })

/** The model service for one print: its detail, its makes and remixes. */
function service (detail: Record<string, unknown> = {}, related: { makes?: unknown[], remixes?: unknown[] } = {}, fail: string[] = []) {
  return vi.fn(async (url: string) => {
    if (fail.some(f => url.includes(f))) return new Response('{}', { status: 503 })
    if (url.endsWith('/makes?limit=12')) return new Response(JSON.stringify({ items: related.makes ?? [], next_cursor: null }))
    if (url.endsWith('/remixes?limit=12')) return new Response(JSON.stringify({ items: related.remixes ?? [], next_cursor: null }))
    return new Response(JSON.stringify({ title: 'Pocket robot, no supports', version: 1, files: [], slug: 'pocket-robot', tags: ['m1-ready', 'toy'], licence: 'CC-BY-4.0', creator: { handle: 'wren', display_name: 'Wren Atelier' }, counts: { makes: 1600, remixes: 4, saves: 3500 }, description: 'A little robot.', created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(), ...detail }))
  })
}

const flush = async () => {
  for (let i = 0; i < 4; i++) {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

let wrappers: Array<{ destroy: () => void }> = []
afterEach(() => {
  wrappers.forEach(w => w.destroy())
  wrappers = []
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  // A share sheet a test gave the page goes with it, passed or failed.
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
})

async function page (props: Record<string, unknown> = {}, fetcher = service(), provide: Record<string, unknown> = {}) {
  vi.stubGlobal('fetch', fetcher)
  const wrapper = mount(LibraryPrintPage, { stubs: { 'frame-icon': true }, provide, propsData: { card: card(), printerName: 'Boxwood', printerFits: true, ...props }, mocks: { $store: { state: { printer: { printer: { save_variables: { variables: {} } } } } } } })
  wrappers.push(wrapper)
  await flush()
  return wrapper
}

const text = (w: Awaited<ReturnType<typeof page>>, tid: string) => w.find(`[data-tid="${tid}"]`).text()

describe('Library v3 print page', () => {
  it('says who shared it, when and under what licence; the counts in one line', async () => {
    const w = await page()
    expect(text(w, 'library-print-title')).toBe('Pocket robot, no supports')
    expect(text(w, 'library-print-by')).toBe('by Wren Atelier · shared 2 days ago · CC BY 4.0')
    expect(text(w, 'library-print-counts')).toBe('♡ 3.5k saves · 1.6k made · 4 remixes')
    expect(text(w, 'library-print-maker')).toContain('@wren')
  })

  it('shows Fits <printer> by size only when the size is known; an M1-ready tag alone says Check print size', async () => {
    const volume = () => ({ volume: { x: 220, y: 220, z: 250 } })
    const fits = await page({}, service({ size_mm: [50, 50, 50] }), { libraryCardContext: volume })
    expect(fits.find('[data-tid="library-print-fits"]').text()).toBe('Fits Boxwood by size')
    expect(fits.find('[data-tid="library-print-fits"]').classes()).toContain('mlib-badge--ok')
    const tooBig = await page({}, service({ size_mm: [500, 50, 50] }), { libraryCardContext: volume })
    expect(tooBig.find('[data-tid="library-print-fits"]').text()).toBe('Does not fit as oriented')
    expect(tooBig.find('[data-tid="library-print-fits"]').classes()).not.toContain('mlib-badge--ok')
    // The publisher's m1-ready tag is not a measurement.
    const unknown = await page()
    expect(unknown.find('[data-tid="library-print-fits"]').exists()).toBe(false)
    expect(unknown.find('[data-tid="library-print-fit-unknown"]').text()).toBe('Check print size')
    expect(unknown.find('[data-tid="library-print-fit-unknown"]').classes()).not.toContain('mlib-badge--ok')
    expect(unknown.text()).not.toContain('Fits Boxwood')
  })

  it('lists makes and remixes; no makes says how to add one; no remixes hides the shelf', async () => {
    const w = await page({}, service({}, { makes: [summary('m1'), summary('m2')], remixes: [] }))
    expect(w.find('[data-tid="library-shelf-makes"]').text()).toContain('Print m1')
    expect(w.find('[data-tid="library-shelf-remixes"]').exists()).toBe(false)
    const none = await page({}, service({}, { makes: [], remixes: [summary('r1')] }))
    expect(none.find('[data-tid="library-shelf-makes-empty"]').exists()).toBe(true)
    expect(none.find('[data-tid="library-shelf-remixes"]').text()).toContain('Print r1')
  })

  it('a shelf that could not be read has Retry while the page works', async () => {
    const w = await page({}, service({}, {}, ['/makes']))
    expect(w.find('[data-tid="library-shelf-makes-error"]').exists()).toBe(true)
    expect(text(w, 'library-print-title')).toBe('Pocket robot, no supports')
  })

  it('closing the share sheet says nothing; a page not yet read offers no links to its web page', async () => {
    const share = vi.fn(async () => { throw Object.assign(new Error('closed'), { name: 'AbortError' }) })
    Object.defineProperty(navigator, 'share', { value: share, configurable: true })
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const w = await page()
    await w.find('[data-tid="library-print-share"]').trigger('click')
    await flush()
    expect(share).toHaveBeenCalledWith({ title: 'Pocket robot, no supports', url: 'https://library.muon3d.com/p/pocket-robot' })
    expect(w.find('[data-tid="library-print-note"]').exists()).toBe(false)
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })

    // Opened by its address (no slug yet) and its read failed: no Share, ↗ or Remix to a page with no address.
    const bare = await page({ card: card({ slug: '' }) }, service({}, {}, ['/publications/p1']))
    expect(bare.find('[data-tid="library-print-error"]').exists()).toBe(true)
    expect(bare.find('[data-tid="library-print-share"]').exists()).toBe(false)
    expect(bare.find('[data-tid="library-print-web"]').exists()).toBe(false)
  })

  it('Share copies the link, or shows it to copy when the clipboard is refused', async () => {
    const w = await page()
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await w.find('[data-tid="library-print-share"]').trigger('click')
    await flush()
    expect(writeText).toHaveBeenCalledWith('https://library.muon3d.com/p/pocket-robot')
    expect(text(w, 'library-print-note')).toBe('Link copied.')
    writeText.mockRejectedValueOnce(new Error('denied'))
    await w.find('[data-tid="library-print-share"]').trigger('click')
    await flush()
    expect(text(w, 'library-print-note')).toBe('Copy this link: https://library.muon3d.com/p/pocket-robot')
  })
})

describe('Library v3 print page: review findings', () => {
  const signedIn = async (error: unknown) => {
    setLibraryClient({ modelContext: vi.fn(async () => { throw error }) } as never)
    return page({ signedIn: true })
  }

  it('a history that failed for any other reason does not say the Library must be enabled', async () => {
    const offline = await signedIn(new LibraryError('offline', 'x'))
    expect(text(offline, 'library-print-history')).toContain('You are offline. Check your internet connection and try again.')
    expect(text(offline, 'library-print-history')).not.toContain('Turn on Library saving')
    const broken = await signedIn(new LibraryError('server_error', 'The Library is having a problem.', 500))
    expect(text(broken, 'library-print-history')).toContain('Your print history could not be loaded just now.')
    expect(text(broken, 'library-print-history')).not.toContain('Turn on Library saving')
    const forbidden = await signedIn(new LibraryError('forbidden', 'x', 403))
    expect(text(forbidden, 'library-print-history')).not.toContain('Turn on Library saving')
  })

  it('keeps the turn-on-Library text for a 403 consent_required', async () => {
    const off = await signedIn(new LibraryError('consent_required', 'x', 403))
    expect(text(off, 'library-print-history')).toContain('Turn on Library saving to keep a private history of your prints of this model.')
  })

  it('offers Share and Report only when the print has an address', async () => {
    const bare = await page({ card: card({ slug: '' }) }, service({ slug: '' }))
    expect(bare.find('[data-tid="library-print-title"]').exists()).toBe(true)
    expect(bare.find('[data-tid="library-print-share"]').exists()).toBe(false)
    expect(bare.find('[data-tid="library-print-report"]').exists()).toBe(false)
    const addressed = await page()
    expect(addressed.find('[data-tid="library-print-share"]').exists()).toBe(true)
    expect(addressed.find('[data-tid="library-print-report"]').attributes('href')).toBe('https://library.muon3d.com/p/pocket-robot#report')
  })

  it('Slice and print goes to the slicer with the library parameter, version and file', async () => {
    const detail = { id: 'p1', version: 3, files: [{ id: 'f1', role: 'project', format: '3mf', name: 'a.3mf', size_bytes: 1, sha256: 'x' }] }
    vi.stubEnv('VUE_MUON_SLICER_URL', '')
    expect((await page({}, service(detail))).find('[data-tid="library-print-slice"]').attributes('href')).toBe('https://slicer.muon3d.com/?library=p1&version=3&file=f1')
    vi.stubEnv('VUE_MUON_SLICER_URL', 'https://slicer.example.test/embed.html')
    expect((await page({}, service(detail))).find('[data-tid="library-print-slice"]').attributes('href')).toBe('https://slicer.example.test/?library=p1&version=3&file=f1')
  })

  it('has one Save, in the Print panel, and no sign-in line inside the signed-in history', async () => {
    setLibraryClient({ modelContext: vi.fn(async () => ({ owner: false, state: 'approved', pinned_version: 1, versions: [], runs: [] })) } as never)
    const w = await page({ signedIn: true })
    expect(w.find('[data-tid="library-print-heart"]').exists()).toBe(false)
    expect(w.find('[data-tid="library-print-panel-heart"]').exists()).toBe(true)
    expect(w.text()).not.toContain('Sign in to see your print history.')
    expect(text(w, 'library-print-versions')).toContain('Public version')
    expect(text(w, 'library-print-versions')).not.toContain('Reviewed public version')
  })
})

describe('Library v3: a print\'s makes and remixes', () => {
  it('reads twelve, as cards, and says whether there are more', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ items: [summary('a'), { nope: true }], next_cursor: 'c' })))
    const { cards, more } = await loadRelated('p 1', 'makes', fetcher as never)
    expect(fetcher).toHaveBeenCalledWith(`${MODELS}/v1/public/publications/p%201/makes?limit=12`, expect.objectContaining({ credentials: 'omit' }))
    expect(cards.map(c => c.title)).toEqual(['Print a'])
    expect(more).toBe(true)
  })
})
