/**
 * @vitest-environment-options { "url": "https://control.muon3d.com/" }
 *
 * KAN-2198 (A-6c): "Open on this network" prefers a proven secure address.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { discoveryState, lanOpenLinks } from '../discovery'
import { forgetSecureReach, reachSecureName } from '@/services/secure-origin/hosted'

vi.mock('@/store', () => ({ default: { getters: { 'config/getInstances': [] } } }))

const NAME = 'abcdefghijklmnopqrst.lan.muon3d.com'

beforeEach(() => {
  forgetSecureReach()
  discoveryState.cloud = [
    { printerId: 'p1', name: 'Boxwood', model: 'M1', linked: true, localAddrs: ['192.168.1.20'] },
    { printerId: 'p2', name: 'Walnut', model: 'M1', linked: true, localAddrs: ['192.168.1.21'] }
  ]
})
const accountPrinters = [
  { id: 'p1', secure_name: NAME },
  { id: 'p2', secure_name: null }
]
afterEach(() => {
  vi.unstubAllGlobals()
  discoveryState.cloud = []
})

describe('lanOpenLinks with secure names', () => {
  it('uses the secure address only for a printer this browser has reached', async () => {
    expect(lanOpenLinks(accountPrinters)[0].url).toBe('http://192.168.1.20/')
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => 'muon3d-secure-origin-1' })))
    await reachSecureName(NAME)
    expect(lanOpenLinks(accountPrinters)).toEqual([
      { name: 'Boxwood', url: `https://${NAME}/` },
      { name: 'Walnut', url: 'http://192.168.1.21/' }
    ])
  })
})
