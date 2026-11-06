/**
 * The mock printer, per test, for Control's pages.
 *
 * The shared mock (e2e/mock/moonraker.py) is a mid-print M1 that every test and
 * worker talks to, so a test must not change it. Instead this sits on the
 * page's Moonraker websocket (page.routeWebSocket) and, for this page only:
 * - lays `status` over every status the mock sends (a subscribe/query result
 *   or a notify_status_update), so the page sees an idle, homed, paused… M1;
 * - answers printer.gcode.script itself and records the script in `gcode`,
 *   so nothing reaches the shared mock and a test can assert exactly what
 *   Control asked the printer to do;
 * - can make any one method fail (`failOn`).
 *
 *   const printer = await usePrinter(page, PRESETS.idleHomed({ position: [60, 40, 1] }))
 *   await open('/control')
 *   expect(printer.moves()).toEqual(['G1 Z6 F600', …])
 */
import type { Page } from '@playwright/test'
import { MOCK_PORT } from '../ports'

type Json = Record<string, any>

export interface PrinterState {
  /** Laid over every status object the mock reports (objects merge, arrays replace). */
  status: Json
  /** Methods to answer with a JSON-RPC error: method → message. */
  failOn: Record<string, string>
  /** Laid over the result of a method the page asks (server.info: `{ klippy_state: 'startup' }`). */
  results: Record<string, Json>
  /** Methods this page's printer answers itself, with a result (or a function of the params), instead of the shared mock. */
  answers: Record<string, unknown>
  /** Methods to answer with this result instead of the mock's: method -> result (server.history.list...). */
  answer: Record<string, unknown>
  /** When set, server.info reports exactly these Moonraker components (what a page gates on). */
  components?: string[]
  /** While set, the printer can't be reached: every websocket the page opens is closed at once. */
  offline?: boolean
}

export interface PrinterHandle {
  state: PrinterState
  /** Every printer.gcode.script the page sent, in order. */
  gcode: string[]
  /** Every RPC (method and params) the page sent, in order. */
  calls: Array<{ method: string, params: Json }>
  /** The params of every request of this method. */
  called: (method: string) => Json[]
  /** The G1 lines of every script sent, in order. */
  moves: () => string[]
  /** The printer reports `status` now: it becomes the overlay and is pushed to the page at once. */
  report: (status: Json) => void
  /** The printer prints these lines to the console now (a notify_gcode_response each). */
  say: (...lines: string[]) => void
  /** The printer drops off the network now: the page's websocket closes, and every new one is refused. */
  offline: () => Promise<void>
  /** The printer is reachable again: the page's next websocket connects. */
  online: () => void
}

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

/** `over` laid onto `base`: objects merge, anything else replaces. */
export function overlay (base: Json, over: Json): Json {
  const out: Json = { ...base }
  for (const [key, value] of Object.entries(over)) {
    out[key] = isObject(value) && isObject(base[key]) ? overlay(base[key], value) : value
  }
  return out
}

/** For a partial update, only the objects it carries, each with the override laid on. */
function overlayUpdate (update: Json, over: Json): Json {
  const out: Json = { ...update }
  for (const key of Object.keys(update)) {
    if (isObject(over[key]) && isObject(update[key])) out[key] = overlay(update[key], over[key])
  }
  return out
}

