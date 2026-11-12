import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'

// eslint-disable-next-line import/first
import MuonLibrary from '../v2/MuonLibrary.vue'
// eslint-disable-next-line import/first
import LibraryPrintPage from '../v2/LibraryPrintPage.vue'
// eslint-disable-next-line import/first
import LibraryBrowsePage from '../v2/LibraryBrowsePage.vue'
// eslint-disable-next-line import/first
import LibraryGridPage from '../v2/LibraryGridPage.vue'
// eslint-disable-next-line import/first
import LibraryYoursGrid from '../v2/LibraryYoursGrid.vue'
// eslint-disable-next-line import/first
import LibraryCollectionPage from '../v2/LibraryCollectionPage.vue'
// eslint-disable-next-line import/first
import { LibraryError, type LibraryClient } from '@/services/library/api'
// eslint-disable-next-line import/first
import { setLibraryClient, resetLibrary } from '@/services/library/store'
// eslint-disable-next-line import/first
import type { ShelfCard } from '@/services/library/shelves'

const card = (id: string, over: Partial<ShelfCard> = {}): ShelfCard => ({
  key: `pub:${id}`,
  kind: 'publication',
  id,
  slug: id,
  title: `Print ${id}`,
  picture: null,
  creator: 'Okoro',
  handle: 'okoro',
  makes: 1,
  remixes: 0,
  saves: 0,
  facts: '',
  m1: false,
  tags: [],
  remixOf: null,
  makeOf: null,
  createdAt: null,
  href: '',
  category: 'home',
  ...over
})

