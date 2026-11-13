/**
 * One printer reached over the relay and over Bluetooth, with iroh's memory of
 * the relay path, for the KAN-2531 e2e: an explicit Bluetooth connect shortly
 * after a cloud session must not land on the relay.
 *
 * Only the edges are faked, as in the other route e2e:
 * - the radio: `navigator.bluetooth` hands out one fake M1. Its GATT link
 *   answers each segment the page writes only while a session really runs over
 *   Bluetooth, as a live QUIC path does;
 * - muon-link-web: the page loads this module in place of `muon_link_web.js`.
 *   Each endpoint it binds remembers the printers it reached over the relay.
 *   A pinned dial on an endpoint with that memory lands on the relay (the relay
 *   copy of the first packets wins, the bench on 13 Nov); on a fresh endpoint,
 *   with a Bluetooth link up, it lands on Bluetooth. Every request and websocket
 *   goes to the mock printer;
 * - the console: the account lists the printer and grants access.
 *
 * In the page, `window.__e2eRebind`:
 * - `events`: what the client was asked, in order: `bind#1`, `connect#1 cloud`,
 *   `close#1`, `bind#2`, `addLink#2`, `connect#2 ble`;
 * - `relayWins(on)`: the relay answers first whatever the endpoint remembers.
 */
import type { Page } from '@playwright/test'
import { CONSOLE, type ConsoleState } from './console'
import { MOCK_PORT } from '../ports'

/** A 64-hex EndpointId, as the printer's INFO and the account both name it. */
export const REBIND_PRINTER = { id: '3fa9c0de'.repeat(8), name: 'Boxwood 367a' }

const RELAY = 'https://relay.e2e.test'

function fakeClient (printer: string, id: string): string {
  return `
const PRINTER = ${JSON.stringify(printer)}
const ID = ${JSON.stringify(id)}
const S = () => window.__e2eRebind
const log = line => S().events.push(line)

export default async function init () {}

class Socket {
  constructor (path) {
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
  async send (data) { await this.open; this.ws.send(data) }
  next () {
    if (this.queue.length) return Promise.resolve(this.queue.shift())
    if (this.closed) return Promise.resolve(null)
    return new Promise(resolve => this.waiting.push(resolve))
  }
  async close () { this.ws.close() }
}

class Printer {
  constructor (id, route, endpoint) {
    this.id = id
    this.route = route
    this.endpoint = endpoint
    this.sockets = new Set()
    if (route === 'ble') S().bleLive++
  }
  printerId () { return this.id }
  comparison () { return 'E2E TST' }
  async fetch (method, path, headers, body) {
    if (this.endpoint.closed) throw new Error('connection lost')
    const h = new Headers()
    for (let i = 0; i + 1 < headers.length; i += 2) h.append(headers[i], headers[i + 1])
    const answer = await fetch(PRINTER + path, { method, headers: h, body: method === 'GET' || method === 'HEAD' || !body.length ? undefined : body })
    const out = []
    answer.headers.forEach((v, k) => out.push(k, v))
    return { status: answer.status, headers: out, body: new Uint8Array(await answer.arrayBuffer()) }
  }
  async openWebSocket (path) {
    if (this.endpoint.closed) throw new Error('connection lost')
    const socket = new Socket(path)
    this.sockets.add(socket)
    await socket.open
    return socket
  }
  close () {
    if (this.shut) return
    this.shut = true
    if (this.route === 'ble') S().bleLive--
    for (const s of this.sockets) s.ws.close()
  }
}

class Link {
  constructor () {
    this.closed = false
    this.waiters = []
    // QUIC's keep-alive: a segment to send every 2 s.
    this.timer = setInterval(() => this.wake(), 2000)
    S().links++
  }
  wake () { const w = this.waiters.shift(); if (w) w() }
  async connected () { return ID }
  async nextSegment () {
    if (this.closed) return undefined
    await new Promise(resolve => this.waiters.push(resolve))
    return this.closed ? undefined : new Uint8Array([0x4b])
  }
  onSegment () {}
  retryHandshake () { return true }
  isClosed () { return this.closed }
  onDisconnected () { this.close() }
  close () {
    if (this.closed) return
    this.closed = true
    clearInterval(this.timer)
    S().links--
    this.waiters.splice(0).forEach(w => w())
  }
}

let bound = 0

class Endpoint {
  constructor () {
    this.n = ++bound
    this.pinned = new Set()
    this.relayMemory = new Set()
    this.links = []
    this.closed = false
    log('bind#' + this.n)
  }
  endpointId () { return 'e2ebrowserendpoint' }
  secretKey () { return new Uint8Array(32).fill(7) }
  pinBluetooth (id, on) {
    if (on) this.pinned.add(id.toLowerCase())
    else this.pinned.delete(id.toLowerCase())
  }
  addLink () {
    log('addLink#' + this.n)
    const link = new Link()
    this.links.push(link)
    return link
  }
  async connect (id) {
    if (this.closed) throw new Error('the endpoint is closed')
    const key = id.toLowerCase()
    const linkUp = this.links.some(l => !l.closed)
    const onBle = this.pinned.has(key) && linkUp && !this.relayMemory.has(key) && !S().relayAlwaysWins
    if (!onBle) this.relayMemory.add(key)
    const route = onBle ? 'ble' : 'cloud'
    log('connect#' + this.n + ' ' + route)
    return new Printer(id, route, this)
  }
  async close () {
    if (this.closed) return
    this.closed = true
    log('close#' + this.n)
    for (const l of this.links) l.close()
  }
}

export const MuonEndpoint = { async create () { return new Endpoint() } }
`
}

