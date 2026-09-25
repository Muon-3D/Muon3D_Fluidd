/**
 * The `/setup` page's own line to `muon_setup` (05-phone-setup-page.md §4).
 *
 * It is independent of Fluidd's socket, store and init on purpose: the page
 * must paint and keep working inside a captive-portal window, across the
 * hotspot dropping while the printer sets its region and changes channel. It
 * talks only to the origin that served it.
 */
import { applyState, setConnection, setupState } from './state'
import type { NetworksResult, SetupError, SetupOptions, SetupResult, SetupState, StepId } from './types'

export const SETUP_PATH = '/server/muon/setup'
/** The printer's own address on its hotspot, ap0. */
export const HOTSPOT_ADDRESS = '10.42.0.1'

export const RECONNECT_INTERVAL_MS = 1000
export const POLL_INTERVAL_MS = 2000
export const WRITE_TIMEOUT_MS = 10000
export const DRIVER_RENEW_INTERVAL_MS = 10000
/** Networks are scanned synchronously on the printer, capped at 15 s (02 §5.5). */
export const SCAN_TIMEOUT_MS = 20000

/** Moonraker refused the request itself: 400, 403 or 415 (02 §5). */
export class SetupHttpError extends Error {
  readonly status: number

  constructor (status: number, message: string) {
    super(message)
    this.name = 'SetupHttpError'
    this.status = status
  }
}

export interface SetupClient {
  start (): void;
  stop (): void;
  get (): Promise<SetupState | null>;
  /**
   * Writes to `muon_setup`. `path` is relative to /server/muon/setup, or a
   * full path. The body carries the current `rev` unless `rev: false`.
   * Resolves to null when the write got no answer; that is not a failure,
   * and the next state settles it (see `setupState.lostWrite`).
   */
  post (path: string, body?: Record<string, unknown>, opts?: { timeoutMs?: number, rev?: boolean }): Promise<SetupResult | null>;
  claimDriver (): Promise<SetupResult | null>;
  networks (rescan: boolean): Promise<NetworksResult>;
  options (country?: string, language?: string): Promise<SetupOptions>;
  uploadCaCert (file: File): Promise<{ ok: boolean, ca_cert_id?: string, error?: SetupError }>;
}

export interface SetupClientOptions {
  origin?: string;
  href?: string;
  WebSocketImpl?: typeof WebSocket;
  fetchImpl?: typeof fetch;
  doc?: Document;
  version?: string;
}

const STEPS: StepId[] = ['language', 'network', 'name', 'update', 'remote', 'ready']

