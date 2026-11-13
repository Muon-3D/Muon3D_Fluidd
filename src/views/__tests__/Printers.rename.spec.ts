import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import store from '@/store'

const discovery = vi.hoisted(() => ({
  discoverPrinters: vi.fn(async () => {}),
  refreshCloudNearby: vi.fn(async () => {}),
  refreshKnownPrinters: vi.fn(async () => {}),
  refreshLanStatus: vi.fn(async () => {}),
  lanAddresses: vi.fn(() => []),
  lanFetch: vi.fn(),
  lanOpenLinks: vi.fn(() => []),
  pageIsSecure: vi.fn(() => true),
  discoveryState: { scanning: false, network: '', found: [], cloud: [], cloudChecked: false, finishedAt: 0, blockedByPage: false }
}))
vi.mock('@/services/muon-cloud/discovery', () => discovery)
const idle = vi.hoisted(() => ({ afterFirstPaint: vi.fn() }))
vi.mock('@/services/startup/idle', () => idle)
vi.mock('@/services/foreign-printers/live', () => ({
  liveForeign: { records: [], status: {} },
  loadForeign: vi.fn(async () => {}),
  connectAll: vi.fn(async () => {}),
  forget: vi.fn(async () => {})
}))
vi.mock('@/services/muon-ble/nearby', () => ({
  nearbyState: { printers: [], support: 'unsupported', radio: 'on' },
  startNearby: vi.fn(async () => {}),
  stopNearby: vi.fn(),
  lookNearby: vi.fn(),
  isPrinter: vi.fn(() => false)
}))

const { cloudApi } = await import('@/services/muon-cloud/api')
const { cloudState } = await import('@/services/muon-cloud/state')
const { default: Printers } = await import('../Printers.vue')

afterEach(() => { vi.restoreAllMocks(); cloudState.account = null; cloudState.printers = []; cloudState.layout = { ...cloudState.layout, groups: [] } })

describe('naming a new group', () => {
  it('keeps what was typed when the groups re-render and the name field is made again (#362 e2e, under load)', async () => {
    vi.spyOn(cloudApi, 'putLayout').mockResolvedValue({ ok: true })
    cloudState.account = { id: 'a', name: 'Jack', email: 'jack@example.test', created_at: 1 } as never
    // One printer on the account, so the page lists printers rather than its welcome.
    cloudState.printers = [{ id: 'p-elm', name: 'Elm', model: 'M1', version: '1.0.0', linked_at: 1, last_seen: 1, online: true, online_since: 1, role: 'operator' }] as never
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const wrapper = shallowMount(Printers, {
      localVue,
      router: new VueRouter({ mode: 'abstract', routes: [] }),
      computed: { isMobileViewport: () => false },
      mocks: { $store: store, $vuetify: { breakpoint: { mobile: false } } },
      stubs: { PrintersSection: { template: '<section><slot name="title" /><slot name="actions" /><slot /></section>' } }
    })
    const vm = wrapper.vm as unknown as { addGroup: () => void, renaming: string | null }
    vm.addGroup()
    await wrapper.vm.$nextTick()
    await wrapper.find('input[aria-label="Group name"]').setValue('Lab')
    // The section re-renders and its name field is a new element (a printer went offline while this was typed).
    const id = vm.renaming
    vm.renaming = null
    await wrapper.vm.$nextTick()
    vm.renaming = id
    await wrapper.vm.$nextTick()
    const again = wrapper.find('input[aria-label="Group name"]')
    expect((again.element as HTMLInputElement).value).toBe('Lab')
    await again.trigger('keydown.enter')
    expect(cloudState.layout.groups.map(g => g.name)).toEqual(['Lab'])
    wrapper.destroy()
  })
})
