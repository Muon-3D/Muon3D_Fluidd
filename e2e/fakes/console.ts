/**
 * A fake console (the Muon3D account service) for e2e tests: one signed-in
 * account, its linked printers, and the assertion the model service takes.
 * Control finds the console at the address saved under `muon.cloud.url`, so a
 * test points it here before the app starts (signIn below).
 */
import type { Page, Route } from '@playwright/test'

export const CONSOLE = 'https://console.e2e.test'

export interface ConsoleState {
  account: { id: string, email: string, name: string };
  printers: Array<{ id: string, name: string, model: string, state: string }>;
  seen: string[];
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
  await page.route(`${CONSOLE}/**`, async route => {
    const request = route.request()
    const url = new URL(request.url())
    state.seen.push(`${request.method()} ${url.pathname}`)
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key', 'access-control-allow-methods': '*' } })
    switch (url.pathname) {
      case '/v1/me': return json(route, { account: { ...state.account, display_name: state.account.name }, endpoint_id: null })
      case '/v1/me/assertion': return json(route, { assertion: 'e2e-assertion', expires_at: Math.floor(Date.now() / 1000) + 3600 })
      case '/v1/printers': return json(route, { printers: state.printers })
      case '/v1/me/notices': return json(route, { notices: [], unread: 0, next: null })
      default: return json(route, {})
    }
  })
}

/** Signed in before the app starts: the stored session Control restores on load. */
export async function signIn (page: Page) {
  await page.addInitScript(([url]) => {
    localStorage.setItem('muon.cloud.url', url)
    localStorage.setItem('muon.cloud.token', 'e2e-session')
  }, [CONSOLE])
}