const settle = async () => {
  for (let i = 0; i < 4; i++) {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

let wrappers: Array<{ destroy: () => void }> = []
beforeEach(() => localStorage.clear())
afterEach(() => {
  wrappers.forEach(w => w.destroy())
  wrappers = []
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const empty = () => new Response(JSON.stringify({ items: [], next_cursor: null, m1_ready: [], trending: [], new: [] }), { status: 200 })

// ---------------------------------------------------------------- Discover --

type Vm = Vue & { popular: ShelfCard[], m1: ShelfCard[], posts: unknown[], busy: boolean, chip: string, catalogue: unknown }

async function discover (props: Record<string, unknown> = {}, router = { push: vi.fn(() => Promise.resolve()) }) {
  vi.stubGlobal('fetch', vi.fn(async () => empty()))
  const wrapper = mount(MuonLibrary, { stubs: { 'frame-icon': true, 'library-yours-shelves': true }, propsData: { tab: 'discover', ...props }, mocks: { $vuetify: { breakpoint: { xsOnly: false } }, $router: router } })
  wrappers.push(wrapper)
  await settle()
  return { wrapper, vm: wrapper.vm as unknown as Vm, router }
}

describe('Continue is what this device opened', () => {
  const recent = { id: 'p1', kind: 'publication' as const, title: 'Pocket robot', thumbnail: null, maker: 'Wren Atelier', opened_at: 5 }

  it('without anything opened here there is no banner on Discover or on Yours', async () => {
    const d = await discover()
    expect(d.wrapper.find('[data-tid="library-continue"]').exists()).toBe(false)
    await d.wrapper.setProps({ tab: 'yours' })
    expect(d.wrapper.find('[data-tid="library-continue"]').exists()).toBe(false)
  })

  it('with one, the banner names it and who made it, and Open hands that entry to the host', async () => {
    const d = await discover({ continueRecent: recent })
    const banner = d.wrapper.find('[data-tid="library-continue"]')
    expect(banner.text()).toContain('Continue')
    expect(banner.text()).toContain('Pocket robot')
    expect(banner.text()).toContain('By Wren Atelier')
    // A public model has no Print again here: the host's own page prints it.
    expect(d.wrapper.find('[data-tid="library-continue-print"]').exists()).toBe(false)
    await d.wrapper.find('[data-tid="library-continue-open"]').trigger('click')
    expect(d.wrapper.emitted('open-recent')).toEqual([[recent]])
  })

  it('one of yours also offers Print again, and says it was opened on this device when it has nothing else to say', async () => {
    const own = { id: 'a', kind: 'own' as const, title: 'Hex planter', thumbnail: null, maker: null, opened_at: 9 }
    const item = { id: 'a', name: 'Hex planter', setups: [], versioned: true, events: [] }
    const d = await discover({ continueRecent: own, continueItem: item, printerName: 'Boxwood' })
    const banner = d.wrapper.find('[data-tid="library-continue"]')
    expect(banner.find('[data-tid="library-continue-print"]').text()).toContain('Print again on Boxwood')
    await banner.find('[data-tid="library-continue-print"]').trigger('click')
    expect(d.wrapper.emitted('print-item')?.[0][0]).toBe(item)
    const bare = await discover({ continueRecent: own })
    expect(bare.wrapper.find('[data-tid="library-continue"]').text()).toContain('Opened on this device')
  })
})

describe('Discover shelves tell the truth about their source', () => {
  it('a Made for M1 shelf of publisher-tagged prints says they are candidates, not that they were test-printed', async () => {
    const d = await discover()
    d.vm.busy = false
    d.vm.popular = [card('1')]
    d.vm.m1 = [card('2', { m1: true })]
    await settle()
    const shelf = d.wrapper.find('[data-tid="library-shelf-m1"]')
    expect(shelf.text()).toContain('Publisher-tagged M1 candidates. Check the profile before printing.')
    expect(shelf.text()).not.toContain('test-printed')
  })

  it('says test-printed only when every print on it is from the tested catalogue', async () => {
    const d = await discover()
    d.vm.busy = false
    d.vm.popular = [card('1')]
    d.vm.m1 = [card('c1', { kind: 'catalogue', key: 'cat:c1', m1: true }), card('c2', { kind: 'catalogue', key: 'cat:c2', m1: true })]
    await settle()
    expect(d.wrapper.find('[data-tid="library-shelf-m1"]').text()).toContain('Sliced and test-printed on the M1')
    // One tagged print among them and it is no longer all tested.
    d.vm.m1 = [card('c1', { kind: 'catalogue', key: 'cat:c1', m1: true }), card('2', { m1: true })]
    await settle()
    expect(d.wrapper.find('[data-tid="library-shelf-m1"]').text()).toContain('Publisher-tagged M1 candidates')
    expect(d.wrapper.find('[data-tid="library-shelf-m1"]').text()).not.toContain('test-printed')
  })

  it('a fixed shelf with nothing on it says so and offers Browse categories; the ones with prints do not', async () => {
    const d = await discover()
    d.vm.busy = false
    d.vm.popular = [card('1')]
    await settle()
    expect(d.wrapper.find('[data-tid="library-shelf-popular-empty"]').exists()).toBe(false)
    for (const id of ['m1', 'new']) {
      const empty = d.wrapper.find(`[data-tid="library-shelf-${id}-empty"]`)
      expect(empty.text()).toContain('Nothing here yet.')
      expect(empty.text()).toContain('Browse categories')
      // No See all for a shelf with nothing to see.
      expect(d.wrapper.find(`[data-tid="library-shelf-${id}-all"]`).exists()).toBe(false)
    }
    await d.wrapper.find('[data-tid="library-shelf-new-empty-action"]').trigger('click')
    expect(d.router.push).toHaveBeenCalledWith({ query: { view: 'discover', category: 'all' } })
  })

  it('an editorial shelf with nothing visible stays hidden, and a filter that hides everything is said once, not per shelf', async () => {
    const d = await discover()
    d.vm.busy = false
    d.vm.popular = [card('1')]
    d.vm.catalogue = { hero: null, shelves: [{ id: 'editorial-desk', title: 'Desk tidy', sub: '', cards: [] }], week: [] }
    await settle()
    expect(d.wrapper.find('[data-tid="library-shelf-editorial-desk"]').exists()).toBe(false)
    d.vm.catalogue = null
    d.vm.chip = 'workshop'
    await settle()
    expect(d.wrapper.find('[data-tid="library-shelf-m1-empty"]').exists()).toBe(false)
    expect(d.wrapper.find('[data-tid="library-discover-empty"]').exists()).toBe(true)
  })
})

// -------------------------------------------------------------- Print page --

const publication = (over: Record<string, unknown> = {}) => ({ id: 'p1', title: 'Pocket robot', version: 1, files: [], slug: 'pocket-robot', tags: ['toy'], licence: 'CC-BY-4.0', category: 'toys-games', creator: { handle: 'wren', display_name: 'Wren Atelier' }, counts: { makes: 1, remixes: 0, saves: 1 }, created_at: '2026-11-01T00:00:00Z', ...over })

function service (detail: Record<string, unknown> = {}) {
  return vi.fn(async (url: string) => {
    if (url.includes('/makes?') || url.includes('/remixes?')) return new Response(JSON.stringify({ items: [], next_cursor: null }))
    return new Response(JSON.stringify(publication(detail)))
  })
}

function client (modelContext: () => Promise<unknown>): LibraryClient {
  return { modelContext, savesOf: async () => ({ saves: [] }) } as unknown as LibraryClient
}

const signIn = vi.fn()

async function printPage (props: Record<string, unknown> = {}, context: () => Promise<unknown> = async () => ({ owner: false, versions: [], runs: [] }), detail: Record<string, unknown> = {}) {
  vi.stubGlobal('fetch', service(detail))
  setLibraryClient(client(context))
  const wrapper = mount(LibraryPrintPage, {
    stubs: { 'frame-icon': true, 'router-link': RouterLinkStub },
    propsData: { card: card('p1', { title: 'Pocket robot', slug: 'pocket-robot' }), signedIn: true, ...props },
    provide: { libraryCardContext: () => ({ volume: null, signIn, settingsTo: '/boxwood-367a/account/library' }) },
    mocks: { $store: { state: { printer: { printer: { save_variables: { variables: {} } } } } } },
    attachTo: document.body
  })
  wrappers.push(wrapper)
  await settle()
  return wrapper
}

const tid = (w: Awaited<ReturnType<typeof printPage>>, id: string) => w.find(`[data-tid="${id}"]`)

describe('A model page: print history says why it is missing', () => {
  beforeEach(() => { resetLibrary('u1'); signIn.mockClear() })

  it('signed out: one sentence and a Sign in button, which opens the host sign-in', async () => {
    const w = await printPage({ signedIn: false })
    const section = tid(w, 'library-print-history')
    expect(section.exists()).toBe(true)
    expect(section.text()).toContain('Sign in to see your own prints of this model.')
    await tid(w, 'library-print-history-sign-in').trigger('click')
    expect(signIn).toHaveBeenCalledOnce()
    expect(section.text()).not.toContain('Library must be enabled')
  })

  it('Library off: says to turn on Library saving, links to the Library settings, and has no Try again', async () => {
    const w = await printPage({}, async () => { throw new LibraryError('consent_required', 'Turn it on.', 403) })
    expect(tid(w, 'library-print-history-off').text()).toBe('Turn on Library saving to keep a private history of your prints of this model.')
    expect(tid(w, 'library-print-history-settings').props('to')).toBe('/boxwood-367a/account/library')
    expect(tid(w, 'library-print-history').text()).not.toContain('Try again')
  })

  it('any other refusal with status 403 is also Library off', async () => {
    const w = await printPage({}, async () => { throw new LibraryError('forbidden', 'No.', 403) })
    expect(tid(w, 'library-print-history-off').exists()).toBe(true)
  })

  it('anything else: could not be loaded just now, with Try again that reads it again', async () => {
    const read = vi.fn()
      .mockRejectedValueOnce(new LibraryError('http-503', 'The Library answered 503.', 503))
      .mockResolvedValueOnce({ owner: false, versions: [], runs: [{ id: 'r1', printer_name: 'Walnut', started_at: '2026-11-05T09:00:00Z', outcome: 'finished' }] })
    const w = await printPage({}, read)
    expect(tid(w, 'library-print-history-error').text()).toBe('Your print history could not be loaded just now.')
    expect(tid(w, 'library-print-history-off').exists()).toBe(false)
    await tid(w, 'library-print-history-retry').trigger('click')
    await settle()
    expect(read).toHaveBeenCalledTimes(2)
    expect(tid(w, 'library-print-history').text()).toContain('Walnut')
  })

  it('offline says so, still with Try again', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const w = await printPage({}, async () => { throw new TypeError('Failed to fetch') })
    expect(tid(w, 'library-print-history-error').text()).toBe('You are offline. Check your internet connection and try again.')
    expect(tid(w, 'library-print-history-retry').exists()).toBe(true)
  })
})

describe('A model page is what Continue shows next', () => {
  const RECENTS = 'm3d.control.library.recents.v1'

  it('once the model has loaded it is kept on this device: its title, who made it, a public picture, nothing else', async () => {
    await printPage({ card: card('p1', { picture: 'https://library.muon3d.com/img/p1.jpg' }), signedIn: false })
    expect(JSON.parse(localStorage.getItem(RECENTS) ?? 'null')).toEqual([
      { id: 'p1', kind: 'publication', title: 'Pocket robot', thumbnail: 'https://library.muon3d.com/img/p1.jpg', maker: 'Wren Atelier', opened_at: expect.any(Number) }
    ])
  })

  it('a model that could not be read is not kept', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })))
    setLibraryClient(client(async () => ({ owner: false, versions: [], runs: [] })))
    const w = mount(LibraryPrintPage, { stubs: { 'frame-icon': true, 'router-link': RouterLinkStub }, propsData: { card: card('p1') }, mocks: { $store: { state: { printer: { printer: { save_variables: { variables: {} } } } } } } })
    wrappers.push(w)
    await settle()
    expect(w.find('[data-tid="library-print-error"]').exists()).toBe(true)
    expect(localStorage.getItem(RECENTS)).toBeNull()
  })
})

