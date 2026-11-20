import { HELLO_TYPE, PORT_TYPE, SUPPORTED_VERSIONS, readNavigate, readPanelState, type BridgeRequest, type BridgeResponse, type PanelState, type Verb } from './protocol'
import { NOTIFY_FORWARD, ON_PRINTER, auxVerdict, readVerb, rpcVerdict } from './allow'

/**
 * Control's end of the embedded printer screen (MuonUI's embed build, fetched
 * from the printer over the active route and framed from memory as `srcdoc`
 * in a sandbox; SCREEN-PLAN.md). The embed has no
 * network of its own: it asks over one MessagePort, and this answers with
 * Control's own connection, after the allowlist (allow.ts).
 *
 * - The port is handed over once, only to the frame this bridge was made for
 *   (event.source), only from the sandbox's opaque origin ("null": a srcdoc or blob frame
 *   without allow-same-origin has no other), and posted to that window alone
 *   (an opaque origin can't be named as a target).
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
  /** Runs a checked verb with Control's own gated methods: '' when it was sent, else why not (in words). */
  verb: (v: Verb) => string;
  /**
   * GET the printer's panel state over the active route: the HTTP status and decoded body, never throws for a
   * status (only for no answer at all). Absent: this host has no live screen.
   */
  panelGet?: () => Promise<{ status: number, body: unknown }>;
  /** POST a navigate request the same way. */
  panelPost?: (body: { screen: string, params?: Record<string, unknown>, if_seq?: number }) => Promise<{ status: number, body: unknown }>;
}

export interface BridgeEvents {
  /** A call was refused (method or path, as asked). */
  onRefused?: (what: string) => void;
  /** Whether this printer has a live panel state: false once it said it has none (an older image). */
  onSupport?: (supported: boolean) => void;
}

/** How often the state is asked for while the websocket is down, ms (no polling while it works). */
export const PANEL_POLL_MS = 2000

/** What a busy panel says, in words: the modal's id as plain text. */
export function busyReason (state: PanelState | null): string {
  const what = state?.modal?.id.replace(/[-_]+/g, ' ').trim()
  return what ? `The printer's screen is busy with ${what}` : "The printer's screen is busy"
}

export class PanelBridge {
  private port: MessagePort | null = null
  /** The objects the embed subscribed to (null = all), for forwarding status updates. */
  private watched: Set<string> | undefined = undefined
  refused = 0
  /** The embed's protocol version (it said so in its hello); the panel state goes only to version 2 and up. */
  private version = 1
  /** The last panel state Control knows, and whether this printer has one at all. */
  private panel: PanelState | null = null
  private support: 'unknown' | 'yes' | 'no' = 'unknown'
  private pollTimer: ReturnType<typeof setInterval> | null = null
  /** The websocket is down, so the state should be polled: honoured only once a version 2 embed is here. */
  private pollWanted = false
  private syncing: Promise<void> | null = null
  private readonly onWindowMessage = (e: MessageEvent) => this.hello(e)

  constructor (
    private readonly frame: HTMLIFrameElement,
    private readonly host: BridgeHost,
    private readonly events: BridgeEvents = {}
  ) {
    window.addEventListener('message', this.onWindowMessage)
  }

  /**
   * The embed's hello, from our frame. The frame is sandboxed without
   * allow-same-origin, so its origin is opaque ("null") and it can't reach
   * Control's storage, cookies or window: the source check binds the port to
   * this frame, and the port can't go anywhere else. A new hello from the same
   * frame (it reloaded) closes the old port and hands over a new one.
   */
  private hello (e: MessageEvent) {
    const data = e.data as { type?: unknown, version?: unknown } | null
    if (!data || data.type !== HELLO_TYPE || typeof data.version !== 'number' || !SUPPORTED_VERSIONS.includes(data.version)) return
    const target = this.frame.contentWindow
    if (!target || e.source !== target || e.origin !== 'null') return
    // A frame that could reach Control's own origin is not one to hand a port to.
    if ((this.frame.getAttribute('sandbox') ?? '').split(' ').includes('allow-same-origin')) return
    this.port?.close()
    this.watched = undefined
    this.version = data.version
    const channel = new MessageChannel()
    this.port = channel.port1
    this.port.onmessage = m => { this.handle(m.data).catch(() => undefined) }
    // An opaque origin can't be named as a target; the window itself is the binding.
    target.postMessage({ type: PORT_TYPE }, '*', [channel.port2])
    // The port queues until the embed listens; a version 2 embed gets the screen the panel is on.
    if (this.version >= 2) {
      // A fresh embed gets what is known now; the read below only pushes again when the screen has moved.
      if (this.panel || this.support === 'no') this.push()
      this.syncPanel().catch(() => undefined)
      // The websocket was already down when this embed said hello: start the fallback poll now.
      if (this.pollWanted) this.setPolling(true)
    }
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
    if (req.kind === 'verb') {
      const verb = readVerb(req)
      if (!verb) return this.refuse(id, 'malformed verb')
      const why = this.host.verb(verb)
      if (why) this.reply({ id, ok: false, error: { message: why, status: 409 } })
      else this.reply({ id, ok: true, result: null })
      return
    }
    if (req.kind === 'navigate') return this.navigate(id, req)
    this.refuse(id, 'unknown request')
  }

  private push () {
    if (this.version < 2 || !this.port) return
    const supported = this.support !== 'no'
    this.port.postMessage({ kind: 'panel-state', supported, state: supported ? this.panel : null })
  }

