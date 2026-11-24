/**
 * A fake of the console's admin side (KAN-6100, KAN-6113) for e2e tests: the staff
 * session with its two limits (60 minutes, 15 idle: Jack's D-204), the passkey
 * ceremony, and the `/v1/admin/obs/*` endpoints, which do not exist on the real
 * console yet (KAN-6115). It follows the design spec's contract, so the page is
 * tested against what the console PR has to build. Registered on the page's own
 * origin AFTER `serveConsoleHere`, so it answers `/v1/admin/**` and the staff passkey.
 *
 * Time is real: a test shortens a limit (`lease`, `idle`) instead of moving a clock.
 */
import type { Page, Route } from '@playwright/test'

export type Role = 'staff' | 'moderator' | 'none'

interface Seen { path: string; background: boolean; body: any }

export interface AdminState {
  role: Role;
  /** The account has a passkey (409 from the options call when false). */
  passkey: boolean;
  /** Absolute limit and idle limit, in seconds, applied at each confirmation. */
  lease: number;
  idle: number;
  /** Panels whose result is "unavailable". */
  failPanels: Set<string>;
  /** The obs endpoints answer 404, as a console from before KAN-6115. */
  noObs: boolean;
  confirmedAt: number;
  activeAt: number;
  endedWith: '' | 'absolute' | 'idle' | 'ended';
  /** Every admin call, in order. */
  seen: Seen[];
  /** The passkey ceremonies completed. */
  ceremonies: number;
}

export function adminState (over: Partial<AdminState> = {}): AdminState {
  return { role: 'staff', passkey: true, lease: 3600, idle: 900, failPanels: new Set(), noObs: false, confirmedAt: 0, activeAt: 0, endedWith: '', seen: [], ceremonies: 0, ...over }
}

const now = () => Math.floor(Date.now() / 1000)
const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

/** The obs calls a test counts: what a section asks for. */
export const calls = (state: AdminState, path: string, background?: boolean) =>
  state.seen.filter(s => s.path === path && (background === undefined || s.background === background))

const TILES = ['ov-services', 'ov-endpoints', 'ov-alerts', 'ov-rps', 'ov-5xx', 'ov-p95', 'ov-printers', 'ov-active']
const tile = (id: string, title: string) => ({ id, title, chart: 'tile', status: 'real' })

export const CATALOG = {
  sections: [
    {
      id: 'overview', title: 'Overview', grafana_uid: 'muon-overview',
      panels: [
        tile('ov-services', 'Services up'), tile('ov-endpoints', 'Endpoints up'), tile('ov-alerts', 'Firing alerts'), tile('ov-rps', 'Requests'),
        tile('ov-5xx', '5xx ratio'), tile('ov-p95', 'p95 latency'), tile('ov-printers', 'Printers online'), tile('ov-active', 'Active accounts'),
        { id: 'ov-signins', title: 'Sign-ins by method', chart: 'stacked_bar', unit: '/min', status: 'placeholder', needs: { metric: 'muon_console_signins_total{method,result}', type: 'counter', emitter: 'muon-console (signin.rs)' } },
        { id: 'ov-rps-job', title: 'Requests by service', chart: 'line', unit: 'req/s', status: 'real', query: 'job:muon_http_requests:rate5m' },
        { id: 'ov-p95-job', title: 'p95 latency by service', chart: 'line', unit: 'ms', status: 'real', query: 'job:muon_http_latency_seconds:p95_5m' },
        { id: 'ov-prints', title: 'Print jobs started and finished', chart: 'stacked_bar', unit: '/h', status: 'placeholder', needs: { metric: 'muon_fleet_print_jobs_total{result}', emitter: 'muon-console, from printer reports' } }
      ]
    },
    {
      id: 'traffic', title: 'Traffic and latency', grafana_uid: 'muon-service',
      panels: [
        tile('tr-rps', 'Requests'),
        { id: 'tr-route', title: 'Requests by route', chart: 'line', unit: 'req/s', status: 'real', query: 'topk(4, job_route:muon_http_requests:rate5m{job="$job"})' },
        { id: 'tr-p95-route', title: 'p95 by route', chart: 'table', unit: 'ms', status: 'real' },
        { id: 'tr-relay', title: 'Relay connections', chart: 'line', status: 'placeholder', needs: { metric: 'muon_link_relay_connections{kind}', emitter: 'muon-ops recording rule' } }
      ]
    },
    { id: 'infrastructure', title: 'Infrastructure', grafana_uid: 'muon-host', panels: [{ id: 'in-cpu', title: 'CPU busy', chart: 'line', unit: '%', status: 'real' }] }
  ]
}

