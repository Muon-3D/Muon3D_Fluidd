import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { afterEach, expect, it, vi } from 'vitest'
import PrinterStrip from '../PrinterStrip.vue'

const picker = vi.hoisted(() => ({ open: vi.fn() }))

vi.mock('@/mixins/printer-entries', async () => {
  const { default: Vue } = await import('vue')
  return { default: Vue.extend({ data: () => ({ busyKey: null, notice: null }), computed: { socketConnected: () => false, directory: () => ({ cloud: [], local: [], found: [] }) } }) }
})
vi.mock('@/components/layout/PrinterSwitchButton.vue', () => ({ default: { name: 'PrinterSwitchButton', props: ['screenState', 'phone'], template: '<button />' } }))
vi.mock('@/components/muon-cloud/PrinterSwitcher.vue', () => ({ default: { name: 'PrinterSwitcher', props: ['listVisible'], methods: { openListedEntry: picker.open }, template: '<div />' } }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { status: {} } }))
vi.mock('@/services/foreign-printers/live', () => ({ liveForeign: { records: [], status: {} } }))
vi.mock('@/services/printer-pages', () => ({ foreignRecordForSlug: () => undefined }))

const disconnect = vi.fn()
vi.stubGlobal('ResizeObserver', class { observe = vi.fn(); disconnect = disconnect })
afterEach(() => { vi.clearAllMocks() })

function show (presentation = 'strip') {
  const localVue = createLocalVue()
  localVue.use(VueRouter)
  return shallowMount(PrinterStrip, { localVue, router: new VueRouter({ mode: 'abstract' }), propsData: { presentation }, stubs: { PrinterSwitcher: false, 'v-menu': { template: '<div><slot /></div>' } }, mocks: { $store: { getters: {} } } })
}

it('keeps the existing switcher swappable without mounting the strip picker', () => {
  const w = show('switcher')
  expect(w.find('[data-tid="printer-switcher-classic"]').exists()).toBe(true)
  expect(w.findComponent({ name: 'PrinterSwitchButton' }).props('screenState')).toBeUndefined()
  expect(w.findComponent({ name: 'PrinterSwitcher' }).exists()).toBe(false)
  w.destroy()
})

it('does not invent another printer or overflow when the list is empty and cleans its observer', () => {
  const w = show()
  expect((w.vm as any).extraCount).toBe(0)
  expect(w.findAll('[data-tid="strip-printer"]')).toHaveLength(0)
  expect(w.find('[data-tid="strip-overflow"]').exists()).toBe(false)
  expect(w.findComponent({ name: 'PrinterSwitchButton' }).props('screenState')).toBeDefined()
  w.destroy()
  expect(disconnect).toHaveBeenCalledOnce()
})

it('only renders the overflow list while open, keeping its controller available for round-screen picks', async () => {
  const w = show()
  const picker = () => w.findComponent({ name: 'PrinterSwitcher' })
  expect(picker().props('listVisible')).toBe(false)
  await w.setData({ open: true })
  expect(picker().props('listVisible')).toBe(true)
  await w.setData({ open: false })
  expect(picker().props('listVisible')).toBe(false)
  expect(picker().exists()).toBe(true)
  w.destroy()
})

it('delegates opening to the existing picker and releases a refused selection', async () => {
  const w = show()
  const vm = w.vm as any
  const openListedEntry = picker.open.mockRejectedValue(new Error('refused'))
  vm.$refs.picker = { openListedEntry }
  const entry = { key: 'cloud:a', name: 'Elm' }
  await vm.choose(entry)
  expect(openListedEntry).toHaveBeenCalledWith(entry)
  expect(vm.busyKey).toBe(null)
  expect(w.find('[role="alert"]').text()).toContain("Couldn't open Elm")
  openListedEntry.mockResolvedValue(undefined)
  vm.$refs.picker = { openListedEntry }
  await vm.choose(entry)
  expect(vm.notice).toBeUndefined()
  w.destroy()
})

it('keeps sizing and cleans up without ResizeObserver', () => {
  const Observer = globalThis.ResizeObserver
  const add = vi.spyOn(window, 'addEventListener')
  const remove = vi.spyOn(window, 'removeEventListener')
  let w: ReturnType<typeof show> | undefined
  vi.stubGlobal('ResizeObserver', undefined)
  try {
    w = show()
    const vm = w.vm as any
    expect(add).toHaveBeenCalledWith('resize', vm.onResize)
    Object.defineProperty(w.element, 'clientWidth', { value: 220 })
    window.dispatchEvent(new Event('resize'))
    expect(vm.width).toBe(220)
    w.destroy()
    expect(remove).toHaveBeenCalledWith('resize', vm.onResize)
  } finally {
    w?.destroy()
    vi.stubGlobal('ResizeObserver', Observer)
    add.mockRestore()
    remove.mockRestore()
  }
})
