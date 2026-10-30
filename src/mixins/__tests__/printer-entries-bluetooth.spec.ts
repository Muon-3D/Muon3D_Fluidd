import { describe, expect, it } from 'vitest'
import PrinterEntriesMixin from '../printer-entries'
import type { CardAction, DirectoryEntry } from '@/services/muon-cloud/directory'

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
