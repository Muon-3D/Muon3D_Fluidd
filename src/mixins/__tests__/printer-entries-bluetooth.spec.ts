import { afterEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import * as cloudStateModule from '@/services/muon-cloud/state'
import { activateCloudPrinter } from '@/services/muon-cloud/activate'
import { stopUsingBluetoothFor, useBluetoothFor, wantsBluetoothFor } from '@/services/muon-ble/link'
import type { CardAction, DirectoryEntry } from '@/services/muon-cloud/directory'

vi.mock('@/services/muon-cloud/activate', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/muon-cloud/activate')>(),
  activateCloudPrinter: vi.fn(async () => {})
}))
const activate = vi.mocked(activateCloudPrinter)

// cloudActions reads nothing from the component, so it runs without mounting one.
const cloudActions = (PrinterEntriesMixin as unknown as {
  options: { methods: { cloudActions: (e: DirectoryEntry) => CardAction[] } }
}).options.methods.cloudActions

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
  nearby: heard ? ({ device: {} } as DirectoryEntry['nearby']) : undefined
})

const offersBluetooth = (e: DirectoryEntry) => cloudActions(e).some(a => a.id === 'connect-bluetooth')

describe('Connect over Bluetooth (KAN-1175)', () => {
  it('is offered for a printer heard nearby while the service calls it online', () => {
    expect(offersBluetooth(entry(true, true))).toBe(true)
  })

  it('is offered for a printer heard nearby that the service has lost', () => {
    expect(offersBluetooth(entry(false, true))).toBe(true)
  })

  it('is not offered for a printer nobody heard', () => {
    expect(offersBluetooth(entry(true, false))).toBe(false)
  })
})

describe('choosing the way in (KAN-1253)', () => {
  const connectCloud = (PrinterEntriesMixin as unknown as {
    options: { methods: { connectCloud: (this: unknown, e: DirectoryEntry, route?: unknown) => unknown } }
  }).options.methods.connectCloud
  const device = { addEventListener () {}, removeEventListener () {} } as any
  const drop = vi.spyOn(cloudStateModule, 'dropCloudConnection').mockImplementation(() => {})

  afterEach(() => {
    stopUsingBluetoothFor('walnut')
    drop.mockClear()
    activate.mockClear()
  })

  const component = (busy: boolean) => ({
    run: async (_key: string, work: () => Promise<boolean>) => { if (!busy) await work() }
  })

  it('connect-cloud undoes an earlier Bluetooth choice and drops the open connection', async () => {
    useBluetoothFor('walnut', device)
    expect(wantsBluetoothFor('walnut')).toBe(true)
    await connectCloud.call(component(false), entry(true, true), 'relay')
    expect(wantsBluetoothFor('walnut')).toBe(false)
    expect(drop).toHaveBeenCalledWith('walnut')
    expect(activate).toHaveBeenCalledWith('walnut')
  })

  it('connect-bluetooth stores the device and drops the open connection', async () => {
    await connectCloud.call(component(false), entry(true, true), device)
    expect(wantsBluetoothFor('walnut')).toBe(true)
    expect(drop).toHaveBeenCalledWith('walnut')
  })

  it('a click ignored while another open is busy changes nothing', async () => {
    useBluetoothFor('walnut', device)
    await connectCloud.call(component(true), entry(true, true), 'relay')
    expect(wantsBluetoothFor('walnut')).toBe(true)
    await connectCloud.call(component(true), entry(true, true), device)
    expect(drop).not.toHaveBeenCalled()
    expect(activate).not.toHaveBeenCalled()
  })
})
