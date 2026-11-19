import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_RELAY_URL, RELAY_CACHE_KEY, cachedRelayUrl, isMuonRelay, relayUrlForBluetooth, rememberRelayUrl } from '../relay'

describe('relay address for Bluetooth', () => {
  beforeEach(() => localStorage.clear())

  it('accepts only https on muon3d.com or a subdomain', () => {
    expect(isMuonRelay('https://relay.muon3d.com/')).toBe(true)
    expect(isMuonRelay('https://relay2.muon3d.com')).toBe(true)
    expect(isMuonRelay('https://muon3d.com/')).toBe(true)
    expect(isMuonRelay('http://relay.muon3d.com/')).toBe(false)
    expect(isMuonRelay('https://evil.com/')).toBe(false)
    expect(isMuonRelay('https://muon3d.com.evil.com/')).toBe(false)
    expect(isMuonRelay('https://notmuon3d.com/')).toBe(false)
    expect(isMuonRelay('not a url')).toBe(false)
    expect(isMuonRelay(undefined)).toBe(false)
  })

  it('does not save a bad address', () => {
    for (const bad of ['http://relay.muon3d.com/', 'https://evil.com/', 'https://muon3d.com.evil.com/', 'garbage']) rememberRelayUrl(bad)
    expect(localStorage.getItem(RELAY_CACHE_KEY)).toBeNull()
    rememberRelayUrl('https://relay2.muon3d.com/')
    expect(localStorage.getItem(RELAY_CACHE_KEY)).toBe('https://relay2.muon3d.com/')
  })

  it('removes a bad cached value and falls back to the built-in relay', () => {
    localStorage.setItem(RELAY_CACHE_KEY, 'https://evil.com/')
    expect(cachedRelayUrl()).toBeNull()
    expect(localStorage.getItem(RELAY_CACHE_KEY)).toBeNull()
    localStorage.setItem(RELAY_CACHE_KEY, 'https://evil.com/')
    expect(relayUrlForBluetooth()).toBe(DEFAULT_RELAY_URL)
  })

  it('orders cloud, then cached, then built-in, and ignores a bad cloud value', () => {
    expect(relayUrlForBluetooth()).toBe(DEFAULT_RELAY_URL)
    localStorage.setItem(RELAY_CACHE_KEY, 'https://relay2.muon3d.com/')
    expect(relayUrlForBluetooth()).toBe('https://relay2.muon3d.com/')
    expect(relayUrlForBluetooth('https://relay3.muon3d.com/')).toBe('https://relay3.muon3d.com/')
    expect(relayUrlForBluetooth('https://evil.com/')).toBe('https://relay2.muon3d.com/')
  })
})
