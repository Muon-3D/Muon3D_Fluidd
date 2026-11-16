import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LibraryModelCard from '../v2/LibraryModelCard.vue'
import LibraryShelf from '../v2/LibraryShelf.vue'
import LibraryState from '../v2/LibraryState.vue'
import type { ShelfCard } from '@/services/library/shelves'

const stubs = { 'frame-icon': true }

const card = (over: Partial<ShelfCard> = {}): ShelfCard => ({
  key: 'pub:p1',
  kind: 'publication',
  id: 'p1',
  slug: 'p1',
  title: 'Spiral vase',
  picture: null,
  creator: 'Okoro',
  handle: 'okoro',
  makes: 12,
  remixes: 0,
  saves: 0,
  facts: '',
  m1: false,
  tags: [],
  remixOf: null,
  makeOf: null,
  createdAt: null,
  href: 'https://library.muon3d.com/p/p1',
  ...over
})

describe('Library v3: the card (L1)', () => {
  it('shows the filament it was sliced for as a glass badge, with its colour', () => {
    const wrapper = mount(LibraryModelCard, { stubs, propsData: { card: card({ material: 'PLA', colour: '#4fb3ad' }) } })
    const badge = wrapper.find('[data-tid="library-card-filament"]')
    expect(badge.text()).toBe('PLA')
    expect(badge.find('.mcard__dot').attributes('style')).toContain('background')
  })

  it('shows no filament badge when no source says what it is', () => {
    const wrapper = mount(LibraryModelCard, { stubs, propsData: { card: card() } })
    expect(wrapper.find('[data-tid="library-card-filament"]').exists()).toBe(false)
  })

  it('shows one count: saves when there are any, else makes', () => {
    const saved = mount(LibraryModelCard, { stubs, propsData: { card: card({ saves: 1500, makes: 12 }) } })
    expect(saved.find('.mcard__by').text()).toContain('♡ 1.5k')
    expect(saved.findAll('.mcard__by .mlib-stat')).toHaveLength(1)
    const made = mount(LibraryModelCard, { stubs, propsData: { card: card({ saves: 0, makes: 12 }) } })
    expect(made.findAll('.mcard__by .mlib-stat')).toHaveLength(1)
    expect(made.find('.mcard__by').text()).toContain('12')
  })

  it('puts Print on the picture, naming the printer', () => {
    const wrapper = mount(LibraryModelCard, { stubs, propsData: { card: card(), printerName: 'Boxwood' } })
    expect(wrapper.find('[data-tid="library-card-print"]').attributes('aria-label')).toBe('Print Spiral vase on Boxwood')
  })
})

describe('Library v3: one state tile (section 6)', () => {
  it('says what is missing, how to fix it, and offers one button', async () => {
    const wrapper = mount(LibraryState, { stubs, propsData: { title: 'Nothing sliced yet', text: 'Slice a model and save it.', action: 'Open Slice', tid: 'x' } })
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.findAll('button')).toHaveLength(1)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('action')).toHaveLength(1)
  })

  it('is an alert when it is an error, and an inline callout inside a shelf', () => {
    expect(mount(LibraryState, { stubs, propsData: { kind: 'error', title: 'Down' } }).attributes('role')).toBe('alert')
    expect(mount(LibraryState, { stubs, propsData: { kind: 'callout', title: 'Down', action: 'Retry' } }).classes()).toContain('mstate-callout')
  })
})

describe('Library v3: the shelf (L2)', () => {
  const props = { id: 'popular', title: 'Popular this week', sub: 'Most made', cards: [card(), card({ key: 'pub:p2', id: 'p2' })] }

  it('draws its cards under a header with See all', async () => {
    const wrapper = mount(LibraryShelf, { stubs, propsData: props })
    expect(wrapper.findAll('.mcard')).toHaveLength(2)
    await wrapper.find('[data-tid="library-shelf-popular-all"]').trigger('click')
    expect(wrapper.emitted('see-all')?.[0]).toEqual(['popular'])
  })

  it('shows skeleton cards while it loads, and no See all', () => {
    const wrapper = mount(LibraryShelf, { stubs, propsData: { ...props, loading: true } })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.findAll('.mlib-skeleton-card')).toHaveLength(5)
    expect(wrapper.find('[data-tid="library-shelf-popular-all"]').exists()).toBe(false)
  })

  it('shows its error with Retry instead of cards when it failed', async () => {
    const wrapper = mount(LibraryShelf, { stubs, propsData: { ...props, error: 'The Library didn\'t answer.' } })
    expect(wrapper.findAll('.mcard')).toHaveLength(0)
    await wrapper.find('[data-tid="library-shelf-popular-error"] button').trigger('click')
    expect(wrapper.emitted('retry')?.[0]).toEqual(['popular'])
  })
})
