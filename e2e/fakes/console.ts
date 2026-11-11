/**
 * A fake console (the Muon3D account service) for e2e tests: one signed-in
 * account, its linked printers, and the assertion the model service takes.
 * Control finds the console at the address saved under `muon.cloud.url`, so a
 * test points it here before the app starts (useConsole below, every test).
 */
import type { Page, Route } from '@playwright/test'

export const CONSOLE = 'https://console.e2e.test'

export interface ConsolePrinter {
  id: string;
  name: string;
  model: string;
  state: string;
  /** A share to this account rather than a printer it linked, with its role and share. */
  shared?: boolean;
  role?: 'operator' | 'viewer';
  share_id?: string;
  ends_at?: number | null;
  sharer?: { account_id: string, display_name: string };
  [key: string]: unknown;
}

export interface ConsoleState {
  account: { id: string, email: string, name: string, created_at?: number, deletion?: { requested_at: number, delete_after: number } | null };
  /** `/v1/me/exports`, when a test needs it: the data requests. A POST files a queued one. */
  exports?: Array<Record<string, unknown> & { id: string }>;
  printers: ConsolePrinter[];
  /** `/v1/me/preferences`, kept across reloads; null answers 404, as a console from before it. */
  preferences: Record<string, boolean> | null;
  /** Bodies PUT to `/v1/me/preferences`, in order. */
  preferencePatches: Array<Record<string, boolean>>;
  seen: string[];
  /** Per printer: its people (shares), pending email invites and invite links, for its owner. */
  shares: Record<string, unknown[]>;
  invites: Record<string, unknown[]>;
  links: Record<string, unknown[]>;
  /** Join requests waiting for this account. */
  approvals: unknown[];
  /** The community identity (`/v1/me/community-identity`), when a test needs it; otherwise the fake answers {}. */
  identity?: { declared_age: number | null, declared_at: number | null, can_community: boolean, can_public: boolean, identity_public: boolean, revision: number, projection_pending: boolean };
  /** The account's sessions (`/v1/me/sessions`), when a test needs them: the console's own shape. */
  sessions?: Array<Record<string, unknown> & { id: string, current: boolean }>;
  /** Answer matching requests with a status ("PATCH /v1/me"): the console failing. */
  failOn?: (request: string) => number | null;
  /** Every request that changes something (not a GET), with its body: `DELETE /v1/printers/p1/shares/s1`. */
  changes: Array<{ call: string, body: unknown }>;
}

