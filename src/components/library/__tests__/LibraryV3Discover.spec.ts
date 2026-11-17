import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import MuonLibrary from '../v2/MuonLibrary.vue'
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

type Vm = Vue & { popular: ShelfCard[], m1: ShelfCard[], busy: boolean, fits: boolean, chip: string, query: string,
  visibleShelves: Array<{ id: string, cards: ShelfCard[] }>, noMatch: boolean, noMatchTitle: string, clearFilter: () => void }

let wrapper: ReturnType<typeof mount> | null = null
afterEach(() => { wrapper?.destroy(); wrapper = null; vi.unstubAllGlobals() })

function library (props: Record<string, unknown> = {}) {
  // Discover's own reads answer nothing: the test sets the shelves itself.
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ items: [], next_cursor: null, m1_ready: [], trending: [], new: [] }), { status: 200 })))
  wrapper = mount(MuonLibrary, { stubs: { 'frame-icon': true, 'library-yours-shelves': true }, propsData: { tab: 'discover', ...props }, mocks: { $vuetify: { breakpoint: { xsOnly: false } } } })
  return wrapper.vm as unknown as Vm
}

const settle = async () => { for (let i = 0; i < 4; i++) { await Vue.nextTick(); await new Promise(resolve => setTimeout(resolve, 0)) } }

describe('Library v3 Discover: filters', () => {
  it('turns Fits on when the open printer is an M1, and only once', async () => {
    const vm = library({ printerName: 'Boxwood', printerModel: 'Muon3D M1' })
    await settle()
    expect(vm.fits).toBe(true)
    vm.fits = false
    await wrapper!.setProps({ printerName: 'Walnut' })
    expect(vm.fits).toBe(false)
  })

  it('a category shows only that category; a print with none is Other', async () => {
    const vm = library()
    await settle()
    vm.busy = false
    vm.popular = [card('1', { category: 'home' }), card('2', { category: 'workshop' }), card('3', { category: null })]
    vm.chip = 'workshop'
    expect(vm.visibleShelves.find(s => s.id === 'popular')?.cards.map(c => c.id)).toEqual(['2'])
    vm.chip = 'other'
    expect(vm.visibleShelves.find(s => s.id === 'popular')?.cards.map(c => c.id)).toEqual(['3'])
  })

  it('with Fits on, Made for M1 hides when Popular already shows what fits', async () => {
    const vm = library({ printerName: 'Boxwood', printerModel: 'M1' })
    await settle()
    vm.busy = false
    vm.popular = [card('1', { m1: true })]
    vm.m1 = [card('1', { m1: true })]
    expect(vm.visibleShelves.map(s => s.id)).toEqual(['popular'])
    vm.fits = false
    // New has nothing yet: it says so instead of vanishing.
    expect(vm.visibleShelves.map(s => s.id)).toEqual(['popular', 'm1', 'new'])
  })

  it('says what hid everything, and Clear filter resets search, Fits and the category', async () => {
    const vm = library({ printerName: 'Boxwood', printerModel: 'M1' })
    await settle()
    vm.busy = false
    vm.popular = [card('1')]
    vm.chip = 'workshop'
    vm.query = 'robot'
    expect(vm.noMatch).toBe(true)
    expect(vm.noMatchTitle).toBe('Nothing matches "robot" with Fits Boxwood and Workshop')
    vm.clearFilter()
    expect([vm.query, vm.fits, vm.chip]).toEqual(['', false, 'all'])
    expect(vm.noMatch).toBe(false)
  })
})

describe('Library v3: Print on… from a print\'s page', () => {
  it('the link\'s arrival asks with no printer; a click keeps the open one', () => {
    const vm = library({ printerId: 'p-1' }) as unknown as { printFromLook: (card: object, print: object | null, auto?: boolean) => void }
    vm.printFromLook({ id: 'pub-1' }, null, true)
    vm.printFromLook({ id: 'pub-1' }, null)
    const requests = (wrapper as unknown as { emitted: (name: string) => Array<[{ printerId: string | null }]> }).emitted('print')
    expect(requests.map(([request]) => request.printerId)).toEqual([null, 'p-1'])
  })
})

describe('Library v3: community posts', () => {
  it('the print\'s name is a button that opens it, not a placeholder link, and no link in a post is href="#"', async () => {
    const vm = library() as unknown as Vm & { posts: Array<{ card: ShelfCard, verb: string }> }
    await settle()
    vm.posts = [{ card: card('7', { makeOf: { id: 'o', slug: 'original', title: 'Original' } }), verb: 'made' }]
    await settle()
    const by = wrapper!.find('.mlib-post__by')
    expect(by.exists()).toBe(true)
    expect(by.findAll('a').filter(a => a.attributes('href') === '#')).toHaveLength(0)
    const open = by.find('button')
    expect(open.text()).toBe('Print 7')
    // The "from" link is a real one, to the original's page.
    expect(by.find('a').attributes('href')).not.toBe('#')
    await open.trigger('click')
    expect(wrapper!.emitted('open-model')).toEqual([['7']])
  })
})
