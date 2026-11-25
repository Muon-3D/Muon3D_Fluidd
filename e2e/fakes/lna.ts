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
import { MOCK_PORT } from '../ports'

export type LnaMode = 'supported' | 'granted' | 'denied' | 'unsupported'

export interface LanAsk { url: string, space: string | null }

export async function lna (page: Page, mode: LnaMode, printerIp = '192.168.1.20') {
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

    const NativeSocket = window.WebSocket
    window.WebSocket = class extends NativeSocket {
      constructor (url: string | URL, protocols?: string | string[]) {
        ask(String(url), null)
        super(toMock(String(url)), protocols)
      }
    } as typeof WebSocket
  }, { mode, ip: printerIp, port: MOCK_PORT })
}

/** What the page asked of LAN-looking addresses so far. */
export function lanAsks (page: Page): Promise<LanAsk[]> {
  return page.evaluate(() => (window as any).__lan as LanAsk[])
}
