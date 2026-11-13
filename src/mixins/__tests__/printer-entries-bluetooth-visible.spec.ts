import { beforeEach, describe, expect, it, vi } from 'vitest'
import { activationState } from '@/services/muon-cloud/activate'
import { cloudState } from '@/services/muon-cloud/state'
import type { CardAction, DirectoryEntry } from '@/services/muon-cloud/directory'

const nearby = vi.hoisted(() => ({
  nearbyState: { printers: [] as unknown[], support: 'supported', radio: 'on', choosing: false, error: null },
  lookNearby: vi.fn(),
  permittedPrinterFor: vi.fn(async () => null as unknown),
  isPrinter: vi.fn((p: { endpointId: string | null }, id: string) => p.endpointId === id)
}))
vi.mock('@/services/muon-ble/nearby', () => nearby)
const pairing = vi.hoisted(() => ({ startPairing: vi.fn(async () => {}) }))
vi.mock('@/services/muon-ble/pairing', () => pairing)

const { default: PrinterEntriesMixin } = await import('../printer-entries')

type Methods = {
  cloudActions: (e: DirectoryEntry) => CardAction[]
  onAction: (this: unknown, e: DirectoryEntry, id: string) => Promise<unknown>
  connectOverBluetooth: unknown
  onConnectOverBluetooth: (this: unknown) => Promise<unknown>
}
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Methods } }).options.methods

const entry = (online: boolean, heard: boolean): DirectoryEntry => ({
  key: 'cloud:walnut',
  section: 'cloud',
  name: 'Walnut',
  endpointId: 'walnut',
  health: online ? 'online' : 'offline',
  detail: '',
  host: null,
  active: null,
  linkedTo: 'mine',
  saved: [],
  cloud: { id: 'walnut', online } as DirectoryEntry['cloud'],
  nearby: heard ? ({ device: { heard: true } } as unknown as DirectoryEntry['nearby']) : undefined
})
const has = (e: DirectoryEntry) => methods.cloudActions(e).some(a => a.id === 'connect-bluetooth')

beforeEach(() => {
  nearby.nearbyState.support = 'supported'
  nearby.lookNearby.mockReset()
  nearby.permittedPrinterFor.mockReset().mockResolvedValue(null)
  pairing.startPairing.mockClear()
  activationState.pairing = null
  cloudState.ready = true
})

describe('Connect over Bluetooth without Look nearby (I-129)', () => {
  it('is offered for a printer nobody has heard yet, online or not', () => {
    expect(has(entry(true, false))).toBe(true)
    expect(has(entry(false, false))).toBe(true)
  })

  it('is not offered where the browser has no Bluetooth', () => {
    nearby.nearbyState.support = 'unsupported'
    expect(has(entry(true, false))).toBe(false)
  })

  it('runs the device picker itself, then connects over the chosen device', async () => {
    const device = { chosen: true }
    nearby.lookNearby.mockResolvedValue({ device, endpointId: 'walnut' })
    const c = { connectCloud: vi.fn(), notice: null as string | null, connectOverBluetooth: methods.connectOverBluetooth }
    await methods.onAction.call(c, entry(true, false), 'connect-bluetooth')
    expect(nearby.lookNearby).toHaveBeenCalledOnce()
    expect(c.connectCloud).toHaveBeenCalledWith(expect.anything(), device)
  })

  it('uses the device already heard, without the picker', async () => {
    const c = { connectCloud: vi.fn(), notice: null, connectOverBluetooth: methods.connectOverBluetooth }
    await methods.onAction.call(c, entry(true, true), 'connect-bluetooth')
    expect(nearby.lookNearby).not.toHaveBeenCalled()
    expect(c.connectCloud).toHaveBeenCalledWith(expect.anything(), { heard: true })
  })

  it('does nothing when the picker is dismissed, and refuses a different printer', async () => {
    const c = { connectCloud: vi.fn(), notice: null as string | null, connectOverBluetooth: methods.connectOverBluetooth }
    nearby.lookNearby.mockResolvedValue(null)
    await methods.onAction.call(c, entry(true, false), 'connect-bluetooth')
    nearby.lookNearby.mockResolvedValue({ device: {}, endpointId: 'other' })
    await methods.onAction.call(c, entry(true, false), 'connect-bluetooth')
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.notice).toMatch(/isn't Walnut/)
  })

  it('uses a device the browser already permits, without the picker', async () => {
    const device = { permitted: true }
    nearby.permittedPrinterFor.mockResolvedValue({ device, endpointId: 'walnut' })
    const c = { connectCloud: vi.fn(), notice: null, connectOverBluetooth: methods.connectOverBluetooth }
    await methods.onAction.call(c, entry(true, false), 'connect-bluetooth')
    expect(nearby.lookNearby).not.toHaveBeenCalled()
    expect(c.connectCloud).toHaveBeenCalledWith(expect.anything(), device)
  })

  it('goes straight into pairing when the printer refused this browser', async () => {
    nearby.lookNearby.mockResolvedValue({ device: {}, endpointId: 'walnut' })
    const c = {
      connectCloud: vi.fn(async () => { activationState.pairing = 'walnut' }),
      notice: null,
      connectOverBluetooth: methods.connectOverBluetooth
    }
    await methods.onAction.call(c, entry(true, false), 'connect-bluetooth')
    expect(pairing.startPairing).toHaveBeenCalledWith('walnut')
  })

  it('does not start pairing when the connect worked', async () => {
    const c = { connectCloud: vi.fn(), notice: null, connectOverBluetooth: methods.connectOverBluetooth }
    await methods.onAction.call(c, entry(true, true), 'connect-bluetooth')
    expect(pairing.startPairing).not.toHaveBeenCalled()
  })
})

