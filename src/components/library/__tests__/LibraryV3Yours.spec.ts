import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import LibraryYoursShelves from '../v2/LibraryYoursShelves.vue'
import LibraryYoursGrid from '../v2/LibraryYoursGrid.vue'
import { libraryState, resetLibrary, setLibraryClient } from '@/services/library/store'
import type { LibraryItem, LibraryRun } from '@/services/library/api'
import { findOwn, itemShelf, printedCards, ownPublicShares, runCard, sharedCard, slicedCard } from '@/services/library/yours'

const NOW = Date.parse('2026-11-06T12:00:00Z')

const item = (id: string, over: Partial<LibraryItem> = {}): LibraryItem => ({
  id,
  kind: 'plate',
  format: '3mf',
  name: `Print ${id}`,
  size_bytes: 10,
  has_thumbnail: false,
  state: 'ready',
  rev: 1,
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-04T12:00:00Z',
  deleted_at: null,
  versioned: true,
  setups: [{ printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PETG', print_seconds: 6300, filament_g: 37, file_id: `${id}-g` }],
  ...over
})

const run = (id: string, over: Partial<LibraryRun> = {}): LibraryRun => ({
  id,
  item_id: 'a',
  version: 1,
  printer_id: 'p1',
  printer_name: 'Boxwood',
  file_name: 'a.gcode',
  started_at: '2026-11-05T10:00:00Z',
  ended_at: null,
  outcome: 'finished',
  progress_pct: null,
  duration_s: null,
  in_library: true,
  item: item('a'),
  ...over
})

describe('Library v3 Yours: cards from your own prints', () => {
  it('a sliced print: Print, its filament, how long and how much, and when it was sliced', () => {
    expect(slicedCard(item('a'), NOW)).toMatchObject({ key: 'sliced:a', title: 'Print a', material: 'PETG', action: 'print', note: 'sliced 2 days ago' })
    expect(slicedCard(item('a'), NOW).facts).toBe('1h 45m · 37 g')
    // No G-code yet: nothing to print from the card.
    expect(slicedCard(item('b', { setups: [] }), NOW).action).toBeNull()
  })

  it('a run: Print again only while its print and version are in the Library; one card per print', () => {
    expect(runCard(run('r1'))).toMatchObject({ action: 'again', note: 'on Boxwood', facts: '' })
    expect(runCard(run('r2', { in_library: false, item: null })).action).toBeNull()
    expect(runCard(run('r3', { outcome: 'failed' })).facts).toBe('Failed')
    const cards = printedCards([run('old', { started_at: '2026-11-01T00:00:00Z' }), run('new'), run('other', { item_id: 'b', item: item('b') })])
    expect(cards.map(c => c.key)).toEqual(['printed:new', 'printed:other'])
  })

  it('Shared by you: live, waiting and refused public shares; not link, withdrawn or expired ones', () => {
    const shares = ownPublicShares({
      shares: [
        { id: 's1', item: 'a', title: 'Hex planter', version: 1, audience: 'public', state: 'approved', expires_at: '2027-01-01T00:00:00Z' },
        { id: 's2', item: 'b', title: 'Link', version: 1, audience: 'link', state: 'approved' },
        { id: 's3', item: 'c', title: 'Withdrawn', version: 1, audience: 'public', state: 'revoked' },
        { id: 's4', item: 'd', title: 'In review', version: 1, audience: 'public', state: 'pending' },
        { id: 's5', item: 'e', title: 'Expired', version: 1, audience: 'public', state: 'approved', expires_at: '2026-11-01T00:00:00Z' },
        { id: 's6', item: 'a', title: 'Twice', version: 2, audience: 'public', state: 'approved' },
        { id: 's8', item: 'f', title: 'Turned down', version: 1, audience: 'public', state: 'rejected', reason: 'No safe way to print it' },
        { id: 's9', item: 'g', title: 'Pending link', version: 1, audience: 'link', state: 'pending' },
        { id: 's10', item: 'h', title: 'Expired review', version: 1, audience: 'public', state: 'pending', expires_at: '2026-11-01T00:00:00Z' },
        { id: 7, item: 'a', audience: 'public' }
      ]
    }, NOW)
    expect(shares.map(s => s.id)).toEqual(['s1', 's4', 's8'])
    expect(sharedCard(shares[0], new Map([['a', item('a')]]))).toMatchObject({ title: 'Hex planter', action: 'print', note: 'Public' })
    expect(sharedCard(shares[0], new Map()).action).toBeNull()
    expect(sharedCard(shares[1], new Map()).note).toBe('Waiting for review')
    expect(sharedCard(shares[2], new Map()).note).toBe('Not approved: No safe way to print it')
    expect(sharedCard({ ...shares[2], reason: undefined }, new Map()).note).toBe('Not approved')
    expect(ownPublicShares(null)).toEqual([])
  })

  it('Shared by you: one card per print, approved over waiting over refused, newest within a state', () => {
    const share = (id: string, state: string, created_at: string) => ({ id, item: 'a', title: id, version: 1, audience: 'public', state, created_at })
    const ids = (list: unknown[]) => ownPublicShares({ shares: list }, NOW).map(s => s.id)
    expect(ids([share('r', 'rejected', '2026-11-05T00:00:00Z'), share('p', 'pending', '2026-11-04T00:00:00Z'), share('ok', 'approved', '2026-11-01T00:00:00Z')])).toEqual(['ok'])
    expect(ids([share('r', 'rejected', '2026-11-05T00:00:00Z'), share('p', 'pending', '2026-11-01T00:00:00Z')])).toEqual(['p'])
    expect(ids([share('old', 'pending', '2026-11-01T00:00:00Z'), share('new', 'pending', '2026-11-03T00:00:00Z')])).toEqual(['new'])
    expect(ids([share('new', 'rejected', '2026-11-03T00:00:00Z'), share('old', 'rejected', '2026-11-01T00:00:00Z')])).toEqual(['new'])
  })

  it('Sliced is every print that is not a design (uploads and phone models too); Designs is what Create made', () => {
    const items = [item('s'), item('u', { origin: 'upload' }), item('d', { origin: 'design', setups: [] }), item('x', { state: 'deleted', deleted_at: '2026-11-05T00:00:00Z' })]
    expect(itemShelf('sliced', items, NOW).map(c => c.key)).toEqual(['sliced:s', 'sliced:u'])
    expect(itemShelf('sliced', items, NOW)[1].note).toBe('saved 2 days ago')
    expect(itemShelf('designs', items, NOW).map(c => [c.key, c.action])).toEqual([['designs:d', 'slice']])
  })

  it('sorts by time, not by how the time is written', () => {
    const cards = [slicedCard(item('a', { updated_at: '2026-11-05T10:00:00Z' }), NOW), slicedCard(item('b', { updated_at: '2026-11-05T10:00:00.500Z' }), NOW)]
    expect(findOwn(cards, '', 'new').map(c => c.key)).toEqual(['sliced:b', 'sliced:a'])
  })

  it('See all finds by name or filament, newest first or by name', () => {
    const cards = [slicedCard(item('b', { name: 'Zeta knob', updated_at: '2026-11-05T00:00:00Z' }), NOW), slicedCard(item('a', { name: 'Alpha clip' }), NOW)]
    expect(findOwn(cards, '', 'new').map(c => c.title)).toEqual(['Zeta knob', 'Alpha clip'])
    expect(findOwn(cards, '', 'name').map(c => c.title)).toEqual(['Alpha clip', 'Zeta knob'])
    expect(findOwn(cards, 'petg', 'new')).toHaveLength(2)
    expect(findOwn(cards, 'clip', 'new').map(c => c.title)).toEqual(['Alpha clip'])
  })
})

function client (over: Record<string, unknown> = {}) {
  return {
    collections: vi.fn(async () => ({ collections: [] })),
    collection: vi.fn(async () => null),
    saved: vi.fn(async () => ({ saves: [], next_cursor: null })),
    runs: vi.fn(async () => ({ runs: [run('r1')], cursor: null })),
    shares: vi.fn(async () => ({ shares: [] })),
    ...over
  }
}

const flush = async () => {
  for (let i = 0; i < 4; i++) {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

/** The synced Library, as store.ts keeps it. */
function synced (items: LibraryItem[]) {
  resetLibrary('fixture')
  libraryState.items = Object.fromEntries(items.map(i => [i.id, i]))
  libraryState.synced = true
}

let wrappers: Array<{ destroy: () => void }> = []
afterEach(() => {
  wrappers.forEach(w => w.destroy())
  wrappers = []
})

describe('Library v3 Yours: the shelves', () => {
  it('shows Sliced, Printed and Saved in that order; Shared and Designs only once there is one', async () => {
    synced([item('a'), item('gone', { state: 'deleted', deleted_at: '2026-11-05T00:00:00Z' })])
    setLibraryClient(client() as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true }, propsData: { printerName: 'Boxwood' } })
    wrappers.push(wrapper)
    await flush()
    const ids = wrapper.findAll('section.mlib-shelf').wrappers.map(w => w.attributes('data-tid'))
    expect(ids).toEqual(['library-collections', 'library-following', 'library-shelf-sliced', 'library-shelf-printed', 'library-saved'])
    expect(wrapper.find('[data-tid="library-shelf-sliced"]').text()).toContain('Print a')
    expect(wrapper.find('[data-tid="library-shelf-sliced"]').text()).not.toContain('Print gone')
    expect(wrapper.find('[data-tid="library-shelf-sliced"]').text()).toContain('Print on Boxwood')
    expect(wrapper.find('[data-tid="library-shelf-printed"]').text()).toContain('Print again')
    expect(wrapper.find('[data-tid="library-shelf-saved-empty"]').exists()).toBe(true)
  })

  it('says what to do on an empty Sliced, and a shelf that failed has Retry while the rest work', async () => {
    synced([])
    let fail = true
    const c = client({
      runs: vi.fn(async () => {
        if (fail) throw new Error('Offline')
        return { runs: [run('r1')], cursor: null }
      })
    })
    setLibraryClient(c as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true } })
    wrappers.push(wrapper)
    await flush()
    expect(wrapper.find('[data-tid="library-shelf-sliced-empty"]').text()).toContain('Slice something')
    await wrapper.find('[data-tid="library-go-slice"]').trigger('click')
    expect(wrapper.emitted('go-slice')).toHaveLength(1)
    expect(wrapper.find('[data-tid="library-shelf-printed-error"]').exists()).toBe(true)
    fail = false
    await wrapper.find('[data-tid="library-shelf-printed-error"]').find('button').trigger('click')
    await flush()
    expect(wrapper.find('[data-tid="library-shelf-printed"]').text()).toContain('Print again')
  })

  it('a card says what to do with it: Print, Print again, or Open its page', async () => {
    synced([item('a')])
    setLibraryClient(client() as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true } })
    wrappers.push(wrapper)
    await flush()
    await wrapper.find('[data-tid="library-own-sliced:a"] [data-tid="library-own-act"]').trigger('click')
    await wrapper.find('[data-tid="library-own-printed:r1"] [data-tid="library-own-act"]').trigger('click')
    await wrapper.find('[data-tid="library-own-sliced:a"] .mcard__pic').trigger('click')
    const acts = wrapper.emitted('own-act')?.map(([card]) => (card as { action: string }).action)
    expect(acts).toEqual(['print', 'again'])
    expect((wrapper.emitted('own-open')?.[0][0] as { key: string }).key).toBe('sliced:a')
    await wrapper.find('[data-tid="library-shelf-sliced-all"]').trigger('click')
    expect(wrapper.emitted('see-all')?.[0]).toEqual(['sliced'])
  })
})

