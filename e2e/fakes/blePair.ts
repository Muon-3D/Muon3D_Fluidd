/**
 * Printers nearby over Bluetooth, for the signed-out pairing e2e (KAN-2123,
 * Jack 11 Nov: "No Bluetooth pair option when NOT signed in ... Must allow
 * pairing new printers, signed out too").
 *
 * Only the edges are faked, as in the other route fakes:
 * - the radio: `navigator.bluetooth` offers one printer, the one the test
 *   names; its GATT link answers each segment while a session really runs
 *   over Bluetooth;
 * - muon-link-web: the page loads this module in place of `muon_link_web.js`.
 *   A printer that is NEW answers its setup state. One that is set up
 *   refuses a key it does not know (NET-17 `unauthorised`) until the panel
 *   ceremony has run for it; one this browser is already paired with is
 *   reached, and its requests go to the mock printer;
 * - the console answers only `/v1/config` (the relay's address). There is no
 *   account: nobody is signed in.
 *
 * In the page, `window.__e2ePair`:
 * - `events`: what the client was asked, in order (`connect <name>`,
 *   `refused <name>`, `beginPairing <name>`, `submitCode <digits>`, `paired <name>`);
 * - `paired`: the EndpointIds the printer holds a key for.
 */
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { CONSOLE } from './console'
import { MOCK_PORT } from '../ports'

export type Kind = 'new' | 'paired' | 'set-up'
/** What the printer's `GET /pairing` says (D-166). Left out, as an older printer does, it reads as protected. */
export type Entry = 'open' | 'protected'
export interface NearbyFake { id: string, advertised: string, kind: Kind, entry?: Entry }

/** A printer nobody has set up: Control can set it up over Bluetooth. */
export const NEW_PRINTER: NearbyFake = { id: 'a1b2c3d4'.repeat(8), advertised: 'muon-hazel-1111', kind: 'new' }
/** Set up, and this browser was paired with it before: it lets this browser in. */
export const PAIRED_BEFORE: NearbyFake = { id: '3fa9c0de'.repeat(8), advertised: 'muon-boxwood-367a', kind: 'paired' }
/** Set up, and this browser was never paired with it: it refuses until its panel pairs this browser. */
export const NOT_PAIRED_HERE: NearbyFake = { id: '9b1e44a0'.repeat(8), advertised: 'muon-sloe-5522', kind: 'set-up' }
/** Set up and Open (D-166): any browser is admitted over Bluetooth as an Operator guest, with no code and no prompt. */
export const OPEN_PRINTER: NearbyFake = { id: '5c7d1e22'.repeat(8), advertised: 'muon-alder-6601', kind: 'set-up', entry: 'open' }
/** Set up and locked down: a stranger is refused and needs the code. */
export const PROTECTED_PRINTER: NearbyFake = { id: '6d8e2f33'.repeat(8), advertised: 'muon-birch-7702', kind: 'set-up', entry: 'protected' }
export const PRINTERS = [NEW_PRINTER, PAIRED_BEFORE, NOT_PAIRED_HERE, OPEN_PRINTER, PROTECTED_PRINTER]
/** What the person types: the eight digits the printer's panel shows. */
export const PANEL_CODE = '12345678'
/** The six characters both screens show. */
export const COMPARE = 'F6QTDH'

const RELAY = 'https://relay.e2e.test'

const SETUP_STATE = readFileSync(new URL('../../src/services/muon-setup/__tests__/fixtures/state.01-new.json', import.meta.url), 'utf8')