/** The printer is on the account, online through Muon3D, and this browser can pick it over Bluetooth. */
export async function useRebindRoutes (page: Page, account: ConsoleState) {
  const now = Math.floor(Date.now() / 1000)
  account.printers = [{ ...REBIND_PRINTER, model: 'M1', state: 'ready', version: '1.0.0', linked_at: 1_700_000_000, last_seen: now, online: true, online_since: 1_700_000_000, role: 'operator' }]
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key', 'access-control-allow-methods': '*' }
  const json = (body: unknown) => ({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) })
  await page.route(`${CONSOLE}/v1/config`, route => route.fulfill(json({ relay_url: RELAY, orchestrator_id: 'e2e', authority_key: 'e2e' })))
  await page.route(`${CONSOLE}/v1/printers/*/access`, route => route.request().method() === 'OPTIONS'
    ? route.fulfill({ status: 204, headers })
    : route.fulfill(json({ printer_id: REBIND_PRINTER.id, relay_url: RELAY, role: 'operator', grant_id: 'e2e-grant', expires_at: Math.floor(Date.now() / 1000) + 3600 })))
  await page.route(/muon_link_web\.js(\?.*)?$/, route => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: fakeClient(`http://localhost:${MOCK_PORT}`, REBIND_PRINTER.id)
  }))
  // No address for the printer: it is reached only through the relay or Bluetooth.
  await page.route('**/config.json', async route => {
    const response = await route.fetch()
    const config = await response.json()
    config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
    config.endpoints = []
    await route.fulfill({ response, json: config })
  })
  await page.addInitScript(([id]) => {
    const state: any = { events: [] as string[], links: 0, bleLive: 0, relayAlwaysWins: false }
    ;(window as any).__e2eRebind = state
    state.relayWins = (on: boolean) => { state.relayAlwaysWins = on }

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
        // The printer speaks over the radio only while a session runs over it.
        setTimeout(() => {
          if (!connected || state.bleLive <= 0) return
          const bytes = new Uint8Array(segment as ArrayBuffer)
          tx.value = new DataView(bytes.slice().buffer)
          tx.dispatchEvent(new Event('characteristicvaluechanged'))
        }, 5)
      }
    }
    device.gatt = {
      get connected () { return connected },
      connect: async () => { connected = true; return device.gatt },
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
    bt.requestDevice = async () => { picked = true; return device }
    bt.getDevices = async () => picked ? [device] : []
    bt.getAvailability = async () => true
    Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: bt })
  }, [REBIND_PRINTER.id])
}

export function rebindEvents (page: Page): Promise<string[]> {
  return page.evaluate(() => [...(window as any).__e2eRebind.events])
}