describe('Library v3 Yours: waiting and refused shares', () => {
  const share = (id: string, item: string, state: string, reason?: string) => ({ id, item, title: `Share ${id}`, version: 1, audience: 'public', state, expires_at: '2099-01-01T00:00:00Z', reason })

  it('shows them on Shared by you with their notes; the reason stays text; each opens your own copy', async () => {
    synced([item('a'), item('b'), item('c')])
    setLibraryClient(client({
      shares: vi.fn(async () => ({ shares: [share('s1', 'a', 'approved'), share('s2', 'b', 'pending'), share('s3', 'c', 'rejected', '<img src=x onerror=alert(1)>')] }))
    }) as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true } })
    wrappers.push(wrapper)
    await flush()
    const shelf = wrapper.find('[data-tid="library-shelf-shared"]')
    expect(shelf.find('[data-tid="library-own-shared:s1"]').text()).toContain('Public')
    expect(shelf.find('[data-tid="library-own-shared:s2"]').text()).toContain('Waiting for review')
    expect(shelf.find('[data-tid="library-own-shared:s3"]').text()).toContain('Not approved: <img src=x onerror=alert(1)>')
    expect(shelf.find('img[src="x"]').exists()).toBe(false)
    await shelf.find('[data-tid="library-own-shared:s2"] .mcard__pic').trigger('click')
    const opened = wrapper.emitted('own-open')?.[0][0] as { key: string, shelf: string, item: { id: string } }
    expect([opened.key, opened.shelf, opened.item.id]).toEqual(['shared:s2', 'shared', 'b'])
    expect(wrapper.emitted('open')).toBeUndefined()
  })

  it('shows nothing for link, withdrawn and expired shares', async () => {
    synced([item('a'), item('b'), item('c')])
    setLibraryClient(client({
      shares: vi.fn(async () => ({ shares: [{ ...share('s1', 'a', 'pending'), audience: 'link' }, share('s2', 'b', 'revoked'), { ...share('s3', 'c', 'pending'), expires_at: '2020-01-01T00:00:00Z' }] }))
    }) as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true } })
    wrappers.push(wrapper)
    await flush()
    expect(wrapper.find('[data-tid="library-shelf-shared"]').exists()).toBe(false)
  })
})

