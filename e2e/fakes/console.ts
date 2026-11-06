/**
 * A fake console (the Muon3D account service) for e2e tests: one signed-in
 * account, its linked printers, and the assertion the model service takes.
 * Control finds the console at the address saved under `muon.cloud.url`, so a
 * test points it here before the app starts (useConsole below, every test).
 */
import type { Page, Route } from '@playwright/test'

export const CONSOLE = 'https://console.e2e.test'

export interface ConsoleState {
  account: { id: string, email: string, name: string };
  printers: Array<{ id: string, name: string, model: string, state: string }>;
  seen: string[];
  /** Agents on the account's printers (KAN-1359); undefined: a console without them (404). */
  agents?: AgentsFake;
}

export interface AgentEvent { id: number, event: string, data: unknown }

export interface AgentsFake {
  /** `GET /v1/agents` → `connections`. */
  connections: Array<Record<string, unknown>>;
  /** The stream: each connection gets those after its `Last-Event-ID`, then a ping, then ends. */
  events: AgentEvent[];
  /** Ids it holds no longer: a `Last-Event-ID` below this gets `event: reset`. */
  oldest: number;
  /** The `Last-Event-ID` each stream connection sent ('' for none). */
  lastEventIds: string[];
  /** `POST /v1/agents/{id}/revoke`, in order. */
  revoked: string[];
  /** The newest id the last answer covered: a reconnect with no id carries on from it, as if held open. */
  cursor?: number;
}

export function agentsFake (over: Partial<AgentsFake> = {}): AgentsFake {
  return { connections: [], events: [], oldest: 0, lastEventIds: [], revoked: [], ...over }
}

/** Add an event to the stream, numbered after the last. */
export function pushAgentEvent (agents: AgentsFake, event: string, data: unknown): number {
  const id = (agents.events[agents.events.length - 1]?.id ?? agents.oldest) + 1
  agents.events.push({ id, event, data })
  return id
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key, last-event-id' }

/**
 * One stream connection: `route.fulfill` can't hold a body open, so each
 * answer ends after what's due and Control reconnects with its last id, as
 * it does when the console drops it.
 */
function agentStream (route: Route, agents: AgentsFake) {
  const header = route.request().headers()['last-event-id'] ?? ''
  agents.lastEventIds.push(header)
  const last = header === '' ? null : Number(header)
  const newest = agents.events[agents.events.length - 1]?.id ?? agents.oldest
  let body = ''
  let from = last ?? agents.cursor ?? newest
  agents.cursor = newest
  if (last !== null && last < agents.oldest) {
    body += `id: ${newest}\nevent: reset\ndata: {"v":1}\n\n`
    from = newest
  }
  for (const e of agents.events) {
    if (e.id > from) body += `id: ${e.id}\nevent: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`
  }
  body += ': ping\n\n'
  return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'text/event-stream', 'cache-control': 'no-store' }, body })
}

export function consoleState (over: Partial<ConsoleState> = {}): ConsoleState {
  return {
    account: { id: 'acct-e2e', email: 'jack@example.test', name: 'Jack' },
    printers: [],
    seen: [],
    ...over
  }
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key' }, body: JSON.stringify(body) })

export async function serveConsole (page: Page, state: ConsoleState) {
  await page.route(`${CONSOLE}/**`, consoleRoute(state))
}

/** The fake console's answers, for `page.route` (also at Control's own origin, where the console serves it). */
export function consoleRoute (state: ConsoleState) {
  return async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    state.seen.push(`${request.method()} ${url.pathname}`)
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { ...CORS, 'access-control-allow-methods': '*' } })
    const agents = state.agents
    const revoke = url.pathname.match(/^\/v1\/agents\/([^/]+)\/revoke$/)
    if (url.pathname.startsWith('/v1/agents')) {
      if (!agents) return json(route, {}, 404)
      if (url.pathname === '/v1/agents/events') return agentStream(route, agents)
      if (url.pathname === '/v1/agents') return json(route, { connections: agents.connections })
      if (revoke && request.method() === 'POST') {
        const id = decodeURIComponent(revoke[1])
        agents.revoked.push(id)
        const row = agents.connections.find(c => (c.agent as { id?: string } | null)?.id === id)
        if (!row) return json(route, { error: 'no such agent' }, 404)
        row.status = 'revoked'
        pushAgentEvent(agents, 'agent.revoked', { v: 1, at: new Date().toISOString(), agent: row.agent, printers: row.printers })
        return route.fulfill({ status: 204, headers: CORS })
      }
      return json(route, { error: 'not found' }, 404)
    }
    switch (url.pathname) {
      case '/v1/me': return json(route, { account: { ...state.account, display_name: state.account.name }, endpoint_id: null })
      case '/v1/me/assertion': return json(route, { assertion: 'e2e-assertion', expires_at: Math.floor(Date.now() / 1000) + 3600 })
      case '/v1/printers': return json(route, { printers: state.printers })
      case '/v1/me/notices': return json(route, { notices: [], unread: 0, next: null })
      default: return json(route, {})
    }
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
