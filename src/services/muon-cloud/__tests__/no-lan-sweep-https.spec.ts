/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * I-134: control.muon3d.com showed "Not secure" because the page swept the
 * local subnet over plain http on every load (mixed content to private IPs).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  discoverPrinters,
  discoveryState,
  lanOpenLinks,
  refreshKnownPrinters,
  refreshLanStatus,
  refreshLinkStates
} from '../discovery'

const instances = vi.hoisted(() => ({ list: [] as unknown[] }))
vi.mock('@/store', () => ({ default: { getters: { get 'config/getInstances' () { return instances.list } } } }))
vi.mock('../api', () => ({
  cloudApi: {
    nearby: vi.fn(async () => ({
      printers: [
        { printer_id: 'p1', name: 'Boxwood', model: 'M1', linked: true, local_addrs: ['10.42.0.1', '192.168.1.20'] },
        { printer_id: 'p2', name: 'Walnut', model: 'M1', linked: false, local_addrs: ['10.42.0.1'] }
      ]
    }))
  }
}))

const calls: string[] = []

beforeEach(() => {
  calls.length = 0
  discoveryState.found.splice(0)
  discoveryState.finishedAt = 0
  instances.list = [{ apiUrl: 'http://192.168.1.50', name: 'Saved' }]
  const spy = (url: unknown) => { calls.push(String(url)) }
  vi.stubGlobal('fetch', vi.fn(async (url: unknown) => { spy(url); throw new TypeError('blocked') }))
  vi.stubGlobal('XMLHttpRequest', class { open (_m: string, url: string) { spy(url) } send () {} setRequestHeader () {} addEventListener () {} })
  vi.stubGlobal('WebSocket', class { constructor (url: string) { spy(url) } close () {} addEventListener () {} })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const insecure = () => calls.filter(c => c.startsWith('http:') || c.startsWith('ws:'))

describe('on the https site', () => {
  it('opening the printers page issues no http request: no sweep, no probes', async () => {
    await discoverPrinters(false, { nearby: false })
    await discoverPrinters()
    await refreshKnownPrinters()
    await refreshLanStatus()
    await refreshLinkStates()
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(insecure()).toEqual([])
    expect(discoveryState.scanning).toBe(false)
    expect(discoveryState.finishedAt).toBeGreaterThan(0)
  })

  it('"Search again" does not fetch http either, and offers new-tab links instead', async () => {
    await discoverPrinters(true)
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(insecure()).toEqual([])
    expect(lanOpenLinks()).toEqual([
      { name: 'Boxwood', url: 'http://192.168.1.20/' }
    ])
  })
})
