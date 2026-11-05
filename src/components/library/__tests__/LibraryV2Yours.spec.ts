import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import LibraryYoursShelves from '../v2/LibraryYoursShelves.vue'
import LibraryQuickLook from '../v2/LibraryQuickLook.vue'
import { setLibraryClient } from '@/services/library/store'
import { saveCard, type ShelfCard } from '@/services/library/shelves'
import type { CommunitySave } from '@/services/library/api'

const flush = async () => {
  for (let i = 0; i < 6; i++) {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

const save = (id: string, over: Partial<CommunitySave> = {}): CommunitySave => ({
  id: `s-${id}`,
  target: { kind: 'publication', id },
  card: { title: `Print ${id}`, thumbnail_url: `https://models.muon3d.com/img/${id}.png`, creator: 'Okoro', available: true },
  created_at: '2026-11-05T10:00:00Z',
  ...over
})

function fakeClient () {
  const collections = [{ id: 'c1', name: 'Workshop', description: '', visibility: 'private' as const, created_at: '', updated_at: '', item_count: 2 }]
  return {
    collections: vi.fn(async () => ({ collections })),
    saved: vi.fn(async () => ({ saves: [save('p1'), save('p2')], next_cursor: null })),
    collection: vi.fn(async (id: string) => ({ ...collections[0], id, items: [{ save_id: 's-p3', target: { kind: 'publication', id: 'p3' }, card: save('p3').card }] })),
    createCollection: vi.fn(async (name: string) => ({ ...collections[0], id: 'c2', name, item_count: 0 })),
    savesOf: vi.fn(async () => ({ saves: [] as Array<{ target: { kind: string, id: string }, save_id: string }> })),
    save: vi.fn(async (id: string) => save(id)),
    unsave: vi.fn(async () => null),
    addToCollection: vi.fn(async () => null)
  }
}

const stubs = { 'frame-icon': true }
let wrappers: Array<{ destroy: () => void }> = []
afterEach(() => {
  wrappers.forEach(w => w.destroy())
  wrappers = []
})

describe('Library v2: a save as a card', () => {
  it('prints a saved public print, and opens a saved catalogue print where it lives', () => {
    expect(saveCard(save('p1'))).toMatchObject({ kind: 'publication', id: 'p1', title: 'Print p1', href: 'https://library.muon3d.com/p/p1' })
    const elsewhere = saveCard(save('x', { target: { kind: 'source', source: 'printables', id: 'x' }, card: { title: 'Benchy', url: 'https://www.printables.com/model/3161', available: true } }))
    expect(elsewhere).toMatchObject({ kind: 'catalogue', href: 'https://www.printables.com/model/3161' })
  })

  it('leaves out what is no longer available, and links that are not https', () => {
    expect(saveCard(save('p1', { card: { title: 'Gone', available: false } }))).toBeNull()
    expect(saveCard(save('x', { target: { kind: 'source', id: 'x' }, card: { title: 'Bad', url: 'javascript:alert(1)', available: true } }))).toBeNull()
  })
})

describe('Library v2: Yours shelves', () => {
  it('shows your collections with a mosaic, and Saved; opening a collection shows its prints', async () => {
    const client = fakeClient()
    setLibraryClient(client as never)
    const wrapper = mount(LibraryYoursShelves, { stubs })
    wrappers.push(wrapper)
    await flush()
    expect(wrapper.find('[data-tid="library-collection-c1"]').text()).toContain('Workshop')
    expect(wrapper.findAll('[data-tid="library-collection-c1"] img').length).toBe(1)
    expect(wrapper.find('[data-tid="library-saved"]').text()).toContain('Print p1')

    await wrapper.find('[data-tid="library-collection-c1"]').trigger('click')
    await flush()
    expect(client.collection).toHaveBeenCalledWith('c1')
    expect(wrapper.find('[data-tid="library-collection-open"]').text()).toContain('Print p3')
    expect(wrapper.find('[data-tid="library-saved"]').exists()).toBe(false)
  })

  it('makes a new collection by name', async () => {
    const client = fakeClient()
    setLibraryClient(client as never)
    const wrapper = mount(LibraryYoursShelves, { stubs })
    wrappers.push(wrapper)
    await flush()
    await wrapper.find('[data-tid="library-collection-new"]').trigger('click')
    await wrapper.find('[data-tid="library-collection-name"]').setValue('  Gifts ')
    await wrapper.find('form').trigger('submit')
    await flush()
    expect(client.createCollection).toHaveBeenCalledWith('Gifts')
    expect(wrapper.find('[data-tid="library-collection-c2"]').text()).toContain('Gifts')
  })
})

describe('Library v2: the heart and Add to… in the quick look', () => {
  const card = { ...saveCard(save('p1')), key: 'pub:p1' } as ShelfCard
  const detail = { title: 'Print p1', version: 1, files: [] }

  function look (client: ReturnType<typeof fakeClient>) {
    setLibraryClient(client as never)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(detail), { status: 200 })))
    const wrapper = mount(LibraryQuickLook, {
      stubs,
      propsData: { card, signedIn: true, collections: [{ id: 'c1', name: 'Workshop', item_count: 0 }] },
      attachTo: document.body
    })
    wrappers.push(wrapper)
    return wrapper
  }

  it('saves on the heart and unsaves on the second tap', async () => {
    const client = fakeClient()
    const wrapper = look(client)
    await flush()
    const heart = () => document.querySelector('[data-tid="library-quick-look-save"]') as HTMLButtonElement
    expect(heart().getAttribute('aria-pressed')).toBe('false')
    heart().click()
    await flush()
    expect(client.save).toHaveBeenCalledWith('p1')
    expect(heart().getAttribute('aria-pressed')).toBe('true')
    heart().click()
    await flush()
    expect(client.unsave).toHaveBeenCalledWith('s-p1')
    expect(wrapper.emitted('saved')?.length).toBe(2)
  })

  it('adds to a collection, saving the print first when it was not saved', async () => {
    const client = fakeClient()
    look(client)
    await flush()
    const select = document.querySelector('[data-tid="library-quick-look-collect"]') as HTMLSelectElement
    select.value = 'c1'
    select.dispatchEvent(new Event('change'))
    await flush()
    expect(client.save).toHaveBeenCalledWith('p1')
    expect(client.addToCollection).toHaveBeenCalledWith('c1', 's-p1')
    expect(document.body.textContent).toContain('Added to Workshop.')
  })

  it('shows no heart signed out', async () => {
    const client = fakeClient()
    setLibraryClient(client as never)
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(detail), { status: 200 })))
    const wrapper = mount(LibraryQuickLook, { stubs, propsData: { card, signedIn: false }, attachTo: document.body })
    wrappers.push(wrapper)
    await flush()
    expect(document.querySelector('[data-tid="library-quick-look-save"]')).toBeNull()
    expect(client.savesOf).not.toHaveBeenCalled()
  })
})
