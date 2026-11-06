/**
 * Kept in step with MuonUI's src/embed/protocol.ts (Muon-3D/MuonUI#124); change both together.
 *
 * The embed's message protocol: MuonUI built with `--mode embed`, framed by
 * Control at `/panel/` on Control's own origin.
 *
 * Control implements the other end. Everything here is plain structured-clone
 * data; nothing is JSON-encoded twice.
 *
 * Handshake (window.postMessage, both directions pinned to `location.origin`):
 *   1. embed  -> parent  `PanelHello`, targetOrigin = the embed's own origin.
 *   2. parent -> embed   `PanelPort`, with one MessagePort in `event.ports[0]`.
 *      The embed takes exactly one, and only when
 *      `event.origin === location.origin && event.source === window.parent`.
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
