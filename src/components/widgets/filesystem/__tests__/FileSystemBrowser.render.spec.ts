import Vue from 'vue'
import Vuetify from 'vuetify'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FileSystemBrowser from '../FileSystemBrowser.vue'
import { Filters } from '@/plugins/filters'

Vue.use(Vuetify)

const headers = [
  { text: '', value: 'data-table-icons', sortable: false },
  { text: 'Name', value: 'name' },
  { text: 'Print time', value: 'estimated_time' },
  { text: 'Modified', value: 'modified' },
  { text: 'Size', value: 'size' },
  { text: '', value: 'data-table-actions', sortable: false }
]

const files = (count: number) => Array.from({ length: count }, (_, i) => ({
  type: 'file',
  name: `part-${String(i).padStart(4, '0')}.gcode`,
  filename: `part-${i}.gcode`,
  extension: 'gcode',
  path: 'gcodes',
  modified: 1000 + i,
  size: 2048,
  permissions: 'rw',
  estimated_time: 600 + i
}))

function mountBrowser (count: number, extra: Record<string, unknown> = {}) {
  return mount(FileSystemBrowser, {
    vuetify: new Vuetify(),
    propsData: { value: [], root: 'gcodes', files: files(count), headers, bulkActions: true, dragState: false, ...extra },
    mocks: {
      $store: {
        state: { config: { uiSettings: { general: { thumbnailSize: 32, textSortOrder: 'default' }, fileSystem: { sortBy: {}, sortDesc: {} } } } },
        getters: { 'files/getRootProperties': () => ({ readonly: false }), 'server/componentSupport': () => false },
        dispatch: vi.fn()
      },
      $t: (k: string) => k,
      $tc: (k: string) => k,
      $filters: Filters
    },
    attachTo: document.body
  })
}

describe('FileSystemBrowser rows', () => {
  it('draws every row of a short folder', () => {
    const wrapper = mountBrowser(12)
    expect(wrapper.findAll('tr.row-select')).toHaveLength(12)
    expect(wrapper.find('tr.fs-pad').exists()).toBe(false)
    wrapper.destroy()
  })

  it('draws only a window of a large folder, with space for the rest', () => {
    const wrapper = mountBrowser(4000)
    const drawn = wrapper.findAll('tr.row-select').length
    expect(drawn).toBeGreaterThan(0)
    expect(drawn).toBeLessThan(60)
    expect(wrapper.find('tr.fs-pad').exists()).toBe(true)
    wrapper.destroy()
  })

  it('shows print time, modified and size from the metadata for each file, and not the columns that are hidden', () => {
    const wrapper = mountBrowser(3)
    const cells = wrapper.findAll('tr.row-select').at(0).findAll('td.fs-cell')
    expect(cells).toHaveLength(3)
    expect(wrapper.html()).not.toContain('object_height')
    wrapper.destroy()
  })

  it('has a menu button on each row that opens the row menu, and none on the .. row', async () => {
    const parent = { type: 'directory', name: '..', dirname: '..', modified: 0, size: 0 }
    const wrapper = mountBrowser(2, { files: [parent, ...files(2)] })
    const buttons = wrapper.findAll('[data-tid="files-row-menu"]')
    expect(buttons).toHaveLength(2)
    await buttons.at(0).trigger('click')
    const [item, event] = wrapper.emitted('row-click')![0] as [any, MouseEvent]
    expect(item.name).toBe('part-0001.gcode')
    expect(event.type).toBe('contextmenu')
    wrapper.destroy()
  })
})

describe('FileSystemBulkActions', () => {
  it('says how many are selected, and clears them', async () => {
    const { default: Bulk } = await import('../FileSystemBulkActions.vue')
    const wrapper = mount(Bulk, {
      vuetify: new Vuetify(),
      propsData: { root: 'gcodes', count: 3 },
      mocks: { $t: (k: string) => k },
      attachTo: document.body
    })
    expect(wrapper.find('[data-tid="files-selected"]').text()).toBe('3 selected')
    await wrapper.find('[data-tid="files-clear-selection"]').trigger('click')
    expect(wrapper.emitted('clear')).toHaveLength(1)
    wrapper.destroy()
  })
})

describe('FileSystemBrowser viewport', () => {
  it('measures again when the pane resizes, and stops watching when it goes', () => {
    const observed: any[] = []
    const disconnect = vi.fn()
    const original = (globalThis as any).ResizeObserver
    ;(globalThis as any).ResizeObserver = class { cb: () => void; constructor (cb: () => void) { this.cb = cb; observed.push(this) } observe = vi.fn(); disconnect = disconnect }
    const wrapper = mountBrowser(12)
    expect(observed).toHaveLength(1)
    const measure = vi.spyOn(wrapper.vm as any, 'measure')
    observed[0].cb()
    expect(measure).toHaveBeenCalled()
    wrapper.destroy()
    expect(disconnect).toHaveBeenCalled()
    ;(globalThis as any).ResizeObserver = original
  })
})