function fakeClient (printer: string): string {
  return `
const PRINTER = ${JSON.stringify(printer)}
const SETUP_STATE = ${SETUP_STATE}
const COMPARE = ${JSON.stringify(COMPARE)}
const PANEL_CODE = ${JSON.stringify(PANEL_CODE)}
const S = () => window.__e2ePair
const POLICY = 'muon-link policy refused this request: not on the remote allowlist; unlisted endpoints are Owner-only by default'
const log = line => S().events.push(line)
const nameOf = id => S().printers.find(p => p.id === id)?.advertised ?? id

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
  async send (data) {
    await this.open
    // A non-owner on an Open printer: muon-link's policy answers these itself, as a JSON-RPC error.
    if (S().ownerOnly) {
      let request = null
      try { request = JSON.parse(data) } catch {}
      if (request && (S().ownerOnly === 'after-160' ? ['server.config'] : S().ownerOnlyMethods).includes(request.method)) {
        S().refusedMethods.push(request.method)
        this.push(JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: 403, message: POLICY } }))
        return
      }
    }
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
  constructor (id, endpoint) {
    this.id = id
    this.endpoint = endpoint
    this.sockets = new Set()
    S().bleLive++
  }
  printerId () { return this.id }
  comparison () { return COMPARE }
  async fetch (method, path, headers, body) {
    if (this.endpoint.closed) throw new Error('connection lost')
    const kind = S().printers.find(p => p.id === this.id)?.kind
    const text = o => new TextEncoder().encode(JSON.stringify(o))
    if (path.startsWith('/server/muon/setup')) {
      // A printer that is set up lets a stranger read nothing of its setup.
      if (kind !== 'new') return { status: 403, headers: ['content-type', 'application/json'], body: text({ error: 'set up already' }) }
      return { status: 200, headers: ['content-type', 'application/json'], body: text({ result: SETUP_STATE }) }
    }
    if (S().ownerOnly && (S().ownerOnly === 'after-160' ? path.startsWith('/muon-link/pairing') || path.startsWith('/server/muon/access/get') || path.startsWith('/server/aux/permissions') : ['/muon-link/pairing', '/server/muon/identity', '/server/muon/protection', '/server/muon/access', '/server/aux/permissions'].some(p => path.startsWith(p)))) {
      S().refusedPaths.push(path)
      return { status: 403, headers: ['content-type', 'application/json'], body: text({ error: POLICY }) }
    }
    if (path.startsWith('/muon-link/pairing')) {
      const entry = S().printers.find(p => p.id === this.id)?.entry
      return { status: 200, headers: ['content-type', 'application/json'], body: text(entry ? { accepting: entry === 'open', entry } : { accepting: false }) }
    }
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
    S().bleLive--
    for (const s of this.sockets) s.ws.close()
  }
}

class Link {
  constructor () {
    this.closed = false
    this.waiters = []
    this.timer = setInterval(() => this.wake(), 2000)
  }
  wake () { const w = this.waiters.shift(); if (w) w() }
  async connected () { return S().heard }
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
    this.waiters.splice(0).forEach(w => w())
  }
}

class Endpoint {
  constructor () { this.links = []; this.pinned = new Set(); this.closed = false }
  endpointId () { return 'e2ebrowserendpoint' }
  secretKey () { return new Uint8Array(32).fill(7) }
  pinBluetooth (id, on) {
    if (on) this.pinned.add(id.toLowerCase())
    else this.pinned.delete(id.toLowerCase())
  }
  addLink () {
    const link = new Link()
    this.links.push(link)
    return link
  }
  async connect (id) {
    if (this.closed) throw new Error('the endpoint is closed')
    const kind = S().printers.find(p => p.id === id)?.kind
    const entry = S().printers.find(p => p.id === id)?.entry
    if (kind === 'set-up' && entry !== 'open' && !S().paired.includes(id)) {
      log('refused ' + nameOf(id))
      // NET-17 close code 0x040a: the key is fine, the printer holds no standing for it.
      throw Object.assign(new Error('the printer refused this key'), { kind: 'refused', code: 0x040a })
    }
    log('connect ' + nameOf(id))
    return new Printer(id, this)
  }
  async connectAs (id, name, role, onPending, onClosed) {
    log('connectAs ' + JSON.stringify({ id, name, role }))
    if (!S().approval || S().paired.includes(id)) return this.connect(id)
    onPending({ code: COMPARE, expiresIn: 120 })
    await new Promise(resolve => { S().answer = resolve })
    const outcome = S().outcome
    log('approval ' + outcome)
    if (outcome !== 'accept') {
      const reason = outcome === 'reject' ? 'refused' : 'timed_out'
      onClosed(reason)
      throw Object.assign(new Error(reason), { kind: 'refused', reason })
    }
    S().paired.push(id)
    return this.connect(id)
  }
  async beginPairing (id) {
    log('beginPairing ' + nameOf(id))
    return {
      comparison: () => COMPARE,
      submitCode: async digits => {
        log('submitCode ' + digits)
        if (String(digits) !== PANEL_CODE) throw Object.assign(new Error('wrong code'), { kind: 'code-rejected', attemptsRemaining: 2 })
        if (S().panel) {
          await new Promise(resolve => { S().answer = resolve })
          log('panel ' + S().outcome)
          if (S().outcome === 'reject') throw Object.assign(new Error('rejected'), { kind: 'refused', reason: 'refused' })
          if (S().outcome === 'time out') throw new Error('pairing window expired')
        }
        S().paired.push(id)
        // The printer keeps the key through a reload of the page.
        try { sessionStorage.setItem('e2ePaired', JSON.stringify(S().paired)) } catch {}
        log('paired ' + nameOf(id))
      },
      free () {}
    }
  }
  async close () { this.closed = true; for (const l of this.links) l.close() }
}

export const MuonEndpoint = { async create (relay) { (S().relays ??= []).push(relay); return new Endpoint() } }
`
}

