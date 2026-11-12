import { describe, expect, it } from 'vitest'
import { autoMove, autoTarget, chooseRouteMode, dropChoices, routeMode } from '../route-choice'

const none = { lan: false, cloud: false, ble: false }

describe('auto mode ranks local network, then cloud, then Bluetooth (Jack, 9 Nov)', () => {
  it('takes the best route that is there', () => {
    expect(autoTarget({ lan: true, cloud: true, ble: true })).toBe('lan')
    expect(autoTarget({ ...none, cloud: true, ble: true })).toBe('cloud')
    expect(autoTarget({ ...none, ble: true })).toBe('ble')
    expect(autoTarget(none)).toBeNull()
  })

  it('fails over off a dead session to the best route left', () => {
    expect(autoMove(null, { ...none, cloud: true, ble: true })).toBe('cloud')
    expect(autoMove(null, { ...none, ble: true })).toBe('ble')
    expect(autoMove(null, none)).toBeNull()
  })

  it('returns to a better route when it comes back', () => {
    expect(autoMove('ble', { ...none, cloud: true, ble: true })).toBe('cloud')
    expect(autoMove('cloud', { lan: true, cloud: true, ble: false })).toBe('lan')
    expect(autoMove('ble', { lan: true, cloud: false, ble: true })).toBe('lan')
  })

  it('never moves a live session down, and stays where it is best', () => {
    expect(autoMove('lan', { lan: false, cloud: true, ble: true })).toBeNull()
    expect(autoMove('cloud', { ...none, ble: true })).toBeNull()
    expect(autoMove('cloud', { ...none, cloud: true })).toBeNull()
  })
})

describe('the chosen route is remembered per printer', () => {
  it('is auto until chosen, and case does not matter', () => {
    expect(routeMode('ABCDEF')).toBe('auto')
    chooseRouteMode('ABCDEF', 'ble')
    expect(routeMode('abcdef')).toBe('ble')
    chooseRouteMode('abcdef', 'auto')
    expect(routeMode('ABCDEF')).toBe('auto')
    expect(routeMode(null)).toBe('auto')
  })
})

describe('the Bluetooth dropped sheet never dead-ends (KAN-2080)', () => {
  it('offers the local network only when it is reachable, and always the cloud and another try', () => {
    expect(dropChoices(true).map(c => c.label)).toEqual(['Connect on local network', 'Connect via cloud', 'Try Bluetooth again'])
    expect(dropChoices(false).map(c => c.label)).toEqual(['Connect via cloud', 'Try Bluetooth again'])
  })
})
