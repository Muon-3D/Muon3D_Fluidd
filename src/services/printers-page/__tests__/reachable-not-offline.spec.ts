import { describe, expect, it, vi } from 'vitest'
import { printerDirectory, type DirectorySources } from '@/services/muon-cloud/directory'
import type { CloudPrinter } from '@/services/muon-cloud/api'
import type { NearbyPrinter } from '@/services/muon-ble/nearby'
import { printersPage, type PageSources } from '../model'

vi.mock('@/store', () => ({ default: { state: { config: {} } } }))
vi.mock('@/services/secure-origin/hosted', () => ({ secureNameOf: () => undefined, knownReachable: () => false }))

// KAN-3411 / KAN-3154: a printer found on this network or over Bluetooth is reachable whether or not
// anyone is signed in and whether or not the cloud answers. The page shows its real state, never "Offline".

const ID = 'ab12'.repeat(16)
const API = 'http://192.168.1.7'
const NOW = 1_800_000_000_000
const account: CloudPrinter = { id: ID, name: 'Boxwood', model: 'M1', version: '1', online: false, last_seen: 0, online_since: null, linked_at: 0 }
const saved = { name: 'Boxwood', apiUrl: API, socketUrl: 'ws://192.168.1.7/websocket', endpointId: ID, active: false }
const lan = { host: '192.168.1.7', apiUrl: API, endpointId: ID, name: 'Boxwood', link: { phase: 'unlinked' }, health: { state: 'ready' } }
const advert = { deviceId: 'radio', device: {} as NearbyPrinter['device'], endpointId: ID, localName: 'Boxwood', display: 'Boxwood', advert: null, heardAt: NOW - 1000 }
const dead = { [ID]: { reachable: false, error: 'offline', updatedAt: NOW } } as DirectorySources['status']

function page (over: Partial<DirectorySources>, signedIn: boolean, now = NOW): ReturnType<typeof printersPage> {
  const directory = printerDirectory({ account: [], status: {}, email: null, saved: [], found: [], cloudNearby: [], nearby: [], activeCloudId: null, local: null, searching: false, now, ...over } as DirectorySources)
  return printersPage({ directory, groups: [], status: over.status ?? {}, activeJob: null, signedIn, now } as PageSources)
}
const tiles = (p: ReturnType<typeof printersPage>) => [...p.groups.flatMap(g => g.tiles), ...p.found]

describe.each([['signed out', false], ['signed in to an account with no printers', true]])('%s, the cloud unreachable', (_n, signedIn) => {
  it('lists a saved printer heard over Bluetooth as Nearby, not Offline', () => {
    const p = page({ saved: [saved], nearby: [advert] }, signedIn)
    expect(p.offline).toHaveLength(0)
    expect(tiles(p)).toHaveLength(1)
    expect(tiles(p)[0]).toMatchObject({ state: 'nearby', label: 'Nearby' })
    expect(p.counts.offline).toBe(0)
  })

  it('shows a saved printer carried over Bluetooth as Ready, via Bluetooth', () => {
    const p = page({ saved: [saved], nearby: [{ ...advert, heardAt: NOW - 90_000 }], viaBluetooth: () => true }, signedIn)
    expect(tiles(p)[0]).toMatchObject({ state: 'ready', detail: 'Via Bluetooth' })
    expect(p.offline).toHaveLength(0)
  })

  it('shows a saved printer found on the LAN as Ready on this network', () => {
    const p = page({ saved: [saved], found: [lan] as never }, signedIn)
    expect(tiles(p)[0]).toMatchObject({ state: 'ready', detail: 'On this network' })
  })

  it('lists a printer found on the LAN that nobody saved', () => {
    const p = page({ found: [lan] as never }, signedIn)
    expect(p.found).toHaveLength(1)
    expect(p.found[0].state).not.toBe('offline')
    expect(p.welcome).toBe(false)
  })

  it('lists a printer found only over Bluetooth that nobody saved', () => {
    const p = page({ nearby: [advert] }, signedIn)
    expect(p.found).toHaveLength(1)
    expect(p.found[0].state).not.toBe('offline')
    expect(p.welcome).toBe(false)
  })
})

describe('an account printer the console reports offline', () => {
  it('is Ready via Bluetooth when Bluetooth carries it and the status read failed', () => {
    const p = page({ account: [account], status: dead, viaBluetooth: () => true }, true)
    expect(tiles(p)[0]).toMatchObject({ state: 'ready', detail: 'Via Bluetooth' })
  })

  it('is Ready on this network when the LAN found it and the status read failed', () => {
    const p = page({ account: [account], status: dead, found: [lan] as never }, true)
    expect(tiles(p)[0]).toMatchObject({ state: 'ready', detail: 'On this network' })
    expect(p.offline).toHaveLength(0)
  })

  it('is Nearby when only its advert was heard', () => {
    const p = page({ account: [account], status: dead, nearby: [advert] }, true)
    expect(tiles(p)[0]).toMatchObject({ state: 'nearby' })
  })

  it('stays Offline with no evidence at all', () => {
    const p = page({ account: [account], status: dead }, true)
    expect(p.offline.map(t => t.state)).toEqual(['offline'])
  })
})
