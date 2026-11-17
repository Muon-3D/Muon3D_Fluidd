/**
 * KAN-3588 (was KAN-1374): there is one Bluetooth item in a printer's options menu, Connect over
 * Bluetooth. "Pair this browser" is gone from the menu: when the printer asks for pairing, the code
 * dialog (startPairing) opens from inside Connect over Bluetooth. KAN-3589: its chooser is the
 * top-right button's (no filter on the printer).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activationState, setPanelCodePairing } from '@/services/muon-cloud/activate'
import { cloudState } from '@/services/muon-cloud/state'
import type { CardAction, DirectoryEntry } from '@/services/muon-cloud/directory'

const nearby = vi.hoisted(() => ({
  nearbyState: { printers: [] as unknown[], support: 'supported', radio: 'on', choosing: false, error: null },
  lookNearby: vi.fn(),
  permittedPrinterFor: vi.fn(async () => null as unknown),
  rememberedName: vi.fn((): string | undefined => undefined),
  isPrinter: vi.fn((p: { endpointId: string | null }, id: string) => p.endpointId === id)
}))
vi.mock('@/services/muon-ble/nearby', () => nearby)
const pairing = vi.hoisted(() => ({ startPairing: vi.fn(async () => {}) }))
vi.mock('@/services/muon-ble/pairing', () => pairing)

const { default: PrinterEntriesMixin } = await import('../printer-entries')

type Methods = {
  cloudActions: (e: DirectoryEntry) => CardAction[]
  localActions: (e: DirectoryEntry) => CardAction[]
  foundActions: (e: DirectoryEntry) => CardAction[]
  onAction: (this: unknown, e: DirectoryEntry, id: string) => Promise<unknown>
  connectOverBluetooth: unknown
}
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Methods } }).options.methods

const base: DirectoryEntry = {
  key: 'cloud:walnut',
  section: 'cloud',
  name: 'Walnut',
  endpointId: 'walnut',
  health: 'online',
  detail: '',
  host: null,
  active: null,
  linkedTo: 'mine',
  saved: []
}
const linked = (): DirectoryEntry => ({ ...base, cloud: { id: 'walnut', online: true } as DirectoryEntry['cloud'] })
const notLinked = (): DirectoryEntry => ({ ...base, key: 'local:walnut', section: 'local', linkedTo: 'none' as DirectoryEntry['linkedTo'], host: '192.168.1.20' })
const pair = (a: CardAction[]) => a.find(x => x.id === 'pair-browser' || /pair/i.test(x.label))

beforeEach(() => {
  nearby.nearbyState.support = 'supported'
  nearby.lookNearby.mockReset()
  nearby.permittedPrinterFor.mockReset().mockResolvedValue(null)
  pairing.startPairing.mockClear()
  cloudState.ready = true
  activationState.pairing = null
  activationState.approval = null
})
afterEach(() => setPanelCodePairing(null))

describe('one Connect over Bluetooth item in the printer menu (KAN-3588)', () => {
  it('lists Connect over Bluetooth once and no Pair this browser, whatever the pairing switch says', () => {
    for (const on of [true, false, null]) {
      setPanelCodePairing(on)
      for (const actions of [methods.cloudActions(linked()), methods.localActions(notLinked()), methods.foundActions({ ...linked(), section: 'found', nearby: { device: {} } as unknown as DirectoryEntry['nearby'] })]) {
        expect(pair(actions)).toBeUndefined()
      }
      expect(methods.cloudActions(linked()).filter(a => a.id === 'connect-bluetooth')).toHaveLength(1)
    }
  })

  /** What the host component is: the picker and connect are Connect over Bluetooth's own. */
  const host = (refused: boolean) => ({
    notice: null as string | null,
    connectCloud: vi.fn(async () => { activationState.pairing = refused ? 'walnut' : null }),
    connectOverBluetooth: methods.connectOverBluetooth
  })

  it('runs the picker, connects over Bluetooth, and goes on to the code dialog when the printer will not take a stranger', async () => {
    setPanelCodePairing(true)
    const device = { chosen: true }
    nearby.lookNearby.mockResolvedValue({ device, endpointId: 'walnut' })
    const c = host(true)
    activationState.approval = { cancel: vi.fn() } as never
    await methods.onAction.call(c, linked(), 'connect-bluetooth')
    // The top-right button's chooser: no filter on this printer (KAN-3589).
    expect(nearby.lookNearby).toHaveBeenCalledWith()
    expect(c.connectCloud).toHaveBeenCalledWith(expect.anything(), device, false)
    expect(pairing.startPairing).toHaveBeenCalledWith('walnut')
    expect(pairing.startPairing).toHaveBeenCalledTimes(1)
    // The wait's "refused" is not left on screen over the code dialog.
    expect(activationState.approval).toBeNull()
  })

  it('does not open the code dialog when the printer admits the browser, or holds it for Accept or Reject', async () => {
    setPanelCodePairing(true)
    nearby.lookNearby.mockResolvedValue({ device: {}, endpointId: 'walnut' })
    await methods.onAction.call(host(false), linked(), 'connect-bluetooth')
    expect(pairing.startPairing).not.toHaveBeenCalled()
  })

  it('skips the picker for a printer already heard', async () => {
    setPanelCodePairing(true)
    const heard = { ...linked(), nearby: { device: { heard: true } } as unknown as DirectoryEntry['nearby'] }
    await methods.onAction.call(host(true), heard, 'connect-bluetooth')
    expect(nearby.lookNearby).not.toHaveBeenCalled()
    expect(pairing.startPairing).toHaveBeenCalledWith('walnut')
  })

  it('does nothing when the picker is dismissed, or the wrong device is chosen', async () => {
    setPanelCodePairing(true)
    const c = host(true)
    nearby.lookNearby.mockResolvedValue(null)
    await methods.onAction.call(c, linked(), 'connect-bluetooth')
    nearby.lookNearby.mockResolvedValue({ device: {}, endpointId: 'someone-else' })
    await methods.onAction.call(c, linked(), 'connect-bluetooth')
    expect(pairing.startPairing).not.toHaveBeenCalled()
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.notice).toContain("isn't Walnut")
  })

  it('still connects when the old pairing switch is off (pairing is part of connecting)', async () => {
    setPanelCodePairing(false)
    nearby.lookNearby.mockResolvedValue({ device: {}, endpointId: 'walnut' })
    const c = host(false)
    await methods.onAction.call(c, linked(), 'connect-bluetooth')
    expect(c.connectCloud).toHaveBeenCalledTimes(1)
  })
})
