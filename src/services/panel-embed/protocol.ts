/**
 * Kept in step with MuonUI's src/embed/protocol.ts (Muon-3D/MuonUI#124); change both together.
 *
 * The embed's message protocol: MuonUI built with `--mode embed`, framed by
 * Control at `/panel/` on Control's own origin.
 *
 * Control implements the other end. Everything here is plain structured-clone
 * data; nothing is JSON-encoded twice.
 *
 * Handshake (window.postMessage):
 *   1. embed  -> parent  `PanelHello`.
 *   2. parent -> embed   `PanelPort`, with one MessagePort in `event.ports[0]`.
 *      Control frames the page with `sandbox="allow-scripts"` (no
 *      allow-same-origin), so the embed's origin is opaque ('null'): the embed
 *      cannot pin `event.origin` to its own origin, so it must accept the port
 *      by `event.source === window.parent` (and take exactly one). Control's
 *      side: it answers only its own frame's window (`event.source`), only
 *      for a hello whose origin is 'null', and posts to that window alone. An
 *      opaque origin can't be named as a target, so targetOrigin is '*' and the
 *      window is the binding.
 *      Every other window message is ignored.
 *
 * After the handshake every message goes over that MessagePort:
 *   embed  -> parent  `BridgeRequest`   (rpc or aux)
 *   parent -> embed   `BridgeResponse`  (one per request id)
 *   parent -> embed   `BridgeNotify`    (Moonraker notify_* messages)
 *
 * The embed never sends `server.connection.identify`: the connection, its
 * identity and its privileges are Control's.
 */

export const HELLO_TYPE = 'muon-panel-hello' as const
export const PORT_TYPE = 'muon-panel-port' as const

/**
 * Bumped on a change to the messages below. Version 2 adds the live panel state
 * (`panel-state` to the embed, `navigate` from it). Control still answers a
 * version 1 embed, and sends it nothing it does not know.
 */
export const PROTOCOL_VERSION = 2 as const

/** Every version Control will take a hello from. */
export const SUPPORTED_VERSIONS: readonly number[] = [1, 2]

/** embed -> parent, on load. */
export interface PanelHello {
  type: typeof HELLO_TYPE
  version: 1 | typeof PROTOCOL_VERSION
}

/** parent -> embed, once. The MessagePort travels in `event.ports[0]`. */
export interface PanelPort {
  type: typeof PORT_TYPE
}

/** A Moonraker JSON-RPC call to run on Control's own socket. */
export interface RpcRequest {
  id: number
  kind: 'rpc'
  method: string
  params?: Record<string, unknown>
}

export type AuxMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * An Aux API call to run through Control's `/server/aux` client. `path` is
 * relative to `/server/aux` and starts with `/` (e.g. `/wifi/device/status`),
 * query string included. `body` is the decoded JSON body, if any.
 */
export interface AuxRequest {
  id: number
  kind: 'aux'
  method: AuxMethod
  path: string
  body?: unknown
}

export type BridgeRequest = RpcRequest | AuxRequest

export interface BridgeError {
  message: string
  /** JSON-RPC error code, for kind 'rpc'. */
  code?: number
  /** HTTP status, for kind 'aux'. */
  status?: number
  /** The decoded error body, for kind 'aux' (e.g. FastAPI's `{detail}`). */
  body?: unknown
}

export type BridgeResponse =
  | { id: number; ok: true; result: unknown }
  | { id: number; ok: false; error: BridgeError }

/** A Moonraker notification, e.g. `notify_status_update`. */
export interface BridgeNotify {
  kind: 'notify'
  method: string
  params?: unknown
}

export type ParentMessage = BridgeResponse | BridgeNotify

export function isBridgeResponse (m: unknown): m is BridgeResponse {
  if (!m || typeof m !== 'object') return false
  const r = m as Record<string, unknown>
  if (typeof r.id !== 'number' || typeof r.ok !== 'boolean') return false
  if (r.ok) return 'result' in r
  const e = r.error as Record<string, unknown> | null | undefined
  return !!e && typeof e === 'object' && typeof e.message === 'string'
}

export function isBridgeNotify (m: unknown): m is BridgeNotify {
  if (!m || typeof m !== 'object') return false
  const r = m as Record<string, unknown>
  return r.kind === 'notify' && typeof r.method === 'string'
}