  private adopt (state: PanelState) {
    this.panel = state
    this.support = 'yes'
    this.events.onSupport?.(true)
    this.push()
  }

  private unsupported () {
    this.panel = null
    if (this.support === 'no') return
    this.support = 'no'
    this.events.onSupport?.(false)
    this.push()
  }

  /**
   * Reads the panel state from the printer and passes it on. A printer without the endpoint (404 or 405) is
   * remembered as having no live screen; a read that fails any other way changes nothing and is tried again.
   * One read at a time.
   */
  syncPanel (): Promise<void> {
    if (!this.host.panelGet) return Promise.resolve()
    this.syncing ??= (async () => {
      try {
        const res = await this.host.panelGet!()
        if (res.status === 404 || res.status === 405) return this.unsupported()
        if (res.status < 200 || res.status >= 300) return
        const body = res.body as { result?: unknown } | null
        const state = readPanelState(body && typeof body === 'object' && 'result' in body ? body.result : body)
        // The same screen as last time (a poll with nothing new): nothing to push.
        if (state && !(this.support === 'yes' && this.panel && state.seq === this.panel.seq)) this.adopt(state)
      } catch {
        // No answer: keep what we have.
      } finally {
        this.syncing = null
      }
    })()
    return this.syncing
  }

  /** The printer's own notification of a new panel state: it is ordered, so a different seq is the newer one. */
  panelNotify (raw: unknown) {
    const state = readPanelState(raw)
    if (!state || this.support === 'no') return
    if (this.panel && state.seq === this.panel.seq) return
    this.adopt(state)
  }

  /** While the websocket is down, ask for the state every PANEL_POLL_MS; stop when it is back. */
  setPolling (on: boolean) {
    this.pollWanted = on
    // A version 1 embed (or none yet) has no use for the state: never read it for one.
    if (!on || this.version < 2 || this.support === 'no' || !this.host.panelGet) {
      if (this.pollTimer) clearInterval(this.pollTimer)
      this.pollTimer = null
      return
    }
    if (this.pollTimer) return
    this.pollTimer = setInterval(() => { this.syncPanel().catch(() => undefined) }, PANEL_POLL_MS)
  }

  /**
   * The embed asks the panel to move. Sent with the seq Control last saw, so the printer can tell a stale view
   * (409: re-read and push the truth) and can refuse while a modal is open or the panel is busy (423, in words).
   */
  private async navigate (id: number, raw: unknown) {
    const fail = (message: string, status: number) => this.reply({ id, ok: false, error: { message, status } })
    const nav = readNavigate(raw)
    if (!nav) return this.refuse(id, 'malformed navigate')
    if (!this.host.panelPost || this.support === 'no') return fail('Live screen needs a printer update.', 404)
    try {
      const res = await this.host.panelPost({ ...nav, ...(this.panel ? { if_seq: this.panel.seq } : {}) })
      if (res.status >= 200 && res.status < 300) {
        // The printer answers 200 {seq}; the new screen itself arrives as the state notification.
        const body = res.body as { result?: unknown } | null
        const out = (body && typeof body === 'object' && 'result' in body ? body.result : body) as { seq?: unknown } | null
        return this.reply({ id, ok: true, result: { seq: typeof out?.seq === 'number' ? out.seq : null } })
      }
      if (res.status === 409) {
        await this.syncPanel()
        return fail("The printer's screen has moved on.", 409)
      }
      if (res.status === 423) {
        // The state the printer was in when it said no: a notification may not have reached us yet.
        await this.syncPanel()
        return fail(busyReason(this.panel), 423)
      }
      if (res.status === 404 || res.status === 405) {
        this.unsupported()
        return fail('Live screen needs a printer update.', 404)
      }
      if (res.status === 504) return fail("The printer's screen isn't responding", 504)
      if (res.status === 403 && (res.body as { reason?: unknown } | null)?.reason === 'owner_only') return fail("Only the printer's owner can open that screen", 403)
      if (res.status === 401 || res.status === 403) return fail(ON_PRINTER, res.status)
      return fail('The printer would not change screen.', res.status)
    } catch {
      return fail("The printer's screen isn't responding", 504)
    }
  }

  /** subscribe and identify, answered from what Control already has. */
  private local (method: string, params?: Record<string, unknown>): unknown {
    if (method === 'server.connection.identify') return { connection_id: this.host.connectionId() }
    const objects = params?.objects
    const status = this.host.status()
    // A subscribe must name its objects: "everything" is not passed on.
    if (!objects || typeof objects !== 'object' || Array.isArray(objects)) return { eventtime: Date.now() / 1000, status: {} }
    const names = Object.keys(objects as Record<string, unknown>)
    this.watched = new Set(names)
    const picked: Record<string, unknown> = {}
    for (const n of names) if (Object.prototype.hasOwnProperty.call(status, n)) picked[n] = status[n]
    return { eventtime: Date.now() / 1000, status: picked }
  }

  /**
   * A Moonraker notification Control received, passed on. A status update
   * carries only the objects the embed subscribed to, and nothing before it has.
   */
  notify (method: string, params: unknown) {
    if (!this.port || this.watched === undefined || !NOTIFY_FORWARD.has(method)) return
    if (method === 'notify_status_update') {
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
    this.setPolling(false)
    window.removeEventListener('message', this.onWindowMessage)
    this.port?.close()
    this.port = null
  }
}
