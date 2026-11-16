import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'

vi.mock('@/services/muon-cloud/state', async () => {
  const { default: Vue } = await import('vue')
  return { cloudState: Vue.observable({ account: null, activePrinterId: null, printers: [], ready: true }), cloudPrinterConnection: vi.fn() }
})
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => null, printerPath: () => '/' }))
vi.mock('@/services/library/print-on', () => ({ activePrinterFacts: vi.fn(), downloadGcode: vi.fn(), downloadProject: vi.fn(), gcodeFileName: vi.fn(), saveToComputer: vi.fn() }))
vi.mock('@/components/library/PrintOnDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/library/PrinterFitList.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/widgets/filesystem/FileNameDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/muon-cloud/CloudAccountDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/services/library/store', async (original) => ({
  ...await original() as object,
  watchLibraryAccount: vi.fn(),
  refreshLibrary: vi.fn(async () => {})
}))

// eslint-disable-next-line import/first
import { libraryState, resetLibrary, setLibraryClient } from '@/services/library/store'
// eslint-disable-next-line import/first
import { LibraryError, type LibraryItem, type LibraryRun } from '@/services/library/api'
// eslint-disable-next-line import/first
import LibraryPrint from '../LibraryPrint.vue'

const item = (over: Partial<LibraryItem> = {}): LibraryItem => ({
  id: 'a',
  kind: 'plate',
  format: '3mf',
  name: 'Desk bracket',
  size_bytes: 1,
  has_thumbnail: false,
  state: 'ready',
  rev: 1,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: new Date().toISOString(),
  deleted_at: null,
  versioned: true,
  version: 3,
  printed_count: 4,
  setups: [{ printer_model: 'Muon3D M1', nozzle_mm: 0.4, material: 'PETG', print_seconds: 6300, filament_g: 37, file_id: 'g' }],
  ...over
})

const run = (over: Partial<LibraryRun>): LibraryRun => ({
  id: 'r',
  item_id: 'a',
  version: 3,
  printer_id: 'p',
  printer_name: 'Boxwood',
  file_name: null,
  started_at: new Date().toISOString(),
  ended_at: null,
  outcome: 'finished',
  progress_pct: null,
  duration_s: 6420,
  in_library: true,
  item: null,
  ...over
})

function client (over: Record<string, unknown> = {}) {
  return {
    item: vi.fn(async () => item()),
    versions: vi.fn(async () => ({ versions: [] })),
    runs: vi.fn(async () => ({ runs: [run({}), run({ id: 'r2', printer_name: 'Walnut', outcome: 'cancelled', progress_pct: 62, duration_s: null }), run({ id: 'other', item_id: 'b' })], cursor: null })),
    ...over
  }
}

