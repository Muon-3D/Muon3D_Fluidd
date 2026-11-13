import { describe, expect, it, vi } from 'vitest'
import { BLOCKED_BY_PAGE, isOpenableAddr, localRoute, NOT_ON_NETWORK, openableAddr, type LocalRouteInput } from '../local-route'

vi.mock('@/store', () => ({ default: { state: { config: {} } } }))

const cloud = (localAddrs: string[]) => ({ printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs })

const base: LocalRouteInput = {
  hosted: true,
  host: null,
  secureName: null,
  pageHost: 'control.muon3d.com',
  nearby: undefined,
  nearbyChecked: true,
  blockedByPage: false
}

describe('what Connect locally does (KAN-2529)', () => {
  it('uses the secure address on the hosted page when the printer has one', () => {
    expect(localRoute({ ...base, secureName: 'abc.lan.muon3d.com', nearby: cloud(['192.168.1.20']) }))
      .toEqual({ kind: 'secure', name: 'abc.lan.muon3d.com' })
  })

  it('otherwise opens the printer\'s address in a new tab, skipping the hotspot range', () => {
    expect(localRoute({ ...base, nearby: cloud(['10.42.0.1', '192.168.1.20']) })).toEqual({ kind: 'tab', addr: '192.168.1.20' })
  })

  it('takes a hotspot address only when the page is itself on the hotspot', () => {
    expect(openableAddr(cloud(['10.42.0.1']), '10.42.0.1')).toBe('10.42.0.1')
    expect(openableAddr(cloud(['10.42.0.1']), 'control.muon3d.com')).toBeNull()
  })

  it('is greyed out with "Not found on this network" when the service looked and has nothing', () => {
    expect(localRoute({ ...base })).toEqual({ kind: 'none', reason: NOT_ON_NETWORK })
    expect(localRoute({ ...base, nearby: cloud(['10.42.0.1']) })).toEqual({ kind: 'none', reason: NOT_ON_NETWORK })
  })

  it('blames the page, not the network, when the service list was never read', () => {
    expect(localRoute({ ...base, nearbyChecked: false })).toEqual({ kind: 'none', reason: BLOCKED_BY_PAGE })
  })

  it('keeps the LAN path on a printer-served page', () => {
    expect(localRoute({ ...base, hosted: false, host: '192.168.1.20', secureName: 'abc.lan.muon3d.com' })).toEqual({ kind: 'lan' })
  })

  it('says the page is the reason on an http page that cannot reach addresses', () => {
    expect(localRoute({ ...base, hosted: false, blockedByPage: true })).toEqual({ kind: 'none', reason: BLOCKED_BY_PAGE })
    expect(localRoute({ ...base, hosted: false })).toEqual({ kind: 'none', reason: NOT_ON_NETWORK })
  })
})

describe('the address from the console is checked before it is opened (KAN-2529)', () => {
  it.each(['evil.example', 'a@evil', '8.8.8.8', '192.168.1.5:80/x', '192.168.1.5/x', '172.32.0.1', '300.1.1.1', 'a b', ''])('rejects %s', addr => {
    expect(isOpenableAddr(addr)).toBe(false)
  })

  it.each(['192.168.137.95', '10.0.0.7', '172.16.5.5', '172.31.5.5', 'muon-boxwood-367a.local', 'boxwood'])('accepts %s', addr => {
    expect(isOpenableAddr(addr)).toBe(true)
  })

  it('never builds a route from a bad address, even alone', () => {
    expect(openableAddr(cloud(['evil.example', 'a@evil', '8.8.8.8']), 'control.muon3d.com')).toBeNull()
    expect(openableAddr(cloud(['10.42.0.1']), '10.42.0.1')).toBe('10.42.0.1')
    expect(openableAddr(cloud(['10.42.0.1']), 'control.muon3d.com')).toBeNull()
    expect(openableAddr(cloud(['8.8.8.8', '192.168.137.95']), 'control.muon3d.com')).toBe('192.168.137.95')
  })
})
