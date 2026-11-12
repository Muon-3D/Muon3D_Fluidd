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

/** Bumped on any incompatible change to the messages below. */
export const PROTOCOL_VERSION = 1 as const

/** embed -> parent, on load. */
export interface PanelHello {
  type: typeof HELLO_TYPE
  version: typeof PROTOCOL_VERSION
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

/**
 * parent -> embed: the model's knob was turned or pressed on Control's 3D
 * view (the printer's own knob, as a person works it on the model): `turn`
 * by `detents` (positive clockwise), or `press`. Purely input to the screen's
 * own UI, as the real knob is; it carries no printer action and changes no
 * privilege. Additive in version 1: an embed that doesn't know `kind: 'input'`
 * ignores it. MuonUI's embed handles it as its knob (needs the MuonUI half).
 */
export type BridgeInput =
  | { kind: 'input', input: 'turn', detents: number }
  | { kind: 'input', input: 'press' }

export type ParentMessage = BridgeResponse | BridgeNotify | BridgeInput

export function isBridgeInput (m: unknown): m is BridgeInput {
  if (!m || typeof m !== 'object') return false
  const r = m as Record<string, unknown>
  if (r.kind !== 'input') return false
  return r.input === 'press' || (r.input === 'turn' && typeof r.detents === 'number' && Number.isFinite(r.detents))
}

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
 * accepted.
 */
export type Verb =
  | { verb: 'jog', axis: 'X' | 'Y' | 'Z', by: number }
  | { verb: 'home', axes: '' | 'XY' | 'Z' }
  | { verb: 'heat', heater: 'extruder' | 'heater_bed', target: number }
  | { verb: 'filament', action: 'load' | 'unload' }

export type VerbRequest = { id: number, kind: 'verb' } & Verb
