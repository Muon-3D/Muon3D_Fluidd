import { describe, expect, it } from 'vitest'
import { managedNetworkProblem, managedNetworkUrl } from '../network-route'

describe('managedNetworkUrl (KAN-3601)', () => {
  it.each([
    ['GET', 'http://host/server/aux/wifi/scan?rescan=true', '/muon-link/network/wifi/scan'],
    ['GET', '/aux/wifi/saved', '/muon-link/network/wifi/saved'],
    ['POST', 'https://muon-cloud.invalid/server/aux/wifi/connect', '/muon-link/network/wifi/connect'],
    ['POST', '/server/aux/wifi/disconnect', '/muon-link/network/wifi/disconnect'],
    ['DELETE', '/server/aux/wifi/forget?ssid=Home%20Net', '/muon-link/network/wifi/forget?ssid=Home%20Net'],
    ['POST', '/server/aux/wifi/up?ssid=a%26b', '/muon-link/network/wifi/up?ssid=a%26b'],
    ['GET', '/server/aux/wifi/ap/stations', '/muon-link/network/wifi/ap/stations'],
    ['GET', '/server/aux/wifi/ap/show', '/muon-link/network/hotspot'],
    ['POST', '/server/aux/wifi/ap/change', '/muon-link/network/hotspot/change'],
    ['GET', '/server/aux/wifi/ap/change/abc_12-X', '/muon-link/network/hotspot/change/abc_12-X'],
    ['POST', '/server/aux/wifi/ap/auto_off', '/muon-link/network/hotspot/auto_off'],
    ['POST', '/server/aux/wifi/ap/up', '/muon-link/network/hotspot/up'],
    ['POST', '/server/aux/wifi/ap/down', '/muon-link/network/hotspot/down']
  ])('%s %s goes to %s', (method, url, expected) => {
    expect(managedNetworkUrl(method, url)).toBe(expected)
  })

  it('has no route for the hotspot device status, modify, the per-SSID read, or the wrong method', () => {
    expect(managedNetworkUrl('GET', '/server/aux/wifi/ap/device/status')).toBeNull()
    expect(managedNetworkUrl('POST', '/server/aux/wifi/ap/modify')).toBeNull()
    expect(managedNetworkUrl('GET', '/server/aux/wifi/ap/up')).toBeNull()
    expect(managedNetworkUrl('GET', '/server/aux/wifi/ap/change/bad id')).toBeNull()
    expect(managedNetworkUrl('GET', '/server/aux/wifi/show?ssid=x')).toBeNull()
    expect(managedNetworkUrl('GET', '/server/aux/wifi/connect')).toBeNull()
    expect(managedNetworkUrl('GET', '/server/aux/update/status')).toBeNull()
    expect(managedNetworkUrl('GET', undefined)).toBeNull()
  })
})

describe('managedNetworkProblem', () => {
  const failed = (status: number, data?: unknown) => ({ response: { status, data } })

  it('names the owner\'s path rules', () => {
    expect(managedNetworkProblem(failed(403, { error: 'path_disabled', detail: { code: 'path_disabled' } }))?.kind).toBe('path-rule')
    expect(managedNetworkProblem(failed(403, { error: 'reauth_required' }))?.kind).toBe('path-rule')
  })

  it('says a session with no role, or a watch-only one, cannot change it, in the words of what was asked', () => {
    expect(managedNetworkProblem(failed(403, { error: 'forbidden' }))?.kind).toBe('not-allowed')
    expect(managedNetworkProblem(failed(403, { error: 'viewer_read_only', detail: { code: 'viewer_read_only' } }), 'the hotspot')?.message).toContain('the hotspot')
  })

  it('names the hotspot when the hotspot was asked', () => {
    expect(managedNetworkProblem(failed(404, 'Not Found'), 'the hotspot')?.message).toContain("can't change the hotspot over this connection yet")
  })

  it('reads a bare 404 as an older muon-link', () => {
    expect(managedNetworkProblem(failed(404, 'Not Found'))?.kind).toBe('not-available')
  })

  it('leaves permission refusals and join failures to their own notices', () => {
    expect(managedNetworkProblem(failed(403, { detail: { code: 'permission_restricted' } }))).toBeNull()
    expect(managedNetworkProblem(failed(502, { error: 'aux_unavailable' }))).toBeNull()
    expect(managedNetworkProblem(new Error('x'))).toBeNull()
  })
})
