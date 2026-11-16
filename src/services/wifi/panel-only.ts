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
import { refusal } from '@/services/permissions/api'

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

/**
 * What a 403 from the printer is. The permission store (MuonOS) answers
 * `detail: { code: "permission_restricted", knob, required, allowed, message }`
 * when this caller isn't allowed by the printer's setting; that is not a
 * panel-only printer (KAN-2457).
 */
export type RefusalKind =
  | { kind: 'permission', knob: string, required: string, allowed: string[], message: string }
  | { kind: 'panel-only' }
  | { kind: 'protected' }
  | { kind: 'other' }

const bodyOf = (error: unknown): Record<string, unknown> | null => {
  const data = (error as { response?: { data?: unknown } } | null | undefined)?.response?.data
  return data && typeof data === 'object' ? data as Record<string, unknown> : null
}

export function classifyRefusal (error: unknown): RefusalKind {
  if (statusOf(error) !== 403) return { kind: 'other' }
  const body = bodyOf(error)
  const text = (body?.error as { message?: unknown } | undefined)?.message
  if (typeof text === 'string' && /protected/i.test(text)) return { kind: 'protected' }
  const { code, message } = refusal(body)
  if (code === 'permission_restricted') {
    const detail = (body?.detail && typeof body.detail === 'object' ? body.detail : {}) as Record<string, unknown>
    const allowed = Array.isArray(detail.allowed) ? detail.allowed.filter((a): a is string => typeof a === 'string') : []
    return {
      kind: 'permission',
      knob: typeof detail.knob === 'string' ? detail.knob : '',
      required: typeof detail.required === 'string' ? detail.required : '',
      allowed,
      message: typeof detail.message === 'string' ? message : ''
    }
  }
  // `panel_only`, no code, or any other 403: today's reading, the printer's own screen.
  return { kind: 'panel-only' }
}

/** Fall back to another route only for a printer that refuses or lacks the first. A permission refusal is not that. */
export const fallsBack = (error: unknown): boolean => {
  const status = statusOf(error)
  if (status === 403 && classifyRefusal(error).kind === 'permission') return false
  return status === 403 || status === 404
}

/** A permission-store refusal: who may do this, not where. */
export const isPermissionRefusal = (error: unknown): boolean => classifyRefusal(error).kind === 'permission'

/**
 * A 403 from the printer's own network authority. Moonraker's protection also
 * answers 403, and says so ("is protected on this printer"); that keeps its
 * own notice and is not a panel-only route. Neither is a permission-store
 * refusal, which names who may do the action.
 */
export const isPanelOnlyRefusal = (error: unknown): boolean => {
  const kind = classifyRefusal(error).kind
  return kind === 'panel-only'
}

/** Plain words for who may do it. */
export function permissionMessage (r: Extract<RefusalKind, { kind: 'permission' }>, signedIn: boolean): string {
  const required = r.required || (r.allowed.length === 1 ? r.allowed[0] : '')
  if (required === 'owner') return "Only this printer's owner can do this."
  if (required === 'owner_and_shared') {
    return signedIn
      ? "Only this printer's owner and the people it's shared with can do this, and this account isn't one of them."
      : "Only this printer's owner and the people it's shared with can do this, and this browser isn't signed in as one of them."
  }
  if (required === 'owner_at_printer') return 'This printer only lets its owner do this, in person at the printer.'
  return "This printer isn't letting this browser do this."
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
