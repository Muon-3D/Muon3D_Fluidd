import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'
import LibraryCollectionPage, { droppedOn, moved, saveIdOf } from '../v2/LibraryCollectionPage.vue'
import { setLibraryClient } from '@/services/library/store'

const card = (id: string) => ({ title: `Print ${id}`, thumbnail_url: `https://models.muon3d.com/x/${id}.png`, creator: 'Okoro', url: `/p/print-${id}`, availability: 'available' })
const item = (id: string) => ({ save_id: `s-${id}`, target: { kind: 'publication', id }, card: card(id) })

function client (over: Record<string, unknown> = {}) {
  const detail = { id: 'c1', name: 'Workshop', description: '', visibility: 'private' as const, created_at: '', updated_at: '2026-11-05T12:00:00Z', item_count: 3, items: [item('a'), item('b'), item('c')] }
  return {
    detail,
    collection: vi.fn(async () => detail),
    saved: vi.fn(async () => ({ saves: [{ id: 's-a', created_at: '2026-11-01T00:00:00Z' }, { id: 's-b', created_at: '2026-11-03T00:00:00Z' }, { id: 's-c', created_at: '2026-11-02T00:00:00Z' }], next_cursor: null })),
    updateCollection: vi.fn(async (_id: string, patch: object) => ({ ...detail, ...patch })),
    deleteCollection: vi.fn(async () => null),
    reorderCollection: vi.fn(async () => null),
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

async function page (c = client()) {
  setLibraryClient(c as never)
  const wrapper = mount(LibraryCollectionPage, { stubs: { 'frame-icon': true }, propsData: { collectionId: 'c1', printerName: 'Boxwood' }, attachTo: document.body })
  wrappers.push(wrapper)
  await flush()
  return wrapper
}

const titles = (w: Awaited<ReturnType<typeof page>>) => w.findAll('.mcard__title').wrappers.map(x => x.text())

describe('Library v3 collection: your order', () => {
  it('moves one place, and a drop puts it where it landed', () => {
    expect(moved(['a', 'b', 'c'], 'c', -1)).toEqual(['a', 'c', 'b'])
    expect(moved(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c'])
    expect(droppedOn(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'c', 'a'])
    expect(droppedOn(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b'])
    expect(saveIdOf({ key: 'save:s-a' })).toBe('s-a')
  })

  it('shows its name, how many, who can see it, and the prints in your order; Recent and Name only sort', async () => {
    const w = await page()
    expect(w.find('[data-tid="library-collection-title"]').text()).toBe('Workshop')
    expect(w.find('[data-tid="library-collection-line"]').text()).toMatch(/^3 prints · private/)
    expect(titles(w)).toEqual(['Print a', 'Print b', 'Print c'])
    await w.find('[data-tid="library-collection-sort-recent"]').trigger('click')
    expect(titles(w)).toEqual(['Print b', 'Print c', 'Print a'])
    await w.find('[data-tid="library-collection-sort-name"]').trigger('click')
    expect(titles(w)).toEqual(['Print a', 'Print b', 'Print c'])
  })

  it('Alt + → moves a print and sends the whole new order; a refusal puts it back and says so', async () => {
    const c = client()
    const w = await page(c)
    await w.find('[data-tid="library-collection-cell-0"]').trigger('keydown', { key: 'ArrowRight', altKey: true })
    await flush()
    expect(titles(w)).toEqual(['Print b', 'Print a', 'Print c'])
    expect(c.reorderCollection).toHaveBeenCalledWith('c1', ['s-b', 's-a', 's-c'])

    c.reorderCollection.mockRejectedValueOnce(new Error('No'))
    await w.find('[data-tid="library-collection-cell-2"]').trigger('keydown', { key: 'ArrowLeft', altKey: true })
    await flush()
    expect(titles(w)).toEqual(['Print b', 'Print a', 'Print c'])
    expect(w.find('[data-tid="library-collection-note"]').exists()).toBe(true)
  })

  it('does not reorder while sorted by Recent or Name', async () => {
    const c = client()
    const w = await page(c)
    await w.find('[data-tid="library-collection-sort-name"]').trigger('click')
    await w.find('[data-tid="library-collection-cell-0"]').trigger('keydown', { key: 'ArrowRight', altKey: true })
    await flush()
    expect(c.reorderCollection).not.toHaveBeenCalled()
  })
})

describe('Library v3 collection: name, who can see it, delete', () => {
  it('Public and Rename change it, and the tiles hear about it', async () => {
    const c = client()
    const w = await page(c)
    await w.find('[data-tid="library-collection-public"]').trigger('click')
    await flush()
    expect(c.updateCollection).toHaveBeenCalledWith('c1', { visibility: 'public' })
    expect(w.find('[data-tid="library-collection-public"]').attributes('aria-pressed')).toBe('true')
    await w.find('[data-tid="library-collection-rename"]').trigger('click')
    await flush()
    await w.find('[data-tid="library-collection-rename-input"]').setValue('Garage')
    await w.find('form').trigger('submit')
    await flush()
    expect(c.updateCollection).toHaveBeenLastCalledWith('c1', { name: 'Garage' })
    expect(w.find('[data-tid="library-collection-title"]').text()).toBe('Garage')
    expect(w.emitted('changed')).toHaveLength(2)
  })

  it('Delete sits in ··· and asks first; Keep it keeps it', async () => {
    const c = client()
    const w = await page(c)
    expect(w.find('[data-tid="library-collection-delete"]').exists()).toBe(false)
    await w.find('[data-tid="library-collection-more"]').trigger('click')
    await w.find('[data-tid="library-collection-delete"]').trigger('click')
    expect(w.find('[data-tid="library-collection-confirm"]').text()).toContain('The prints in it stay saved')
    await w.find('[data-tid="library-collection-confirm"]').findAll('button').at(1).trigger('click')
    expect(c.deleteCollection).not.toHaveBeenCalled()
    await w.find('[data-tid="library-collection-more"]').trigger('click')
    await w.find('[data-tid="library-collection-delete"]').trigger('click')
    await w.find('[data-tid="library-collection-confirm-delete"]').trigger('click')
    await flush()
    expect(c.deleteCollection).toHaveBeenCalledWith('c1')
    expect(w.emitted('back')).toHaveLength(1)
  })

  it('says what to do when it is empty, and why when it could not be read', async () => {
    const empty = await page(client({ collection: vi.fn(async () => ({ id: 'c1', name: 'Empty', description: '', visibility: 'private', created_at: '', updated_at: '', item_count: 0, items: [] })) }))
    expect(empty.find('[data-tid="library-collection-empty"]').text()).toContain('Add a print from its quick look')
    const failed = await page(client({ collection: vi.fn(async () => { throw new Error('Offline') }) }))
    expect(failed.find('[data-tid="library-collection-error"]').exists()).toBe(true)
  })
})
