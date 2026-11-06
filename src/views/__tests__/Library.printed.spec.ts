import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'

vi.mock('@/services/muon-cloud/state', async () => {
  const { default: Vue } = await import('vue')
  return { cloudState: Vue.observable({ account: null, activePrinterId: null, printers: [] }), cloudPrinterConnection: vi.fn() }
})
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => null }))
vi.mock('@/services/library/print-on', () => ({ activePrinterFacts: vi.fn(), downloadGcode: vi.fn(), downloadProject: vi.fn(), gcodeFileName: vi.fn(), saveToComputer: vi.fn() }))
vi.mock('@/components/library/PrintOnDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/widgets/filesystem/FileNameDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/muon-cloud/CloudAccountDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/services/library/store', async (original) => ({
  ...await original() as object,
  watchLibraryAccount: vi.fn(),
  refreshLibrary: vi.fn(async () => {})
}))

// eslint-disable-next-line import/first
import { libraryState, resetLibrary } from '@/services/library/store'
// eslint-disable-next-line import/first
import type { LibraryRun } from '@/services/library/api'
// eslint-disable-next-line import/first
import Library from '../Library.vue'

// A run as the model service lists it (src/library/runs.rs `Run`): item and version are null for an unattached run.
const run = (over: Partial<LibraryRun>): LibraryRun => ({
  id: 'run',
  item_id: 'item',
  version: 2,
  printer_id: 'p1',
  printer_name: 'Pine',
  file_name: 'cube.gcode',
  started_at: '2026-10-20T11:00:00Z',
  ended_at: null,
  outcome: 'finished',
  progress_pct: null,
  duration_s: null,
  in_library: true,
  item: null,
  ...over
})

function render () {
  return shallowMount(Library, {
    mocks: { $store: { state: { config: { apiUrl: '', instances: [] } }, getters: {} }, $vuetify: { breakpoint: { mobile: false } } },
    stubs: ['router-link', 'frame-icon', 'print-on-dialog', 'file-name-dialog', 'cloud-account-dialog']
  })
}

beforeEach(() => {
  resetLibrary('fixture')
  Object.assign(libraryState, { checked: true, enabled: true })
})

describe('Library Printed (Yours shelf)', () => {
  it('offers Print again only for a run whose print is still in the Library and whose version is known', () => {
    const vm = render().vm as any
    expect(vm.canPrintAgain(run({}))).toBe(true)
    expect(vm.canPrintAgain(run({ in_library: false }))).toBe(false)
    expect(vm.canPrintAgain(run({ item_id: null, version: null, in_library: false }))).toBe(false)
    expect(vm.canPrintAgain(run({ version: null }))).toBe(false)
    expect(vm.printAgain(run({}))).toEqual({ path: '/print', query: { library: 'item', version: '2' } })
  })

  it('Print again on a Printed card goes to the hand-off, and nowhere for a run it cannot print', () => {
    const push = vi.fn(() => Promise.resolve())
    const vm = shallowMount(Library, {
      mocks: { $route: { query: {} }, $router: { push, replace: vi.fn(() => Promise.resolve()) }, $store: { state: { config: { apiUrl: '', instances: [] } }, getters: {} }, $vuetify: { breakpoint: { mobile: false } } },
      stubs: ['router-link', 'frame-icon', 'print-on-dialog', 'file-name-dialog', 'cloud-account-dialog']
    }).vm as any
    vm.onPrintRun(run({}))
    vm.onPrintRun(run({ in_library: false }))
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith({ path: '/print', query: { library: 'item', version: '2' } })
  })
})

