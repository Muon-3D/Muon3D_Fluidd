import Vue from 'vue'

/**
 * The owner's network routes, `/muon-link/network/*` (KAN-1565).
 *
 * muon-link answers them over the printer connection and never forwards them
 * to Moonraker; the contract is docs/NETWORK_ROUTES.md in muon-link. They let
 * the printer's owner change Wi-Fi and the hotspot without being at the panel,
 * under three owner rules, one per kind of path the connection arrives on.
 *
 * Nothing here logs or returns a request body: they carry passphrases.
 */

export const NETWORK_PREFIX = '/muon-link/network'

/** The class of the path this connection arrives on, as muon-link classifies it. */
export type NetworkPath = 'ble' | 'local' | 'direct_wan' | 'relay'
export type NetworkRule = 'allow' | 'reauth' | 'deny'

export interface NetworkSettings {
  /** Over Bluetooth. */
  fromBle: NetworkRule;
  /** On the printer's own network (the contract calls it network_from_direct). */
  fromLocal: NetworkRule;
  /** Over the internet (relay and direct_wan). */
  fromRelay: NetworkRule;
  currentPath: NetworkPath;
}

export type NetworkSettingsChange = Partial<Pick<NetworkSettings, 'fromBle' | 'fromLocal' | 'fromRelay'>>

export const NETWORK_RULES: NetworkRule[] = ['allow', 'reauth', 'deny']

const PATHS: NetworkPath[] = ['ble', 'local', 'direct_wan', 'relay']

/** What went wrong, as one of a few states a person can be told about. */
export type NetworkErrorKind =
  /** 404: this printer's muon-link predates the routes. */
  | 'not_available'
  /** 403 forbidden: this session is not the owner. */
  | 'not_owner'
  /** 403 reauth_required: the owner asked to sign in again on this path. */
  | 'reauth_required'
  /** 403 path_disabled: the owner blocked this path. */
  | 'path_disabled'
  /** 502: muon-link could not reach the printer's network service. */
  | 'aux_unavailable'
  /** 504: the printer's network service did not answer in time. */
  | 'aux_timeout'
  /** The network service said no and said why (a wrong password, a bad name). */
  | 'refused'
  /** Anything else, including a connection that dropped. */
  | 'failed'

const EXPLANATIONS: Record<NetworkErrorKind, string> = {
  not_available: "This printer's software can't change the network from here yet. Update it, then try again.",
  not_owner: 'Only the printer\'s owner can change the network from here.',
  reauth_required: 'Sign in again required to change Wi-Fi over the internet.',
  path_disabled: 'Blocked in your network settings.',
  aux_unavailable: "The printer's network service isn't answering. Try again in a moment.",
  aux_timeout: 'The printer took too long to answer. Try again in a moment.',
  refused: 'The printer refused that change.',
  failed: "Couldn't reach the printer. Check the connection and try again."
}

/** Why a Wi-Fi join failed, by the printer's own code. */
const JOIN_FAILURES: Record<string, string> = {
  wrong_password: "That password didn't work.",
  ssid_not_found: "The printer can't see that network from where it is.",
  timeout: 'The printer waited, but the network never let it join.',
  no_address: 'The printer joined, but the network gave it no address.'
}

/** A refusal with its kind, a plain-words message, and the HTTP status if there was one. */
export class OwnerNetworkError extends Error {
  constructor (readonly kind: NetworkErrorKind, message: string, readonly status?: number) {
    super(message)
    this.name = 'OwnerNetworkError'
  }
}

/** What to tell a person for an error kind. */
export function explainNetworkError (kind: NetworkErrorKind): string {
  return EXPLANATIONS[kind]
}

interface FailedResponse {
  status: number;
  data?: unknown;
}

function bodyOf (data: unknown): unknown {
  if (typeof data === 'string') {
    try { return JSON.parse(data) } catch { return data }
  }
  return data
}

function codeOf (data: unknown): string | undefined {
  const body = bodyOf(data)
  const error = (body as { error?: unknown } | null)?.error
  return typeof error === 'string' ? error : undefined
}

/** The printer's own words for a refusal: `{detail: {code, message}}`, or a string detail. */
function detailOf (data: unknown): { code?: string, message?: string } {
  const detail = (bodyOf(data) as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return { message: detail }
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    const { code, message } = detail as { code?: unknown, message?: unknown }
    return {
      code: typeof code === 'string' ? code : undefined,
      message: typeof message === 'string' ? message : undefined
    }
  }
  return {}
}

