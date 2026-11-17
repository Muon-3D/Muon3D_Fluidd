import { afterEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import { bluetoothOnly, cloudState } from '@/services/muon-cloud/state'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'
import type { NearbyPrinter } from '@/services/muon-ble/nearby'

const id = 'off-account-remember'
const methods = (PrinterEntriesMixin as unknown as { options: { methods: { connectOverBluetooth: (this: unknown, e: DirectoryEntry, chosen: NearbyPrinter) => Promise<void> } } }).options.methods
const e: DirectoryEntry = { key: id, endpointId: id, name: 'Fallback', section: 'found', health: 'nearby', detail: '', host: null, active: null, linkedTo: 'other', saved: [] }
const heard = { endpointId: id, display: 'Sloe · 5522', localName: 'muon-sloe-5522', device: {} } as NearbyPrinter
const previous = cloudState.printers

afterEach(() => {
  cloudState.printers = previous
  delete bluetoothOnly.names[id]
})

describe('remembering a Bluetooth printer off the account', () => {
  it('records its advertised name before admission can publish the active printer', async () => {
    cloudState.printers = []
    const connectCloud = vi.fn(() => expect(bluetoothOnly.names[id]).toBe('Sloe · 5522'))
    await methods.connectOverBluetooth.call({ connectCloud }, e, heard)
    expect(connectCloud).toHaveBeenCalledWith(e, heard.device, false)
  })

  it('does nothing without an identity', async () => {
    const connectCloud = vi.fn()
    await methods.connectOverBluetooth.call({ connectCloud }, { ...e, endpointId: null }, heard)
    expect(connectCloud).not.toHaveBeenCalled()
    expect(bluetoothOnly.names[id]).toBeUndefined()
  })

  it('propagates admission errors rather than treating a remembered name as permission', async () => {
    cloudState.printers = []
    const connectCloud = vi.fn().mockRejectedValue(new Error('Refused'))
    await expect(methods.connectOverBluetooth.call({ connectCloud }, e, heard)).rejects.toThrow('Refused')
    expect(cloudState.activePrinterId).not.toBe(id)
  })
})
