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
  account: { id: string, email: string, name: string };
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
  const list = url.pathname.match(PRINTER_LIST)
  if (list && request.method() === 'GET') {
    const [, id, kind] = list
    return json(route, { [kind]: state[kind as 'shares' | 'invites' | 'links'][decodeURIComponent(id)] ?? [] })
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
