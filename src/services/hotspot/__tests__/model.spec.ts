import { describe, expect, it } from 'vitest'
import { autoOffIn, connectedFor, dbmLevel, hotspotCountTitle, hotspotDeviceCount, networkRouteLabel, normalizeStations } from '../model'

describe('normalizeStations (KAN-4297)', () => {
  it('reads the v2 answer that exists today', () => {
    expect(normalizeStations({ up: true, count: 2, auto_off_at: 1700000000 })).toEqual({
      up: true, count: 2, autoOffAt: 1700000000, requesterOnAp: null, clients: null
    })
  })

  it('reads the additive fields when they are there', () => {
    const s = normalizeStations({
      up: true,
      count: 1,
      auto_off_at: null,
      requester_on_ap: true,
      clients: [{ name: null, ip: '10.42.0.7', mac: 'aa:bb:cc:••:••:ef', connected_s: 720, signal_dbm: -52, you: true }]
    })
    expect(s?.requesterOnAp).toBe(true)
    expect(s?.clients).toEqual([{ name: null, ip: '10.42.0.7', mac: 'aa:bb:cc:••:••:ef', connectedSeconds: 720, signalDbm: -52, you: true }])
  })

  it.each([null, undefined, 'x', [], {}, { up: 'yes' }, { count: 3 }])('is null for %j', value => {
    expect(normalizeStations(value)).toBeNull()
  })

  it('falls back to the client list length when count is missing, and never goes negative', () => {
    expect(normalizeStations({ up: true, clients: [{ mac: 'a' }, { mac: 'b' }] })?.count).toBe(2)
    expect(normalizeStations({ up: true, count: -3 })?.count).toBe(0)
  })
})

describe('hotspotDeviceCount', () => {
  it('shows a count (even 0) only while the hotspot is up', () => {
    expect(hotspotDeviceCount(normalizeStations({ up: true, count: 0 }))).toBe(0)
    expect(hotspotDeviceCount(normalizeStations({ up: true, count: 2 }))).toBe(2)
    expect(hotspotDeviceCount(normalizeStations({ up: false, count: 2 }))).toBeNull()
    expect(hotspotDeviceCount(null)).toBeNull()
  })

  it('words the tooltip', () => {
    expect(hotspotCountTitle(2)).toBe("2 devices on the printer's hotspot")
    expect(hotspotCountTitle(1)).toBe("1 device on the printer's hotspot")
  })
})

describe('networkRouteLabel', () => {
  it('says "Through hotspot" when the printer says the request came from its hotspot', () => {
    expect(networkRouteLabel(true, 'boxwood.local')).toBe('Through hotspot')
  })

  it('trusts the printer over the address when it says it did not', () => {
    expect(networkRouteLabel(false, '10.42.0.1')).toBe('On this network')
  })

  it('falls back to the page address when the printer predates the field', () => {
    expect(networkRouteLabel(null, '10.42.0.1')).toBe('Through hotspot')
    expect(networkRouteLabel(undefined, '10.42.0.1')).toBe('Through hotspot')
    expect(networkRouteLabel(null, 'boxwood.local')).toBe('On this network')
    expect(networkRouteLabel(null, '192.168.1.20')).toBe('On this network')
  })
})

describe('connectedFor', () => {
  it.each([[5, '5 s'], [720, '12 min'], [7500, '2 h 5 min'], [7200, '2 h'], [null, ''], [-1, '']])('%s is %j', (s, text) => {
    expect(connectedFor(s as number | null)).toBe(text)
  })
})

describe('autoOffIn', () => {
  const now = 1_700_000_000_000
  it.each([
    [1_700_000_000 + 25 * 60, 'Turns off in 25 min'],
    [(now + 90 * 60_000), 'Turns off in 1 h 30 min'],
    [1_700_000_000 - 5, null],
    [null, null]
  ])('%s is %j', (at, text) => {
    expect(autoOffIn(at as number | null, now)).toBe(text)
  })
})

describe('dbmLevel', () => {
  it.each([[-52, 4], [-60, 3], [-70, 2], [-80, 1], [null, 1]])('%s dBm is %s bars', (dbm, bars) => {
    expect(dbmLevel(dbm as number | null)).toBe(bars)
  })
})
