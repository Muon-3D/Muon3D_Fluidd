import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cloudState } from '@/services/muon-cloud/state'

const nearby = vi.hoisted(() => ({
  nearbyState: { printers: [], support: 'supported', radio: 'on' },
  lookNearby: vi.fn(),
  permittedPrinterFor: vi.fn(),
  rememberedName: vi.fn(),
  isPrinter: vi.fn()
}))
vi.mock('@/services/muon-ble/nearby', () => nearby)
const { default: PrinterEntriesMixin } = await import('../printer-entries')
const connect = (PrinterEntriesMixin as unknown as { options: { methods: { onConnectOverBluetooth: (this: unknown) => Promise<void> } } }).options.methods.onConnectOverBluetooth
const heard = { deviceId: 'dev-a', endpointId: 'printer-a', display: 'Boxwood', device: {} }
const component = () => ({
  directory: { cloud: [] as unknown[], local: [] as unknown[], found: [] as unknown[] },
  notice: 'old' as string | null,
  connectOverBluetooth: vi.fn(),
  pairNearbyPrinter: vi.fn(),
  openFoundEntry: vi.fn()
})

beforeEach(() => {
  vi.clearAllMocks()
  nearby.lookNearby.mockResolvedValue(heard)
  cloudState.ready = true
})

describe('the primary Bluetooth action', () => {
  it('holds Bluetooth for a saved printer, rather than telling the person to open its tile', async () => {
    const c = component()
    c.directory.local = [{ key: 'saved:a', nearby: heard }]
    await connect.call(c)
    expect(c.pairNearbyPrinter).toHaveBeenCalledWith(heard, 'saved:a', true)
    expect(c.notice).toBeNull()
    expect(c.openFoundEntry).not.toHaveBeenCalled()
  })

  it('holds Bluetooth for a LAN-discovered printer instead of taking its automatic LAN route', async () => {
    const c = component()
    c.directory.found = [{ key: 'found:a', nearby: heard, row: { action: 'open' } }]
    await connect.call(c)
    expect(c.pairNearbyPrinter).toHaveBeenCalledWith(heard, 'found:a', true)
    expect(c.openFoundEntry).not.toHaveBeenCalled()
  })

  it('still opens account printers using their chosen Bluetooth device', async () => {
    const c = component()
    nearby.isPrinter.mockReturnValueOnce(true)
    const entry = { cloud: { id: heard.endpointId } }
    c.directory.cloud = [entry]
    await connect.call(c)
    expect(c.connectOverBluetooth).toHaveBeenCalledWith(entry, heard)
    expect(c.pairNearbyPrinter).not.toHaveBeenCalled()
  })

  it('keeps setup for a printer that has not been set up', async () => {
    const c = component()
    const entry = { key: 'found:a', nearby: heard, row: { action: 'set-up' } }
    c.directory.found = [entry]
    await connect.call(c)
    expect(c.openFoundEntry).toHaveBeenCalledWith(entry)
    expect(c.pairNearbyPrinter).not.toHaveBeenCalled()
  })

  it('does nothing when the chooser is dismissed', async () => {
    const c = component()
    nearby.lookNearby.mockResolvedValueOnce(null)
    await connect.call(c)
    expect(c.pairNearbyPrinter).not.toHaveBeenCalled()
    expect(c.openFoundEntry).not.toHaveBeenCalled()
    expect(c.notice).toBeNull()
  })

  it('says why an unidentified device cannot be opened', async () => {
    const c = component()
    nearby.lookNearby.mockResolvedValueOnce({ ...heard, endpointId: null })
    await connect.call(c)
    expect(c.pairNearbyPrinter).not.toHaveBeenCalled()
    expect(c.notice).toContain("Couldn't tell which printer")
  })
})