/**
 * Nobody is signed in; `pick` is the printer the person chooses in the
 * browser's Bluetooth chooser.
 */
export async function useNearbyPrinters (page: Page, pick: NearbyFake, options: { advertise?: boolean, panel?: boolean, approval?: boolean, granted?: boolean, /** true: muon-link as on 71ac6d6a (every Owner-only read refused). 'after-160': muon-link PR #160 (identity, protection, access capabilities, update status allowed again). */ ownerOnly?: boolean | 'after-160' } = {}) {
  const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type, idempotency-key', 'access-control-allow-methods': '*' }
  await page.route(`${CONSOLE}/v1/config`, route => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify({ relay_url: RELAY, orchestrator_id: 'e2e', authority_key: 'e2e' }) }))
  // Nobody is signed in: the console refuses a grant, as it does for a request with no session.
  await page.route(`${CONSOLE}/v1/printers/*/access`, route => route.request().method() === 'OPTIONS'
    ? route.fulfill({ status: 204, headers })
    : route.fulfill({ status: 401, contentType: 'application/json', headers, body: JSON.stringify({ error: { code: 'unauthorised', message: 'Sign in first.' } }) }))
  await page.route(/muon_link_web\.js(\?.*)?$/, route => route.fulfill({ status: 200, contentType: 'text/javascript', body: fakeClient(`http://localhost:${MOCK_PORT}`) }))
  // No address for any printer: they are reached only over Bluetooth.
  await page.route('**/config.json', async route => {
    const response = await route.fetch()
    const config = await response.json()
    config.blacklist = [...(config.blacklist ?? []), 'localhost', '127.0.0.1']
    config.endpoints = []
    await route.fulfill({ response, json: config })
  })
  // Nothing here is about the 3D model; the photoreal M1 stalls software WebGL.
  await page.addInitScript(() => localStorage.setItem('m1model', 'simple'))
  await page.addInitScript(([printers, id, advertise, panel, approval, granted, ownerOnly]) => {
    const state: any = { events: [] as string[], printers, paired: [] as string[], bleLive: 0, heard: id, panel, approval, ownerOnly, refusedPaths: [] as string[], refusedMethods: [] as string[], ownerOnlyMethods: ['server.config', 'server.muon.get_protection', 'machine.update.status'] }
    for (const p of printers as any[]) if (p.kind === 'paired') state.paired.push(p.id)
    ;(window as any).__e2ePair = state
    try { for (const k of JSON.parse(sessionStorage.getItem('e2ePaired') ?? '[]')) if (!state.paired.includes(k)) state.paired.push(k) } catch {}
    const asked: unknown[] = []
    ;(window as any).__bluetoothAsks = asked
    const pickedPrinter = (printers as any[]).find(p => p.id === id)
    const device: any = new EventTarget()
    device.id = 'e2e-' + pickedPrinter.advertised
    device.name = pickedPrinter.advertised
    // With `advertise`, the printer sends Muon's advertisement (flags, EndpointId prefix) while it is watched, as a
    // real one does: a set-up printer is then known to be set up and its tile offers Pair over Bluetooth.
    device.watchAdvertisements = async (opts: { signal?: AbortSignal } = {}) => {
      if (!advertise) return
      const bytes = new Uint8Array(10)
      bytes[0] = 1
      bytes[1] = pickedPrinter.kind === 'new' ? 1 : 0
      for (let i = 0; i < 8; i++) bytes[2 + i] = parseInt((id as string).slice(i * 2, i * 2 + 2), 16)
      const send = () => {
        const event: any = new Event('advertisementreceived')
        event.device = device
        event.name = pickedPrinter.advertised
        event.manufacturerData = new Map([[0xffff, new DataView(bytes.buffer)]])
        device.dispatchEvent(event)
      }
      setTimeout(send, 50)
      const timer = setInterval(send, 1000)
      opts.signal?.addEventListener('abort', () => clearInterval(timer))
    }
    let connected = false
    const tx: any = new EventTarget()
    tx.value = null
    tx.startNotifications = async () => tx
    const info = () => {
      const bytes = new Uint8Array(38)
      bytes[0] = 1
      bytes[4] = 182
      for (let i = 0; i < 32; i++) bytes[6 + i] = parseInt((id as string).slice(i * 2, i * 2 + 2), 16)
      return new DataView(bytes.buffer)
    }
    const rx = {
      properties: { writeWithoutResponse: true },
      readValue: async () => new DataView(new ArrayBuffer(0)),
      writeValueWithoutResponse: async (segment: BufferSource) => {
        if (!connected) throw new DOMException('GATT Server is disconnected.', 'NetworkError')
        setTimeout(() => {
          if (!connected || state.bleLive <= 0) return
          tx.value = new DataView(new Uint8Array(segment as ArrayBuffer).slice().buffer)
          tx.dispatchEvent(new Event('characteristicvaluechanged'))
        }, 5)
      }
    }
    device.gatt = {
      get connected () { return connected },
      connect: async () => {
        if (state.radioOff) throw new DOMException('Bluetooth adapter not available.', 'NetworkError')
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
    // `granted`: this browser was allowed the printer in an earlier visit (getDevices lists it before any chooser).
    let chosen = !!granted
    const bt: any = new EventTarget()
    bt.requestDevice = async (options: unknown) => { asked.push(options); chosen = true; return device }
    bt.getDevices = async () => chosen ? [device] : []
    bt.getAvailability = async () => true
    // The radio goes away: the link drops and nothing connects until it is back.
    state.radio = (on: boolean) => {
      state.radioOff = !on
      if (!on) device.gatt.disconnect()
      const event: any = new Event('availabilitychanged')
      event.value = on
      bt.dispatchEvent(event)
    }
    Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: bt })
  }, [PRINTERS, pick.id, !!options.advertise, !!options.panel, !!options.approval, !!options.granted, options.ownerOnly ?? false] as const)
}

