import { describe, expect, it, vi } from 'vitest'
import { hasReachableRoute, printerDirectory, type DirectorySources } from '../directory'
import type { CloudPrinter } from '../api'
import type { NearbyPrinter } from '@/services/muon-ble/nearby'

vi.mock('@/store', () => ({ default: { state: { config: {} } } }))
vi.mock('@/services/secure-origin/hosted', () => ({ secureNameOf: (p?: { secure_name?: string }) => p?.secure_name, knownReachable: (name: string) => name === 'reachable.local' }))

const ID = 'ab12'.repeat(16)
const API = 'http://192.168.1.7'
const NOW = 1_800_000_000_000
const printer: CloudPrinter = { id: ID, name: 'Boxwood', model: 'M1', version: '1', online: false, last_seen: 0, online_since: null, linked_at: 0 }
const saved = { name: 'Boxwood', apiUrl: API, socketUrl: 'ws://192.168.1.7/websocket', endpointId: ID, active: false }
const lan = { host: '192.168.1.7', apiUrl: API, endpointId: ID, name: 'Boxwood', link: { phase: 'unlinked' } }
const advert = { deviceId: 'radio', device: {} as NearbyPrinter['device'], endpointId: ID, localName: 'Boxwood', display: 'Boxwood', advert: null, heardAt: NOW - 1000 }
const sources = (over: Partial<DirectorySources> = {}): DirectorySources => ({ account: [], status: {}, email: null, saved: [], found: [], cloudNearby: [], nearby: [], activeCloudId: null, local: null, searching: false, now: NOW, ...over })

describe('reachable on any route', () => {
  it.each([
    { found: [lan] },
    { cloudNearby: [{ printerId: ID, name: 'Boxwood', model: 'M1', linked: true, localAddrs: [] }] },
    { nearby: [advert] },
    { viaBluetooth: (id: string) => id === ID },
    { status: { [ID]: { reachable: true, state: 'standby', updatedAt: NOW } } },
    { account: [{ ...printer, online: true }] },
    { account: [{ ...printer, secure_name: 'reachable.local' }] }
  ])('recognises independent evidence: %j', evidence => {
    const src = sources({ saved: [saved], ...evidence })
    expect(hasReachableRoute({ endpointId: ID, apiUrl: API }, src)).toBe(true)
    const d = printerDirectory(src)
    expect([...d.cloud, ...d.local][0].health).not.toBe('offline')
  })

  it('keeps a connected Bluetooth printer Ready after its last advertisement expired', () => {
    const d = printerDirectory(sources({ saved: [saved], nearby: [{ ...advert, heardAt: NOW - 31_000 }], viaBluetooth: () => true }))
    expect(d.local[0]).toMatchObject({ health: 'online', route: 'bluetooth' })
  })

  it('does not lose live Bluetooth when console presence and a failed status read say offline', () => {
    const d = printerDirectory(sources({ account: [printer], status: { [ID]: { reachable: false, error: 'offline', updatedAt: NOW } }, viaBluetooth: () => true }))
    expect(d.cloud[0]).toMatchObject({ health: 'online', route: 'bluetooth' })
  })

  it('preserves actual printing status even if the console says offline', () => {
    const d = printerDirectory(sources({ account: [printer], status: { [ID]: { reachable: true, state: 'printing', updatedAt: NOW } } }))
    expect(d.cloud[0].health).toBe('printing')
  })

  it('uses LAN identity discovery even when its separate status probe failed', () => {
    const d = printerDirectory(sources({ account: [printer], found: [lan], status: { [ID]: { reachable: false, error: 'offline', updatedAt: NOW } } }))
    expect(d.cloud[0].health).toBe('available')
    expect(d.cloud[0].detail).toContain('On this network')
    expect(printerDirectory(sources({ found: [lan] })).found[0].health).toBe('available')
  })

  it('does not let a failed local socket override a fresh advertisement', () => {
    const d = printerDirectory(sources({ saved: [{ ...saved, active: true }], nearby: [advert], local: { apiUrl: API, health: 'offline', detail: 'Offline' } }))
    expect(d.local[0].health).toBe('nearby')
  })

  it('leaves printers with no evidence Offline, including expired sightings and unrelated printers', () => {
    const src = sources({ saved: [saved], nearby: [{ ...advert, heardAt: NOW - 31_000 }], viaBluetooth: () => false, found: [{ ...lan, endpointId: 'other', apiUrl: 'http://192.168.1.8' }] })
    expect(hasReachableRoute({ endpointId: ID, apiUrl: API }, src)).toBe(false)
    expect(printerDirectory(src).local[0].health).toBe('offline')
    expect(hasReachableRoute({}, sources())).toBe(false)
    expect(hasReachableRoute({ endpointId: ID, apiUrl: API }, sources({ found: [{ ...lan, endpointId: 'other' }] }))).toBe(false)
  })
})