/** The step a write is about, so a lost write can be settled by the next state. */
const stepOf = (path: string, body: Record<string, unknown>): StepId | null => {
  const [first] = path.replace(`${SETUP_PATH}/`, '').replace(/^\//, '').split('/')
  if (first === 'skip' && typeof body.step === 'string') return body.step as StepId
  return (STEPS as string[]).includes(first) ? first as StepId : null
}

/** Moonraker wraps every HTTP answer in `{ result }`; the socket does not. */
const unwrap = <T>(json: unknown): T => (
  json && typeof json === 'object' && 'result' in json ? (json as { result: T }).result : json as T
)

export const createSetupClient = (options: SetupClientOptions = {}): SetupClient => {
  const origin = options.origin ?? window.location.origin
  const href = options.href ?? window.location.href
  const WebSocketImpl = options.WebSocketImpl ?? window.WebSocket
  const doFetch = options.fetchImpl ?? ((input: RequestInfo | URL, init?: RequestInit) => window.fetch(input, init))
  const doc = options.doc ?? document
  const version = options.version ?? `${import.meta.env.VERSION || '0.0.0'}`
  const driverKind = new URL(origin).hostname === HOTSPOT_ADDRESS ? 'phone' : 'web'

  let running = false
  let socket: WebSocket | null = null
  let socketOpen = false
  let failedBeforeOpen = false
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let renewTimer: ReturnType<typeof setInterval> | null = null
  let reconnectWaitsForVisible = false
  let rpcId = 0

  const visible = () => doc.visibilityState !== 'hidden'

  const request = async (path: string, init: RequestInit = {}, timeoutMs = WRITE_TIMEOUT_MS) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await doFetch(`${origin}${path}`, { ...init, signal: controller.signal, cache: 'no-store' })
      const json = await response.json().catch(() => null)
      if (!response.ok) {
        const message = (json as { error?: { message?: string } } | null)?.error?.message ?? response.statusText
        throw new SetupHttpError(response.status, message)
      }
      return json
    } finally {
      clearTimeout(timer)
    }
  }

  const get = async (): Promise<SetupState | null> => {
    try {
      const state = unwrap<SetupState>(await request(SETUP_PATH))
      applyState(state)
      return state
    } catch {
      return null
    }
  }

  const startPolling = () => {
    if (pollTimer !== null) return
    pollTimer = setInterval(() => { if (!socketOpen) get() }, POLL_INTERVAL_MS)
  }

  const stopPolling = () => {
    if (pollTimer !== null) clearInterval(pollTimer)
    pollTimer = null
  }

  const oneshotToken = async (): Promise<string | null> => {
    try {
      const token = unwrap<unknown>(await request('/access/oneshot_token'))
      return typeof token === 'string' ? token : null
    } catch {
      return null
    }
  }

  const scheduleReconnect = () => {
    if (!running || reconnectTimer !== null) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      if (!visible()) {
        reconnectWaitsForVisible = true
        return
      }
      openSocket()
    }, RECONNECT_INTERVAL_MS)
  }

  const onSocketLost = (lost: WebSocket) => {
    if (socket !== lost) return
    if (!socketOpen) failedBeforeOpen = true
    socket = null
    socketOpen = false
    if (!running) return
    setConnection('reconnecting')
    startPolling()
    scheduleReconnect()
  }

  const onMessage = (event: MessageEvent) => {
    let message: { method?: string, params?: unknown[], id?: number, error?: { code?: number } }
    try {
      message = JSON.parse(typeof event.data === 'string' ? event.data : '')
    } catch {
      return
    }
    if (message.method === 'notify_muon_setup_changed' && Array.isArray(message.params)) {
      applyState(message.params[0] as SetupState)
    } else if (message.error?.code === 401) {
      // Not a trusted client after all: retry with a one-shot token.
      failedBeforeOpen = true
      socket?.close()
    }
  }

  const openSocket = async () => {
    if (!running || socket) return
    // A socket that never opened may have been refused for want of a token.
    const token = failedBeforeOpen ? await oneshotToken() : null
    if (!running || socket) return
    const url = `${origin.replace(/^http/, 'ws')}/websocket${token ? `?token=${encodeURIComponent(token)}` : ''}`
    let ws: WebSocket
    try {
      ws = new WebSocketImpl(url)
    } catch {
      scheduleReconnect()
      return
    }
    socket = ws
    ws.onopen = () => {
      if (socket !== ws) return
      socketOpen = true
      failedBeforeOpen = false
      setConnection('connected')
      stopPolling()
      ws.send(JSON.stringify({
        jsonrpc: '2.0',
        method: 'server.connection.identify',
        params: { client_name: 'muon-setup', version, type: 'web', url: href },
        id: ++rpcId
      }))
      // Whatever changed while the page could not hear the printer.
      get()
    }
    ws.onmessage = onMessage
    ws.onclose = () => onSocketLost(ws)
    ws.onerror = () => onSocketLost(ws)
  }

  const post = async (
    path: string,
    body: Record<string, unknown> = {},
    opts: { timeoutMs?: number, rev?: boolean } = {}
  ): Promise<SetupResult | null> => {
    const fullPath = path.startsWith('/') ? path : `${SETUP_PATH}/${path}`
    const payload = opts.rev === false || 'rev' in body
      ? body
      : { ...body, rev: setupState.state?.rev ?? 0 }
    let json: unknown
    try {
      json = await request(fullPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }, opts.timeoutMs ?? WRITE_TIMEOUT_MS)
    } catch (error) {
      if (error instanceof SetupHttpError) throw error
      // No answer. Not a failure: wait for the state to say what happened.
      setupState.lostWrite = { step: stepOf(fullPath, body), failed: false }
      get()
      return null
    }
    const result = unwrap<SetupResult>(json)
    if (result?.state) applyState(result.state)
    return result
  }

  const claimDriver = () => post('driver', { kind: driverKind, client_id: setupState.local.clientId })

  // While this page holds the driver and is on screen, it says so every 10 s.
  const renew = () => {
    if (!running || !visible()) return
    if (setupState.state?.driver?.client_id !== setupState.local.clientId) return
    claimDriver().catch(() => {})
  }

  const onVisibilityChange = () => {
    if (!visible()) return
    if (reconnectWaitsForVisible) {
      reconnectWaitsForVisible = false
      openSocket()
    }
    renew()
  }

  return {
    start () {
      if (running) return
      running = true
      setConnection('connecting')
      startPolling()
      get()
      openSocket()
      renewTimer = setInterval(renew, DRIVER_RENEW_INTERVAL_MS)
      doc.addEventListener('visibilitychange', onVisibilityChange)
    },

    stop () {
      running = false
      stopPolling()
      if (reconnectTimer !== null) clearTimeout(reconnectTimer)
      if (renewTimer !== null) clearInterval(renewTimer)
      reconnectTimer = null
      renewTimer = null
      doc.removeEventListener('visibilitychange', onVisibilityChange)
      const ws = socket
      socket = null
      socketOpen = false
      ws?.close()
    },

    get,
    post,
    claimDriver,

    async networks (rescan: boolean) {
      return unwrap<NetworksResult>(await request(`${SETUP_PATH}/networks?rescan=${rescan}`, {}, SCAN_TIMEOUT_MS))
    },

    async options (country?: string, language?: string) {
      const query = new URLSearchParams()
      if (country) query.set('country', country)
      if (language) query.set('language', language)
      const suffix = query.toString() ? `?${query}` : ''
      return unwrap<SetupOptions>(await request(`${SETUP_PATH}/options${suffix}`))
    },

    async uploadCaCert (file: File) {
      const form = new FormData()
      form.append('file', file, file.name)
      return unwrap<{ ok: boolean, ca_cert_id?: string, error?: SetupError }>(
        await request(`${SETUP_PATH}/network/ca_cert`, { method: 'POST', body: form })
      )
    }
  }
}

let instance: SetupClient | null = null

/** The page's one client, made on first use. */
export const setupClient = (): SetupClient => {
  instance ??= createSetupClient()
  return instance
}
