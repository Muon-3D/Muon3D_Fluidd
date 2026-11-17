/**
 * Wi-Fi from Control over any route (KAN-3601).
 *
 * On the printer's own network Control calls the Aux API through Moonraker
 * (`/server/aux/wifi/...`). Over Bluetooth or Muon3D (the managed Iroh
 * session) `/server/aux` is closed to every caller, and muon-link answers the
 * same jobs itself under `/muon-link/network/wifi/...` and forwards them to the
 * Aux API, whose permission store decides who may (muon-link docs/NETWORK_ROUTES.md,
 * MuonOS docs/connectivity/PERMISSIONS.md; an open printer says "anyone").
 *
 * Only the Wi-Fi routes that contract lists are mapped. The hotspot's routes
 * and the per-SSID `GET /wifi/show` are not, and stay refused there.
 */

export const MANAGED_NETWORK_PREFIX = '/muon-link/network'

type Method = 'GET' | 'POST' | 'DELETE'

/** The Aux API route, its method, and whether muon-link takes `?ssid=` on it (the scan takes no query at all). */
const ROUTES: Array<{ method: Method, path: string, ssid?: true }> = [
  { method: 'GET', path: '/wifi/scan' },
  { method: 'GET', path: '/wifi/saved' },
  { method: 'GET', path: '/wifi/current' },
  { method: 'POST', path: '/wifi/connect' },
  { method: 'POST', path: '/wifi/disconnect' },
  { method: 'DELETE', path: '/wifi/forget', ssid: true },
  { method: 'POST', path: '/wifi/up', ssid: true },
  { method: 'POST', path: '/wifi/device/up' },
  { method: 'POST', path: '/wifi/device/down' }
]

/**
 * The muon-link route for an Aux API request, or null when muon-link has none
 * (that request stays refused over a managed session). `url` is what the Aux
 * client built: a base path, the route, and its query.
 */
export function managedNetworkUrl (method: string | undefined, url: string | undefined): string | null {
  if (!url) return null
  const verb = (method ?? 'get').toUpperCase()
  const match = /^(?:[a-z][a-z0-9+.-]*:\/\/[^/]+)?(?:\/[^?#]*?)?(\/wifi\/[^?#]*)(\?[^#]*)?/i.exec(url)
  if (!match) return null
  const route = ROUTES.find(r => r.method === verb && r.path === match[1])
  if (!route) return null
  // muon-link takes exactly `ssid=<name>` where it takes a query, and nothing on the others.
  let query = ''
  if (route.ssid) {
    const ssid = new URLSearchParams(match[2] ?? '').get('ssid')
    if (ssid) query = `?ssid=${encodeURIComponent(ssid)}`
  }
  return `${MANAGED_NETWORK_PREFIX}${route.path}${query}`
}

/** What a refusal by muon-link's own network rules or an older muon-link means for the person. */
export type ManagedNetworkProblem =
  | { kind: 'not-available', message: string }
  | { kind: 'path-rule', message: string }

const NOT_AVAILABLE = "This printer's software can't change Wi-Fi over this connection yet. Update the printer, or use its own network."
const PATH_RULES: Record<string, string> = {
  path_disabled: "The printer's owner has turned off Wi-Fi changes over this connection (Settings, Security).",
  reauth_required: 'The printer wants you to sign in again before it changes Wi-Fi over this connection.'
}

/** Reads a failed muon-link network call. Null for anything else (a permission refusal, a join failure). */
export function managedNetworkProblem (error: unknown): ManagedNetworkProblem | null {
  const response = (error as { response?: { status?: number, data?: unknown } } | null)?.response
  if (!response) return null
  const body = response.data && typeof response.data === 'object' ? response.data as Record<string, unknown> : {}
  const detail = body.detail && typeof body.detail === 'object' ? body.detail as Record<string, unknown> : {}
  const code = typeof detail.code === 'string' ? detail.code : typeof body.error === 'string' ? body.error : ''
  if (response.status === 403 && PATH_RULES[code]) return { kind: 'path-rule', message: PATH_RULES[code] }
  // An older muon-link has no such route: a bare 404 with no body of ours.
  if (response.status === 404 && !code) return { kind: 'not-available', message: NOT_AVAILABLE }
  return null
}