const SERVICES = ['muon-console', 'muon-models', 'iroh-relay']
const series = (name: string, base: number) => ({ labels: { job: name }, points: Array.from({ length: 12 }, (_, i) => [now() - (12 - i) * 60, base + i]) })

function result (id: string, job: string, state: AdminState) {
  if (state.failPanels.has(id) || job === 'machine-queue' || job === 'tracker') {
    return { status: 'unavailable', job, reason: job === 'machine-queue' ? 'Scrape target 127.0.0.1:9466 is down. Last seen: never.' : 'Prometheus did not answer.' }
  }
  if (id === 'ov-services') return { status: 'ok', value: 3, of: 5, level: 'warning', note: 'machine-queue and tracker are down' }
  if (id === 'ov-endpoints') return { status: 'ok', value: 10, of: 10, level: 'good', note: 'next certificate expires in 61 days' }
  if (TILES.includes(id) || id === 'tr-rps') return { status: 'ok', value: 12, level: 'good', note: 'last 5 minutes' }
  if (id === 'tr-p95-route') return { status: 'ok', rows: [{ route: '/v1/me', p95: 120 }, { route: '/token', p95: 300 }] }
  return { status: 'ok', series: SERVICES.map((s, i) => series(s, 10 * (i + 1))) }
}

/** Nanosecond timestamps as digit strings (they pass 2^53): `ms` ago. */
const ns = (msAgo: number): string => `${Date.now() - msAgo}000000`
const later = (a: string, b: string): boolean => (a.length !== b.length ? a.length > b.length : a > b)
export const LOG_LINES = [
  { ts_ns: ns(5000), service: 'muon-console', level: 'error', source: 'journal', message: 'sign-in failed for method=password', fields: { request_id: 'req-abc', route: '/token', status: 500, error_code: 'auth.failed' } },
  { ts_ns: ns(4000), service: 'muon-models', level: 'info', source: 'journal', message: 'GET /v1/models 200', fields: { request_id: 'req-abc', route: '/v1/models', status: 200 } },
  { ts_ns: ns(3000), service: 'muon-console', level: 'info', source: 'journal', message: 'refresh ok', fields: { request_id: 'req-def', route: '/token', status: 200 } },
  { ts_ns: ns(2000), service: 'nginx', level: 'warn', source: 'nginx-error', message: 'upstream slow', fields: { request_id: 'req-ghi' } }
]

