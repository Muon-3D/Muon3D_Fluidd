import { HELLO_TYPE, PORT_TYPE, PROTOCOL_VERSION, type BridgeRequest, type BridgeResponse } from './protocol'
import { ON_PRINTER, auxVerdict, rpcVerdict } from './allow'

/**
 * Control's end of the embedded printer screen (MuonUI's embed build, framed
 * at /panel/ on Control's own origin; SCREEN-PLAN.md). The embed has no
 * network of its own: it asks over one MessagePort, and this answers with
 * Control's own connection, after the allowlist (allow.ts).
 *
 * - The port is handed over once, only to the frame this bridge was made for
 *   (event.source), only from Control's own origin, posted to that origin
 *   (never '*').
 * - No call adds headers or credentials of its own: it is Control's
 *   connection, as Control would send it.
 * - Anything not on the allowlist is answered with an error saying to do it
 *   on the printer, and is counted, never sent.
 */
export interface BridgeHost {
  /** A JSON-RPC call on Control's socket: its result, or throws with the printer's error. */
  rpc: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
  /** A GET under /server/aux through Control's HTTP client: the decoded body, or throws. */
  auxGet: (path: string) => Promise<unknown>;
  /** The printer's status as Control holds it (Control subscribes to every object). */
  status: () => Record<string, unknown>;
  /** Control's connection id, for the embed's identify. */
  connectionId: () => number | null;
}

export interface BridgeEvents {
  /** A call was refused (method or path, as asked). */
  onRefused?: (what: string) => void;
}

export class PanelBridge {
  private port: MessagePort | null = null
  private handedOver = false
  /** The objects the embed subscribed to (null = all), for forwarding status updates. */
  private watched: Set<string> | null | undefined = undefined
  refused = 0
  private readonly onWindowMessage = (e: MessageEvent) => this.hello(e)

  constructor (
    private readonly frame: HTMLIFrameElement,
    private readonly host: BridgeHost,
    private readonly events: BridgeEvents = {},
    private readonly origin: string = window.location.origin
  ) {
    window.addEventListener('message', this.onWindowMessage)
  }

  /** The embed's hello: from our frame, from our origin, once. */
  private hello (e: MessageEvent) {
    const data = e.data as { type?: unknown, version?: unknown } | null
    if (this.handedOver || !data || data.type !== HELLO_TYPE || data.version !== PROTOCOL_VERSION) return
    if (e.origin !== this.origin || !this.frame.contentWindow || e.source !== this.frame.contentWindow) return
    const channel = new MessageChannel()
    this.port = channel.port1
    this.port.onmessage = m => { this.handle(m.data).catch(() => undefined) }
    this.handedOver = true
    this.frame.contentWindow.postMessage({ type: PORT_TYPE }, this.origin, [channel.port2])
  }

  private reply (r: BridgeResponse) {
    this.port?.postMessage(r)
  }

  private refuse (id: number, what: string, status?: number) {
    this.refused++
    this.events.onRefused?.(what)
    this.reply({ id, ok: false, error: { message: ON_PRINTER, code: -32601, status: status ?? 403 } })
  }

  /** One request from the embed. */
  async handle (raw: unknown) {
    const req = raw as Partial<BridgeRequest> | null
    if (!req || typeof req !== 'object' || typeof req.id !== 'number') return
    const id = req.id
    if (req.kind === 'rpc') {
      const method = (req as { method?: unknown }).method
      const verdict = rpcVerdict(method)
      if (verdict === 'refuse') return this.refuse(id, String(method))
      const params = (req as { params?: unknown }).params
      const safeParams = params && typeof params === 'object' && !Array.isArray(params) ? params as Record<string, unknown> : undefined
      if (verdict === 'local') return this.reply({ id, ok: true, result: this.local(method as string, safeParams) })
      try {
        const result = await this.host.rpc(method as string, safeParams)
        this.reply({ id, ok: true, result })
      } catch (err) {
        this.reply({ id, ok: false, error: { message: err instanceof Error ? err.message : 'The printer refused that.' } })
      }
      return
    }
    if (req.kind === 'aux') {
      const { method, path } = req as { method?: unknown, path?: unknown }
      if (auxVerdict(method, path) === 'refuse') return this.refuse(id, `${String(method)} ${String(path)}`)
      try {
        // The path was checked by auxVerdict (a listed read, no way out of /server/aux); its query goes as asked.
        const result = await this.host.auxGet(path as string)
        this.reply({ id, ok: true, result })
      } catch (err) {
        const status = (err as { response?: { status?: number } }).response?.status
        this.reply({ id, ok: false, error: { message: err instanceof Error ? err.message : 'The printer refused that.', status } })
      }
      return
    }
    this.refuse(id, 'unknown request')
  }

  /** subscribe and identify, answered from what Control already has. */
  private local (method: string, params?: Record<string, unknown>): unknown {
    if (method === 'server.connection.identify') return { connection_id: this.host.connectionId() }
    const objects = params?.objects
    const status = this.host.status()
    if (!objects || typeof objects !== 'object') {
      this.watched = null
      return { eventtime: Date.now() / 1000, status }
    }
    const names = Object.keys(objects as Record<string, unknown>)
    this.watched = new Set(names)
    const picked: Record<string, unknown> = {}
    for (const n of names) if (n in status) picked[n] = status[n]
    return { eventtime: Date.now() / 1000, status: picked }
  }

  /**
   * A Moonraker notification Control received, passed on. A status update
   * carries only the objects the embed subscribed to, and nothing before it has.
   */
  notify (method: string, params: unknown) {
    if (!this.port || this.watched === undefined) return
    if (method === 'notify_status_update' && this.watched) {
      const p = params as [Record<string, unknown>, number?] | Record<string, unknown>
      const update = Array.isArray(p) ? p[0] : p
      const picked: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(update ?? {})) if (this.watched.has(k)) picked[k] = v
      if (!Object.keys(picked).length) return
      this.port.postMessage({ kind: 'notify', method, params: [picked, Array.isArray(p) ? p[1] : undefined] })
      return
    }
    this.port.postMessage({ kind: 'notify', method, params })
  }

  dispose () {
    window.removeEventListener('message', this.onWindowMessage)
    this.port?.close()
    this.port = null
  }
}
