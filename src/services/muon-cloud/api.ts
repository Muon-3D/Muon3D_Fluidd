/**
 * The Muon3D account console's HTTP API.
 *
 * Fluidd is served either by the printer (LAN) or by the console itself. In
 * both cases the console is reached at `cloudBaseUrl()`: the page's own origin
 * when the console serves Fluidd, or the URL saved in `muon.cloud.url`.
 */

import { clearDeletion, deletionRevision, observeDeletion } from './deletion'
export { deletionState } from './deletion'

export const TOKEN_KEY = 'muon.cloud.token'
/** Only a central-login session (`WEB-12`) has one; it refreshes at `/token`. */
export const REFRESH_KEY = 'muon.cloud.refresh'
const URL_KEY = 'muon.cloud.url'

/** This surface's id in the console's client registry (`clients.json`). */
export const CLIENT_ID = 'fluidd'

export interface CloudAccount {
  id: string;
  email: string;
  name: string;
  created_at: number;
  deletion?: { requested_at: number, delete_after: number } | null;
}

export interface CloudPrinter {
  id: string;
  name: string;
  model: string;
  version: string;
  linked_at: number;
  last_seen: number;
  online: boolean;
  online_since: number | null;
  /**
   * The account's role on this printer: `operator` for a printer the
   * account linked (its owner) or a share to operate it, `viewer` for a
   * share to watch it. Absent from an older console.
   */
  role?: 'operator' | 'viewer';
  /** A live share to this account, not a printer it linked. */
  shared?: boolean;
  /** When a share ends (seconds), or null. */
  ends_at?: number | null;
  /** The sharer's display name (never an address), on a shared printer. */
  shared_by?: string | null;
  /** The same sharer, structured (muon-link-cloud #115). */
  sharer?: Sharer | null;
  /** Who finds the printer in the nearby list. Only on a printer this account linked (#114). */
  discovery?: DiscoveryLevel | null;
}

export interface Sharer {
  account_id: string;
  display_name: string;
}

/** `open` everyone; `signed_in` anyone signed in; `chosen` you and people you share with; `link` you and anyone with an invite link. */
export type DiscoveryLevel = 'open' | 'signed_in' | 'chosen' | 'link'

/** A note for the signed-in account (muon-link-cloud #116). Newest first. */
export interface Notice {
  id: string;
  kind: string;
  printer_id: string | null;
  shared_by: string | null;
  sharer: Sharer | null;
  created_at: number;
  read_at: number | null;
}

export interface CloudConfig {
  relay_url: string;
  orchestrator_id: string;
  authority_key: string;
}

export interface AccessHandoff {
  printer_id: string;
  relay_url: string;
  role: string;
  grant_id: string;
  expires_at: number;
}

export type LinkState = 'waiting' | 'awaiting_confirmation' | 'linked' | 'declined' | 'expired'

/** What `POST /token` answers: a rotating session issued to this client. */
export interface TokenSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  account?: CloudAccount;
}

export interface Approval {
  id: string;
  kind: 'link_join';
  printer_id: string;
  printer_name: string;
  link_id: string;
  role: string;
  state: 'pending' | 'allowed' | 'refused' | 'expired';
  created_at: number;
  expires_at: number;
  answered_at: number | null;
}

export interface Share {
  id: string;
  printer_id: string;
  email: string;
  role: string;
  level: string;
  ends_at: number | null;
  created_at: number;
}

export type JoinAnswer =
  | { state: 'joined', printer_id: string, share: Share }
  | { state: 'pending', printer_id: string, approval: Approval }

export class CloudError extends Error {
  constructor (message: string, readonly status: number, readonly code?: string, readonly body: Record<string, unknown> = {}, readonly retryAfterMs?: number) {
    super(message)
  }

  get deletionPending (): boolean {
    return this.status === 403 && this.body.deletion_pending === true
  }
}

function readStorage (key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage (key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Private mode: the session lasts as long as the tab.
  }
}

/**
 * The production console's two names (KAN-414). control.muon3d.com is its name
 * from KAN-404 on; app.muon3d.com keeps answering while printers and installed
 * apps still use it. The console serves this page under either, and both are
 * the same console: the same accounts, sessions and codes.
 */
