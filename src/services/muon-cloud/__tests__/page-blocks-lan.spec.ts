/**
 * @vitest-environment-options { "url": "http://muon-boxwood-367a.local/" }
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  discoveryState,
  knownHosts,
  mdnsHostFor,
  pageBlocksLanIpv4,
  pageOpenedByName,
  resetPageBlockCheck
} from '../discovery'

const instances = vi.hoisted(() => ({ list: [] as unknown[] }))

// discovery.ts reads the store and the Muon3D API client at import. Only the
// saved instances are used here, and loading the real store is slow.
vi.mock('@/store', () => ({ default: { getters: { get 'config/getInstances' () { return instances.list } } } }))
vi.mock('../api', () => ({ cloudApi: {} }))

const SYSTEM_INFO = {
  result: {
    system_info: {
      network: {
        ap0: { ip_addresses: [{ family: 'ipv4', address: '10.42.0.1', is_link_local: false }] },
        wlan0: {
          ip_addresses: [
            { family: 'ipv6', address: '2a0d:3344:5920:fd0d::4', is_link_local: false },
            { family: 'ipv4', address: '192.168.1.20', is_link_local: false }
          ]
        }
      }
    }
  }
}

function json (body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as Response
}

/** The page's own printer answers its system info; its IPv4 identity gets `ipv4`. */
function stubPage (ipv4: () => Promise<Response>) {
  const fetch = vi.fn<[string, RequestInit], Promise<Response>>(async (url: string) => {
    if (url === 'http://muon-boxwood-367a.local/machine/system_info') return json(SYSTEM_INFO)
    if (url === 'http://192.168.1.20/server/muon/identity') return ipv4()
    throw new Error(`unexpected request to ${url}`)
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

beforeEach(() => {
  resetPageBlockCheck()
  instances.list = []
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('mdnsHostFor', () => {
  it('builds the hostname from the serial name and suffix, lower case', () => {
    expect(mdnsHostFor({ name: 'Workshop', derived_name: 'boxwood', suffix: '367A' })).toBe('muon-boxwood-367a.local')
  })

  it('ignores the owner\'s rename, which does not change the hostname', () => {
    expect(mdnsHostFor({ name: 'Workshop', source: 'owner', derived_name: 'walnut', suffix: '8987' }))
      .toBe('muon-walnut-8987.local')
  })

  it('gives nothing when a part is missing or is not a plain word', () => {
    expect(mdnsHostFor({ derived_name: 'boxwood' })).toBeNull()
    expect(mdnsHostFor({ suffix: '367a' })).toBeNull()
    expect(mdnsHostFor({ derived_name: 'box wood', suffix: '367a' })).toBeNull()
    expect(mdnsHostFor(null)).toBeNull()
  })
})

describe('pageOpenedByName', () => {
  it('is a plain-HTTP page opened by a name', () => {
    expect(pageOpenedByName({ protocol: 'http:', hostname: 'muon-boxwood-367a.local' })).toBe(true)
    expect(pageOpenedByName({ protocol: 'http:', hostname: 'muon3d.local' })).toBe(true)
  })

  it('is not a page opened by IP address, over HTTPS, or on this machine', () => {
    expect(pageOpenedByName({ protocol: 'http:', hostname: '192.168.1.20' })).toBe(false)
    expect(pageOpenedByName({ protocol: 'http:', hostname: '[2a0d:3344:5920:fd0d::4]' })).toBe(false)
    expect(pageOpenedByName({ protocol: 'https:', hostname: 'control.muon3d.com' })).toBe(false)
    expect(pageOpenedByName({ protocol: 'http:', hostname: 'localhost' })).toBe(false)
  })
})

describe('pageBlocksLanIpv4', () => {
  it('is blocked when the browser refuses the page\'s own printer by IP at once', async () => {
    stubPage(async () => { throw new TypeError('Failed to fetch') })
    await expect(pageBlocksLanIpv4()).resolves.toBe(true)
    // The way round it is the same printer by its LAN address, not its hotspot's.
    expect(discoveryState.blockedByPage).toEqual({ ownUrl: 'http://192.168.1.20/' })
  })

  it('is not blocked when the printer answers by IP', async () => {
    stubPage(async () => json({ result: { name: 'boxwood' } }))
    await expect(pageBlocksLanIpv4()).resolves.toBe(false)
    expect(discoveryState.blockedByPage).toBeNull()
  })

  it('is not blocked by a failure that took the network\'s time, which was sent', async () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    stubPage(async () => { now += 2000; throw new TypeError('Failed to fetch') })
    await expect(pageBlocksLanIpv4()).resolves.toBe(false)
    expect(discoveryState.blockedByPage).toBeNull()
  })

  it('asks once per page', async () => {
    const fetch = stubPage(async () => { throw new TypeError('Failed to fetch') })
    await pageBlocksLanIpv4()
    await pageBlocksLanIpv4()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

describe('knownHosts', () => {
  beforeEach(() => {
    instances.list = [
      { name: 'Walnut · 8987', apiUrl: 'http://192.168.1.31', socketUrl: 'ws://192.168.1.31/websocket', active: false, mdnsHost: 'muon-walnut-8987.local' },
      { name: 'Elm · 12AB', apiUrl: 'http://192.168.1.32', socketUrl: 'ws://192.168.1.32/websocket', active: false },
      { name: 'Boxwood · 367A', apiUrl: 'http://muon-boxwood-367a.local', socketUrl: 'ws://muon-boxwood-367a.local/websocket', active: true }
    ]
  })

  it('asks saved printers at the address they were saved at', () => {
    expect(knownHosts(false)).toEqual(['192.168.1.31', '192.168.1.32', 'muon-boxwood-367a.local'])
  })

  it('asks a printer saved by IP at its .local name when the page may not reach IPs', () => {
    // Elm's name was never learned, so there is nothing to ask that would get through.
    expect(knownHosts(true)).toEqual(['muon-walnut-8987.local', 'muon-boxwood-367a.local'])
  })
})
