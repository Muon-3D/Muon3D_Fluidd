/** KAN-5973: one small button per route that is there; the one the printer is on is active; the rest are left out. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { routeButtonsOf } from '../printer-entries'
import * as link from '@/services/muon-ble/link'
import { nearbyState } from '@/services/muon-ble/nearby'
import { discoveryState } from '@/services/muon-cloud/discovery'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

const entry = (over: Partial<DirectoryEntry> = {}): DirectoryEntry => ({
  key: 'cloud:p1',
  section: 'cloud',
  name: 'Boxwood',
  endpointId: 'p1',
  health: 'online',
  detail: '',
  host: null,
  active: null,
  linkedTo: 'mine',
  saved: [],
  cloud: { id: 'p1', online: true } as DirectoryEntry['cloud'],
  ...over
})
const routes = (e: DirectoryEntry) => routeButtonsOf(e).map(b => b.route)

beforeEach(() => {
  nearbyState.support = 'supported'
  discoveryState.cloud = []
  discoveryState.cloudChecked = true
})
afterEach(() => { vi.restoreAllMocks() })

describe('routeButtonsOf', () => {
  it('lists Muon3D and Bluetooth for an online account printer with no local address', () => {
    expect(routes(entry())).toEqual(['cloud', 'ble'])
  })

  it('marks the route the session is on as active, and keeps the others', () => {
    vi.spyOn(link, 'bluetoothCarrying').mockReturnValue(true)
    const buttons = routeButtonsOf(entry({ active: 'cloud' }))
    expect(buttons.filter(b => b.active).map(b => b.route)).toEqual(['ble'])
    expect(buttons.map(b => b.route)).toContain('cloud')
  })

  it('hides Muon3D when the printer is offline there or not on the account', () => {
    expect(routes(entry({ cloud: { id: 'p1', online: false } as DirectoryEntry['cloud'] }))).not.toContain('cloud')
    expect(routes(entry({ cloud: undefined }))).not.toContain('cloud')
  })

  it('hides Bluetooth when this browser has none', () => {
    nearbyState.support = 'unsupported'
    expect(routes(entry())).toEqual(['cloud'])
  })

  it('names each button for what it does', () => {
    expect(routeButtonsOf(entry()).map(b => b.label)).toEqual(['Connect over Muon3D', 'Connect over Bluetooth'])
  })
})
