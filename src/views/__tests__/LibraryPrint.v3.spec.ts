import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

function mountPage () {
  return shallowMount(LibraryPrint, {
    mocks: {
      $route: { params: { item: 'a' }, query: {} },
      $router: { push: vi.fn(() => Promise.resolve()) },
      $store: { state: { config: { apiUrl: '', instances: [] } }, getters: {} },
      $vuetify: { breakpoint: { mobile: false } }
    },
    stubs: ['router-link', 'frame-icon', 'v-menu', 'v-list', 'v-list-item', 'v-list-item-title', 'v-divider']
  })
}

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
    expect(vm.runRows.map((r: { title: string, status: string }) => [r.title, r.status])).toEqual([['Boxwood · 1h 47m', 'Done'], ['Walnut · stopped at 62%', 'Stopped']])
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
})