export function consoleState (over: Partial<ConsoleState> = {}): ConsoleState {
  return {
    account: { id: 'acct-e2e', email: 'jack@example.test', name: 'Jack' },
    printers: [],
    preferences: { email_access_requests: true, email_shared_with_you: true, email_community: false, email_news: false },
    preferencePatches: [],
    seen: [],
    shares: {},
    invites: {},
    links: {},
    approvals: [],
    changes: [],
    ...over
  }
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key' }, body: JSON.stringify(body) })

export async function serveConsole (page: Page, state: ConsoleState) {
  await page.route(`${CONSOLE}/**`, route => answerConsole(route, state))
}

const PRINTER_LIST = /^\/v1\/printers\/([^/]+)\/(shares|invites|links)$/

/** The console's answer to one request: also used where a test serves the console at another address. */
export async function answerConsole (route: Route, state: ConsoleState) {
  const request = route.request()
  const url = new URL(request.url())
  state.seen.push(`${request.method()} ${url.pathname}`)
  if (request.method() !== 'GET' && request.method() !== 'OPTIONS') {
    let body: unknown = null
    try { body = request.postDataJSON() } catch { body = request.postData() }
    state.changes.push({ call: `${request.method()} ${url.pathname}`, body })
  }
  const failure = state.failOn?.(`${request.method()} ${url.pathname}`)
  if (failure) return json(route, { error: { code: 'unavailable', message: 'The console is down for a moment.' } }, failure)
  if (request.method() === 'PATCH' && url.pathname === '/v1/me') {
    const body = request.postDataJSON() as { name?: string }
    if (typeof body.name === 'string') state.account.name = body.name
    return json(route, { account: { ...state.account, display_name: state.account.name } })
  }
  if (state.exports && url.pathname === '/v1/me/exports') {
    if (request.method() === 'GET') return json(route, { exports: state.exports })
    if (request.method() === 'POST') {
      const made = { id: `exp-${state.exports.length + 1}`, status: 'queued', requested_at: Math.floor(Date.now() / 1000) }
      state.exports = [made, ...state.exports]
      return json(route, made, 202)
    }
  }
  if (request.method() === 'DELETE' && url.pathname === '/v1/me' && state.account.deletion !== undefined) {
    const now = Math.floor(Date.now() / 1000)
    state.account.deletion = { requested_at: now, delete_after: now + 14 * 86_400 }
    return json(route, { ok: true, delete_after: state.account.deletion.delete_after })
  }
  const owned = url.pathname.match(/^\/v1\/printers\/([^/]+)$/)
  if (owned && request.method() === 'DELETE') {
    state.printers = state.printers.filter(p => p.id !== decodeURIComponent(owned[1]))
    return json(route, { ok: true })
  }
  if (state.identity && url.pathname === '/v1/me/community-identity') {
    if (request.method() === 'PATCH') {
      const body = request.postDataJSON() as { declared_age?: number, identity_public?: boolean }
      if (body.declared_age !== undefined) {
        const age = body.declared_age
        state.identity = { ...state.identity, declared_age: age, declared_at: 1_790_000_000, can_community: true, can_public: age >= 18 }
      }
      if (body.identity_public !== undefined) state.identity = { ...state.identity, identity_public: body.identity_public, revision: state.identity.revision + 1, projection_pending: true }
    }
    return json(route, state.identity)
  }
  const list = url.pathname.match(PRINTER_LIST)
  if (list && request.method() === 'GET') {
    const [, id, kind] = list
    return json(route, { [kind]: state[kind as 'shares' | 'invites' | 'links'][decodeURIComponent(id)] ?? [] })
  }
  if (state.sessions && url.pathname === '/v1/me/sessions') {
    if (request.method() === 'GET') return json(route, { sessions: state.sessions })
    if (request.method() === 'DELETE' && url.searchParams.get('scope') === 'others') {
      const ended = state.sessions.filter(s => !s.current).length
      state.sessions = state.sessions.filter(s => s.current)
      return json(route, { ok: true, ended })
    }
  }
  if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key', 'access-control-allow-methods': '*' } })
  switch (url.pathname) {
    case '/v1/me': return json(route, { account: { ...state.account, display_name: state.account.name }, endpoint_id: null })
    case '/v1/me/assertion': return json(route, { assertion: 'e2e-assertion', expires_at: Math.floor(Date.now() / 1000) + 3600 })
    case '/v1/printers': return json(route, { printers: state.printers })
    case '/v1/me/notices': return json(route, { notices: [], unread: 0, next: null })
    case '/v1/approvals': return json(route, { approvals: state.approvals })
    case '/v1/me/preferences': {
      if (!state.preferences) return route.fulfill({ status: 404, contentType: 'text/html', headers: { 'access-control-allow-origin': '*' }, body: 'Not Found' })
      if (request.method() === 'PUT') {
        const patch = request.postDataJSON() as Record<string, boolean>
        state.preferencePatches.push(patch)
        for (const [key, value] of Object.entries(patch)) if (key in state.preferences) state.preferences[key] = value
      }
      return json(route, { preferences: state.preferences })
    }
    default: return json(route, {})
  }
}

/**
 * Point the page at the fake console, signed in or not. With no saved URL a
 * page on localhost counts as served by the console, so its sign-in dialog
 * leaves for a real /authorize on the dev server mid-test.
 */
export async function useConsole (page: Page) {
  await page.addInitScript(([url]) => {
    localStorage.setItem('muon.cloud.url', url)
  }, [CONSOLE])
}

/** Signed in before the app starts: the stored session Control restores on load. */
export async function signIn (page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('muon.cloud.token', 'e2e-session')
  })
}

/**
 * The console serving this page itself, as on control.muon3d.com: Account's
 * settings only draw where the console serves Control (KAN-532 §2.1). Its API
 * is answered on the page's origin, and its silent `/authorize` says no.
 */
export async function serveConsoleHere (page: Page, state: ConsoleState, origin: string) {
  await page.route(`${origin}/v1/**`, route => answerConsole(route, state))
  await page.route(`${origin}/authorize**`, route => route.fulfill({ status: 400, contentType: 'application/json', body: '{"error":"login_required"}' }))
  await page.addInitScript(([url]) => {
    localStorage.setItem('muon.cloud.url', url)
  }, [origin])
}