export async function usePrinter (page: Page, status: Json = {}, options: { components?: string[] } = {}): Promise<PrinterHandle> {
  const handle: PrinterHandle = {
    state: { status, failOn: {}, results: {}, answers: {}, answer: {}, components: options.components },
    gcode: [],
    calls: [],
    called: (method: string) => handle.calls.filter(c => c.method === method).map(c => c.params),
    moves: () => handle.gcode.flatMap(s => s.split('\n')).filter(l => l.startsWith('G1 ')),
    report: (next: Json) => {
      handle.state.status = next
      pageSocket?.send(JSON.stringify({ jsonrpc: '2.0', method: 'notify_status_update', params: [next, Date.now() / 1000] }))
    },
    say: (...lines: string[]) => {
      for (const line of lines) pageSocket?.send(JSON.stringify({ jsonrpc: '2.0', method: 'notify_gcode_response', params: [line] }))
    },
    offline: async () => {
      handle.state.offline = true
      await pageSocket?.close()
      pageSocket = null
    },
    online: () => {
      handle.state.offline = false
    }
  }
  const asked = new Map<unknown, string>()
  const infoRequests = new Set<unknown>()
  let pageSocket: { send: (message: string) => void, close: () => Promise<void> } | null = null

  await page.routeWebSocket(new RegExp(`:${MOCK_PORT}/websocket\\?`), ws => {
    if (handle.state.offline) {
      ws.close().catch(() => {})
      return
    }
    pageSocket = ws
    const server = ws.connectToServer()

    ws.onMessage(raw => {
      let msg: Json
      try { msg = JSON.parse(String(raw)) } catch { server.send(raw); return }
      if (msg.id !== undefined && msg.method) asked.set(msg.id, msg.method)
      if (msg.method) handle.calls.push({ method: msg.method, params: msg.params ?? {} })
      const answer = msg.method in handle.state.answers ? handle.state.answers[msg.method] : handle.state.answer[msg.method]
      if (msg.method in handle.state.answers || msg.method in handle.state.answer) {
        const result = typeof answer === 'function' ? (answer as (p: Json) => unknown)(msg.params ?? {}) : answer
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }))
        return
      }
      if (msg.method === 'server.info') infoRequests.add(msg.id)
      const failure = handle.state.failOn[msg.method]
      if (failure !== undefined) {
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: msg.id, error: { code: 400, message: failure } }))
        return
      }
      if (msg.method === 'printer.gcode.script') {
        handle.gcode.push(String(msg.params?.script ?? ''))
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: 'ok' }))
        return
      }
      server.send(raw)
    })

    server.onMessage(raw => {
      let msg: Json
      try { msg = JSON.parse(String(raw)) } catch { ws.send(raw); return }
      const over = handle.state.status
      const method = asked.get(msg.id)
      if (method && isObject(msg.result) && handle.state.results[method]) msg.result = overlay(msg.result, handle.state.results[method])
      if (infoRequests.has(msg.id) && handle.state.components && isObject(msg.result)) {
        msg.result.components = handle.state.components
      }
      if (isObject(msg.result) && isObject(msg.result.status)) {
        msg.result.status = overlay(msg.result.status, over)
      } else if (msg.method === 'notify_status_update' && Array.isArray(msg.params) && isObject(msg.params[0])) {
        msg.params[0] = overlayUpdate(msg.params[0], over)
      }
      ws.send(JSON.stringify(msg))
    })
  })

  return handle
}

/** The M1's bed notch, as its printer.cfg declares it. */
export const M1_NO_GO = {
  no_go_region_1_min: [75, 0],
  no_go_region_1_max: [125, 34],
  no_go_boundary_tolerance: 10,
  no_go_traverse_z: 6
}

export const PRESETS = {
  /** Not printing, homed, the head at `position` (X, Y, Z), with the M1's no-go regions. */
  idleHomed ({ position = [100, 100, 10] as [number, number, number], homed = 'xyz' } = {}): Json {
    const [x, y, z] = position
    return {
      webhooks: { state: 'ready', state_message: 'Printer is ready' },
      print_stats: { state: 'standby', filename: '', message: '' },
      idle_timeout: { state: 'Ready' },
      virtual_sdcard: { is_active: false, progress: 0, file_path: null },
      pause_resume: { is_paused: false },
      toolhead: { homed_axes: homed, position: [x, y, z, 0] },
      gcode_move: { position: [x, y, z, 0], gcode_position: [x, y, z, 0] },
      motion_report: { live_position: [x, y, z, 0], live_velocity: 0 },
      configfile: { settings: { bed_mesh: M1_NO_GO } }
    }
  }
}