const flush = async () => {
  for (let i = 0; i < 4; i++) {
    await Vue.nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

let mounted: Array<{ destroy: () => void }> = []

function mountPage () {
  const wrapper = shallowMount(LibraryPrint, {
    mocks: {
      $route: { params: { item: 'a' }, query: {} },
      $router: { push: vi.fn(() => Promise.resolve()) },
      $store: { state: { config: { apiUrl: '', instances: [] } }, getters: {} },
      $vuetify: { breakpoint: { mobile: false } }
    },
    stubs: ['router-link', 'frame-icon', 'v-menu', 'v-list', 'v-list-item', 'v-list-item-title', 'v-divider']
  })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.forEach(w => w.destroy())
  mounted = []
})

beforeEach(() => {
  resetLibrary('acct')
  Object.assign(libraryState, { checked: true, enabled: true })
})

describe('Library v3: one of your prints', () => {
  it('says what happened to it, the facts, and each time it printed (its own runs only)', async () => {
    setLibraryClient(client() as never)
    const w = mountPage()
    await flush()
    expect(w.find('[data-tid="library-own-line"]').text()).toBe('Version 3 · saved from Slice just now · printed 4×')
    const vm = w.vm as any
    expect(vm.specs.map((s: { label: string }) => s.label)).toEqual(['Material', 'Time', 'Filament', 'Nozzle'])
    expect(vm.runRows.map((r: { title: string, line: string, status: string }) => [r.title, r.line.replace(/^.* · /, ''), r.status]))
      .toEqual([['Boxwood · 1h 47m', 'finished', 'Done'], ['Walnut · stopped at 62%', 'just now', 'Stopped']])
    // Printed 4 times, two listed: the tile says the list is only the latest.
    expect(w.find('[data-tid="library-own-more-runs"]').text()).toBe('Printed 4 times in all; the latest are listed.')
  })

  it('a Library that does not answer is not a print that is gone: it says why, and Try again reads it', async () => {
    const c = client({ item: vi.fn(async () => { throw new LibraryError('network', 'The Library didn\'t answer.') }) })
    setLibraryClient(c as never)
    const w = mountPage()
    await flush()
    expect(w.find('[data-tid="library-own-error"]').text()).toContain('didn\'t answer')
    expect(w.find('[data-tid="library-print-missing"]').exists()).toBe(false)
    c.item.mockResolvedValueOnce(item())
    await w.find('[data-tid="library-own-retry"]').trigger('click')
    await flush()
    expect(w.find('[data-tid="library-print-name"]').text()).toBe('Desk bracket')
  })

  it('a print the Library does not have says so', async () => {
    setLibraryClient(client({ item: vi.fn(async () => { throw new LibraryError('not_found', 'No such print.', 404) }) }) as never)
    const w = mountPage()
    await flush()
    expect(w.find('[data-tid="library-print-missing"]').exists()).toBe(true)
  })

  it('waits for the account and the Library\'s answer before reading, then reads (no "Reading" for ever)', async () => {
    resetLibrary(null)
    const c = client()
    setLibraryClient(c as never)
    const w = mountPage()
    await flush()
    expect(c.item).not.toHaveBeenCalled()
    Object.assign(libraryState, { account: 'acct', checked: true, enabled: true })
    await flush()
    expect(c.item).toHaveBeenCalledWith('a')
    expect(w.find('[data-tid="library-print-name"]').text()).toBe('Desk bracket')
  })

  it('with the Library off it says so', async () => {
    Object.assign(libraryState, { enabled: false })
    const c = client()
    setLibraryClient(c as never)
    const w = mountPage()
    await flush()
    expect(w.find('[data-tid="library-own-off"]').exists()).toBe(true)
    expect(c.item).not.toHaveBeenCalled()
  })

  it('forgets a print read for one account when another signs in, or nobody is signed in', async () => {
    const c = client()
    setLibraryClient(c as never)
    const w = mountPage()
    await flush()
    expect(w.find('[data-tid="library-print-name"]').text()).toBe('Desk bracket')
    // Signed out: no print, no header of one.
    resetLibrary(null)
    await flush()
    expect(w.find('[data-tid="library-print-name"]').exists()).toBe(false)
    // Another account: its own read, not the first one's print.
    c.item.mockRejectedValueOnce(new LibraryError('not_found', 'No such print.', 404))
    resetLibrary('other')
    Object.assign(libraryState, { checked: true, enabled: true })
    await flush()
    expect(w.find('[data-tid="library-print-missing"]').exists()).toBe(true)
    expect(w.find('[data-tid="library-print-name"]').exists()).toBe(false)
  })

  it('a read still out when the account changes is dropped: not shown, not kept in the new Library', async () => {
    let answer: (value: LibraryItem) => void = () => {}
    const c = client({ item: vi.fn(() => new Promise<LibraryItem>(resolve => { answer = resolve })) })
    setLibraryClient(c as never)
    const w = mountPage()
    await flush()
    expect(c.item).toHaveBeenCalledTimes(1)
    // B signs in while A's read is out; B's read is refused (not hers).
    c.item.mockRejectedValueOnce(new LibraryError('not_found', 'No such print.', 404))
    resetLibrary('other')
    Object.assign(libraryState, { checked: true, enabled: true })
    await flush()
    answer(item())
    await flush()
    expect(w.find('[data-tid="library-print-name"]').exists()).toBe(false)
    expect(libraryState.items.a).toBeUndefined()
  })

  it('when the Library itself could not be read it says why, and Try again reads the Library', async () => {
    Object.assign(libraryState, { checked: false, error: 'The Library didn\'t answer.' })
    const c = client()
    setLibraryClient(c as never)
    const w = mountPage()
    await flush()
    expect(w.find('[data-tid="library-own-error"]').text()).toContain('didn\'t answer')
    expect(c.item).not.toHaveBeenCalled()
    const { refreshLibrary } = await import('@/services/library/store')
    await w.find('[data-tid="library-own-retry"]').trigger('click')
    expect(refreshLibrary).toHaveBeenCalled()
  })

  it('reads its prints again once it has printed again', async () => {
    const c = client()
    setLibraryClient(c as never)
    mountPage()
    await flush()
    expect(c.runs).toHaveBeenCalledTimes(1)
    libraryState.items = { a: item({ printed_count: 5 }) }
    await flush()
    expect(c.runs).toHaveBeenCalledTimes(2)
  })
})

describe('Library: opening one of your prints', () => {
  const RECENTS = 'm3d.control.library.recents.v1'
  beforeEach(() => localStorage.clear())

  it('is what Continue shows next: kept on this device once the print has loaded, with its name and nothing more', async () => {
    setLibraryClient(client() as never)
    mountPage()
    await flush()
    const stored = JSON.parse(localStorage.getItem(RECENTS) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ id: 'a', kind: 'own', title: 'Desk bracket', thumbnail: null, maker: null })
    // A sync that brings the same print again is not opening it again.
    const before = stored[0].opened_at
    libraryState.items = { a: item({ printed_count: 5 }) }
    await flush()
    expect(JSON.parse(localStorage.getItem(RECENTS) ?? '[]')[0].opened_at).toBe(before)
  })

  it('a print that could not be read is not kept', async () => {
    setLibraryClient(client({ item: vi.fn(async () => { throw new LibraryError('not_found', 'No such print.', 404) }) }) as never)
    mountPage()
    await flush()
    expect(localStorage.getItem(RECENTS)).toBeNull()
  })

  it('opens with its heading focused', async () => {
    setLibraryClient(client() as never)
    const w = shallowMount(LibraryPrint, {
      mocks: {
        $route: { params: { item: 'a' }, query: {} },
        $router: { push: vi.fn(() => Promise.resolve()) },
        $store: { state: { config: { apiUrl: '', instances: [] } }, getters: {} },
        $vuetify: { breakpoint: { mobile: false } }
      },
      stubs: ['router-link', 'frame-icon', 'v-menu', 'v-list', 'v-list-item', 'v-list-item-title', 'v-divider'],
      attachTo: document.body
    })
    mounted.push(w)
    await flush()
    const heading = w.find('[data-tid="library-print-name"]')
    expect(heading.attributes('tabindex')).toBe('-1')
    expect(document.activeElement).toBe(heading.element)
  })
})
