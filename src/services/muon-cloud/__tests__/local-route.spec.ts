import { describe, expect, it, vi } from 'vitest'
import { BLOCKED_BY_PAGE, isOpenableAddr, localRoute, mdnsHostFromName, NOT_ON_NETWORK, openableAddr, type LocalRouteInput } from '../local-route'

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
    expect(localRoute({ ...base, secureName: 'abc.muonlan.net', nearby: cloud(['192.168.1.20']) }))
      .toEqual({ kind: 'secure', name: 'abc.muonlan.net' })
  })

  it('otherwise opens the printer address in this tab, skipping the hotspot range', () => {
    expect(localRoute({ ...base, nearby: cloud(['10.42.0.1', '192.168.1.20']) })).toEqual({ kind: 'page', host: '192.168.1.20' })
  })

  it('prefers the .local name over the address, and takes it when only the hotspot address is reported (KAN-3584)', () => {
    const mdnsHost = 'muon-sloe-b26d.local'
    expect(localRoute({ ...base, mdnsHost, nearby: cloud(['192.168.1.78']) })).toEqual({ kind: 'page', host: mdnsHost })
    expect(localRoute({ ...base, mdnsHost, nearby: cloud(['10.42.0.1']) })).toEqual({ kind: 'page', host: mdnsHost })
    expect(localRoute({ ...base, mdnsHost })).toEqual({ kind: 'none', reason: NOT_ON_NETWORK })
  })

  it('offers an address the printer itself reported when the service list does not show it (KAN-4898)', () => {
    expect(localRoute({ ...base, printerSaid: 'muon-sloe-b26d.local' }))
      .toEqual({ kind: 'page', host: 'muon-sloe-b26d.local', unconfirmed: true })
    expect(localRoute({ ...base, printerSaid: '192.168.1.78' })).toEqual({ kind: 'page', host: '192.168.1.78', unconfirmed: true })
    // The service's own confirmation still wins, and is not marked unconfirmed.
    expect(localRoute({ ...base, printerSaid: '192.168.1.78', mdnsHost: 'muon-sloe-b26d.local', nearby: cloud(['192.168.1.78']) }))
      .toEqual({ kind: 'page', host: 'muon-sloe-b26d.local' })
  })

  it('never offers a guess, a hotspot address or an unsafe one without the service (KAN-4898)', () => {
    expect(localRoute({ ...base, mdnsHost: mdnsHostFromName('Sloe · B26D'), printerSaid: null })).toEqual({ kind: 'none', reason: NOT_ON_NETWORK })
    expect(localRoute({ ...base, printerSaid: '10.42.0.1' })).toEqual({ kind: 'none', reason: NOT_ON_NETWORK })
    expect(localRoute({ ...base, printerSaid: 'evil.example' })).toEqual({ kind: 'none', reason: NOT_ON_NETWORK })
  })

  it('derives the name from the display name', () => {
    expect(mdnsHostFromName('Sloe · B26D')).toBe('muon-sloe-b26d.local')
    expect(mdnsHostFromName('Sloe b26d')).toBe('muon-sloe-b26d.local')
    expect(mdnsHostFromName('Boxwood · 367A')).toBe('muon-boxwood-367a.local')
    expect(mdnsHostFromName('muon-sloe-b26d')).toBe('muon-sloe-b26d.local')
    expect(mdnsHostFromName('Garage printer')).toBeNull()
  })

  it('does not invent a .local name for a renamed printer, and opens its listed address instead', () => {
    expect(mdnsHostFromName('Living Room')).toBeNull()
    expect(mdnsHostFromName('Print farm')).toBeNull()
    expect(localRoute({ ...base, nearby: cloud(['192.168.1.20']), mdnsHost: mdnsHostFromName('Living Room') })).toEqual({ kind: 'page', host: '192.168.1.20' })
    // A host name the printer itself reported is still used.
    expect(localRoute({ ...base, nearby: cloud(['192.168.1.20']), mdnsHost: 'muon-boxwood-367a.local' })).toEqual({ kind: 'page', host: 'muon-boxwood-367a.local' })
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
    expect(localRoute({ ...base, hosted: false, host: '192.168.1.20', secureName: 'abc.muonlan.net' })).toEqual({ kind: 'lan' })
  })

  it('says the page is the reason on an http page that cannot reach addresses', () => {
    expect(localRoute({ ...base, hosted: false, blockedByPage: true })).toEqual({ kind: 'none', reason: BLOCKED_BY_PAGE })
    expect(localRoute({ ...base, hosted: false })).toEqual({ kind: 'none', reason: NOT_ON_NETWORK })
  })
})

describe('the address from the console is checked before it is opened (KAN-2529)', () => {
  it.each(['evil.example', 'a@evil', '8.8.8.8', '192.168.1.5:80/x', '192.168.1.5/x', '172.32.0.1', '300.1.1.1', 'a b', '', '134744072', '0x08080808', '0x7f000001', '3232235777'])('rejects %s', addr => {
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