describe('Library v3: Yours See all in the address', () => {
  function at (query: Record<string, string>) {
    const push = vi.fn(() => Promise.resolve())
    const replace = vi.fn(() => Promise.resolve())
    const back = vi.fn()
    const wrapper = shallowMount(Library, {
      mocks: { $route: { query }, $router: { push, replace, back }, $store: { state: { config: { apiUrl: '', instances: [] } }, getters: {} }, $vuetify: { breakpoint: { mobile: false } } },
      stubs: ['router-link', 'frame-icon', 'print-on-dialog', 'file-name-dialog', 'cloud-account-dialog']
    })
    return { vm: wrapper.vm as any, push, replace, back }
  }

  it('reads a collection only on Yours, and opens one pushed so Back returns', () => {
    expect(at({ view: 'mine', collection: 'col-1' }).vm.collection).toBe('col-1')
    expect(at({ view: 'discover', collection: 'col-1' }).vm.collection).toBe(null)
    const { vm, push } = at({ view: 'mine', shelf: 'sliced' })
    vm.openCollection('col-1')
    expect(push).toHaveBeenCalledWith({ query: { view: 'mine', collection: 'col-1' } })
  })

  it('a deleted collection goes back when this page opened it, and is replaced in history when it was opened by its address', () => {
    const opened = at({ view: 'mine' })
    opened.vm.openCollection('col-1')
    opened.vm.collectionDeleted()
    expect(opened.back).toHaveBeenCalledTimes(1)
    expect(opened.replace).not.toHaveBeenCalled()

    const direct = at({ view: 'mine', collection: 'col-1' })
    direct.vm.collectionDeleted()
    expect(direct.back).not.toHaveBeenCalled()
    expect(direct.replace).toHaveBeenCalledWith({ query: { view: 'mine' } })
  })

  it('‹ on print pages goes back through the ones opened here, then to the place under them', async () => {
    const { vm, push, back, replace } = at({ view: 'discover' })
    vm.openPrint('a')
    vm.openPrint('b')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(push).toHaveBeenCalledTimes(2)
    vm.printBack()
    vm.printBack()
    expect(back).toHaveBeenCalledTimes(2)
    expect(replace).not.toHaveBeenCalled()
    // Opened by its address: nothing of ours to go back through.
    vm.printBack()
    expect(back).toHaveBeenCalledTimes(2)
    expect(replace).toHaveBeenCalledTimes(1)
  })

  it('a push that went nowhere (refused, or the print already open) is not one to go back through', async () => {
    const { vm, push, back, replace } = at({ view: 'discover', print: 'a' })
    vm.openPrint('a')
    expect(push).not.toHaveBeenCalled()
    push.mockImplementationOnce(() => Promise.reject(new Error('NavigationDuplicated')))
    vm.openPrint('b')
    await new Promise(resolve => setTimeout(resolve, 0))
    vm.printBack()
    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith({ query: { view: 'discover' } })
  })

  it('leaving the print pages another way forgets them, so ‹ never leaves the Library', async () => {
    const route = Vue.observable({ query: { view: 'discover' } as Record<string, string> })
    const back = vi.fn()
    const replace = vi.fn(() => Promise.resolve())
    const vm = shallowMount(Library, {
      mocks: { $route: route, $router: { push: vi.fn(() => Promise.resolve()), replace, back }, $store: { state: { config: { apiUrl: '', instances: [] } }, getters: {} }, $vuetify: { breakpoint: { mobile: false } } },
      stubs: ['router-link', 'frame-icon', 'print-on-dialog', 'file-name-dialog', 'cloud-account-dialog']
    }).vm as any
    vm.openPrint('a')
    await new Promise(resolve => setTimeout(resolve, 0))
    route.query = { view: 'discover', print: 'a' }
    await Vue.nextTick()
    // Browser Back to Discover, then a print's page opened by its address.
    route.query = { view: 'discover' }
    await Vue.nextTick()
    route.query = { view: 'discover', print: 'z' }
    await Vue.nextTick()
    vm.printBack()
    expect(back).not.toHaveBeenCalled()
    expect(replace).toHaveBeenCalledWith({ query: { view: 'discover' } })
  })

  it('Yours from a collection leaves it for Yours', () => {
    const { vm, replace } = at({ view: 'mine', collection: 'col-1' })
    vm.setView('yours')
    expect(replace).toHaveBeenCalledWith({ query: { view: 'mine' } })
  })

  it('reads a Yours shelf only on Yours, and a Discover shelf only on Discover', () => {
    expect(at({ view: 'mine', shelf: 'sliced' }).vm.grid).toBe('sliced')
    expect(at({ view: 'mine', shelf: 'popular' }).vm.grid).toBe(null)
    expect(at({ view: 'discover', shelf: 'sliced' }).vm.grid).toBe(null)
    expect(at({ view: 'discover', shelf: 'popular' }).vm.grid).toBe('popular')
  })

  it('opens a Yours See all on Yours, pushed so Back returns to the shelves', () => {
    const { vm, push } = at({ view: 'mine' })
    vm.setGrid('printed')
    expect(push).toHaveBeenCalledWith({ query: { view: 'mine', shelf: 'printed' } })
  })
})
