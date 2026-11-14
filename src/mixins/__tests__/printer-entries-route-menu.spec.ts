/**
 * KAN-2487: the menus follow the live route, anyone can pick a route they can reach,
 * and a known printer is on the network before it is opened.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PrinterEntriesMixin, { liveRouteOf } from '../printer-entries'
import * as link from '@/services/muon-ble/link'
import { nearbyState } from '@/services/muon-ble/nearby'
import { routeMode } from '@/services/muon-cloud/route-choice'
import { discoveryState } from '@/services/muon-cloud/discovery'
import { printerDirectory, type CardAction, type DirectoryEntry } from '@/services/muon-cloud/directory'

type Fn = (this: unknown, ...a: any[]) => any
const methods = (PrinterEntriesMixin as unknown as { options: { methods: Record<string, Fn> } }).options.methods

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
const ids = (a: CardAction[]) => a.map(x => x.id).filter(id => id.startsWith('connect-'))

beforeEach(() => {
  nearbyState.support = 'supported'
  discoveryState.cloud = []
  discoveryState.cloudChecked = true
})
afterEach(() => vi.restoreAllMocks())

describe('menus follow the live route', () => {
  it('on Bluetooth: Connect locally and Muon3D, not Bluetooth', () => {
    vi.spyOn(link, 'bluetoothCarrying').mockReturnValue(true)
    const e = entry({ active: 'cloud', host: '192.168.1.20' })
    expect(liveRouteOf(e)).toBe('ble')
    expect(ids(methods.cloudActions(e))).toEqual(['connect-local', 'connect-cloud'])
  })

  it('on Muon3D: Connect locally and Bluetooth', () => {
    vi.spyOn(link, 'bluetoothCarrying').mockReturnValue(false)
    expect(ids(methods.cloudActions(entry({ active: 'cloud' })))).toEqual(['connect-local', 'connect-bluetooth'])
  })

  it('on the local network: Muon3D and Bluetooth', () => {
    expect(ids(methods.cloudActions(entry({ active: 'local' })))).toEqual(['connect-cloud', 'connect-bluetooth'])
  })

  it('not open: all three, with the unavailable one greyed and a reason', () => {
    const all = methods.cloudActions(entry()) as CardAction[]
    expect(ids(all)).toEqual(['connect-local', 'connect-cloud', 'connect-bluetooth'])
    const local = all.find(a => a.id === 'connect-local')!
    expect(local.disabled).toBe(true)
    expect(local.hint).toBeTruthy()
  })

  it('Connect locally is open while connected over Bluetooth, when the printer answers on the network', () => {
    vi.spyOn(link, 'bluetoothCarrying').mockReturnValue(true)
    const all = methods.cloudActions(entry({ active: 'cloud', host: '192.168.1.20' })) as CardAction[]
    expect(all.find(a => a.id === 'connect-local')).toMatchObject({ disabled: false })
  })
})

describe('routes for a printer you do not own', () => {
  const saved = entry({ key: 'local:http://x', section: 'local', cloud: undefined, linkedTo: 'other', host: '192.168.1.20' })

  it('a saved printer off the account offers Local and Bluetooth, and Muon3D greyed as not on your account', () => {
    const all = methods.localActions.call({ askAction: methods.askAction }, saved) as CardAction[]
    expect(ids(all)).toEqual(['connect-local', 'connect-cloud', 'connect-bluetooth'])
    expect(all.find(a => a.id === 'connect-cloud')).toMatchObject({ disabled: true, hint: 'Not on your account' })
    expect(all.find(a => a.id === 'connect-bluetooth')?.disabled).toBe(false)
  })

  it('a printer found nearby that nobody owns offers Bluetooth', () => {
    const found = entry({ section: 'found', cloud: undefined, linkedTo: 'none', nearby: { device: {} } as DirectoryEntry['nearby'] })
    const all = methods.foundActions.call({ askAction: methods.askAction }, found) as CardAction[]
    expect(ids(all)).toContain('connect-bluetooth')
  })

  it('choosing Bluetooth for it holds Bluetooth, with no account', async () => {
    const connect = vi.fn()
    const device = { id: 'dev' }
    const c = { connectCloud: methods.connectCloud, run: connect }
    await methods.connectCloud.call(c, saved, device)
    expect(routeMode('p1')).toBe('ble')
    expect(connect).toHaveBeenCalled()
  })
})

describe('a known printer is on the network before it is opened (KAN-2487)', () => {
  const sources = (over: Record<string, unknown> = {}) => ({
    account: [], status: {}, email: null, saved: [{ name: 'Sloe', apiUrl: 'http://sloe.local:7125', socketUrl: 'ws://sloe.local:7125/websocket', endpointId: 'sloe-id' }],
    found: [], cloudNearby: [], nearby: [], activeCloudId: null, ...over
  }) as unknown as Parameters<typeof printerDirectory>[0]

  it('a saved printer the service finds beside this browser is on this network, not "Not found"', () => {
    const [e] = printerDirectory(sources({ cloudNearby: [{ printerId: 'sloe-id', name: 'Sloe', model: 'M1', linked: true, localAddrs: ['192.168.1.30'] }] })).local
    expect(e.health).toBe('available')
    expect(e.detail).toBe('On this network')
  })

  it('without that, it is still Not found on this network (control)', () => {
    const [e] = printerDirectory(sources()).local
    expect(e.detail).toBe('Not found on this network')
  })
})
