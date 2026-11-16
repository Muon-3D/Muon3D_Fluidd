/**
 * KAN-1374: "Pair this browser" is in a printer's options menu, linked or not,
 * whenever the pairing switch (panelCodePairing) is on, and choosing it runs the
 * Bluetooth picker, then the existing code dialog (startPairing).
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
  pairThisBrowserFrom: unknown
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
const pair = (a: CardAction[]) => a.find(x => x.id === 'pair-browser')

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

describe('Pair this browser in the printer menu (KAN-1374)', () => {
  it('is offered for a cloud-linked printer when the switch is on, with its hint', () => {
    setPanelCodePairing(true)
    const a = pair(methods.cloudActions(linked()))
    expect(a?.label).toBe('Pair this browser')
    // On this account, so it has an owner.
    expect(a?.hint).toBe("Open System > Add a device on the printer's screen first.")
    expect(a?.disabled).toBe(false)
  })

  it('says where to open the pairing window by who owns the printer: owned, in set-up, or unknown', () => {
    setPanelCodePairing(true)
    const heard = (unclaimed: boolean) => ({ device: {}, advert: { unclaimed, busy: false, endpointPrefix: '' } }) as unknown as DirectoryEntry['nearby']
    const hint = (e: DirectoryEntry) => pair(methods.cloudActions(e))?.hint
    expect(hint({ ...linked(), nearby: heard(false) })).toBe("Open System > Add a device on the printer's screen first.")
    expect(hint({ ...linked(), linkedTo: 'unknown' })).toBe("Check the printer's screen. If nothing shows, open System > Add a device.")
    // Still in first-run set-up: the printer opens its pairing window by itself, so no Add a device hint.
    expect(hint({ ...linked(), linkedTo: 'unknown', nearby: heard(true) })).toBeUndefined()
    expect(pair(methods.cloudActions({ ...linked(), linkedTo: 'unknown', nearby: heard(true) }))?.label).toBe('Pair this browser')
  })

  it('is offered for a printer that is not linked when the switch is on', () => {
    setPanelCodePairing(true)
    expect(pair(methods.localActions(notLinked()))).toBeDefined()
  })

  it('is not offered when the switch is off, linked or not', () => {
    setPanelCodePairing(false)
    expect(pair(methods.cloudActions(linked()))).toBeUndefined()
    expect(pair(methods.localActions(notLinked()))).toBeUndefined()
  })

  /** What the host component is: the picker and connect are Connect over Bluetooth's own. */
  const host = (refused: boolean) => ({
    notice: null as string | null,
    connectCloud: vi.fn(async () => { activationState.pairing = refused ? 'walnut' : null }),
    pairThisBrowserFrom: methods.pairThisBrowserFrom,
    connectOverBluetooth: methods.connectOverBluetooth
  })

  it('runs the picker, connects over Bluetooth, and goes on to the code dialog when the printer will not take a stranger', async () => {
    setPanelCodePairing(true)
    const device = { chosen: true }
    nearby.lookNearby.mockResolvedValue({ device, endpointId: 'walnut' })
    const c = host(true)
    activationState.approval = { cancel: vi.fn() } as never
    await methods.onAction.call(c, linked(), 'pair-browser')
    expect(nearby.lookNearby).toHaveBeenCalledOnce()
    expect(c.connectCloud).toHaveBeenCalledWith(expect.anything(), device, false)
    expect(pairing.startPairing).toHaveBeenCalledWith('walnut')
    expect(pairing.startPairing).toHaveBeenCalledTimes(1)
    // The wait's "refused" is not left on screen over the code dialog.
    expect(activationState.approval).toBeNull()
  })

  it('does not open the code dialog when the printer admits the browser, or holds it for Accept or Reject', async () => {
    setPanelCodePairing(true)
    nearby.lookNearby.mockResolvedValue({ device: {}, endpointId: 'walnut' })
    await methods.onAction.call(host(false), linked(), 'pair-browser')
    expect(pairing.startPairing).not.toHaveBeenCalled()
  })

  it('skips the picker for a printer already heard', async () => {
    setPanelCodePairing(true)
    const heard = { ...linked(), nearby: { device: { heard: true } } as unknown as DirectoryEntry['nearby'] }
    await methods.onAction.call(host(true), heard, 'pair-browser')
    expect(nearby.lookNearby).not.toHaveBeenCalled()
    expect(pairing.startPairing).toHaveBeenCalledWith('walnut')
  })

  it('does nothing when the picker is dismissed, or the wrong device is chosen', async () => {
    setPanelCodePairing(true)
    const c = host(true)
    nearby.lookNearby.mockResolvedValue(null)
    await methods.onAction.call(c, linked(), 'pair-browser')
    nearby.lookNearby.mockResolvedValue({ device: {}, endpointId: 'someone-else' })
    await methods.onAction.call(c, linked(), 'pair-browser')
    expect(pairing.startPairing).not.toHaveBeenCalled()
    expect(c.connectCloud).not.toHaveBeenCalled()
    expect(c.notice).toContain("isn't Walnut")
  })

  it('does nothing at all when the switch is off', async () => {
    setPanelCodePairing(false)
    const c = host(true)
    await methods.onAction.call(c, linked(), 'pair-browser')
    expect(nearby.lookNearby).not.toHaveBeenCalled()
    expect(pairing.startPairing).not.toHaveBeenCalled()
  })
})