/**
 * A printer action the embed asks for by name (protocol version 1 addition).
 * Control runs it with its own gated methods: a jog through the no-go
 * planner and the hand-move wait, home, a heater target within its limits,
 * load or unload as Control's Filament card runs them. Raw G-code is never
 * accepted
 * as a verb: a raw script goes as an rpc `printer.gcode.script`, which
 * Control checks (no moves, nothing that rewrites the printer's setup).
 * `fan` is `'part'` (the part-cooling fan) or a fan_generic's name, 0 to 100.
 */
export type Verb =
  | { verb: 'jog', axis: 'X' | 'Y' | 'Z', by: number }
  | { verb: 'home', axes: '' | 'XY' | 'Z' }
  | { verb: 'heat', heater: 'extruder' | 'heater_bed', target: number }
  | { verb: 'fan', fan: string, percent: number }
  | { verb: 'filament', action: 'load' | 'unload' }

export type VerbRequest = { id: number, kind: 'verb' } & Verb

/**
 * The printer's own panel state (KAN-4812 part 3), as the printer's
 * `muon_panel` publishes it: which screen the real panel is on. The panel is
 * the one source of truth; every viewer follows it. `screen` is one of
 * MuonUI's frozen route ids, never a path.
 */
export interface PanelState {
  seq: number
  screen: string
  params: Record<string, unknown>
  modal: { id: string, step?: number } | null
  busy: boolean
  updated_at: number
}

/**
 * parent -> embed (protocol version 2): where the printer's panel is now.
 * `supported: false` means this printer has no `muon_panel` (an older image):
 * `state` is null and the embed keeps its own, independent navigation.
 */
export interface PanelStateMessage {
  kind: 'panel-state'
  supported: boolean
  state: PanelState | null
}

/**
 * embed -> parent (protocol version 2): ask the printer's panel to go to a
 * screen. Answered by one BridgeResponse for `id`: ok with `{ seq }`, or an
 * error whose `status` is 409 (the screen moved on; the new state follows as
 * a `panel-state`), 423 (a modal is open or the panel is busy; `message` says
 * so in words) or 404 (no live screen on this printer).
 */
export interface NavigateRequest {
  id: number
  kind: 'navigate'
  screen: string
  params?: Record<string, unknown>
}

/** A screen id, as the printer's route enum spells them. */
const SCREEN_ID = /^[a-z0-9][a-z0-9_-]{0,47}$/

const isPlain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

/** Rebuilds a panel state from known fields only; null if it is not one. */
export function readPanelState (raw: unknown): PanelState | null {
  if (!isPlain(raw)) return null
  const { seq, screen, params, modal, busy, updated_at: at } = raw
  if (typeof seq !== 'number' || !Number.isFinite(seq) || typeof screen !== 'string' || !SCREEN_ID.test(screen)) return null
  if (params !== undefined && params !== null && !isPlain(params)) return null
  let m: PanelState['modal'] = null
  if (modal !== undefined && modal !== null) {
    if (!isPlain(modal) || typeof modal.id !== 'string' || !modal.id || modal.id.length > 64) return null
    m = typeof modal.step === 'number' && Number.isFinite(modal.step) ? { id: modal.id, step: modal.step } : { id: modal.id }
  }
  return {
    seq,
    screen,
    params: (params ?? {}) as Record<string, unknown>,
    modal: m,
    busy: busy === true,
    updated_at: typeof at === 'number' && Number.isFinite(at) ? at : 0
  }
}

/** The most a navigate's params may weigh, serialised: they are small, screen-specific JSON. */
export const NAVIGATE_PARAMS_MAX = 1024

/** A navigate from the embed, checked and rebuilt from known fields, or null. */
export function readNavigate (raw: unknown): { screen: string, params?: Record<string, unknown> } | null {
  if (!isPlain(raw) || typeof raw.screen !== 'string' || !SCREEN_ID.test(raw.screen)) return null
  if (raw.params === undefined || raw.params === null) return { screen: raw.screen }
  if (!isPlain(raw.params)) return null
  let size = 0
  try { size = JSON.stringify(raw.params).length } catch { return null }
  return size <= NAVIGATE_PARAMS_MAX ? { screen: raw.screen, params: raw.params } : null
}
