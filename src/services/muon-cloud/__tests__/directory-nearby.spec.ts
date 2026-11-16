/**
 * KAN-2528: a printer whose Bluetooth advert was heard in the last 30 s is
 * never "Offline": it is Nearby, and Bluetooth opens it.
 */
import { describe, expect, it, vi } from 'vitest'
import { printerDirectory, type DirectorySources } from '../directory'
import type { CloudPrinter } from '../api'
import type { InstanceConfig } from '@/store/config/types'
import type { NearbyPrinter } from '@/services/muon-ble/nearby'
import { NEARBY_FRESH_MS } from '@/services/muon-ble/heard'

vi.mock('@/store', () => ({ default: { state: { config: {} } } }))

const BOXWOOD = 'f1f6920f'.repeat(8)
const NOW = 1_800_000_000_000

function owned (id: string, online: boolean): CloudPrinter {
  return { id, name: 'Boxwood', model: 'M1', version: '1', linked_at: 0, last_seen: 0, online, online_since: null }
}

function heard (endpointId: string, agoMs: number): NearbyPrinter {
  return {
    deviceId: 'dev-1',
    device: {} as NearbyPrinter['device'],
    localName: 'boxwood-367a',
    display: 'Boxwood · 367A',
    endpointId,
    advert: null,
    heardAt: NOW - agoMs
  }
}

function saved (endpointId: string): InstanceConfig {
  return { name: 'Boxwood', apiUrl: 'http://192.168.1.20', socketUrl: 'ws://192.168.1.20/websocket', active: false, endpointId }
}

function directory (sources: Partial<DirectorySources>) {
  return printerDirectory({
    account: [],
    status: {},
    email: 'jack@example.com',
    saved: [],
    found: [],
    cloudNearby: [],
    nearby: [],
    activeCloudId: null,
    local: null,
    searching: false,
    now: NOW,
    ...sources
  })
}

describe('a printer heard over Bluetooth is not offline (KAN-2528)', () => {
  it('shows an account printer the console calls offline as Nearby while its advert is fresh', () => {
    const [e] = directory({ account: [owned(BOXWOOD, false)], nearby: [heard(BOXWOOD, 5_000)] }).cloud
    expect(e.health).toBe('nearby')
    expect(e.detail).toBe('Nearby · Bluetooth')
    expect(e.nearby).toBeDefined()
  })

  it('is Offline again once the advert is older than the window', () => {
    const [e] = directory({ account: [owned(BOXWOOD, false)], nearby: [heard(BOXWOOD, NEARBY_FRESH_MS + 1)] }).cloud
    expect(e.health).toBe('offline')
  })

  it('is still Offline with no advert at all', () => {
    expect(directory({ account: [owned(BOXWOOD, false)] }).cloud[0].health).toBe('offline')
  })

  it('leaves an online printer as the service reports it', () => {
    const [e] = directory({ account: [owned(BOXWOOD, true)], nearby: [heard(BOXWOOD, 1_000)] }).cloud
    expect(e.health).not.toBe('nearby')
    expect(e.health).not.toBe('offline')
  })

  it('shows a printer saved in this browser and heard over Bluetooth as Nearby, not Offline', () => {
    const [e] = directory({ saved: [saved(BOXWOOD)], nearby: [heard(BOXWOOD, 2_000)] }).local
    expect(e.health).toBe('nearby')
    expect(e.detail).toBe('Nearby · Bluetooth')
  })

  it('shows a saved printer that is not heard as Offline', () => {
    expect(directory({ saved: [saved(BOXWOOD)] }).local[0].health).toBe('offline')
  })

  it('does not bring a previous account\'s printers back (KAN-2249)', () => {
    // No account: only what is saved here and what is heard are listed.
    const d = directory({ account: [], nearby: [heard(BOXWOOD, 1_000)] })
    expect(d.cloud).toHaveLength(0)
  })
})