/** What a failed call means, as an error a person can be shown. */
export function networkErrorOf (error: unknown): OwnerNetworkError {
  if (error instanceof OwnerNetworkError) return error
  const response = (error as { response?: FailedResponse } | null)?.response
  if (!response) return new OwnerNetworkError('failed', EXPLANATIONS.failed)

  const { status, data } = response
  const code = codeOf(data)
  const make = (kind: NetworkErrorKind) => new OwnerNetworkError(kind, EXPLANATIONS[kind], status)

  if (status === 404 && !code) return make('not_available')
  if (status === 403) {
    if (code === 'reauth_required') return make('reauth_required')
    if (code === 'path_disabled') return make('path_disabled')
    if (code === 'forbidden') return make('not_owner')
    return make('refused')
  }
  if (status === 502) return make('aux_unavailable')
  if (status === 504) return make('aux_timeout')

  const detail = detailOf(data)
  if (detail.code && JOIN_FAILURES[detail.code]) {
    return new OwnerNetworkError('refused', JOIN_FAILURES[detail.code], status)
  }
  if (status >= 400 && status < 500) {
    return new OwnerNetworkError('refused', detail.message || EXPLANATIONS.refused, status)
  }
  return make('failed')
}

/** The Aux API wraps some answers as `{result}`; Fluidd's own Aux client unwraps them too. */
function unwrap (data: unknown): unknown {
  const body = bodyOf(data)
  return body && typeof body === 'object' && !Array.isArray(body) && 'result' in body
    ? (body as { result: unknown }).result
    : body
}

async function call (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: Record<string, unknown>
): Promise<{ status: number, data: unknown }> {
  try {
    const response = await Vue.$httpClient.request({
      method,
      url: `${NETWORK_PREFIX}${path}`,
      data: body,
      // Never let a rejected body be cached or echoed: only the status matters on failure.
      validateStatus: status => status >= 200 && status < 300
    })
    return { status: response.status, data: unwrap(response.data) }
  } catch (error) {
    throw networkErrorOf(error)
  }
}

function ruleOf (value: unknown, fallback: NetworkRule): NetworkRule {
  return NETWORK_RULES.includes(value as NetworkRule) ? value as NetworkRule : fallback
}

function settingsOf (data: unknown): NetworkSettings {
  const body = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  // Tolerate the rules sitting under a `settings` key.
  const rules = (body.settings && typeof body.settings === 'object' ? body.settings : body) as Record<string, unknown>
  const path = (body.current_path ?? rules.current_path) as NetworkPath
  if (!PATHS.includes(path)) throw new OwnerNetworkError('failed', EXPLANATIONS.failed)
  return {
    // The device's defaults, if a rule is missing: allow, allow, reauth.
    fromBle: ruleOf(rules.network_from_ble, 'allow'),
    fromLocal: ruleOf(rules.network_from_direct, 'allow'),
    fromRelay: ruleOf(rules.network_from_relay, 'reauth'),
    currentPath: path
  }
}

/** The three owner rules and the path this connection arrived on. */
export async function getNetworkSettings (): Promise<NetworkSettings> {
  return settingsOf((await call('GET', '/settings')).data)
}

/** Change one or more rules. muon-link refuses this on relay and direct_wan. */
export async function putNetworkSettings (change: NetworkSettingsChange): Promise<NetworkSettings> {
  const body: Record<string, unknown> = {}
  if (change.fromBle) body.network_from_ble = change.fromBle
  if (change.fromLocal) body.network_from_direct = change.fromLocal
  if (change.fromRelay) body.network_from_relay = change.fromRelay
  const answer = await call('PUT', '/settings', body)
  // A PUT may answer with the new rules or nothing; read them back if it gave no path.
  try {
    return settingsOf(answer.data)
  } catch {
    return getNetworkSettings()
  }
}

export interface RemoteWifiNetwork {
  ssid: string;
  signal: number;
  secured: boolean;
  inUse: boolean;
}

function asList (data: unknown): unknown[] {
  return Array.isArray(data) ? data : []
}

/** Networks the printer can hear. Hidden ones and repeats are dropped; the strongest signal wins. */
export async function wifiScan (): Promise<RemoteWifiNetwork[]> {
  const bySsid = new Map<string, RemoteWifiNetwork>()
  for (const raw of asList((await call('GET', '/wifi/scan')).data)) {
    const row = raw as { ssid?: unknown, signal?: unknown, security?: unknown, in_use?: unknown }
    const ssid = typeof row.ssid === 'string' ? row.ssid.trim() : ''
    if (!ssid) continue
    const signal = Number(row.signal) || 0
    const security = typeof row.security === 'string' ? row.security : ''
    const known = bySsid.get(ssid)
    const next: RemoteWifiNetwork = {
      ssid,
      signal,
      secured: !!security && !/^\s*open\s*$/i.test(security),
      inUse: row.in_use === true
    }
    if (!known) bySsid.set(ssid, next)
    else {
      bySsid.set(ssid, {
        ssid,
        signal: Math.max(known.signal, signal),
        secured: known.secured || next.secured,
        inUse: known.inUse || next.inUse
      })
    }
  }
  return [...bySsid.values()]
}

