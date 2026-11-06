import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import LibraryYoursShelves from '../v2/LibraryYoursShelves.vue'
import LibraryYoursGrid from '../v2/LibraryYoursGrid.vue'
import { setLibraryClient } from '@/services/library/store'
import type { LibraryItem, LibraryRun } from '@/services/library/api'
import { findOwn, printedCards, publicShares, runCard, sharedCard, slicedCard } from '@/services/library/yours'

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

  it('Shared by you: public, live shares only, printed as the item they share', () => {
    const shares = publicShares({
      shares: [
        { id: 's1', item: 'a', title: 'Hex planter', version: 1, audience: 'public', state: 'active' },
        { id: 's2', item: 'a', title: 'Link', version: 1, audience: 'link', state: 'active' },
        { id: 's3', item: 'a', title: 'Gone', version: 1, audience: 'public', state: 'revoked' },
        { id: 7, item: 'a', audience: 'public' }
      ]
    })
    expect(shares.map(s => s.id)).toEqual(['s1'])
    expect(sharedCard(shares[0], new Map([['a', item('a')]]))).toMatchObject({ title: 'Hex planter', action: 'print', note: 'Public' })
    expect(sharedCard(shares[0], new Map()).action).toBeNull()
    expect(publicShares(null)).toEqual([])
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
    sliced: vi.fn(async () => ({ items: [item('a'), item('gone', { state: 'deleted', deleted_at: '2026-11-05T00:00:00Z' })], rev: 1, reset: false, more: false })),
    designs: vi.fn(async () => ({ items: [], rev: 1, reset: false, more: false })),
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

let wrappers: Array<{ destroy: () => void }> = []
afterEach(() => {
  wrappers.forEach(w => w.destroy())
  wrappers = []
})

describe('Library v3 Yours: the shelves', () => {
  it('shows Sliced, Printed and Saved in that order; Shared and Designs only once there is one', async () => {
    setLibraryClient(client() as never)
    const wrapper = mount(LibraryYoursShelves, { stubs: { 'frame-icon': true }, propsData: { printerName: 'Boxwood' } })
    wrappers.push(wrapper)
    await flush()
    const ids = wrapper.findAll('section.mlib-shelf').wrappers.map(w => w.attributes('data-tid'))
    expect(ids).toEqual(['library-collections', 'library-shelf-sliced', 'library-shelf-printed', 'library-saved'])
    expect(wrapper.find('[data-tid="library-shelf-sliced"]').text()).toContain('Print a')
    expect(wrapper.find('[data-tid="library-shelf-sliced"]').text()).not.toContain('Print gone')
    expect(wrapper.find('[data-tid="library-shelf-sliced"]').text()).toContain('Print on Boxwood')
    expect(wrapper.find('[data-tid="library-shelf-printed"]').text()).toContain('Print again')
    expect(wrapper.find('[data-tid="library-shelf-saved-empty"]').exists()).toBe(true)
  })

  it('says what to do on an empty Sliced, and a shelf that failed has Retry while the rest work', async () => {
    let fail = true
    const c = client({
      sliced: vi.fn(async () => ({ items: [], rev: 1, reset: false, more: false })),
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

describe('Library v3 Yours: See all', () => {
  it('lists the whole shelf, searches it, sorts it, and says when nothing matches', async () => {
    setLibraryClient(client({
      sliced: vi.fn(async () => ({ items: [item('a', { name: 'Alpha clip' }), item('b', { name: 'Zeta knob', updated_at: '2026-11-05T00:00:00Z' })], rev: 1, reset: false, more: false }))
    }) as never)
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
