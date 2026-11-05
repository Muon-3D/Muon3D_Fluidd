import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const discovery = vi.hoisted(() => ({
  discoverPrinters: vi.fn(async () => {}),
  refreshKnownPrinters: vi.fn(async () => {}),
  discoveryState: { scanning: false, network: '', found: [], cloud: [], cloudChecked: false, finishedAt: 0 },
  instanceFor: vi.fn(),
  instanceForHost: vi.fn(),
  lanAddresses: vi.fn(() => [])
}))
const nearby = vi.hoisted(() => ({
  lookNearby: vi.fn(),
  nearbyState: { printers: [], scanning: false, error: null, supported: false },
  startNearby: vi.fn(async () => {}),
  stopNearby: vi.fn()
}))

// The switcher's services reach the network, the account and Bluetooth.
// Only when it starts searching is under test.
vi.mock('@/services/muon-cloud/discovery', () => discovery)
vi.mock('@/services/muon-ble/nearby', () => nearby)
vi.mock('@/services/muon-ble/link', () => ({ useBluetoothFor: vi.fn(), wantsBluetoothFor: vi.fn(() => false), bluetoothCarrying: vi.fn(() => false) }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { account: null, printers: [], status: {}, activePrinterId: null } }))
vi.mock('@/services/muon-cloud/activate', () => ({
  activateCloudPrinter: vi.fn(),
  activateLocalPrinter: vi.fn(),
  activationState: { switching: null, error: null, fallbackUrl: null }
}))
vi.mock('@/services/muon-access/api', () => ({ lanPrinterAccess: vi.fn() }))

const { default: PrinterSwitcher } = await import('../PrinterSwitcher.vue')

const mocks = {
  $t: (key: string) => key,
  $store: {
    state: { config: { apiUrl: '', instances: [], uiSettings: { general: { enableKeyboardShortcuts: true } } }, socket: { open: false } },
    getters: { 'config/getInstances': [], 'config/getCurrentInstance': null },
    dispatch: vi.fn()
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('PrinterSwitcher', () => {
  it('does not search the network while it is closed', () => {
    // Once opened it stays mounted, closed, in the header. Searching on
    // mount swept the network on every load, about 510 requests over 24 s.
    shallowMount(PrinterSwitcher, { mocks, propsData: { visible: false } })
    expect(discovery.discoverPrinters).not.toHaveBeenCalled()
    expect(nearby.startNearby).not.toHaveBeenCalled()
  })

  it('finds an offline printer by the address it was saved at', async () => {
    const wrapper = shallowMount(PrinterSwitcher, { mocks, propsData: { visible: false } })
    const vm = wrapper.vm as unknown as { query: string, matches: (e: unknown) => boolean }
    const workshop = { name: 'Workshop', host: null, saved: [{ apiUrl: 'http://192.168.1.50' }] }
    vm.query = '192.168.1.50'
    expect(vm.matches(workshop)).toBe(true)
    vm.query = 'workshop'
    expect(vm.matches(workshop)).toBe(true)
    vm.query = '10.0.0.9'
    expect(vm.matches(workshop)).toBe(false)
  })

  it('searches when it opens', async () => {
    const wrapper = shallowMount(PrinterSwitcher, { mocks, propsData: { visible: false } })
    await wrapper.setProps({ visible: true })
    expect(discovery.discoverPrinters).toHaveBeenCalledTimes(1)
    expect(nearby.startNearby).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })

  describe('sections', () => {
    const e = (id: string, name: string, section = 'cloud') => ({
      key: `${section}:${id}`,
      section,
      name,
      endpointId: id,
      health: 'online',
      detail: 'Ready',
      host: null,
      active: null,
      linkedTo: 'mine',
      saved: [],
      cloud: section === 'cloud' ? { id, name } : undefined
    })

    async function open (directory: { cloud: unknown[], local: unknown[], found: unknown[] }, groups: unknown[] = []) {
      const { cloudState } = await import('@/services/muon-cloud/state') as unknown as { cloudState: Record<string, unknown> }
      cloudState.layout = { groups }
      return shallowMount(PrinterSwitcher, {
        mocks,
        propsData: { visible: false },
        computed: { directory: () => directory, account: () => ({ email: 'sample@example.test' }) }
      })
    }

    it('hides Saved in this browser and Found on this network when they are empty', async () => {
      const w = await open({ cloud: [e('a', 'Alpha')], local: [], found: [] })
      expect(w.text()).not.toContain('Saved in this browser')
      expect(w.text()).not.toContain('Found on this network')
      expect(w.text()).not.toContain('No other printers found')
      w.destroy()
    })

    it('shows them when they hold a printer', async () => {
      const w = await open({ cloud: [], local: [e('l', 'Saved one', 'local')], found: [e('f', 'Found one', 'found')] })
      expect(w.find('[data-tid="switcher-saved"]').exists()).toBe(true)
      expect(w.find('[data-tid="switcher-found"]').exists()).toBe(true)
      w.destroy()
    })

    it('groups the account printers by their group, with the rest under Other printers', async () => {
      const w = await open(
        { cloud: [e('a', 'Alpha'), e('b', 'Beta'), e('c', 'Gamma')], local: [], found: [] },
        [{ id: 'g1', name: 'Workshop', printers: ['a', 'b'] }]
      )
      expect(w.find('[data-tid="switcher-group-g1"]').text()).toContain('Workshop')
      expect(w.find('[data-tid="switcher-group-g1"]').findAll('printer-card-stub')).toHaveLength(2)
      expect(w.find('[data-tid="switcher-group-other"]').text()).toContain('Other printers')
      expect(w.find('[data-tid="switcher-group-other"]').findAll('printer-card-stub')).toHaveLength(1)
      w.destroy()
    })

    it('keeps the search, All printers and Add a printer', async () => {
      const w = await open({ cloud: [], local: [], found: [] })
      expect(w.find('[data-tid="find-printer"]').exists()).toBe(true)
      expect(w.find('[data-tid="all-printers"]').exists()).toBe(true)
      expect(w.find('[data-tid="enter-address"]').text()).toContain('Add a printer')
      w.destroy()
    })
  })
})
