import { describe, expect, it } from 'vitest'
import {
  bluetoothReason, NO_BLUETOOTH, NOT_ON_ACCOUNT, OFFLINE_IN_MUON3D, routeMenuItems, type RouteMenuFacts
} from '../route-menu'

const facts = (over: Partial<RouteMenuFacts> = {}): RouteMenuFacts => ({
  live: null,
  local: { usable: true, hint: '192.168.1.20' },
  cloud: { listed: true, online: true },
  ble: { support: 'supported', heard: false, identified: true },
  ...over
})
const ids = (f: RouteMenuFacts) => routeMenuItems(f).map(i => i.id)
const item = (f: RouteMenuFacts, id: string) => routeMenuItems(f).find(i => i.id === id)!

describe('route menu: the routes you are not on (KAN-2487)', () => {
  it('on Bluetooth: Muon3D and Locally', () => {
    expect(ids(facts({ live: 'ble' }))).toEqual(['connect-local', 'connect-cloud'])
  })
  it('on the local network: Muon3D and Bluetooth', () => {
    expect(ids(facts({ live: 'lan' }))).toEqual(['connect-cloud', 'connect-bluetooth'])
  })
  it('on Muon3D: Locally and Bluetooth', () => {
    expect(ids(facts({ live: 'cloud' }))).toEqual(['connect-local', 'connect-bluetooth'])
  })
  it('not open: all three, so the main menu lists every route', () => {
    expect(ids(facts())).toEqual(['connect-local', 'connect-cloud', 'connect-bluetooth'])
  })
  it('never offers the route it is already on', () => {
    for (const live of ['lan', 'cloud', 'ble'] as const) {
      expect(routeMenuItems(facts({ live })).map(i => i.route)).not.toContain(live)
    }
  })
})

describe('route menu: greyed, with one line saying why', () => {
  it('Locally is greyed when the printer is not on this network, with that reason', () => {
    const f = facts({ local: { usable: false, hint: 'Not found on this network' } })
    expect(item(f, 'connect-local')).toMatchObject({ disabled: true, hint: 'Not found on this network' })
  })
  it('Locally is open, with where it goes, while the printer answers on the network', () => {
    expect(item(facts({ live: 'ble' }), 'connect-local')).toMatchObject({ disabled: false, hint: '192.168.1.20' })
  })
  it('Muon3D is greyed for a printer that is not on the account, whoever is signed in', () => {
    const f = facts({ cloud: { listed: false, online: false } })
    expect(item(f, 'connect-cloud')).toMatchObject({ disabled: true, hint: NOT_ON_ACCOUNT })
  })
  it('Muon3D is greyed when the service says the printer is offline', () => {
    expect(item(facts({ cloud: { listed: true, online: false } }), 'connect-cloud')).toMatchObject({ disabled: true, hint: OFFLINE_IN_MUON3D })
  })
  it('Bluetooth is greyed where the browser has none, unless the printer was heard', () => {
    const none = facts({ ble: { support: 'unsupported', heard: false, identified: true } })
    expect(item(none, 'connect-bluetooth')).toMatchObject({ disabled: true, hint: NO_BLUETOOTH })
    expect(bluetoothReason({ support: 'unsupported', heard: true, identified: true })).toBeNull()
  })
  it('Bluetooth is open for a printer you do not own, signed in or not', () => {
    const f = facts({ cloud: { listed: false, online: false } })
    expect(item(f, 'connect-bluetooth')).toMatchObject({ disabled: false })
    expect(item(f, 'connect-bluetooth').hint).toBeUndefined()
  })
  it('Bluetooth is greyed for a printer that cannot be told apart', () => {
    expect(item(facts({ ble: { support: 'supported', heard: false, identified: false } }), 'connect-bluetooth').disabled).toBe(true)
  })
})
