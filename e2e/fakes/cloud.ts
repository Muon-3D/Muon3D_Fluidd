/**
 * The cloud route for e2e tests: the same mock printer, reached the way
 * control.muon3d.com reaches it, through Muon3D (the console's grant, then
 * muon-link over Iroh) instead of by its address.
 *
 * Only the wasm client is faked. The page loads `muon_link_web.js`, so this
 * serves a module with the same `MuonEndpoint` that carries each request and
 * the websocket to the mock printer, and refuses what the printer's gateway
 * refuses every session (muon-link `ABSOLUTE_DENY`: the Aux API, `/access/`,
 * the Klippy socket), in the gateway's own words. Everything above it is
 * Control's real code: the console grant, the managed transport, axios bound
 * to it, the socket client adopting the gateway's websocket.
 *
 *   await useCloudRoute(page, account)
 *   await open('/control')   // the same /boxwood-367a pages, over Muon3D
 */
import type { Page } from '@playwright/test'
import { CONSOLE, type ConsoleState } from './console'
import { MOCK_PORT } from '../ports'

/** The mock printer's id in the account: its name makes the same page address as the local route. */
export const CLOUD_PRINTER = { id: 'mockendpointboxwood367a', name: 'Boxwood 367a' }

export interface CloudRoute {
  /** Every request the page sent through the gateway, "METHOD /path". */
  requests: string[];
  /** The gateway's refusals, "METHOD /path". */
  refused: string[];
}

const RELAY = 'https://relay.e2e.test'

/** The module the page loads in place of muon-link-web, dialling the mock at `printer`. */
function fakeClient (printer: string): string {
  return `
const PRINTER = ${JSON.stringify(printer)}
const DENY = [/^\\/server\\/aux(\\/|$)/i, /^\\/access(\\/|$)/i, /^\\/klippysocket$/i, /^\\/machine\\/sudo\\//i, /^\\/debug\\//i]
const RPC_DENY = [/^server\\.aux\\./i, /^access\\./i]
const note = (kind, line) => { try { window.__e2eCloud?.(kind, line) } catch {} }
const text = s => new TextEncoder().encode(s)

export default async function init () {}

class Socket {
  constructor (path) {
    this.queue = []
    this.waiting = []
    this.ws = new WebSocket(PRINTER.replace(/^http/, 'ws') + path + (path.includes('?') ? '&' : '?') + 'route=muon-link')
    this.open = new Promise((resolve, reject) => {
      this.ws.onopen = resolve
      this.ws.onerror = () => reject(new Error('the gateway closed the websocket'))
    })
    this.ws.onmessage = e => this.push(e.data)
    this.ws.onclose = () => { this.closed = true; this.push(null) }
  }
  push (item) {
    const next = this.waiting.shift()
    if (next) next(item)
    else this.queue.push(item)
  }
  async send (data) {
    await this.open
    try {
      const msg = JSON.parse(data)
      if (msg.method && RPC_DENY.some(r => r.test(msg.method))) {
        note('refused', 'RPC ' + msg.method)
        this.push(JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: -32001, message: 'muon-link policy refused \`' + msg.method + '\`: denied for every role' } }))
        return
      }
    } catch {}
    this.ws.send(data)
  }
  next () {
    if (this.queue.length) return Promise.resolve(this.queue.shift())
    if (this.closed) return Promise.resolve(null)
    return new Promise(resolve => this.waiting.push(resolve))
  }
  async close () { this.ws.close() }
}

class Printer {
  constructor (id) { this.id = id }
  printerId () { return this.id }
  comparison () { return 'E2E TST' }
  async fetch (method, path, headers, body) {
    note('request', method + ' ' + path.split('?')[0])
    const bare = decodeURIComponent(path.split('?')[0])
    if (DENY.some(r => r.test(bare))) {
      note('refused', method + ' ' + bare)
      return { status: 403, headers: ['content-type', 'application/json'], body: text(JSON.stringify({ error: 'muon-link policy refused this request: denied for every role' })) }
    }
    const h = new Headers()
    for (let i = 0; i + 1 < headers.length; i += 2) h.append(headers[i], headers[i + 1])
    const answer = await fetch(PRINTER + path, { method, headers: h, body: method === 'GET' || method === 'HEAD' || !body.length ? undefined : body })
    const out = []
    answer.headers.forEach((v, k) => out.push(k, v))
    return { status: answer.status, headers: out, body: new Uint8Array(await answer.arrayBuffer()) }
  }
  async openWebSocket (path) {
    note('request', 'GET ' + path)
    const socket = new Socket(path)
    await socket.open
    return socket
  }
  close () {}
}

class Endpoint {
  endpointId () { return 'e2ebrowserendpoint' }
  secretKey () { return new Uint8Array(32).fill(7) }
  async connect (id) { return new Printer(id) }
  async close () {}
}

export const MuonEndpoint = { async create () { return new Endpoint() } }
`
}

/**
 * This page reaches the mock printer only through Muon3D: the account lists
 * it, the console grants access, and no printer address is known, so there
 * is no local route to fall back on.
 */
export async function useCloudRoute (page: Page, account: ConsoleState, role: 'operator' | 'viewer' = 'operator'): Promise<CloudRoute> {
  const seen: CloudRoute = { requests: [], refused: [] }
  await page.exposeFunction('__e2eCloud', (kind: 'request' | 'refused', line: string) => {
    (kind === 'request' ? seen.requests : seen.refused).push(line)
  })
  const now = Math.floor(Date.now() / 1000)
  account.printers = [{ ...CLOUD_PRINTER, model: 'M1', state: 'ready', version: '1.0.0', linked_at: 1_700_000_000, last_seen: now, online: true, online_since: 1_700_000_000, role }]
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key', 'access-control-allow-methods': '*' }
  const json = (body: unknown) => ({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) })
  await page.route(`${CONSOLE}/v1/config`, route => route.fulfill(json({ relay_url: RELAY, orchestrator_id: 'e2e', authority_key: 'e2e' })))
  await page.route(`${CONSOLE}/v1/printers/*/access`, route => route.request().method() === 'OPTIONS'
    ? route.fulfill({ status: 204, headers })
    : route.fulfill(json({ printer_id: CLOUD_PRINTER.id, relay_url: RELAY, role, grant_id: 'e2e-grant', expires_at: Math.floor(Date.now() / 1000) + 3600 })))
  await page.route(/muon_link_web\.js(\?.*)?$/, route => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: fakeClient(`http://localhost:${MOCK_PORT}`)
  }))
  // No address for the printer: config.json names none, so nothing is found on the network.
  await page.route('**/config.json', async route => {
    const response = await route.fetch()
    const config = await response.json()
    config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
    config.endpoints = []
    await route.fulfill({ response, json: config })
  })
  return seen
}
