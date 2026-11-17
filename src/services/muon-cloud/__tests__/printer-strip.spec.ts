import { expect, it } from 'vitest'
import { stripCapacity, stripEntries, stripState } from '../printer-strip'
import type { DirectoryEntry, PrinterHealth } from '../directory'

it.each([
  ['printing', 'printing'], ['online', 'ready'], ['paused', 'paused'], ['locked', 'paused'], ['error', 'fault'], ['offline', 'asleep'], ['available', 'new'], ['connecting', 'new'], ['searching', 'new']
] as const)('maps %s to its design state %s without a made-up reading', (health, state) => {
  expect(stripState(health)).toBe(state)
})

it.each(['online', 'printing'] as PrinterHealth[])('shows heat-up reported by either heater, not just %s', health => {
  for (const key of ['extruder', 'bed']) expect(stripState(health, { [key]: { temperature: 20, target: 200 } })).toBe('heating')
})

it.each(['paused', 'error', 'offline'] as PrinterHealth[])('does not let a cold heater hide %s', health => {
  expect(stripState(health, { extruder: { temperature: 20, target: 200 } })).toBe(({ paused: 'paused', error: 'fault', offline: 'asleep' } as Record<string, string>)[health])
})

it.each([{ temperature: 20, target: 0 }, { temperature: NaN, target: 200 }, { temperature: 200, target: NaN }, { temperature: 198, target: 200 }])('does not invent heating from an off, invalid or on-target heater: %j', extruder => {
  expect(stripState('online', { extruder })).toBe('ready')
})

it('keeps startup distinct from a shutdown fault', () => {
  expect(stripState('error', { state: 'klipper startup' })).toBe('new')
  expect(stripState('online', { state: 'klipper shutdown' })).toBe('fault')
})

it('does not turn an intentional cancellation into a printer fault', () => {
  expect(stripState('online', { state: 'cancelled' })).toBe('ready')
})

it('keeps only unique, inactive openable printers, never found-only rows', () => {
  const rows = [{ key: 'a', section: 'cloud' }, { key: 'a', section: 'cloud' }, { key: 'b', section: 'local', active: 'local' }, { key: 'c', section: 'found' }, { key: 'd', section: 'foreign' }] as DirectoryEntry[]
  expect(stripEntries(rows).map(e => e.key)).toEqual(['a', 'd'])
  expect(stripEntries([])).toEqual([])
})

it('reserves room for current and overflow, but never shows +0 for an exact fit', () => {
  expect(stripCapacity(180, 10, 0)).toBe(0)
  expect(stripCapacity(420, 5, 0)).toBe(5)
  expect(stripCapacity(420, 6, 0)).toBe(4)
  expect(stripCapacity(420, 5, 1)).toBe(4)
  expect(stripCapacity(0, 0, 0)).toBe(0)
  expect(stripCapacity(100, 10, 0)).toBe(0)
})