describe('A model page: print profile and focus', () => {
  it('shows Material as Not provided when the maker gave none, and the maker\'s material when they did', async () => {
    const none = await printPage({}, undefined, { print_profile: { layer_height_mm: 0.2 } })
    const row = (w: typeof none) => w.findAll('[data-tid="library-print-profile"] div').wrappers.find(r => r.find('dt').text() === 'Material')
    expect(row(none)?.find('dd').text()).toBe('Not provided')
    const given = await printPage({}, undefined, { print_profile: { material: 'PETG' } })
    expect(row(given)?.find('dd').text()).toBe('PETG')
  })

  it('opens with its heading focused', async () => {
    const w = await printPage()
    expect(document.activeElement).toBe(tid(w, 'library-print-title').element)
    expect(tid(w, 'library-print-title').attributes('tabindex')).toBe('-1')
  })
})

describe('More like this: a signed-out visitor gets cards without the heart', () => {
  const similar = () => vi.fn(async (url: string) => {
    if (url.includes('/makes?') || url.includes('/remixes?')) return new Response(JSON.stringify({ items: [], next_cursor: null }))
    if (url.includes('/categories/toys-games')) return new Response(JSON.stringify({ items: [{ id: 'q1', slug: 'q1', title: 'Other robot', creator: { handle: 'm', display_name: 'M' }, tags: [], counts: { makes: 0, remixes: 0, saves: 0 }, created_at: '2026-11-01T00:00:00Z' }], next_cursor: null }))
    return new Response(JSON.stringify(publication()))
  })

  async function withSimilar (signedIn: boolean) {
    vi.stubGlobal('fetch', similar())
    setLibraryClient(client(async () => ({ owner: false, versions: [], runs: [] })))
    const wrapper = mount(LibraryPrintPage, {
      stubs: { 'frame-icon': true, 'router-link': RouterLinkStub },
      propsData: { card: card('p1'), signedIn },
      provide: { libraryCardContext: () => ({ volume: null, signedIn, signIn }) },
      mocks: { $store: { state: { printer: { printer: { save_variables: { variables: {} } } } } } }
    })
    wrappers.push(wrapper)
    await settle()
    return wrapper
  }

  it('signed in: the heart is there; signed out: it is not, and Print still is', async () => {
    const out = await withSimilar(false)
    expect(out.findAll('[data-tid="library-shelf-similar"] [data-tid="library-card-print"]').length).toBeGreaterThan(0)
    expect(out.findAll('[data-tid="library-shelf-similar"] [data-tid="library-card-save"]')).toHaveLength(0)
    const inn = await withSimilar(true)
    expect(inn.findAll('[data-tid="library-shelf-similar"] [data-tid="library-card-save"]').length).toBeGreaterThan(0)
  })
})

