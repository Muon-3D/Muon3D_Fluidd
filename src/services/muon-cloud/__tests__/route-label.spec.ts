import { describe, expect, it, vi } from 'vitest'
import { printerDirectory } from '../directory'
import { printersPage } from '@/services/printers-page/model'
import { RemoteOpenTimeout } from '../activate'
import type { CloudPrinter } from '../api'
import type { PrinterStatus } from '../status'

vi.mock('@/store', () => ({ default: { state: { config: {} } } }))

const ID = 'f1f6920f'.repeat(8)
// Boxwood with its Wi-Fi off: the console calls it offline.
const boxwood: CloudPrinter = { id: ID, name: 'Boxwood · 367A', model: 'M1', version: '1', linked_at: 0, last_seen: 1, online: false, online_since: null }
const status = { [ID]: { reachable: true, state: 'standby', updatedAt: 1 } as PrinterStatus }

const directory = (viaBluetooth?: (id: string) => boolean) => printerDirectory({
  account: [boxwood],
  status,
  email: 'jack@example.com',
  saved: [],
  found: [],
  cloudNearby: [],
  nearby: [],
  activeCloudId: ID,
  local: null,
  searching: false,
  viaBluetooth
})

describe('the route label follows the transport (I-133)', () => {
  it('says Bluetooth, not offline, when the transport is Bluetooth and the cloud says offline', () => {
    const e = directory(id => id === ID).cloud[0]
    expect(e.route).toBe('bluetooth')
    expect(e.health).not.toBe('offline')
    expect(e.detail).toMatch(/via Bluetooth/i)
    const tile = printersPage({ directory: { cloud: [e], local: [], found: [], foreign: [] }, groups: [], status, activeJob: null, signedIn: true }).groups[0].tiles[0]
    expect(tile.state).toBe('ready')
    expect(tile.detail).toBe('Via Bluetooth')
    expect(tile.remote).toBe(false)
  })

  it('still follows the console when the transport is not Bluetooth', () => {
    const e = directory(() => false).cloud[0]
    expect(e.route).toBeUndefined()
    expect(e.health).toBe('offline')
  })

  it('names Bluetooth, not Muon3D, in a Bluetooth open timeout', () => {
    const message = new RemoteOpenTimeout('Boxwood', true).message
    expect(message).toMatch(/Bluetooth/)
    expect(message).not.toMatch(/Muon3D/)
    expect(new RemoteOpenTimeout('Boxwood').message).toMatch(/Muon3D/)
  })
})