describe('Library v3 Yours: keeping up', () => {
  it('reads Printed and Shared again when the Library syncs something new, keeping what is shown meanwhile', async () => {
    synced([item('a')])
    const c = client()
    setLibraryClient(c as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true } })
    wrappers.push(wrapper)
    await flush()
    expect(c.runs).toHaveBeenCalledTimes(1)
    expect(c.shares).toHaveBeenCalledTimes(1)
    libraryState.rev += 1
    await Vue.nextTick()
    expect(wrapper.find('[data-tid="library-shelf-printed"]').text()).toContain('Print again')
    await flush()
    expect(c.runs).toHaveBeenCalledTimes(2)
    expect(c.shares).toHaveBeenCalledTimes(2)
  })

  it('reads your shelves once the Library turns on', async () => {
    synced([item('a')])
    const c = client()
    setLibraryClient(c as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true }, propsData: { own: false } })
    wrappers.push(wrapper)
    await flush()
    expect(c.runs).not.toHaveBeenCalled()
    await wrapper.setProps({ own: true })
    await flush()
    expect(c.runs).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[data-tid="library-shelf-printed"]').text()).toContain('Print again')
  })

  it('says why Sliced could not be read when the first sync failed, instead of loading for ever', async () => {
    resetLibrary('fixture')
    libraryState.error = 'The Library didn\'t answer.'
    setLibraryClient(client() as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true } })
    wrappers.push(wrapper)
    await flush()
    expect(wrapper.find('[data-tid="library-shelf-sliced-error"]').text()).toContain('didn\'t answer')
    const grid = mount(LibraryYoursGrid, { stubs: { 'frame-icon': true }, propsData: { source: 'sliced' } })
    wrappers.push(grid)
    await flush()
    expect(grid.find('[data-tid="library-grid-error"]').text()).toContain('didn\'t answer')
  })

  it('Retry on a failed first sync shows loading while it reads again', async () => {
    resetLibrary('fixture')
    libraryState.error = 'Offline'
    setLibraryClient(client() as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true } })
    wrappers.push(wrapper)
    await flush()
    expect(wrapper.find('[data-tid="library-shelf-sliced-error"]').exists()).toBe(true)
    // What refreshLibrary() sets while it reads (store.ts readLibrary).
    libraryState.busy = true
    await Vue.nextTick()
    expect(wrapper.find('[data-tid="library-shelf-sliced-error"]').exists()).toBe(false)
    expect(wrapper.find('[data-tid="library-shelf-sliced"]').attributes('aria-busy')).toBe('true')
  })

  it('See all keeps what it shows when a re-read fails, with Retry above it', async () => {
    let calls = 0
    const runs = vi.fn(async () => {
      if (++calls === 2) throw new Error('Offline')
      return { runs: [run('r1')], cursor: null }
    })
    setLibraryClient(client({ runs }) as never)
    const grid = mount(LibraryYoursGrid, { stubs: { 'frame-icon': true }, propsData: { source: 'printed' } })
    wrappers.push(grid)
    await flush()
    libraryState.rev += 1
    await flush()
    expect(grid.findAll('.mcard')).toHaveLength(1)
    expect(grid.find('[data-tid="library-grid-reread-error"]').exists()).toBe(true)
    await grid.find('[data-tid="library-grid-reread-error"]').find('button').trigger('click')
    await flush()
    expect(grid.find('[data-tid="library-grid-reread-error"]').exists()).toBe(false)
    expect(runs).toHaveBeenCalledTimes(3)
  })

  it('See all keeps Printed on screen while a sync reads it again', async () => {
    let finish: (value: unknown) => void = () => {}
    let calls = 0
    const runs = vi.fn(() => ++calls === 1 ? Promise.resolve({ runs: [run('r1')], cursor: null }) : new Promise(resolve => { finish = resolve }))
    setLibraryClient(client({ runs }) as never)
    const grid = mount(LibraryYoursGrid, { stubs: { 'frame-icon': true }, propsData: { source: 'printed' } })
    wrappers.push(grid)
    await flush()
    libraryState.rev += 1
    await flush()
    expect(runs).toHaveBeenCalledTimes(2)
    expect(grid.findAll('.mcard')).toHaveLength(1)
    finish({ runs: [], cursor: null })
    await flush()
    expect(grid.findAll('.mcard')).toHaveLength(0)
  })
})