/** Names of the networks the printer has saved. Accepts `{name}` profiles or plain names. */
export async function wifiSaved (): Promise<string[]> {
  const names: string[] = []
  for (const raw of asList((await call('GET', '/wifi/saved')).data)) {
    const name = typeof raw === 'string' ? raw : (raw as { name?: unknown, ssid?: unknown } | null)?.name ?? (raw as { ssid?: unknown } | null)?.ssid
    if (typeof name === 'string' && name) names.push(name)
  }
  return names
}

/** The network the printer is on, or null when it is on none. */
export async function wifiCurrent (): Promise<{ ssid: string, signal: number } | null> {
  const row = (await call('GET', '/wifi/current')).data as { ssid?: unknown, signal?: unknown } | null
  if (!row || typeof row.ssid !== 'string' || !row.ssid) return null
  return { ssid: row.ssid, signal: Number(row.signal) || 0 }
}

export interface WifiConnectOutcome {
  /** True when the printer could not join and put its old network back. */
  restored: boolean;
  /** The network the printer is on, when it says. */
  ssid?: string;
}

/** Join a network. The password is sent in the body and kept nowhere else. */
export async function wifiConnect (ssid: string, password?: string): Promise<WifiConnectOutcome> {
  const body: Record<string, unknown> = { ssid }
  if (password) body.password = password
  const data = (await call('POST', '/wifi/connect', body)).data as { status?: unknown, ssid?: unknown } | null
  return {
    restored: data?.status === 'restored',
    ssid: typeof data?.ssid === 'string' ? data.ssid : undefined
  }
}

/** Forget a saved network. */
export async function wifiForget (ssid: string): Promise<void> {
  await call('DELETE', `/wifi/forget?ssid=${encodeURIComponent(ssid)}`)
}

export interface HotspotChange {
  /** The new name. Must start "Muon-". */
  ssid?: string;
  /** A passphrase: 8 to 63 characters, or 64 hex digits. */
  password?: string;
  /** Have the printer make one instead. */
  generate?: boolean;
}

export interface HotspotChallenge {
  id: string;
  /** Unix seconds; after this the change can no longer be approved. */
  expiresAt: number | null;
}

export type HotspotChangeState = 'waiting' | 'applied' | 'refused' | 'expired' | 'failed'

const CHANGE_STATES: HotspotChangeState[] = ['waiting', 'applied', 'refused', 'expired', 'failed']

/** An id as muon-link checks it before it goes on a path. Anything else is never sent. */
const CHANGE_ID = /^[A-Za-z0-9_-]{1,64}$/

/** Ask to change the hotspot. Answers 202: someone must press the knob at the printer. */
export async function hotspotChange (change: HotspotChange): Promise<HotspotChallenge> {
  const body: Record<string, unknown> = {}
  if (change.ssid !== undefined) body.ssid = change.ssid
  if (change.password) body.password = change.password
  if (change.generate) body.generate = true
  const data = (await call('POST', '/hotspot/change', body)).data as { challenge_id?: unknown, id?: unknown, expires_at?: unknown } | null
  const id = data?.challenge_id ?? data?.id
  if (typeof id !== 'string' || !CHANGE_ID.test(id)) throw new OwnerNetworkError('failed', EXPLANATIONS.failed)
  return { id, expiresAt: typeof data?.expires_at === 'number' ? data.expires_at : null }
}

/** Where a hotspot change stands. */
export async function hotspotChangeState (id: string): Promise<HotspotChangeState> {
  if (!CHANGE_ID.test(id)) throw new OwnerNetworkError('failed', EXPLANATIONS.failed)
  const data = (await call('GET', `/hotspot/change/${id}`)).data as { state?: unknown } | null
  if (!CHANGE_STATES.includes(data?.state as HotspotChangeState)) throw new OwnerNetworkError('failed', EXPLANATIONS.failed)
  return data!.state as HotspotChangeState
}

/** What a hotspot change's outcome means, in plain words. */
export function describeHotspotOutcome (state: HotspotChangeState): string {
  switch (state) {
    case 'waiting': return 'Press the knob on the printer to approve.'
    case 'applied': return 'The hotspot has its new name and password.'
    case 'refused': return 'Someone at the printer said no, so nothing changed.'
    case 'expired': return 'Nobody approved it in time, so nothing changed. Ask again when someone is at the printer.'
    case 'failed': return "The printer approved it but couldn't switch the hotspot over. Check it at the printer."
  }
}

/** How often to ask whether someone has pressed the knob. */
export const HOTSPOT_POLL_MS = 2000

const bytes = (text: string) => new TextEncoder().encode(text).length

