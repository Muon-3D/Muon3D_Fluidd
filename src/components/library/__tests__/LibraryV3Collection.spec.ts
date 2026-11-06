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

  it('Alt + → moves a print and sends the whole new order; a refusal shows what the service holds, and says why', async () => {
    const c = client()
    const w = await page(c)
    await w.find('[data-tid="library-collection-cell-0"]').trigger('keydown', { key: 'ArrowRight', altKey: true })
    await flush()
    expect(titles(w)).toEqual(['Print b', 'Print a', 'Print c'])
    expect(c.reorderCollection).toHaveBeenCalledWith('c1', ['s-b', 's-a', 's-c'])

    // The service now holds b, a, c; the next move is refused, so the page reads it again.
    c.detail.items = [item('b'), item('a'), item('c')]
    c.reorderCollection.mockRejectedValueOnce(new Error('No'))
    await w.find('[data-tid="library-collection-cell-2"]').trigger('keydown', { key: 'ArrowLeft', altKey: true })
    await flush()
    expect(titles(w)).toEqual(['Print b', 'Print a', 'Print c'])
    expect(w.find('[data-tid="library-collection-note"]').exists()).toBe(true)
    // Focus stays on the print that was moved, where it is now.
    expect(document.activeElement?.getAttribute('data-tid')).toBe('library-collection-cell-2')
  })

  it('two quick moves are sent one after the other, so the service ends on the last', async () => {
    const answers: Array<() => void> = []
    const c = client({ reorderCollection: vi.fn(() => new Promise<null>(resolve => answers.push(() => resolve(null)))) })
    const w = await page(c)
    await w.find('[data-tid="library-collection-cell-0"]').trigger('keydown', { key: 'ArrowRight', altKey: true })
    await w.find('[data-tid="library-collection-cell-1"]').trigger('keydown', { key: 'ArrowRight', altKey: true })
    await flush()
    // The second waits for the first.
    expect(c.reorderCollection).toHaveBeenCalledTimes(1)
    answers[0]()
    await flush()
    expect(c.reorderCollection).toHaveBeenCalledTimes(2)
    expect(c.reorderCollection).toHaveBeenLastCalledWith('c1', ['s-b', 's-c', 's-a'])
    answers[1]()
    await flush()
    expect(titles(w)).toEqual(['Print b', 'Print c', 'Print a'])
  })

  it('a reload while a reorder is being sent keeps the order you made', async () => {
    let answer: () => void = () => {}
    const c = client({ reorderCollection: vi.fn(() => new Promise<null>(resolve => { answer = () => resolve(null) })) })
    const w = await page(c)
    await w.find('[data-tid="library-collection-cell-0"]').trigger('keydown', { key: 'ArrowRight', altKey: true })
    await (w.vm as unknown as { load: () => Promise<void> }).load()
    await flush()
    expect(titles(w)).toEqual(['Print b', 'Print a', 'Print c'])
    answer()
    await flush()
    // Sent and answered: a later read applies what the service holds again.
    c.detail.items = [item('c'), item('b'), item('a')]
    await (w.vm as unknown as { load: () => Promise<void> }).load()
    await flush()
    expect(titles(w)).toEqual(['Print c', 'Print b', 'Print a'])
  })

  it('a send from before leaving and coming back does not count against the new one', async () => {
    let answerOld: () => void = () => {}
    const c = client({ reorderCollection: vi.fn(() => new Promise<null>(resolve => { answerOld = () => resolve(null) })) })
    const w = await page(c)
    await w.find('[data-tid="library-collection-cell-0"]').trigger('keydown', { key: 'ArrowRight', altKey: true })
    // Away to c2 and back to c1 while that send is out.
    c.collection.mockResolvedValueOnce({ ...c.detail, id: 'c2', name: 'Gifts', items: [item('x')] })
    await w.setProps({ collectionId: 'c2' })
    await flush()
    await w.setProps({ collectionId: 'c1' })
    await flush()
    // A new reorder, still out; then the old send answers.
    let answerNew: () => void = () => {}
    c.reorderCollection.mockImplementation(() => new Promise<null>(resolve => { answerNew = () => resolve(null) }))
    await w.find('[data-tid="library-collection-cell-1"]').trigger('keydown', { key: 'ArrowRight', altKey: true })
    answerOld()
    await flush()
    // A read now must not put back the service's order over the one still being sent.
    await (w.vm as unknown as { load: () => Promise<void> }).load()
    await flush()
    expect(titles(w)).toEqual(['Print a', 'Print c', 'Print b'])
    answerNew()
    await flush()
  })

  it('a reorder still being sent for one collection does not freeze the next one', async () => {
    const c = client({ reorderCollection: vi.fn(() => new Promise<null>(() => {})) })
    const w = await page(c)
    await w.find('[data-tid="library-collection-cell-0"]').trigger('keydown', { key: 'ArrowRight', altKey: true })
    c.collection.mockResolvedValueOnce({ ...c.detail, id: 'c2', name: 'Gifts', items: [item('x'), item('y')] })
    await w.setProps({ collectionId: 'c2' })
    await flush()
    expect(titles(w)).toEqual(['Print x', 'Print y'])
    c.reorderCollection.mockResolvedValue(null)
    await w.find('[data-tid="library-collection-cell-0"]').trigger('keydown', { key: 'ArrowRight', altKey: true })
    await flush()
    expect(titles(w)).toEqual(['Print y', 'Print x'])
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

  it('Escape leaves Rename without changing it; an answer for another collection is not shown on this one', async () => {
    let answer: (value: object) => void = () => {}
    const c = client({ updateCollection: vi.fn(() => new Promise(resolve => { answer = resolve })) })
    const w = await page(c)
    await w.find('[data-tid="library-collection-rename"]').trigger('click')
    await flush()
    await w.find('[data-tid="library-collection-rename-input"]').setValue('Garage')
    await w.find('[data-tid="library-collection-rename-input"]').trigger('keydown', { key: 'Escape' })
    expect(w.find('[data-tid="library-collection-title"]').text()).toBe('Workshop')
    expect(c.updateCollection).not.toHaveBeenCalled()

    await w.find('[data-tid="library-collection-public"]').trigger('click')
    c.collection.mockResolvedValueOnce({ ...c.detail, id: 'c2', name: 'Gifts' })
    await w.setProps({ collectionId: 'c2' })
    await flush()
    answer({ ...c.detail, visibility: 'public' })
    await flush()
    expect(w.find('[data-tid="library-collection-title"]').text()).toBe('Gifts')
    expect(w.find('[data-tid="library-collection-private"]').attributes('aria-pressed')).toBe('true')
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
    expect(w.emitted('deleted')).toHaveLength(1)
  })

  it('says what to do when it is empty, and why when it could not be read', async () => {
    const empty = await page(client({ collection: vi.fn(async () => ({ id: 'c1', name: 'Empty', description: '', visibility: 'private', created_at: '', updated_at: '', item_count: 0, items: [] })) }))
    expect(empty.find('[data-tid="library-collection-empty"]').text()).toContain('Add a print from its quick look')
    const failed = await page(client({ collection: vi.fn(async () => { throw new Error('Offline') }) }))
    expect(failed.find('[data-tid="library-collection-error"]').exists()).toBe(true)
  })
})
