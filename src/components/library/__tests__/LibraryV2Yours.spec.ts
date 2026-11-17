import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import LibraryYoursShelves from '../v2/LibraryYoursShelves.vue'
import LibraryQuickLook from '../v2/LibraryQuickLook.vue'
import MuonLibrary from '../v2/MuonLibrary.vue'
import { setLibraryClient } from '@/services/library/store'
import { savedRows, type CommunitySave } from '@/services/library/api'
import { saveCard, type ShelfCard } from '@/services/library/shelves'

const flush = async () => {
  for (let i = 0; i < 8; i++) {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

// As the model service answers (src/saves.rs `Card`): a publication's card has
// no picture and a relative /p/<slug> link; a source's target has external_id.
const publicationSave = (id: string, slug = `slug-${id}`): CommunitySave => ({
  id: `s-${id}`,
  target: { kind: 'publication', id },
  card: { title: `Print ${id}`, thumbnail_url: null, creator: 'okoro', source: 'community', availability: 'available', url: `/p/${slug}` },
  created_at: '2026-11-05T10:00:00Z'
})
const sourceSave: CommunitySave = {
  id: 's-x',
  target: { kind: 'source', source: 'printables', external_id: '3161' },
  card: { title: 'Benchy', thumbnail_url: 'https://media.printables.com/benchy.png', creator: null, source: 'printables', availability: 'available', url: 'https://www.printables.com/model/3161' },
  created_at: '2026-11-05T10:00:00Z'
}
const gone: CommunitySave = {
  id: 's-gone',
  target: { kind: 'publication', id: 'gone' },
  card: { title: 'No longer available', thumbnail_url: null, creator: null, source: 'community', availability: 'unavailable', url: null },
  created_at: '2026-11-05T10:00:00Z'
}

/** A publication's page, which is where a saved one's picture comes from. */
function publicFetch () {
  return vi.fn(async (url: string) => {
    const id = decodeURIComponent(String(url).split('/v1/public/publications/')[1] ?? '')
    return new Response(JSON.stringify({ title: `Print ${id}`, version: 1, files: [], images: [{ id: 'i', name: 'Image 1', format: 'png', size_bytes: 1, url: `https://library.muon3d.com/models/v1/public/publications/${id}/images/i` }] }), { status: 200 })
  })
}

function fakeClient () {
  const collections = [{ id: 'c1', name: 'Workshop', description: '', visibility: 'private' as const, created_at: '', updated_at: '', item_count: 1 }]
  return {
    collections: vi.fn(async () => ({ collections })),
    saved: vi.fn(async () => ({ saves: [publicationSave('p1'), sourceSave, gone], next_cursor: null })),
    collection: vi.fn(async (id: string) => ({ ...collections[0], id, items: [{ save_id: 's-p3', target: { kind: 'publication', id: 'p3' }, card: publicationSave('p3').card }] })),
    createCollection: vi.fn(async (name: string) => ({ ...collections[0], id: 'c2', name, item_count: 0 })),
    savesOf: vi.fn(async () => ({ saves: [] as Array<{ target: { kind: string, id: string }, save_id: string }> })),
    save: vi.fn(async (id: string) => publicationSave(id)),
    unsave: vi.fn(async () => null),
    addToCollection: vi.fn(async () => null),
    // Yours v3's own shelves: empty here (LibraryV3Yours.spec covers them).
    sliced: vi.fn(async () => ({ items: [], rev: 1, reset: false, more: false })),
    designs: vi.fn(async () => ({ items: [], rev: 1, reset: false, more: false })),
    runs: vi.fn(async () => ({ runs: [], cursor: null })),
    shares: vi.fn(async () => ({ shares: [] }))
  }
}

const stubs = { 'frame-icon': true }
let wrappers: Array<{ destroy: () => void }> = []
afterEach(() => {
  wrappers.forEach(w => w.destroy())
  wrappers = []
  vi.unstubAllGlobals()
})

describe('Library v2: a save as a card, as the service sends it', () => {
  it('prints a saved public print, linked by its slug', () => {
    expect(saveCard(publicationSave('p1', 'spiral-vase'))).toMatchObject({ kind: 'publication', id: 'p1', slug: 'spiral-vase', title: 'Print p1', href: 'https://library.muon3d.com/p/spiral-vase', picture: null })
  })

  it('opens a saved source print where it lives', () => {
    expect(saveCard(sourceSave)).toMatchObject({ kind: 'catalogue', id: '3161', href: 'https://www.printables.com/model/3161', picture: 'https://media.printables.com/benchy.png' })
  })

  it('reads a slug it can\'t decode as written, instead of failing the shelf', () => {
    expect(saveCard(publicationSave('p1', 'bad%E0%A4'))?.slug).toBe('bad%E0%A4')
  })

  it('leaves out what is no longer available, and links that are not https', () => {
    expect(saveCard(gone)).toBeNull()
    expect(saveCard({ ...sourceSave, card: { ...sourceSave.card, url: 'javascript:alert(1)' } })).toBeNull()
  })

  it('reads availability for Control\'s Saved section too', () => {
    expect(savedRows({ saves: [publicationSave('p1'), gone], next_cursor: null }).map(row => row.available)).toEqual([true, false])
  })
})

describe('Library v2: Yours shelves', () => {
  it('shows Saved with each public print\'s picture from its page; a collection tile opens its page', async () => {
    const client = fakeClient()
    setLibraryClient(client as never)
    vi.stubGlobal('fetch', publicFetch())
    const collections = (await client.collections()).collections
    const wrapper = mount(LibraryYoursShelves, { stubs, propsData: { collections } })
    wrappers.push(wrapper)
    await flush()
    const saved = wrapper.find('[data-tid="library-saved"]')
    expect(saved.text()).toContain('Print p1')
    expect(saved.text()).toContain('Benchy')
    expect(saved.text()).not.toContain('No longer available')
    expect(saved.find('img').attributes('src')).toBe('https://library.muon3d.com/models/v1/public/publications/p1/images/i')
    expect(wrapper.findAll('[data-tid="library-collection-c1"] img').length).toBe(1)

    // v3: a tile opens the collection's own page (the host keeps it in the address).
    await wrapper.find('[data-tid="library-collection-c1"]').trigger('click')
    expect(wrapper.emitted('open-collection')).toEqual([['c1']])
  })

  it('reads each collection again after a change (its mosaic follows), and says when collections couldn\'t be read', async () => {
    const client = fakeClient()
    setLibraryClient(client as never)
    vi.stubGlobal('fetch', publicFetch())
    const collections = (await client.collections()).collections
    const wrapper = mount(LibraryYoursShelves, { stubs, propsData: { collections } })
    wrappers.push(wrapper)
    await flush()
    const members = () => (wrapper.vm as unknown as { members: Record<string, Array<{ title: string }>> }).members.c1.map(c => c.title)
    expect(members()).toEqual(['Print p3'])
    // p3 was unsaved elsewhere and p4 added: the tile follows after refresh().
    client.collection.mockImplementation(async (id: string) => ({ ...collections[0], id, items: [{ save_id: 's-p4', target: { kind: 'publication', id: 'p4' }, card: publicationSave('p4').card }] }))
    await (wrapper.vm as unknown as { refresh: () => Promise<void> }).refresh()
    await flush()
    expect(members()).toEqual(['Print p4'])

    await wrapper.setProps({ collections: [], collectionsError: 'The Library didn\'t answer.' })
    expect(wrapper.find('[data-tid="library-yours-error"]').text()).toContain('didn\'t answer')
  })

  it('makes a new collection by name, then asks for the list again', async () => {
    const client = fakeClient()
    setLibraryClient(client as never)
    vi.stubGlobal('fetch', publicFetch())
    const wrapper = mount(LibraryYoursShelves, { stubs, propsData: { collections: [] } })
    wrappers.push(wrapper)
    await flush()
    await wrapper.find('[data-tid="library-collection-new"]').trigger('click')
    await wrapper.find('[data-tid="library-collection-name"]').setValue('  Gifts ')
    await wrapper.find('form').trigger('submit')
    await flush()
    expect(client.createCollection).toHaveBeenCalledWith('Gifts')
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })
})

describe('Library v2: the heart and Add to… in the quick look', () => {
  const card = { ...saveCard(publicationSave('p1')), key: 'pub:p1' } as ShelfCard

  function look (client: ReturnType<typeof fakeClient>, propsData: Record<string, unknown>) {
    setLibraryClient(client as never)
    vi.stubGlobal('fetch', publicFetch())
    const wrapper = mount(LibraryQuickLook, { stubs, propsData: { card, ...propsData }, attachTo: document.body })
    wrappers.push(wrapper)
    return wrapper
  }

  it('saves on the heart and unsaves on the second tap, keeping focus on it', async () => {
    const client = fakeClient()
    const wrapper = look(client, { signedIn: true })
    await flush()
    const heart = () => document.querySelector('[data-tid="library-quick-look-save"]') as HTMLButtonElement
    expect(heart().getAttribute('aria-pressed')).toBe('false')
    heart().focus()
    heart().click()
    expect(heart().disabled).toBe(false)
    await flush()
    expect(client.save).toHaveBeenCalledWith('p1')
    expect(heart().getAttribute('aria-pressed')).toBe('true')
    expect(document.activeElement).toBe(heart())
    heart().click()
    await flush()
    expect(client.unsave).toHaveBeenCalledWith('s-p1')
    expect(wrapper.emitted('saved')?.length).toBe(2)
  })

  it('a tap on the heart wins over a lookup that answers after it', async () => {
    const client = fakeClient()
    let answer: (v: { saves: Array<{ target: { kind: string, id: string }, save_id: string }> }) => void = () => {}
    client.savesOf.mockImplementation(() => new Promise(resolve => { answer = resolve }))
    look(client, { signedIn: true })
    await flush()
    ;(document.querySelector('[data-tid="library-quick-look-save"]') as HTMLButtonElement).click()
    await flush()
    answer({ saves: [] })
    await flush()
    expect((document.querySelector('[data-tid="library-quick-look-save"]') as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true')
  })

  it('adds to a collection, saving the print first when it was not saved', async () => {
    const client = fakeClient()
    look(client, { signedIn: true, collections: [{ id: 'c1', name: 'Workshop', item_count: 0 }] })
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
    look(client, { signedIn: false })
    await flush()
    expect(document.querySelector('[data-tid="library-quick-look-save"]')).toBeNull()
    expect(client.savesOf).not.toHaveBeenCalled()
  })
})

describe('Library v2: collections reach Add to… from Discover', () => {
  it('reads your collections signed in, so a quick look opened on Discover offers them', async () => {
    const client = fakeClient()
    setLibraryClient(client as never)
    // Discover's own reads answer nothing; the quick look reads the print.
    vi.stubGlobal('fetch', vi.fn(async (url: string) => String(url).includes('/v1/public/publications/')
      ? publicFetch()(url)
      : new Response(JSON.stringify({ items: [], next_cursor: null, m1_ready: [], trending: [], new: [] }), { status: 200 })))
    const wrapper = mount(MuonLibrary, {
      stubs: { ...stubs, 'library-yours-shelves': true },
      propsData: { signedIn: true, tab: 'discover' },
      mocks: { $vuetify: { breakpoint: { xsOnly: false } } },
      attachTo: document.body
    })
    wrappers.push(wrapper)
    await flush()
    expect(client.collections).toHaveBeenCalled()
    ;(wrapper.vm as unknown as { open: (card: ShelfCard) => void }).open({ ...saveCard(publicationSave('p1'))!, key: 'pub:p1' })
    await flush()
    expect(document.querySelector('[data-tid="library-quick-look-collect"]')?.textContent).toContain('Workshop')
  })
})