/** The hotspot's name rule, as the printer applies it: "Muon-", 6 to 32 bytes, no control characters. */
export function ssidProblemOf (ssid: string): string {
  if (!ssid) return ''
  if (!ssid.startsWith('Muon-')) return 'The name has to start with "Muon-".'
  if (bytes(ssid) < 6 || bytes(ssid) > 32) return 'The name has to be 6 to 32 characters.'
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(ssid)) return "The name can't hold control characters."
  return ''
}

/** WPA2: 8 to 63 printable characters, or 64 hex digits. */
export function passwordProblemOf (password: string): string {
  if (!password) return ''
  if (/^[0-9A-Fa-f]{64}$/.test(password)) return ''
  if (password.length < 8) return 'The password has to be at least 8 characters.'
  if (password.length > 63) return 'The password can be at most 63 characters.'
  if (/[^ -~]/.test(password)) return 'The password can only use letters, numbers and common symbols.'
  return ''
}

/* ---- Before a change: will it cut this connection? ---- */

export type NetworkChangeKind = 'wifi_connect' | 'wifi_forget' | 'hotspot_change'

export interface ChangeWarning {
  /** The change can drop the connection this page is using. */
  mayDropLink: boolean;
  /** `safe` is said out loud so a person knows it was checked. */
  level: 'safe' | 'warn';
  title: string;
  message: string;
}

export interface ChangeContext {
  kind: NetworkChangeKind;
  path: NetworkPath;
  /** This page reaches the printer over its own hotspot. */
  onHotspot?: boolean;
  /** For forget: the network is the one the printer is on now. */
  isCurrentNetwork?: boolean;
}

/**
 * What to say before a change, from the path this connection arrives on.
 * Joining another Wi-Fi on the local network can drop this connection; on
 * Bluetooth it can't. Over the internet the connection runs through the
 * printer's own Wi-Fi, so a different network cuts it until the printer is
 * back online. A hotspot change while on the hotspot always warns.
 */
export function warningFor ({ kind, path, onHotspot, isCurrentNetwork }: ChangeContext): ChangeWarning {
  if (kind === 'hotspot_change') {
    if (onHotspot) {
      return {
        mayDropLink: true,
        level: 'warn',
        title: 'You are connected through the hotspot',
        message: 'Changing its name or password will disconnect this page. Join the hotspot again with the new details afterwards.'
      }
    }
    return {
      mayDropLink: false,
      level: 'safe',
      title: 'Someone must approve this at the printer',
      message: 'This connection stays up. Nothing changes until someone presses the knob on the printer.'
    }
  }

  if (kind === 'wifi_forget' && isCurrentNetwork === false) {
    return {
      mayDropLink: false,
      level: 'safe',
      title: 'Not the network the printer is on',
      message: 'Forgetting it will not cut this connection.'
    }
  }

  const verb = kind === 'wifi_forget' ? 'Forgetting the network the printer is on' : 'Joining a different network'
  switch (path) {
    case 'ble':
      return {
        mayDropLink: false,
        level: 'safe',
        title: 'Safe over Bluetooth',
        message: 'You are connected over Bluetooth, so this will not cut your connection.'
      }
    case 'local':
      return {
        mayDropLink: true,
        level: 'warn',
        title: 'This may drop your connection',
        message: `${verb} can drop the connection you are using now, because the printer leaves the network this page reaches it on.`
      }
    default:
      return {
        mayDropLink: true,
        level: 'warn',
        title: 'This may drop your connection',
        message: `${verb} will cut this connection until the printer is back online. If the new network does not work, the printer goes back to the old one on its own.`
      }
  }
}

/* ---- Confirm or revert (not defined yet) ---- */

/** How long a person has to keep a change that could cut their link. */
export const CONFIRM_SECONDS = 90

export class ConfirmUnavailable extends Error {
  constructor () {
    super("This printer can't confirm a network change yet.")
    this.name = 'ConfirmUnavailable'
  }
}

/**
 * Whether the printer has a route to confirm a change. It does not yet: the
 * Aux API's confirm route is not defined (muon-link NETWORK_ROUTES.md names
 * only the revert timer). While this is false the countdown never appears.
 *
 * TODO(KAN-1565): once the confirm route exists, detect it (or flip this) and
 * send the confirmation in `confirmNetworkChange`.
 */
export function confirmRouteSupported (): boolean {
  return false
}

/**
 * Tell the printer to keep the change it just made, so it does not revert.
 *
 * TODO(KAN-1565): the confirm route is not defined. Send it here when it is.
 */
export async function confirmNetworkChange (): Promise<void> {
  if (!confirmRouteSupported()) throw new ConfirmUnavailable()
  // TODO(KAN-1565): the route and its body.
  throw new ConfirmUnavailable()
}
