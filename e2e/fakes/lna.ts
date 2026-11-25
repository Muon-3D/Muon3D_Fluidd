/**
 * What Chromium's Local Network Access looks like to the page, for the KAN-6283 e2e.
 *
 * The page is served at an https origin the app treats as the hosted site. A real browser would ask its own
 * "local network" question for `http://<ip>`; here the page is told what the browser would be, and a request to the
 * printer's LAN address is sent to the mock printer instead (fetch, XHR and the websocket), so nothing leaves the
 * browser. Everything the page asked of a LAN-looking address is kept in `window.__lan`, whether or not it was sent on,
 * so a spec can say what was never asked.
 *
 * - `supported`: Chrome 150, permission `prompt` until `__lanGrant()` (the person answers the browser's question).
 * - `granted`: Chrome 150, already allowed.
 * - `denied`: Chrome 150, the person refused.
 * - `unsupported`: Chrome 130 with no `targetAddressSpace` (Local Network Access is not there): Safari and Firefox
 *   are the same to this page.
 *
 * `bluetooth` gives the page a `navigator.bluetooth` where the engine has none (it only needs to exist).
 */
import type { Page } from '@playwright/test'
import NodeSocket from 'ws'
import { MOCK_PORT } from '../ports'

export type LnaMode = 'supported' | 'granted' | 'denied' | 'unsupported'

export interface LanAsk { url: string, space: string | null }

/**
 * The mock printer is mid-print. A printer that is printing shows its job, not its route, so the socket says it is
 * idle: `print_stats` and `idle_timeout` wherever they appear in a reply or a notification.
 */
function idle (text: string): string {
  let body: unknown
  try { body = JSON.parse(text) } catch { return text }
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const o = node as Record<string, any>
    if (o.print_stats && typeof o.print_stats === 'object') o.print_stats = { ...o.print_stats, state: 'standby', filename: '', message: '' }
    if (o.idle_timeout && typeof o.idle_timeout === 'object') o.idle_timeout = { ...o.idle_timeout, state: 'Idle', printing_time: 0 }
    for (const v of Object.values(o)) walk(v)
  }
  walk(body)
  return JSON.stringify(body)
}

export async function lna (page: Page, mode: LnaMode, printerIp = '192.168.1.20') {
  // The mock printer is on loopback, which a public https page may not reach without the browser's own permission
  // (Chrome 142+). What the page asks of it is answered from here instead, so it never depends on that check. An
  // identity registered after this answers first. (`database: true` on usePrinter would be answered by this first: not used here.)
  if (mode !== 'unsupported') {
    await page.route(new RegExp(`^http://localhost:${MOCK_PORT}/`), async route => {
      const response = await route.fetch()
      await route.fulfill({ response, headers: { ...response.headers(), 'access-control-allow-origin': '*' } })
    })
  }
  if (mode !== 'unsupported') {
    // The page's socket to the printer's address: answered here, by the mock printer's own socket. (A page script that
    // rewrote it would reach the browser's real socket, which is the loopback check again.)
    await page.routeWebSocket(new RegExp(`^wss?://${printerIp.replace(/\./g, '\\.')}(?::80)?/websocket`), ws => {
      page.evaluate(url => (window as any).__lan.push({ url, space: null }), ws.url()).catch(() => {})
      const target = new URL(ws.url())
      const server = new NodeSocket(`ws://localhost:${MOCK_PORT}${target.pathname}${target.search}`)
      const waiting: Array<string | Buffer> = []
      server.on('open', () => { for (const m of waiting.splice(0)) server.send(m) })
      server.on('message', (data, binary) => ws.send(binary ? (data as Buffer) : idle(data.toString())))
      server.on('close', () => { ws.close().catch(() => {}) })
      server.on('error', () => { ws.close().catch(() => {}) })
      ws.onMessage(message => { if (server.readyState === NodeSocket.OPEN) server.send(message); else waiting.push(message) })
      ws.onClose(() => server.close())
    })
  }
  await page.addInitScript(({ mode, ip, port }) => {
    const w = window as any
    w.__lan = [] as Array<{ url: string, space: string | null }>
    const chrome = (major: number) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36`
    Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => chrome(mode === 'unsupported' ? 130 : 150) })
    if (mode === 'unsupported') {
      try { delete (Request.prototype as any).targetAddressSpace } catch { /* not there */ }
    }
    if (!(navigator as any).bluetooth) {
      Object.defineProperty(navigator, 'bluetooth', {
        configurable: true,
        value: { getDevices: async () => [], getAvailability: async () => true, requestDevice: async () => { throw new DOMException('cancelled', 'NotFoundError') } }
      })
    }
    let state = mode === 'denied' ? 'denied' : mode === 'supported' ? 'prompt' : 'granted'
    w.__lanGrant = () => { state = 'granted' }
    const query = navigator.permissions.query.bind(navigator.permissions)
    navigator.permissions.query = (d: PermissionDescriptor) =>
      (d as { name: string }).name === 'local-network-access' ? Promise.resolve({ state } as PermissionStatus) : query(d)

    const lanHost = /^(?:https?|wss?):\/\/(?:\d{1,3}(?:\.\d{1,3}){3}|\[[^\]]+\])(?::\d+)?(?:\/|$)/
    const ask = (url: string, space: string | null) => {
      if (lanHost.test(url)) w.__lan.push({ url, space })
    }
    const toMock = (url: string) => {
      const m = new RegExp(`^(https?|wss?)://${ip.replace(/\./g, '\\.')}(?::80)?(/.*)?$`).exec(url)
      return m ? `${m[1]}://localhost:${port}${m[2] ?? '/'}` : url
    }

    const nativeFetch = window.fetch.bind(window)
    window.fetch = ((input: RequestInfo | URL, init?: RequestInit & { targetAddressSpace?: string }) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      ask(url, init?.targetAddressSpace ?? null)
      if (init && 'targetAddressSpace' in init) {
        init = { ...init }
        delete init.targetAddressSpace
      }
      return nativeFetch(toMock(url), init)
    }) as typeof window.fetch

    const open = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: any[]) {
      ask(String(url), null)
      return (open as any).call(this, method, toMock(String(url)), ...rest)
    } as typeof open
  }, { mode, ip: printerIp, port: MOCK_PORT })
}

/** What the page asked of LAN-looking addresses so far. */
export function lanAsks (page: Page): Promise<LanAsk[]> {
  return page.evaluate(() => (window as any).__lan as LanAsk[])
}