// ------------------------------------------------------------ Browse pages --

describe('Browse categories show their description', () => {
  async function browse (categories: unknown[]) {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => String(url).includes('categor') ? new Response(JSON.stringify({ categories }), { status: 200 }) : empty()))
    const wrapper = mount(LibraryBrowsePage, { stubs: { 'frame-icon': true, 'library-search-box': true }, propsData: { category: null, query: '' } })
    wrappers.push(wrapper)
    await settle()
    return wrapper
  }

  it('puts the description under the name when the service sent one, and nothing when it did not', async () => {
    const w = await browse([{ slug: 'home', name: 'Home', description: 'Things for around the house', count: 3 }, { slug: 'art', name: 'Art', description: '', count: 1 }])
    expect(w.find('[data-tid="library-category-home"]').text()).toContain('Things for around the house')
    expect(w.find('[data-tid="library-category-home-about"]').exists()).toBe(true)
    expect(w.find('[data-tid="library-category-art"]').exists()).toBe(true)
    expect(w.find('[data-tid="library-category-art-about"]').exists()).toBe(false)
  })
})

// ------------------------------------------------ Back online, grid pages --

describe('Coming back online reads again what had failed', () => {
  it('Browse reads its categories again after they failed, and does nothing when they had loaded', async () => {
    let down = true
    const fetcher = vi.fn(async (url: string) => {
      if (String(url).includes('categor')) return down ? new Response('{}', { status: 503 }) : new Response(JSON.stringify({ categories: [{ slug: 'home', name: 'Home', description: '', count: 1 }] }))
      return empty()
    })
    vi.stubGlobal('fetch', fetcher)
    const w = mount(LibraryBrowsePage, { stubs: { 'frame-icon': true, 'library-search-box': true }, propsData: { category: null, query: '' } })
    wrappers.push(w)
    await settle()
    expect(w.find('[data-tid="library-category-home"]').exists()).toBe(false)
    const before = fetcher.mock.calls.length
    down = false
    window.dispatchEvent(new Event('online'))
    await settle()
    expect(fetcher.mock.calls.length).toBeGreaterThan(before)
    expect(w.find('[data-tid="library-category-home"]').exists()).toBe(true)
    const after = fetcher.mock.calls.length
    window.dispatchEvent(new Event('online'))
    await settle()
    expect(fetcher.mock.calls.length).toBe(after)
  })

  it('a See all grid reads again after it failed, not after it loaded, and stops listening once gone', async () => {
    let down = true
    const fetcher = vi.fn(async () => down
      ? new Response('{}', { status: 503 })
      : new Response(JSON.stringify({ items: [{ id: 'q1', slug: 'q1', title: 'Other robot', creator: { handle: 'm', display_name: 'M' }, tags: [], counts: { makes: 0, remixes: 0, saves: 0 }, created_at: '2026-11-01T00:00:00Z' }], next_cursor: null })))
    vi.stubGlobal('fetch', fetcher)
    const w = mount(LibraryGridPage, { stubs: { 'frame-icon': true }, propsData: { source: 'popular', categories: [{ id: 'all', label: 'All' }] } })
    wrappers.push(w)
    await settle()
    expect(w.text()).not.toContain('Other robot')
    const failed = fetcher.mock.calls.length
    down = false
    window.dispatchEvent(new Event('online'))
    await settle()
    expect(fetcher.mock.calls.length).toBeGreaterThan(failed)
    expect(w.text()).toContain('Other robot')
    const loaded = fetcher.mock.calls.length
    window.dispatchEvent(new Event('online'))
    await settle()
    expect(fetcher.mock.calls.length).toBe(loaded)
    w.destroy()
    wrappers = []
    down = true
    window.dispatchEvent(new Event('online'))
    await settle()
    expect(fetcher.mock.calls.length).toBe(loaded)
  })

  it('a Yours grid reads again after it failed', async () => {
    const saved = vi.fn()
      .mockRejectedValueOnce(new LibraryError('http-503', 'The Library answered 503.', 503))
      .mockResolvedValue({ saves: [] })
    setLibraryClient({ saved } as unknown as LibraryClient)
    const w = mount(LibraryYoursGrid, { stubs: { 'frame-icon': true }, propsData: { source: 'saved' } })
    wrappers.push(w)
    await settle()
    expect(saved).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new Event('online'))
    await settle()
    expect(saved).toHaveBeenCalledTimes(2)
    window.dispatchEvent(new Event('online'))
    await settle()
    expect(saved).toHaveBeenCalledTimes(2)
  })
})

