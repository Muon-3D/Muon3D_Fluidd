import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import MuonLibrary from '../v2/MuonLibrary.vue'
import LibraryBrowsePage from '../v2/LibraryBrowsePage.vue'
import LibrarySearchBox from '../v2/LibrarySearchBox.vue'
import LibraryModelCard from '../v2/LibraryModelCard.vue'
import { cardSaves, clearCardSaves } from '@/services/library/card-saves'
import { setLibraryClient } from '@/services/library/store'
import { cloudState } from '@/services/muon-cloud/state'
import type { ShelfCard } from '@/services/library/shelves'

const card = (id: string): ShelfCard => ({
  key: `pub:${id}`, kind: 'publication', id, slug: id, title: `Print ${id}`, picture: null, creator: 'Okoro', handle: 'okoro',
  makes: 1, remixes: 0, saves: 0, facts: '', m1: false, tags: [], remixOf: null, makeOf: null, createdAt: null, href: '', category: 'home'
})

const settle = async () => { for (let i = 0; i < 4; i++) { await Vue.nextTick(); await new Promise(resolve => setTimeout(resolve, 0)) } }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

let wrapper: ReturnType<typeof mount> | null = null
beforeEach(() => { clearCardSaves() })
afterEach(() => {
  wrapper?.destroy(); wrapper = null
  vi.unstubAllGlobals()
  cloudState.account = null
  clearCardSaves()
})

describe('Library review: Browse on the all-categories page', () => {
  it('shows the category tiles without filters, a grid or an empty state under them', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => String(url).includes('/categories')
      ? json({ categories: [{ slug: 'home', name: 'Home', description: '', count: 3 }] })
      : json({ items: [], next_cursor: null })))
    wrapper = mount(LibraryBrowsePage, { stubs: { 'frame-icon': true }, propsData: { category: null, query: '' } })
    await settle()
    expect(wrapper.find('[data-tid="library-categories"]').exists()).toBe(true)
    expect(wrapper.find('[data-tid="library-category-home"]').text()).toContain('Home')
    expect(wrapper.find('.mc-browse__filters').exists()).toBe(false)
    expect(wrapper.find('[data-tid="library-grid-empty"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Make room for something new')
  })

  it('names an unreachable Library as Discover does, not "Failed to fetch"', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('/v1/public/categories?') || String(url).endsWith('/v1/public/categories')) return json({ categories: [] })
      throw new TypeError('Failed to fetch')
    }))
    wrapper = mount(LibraryBrowsePage, { stubs: { 'frame-icon': true }, propsData: { category: 'home', query: '' } })
    await settle()
    expect(wrapper.text()).toContain('The Library couldn\'t be reached. Check the connection and try again.')
    expect(wrapper.text()).not.toContain('Failed to fetch')
  })

  it('does not claim "Nothing found" when only the newest models were searched', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const text = String(url)
      if (text.includes('/v1/public/search')) return new Response('', { status: 404 })
      if (text.includes('/v1/public/categories')) return json({ categories: [] })
      return json({ items: [], next_cursor: null })
    }))
    wrapper = mount(LibraryBrowsePage, { stubs: { 'frame-icon': true }, propsData: { category: null, query: 'dragon' } })
    await settle()
    expect(wrapper.text()).toContain('No match among the newest models')
    expect(wrapper.text()).not.toContain('Nothing found for')
  })
})

describe('Library review: the "Search all for" button', () => {
  it('submits once for a mouse click, and the mousedown only keeps the focus', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ items: [] })))
    wrapper = mount(LibrarySearchBox, { stubs: { 'frame-icon': true }, propsData: { value: '' } })
    const vm = wrapper.vm as unknown as { draft: string, focused: boolean }
    vm.draft = 'hook'; vm.focused = true
    await Vue.nextTick()
    const button = wrapper.find('button.mlib-link')
    expect(button.text()).toBe('Search all for “hook”')
    await button.trigger('mousedown')
    expect(wrapper.emitted('search')).toBeUndefined()
    await button.trigger('click')
    expect(wrapper.emitted('search')).toEqual([['hook']])
  })
})

describe('Library review: the heart on a card', () => {
  it('drops "Sign in to save this print." once you are signed in', async () => {
    const context = Vue.observable({ signedIn: false })
    const signIn = vi.fn()
    const client = { savesOf: vi.fn(async () => ({ saves: [] })) }
    setLibraryClient(client as never)
    wrapper = mount(LibraryModelCard, {
      stubs: { 'frame-icon': true },
      propsData: { card: card('p1') },
      provide: { libraryCardContext: () => ({ volume: null, printerName: null, signedIn: context.signedIn, signIn }) }
    })
    await wrapper.find('[data-tid="library-card-save"]').trigger('click')
    expect(wrapper.find('.mcard__note').text()).toBe('Sign in to save this print.')
    expect(signIn).toHaveBeenCalledTimes(1)
    context.signedIn = true
    await settle()
    expect(wrapper.find('.mcard__note').exists()).toBe(false)
  })
})

describe('Library review: card hearts follow the account and the save', () => {
  const library = async (client: Record<string, unknown>) => {
    setLibraryClient(client as never)
    vi.stubGlobal('fetch', vi.fn(async () => json({ items: [], next_cursor: null, m1_ready: [], trending: [], new: [] })))
    wrapper = mount(MuonLibrary, {
      stubs: { 'frame-icon': true, 'library-yours-shelves': true },
      propsData: { tab: 'discover', signedIn: true },
      mocks: { $vuetify: { breakpoint: { xsOnly: false } } }
    })
    await settle()
    return wrapper.vm as unknown as { onSaved: () => void }
  }

  it('clears every heart when a different account signs in', async () => {
    await library({ collections: vi.fn(async () => ({ collections: [] })), savesOf: vi.fn(async () => ({ saves: [] })) })
    cloudState.account = { id: 'account-a' } as never
    await settle()
    Vue.set(cardSaves.ids, 'p1', 'save-1')
    Vue.set(cardSaves.ids, 'catalogue:cube', 'save-2')
    cloudState.account = { id: 'account-b' } as never
    await settle()
    expect(cardSaves.ids).toEqual({})
  })

  it('re-reads every heart after a save, publications and catalogue models alike', async () => {
    const savesOf = vi.fn(async () => ({ saves: [] }))
    const vm = await library({ collections: vi.fn(async () => ({ collections: [] })), savesOf })
    Vue.set(cardSaves.ids, 'p1', 'save-1')
    Vue.set(cardSaves.ids, 'p2', null)
    Vue.set(cardSaves.ids, 'catalogue:cube', 'save-2')
    vm.onSaved()
    await settle()
    expect(savesOf).toHaveBeenCalledWith(['p1', 'p2'])
    expect(savesOf).toHaveBeenCalledWith(['cube'], 'catalogue')
  })
})