export const CONSOLE_ORIGINS: readonly string[] = ['https://control.muon3d.com', 'https://app.muon3d.com']

/** Whether `a` and `b` are one console: the same origin, or its two names. */
export function sameConsole (a: string, b: string): boolean {
  const x = a.replace(/\/$/, '')
  const y = b.replace(/\/$/, '')
  return x === y || (CONSOLE_ORIGINS.includes(x) && CONSOLE_ORIGINS.includes(y))
}

export function cloudBaseUrl (): string {
  // A saved console address is honoured only where the page's storage can be
  // trusted. On a plain-HTTP page anything on the network can write it, and
  // would choose where the page's calls and "open" links go (KAN-2192).
  const saved = cloudTokensPersist() ? readStorage(URL_KEY) : null
  if (saved) return saved.replace(/\/$/, '')
  // A page the console serves talks to the console under the name it was
  // opened by, whichever name the build was made for: its sign-in, its cookie
  // and its redirect URI all belong to that name.
  if (CONSOLE_ORIGINS.includes(window.location.origin)) return window.location.origin
  const configured = import.meta.env.VUE_MUON_CLOUD_URL as string | undefined
  if (configured) return configured.replace(/\/$/, '')
  return window.location.origin
}

export function setCloudBaseUrl (url: string | null) {
  writeStorage(URL_KEY, url)
}

/**
 * Whether cloud tokens may sit in localStorage on this origin (KAN-1800,
 * H2/B9). Plain HTTP on the printer's own address (`*.local`, 10.42.0.1 on
 * the hotspot, any LAN IP) lets anyone on the network read or inject script
 * into the origin, so the long-lived pair must not outlive the tab there.
 * HTTPS and loopback (a secure context, and the dev server) keep it.
 */
export function cloudTokensPersist (location: Pick<Location, 'protocol' | 'hostname'> | undefined = globalThis.location): boolean {
  // No page (a worker or a test in node): nothing to judge, keep the old path.
  if (!location) return true
  return location.protocol === 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
}

/**
 * Whether this page may hold a Muon3D account session at all (KAN-2192, the
 * whole of H2/B9: "no credential may ever be stored or used on an http://
 * origin"). The plain-HTTP printer address has to stay for the hotspot, setup
 * with no internet and `muon3d.local`, and anyone on the network can answer
 * for it or change the page. So there the page takes no password, holds no
 * token even in memory, and never makes or reads the browser's Iroh key:
 * account features are one link to the console (`controlUrl`). HTTPS and
 * loopback keep the session.
 */
export function cloudSessionAllowed (location: Pick<Location, 'protocol' | 'hostname'> | undefined = globalThis.location): boolean {
  // No page to judge: refuse. A gate does not pass what it cannot see.
  if (!location) return false
  return cloudTokensPersist(location)
}

/** The console page that does what this page may not: `route` is a hash route such as `/account`. */
export function controlUrl (route = '/'): string {
  const base = (import.meta.env.VUE_MUON_CLOUD_URL as string | undefined)?.replace(/\/$/, '') || CONSOLE_ORIGINS[0]
  return `${base}/#${route.startsWith('/') ? route : `/${route}`}`
}

/** What every refused account call on a plain-HTTP page says. */
export const INSECURE_ORIGIN_MESSAGE = 'This page is not encrypted, so it cannot sign in to Muon3D. Open Muon Control to use your account.'

function refuseOnInsecureOrigin (): never {
  throw new CloudError(INSECURE_ORIGIN_MESSAGE, 0, 'insecure_origin')
}

// The only console calls a plain-HTTP page makes: the two that need no
// account and carry nothing of the person's. An allow-list, so a route added
// later is refused there until somebody decides it is safe.
const INSECURE_ORIGIN_CALLS: readonly string[] = ['GET /v1/config', 'GET /v1/links/nearby']

function readTokenStorage (key: string): string | null {
  if (cloudSessionAllowed()) return readStorage(key)
  return null
}

function writeTokenStorage (key: string, value: string | null) {
  // Not allowed: the token is dropped, not kept in memory. Nothing to read
  // means nothing for injected script to take.
  if (cloudSessionAllowed()) writeStorage(key, value)
}

