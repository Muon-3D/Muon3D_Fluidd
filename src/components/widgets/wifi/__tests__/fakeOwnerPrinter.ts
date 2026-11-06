import { vi } from 'vitest'

/**
 * A printer's `/muon-link/network/*` routes, in memory, behind the
 * `request()` of Fluidd's http client. Records every call so a test can say
 * what was sent, and never what was typed into a password.
 */
export interface Call {
  method: string;
  url: string;
  data?: Record<string, unknown>;
}

const failure = (status: number, data?: unknown) =>
  Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data } })

export class FakeOwnerPrinter {
  path = 'local'
  rules = { network_from_ble: 'allow', network_from_direct: 'allow', network_from_relay: 'reauth' }
  scan = [
    { ssid: 'Home', signal: 80, security: 'WPA2', in_use: true },
    { ssid: 'Cafe', signal: 55, security: 'Open', in_use: false },
    { ssid: 'Neighbour', signal: 30, security: 'WPA2', in_use: false }
  ]

  saved = [{ name: 'Home', uuid: 'u1', device: 'wlan0' }, { name: 'Old flat', uuid: 'u2', device: null }]
  current: { ssid: string, signal: number } | null = { ssid: 'Home', signal: 80 }
  /** Every route answers with this, until cleared. */
  refuseAll: { status: number, data?: unknown } | null = null
  /** The next states `GET /hotspot/change/{id}` answers, then the last one repeats. */
  changeStates: string[] = ['waiting', 'applied']
  calls: Call[] = []

  request = vi.fn(async (config: { method: string, url: string, data?: Record<string, unknown> }) => {
    const { method, url, data } = config
    this.calls.push({ method, url, data })
    if (this.refuseAll) throw failure(this.refuseAll.status, this.refuseAll.data)
    const path = url.replace('/muon-link/network', '')
    const ok = (body: unknown, status = 200) => ({ status, data: body })

    if (method === 'GET' && path === '/settings') return ok({ ...this.rules, current_path: this.path })
    if (method === 'PUT' && path === '/settings') {
      if (this.path === 'relay' || this.path === 'direct_wan') throw failure(403, { error: 'reauth_required' })
      Object.assign(this.rules, data)
      return ok({ ...this.rules, current_path: this.path })
    }
    if (method === 'GET' && path === '/wifi/scan') return ok(this.scan)
    if (method === 'GET' && path === '/wifi/saved') return ok(this.saved)
    if (method === 'GET' && path === '/wifi/current') return ok(this.current)
    if (method === 'POST' && path === '/wifi/connect') return ok({ status: 'connecting', ssid: data?.ssid })
    if (method === 'DELETE' && path.startsWith('/wifi/forget')) return ok({ status: 'forgotten' })
    if (method === 'POST' && path === '/hotspot/change') return ok({ challenge_id: 'chg_0123456789abcdef', expires_at: Date.now() / 1000 + 120 }, 202)
    if (method === 'GET' && path.startsWith('/hotspot/change/')) {
      const state = this.changeStates.length > 1 ? this.changeStates.shift() : this.changeStates[0]
      return ok({ state })
    }
    throw failure(404, 'not found')
  })

  /** What was sent to a route, e.g. `sent('POST', '/wifi/connect')`. */
  sent (method: string, path: string): Call[] {
    return this.calls.filter(c => c.method === method && c.url === `/muon-link/network${path}`)
  }
}

/** Let every pending promise and render settle (real timers). */
export async function flushPromises (): Promise<void> {
  for (let i = 0; i < 4; i++) await new Promise(resolve => setTimeout(resolve, 0))
}
