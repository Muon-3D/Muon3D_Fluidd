/**
 * KAN-1374: "Pair this browser" is in a printer's options menu, linked or not,
 * whenever the pairing switch (panelCodePairing) is on, and choosing it runs the
 * Bluetooth picker, then the existing code dialog (startPairing).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setPanelCodePairing } from '@/services/muon-cloud/activate'
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
})
afterEach(() => setPanelCodePairing(null))

describe('Pair this browser in the printer menu (KAN-1374)', () => {
  it('is offered for a cloud-linked printer when the switch is on, with its hint', () => {
    setPanelCodePairing(true)
    const a = pair(methods.cloudActions(linked()))
    expect(a?.label).toBe('Pair this browser')
    expect(a?.hint).toBe("Open Add a device on the printer's screen first.")
    expect(a?.disabled).toBe(false)
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

  it('runs the picker, then startPairing for that printer', async () => {
    setPanelCodePairing(true)
    const device = { chosen: true }
    nearby.lookNearby.mockResolvedValue({ device, endpointId: 'walnut' })
    const c = { notice: null as string | null, pairThisBrowserFrom: methods.pairThisBrowserFrom }
    await methods.onAction.call(c, linked(), 'pair-browser')
    expect(nearby.lookNearby).toHaveBeenCalledOnce()
    expect(pairing.startPairing).toHaveBeenCalledWith('walnut')
  })

  it('skips the picker for a printer already heard', async () => {
    setPanelCodePairing(true)
    const heard = { ...linked(), nearby: { device: { heard: true } } as unknown as DirectoryEntry['nearby'] }
    const c = { notice: null, pairThisBrowserFrom: methods.pairThisBrowserFrom }
    await methods.onAction.call(c, heard, 'pair-browser')
    expect(nearby.lookNearby).not.toHaveBeenCalled()
    expect(pairing.startPairing).toHaveBeenCalledWith('walnut')
  })

  it('does not pair when the picker is dismissed, or the wrong device is chosen', async () => {
    setPanelCodePairing(true)
    const c = { notice: null as string | null, pairThisBrowserFrom: methods.pairThisBrowserFrom }
    nearby.lookNearby.mockResolvedValue(null)
    await methods.onAction.call(c, linked(), 'pair-browser')
    nearby.lookNearby.mockResolvedValue({ device: {}, endpointId: 'someone-else' })
    await methods.onAction.call(c, linked(), 'pair-browser')
    expect(pairing.startPairing).not.toHaveBeenCalled()
    expect(c.notice).toContain("isn't Walnut")
  })
})
