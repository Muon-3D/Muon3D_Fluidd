import { describe, expect, it } from 'vitest'
import {
  PANEL_ONLY_NOTE,
  fallsBack,
  hotspotChangeBody,
  isPanelOnlyRefusal,
  panelOnlyMessage,
  routeFor
} from '../panel-only'

const failed = (status: number, data: unknown = {}) => Object.assign(new Error(`status ${status}`), { response: { status, data } })

describe('routeFor: which route each Wi-Fi action uses', () => {
  const none = { disconnect: false, hotspotOff: false, hotspotEdit: false }

  it('joins a saved network with POST /wifi/connect, never /wifi/up', () => {
    expect(routeFor('join-saved', none)).toEqual({ kind: 'call', method: 'POST', path: '/wifi/connect' })
    expect(routeFor('join-saved', { ...none, disconnect: true })).toEqual({ kind: 'call', method: 'POST', path: '/wifi/connect' })
  })

  it('disconnects with POST /wifi/disconnect until the printer has refused it', () => {
    expect(routeFor('disconnect', none)).toEqual({ kind: 'call', method: 'POST', path: '/wifi/disconnect' })
    expect(routeFor('disconnect', { ...none, disconnect: true })).toEqual({ kind: 'panel' })
  })

  it('turns the hotspot off with POST /wifi/ap/down until the printer has refused it', () => {
    expect(routeFor('hotspot-off', none)).toEqual({ kind: 'call', method: 'POST', path: '/wifi/ap/down' })
    expect(routeFor('hotspot-off', { ...none, hotspotOff: true })).toEqual({ kind: 'panel' })
  })

  it('changes the hotspot with /wifi/ap/modify, then /wifi/ap/change once modify has been refused', () => {
    expect(routeFor('hotspot-edit', none)).toEqual({ kind: 'call', method: 'POST', path: '/wifi/ap/modify' })
    expect(routeFor('hotspot-edit', { ...none, hotspotEdit: true })).toEqual({ kind: 'call', method: 'POST', path: '/wifi/ap/change' })
  })

  it('turning the hotspot on is not a panel-only action', () => {
    expect(routeFor('hotspot-on', { disconnect: true, hotspotOff: true, hotspotEdit: true })).toEqual({ kind: 'call', method: 'POST', path: '/wifi/ap/up' })
  })
})

describe('what counts as a refusal', () => {
  it('falls back only on 403 and 404', () => {
    expect(fallsBack(failed(403))).toBe(true)
    expect(fallsBack(failed(404))).toBe(true)
    for (const status of [400, 401, 409, 422, 500, 502, 503]) expect(fallsBack(failed(status))).toBe(false)
    expect(fallsBack(new Error('Network Error'))).toBe(false)
    expect(fallsBack(null)).toBe(false)
  })

  it('reads a 403 as panel-only, but not a 404', () => {
    expect(isPanelOnlyRefusal(failed(403))).toBe(true)
    expect(isPanelOnlyRefusal(failed(404))).toBe(false)
    expect(isPanelOnlyRefusal(undefined)).toBe(false)
  })

  it('does not call Moonraker protection panel-only: that has its own notice', () => {
    const protectedRoute = failed(403, { error: { code: 403, message: "'/server/aux/wifi/disconnect' is protected on this printer." } })
    expect(isPanelOnlyRefusal(protectedRoute)).toBe(false)
  })
})

describe('the message a refusal shows', () => {
  it('always names the printer screen and the thing that was refused', () => {
    const text = panelOnlyMessage('disconnect from the network')
    expect(text).toContain(PANEL_ONLY_NOTE)
    expect(text).toContain('disconnect from the network')
    expect(PANEL_ONLY_NOTE).toBe("Do this at the printer's screen")
  })
})

describe('the body of POST /wifi/ap/change', () => {
  it('sends the new name and the new password', () => {
    expect(hotspotChangeBody({ ssid: 'Muon-Shop', securityEnabled: true, password: 'secret-pass-1' }, 'Muon-M1')).toEqual({ ssid: 'Muon-Shop', password: 'secret-pass-1' })
  })

  it('leaves the password out when none was typed', () => {
    expect(hotspotChangeBody({ ssid: 'Muon-Shop', securityEnabled: true, password: '' }, 'Muon-M1')).toEqual({ ssid: 'Muon-Shop' })
  })

  it('leaves the name out when it did not change', () => {
    expect(hotspotChangeBody({ ssid: 'Muon-M1', securityEnabled: true, password: 'secret-pass-1' }, 'Muon-M1')).toEqual({ password: 'secret-pass-1' })
  })

  it('cannot make the hotspot open: that is for the printer', () => {
    expect(hotspotChangeBody({ ssid: 'Muon-Shop', securityEnabled: false, password: '' })).toBeNull()
  })
})
