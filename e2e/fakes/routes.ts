/**
 * Every route to one printer for e2e tests (KAN-2080): the local network, the
 * Muon3D relay, and Bluetooth, all reaching the same mock printer.
 *
 * Only the edges are faked:
 * - the radio: `navigator.bluetooth` hands out one fake M1 whose GATT link
 *   echoes each segment back on TX, as a live QUIC path does with its
 *   keep-alives;
 * - the wasm client: the page loads this module in place of
 *   `muon_link_web.js`. A printer pinned to Bluetooth with a link up is
 *   reached "over Bluetooth", otherwise over the relay, and each request and
 *   websocket goes to the mock printer;
 * - the console: the account lists the printer and grants access.
 *
 * Control's own code does the rest: the route choice, the Bluetooth link and
 * its silence check, the managed transport, the sheet.
 *
 * Controls, in the page (`window.__e2eRoute`):
 * - `silence(on)`: the radio stays up, nothing comes over it (the bench, 12 Nov:
 *   Chrome dropped the TX subscription ~580 s in);
 * - `radio(on)`: Bluetooth off (the link drops) or back on;
 * - `cloud(on)`: the relay reachable or not (off also cuts live relay sessions);
 * - counts: `dials` (sessions opened), `routes` (each session's route),
 *   `closes`, `refused`.
 */
import type { Page } from '@playwright/test'
import { CONSOLE, type ConsoleState } from './console'
import { MOCK_PORT } from '../ports'

/** A 64-hex EndpointId, as the printer's INFO and the account both name it. */
export const ROUTE_PRINTER = { id: '3fa9c0de'.repeat(8), name: 'Boxwood 367a' }

const RELAY = 'https://relay.e2e.test'

/** What the gateway says to a session the printer's permission list does not allow (CONTRACT-perms). */
export const PERMISSION_REFUSAL = {
  detail: {
    code: 'permission_restricted',
    knob: 'plate_clear',
    required: 'owner',
    allowed: 'only the owner',
    message: 'Only the owner can confirm the plate is clear on this printer.'
  }
}

function fakeClient (printer: string, id: string): string {
  return `
const PRINTER = ${JSON.stringify(printer)}
const ID = ${JSON.stringify(id)}
const S = () => window.__e2eRoute
const text = s => new TextEncoder().encode(s)
const REFUSAL = ${JSON.stringify(JSON.stringify(PERMISSION_REFUSAL))}

export default async function init () {}

class Socket {
  constructor (path, owner) {
    this.owner = owner
    this.queue = []
    this.waiting = []
    this.ws = new WebSocket(PRINTER.replace(/^http/, 'ws') + path)
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
      if (msg.method === 'machine.update.status') {
        S().refused.push('RPC ' + msg.method)
        this.push(JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: 403, message: 'muon-link policy refused this request: not on the remote allowlist' } }))
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
  constructor (id, route) {
    this.id = id
    this.route = route
    this.sockets = new Set()
    S().live.add(this)
  }
  printerId () { return this.id }
  comparison () { return 'E2E TST' }
  async fetch (method, path, headers, body) {
    if (this.dead) throw new Error('connection lost')
    const bare = decodeURIComponent(path.split('?')[0])
    if (bare === '/muon-link/plate/clear') {
      S().refused.push(method + ' ' + bare)
      return { status: 403, headers: ['content-type', 'application/json'], body: text(REFUSAL) }
    }
    const h = new Headers()
    for (let i = 0; i + 1 < headers.length; i += 2) h.append(headers[i], headers[i + 1])
    const answer = await fetch(PRINTER + path, { method, headers: h, body: method === 'GET' || method === 'HEAD' || !body.length ? undefined : body })
    const out = []
    answer.headers.forEach((v, k) => out.push(k, v))
    return { status: answer.status, headers: out, body: new Uint8Array(await answer.arrayBuffer()) }
  }
  async openWebSocket (path) {
    if (this.dead) throw new Error('connection lost')
    const socket = new Socket(path, this)
    this.sockets.add(socket)
    await socket.open
    return socket
  }
  /** The path under this session went away. */
  cut () {
    this.dead = true
    for (const s of this.sockets) s.ws.close()
  }
  close () {
    if (this.closed) return
    this.closed = true
    S().closes++
    S().live.delete(this)
    for (const s of this.sockets) s.ws.close()
  }
}

class Link {
  constructor () {
    this.closed = false
    this.waiters = []
    // QUIC's keep-alive: a segment to send every 2 s while the path is live.
    this.timer = setInterval(() => { if (!S().silent) this.wake() }, 2000)
    S().links.add(this)
  }
  wake () { const w = this.waiters.shift(); if (w) w() }
  async connected () { return ID }
  async nextSegment () {
    if (this.closed) return undefined
    await new Promise(resolve => this.waiters.push(resolve))
    return this.closed ? undefined : new Uint8Array([0x4b])
  }
  onSegment () { S().heard++ }
  retryHandshake () { return true }
  isClosed () { return this.closed }
  onDisconnected () { this.close() }
  close () {
    if (this.closed) return
    this.closed = true
    clearInterval(this.timer)
    S().links.delete(this)
    this.waiters.splice(0).forEach(w => w())
  }
}

class Endpoint {
  constructor () { this.pinned = new Set() }
  endpointId () { return 'e2ebrowserendpoint' }
  secretKey () { return new Uint8Array(32).fill(7) }
  pinBluetooth (id, on) {
    if (on) this.pinned.add(id.toLowerCase())
    else this.pinned.delete(id.toLowerCase())
  }
  addLink () { return new Link() }
  async connect (id) {
    const s = S()
    s.dials++
    const ble = this.pinned.has(id.toLowerCase()) && s.links.size > 0
    if (!ble && !s.cloudUp) throw new Error('No path to the printer: the relay is unreachable')
    const route = ble ? 'ble' : 'cloud'
    s.routes.push(route)
    return new Printer(id, route)
  }
  async close () {}
}

export const MuonEndpoint = { async create () { return new Endpoint() } }
`
}

