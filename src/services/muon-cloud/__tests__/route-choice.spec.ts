import { describe, expect, it, vi } from 'vitest'
import {
  RELAY_HOLD_MS,
  autoMove,
  autoTarget,
  chooseRouteMode,
  dropChoices,
  nextAutoSeen,
  noteRelayLost,
  noteUserOpen,
  relayLostAt,
  relayTrusted,
  routeMode,
  userOpenTarget
} from '../route-choice'

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

describe('auto mode does not go back to a relay it just lost (#370)', () => {
  const lost = 1_000_000

  it('believes the account list when the relay never failed', () => {
    expect(relayTrusted(undefined, 0, lost)).toBe(true)
  })

  it('does not count the relay while the list is older than the failure, however long ago it was', () => {
    // The list still says online: it was asked before the relay went.
    expect(relayTrusted(lost, lost - 5_000, lost + RELAY_HOLD_MS * 4)).toBe(false)
  })

  it('does not count the relay for the hold, even on a list asked after the failure', () => {
    expect(relayTrusted(lost, lost + 1_000, lost + RELAY_HOLD_MS - 1)).toBe(false)
  })

  it('counts the relay again once a list asked after the failure has had the hold to settle', () => {
    expect(relayTrusted(lost, lost + 1_000, lost + RELAY_HOLD_MS)).toBe(true)
  })

  it('remembers a failure per printer, whatever the case of its id', () => {
    expect(relayLostAt('Abc123')).toBeUndefined()
    noteRelayLost('Abc123', lost)
    expect(relayLostAt('abc123')).toBe(lost)
    expect(relayLostAt('other')).toBeUndefined()
  })
})

describe('auto mode never dials a printer the person walked away from (#370)', () => {
  it('keeps the printer whose route died under the person', () => {
    noteUserOpen('A')
    // Nothing is open any more, and the person asked for nothing else.
    expect(nextAutoSeen('a', { autoId: null, otherOpen: false, userTarget: userOpenTarget() })).toBe('a')
    expect(nextAutoSeen('a', { autoId: null, otherOpen: false, userTarget: null })).toBe('a')
  })

  it('forgets it when the person opened another printer and that did not open', () => {
    noteUserOpen('B')
    expect(nextAutoSeen('a', { autoId: null, otherOpen: false, userTarget: userOpenTarget() })).toBeNull()
  })

  it('forgets it when the person opened a printer with no id, such as a bare address', () => {
    noteUserOpen(null, 'address:http://192.0.2.1')
    expect(nextAutoSeen('a', { autoId: null, otherOpen: false, userTarget: userOpenTarget() })).toBeNull()
  })

  it('does not take the old printer back while the person is still opening another', () => {
    noteUserOpen('B')
    expect(nextAutoSeen(null, { autoId: 'a', otherOpen: true, userTarget: userOpenTarget() })).toBeNull()
  })

  it('looks after the open printer in auto mode, and drops the memory when another is open', () => {
    expect(nextAutoSeen(null, { autoId: 'a', otherOpen: true, userTarget: 'a' })).toBe('a')
    expect(nextAutoSeen('a', { autoId: null, otherOpen: true, userTarget: 'a' })).toBeNull()
  })
})

describe('a held route survives a reload of the tab (#370 review)', () => {
  it('keeps a chosen mode in this tab, like the active printer and the relay choice', async () => {
    sessionStorage.clear()
    vi.resetModules()
    const first = await import('../route-choice')
    first.chooseRouteMode('Printer-A', 'lan')
    first.chooseRouteMode('printer-b', 'ble')
    // A reload: the module starts again, the tab's storage stays.
    vi.resetModules()
    const reloaded = await import('../route-choice')
    expect(reloaded.routeMode('printer-a')).toBe('lan')
    expect(reloaded.routeMode('PRINTER-B')).toBe('ble')
    expect(reloaded.routeMode('someone-else')).toBe('auto')
  })

  it('counts a kept "through Muon3D" choice as the cloud route when no mode was recorded', async () => {
    sessionStorage.clear()
    vi.resetModules()
    const hosted = await import('@/services/secure-origin/hosted')
    hosted.chooseRelay('printer-c')
    const routes = await import('../route-choice')
    expect(routes.routeMode('printer-c')).toBe('cloud')
    routes.chooseRouteMode('printer-c', 'auto')
    expect(routes.routeMode('printer-c')).toBe('auto')
    hosted.clearRelayChoice('printer-c')
  })

  it('ignores a stored mode it does not know', async () => {
    sessionStorage.setItem('muon.route.modes', JSON.stringify({ x: 'sideways', y: 'cloud' }))
    vi.resetModules()
    const routes = await import('../route-choice')
    expect(routes.routeMode('x')).toBe('auto')
    expect(routes.routeMode('y')).toBe('cloud')
    sessionStorage.clear()
  })
})
