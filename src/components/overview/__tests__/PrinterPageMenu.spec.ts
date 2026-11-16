import Vue from 'vue'
import Vuetify from 'vuetify'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PrinterPageMenu from '../PrinterPageMenu.vue'
import { nearbyState } from '@/services/muon-ble/nearby'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

Vue.use(Vuetify)

const entry = (over: Partial<DirectoryEntry> = {}): DirectoryEntry => ({
  key: 'cloud:walnut',
  section: 'cloud',
  name: 'Walnut',
  endpointId: 'walnut',
  health: 'online',
  detail: '',
  host: null,
  active: 'cloud',
  linkedTo: 'mine',
  saved: [],
  cloud: { id: 'walnut', online: true } as DirectoryEntry['cloud'],
  ...over
})

const mountMenu = (e: DirectoryEntry | null, methods: Record<string, unknown> = {}) => {
  const store = {
    state: { config: { apiUrl: 'http://mock.local' }, socket: {}, printer: { printer: {} } },
    getters: { 'server/componentSupport': () => false },
    dispatch: vi.fn()
  }
  return mount(PrinterPageMenu as any, {
    vuetify: new Vuetify(),
    attachTo: document.body,
    mocks: { $store: store, $route: { path: '/walnut', params: {} } },
    computed: { directory: () => ({ cloud: e && e.section === 'cloud' ? [e] : [], local: e && e.section === 'local' ? [e] : [], found: [] }) },
    methods
  } as any)
}

const open = async (w: ReturnType<typeof mountMenu>) => {
  await w.find('[data-tid="printer-page-menu-button"]').trigger('click')
  await Vue.nextTick()
}
const item = (id: string) => document.querySelector(`[data-action="${id}"]`) as HTMLElement | null

afterEach(() => {
  nearbyState.support = 'unsupported' as typeof nearbyState.support
  document.body.innerHTML = ''
})

describe('the printer page menu (KAN-1429)', () => {
  it('renders a three-dot menu for the printer the page is on', () => {
    nearbyState.support = 'supported'
    const w = mountMenu(entry())
    expect(w.find('[data-tid="printer-page-menu-button"]').exists()).toBe(true)
    w.destroy()
  })

  it('offers Connect over Bluetooth where the card does, and calls the same handler', async () => {
    nearbyState.support = 'supported'
    const connect = vi.fn()
    const w = mountMenu(entry(), { connectOverBluetooth: connect })
    await open(w)
    const bt = item('connect-bluetooth')
    expect(bt?.textContent).toContain('Connect over Bluetooth')
    bt!.click()
    await Vue.nextTick()
    expect(connect).toHaveBeenCalledTimes(1)
    expect((connect.mock.calls[0][0] as DirectoryEntry).cloud?.id).toBe('walnut')
    w.destroy()
  })

  it('offers it for a printer heard nearby even where the browser has no chooser', async () => {
    nearbyState.support = 'unsupported' as typeof nearbyState.support
    const w = mountMenu(entry({ nearby: { device: {} } as DirectoryEntry['nearby'] }))
    await open(w)
    expect(item('connect-bluetooth')).not.toBeNull()
    w.destroy()
  })

  it('greys it, with the reason, where nothing is heard and this browser has no Bluetooth', async () => {
    nearbyState.support = 'unsupported' as typeof nearbyState.support
    const w = mountMenu(entry())
    await open(w)
    expect(item('connect-bluetooth')?.className).toContain('v-list-item--disabled')
    expect(item('connect-bluetooth')?.textContent).toContain('This browser has no Bluetooth')
    w.destroy()
  })

  it('on the local network offers Muon3D and Bluetooth, never Connect locally (KAN-2487)', async () => {
    nearbyState.support = 'supported'
    const w = mountMenu(entry({ section: 'local', active: 'local', cloud: undefined }))
    await open(w)
    expect(item('connect-local')).toBeNull()
    expect(item('connect-cloud')?.textContent).toContain('Not on your account')
    expect(item('connect-bluetooth')?.className).not.toContain('v-list-item--disabled')
    w.destroy()
  })

  it('on Muon3D offers Connect locally and Bluetooth, never Muon3D', async () => {
    nearbyState.support = 'supported'
    const w = mountMenu(entry())
    await open(w)
    expect(item('connect-cloud')).toBeNull()
    expect(item('connect-local')).not.toBeNull()
    expect(item('connect-bluetooth')).not.toBeNull()
    w.destroy()
  })

  it('has no menu when the page is on no linked printer, and never offers a pairing entry', async () => {
    nearbyState.support = 'supported'
    const none = mountMenu(null)
    expect(none.find('[data-tid="printer-page-menu-button"]').exists()).toBe(false)
    none.destroy()
    const w = mountMenu(entry())
    await open(w)
    expect(document.body.textContent).not.toMatch(/pair/i)
    w.destroy()
  })
})