export async function serveAdmin (page: Page, state: AdminState, origin: string) {
  const signedIn = (route: Route) => !!route.request().headers().authorization
  const authority = (): 'ok' | { status: number; body: unknown } => {
    if (state.role !== 'staff') return { status: 403, body: { code: 'console.staff.required' } }
    const t = now()
    if (!state.confirmedAt) return { status: 403, body: { code: 'console.staff.reauth_required', reason: state.endedWith || undefined } }
    if (t >= state.confirmedAt + state.lease) { state.confirmedAt = 0; state.endedWith = 'absolute'; return { status: 403, body: { code: 'console.staff.reauth_required', reason: 'absolute' } } }
    if (t >= state.activeAt + state.idle) { state.confirmedAt = 0; state.endedWith = 'idle'; return { status: 403, body: { code: 'console.staff.reauth_required', reason: 'idle' } } }
    return 'ok'
  }
  const sessionBody = () => ({ actor: 'jack@example.test', staff_expires_at: state.confirmedAt + state.lease, staff_idle_expires_at: state.activeAt + state.idle, server_time: now() })

  await page.route(`${origin}/v1/**`, async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const admin = path.startsWith('/v1/admin/') || path.startsWith('/v1/me/reauth/') || path.startsWith('/v1/me/staff/')
    if (!admin) return route.fallback()
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204 })
    let body: any = null
    try { body = request.postDataJSON() } catch { body = null }
    const background = request.headers()['x-muon-background'] === '1'
    state.seen.push({ path, background, body })
    if (!signedIn(route)) return json(route, { code: 'auth.required' }, 401)

    if (path === '/v1/me/reauth/passkey/options') {
      if (state.role === 'none') return json(route, { code: 'console.staff.required' }, 403)
      if (!state.passkey) return json(route, { code: 'console.reauth.no_passkey' }, 409)
      return json(route, { ceremony_id: 'c1', options: { publicKey: { challenge: 'YQ' } }, expires_at: now() + 60 })
    }
    if (path === '/v1/me/reauth/passkey') {
      state.ceremonies++
      state.confirmedAt = now(); state.activeAt = now(); state.endedWith = ''
      return json(route, { ok: true })
    }
    if (path === '/v1/me/staff/assertion') {
      if (state.role !== 'staff') return json(route, { code: 'console.staff.required' }, 403)
      return json(route, { assertion: 'e2e.assertion.value', expires_at: now() + 60 })
    }
    if (path === '/v1/admin/session') {
      const a = authority()
      return a === 'ok' ? json(route, sessionBody()) : json(route, a.body, a.status)
    }
    if (path === '/v1/admin/session/touch') {
      const a = authority()
      if (a !== 'ok') return json(route, a.body, a.status)
      state.activeAt = now()
      return json(route, sessionBody())
    }
    if (path === '/v1/admin/session/end') {
      const a = authority()
      if (a !== 'ok') return json(route, a.body, a.status)
      state.confirmedAt = 0; state.activeAt = 0; state.endedWith = 'ended'
      return route.fulfill({ status: 204 })
    }
    if (path.startsWith('/v1/admin/obs/')) {
      if (state.noObs) return json(route, { error: 'not found' }, 404)
      const a = authority()
      if (a !== 'ok') return json(route, a.body, a.status)
      if (!background) state.activeAt = now()
      const name = path.slice('/v1/admin/obs/'.length)
      if (name === 'catalog') return json(route, CATALOG)
      if (name === 'status') return json(route, { schema: 'muon-top/1', age_s: 10 })
      if (name === 'query') {
        const ids: string[] = body.panels
        const known = new Set(CATALOG.sections.flatMap(s => s.panels.map(p => p.id)))
        if (ids.some(id => !known.has(id))) return json(route, { code: 'console.obs.bad_query' }, 400)
        return json(route, { step_s: 30, results: Object.fromEntries(ids.map(id => [id, result(id, body.vars?.job ?? '', state)])) })
      }
      if (name === 'logs') {
        let lines = LOG_LINES.filter(l => (!body.service?.length || body.service.includes(l.service)) && (!body.level?.length || body.level.includes(l.level)))
        if (body.rid) lines = LOG_LINES.filter(l => l.fields.request_id === body.rid || l.message.includes(body.rid))
        if (body.q) lines = lines.filter(l => l.message.includes(body.q))
        if (body.after_ns) lines = lines.filter(l => later(l.ts_ns, body.after_ns))
        return json(route, { lines, histogram: [{ t: now() - 60, level: 'info', n: 3 }, { t: now() - 60, level: 'error', n: 1 }] })
      }
      if (name === 'alerts') {
        return json(route, {
          alerts: [{ name: 'MuonServiceDown', severity: 'critical', state: 'firing', labels: { job: 'iroh-relay' }, summary: 'iroh-relay is down', since: now() - 120 }, { name: 'Watchdog', severity: 'info', state: 'firing', labels: {}, summary: 'always firing', since: now() - 9000 }],
          rules: [{ name: 'MuonServiceDown', severity: 'critical', expr: 'up == 0', for_s: 120, state: 'firing' }, { name: 'MuonHighLoad', severity: 'warning', expr: 'node_load15 > 2', for_s: 600, state: 'ok' }],
          watchdog_ok: true, delivery: { email: 'pending' }
        })
      }
      return json(route, { code: 'console.obs.bad_query' }, 400)
    }
    // Staff tools: the review queue is empty. Moderators may read it with a confirmation.
    if (path === '/v1/admin/community') {
      if (state.role === 'none') return json(route, { code: 'console.staff.required' }, 403)
      return json(route, { cases: [], reservations: [] })
    }
    return json(route, { code: 'not_found' }, 404)
  })
}

/** What a passkey tap returns, and no prompt: the page's `navigator.credentials.get` answers at once. */
export async function allowPasskey (page: Page) {
  await page.addInitScript(() => {
    const bytes = (n: number) => new Uint8Array([n]).buffer
    ;(navigator.credentials as any).get = async () => ({ id: 'YQ', rawId: bytes(1), type: 'public-key', response: { clientDataJSON: bytes(1), authenticatorData: bytes(2), signature: bytes(3) } })
  })
}

export async function cancelPasskey (page: Page) {
  await page.addInitScript(() => {
    ;(navigator.credentials as any).get = async () => { throw new DOMException('cancelled', 'NotAllowedError') }
  })
}
