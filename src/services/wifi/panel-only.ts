/**
 * Wi-Fi actions that MuonOS #492 made panel-only (KAN-1799).
 *
 * After setup the printer refuses POST /wifi/up, /wifi/disconnect,
 * /wifi/ap/modify and /wifi/ap/down from anyone but its own screen, with a 403.
 * Control picks the route that is still open where one does the same job, and
 * says "Do this at the printer's screen" where none does. A printer without
 * #492 still answers the old routes, so the old route is tried first and the
 * other only after a 403 or a 404.
 */
import Vue from 'vue'

export const PANEL_ONLY_NOTE = "Do this at the printer's screen"

export type WifiAction = 'join-saved' | 'disconnect' | 'hotspot-on' | 'hotspot-off' | 'hotspot-edit'

/** Which actions this printer has refused as panel-only. Shared by every card. */
export const refusedHere = Vue.observable({ disconnect: false, hotspotOff: false, hotspotEdit: false })

export type Refused = Readonly<typeof refusedHere>

export type RouteChoice =
  | { kind: 'call', method: 'POST', path: string }
  | { kind: 'panel' }

const call = (path: string): RouteChoice => ({ kind: 'call', method: 'POST', path })

/**
 * The route for an action.
 * - Joining a saved network is POST /wifi/connect with no password: the same
 *   job as /wifi/up, and it stays open.
 * - Disconnecting and turning the hotspot off have no open route: once refused
 *   they are the panel's.
 * - A hotspot change is /wifi/ap/modify; once refused, /wifi/ap/change, which
 *   the person at the printer confirms with the knob.
 */
export function routeFor (action: WifiAction, refused: Refused): RouteChoice {
  switch (action) {
    case 'join-saved': return call('/wifi/connect')
    case 'hotspot-on': return call('/wifi/ap/up')
    case 'disconnect': return refused.disconnect ? { kind: 'panel' } : call('/wifi/disconnect')
    case 'hotspot-off': return refused.hotspotOff ? { kind: 'panel' } : call('/wifi/ap/down')
    case 'hotspot-edit': return call(refused.hotspotEdit ? '/wifi/ap/change' : '/wifi/ap/modify')
  }
}

const statusOf = (error: unknown): number | undefined => (error as { response?: { status?: number } } | null | undefined)?.response?.status

/** Fall back to another route only for a printer that refuses or lacks the first. */
export const fallsBack = (error: unknown): boolean => {
  const status = statusOf(error)
  return status === 403 || status === 404
}

/**
 * A 403 from the printer's own network authority. Moonraker's protection also
 * answers 403, and says so ("is protected on this printer"); that keeps its
 * own notice and is not a panel-only route.
 */
export const isPanelOnlyRefusal = (error: unknown): boolean => {
  if (statusOf(error) !== 403) return false
  const data = (error as { response?: { data?: { error?: { message?: unknown } } } }).response?.data
  const text = data?.error?.message
  return !(typeof text === 'string' && /protected/i.test(text))
}

/** What a refused action says. */
export const panelOnlyMessage = (what: string): string => `${PANEL_ONLY_NOTE}: this printer only lets its own screen ${what}.`

export interface HotspotForm { ssid: string, securityEnabled: boolean, password: string }

/**
 * The body of POST /wifi/ap/change, or null when that route cannot do it (an
 * open hotspot). The name goes only if it changed; the key only if one was typed.
 */
export function hotspotChangeBody (form: HotspotForm, originalSsid?: string): { ssid?: string, password?: string } | null {
  if (!form.securityEnabled) return null
  const body: { ssid?: string, password?: string } = {}
  if (form.ssid !== originalSsid) body.ssid = form.ssid
  if (form.password) body.password = form.password
  return body
}
