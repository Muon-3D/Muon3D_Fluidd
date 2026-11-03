import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// KAN-1279: on 2 Nov a click on Boxwood's row did nothing and logged nothing.
// `run` ignored every click while an earlier open was in flight, with no sign
// of it, and an open whose step never settled kept it ignoring them.
const discovery = vi.hoisted(() => ({
  discoverPrinters: vi.fn(async () => {}),
  refreshKnownPrinters: vi.fn(async () => {}),
  discoveryState: { scanning: false, network: '', found: [], cloud: [], cloudChecked: false, finishedAt: 0 },
  instanceFor: vi.fn(),
  instanceForHost: vi.fn(),
  lanAddresses: vi.fn(() => [])
}))
const activation = vi.hoisted(() => ({
  activateCloudPrinter: vi.fn(),
  activateLocalPrinter: vi.fn(),
  activationState: { switching: null as string | null, error: null as string | null, fallbackUrl: null }
}))
vi.mock('@/services/muon-cloud/discovery', () => discovery)
vi.mock('@/services/muon-ble/nearby', () => ({
  lookNearby: vi.fn(),
  nearbyState: { printers: [], scanning: false, error: null, supported: false },
  startNearby: vi.fn(async () => {}),
  stopNearby: vi.fn()
}))
vi.mock('@/services/muon-ble/link', () => ({ useBluetoothFor: vi.fn() }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { account: null, printers: [], status: {}, activePrinterId: null } }))
vi.mock('@/services/muon-cloud/activate', () => activation)
vi.mock('@/services/muon-access/api', () => ({ lanPrinterAccess: vi.fn() }))

const { default: PrinterSwitcher } = await import('@/components/muon-cloud/PrinterSwitcher.vue')
const { RUN_TIMEOUT_MS } = await import('../printer-entries')

const mocks = {
  $t: (key: string) => key,
  $store: {
    state: { config: { apiUrl: '', instances: [], uiSettings: { general: { enableKeyboardShortcuts: true } } }, socket: { open: false } },
    getters: { 'config/getInstances': [], 'config/getCurrentInstance': null },
    dispatch: vi.fn()
  }
}

interface Vm {
  busyKey: string | null
  notice: string | null
  run: (key: string, work: () => Promise<boolean>) => Promise<void>
}

function mount () {
  return shallowMount(PrinterSwitcher, { mocks, propsData: { visible: false } }).vm as unknown as Vm
}

beforeEach(() => {
  vi.useFakeTimers()
  activation.activationState.error = null
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('printer row click while another open is in flight', () => {
  it('says so instead of ignoring the click silently', async () => {
    const vm = mount()
    const first = vm.run('boxwood', () => new Promise<boolean>(() => {}))
    first.catch(() => {})
    await vm.run('boxwood', async () => true)
    expect(vm.notice).toMatch(/still opening/i)
  })

  it('stops waiting on an open that never settles, and says why', async () => {
    const vm = mount()
    const hung = vm.run('boxwood', () => new Promise<boolean>(() => {}))
    expect(vm.busyKey).toBe('boxwood')
    await vi.advanceTimersByTimeAsync(RUN_TIMEOUT_MS + 1)
    await hung
    expect(vm.busyKey).toBeNull()
    expect(activation.activationState.error).toMatch(/didn't open/)
    // The row answers again.
    const work = vi.fn(async () => true)
    await vm.run('boxwood', work)
    expect(work).toHaveBeenCalledTimes(1)
  })

  it('clears the busy key when the open throws', async () => {
    const vm = mount()
    await vm.run('boxwood', async () => { throw new Error('boom') })
    expect(vm.busyKey).toBeNull()
  })
})