export async function answerAtPrinter (page: Page, outcome: 'accept' | 'reject' | 'time out') {
  await page.waitForFunction(() => typeof (window as any).__e2ePair.answer === 'function')
  await page.evaluate(outcome => {
    const state = (window as any).__e2ePair
    state.outcome = outcome
    const answer = state.answer
    state.answer = null
    answer()
  }, outcome)
}

export function pairedHere (page: Page): Promise<string[]> {
  return page.evaluate(() => [...(window as any).__e2ePair.paired])
}

export function pairEvents (page: Page): Promise<string[]> {
  return page.evaluate(() => [...(window as any).__e2ePair.events])
}

/**
 * Turns the pairing switch (panelCodePairing, KAN-1374) on or off for the page that is open.
 * A development build has it on already; this is how a test says which it wants.
 */
export function setPairingGate (page: Page, on: boolean | null) {
  return page.evaluate(async value => {
    const m = await import(/* @vite-ignore */ ['', 'src', 'services', 'muon-cloud', 'activate.ts'].join('/'))
    m.setPanelCodePairing(value)
  }, on)
}

/** What muon-link's Owner-only policy refused this browser, once `ownerOnly` is on: HTTP paths and JSON-RPC methods. */
export function ownerOnlyRefusals (page: Page): Promise<{ paths: string[], methods: string[] }> {
  return page.evaluate(() => ({ paths: [...(window as any).__e2ePair.refusedPaths], methods: [...(window as any).__e2ePair.refusedMethods] }))
}