// Migration: an older build stored the pair in localStorage on this origin.
// Remove it on first load so it cannot be read later.
try {
  if (!cloudTokensPersist()) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  }
} catch {
  // No storage: nothing to clear.
}

export function storedToken (): string | null {
  return readTokenStorage(TOKEN_KEY)
}

export function storeToken (token: string | null) {
  writeTokenStorage(TOKEN_KEY, token)
  if (token === null) clearDeletion()
}

export function storedRefreshToken (): string | null {
  return readTokenStorage(REFRESH_KEY)
}

export function storeRefreshToken (token: string | null) {
  // A new session (or none) starts with no refresh backoff: a sign-out and
  // sign-in must not inherit the old session's wait.
  if (token !== readTokenStorage(REFRESH_KEY)) resetRefreshBackoff()
  writeTokenStorage(REFRESH_KEY, token)
}

/**
 * `POST /token` (RFC 6749, form-encoded). A failure is OAuth's
 * `{error, error_description}`, not the API's sentence shape.
 */
async function tokenRequest (form: Record<string, string>, signal?: AbortSignal): Promise<TokenSession> {
  // KAN-2192: a code or a refresh token is a credential; none leaves a plain-HTTP page.
  if (!cloudSessionAllowed()) refuseOnInsecureOrigin()
  let response: Response
  try {
    response = await fetch(`${cloudBaseUrl()}/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
      signal
    })
  } catch {
    throw new CloudError('The Muon3D service could not be reached.', 0)
  }
  let data: any = {}
  try {
    data = await response.json()
  } catch {
    throw new CloudError('The Muon3D service sent an unreadable answer.', response.status)
  }
  if (!response.ok || typeof data.access_token !== 'string') {
    throw new CloudError(data.error_description ?? data.error ?? `The Muon3D service answered ${response.status}.`, response.status, data.error, {}, retryAfterOf(response))
  }
  return data as TokenSession
}

/** A `Retry-After` header (seconds, or an HTTP date) in milliseconds; undefined when absent or unreadable. */
export function retryAfterOf (response: Response, now = Date.now()): number | undefined {
  const raw = response.headers?.get?.('retry-after')
  if (!raw) return undefined
  const text = raw.trim()
  if (/^\d+$/.test(text)) return Number(text) * 1000
  const at = Date.parse(text)
  return Number.isNaN(at) ? undefined : Math.max(0, at - now)
}

/** The first wait after a refresh the console could not take now, doubling per failure to the cap. */
export const REFRESH_BACKOFF_BASE_MS = 2000
export const REFRESH_BACKOFF_CAP_MS = 5 * 60 * 1000
/** The longest `Retry-After` believed. */
export const REFRESH_RETRY_AFTER_CAP_MS = 15 * 60 * 1000

let refreshNotBefore = 0
let refreshBackoffs = 0

/** For tests: forget any refresh backoff. */
export function resetRefreshBackoff () {
  refreshNotBefore = 0
  refreshBackoffs = 0
}

/**
 * A refresh answer that says nothing about the session: the rate limit (429)
 * or the console failing (5xx). The session is kept and the next refresh
 * waits: the console's `Retry-After` if it sent one, else 2 s doubling to 5 min.
 */
function isTransientRefusal (error: unknown): error is CloudError {
  return error instanceof CloudError && (error.status === 429 || error.status >= 500)
}

function backOffRefresh (error: CloudError) {
  // A Retry-After of 0 or a date in the past still waits the base step, so a
  // console that keeps answering 429 is not asked again on every call.
  const wait = error.retryAfterMs !== undefined
    ? Math.max(REFRESH_BACKOFF_BASE_MS, Math.min(error.retryAfterMs, REFRESH_RETRY_AFTER_CAP_MS))
    : Math.min(REFRESH_BACKOFF_CAP_MS, REFRESH_BACKOFF_BASE_MS * 2 ** refreshBackoffs)
  refreshBackoffs += 1
  refreshNotBefore = Date.now() + wait
}

/** What a refresh came to: a new pair, a refusal (the session is over), or no answer (it is not). */
export type RefreshOutcome = 'ok' | 'refused' | 'unreachable'

let refreshing: Promise<RefreshOutcome> | null = null

/** The lock and channel name every tab of this origin shares. */
const REFRESH_LOCK = 'muon.cloud.refresh'
/** The longest a `/token` refresh may take. A hung one must not hold every tab. */
export const REFRESH_TIMEOUT_MS = 10000
/** How long a fallback holder is believed without a release: the refresh timeout and some margin. */
const HOLD_MS = REFRESH_TIMEOUT_MS + 3000
/** Time for other tabs' claims to arrive before the fallback decides who is first. */
const CLAIM_SETTLE_MS = 50

/**
 * What to try when the console refuses a refresh, before the session is
 * dropped: the central login registers a silent `/authorize?prompt=none`
 * check. `failedRefresh` is the refresh token that was refused; the check
 * stores nothing unless that is still the stored one. True when it stored a
 * new pair.
 */
let recoverSession: ((failedRefresh: string) => Promise<boolean>) | null = null

export function setSessionRecovery (recover: ((failedRefresh: string) => Promise<boolean>) | null) {
  recoverSession = recover
}

/**
 * Runs `work` with no other tab of this origin refreshing: a refresh token
 * used twice ends its session, and the tokens sit in localStorage that every
 * tab shares. `navigator.locks` where there is one; else a BroadcastChannel
 * queue (`channelLock`).
 */
export async function withRefreshLock<T> (work: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? (navigator as any).locks : undefined
  if (locks && typeof locks.request === 'function') {
    return locks.request(REFRESH_LOCK, work) as Promise<T>
  }
  if (typeof BroadcastChannel === 'undefined') return work()
  return channelLock(work)
}

/**
 * The fallback for a browser without `navigator.locks`. Each tab announces a
 * claim with an id that sorts by time; the lowest live id holds. A claim is
 * answered once, with a `present` that nobody answers, so there is no
 * exchange to loop. A tab waits only for lower ids, each of which ends with a
 * `release` or, if its tab died, expires after HOLD_MS; so waiters run one
 * after another, and each re-reads the stored pair in `work`.
 */
async function channelLock<T> (work: () => Promise<T>): Promise<T> {
  const channel = new BroadcastChannel(REFRESH_LOCK)
  const id = `${Date.now().toString(36).padStart(10, '0')}-${Math.random().toString(36).slice(2)}`
  const others = new Map<string, number>()
  let wake: (() => void) | null = null
  channel.onmessage = (event: MessageEvent) => {
    const message = event.data as { type?: string, id?: string } | null
    if (!message || typeof message.id !== 'string' || message.id === id) return
    if (message.type === 'claim') {
      if (!others.has(message.id)) channel.postMessage({ type: 'present', id })
      others.set(message.id, Date.now() + HOLD_MS)
    } else if (message.type === 'present') {
      if (!others.has(message.id)) others.set(message.id, Date.now() + HOLD_MS)
    } else if (message.type === 'release') {
      others.delete(message.id)
    }
    wake?.()
  }
  try {
    channel.postMessage({ type: 'claim', id })
    await new Promise(resolve => setTimeout(resolve, CLAIM_SETTLE_MS))
    for (;;) {
      const now = Date.now()
      let soonest = Infinity
      let blocked = false
      for (const [other, expires] of others) {
        if (expires <= now) others.delete(other)
        else if (other < id) {
          blocked = true
          soonest = Math.min(soonest, expires)
        }
      }
      if (!blocked) break
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, Math.max(0, soonest - now))
        wake = () => { clearTimeout(timer); resolve() }
      })
      wake = null
    }
    return await work()
  } finally {
    channel.postMessage({ type: 'release', id })
    channel.close()
  }
}

/**
 * Swaps the stored refresh token for a new pair, once at a time across every
 * tab: a refresh token used twice ends its session, so two requests (here or
 * in another tab) that both met a 401 must share one refresh. Under the lock
 * the stored pair is read again; if another tab already rotated it, that new
 * pair is used and nothing is spent. When the console refuses, a silent
 * sign-in is tried once before both tokens are dropped, and only if the
 * refused token is still the stored one (a sign-out or a new sign-in since
 * leaves storage alone). A console that cannot be reached, or is too slow,
 * leaves the session as it is: `'unreachable'`.
 */
export function refreshOutcome (): Promise<RefreshOutcome> {
  const refreshToken = storedRefreshToken()
  if (!refreshToken) return Promise.resolve('refused')
  // Backing off after a 429 or a 5xx: the session stands, ask again later.
  if (!refreshing && Date.now() < refreshNotBefore) return Promise.resolve('unreachable')
  if (!refreshing) {
    refreshing = withRefreshLock(async (): Promise<RefreshOutcome> => {
      const current = storedRefreshToken()
      if (current !== refreshToken) {
        // Rotated by another tab while this one waited for the lock, or signed out.
        return current !== null && storedToken() !== null ? 'ok' : 'refused'
      }
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS)
      try {
        const session = await tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: CLIENT_ID }, controller.signal)
        storeToken(session.access_token)
        storeRefreshToken(session.refresh_token)
        resetRefreshBackoff()
        return 'ok'
      } catch (error) {
        // Not reaching the console says nothing about the session. Nor does
        // a rate limit or a console error: only a refusal ends it (KAN-1472).
        if (error instanceof CloudError && error.status === 0) return 'unreachable'
        if (isTransientRefusal(error)) {
          backOffRefresh(error)
          return 'unreachable'
        }
        try {
          if (recoverSession && storedRefreshToken() === refreshToken && await recoverSession(refreshToken)) return 'ok'
        } catch { /* fall through to dropping */ }
        if (storedRefreshToken() === refreshToken) {
          storeToken(null)
          storeRefreshToken(null)
        }
        return 'refused'
      } finally {
        clearTimeout(timer)
      }
    })
      .catch((): RefreshOutcome => 'unreachable')
      .finally(() => { refreshing = null })
  }
  return refreshing
}

/** `refreshOutcome` as a yes or no: whether there is a fresh pair to use. */
export async function refreshSession (): Promise<boolean> {
  return (await refreshOutcome()) === 'ok'
}

async function request<T> (method: string, path: string, body?: unknown, token: string | null = storedToken(), retry = true): Promise<T> {
  // KAN-2192: no bearer and no password leaves a plain-HTTP page, whoever asks.
  if (!cloudSessionAllowed() && (token || !INSECURE_ORIGIN_CALLS.includes(`${method} ${path}`))) refuseOnInsecureOrigin()
  const startedAt = deletionRevision()
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'
  let response: Response
  try {
    response = await fetch(`${cloudBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  } catch {
    throw new CloudError('The Muon3D service could not be reached.', 0)
  }
  // A central-login access token lasts 15 minutes. Refresh once and retry;
  // only for the stored session, never for a token passed in.
  if (response.status === 401 && retry && token !== null) {
    // Another request may already have rotated the pair while this one's
    // response was in flight. Reuse that pair rather than refusing the late
    // response or spending the new refresh token again.
    const currentToken = storedToken()
    if (currentToken && token !== currentToken) {
      return request<T>(method, path, body, storedToken(), false)
    }
    if (currentToken) {
      const outcome = await refreshOutcome()
      if (outcome === 'ok') return request<T>(method, path, body, storedToken(), false)
      // The console did not answer: that is not a sign-out, so do not look like one.
      if (outcome === 'unreachable') throw new CloudError('The Muon3D service could not be reached.', 0)
    }
  }
  const text = await response.text()
  let data: any = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new CloudError('The Muon3D service sent an unreadable answer.', response.status)
  }
  if (!response.ok) {
    if (token !== null && token === storedToken()) observeDeletion(method, path, response.status, data, startedAt)
    const message = response.status === 403 && data.deletion_pending === true
      ? 'Your account is waiting to be deleted.'
      : data.error ?? `The Muon3D service answered ${response.status}.`
    throw new CloudError(message, response.status, undefined, data)
  }
  if (token !== null && token === storedToken()) observeDeletion(method, path, response.status, data, startedAt)
  return data as T
}

export const cloudApi = {
  config: () => request<CloudConfig>('GET', '/v1/config'),
  signIn: (email: string, password: string) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-in', { email, password }),
  /** The code that finishes a two-step sign-in: an authenticator code or a recovery code, with the `mfa_token` the password step answered. */
  signInCode: (mfaToken: string, code: string) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/mfa', { mfa_token: mfaToken, code }, null, false),
  signUp: (email: string, password: string, name: string, declaredAge?: number) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-up', { email, password, name, declared_age: declaredAge }),
  signOut: () => request<{ ok: boolean }>('POST', '/v1/auth/sign-out'),
  me: () => request<{ account: CloudAccount, endpoint_id: string | null }>('GET', '/v1/me'),
  /**
   * A signed assertion of this account for another Muon3D service (the
   * model service's Library), which never sees the console session. It lives
   * minutes; `expires_at` is in seconds.
   */
  assertion: (audience: string) =>
    request<{ assertion: string, expires_at: number }>('POST', '/v1/me/assertion', { audience }),
  registerEndpoint: (endpointId: string) =>
    request<{ endpoint_id: string }>('PUT', '/v1/me/endpoint', { endpoint_id: endpointId }),
  printers: () => request<{ printers: CloudPrinter[] }>('GET', '/v1/printers'),
  renamePrinter: (id: string, name: string) =>
    request<{ ok: boolean, name: string }>('PATCH', `/v1/printers/${id}`, { name }),
  /** The owner sets who finds the printer. `404` for anyone else, `400` for an unknown level. */
  setDiscovery: (id: string, level: DiscoveryLevel) =>
    request<{ ok: boolean, level: DiscoveryLevel }>('PUT', `/v1/printers/${id}/discovery`, { level }),
  notices: (limit = 50) =>
    request<{ notices: Notice[], unread: number, next: string | null }>('GET', `/v1/me/notices?limit=${limit}`),
  readNotice: (id: string) =>
    request<{ notice: Notice }>('POST', `/v1/me/notices/${encodeURIComponent(id)}/read`),
  unlinkPrinter: (id: string) => request<{ ok: boolean }>('DELETE', `/v1/printers/${id}`),
  access: (id: string) => request<AccessHandoff>('POST', `/v1/printers/${id}/access`),
  /** Claims the printer showing `code` on its screen. The code is the only way to link. */
  claim: (code: string) =>
    request<{ printer_id: string, name: string, state: LinkState, expires_at: number }>('POST', '/v1/links/claim', { code }),
  /** Asks a printer on this browser's network to show a link code. Links nothing by itself. */
  startLink: (printerId: string) => request<{ ok: boolean }>('POST', '/v1/links/start', { printer_id: printerId }),
  /** Printers on this browser's network, as the Muon3D service sees them. No sign-in needed. */
  nearby: () =>
    request<{ printers: Array<{ printer_id: string, name: string, model: string, linked: boolean, local_addrs?: string[] }> }>('GET', '/v1/links/nearby'),
  linkState: (id: string) => request<{ printer_id: string, state: LinkState }>('GET', `/v1/links/${id}`),
  getLayout: () => request<{ layout: any }>('GET', '/v1/fleet/layout'),
  putLayout: (layout: unknown) => request<{ ok: boolean }>('PUT', '/v1/fleet/layout', { layout }),
  /** The central login's code exchange (`WEB-12`). */
  exchangeCode: (code: string, redirectUri: string, verifier: string, signal?: AbortSignal) =>
    tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: CLIENT_ID, code_verifier: verifier }, signal),
  /**
   * A single-use code that opens the console's browser session at
   * `/handoff`. Takes the token of a session that signed in here, which is
   * never a `/token` session (those get `403`).
   */
  handoff: (token: string) =>
    request<{ code: string, url: string, expires_at: number }>('POST', '/v1/handoff', undefined, token, false),
  /** Signs in with a password for a session that is not kept: the sign-in page hands it off. */
  signInFor: (email: string, password: string) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-in', { email, password, device: 'Muon3D sign-in' }, null, false),
  signUpFor: (email: string, password: string, name: string, declaredAge?: number) =>
    request<{ token: string, account: CloudAccount }>('POST', '/v1/auth/sign-up', { email, password, name, declared_age: declaredAge, device: 'Muon3D sign-in' }, null, false),
  /** Joins with an invite link's code (AB-CON-1). */
  join: (code: string) => request<JoinAnswer>('POST', `/v1/links/join/${encodeURIComponent(code)}`),
  approval: (id: string) => request<{ approval: Approval }>('GET', `/v1/approvals/${encodeURIComponent(id)}`)
}