describe('Connect over Bluetooth for one printer lists only that printer (KAN-2470)', () => {
  it("asks the chooser for this printer's EndpointId", async () => {
    nearby.lookNearby.mockResolvedValue(null)
    const c = { connectCloud: vi.fn(), notice: null, connectOverBluetooth: methods.connectOverBluetooth }
    await methods.onAction.call(c, entry(true, false), 'connect-bluetooth')
    expect(nearby.lookNearby).toHaveBeenCalledWith({ endpointId: 'walnut', name: undefined })
  })

  it('a pick that is not this printer is refused after connect, whatever the filter said', async () => {
    nearby.lookNearby.mockResolvedValue({ device: {}, endpointId: 'impostor' })
    const c = { connectCloud: vi.fn(), notice: null as string | null, connectOverBluetooth: methods.connectOverBluetooth }
    await methods.onAction.call(c, entry(true, false), 'connect-bluetooth')
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.notice).toMatch(/isn't Walnut/)
  })
})

describe('the Connect over Bluetooth button (KAN-2470)', () => {
  const page = (printers: unknown[]) => ({
    connectCloud: vi.fn(),
    notice: null as string | null,
    directory: { cloud: printers },
    connectOverBluetooth: methods.connectOverBluetooth
  })

  it('opens a printer already on the account over the device just chosen, with no second chooser', async () => {
    const device = { picked: true }
    nearby.lookNearby.mockResolvedValue({ device, endpointId: 'walnut' })
    const c = page([entry(true, false)])
    await methods.onConnectOverBluetooth.call(c)
    expect(nearby.lookNearby).toHaveBeenCalledOnce()
    expect(nearby.lookNearby).toHaveBeenCalledWith()
    expect(c.connectCloud).toHaveBeenCalledWith(expect.anything(), device)
  })

  it('sends a printer that is not on the account to its set-up, never a silent no-op (KAN-2530)', async () => {
    const heardNew = { deviceId: 'd1', device: {}, endpointId: 'brand-new', display: 'Walnut · 8987' }
    nearby.lookNearby.mockResolvedValue(heardNew)
    const found = { name: 'Walnut', nearby: heardNew }
    const c = { ...page([entry(true, false)]), openFoundEntry: vi.fn() }
    c.directory = { cloud: [entry(true, false)], found: [found], local: [] } as never
    await methods.onConnectOverBluetooth.call(c)
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.openFoundEntry).toHaveBeenCalledWith(found)
  })

  it('says so when the printer has no EndpointId', async () => {
    nearby.lookNearby.mockResolvedValue({ deviceId: 'd1', device: {}, endpointId: null, display: 'Walnut · 8987' })
    const c = page([entry(true, false)])
    await methods.onConnectOverBluetooth.call(c)
    expect(c.notice).toMatch(/Couldn't tell which printer/)
  })

  it('says the account is still loading rather than guessing', async () => {
    cloudState.ready = false
    nearby.lookNearby.mockResolvedValue({ deviceId: 'd1', device: {}, endpointId: 'brand-new', display: 'Walnut' })
    const c = page([entry(true, false)])
    await methods.onConnectOverBluetooth.call(c)
    expect(c.notice).toMatch(/still loading/)
  })

  it('still says something when the heard printer is listed nowhere', async () => {
    nearby.lookNearby.mockResolvedValue({ deviceId: 'd1', device: {}, endpointId: 'brand-new', display: 'Walnut · 8987' })
    const c = { ...page([]), openFoundEntry: vi.fn() }
    c.directory = { cloud: [], found: [], local: [] } as never
    await methods.onConnectOverBluetooth.call(c)
    expect(c.notice).toMatch(/Walnut · 8987 was found over Bluetooth/)
  })

  it('does nothing, and says nothing, when the chooser is dismissed', async () => {
    nearby.lookNearby.mockResolvedValue(null)
    const c = page([entry(true, false)])
    await methods.onConnectOverBluetooth.call(c)
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.notice).toBeNull()
  })
})
