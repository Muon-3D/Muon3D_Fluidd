/**
 * muon-link's owner network routes (`/muon-link/network/*`, KAN-1565), answered
 * with page.route from in-memory state. Real muon-link answers them over the
 * printer's Iroh connection; here the page's own http client reaches them, and
 * `reachOverMuonLink(page)` makes Control believe it is on that connection.
 *
 *   const net = await useOwnerNetwork(page, { path: 'relay' })
 *   await open('/wifi'); await reachOverMuonLink(page)
 *
 * `net.seen` lists "METHOD path" for each call, and `net.bodies` the JSON bodies
 * (a passphrase is in them, so a test must never print one).
 */
import type { Page, Route } from '@playwright/test'

export interface OwnerNetworkState {
  /** The path class muon-link reports the request arrived on. */
  path: 'ble' | 'local' | 'direct_wan' | 'relay'
  rules: { network_from_ble: string, network_from_direct: string, network_from_relay: string }
  /** 404 for every route: an older muon-link. */
  older: boolean
  /** 403 forbidden for every route: not the owner. */
  notOwner: boolean
  /** Every route but settings answers 403 with this error code. */
  refuse: 'reauth_required' | 'path_disabled' | null
  scan: Array<Record<string, unknown>>
  saved: Array<Record<string, unknown>>
  current: { ssid: string, signal: number } | null
  /** The next states of the hotspot change; the last one repeats. */
  changeStates: string[]
  seen: string[]
  bodies: Array<{ route: string, body: unknown }>
}

export function ownerNetworkState (over: Partial<OwnerNetworkState> = {}): OwnerNetworkState {
  return {
    path: 'local',
    rules: { network_from_ble: 'allow', network_from_direct: 'allow', network_from_relay: 'reauth' },
    older: false,
    notOwner: false,
    refuse: null,
    scan: [
      { ssid: 'Workshop', signal: 82, security: 'WPA2', in_use: true },
      { ssid: 'Cafe', signal: 55, security: 'Open', in_use: false }
    ],
    saved: [{ name: 'Workshop', uuid: 'u1', device: 'wlan0' }],
    current: { ssid: 'Workshop', signal: 82 },
    changeStates: ['waiting', 'applied'],
    seen: [],
    bodies: [],
    ...over
  }
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': '*'
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) })

export async function useOwnerNetwork (page: Page, over: Partial<OwnerNetworkState> = {}): Promise<OwnerNetworkState> {
  const state = ownerNetworkState(over)
  await page.route('**/muon-link/network/**', async route => {
    const request = route.request()
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    const url = new URL(request.url())
    const path = url.pathname.replace(/^.*\/muon-link\/network/, '')
    state.seen.push(`${request.method()} ${path}${url.search}`)
    const body = request.postData()
    if (body) state.bodies.push({ route: path, body: JSON.parse(body) })

    if (state.older) return route.fulfill({ status: 404, headers: CORS, contentType: 'text/plain', body: 'Not Found' })
    if (state.notOwner) return json(route, { error: 'forbidden' }, 403)
    const method = request.method()
    if (path === '/settings') {
      if (method === 'PUT') {
        if (state.path === 'relay' || state.path === 'direct_wan') return json(route, { error: 'reauth_required' }, 403)
        Object.assign(state.rules, JSON.parse(body ?? '{}'))
      }
      return json(route, { ...state.rules, current_path: state.path })
    }
    if (state.refuse) return json(route, { error: state.refuse }, 403)
    if (method === 'GET' && path === '/wifi/scan') return json(route, state.scan)
    if (method === 'GET' && path === '/wifi/saved') return json(route, state.saved)
    if (method === 'GET' && path === '/wifi/current') return json(route, state.current)
    if (method === 'POST' && path === '/wifi/connect') return json(route, { status: 'connecting', ssid: JSON.parse(body ?? '{}').ssid })
    if (method === 'DELETE' && path === '/wifi/forget') return json(route, { status: 'forgotten' })
    if (method === 'POST' && path === '/hotspot/change') return json(route, { challenge_id: 'chg_e2e_0123456789', expires_at: Date.now() / 1000 + 120 }, 202)
    if (method === 'GET' && path.startsWith('/hotspot/change/')) {
      const next = state.changeStates.length > 1 ? state.changeStates.shift() : state.changeStates[0]
      return json(route, { state: next })
    }
    return route.fulfill({ status: 404, headers: CORS, body: 'Not Found' })
  })
  return state
}

/**
 * Make Control think its requests travel over the printer's muon-link
 * connection, the way the Iroh transport binds them. The e2e mock printer is
 * plain HTTP, so this flips the same flag the Iroh binding sets.
 */
export async function reachOverMuonLink (page: Page) {
  await page.evaluate(async () => {
    // eslint-disable-next-line import/no-absolute-path
    const binding = await import(/* @vite-ignore */ '/src/services/managed-session/httpTransportBinding.ts')
    binding.printerTransportBinding.remote = true
  })
}