/**
 * The printer is on the account, online through Muon3D, and this browser can
 * pick it over Bluetooth. It is not on this page's network until
 * `reachOnLan` says so.
 */
export async function useAllRoutes (page: Page, account: ConsoleState) {
  // Nothing here is about the 3D model, and the overview behind a sheet or a menu draws it all the time: on software
  // GL (a CI runner, headless Chromium) that keeps the page's main thread busy for seconds at a time, so a sliding
  // sheet is never still, a click is never "stable", and the page answers a request seconds late (measured 14 Nov,
  // KAN-2487: page.evaluate took 0.4 to 5 s and long tasks filled 90% of the time with the model; 7 ms and none
  // without). With no WebGL the stage draws its fallback, as in jack-1110.spec.ts.
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext as (this: HTMLCanvasElement, type: string, ...rest: unknown[]) => unknown
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return /webgl/i.test(type) ? null : getContext.call(this, type, ...rest)
    } as typeof HTMLCanvasElement.prototype.getContext
  })
  const now = Math.floor(Date.now() / 1000)
  account.printers = [{ ...ROUTE_PRINTER, model: 'M1', state: 'ready', version: '1.0.0', linked_at: 1_700_000_000, last_seen: now, online: true, online_since: 1_700_000_000, role: 'operator' }]
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key', 'access-control-allow-methods': '*' }
  const json = (body: unknown) => ({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) })
  await page.route(`${CONSOLE}/v1/config`, route => route.fulfill(json({ relay_url: RELAY, orchestrator_id: 'e2e', authority_key: 'e2e' })))
  await page.route(`${CONSOLE}/v1/printers/*/access`, route => route.request().method() === 'OPTIONS'
    ? route.fulfill({ status: 204, headers })
    : route.fulfill(json({ printer_id: ROUTE_PRINTER.id, relay_url: RELAY, role: 'operator', grant_id: 'e2e-grant', expires_at: Math.floor(Date.now() / 1000) + 3600 })))
  await page.route(/muon_link_web\.js(\?.*)?$/, route => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: fakeClient(`http://localhost:${MOCK_PORT}`, ROUTE_PRINTER.id)
  }))
  // The LAN sweep (discovery.ts) asks hundreds of private addresses; on a CI runner nothing answers them, so each
  // is a connection attempt that hangs until the page gives up, all through the browser's one socket pool, in
  // which the page's own requests to the mock printer queue (KAN-2703). Nothing here is on those networks: the
  // request is held and then refused in Playwright, as a silent address would, and never leaves the browser.
  await page.route(/^http:\/\/(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/, route => {
    setTimeout(() => { route.abort('timedout').catch(() => {}) }, 3_500)
  })
  // No address for the printer: it is found on this network only when a test says so.
  await page.route('**/config.json', async route => {
    const response = await route.fetch()
    const config = await response.json()
    config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
    config.endpoints = []
    await route.fulfill({ response, json: config })
  })
  await page.addInitScript(([id]) => {
    const state: any = {
      silent: false,
      radioOn: true,
      cloudUp: true,
      dials: 0,
      closes: 0,
      heard: 0,
      routes: [] as string[],
      refused: [] as string[],
      links: new Set(),
      live: new Set(),
      chooserAsks: 0
    }
    ;(window as any).__e2eRoute = state

    const bt: any = new EventTarget()
    const device: any = new EventTarget()
    device.id = 'e2e-boxwood'
    device.name = 'muon-boxwood-367a'
    device.watchAdvertisements = async () => {}
    let connected = false
    const tx: any = new EventTarget()
    tx.value = null
    tx.startNotifications = async () => tx
    const info = () => {
      const bytes = new Uint8Array(38)
      bytes[0] = 1
      bytes[4] = 182
      for (let i = 0; i < 32; i++) bytes[6 + i] = parseInt(id.slice(i * 2, i * 2 + 2), 16)
      return new DataView(bytes.buffer)
    }
    const rx = {
      properties: { writeWithoutResponse: true },
      readValue: async () => new DataView(new ArrayBuffer(0)),
      writeValueWithoutResponse: async (segment: BufferSource) => {
        if (!connected) throw new DOMException('GATT Server is disconnected.', 'NetworkError')
        if (state.silent) return
        // The printer's side of a live path answers.
        setTimeout(() => {
          if (!connected || state.silent) return
          const bytes = new Uint8Array(segment as ArrayBuffer)
          tx.value = new DataView(bytes.slice().buffer)
          tx.dispatchEvent(new Event('characteristicvaluechanged'))
        }, 5)
      }
    }
    device.gatt = {
      get connected () { return connected },
      connect: async () => {
        if (!state.radioOn) throw new DOMException('Bluetooth adapter not available.', 'NetworkError')
        connected = true
        return device.gatt
      },
      disconnect: () => {
        if (!connected) return
        connected = false
        device.dispatchEvent(new Event('gattserverdisconnected'))
      },
      getPrimaryService: async () => ({
        getCharacteristic: async (uuid: string) => {
          // MUON_BLE_TX, MUON_BLE_INFO and MUON_BLE_RX end b7fc, b7fa and b7fb.
          if (uuid.endsWith('b7fc')) return tx
          if (uuid.endsWith('b7fa')) return { readValue: async () => info() }
          return rx
        }
      })
    }
    let picked = false
    bt.requestDevice = async () => { state.chooserAsks++; picked = true; return device }
    bt.getDevices = async () => picked ? [device] : []
    bt.getAvailability = async () => state.radioOn
    Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: bt })

    state.device = device
    state.tx = tx
    state.rx = rx
    state.silence = (on: boolean) => { state.silent = on }
    state.radio = (on: boolean) => {
      state.radioOn = on
      if (!on) device.gatt.disconnect()
      const event: any = new Event('availabilitychanged')
      event.value = on
      bt.dispatchEvent(event)
    }
    state.cloud = (on: boolean) => {
      state.cloudUp = on
      if (!on) for (const p of state.live) if (p.route === 'cloud') p.cut()
    }
  }, [ROUTE_PRINTER.id])
}

/** The printer answers on this page's network (the mock printer's own address). */
export async function reachOnLan (page: Page, on = true) {
  await page.evaluate(async ([port, id, name, on]) => {
    const discovery = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'discovery.ts'].join('/'))
    const state = discovery.discoveryState
    // A sweep that is running (an open phone sheet starts one) ends by replacing the list: let it end first.
    for (let i = 0; i < 300 && state.scanning; i++) await new Promise(resolve => setTimeout(resolve, 100))
    state.found = on
      ? [{ host: `localhost:${port}`, aliases: [`localhost:${port}`], apiUrl: `http://localhost:${port}`, name, endpointId: id }]
      : []
    // Fresh: no sweep replaces the list while the test runs.
    state.finishedAt = Date.now()
  }, [MOCK_PORT, ROUTE_PRINTER.id, ROUTE_PRINTER.name, on] as const)
}

export interface RouteCounts {
  dials: number;
  closes: number;
  routes: string[];
  refused: string[];
}

export function routeCounts (page: Page): Promise<RouteCounts> {
  return page.evaluate(() => {
    const s = (window as any).__e2eRoute
    return { dials: s.dials, closes: s.closes, routes: [...s.routes], refused: [...s.refused] }
  })
}