describe('A Library page opens with its heading focused', () => {
  it('a See all grid and a Yours grid focus their heading', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => empty()))
    const grid = mount(LibraryGridPage, { stubs: { 'frame-icon': true }, propsData: { source: 'popular', categories: [{ id: 'all', label: 'All' }] }, attachTo: document.body })
    wrappers.push(grid)
    await settle()
    expect(document.activeElement).toBe(grid.find('h1').element)
    expect(grid.find('h1').attributes('tabindex')).toBe('-1')

    setLibraryClient({ saved: async () => ({ saves: [] }) } as unknown as LibraryClient)
    const yours = mount(LibraryYoursGrid, { stubs: { 'frame-icon': true }, propsData: { source: 'saved' }, attachTo: document.body })
    wrappers.push(yours)
    await settle()
    expect(document.activeElement).toBe(yours.find('h1').element)
  })

  it('a collection page focuses its heading once the collection has loaded', async () => {
    setLibraryClient({
      collection: async () => ({ id: 'c1', name: 'Desk things', visibility: 'private', items: [] }),
      saved: async () => ({ saves: [] })
    } as unknown as LibraryClient)
    const w = mount(LibraryCollectionPage, { stubs: { 'frame-icon': true }, propsData: { collectionId: 'c1' }, attachTo: document.body })
    wrappers.push(w)
    await settle()
    expect(w.find('[data-tid="library-collection-title"]').text()).toBe('Desk things')
    expect(document.activeElement).toBe(w.find('[data-tid="library-collection-title"]').element)
  })
})