describe('Library v3 Yours: Library off', () => {
  it('keeps Saved and Collections, without your own shelves or their reads', async () => {
    synced([item('a')])
    const c = client()
    setLibraryClient(c as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true }, propsData: { own: false } })
    wrappers.push(wrapper)
    await flush()
    expect(wrapper.find('[data-tid="library-saved"]').exists()).toBe(true)
    expect(wrapper.find('[data-tid="library-collections"]').exists()).toBe(true)
    expect(wrapper.find('[data-tid="library-shelf-sliced"]').exists()).toBe(false)
    expect(c.runs).not.toHaveBeenCalled()
  })
})

describe('Library v3 Yours: See all', () => {
  it('Printed follows the cursor to the end', async () => {
    const runs = vi.fn(async (cursor = '') => cursor ? { runs: [run('r2', { item_id: 'b', item: item('b') })], cursor: null } : { runs: [run('r1')], cursor: 'c1' })
    setLibraryClient(client({ runs }) as never)
    const wrapper = mount(LibraryYoursGrid, { stubs: { 'frame-icon': true }, propsData: { source: 'printed' } })
    wrappers.push(wrapper)
    await flush()
    expect(runs).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('.mcard')).toHaveLength(2)
  })

  it('lists the whole shelf, searches it, sorts it, and says when nothing matches', async () => {
    synced([item('a', { name: 'Alpha clip' }), item('b', { name: 'Zeta knob', updated_at: '2026-11-05T00:00:00Z' })])
    setLibraryClient(client() as never)
    const wrapper = mount(LibraryYoursGrid, { stubs: { 'frame-icon': true }, propsData: { source: 'sliced' } })
    wrappers.push(wrapper)
    await flush()
    const titles = () => wrapper.findAll('.mcard__title').wrappers.map(w => w.text())
    expect(wrapper.find('h1').text()).toBe('Sliced')
    expect(titles()).toEqual(['Zeta knob', 'Alpha clip'])
    await wrapper.find('[data-tid="library-grid-sort-name"]').trigger('click')
    expect(titles()).toEqual(['Alpha clip', 'Zeta knob'])
    await wrapper.find('[data-tid="library-grid-find"]').setValue('zzz')
    expect(wrapper.find('[data-tid="library-grid-nomatch"]').exists()).toBe(true)
    await wrapper.find('[data-tid="library-grid-nomatch"]').find('button').trigger('click')
    expect(titles()).toHaveLength(2)
    await wrapper.find('[data-tid="library-grid-back"]').trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })
})
