/**
 * The Muon3D account, its linked printers, and their live status.
 *
 * Kept outside Vuex on purpose: Fluidd resets its whole store every time it
 * switches printer, and the account must survive the switch.
 */
import { visibleInterval } from '@/util/visible-interval'
import Vue from 'vue'
import {
  cloudApi,
  CloudError,
  storedToken,
  storeRefreshToken,
  storeToken,
  TOKEN_KEY,
  type CloudAccount,
  type CloudConfig,
  type CloudPrinter,
  type AccessHandoff
} from './api'
import { centralLoginEnabled, clearSilentAttempt, redirectUri, signInAgainOnPrinterOrigin, signOutCentral, takeCallback } from './centralLogin'
import { browserEndpoint, forgetBrowserKey, managedEndpointFactory } from './iroh'
import { createPrinterTransportForSelection, type AuthorizedManagedRelaySession, type PrinterTransport, type PrinterSocket } from '@/services/managed-transport'
import { consolePresence } from './presence'
import { announceAccount, identityOf, SIGNED_OUT } from './account-events'
import { STATUS_QUERY, statusFrom, type PrinterStatus } from './status'
import { deletionState } from './deletion'
import { forgetOwnAvatar } from '@/services/account/avatar'
import { wantsBluetoothFor } from '@/services/muon-ble/link'
import { mayDialBluetooth, noteBluetoothFailure, noteBluetoothSuccess } from '@/services/muon-ble/retry'

const ACTIVE_KEY = 'muon.cloud.active'

/** A printer's live state, read over its own Iroh connection (the reading is shared with the network's: status.ts). */
export type { PrinterStatus } from './status'

export interface FleetLayout {
  groups: Array<{ id: string, name: string, printers: string[] }>;
  widgets: Record<string, boolean>;
  density: 'comfortable' | 'compact';
}

export const DEFAULT_FLEET_LAYOUT: FleetLayout = {
  groups: [],
  widgets: {
    model: true,
    progress: true,
    temps: true,
    eta: true,
    file: true,
    position: true,
    layer: true,
    factors: false
  },
  density: 'comfortable'
}

interface CloudState {
  ready: boolean;
  account: CloudAccount | null;
  config: CloudConfig | null;
  printers: CloudPrinter[];
  status: Record<string, PrinterStatus>;
  activePrinterId: string | null;
  layout: FleetLayout;
  error: string | null;
  endpointId: string | null;
}

export const cloudState = Vue.observable<CloudState>({
  ready: false,
  account: null,
  config: null,
  printers: [],
  status: {},
  activePrinterId: readActive(),
  layout: { ...DEFAULT_FLEET_LAYOUT },
  error: null,
  endpointId: null
})

function readActive (): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

export function setActiveCloudPrinter (id: string | null) {
  cloudState.activePrinterId = id
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch { /* no storage */ }
}

/** The fleet owns one transport per printer; the dashboard borrows it. */
const statusConnections = new Map<string, Promise<PrinterTransport>>()
const grants = new Map<string, Promise<AccessHandoff>>()
const polling = new Set<string>()
let sessionAbort = new AbortController()
let endpointRegistration: Promise<void> | null = null
let stopPollTimer: (() => void) | null = null
let stopPrintersTimer: (() => void) | null = null

async function ensureEndpoint (): Promise<void> {
  if (!endpointRegistration) {
    const signal = sessionAbort.signal
    const pending = (async () => {
      if (!cloudState.config) cloudState.config = await cloudApi.config()
      signal.throwIfAborted()
      const endpoint = await browserEndpoint(cloudState.config.relay_url)
      signal.throwIfAborted()
      const id = endpoint.endpointId()
      if (cloudState.endpointId !== id) {
        await cloudApi.registerEndpoint(id)
        signal.throwIfAborted()
        cloudState.endpointId = id
      }
    })()
    endpointRegistration = pending
    pending.finally(() => { if (endpointRegistration === pending) endpointRegistration = null }).catch(() => {})
  }
  return endpointRegistration
}

function waitForRetry (ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted()
    const abort = () => { clearTimeout(timer); reject(signal.reason) }
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve() }, ms)
    signal.addEventListener('abort', abort, { once: true })
  })
}

function deletionRefusal (): CloudError | null {
  if (deletionState.deleteAfter === null) return null
  return new CloudError('Your account is waiting to be deleted.', 403, undefined, {
    deletion_pending: true, delete_after: deletionState.deleteAfter
  })
}

/** Asks the console for a grant, retrying only temporary (503) failures until `signal` aborts. */
async function askConsole (printerId: string, signal: AbortSignal): Promise<AccessHandoff> {
  await ensureEndpoint()
  let delay = 1000
  for (;;) {
    signal.throwIfAborted()
    const printer = cloudState.printers.find(p => p.id === printerId)
    if (printer && consolePresence(printer) === 'offline') throw new CloudError('Printer is offline', 503)
    try {
      const grant = await cloudApi.access(printerId)
      signal.throwIfAborted()
      return grant
    } catch (error) {
      signal.throwIfAborted()
      if (!(error instanceof CloudError) || error.status !== 503) throw error
      await waitForRetry(delay, signal)
      delay = Math.min(15_000, delay * 2)
    }
  }
}

/** One pending grant per printer, retrying only temporary console failures. */
export function requestAccess (printerId: string): Promise<AccessHandoff> {
  const refused = deletionRefusal()
  if (refused) return Promise.reject(refused)
  const existing = grants.get(printerId)
  if (existing) return existing
  const pending = askConsole(printerId, sessionAbort.signal)
  grants.set(printerId, pending)
  pending.finally(() => { if (grants.get(printerId) === pending) grants.delete(printerId) }).catch(() => {})
  return pending
}

/**
 * How long a Bluetooth open waits for the console's grant before going on
 * without it (KAN-1253), when the console does not call the printer online.
 */
export const BLUETOOTH_GRANT_GRACE_MS = 4_000

/**
 * The same wait for a printer the console calls online. Its key may rely on
 * a grant the console pushes, so the grant is worth waiting for. Bounded below
 * `REMOTE_OPEN_TIMEOUT_MS` (activate.ts), so the radio still has time.
 */
export const BLUETOOTH_ONLINE_GRANT_WAIT_MS = 20_000

/**
 * The handoff for a printer the person chose to open over Bluetooth. The
 * console's grant is asked for as ever and used if it comes, because an
 * online printer only admits this key once the console has pushed a grant to
 * it. But the radio must not wait on the console: a printer the console
 * calls offline (503 `device_unreachable`) may be sitting beside the laptop,
 * and a key it already holds (paired, or enrolled at setup) needs no grant.
 * So a 503, a timeout or no network ends the wait, and the session is
 * local and grantless (`grantless: true`). Any other refusal (401, 403, 404,
 * deletion pending) is the console's answer about this account and is raised.
 *
 * The ask has its own abort, fired whenever the wait ends, so a 503 retry
 * loop never outlives the handoff and no entry is left in `grants`.
 */
async function bluetoothHandoff (printerId: string, signal: AbortSignal): Promise<AuthorizedManagedRelaySession> {
  const refused = deletionRefusal()
  if (refused) throw refused
  // Aborted by the session ending or by this wait ending (no AbortSignal.any: older browsers).
  const own = new AbortController()
  const session = sessionAbort.signal
  const endWithSession = () => own.abort()
  session.addEventListener('abort', endWithSession, { once: true })
  let timer: ReturnType<typeof setTimeout> | undefined
  let grant: AccessHandoff | null
  try {
    // I-133: the person chose Bluetooth, so the radio is the route. The console
    // is asked, but never waited on for more than the short grace.
    const wait = BLUETOOTH_GRANT_GRACE_MS
    const asked = askConsole(printerId, own.signal).catch((error): null => {
      if (error instanceof CloudError && error.status !== 503) throw error
      return null // 503 (including offline presence), or the network
    })
    grant = await Promise.race([
      asked,
      new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), wait) })
    ])
  } finally {
    clearTimeout(timer)
    session.removeEventListener('abort', endWithSession)
    own.abort()
  }
  signal.throwIfAborted()
  if (grant) return sessionFrom(grant)
  let relayUrl = cloudState.config?.relay_url
  if (!relayUrl) {
    try {
      relayUrl = (cloudState.config = await cloudApi.config()).relay_url
    } catch { /* no console either: the error below says so */ }
  }
  signal.throwIfAborted()
  if (!relayUrl) throw new Error('Muon3D could not be reached, and this page does not know its relay yet. Open Control once with a connection, then try Bluetooth again.')
  return {
    contractVersion: 'managed-iroh/v1',
    sessionId: `bluetooth-${printerId}`,
    tenantId: cloudState.account?.id ?? 'local',
    printerId,
    relayUrl,
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    grantless: true
  }
}

function sessionFrom (grant: AccessHandoff): AuthorizedManagedRelaySession {
  return {
    contractVersion: 'managed-iroh/v1',
    sessionId: grant.grant_id,
    tenantId: cloudState.account?.id ?? '',
    printerId: grant.printer_id,
    relayUrl: grant.relay_url,
    expiresAt: new Date(grant.expires_at * 1000).toISOString()
  }
}

async function handoff (printerId: string, signal: AbortSignal): Promise<AuthorizedManagedRelaySession> {
  signal.throwIfAborted()
  if (wantsBluetoothFor(printerId)) return bluetoothHandoff(printerId, signal)
  const grant = await requestAccess(printerId)
  signal.throwIfAborted()
  return sessionFrom(grant)
}

async function statusConnection (printerId: string): Promise<PrinterTransport> {
  let existing = statusConnections.get(printerId)
  if (!existing) {
    const signal = sessionAbort.signal
    existing = createPrinterTransportForSelection(
      { kind: 'managed-iroh', printerId },
      { handoffSelectedPrinter: id => handoff(id, signal), createManagedEndpoint: managedEndpointFactory }
    )
    statusConnections.set(printerId, existing)
    const pending = existing
    pending.catch(() => { if (statusConnections.get(printerId) === pending) statusConnections.delete(printerId) })
  }
  return existing
}

/**
 * Drops the shared connection to a printer that stopped answering through it,
 * so the next open and the next status poll dial again instead of borrowing
 * the stalled one.
 */
export function dropCloudConnection (printerId: string) {
  const existing = statusConnections.get(printerId)
  if (!existing) return
  statusConnections.delete(printerId)
  polling.delete(printerId)
  existing.then(c => c.close()).catch(() => {})
}

/**
 * How long a status read may stay silent before it counts as failed (I-133).
 * A blocked relay never answers, so without this the card kept its last
 * "Ready" for minutes. A silent read marks the printer Offline (at most about
 * 9 s after the relay goes quiet), and so do two failed reads in a row; the
 * next answer flips it back.
 */
export const STATUS_TIMEOUT_MS = 6000
export const OFFLINE_AFTER_FAILURES = 2
const pollFailures = new Map<string, number>()

class StatusSilence extends Error {
  constructor () { super('No answer from the printer') }
}

async function pollOne (printer: CloudPrinter) {
  const signal = sessionAbort.signal
  const unavailable = (error: string) => {
    if (signal.aborted) return
    Vue.set(cloudState.status, printer.id, { ...cloudState.status[printer.id], reachable: false, error, updatedAt: Date.now() })
  }
  const presence = consolePresence(printer)
  if (presence !== 'online') unavailable(presence)
  if (presence === 'offline' || polling.has(printer.id)) return
  // I-129: a Bluetooth route that keeps failing backs off, then stops.
  const overBluetooth = wantsBluetoothFor(printer.id)
  if (!overBluetooth) noteBluetoothSuccess(printer.id)
  else if (!mayDialBluetooth(printer.id)) return
  polling.add(printer.id)
  try {
    const connection = await statusConnection(printer.id)
    let silence: ReturnType<typeof setTimeout> | undefined
    const response = await Promise.race([
      connection.fetch(STATUS_QUERY),
      new Promise<never>((_resolve, reject) => { silence = setTimeout(() => reject(new StatusSilence()), STATUS_TIMEOUT_MS) })
    ]).finally(() => clearTimeout(silence))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const s = (await response.json()).result.status
    if (signal.aborted) return
    pollFailures.delete(printer.id)
    if (overBluetooth) noteBluetoothSuccess(printer.id)
    const latest = cloudState.printers.find(p => p.id === printer.id)
    if (!latest) return
    const presence = consolePresence(latest)
    Vue.set(cloudState.status, printer.id, {
      reachable: presence === 'online',
      error: presence === 'online' ? undefined : presence,
      ...statusFrom(s),
      updatedAt: Date.now()
    } as PrinterStatus)
  } catch (error) {
    if (overBluetooth && !signal.aborted) noteBluetoothFailure(printer.id, error)
    const failed = (pollFailures.get(printer.id) ?? 0) + 1
    pollFailures.set(printer.id, failed)
    const latest = cloudState.printers.find(p => p.id === printer.id)
    const offline = failed >= OFFLINE_AFTER_FAILURES || error instanceof StatusSilence
    if (latest) unavailable(consolePresence(latest) === 'offline' || offline ? 'offline' : 'reconnecting')
  } finally {
    if (!signal.aborted) polling.delete(printer.id)
  }
}

/** A connection to a cloud printer for anything besides status, such as file reads. */
export function cloudPrinterConnection (printerId: string): Promise<PrinterTransport> {
  return statusConnection(printerId)
}

/** The selected page owns its sockets, but cannot close the shared transport. */
export async function borrowCloudPrinter (printerId: string): Promise<PrinterTransport> {
  const shared = await statusConnection(printerId)
  const sockets = new Set<PrinterSocket>()
  let closed = false
  return {
    async fetch (path, init) {
      if (closed) throw new Error('Printer page closed')
      const response = await shared.fetch(path, init)
      if (closed) throw new Error('Printer page closed')
      return response
    },
    async openWebSocket (path) {
      if (closed) throw new Error('Printer page closed')
      const socket = await shared.openWebSocket(path)
      if (closed) { socket.close(); throw new Error('Printer page closed') }
      sockets.add(socket)
      socket.addEventListener('close', () => sockets.delete(socket))
      return socket
    },
    close () {
      closed = true
      for (const socket of sockets) socket.close()
      sockets.clear()
    }
  }
}

async function pollAll () {
  if (deletionState.deleteAfter !== null) {
    for (const connection of statusConnections.values()) connection.then(c => c.close()).catch(() => {})
    statusConnections.clear()
    if (Object.keys(cloudState.status).length) cloudState.status = {}
    return
  }
  await Promise.all(cloudState.printers.map(p => pollOne(p)))
}

export async function refreshPrinters () {
  if (!cloudState.account || deletionState.deleteAfter !== null) return
  try {
    cloudState.printers = (await cloudApi.printers()).printers
  } catch (error) {
    if (error instanceof CloudError && error.status === 401) await sessionRefused()
  }
}

function startPolling () {
  stopPolling()
  // A tab nobody is looking at does not poll (visibleInterval catches up on return).
  stopPollTimer = visibleInterval(() => { pollAll() }, 3000)
  stopPrintersTimer = visibleInterval(() => { refreshPrinters() }, 10000)
  pollAll()
}

function stopPolling () {
  stopPollTimer?.()
  stopPrintersTimer?.()
  stopPollTimer = stopPrintersTimer = null
}

/** The console refused the session's token: end it, and on a printer's own address sign in again (once a minute at most). */
async function sessionRefused () {
  await dropSession()
  await signInAgainOnPrinterOrigin().catch(() => {})
}

async function dropSession () {
  // Before anything of the session is cleared: whoever answers for the account hears that it left (account-events.ts).
  announceAccount(SIGNED_OUT)
  forgetOwnAvatar()
  stopPolling()
  sessionAbort.abort()
  sessionAbort = new AbortController()
  endpointRegistration = null
  grants.clear()
  polling.clear()
  storeToken(null)
  storeRefreshToken(null)
  for (const c of statusConnections.values()) c.then(p => p.close()).catch(() => {})
  statusConnections.clear()
  cloudState.account = null
  cloudState.printers = []
  cloudState.status = {}
  cloudState.endpointId = null
  // The groups belong to the account that left: the next one starts from the default (KAN-2249). The bump also
  // makes any layout load still on its way for the old account stale.
  cloudState.layout = defaultLayout()
  layoutEdits++
}

/** Bumped by every layout change made here, and by every sign-out, so a slower load knows it is stale. */
let layoutEdits = 0

/** A fresh copy of the default layout, sharing no nested object with DEFAULT_FLEET_LAYOUT. */
function defaultLayout (): FleetLayout {
  return { ...DEFAULT_FLEET_LAYOUT, groups: [], widgets: { ...DEFAULT_FLEET_LAYOUT.widgets } }
}

async function adoptSession (token: string, account: CloudAccount) {
  // A different account than the one on screen (a sign-in, or a switch without a sign-out) is announced before the
  // new session replaces the old one. The same account with a new token announces nothing: nobody changed.
  if (cloudState.account?.id !== account.id) announceAccount(identityOf(account))
  storeToken(token)
  // Signed in as someone else without a sign-out first (signIn while signed in): the groups on screen are not theirs.
  if (cloudState.account?.id !== account.id) {
    cloudState.layout = defaultLayout()
    layoutEdits++
  }
  cloudState.account = account
  cloudState.error = null
  // Read before the printers fetch: a group made while either answer is on its way is newer than the saved layout.
  const editsBefore = layoutEdits
  await refreshPrinters()
  try {
    const { layout } = await cloudApi.getLayout()
    // A late answer is dropped when the layout changed meanwhile (a group made here, which saveLayout sends on its
    // own) or the account it was asked for is no longer the one signed in (a sign-out also bumps the counter).
    if (layoutEdits === editsBefore && cloudState.account?.id === account.id) cloudState.layout = { ...DEFAULT_FLEET_LAYOUT, ...layout, widgets: { ...DEFAULT_FLEET_LAYOUT.widgets, ...(layout?.widgets ?? {}) } }
  } catch { /* keep the default */ }
  startPolling()
}

// Another tab signed out, or the console's front-channel logout page
// (public/auth/logout.html) cleared the token: this tab is signed out too.
try {
  window.addEventListener('storage', (event) => {
    if ((event.key === TOKEN_KEY || event.key === null) && !storedToken() && cloudState.account) dropSession()
  })
} catch { /* no window */ }

/**
 * Finishes a return from the console's `/authorize` (`WEB-12`): exchanges the
 * code at `/token`, or notes that the console has no session. Answers the
 * hash route the sign-in started from, for the caller to go back to.
 */
async function completeCentralSignIn (): Promise<string | null> {
  if (!centralLoginEnabled()) return null
  const result = takeCallback()
  switch (result.outcome) {
    case 'none':
      return null
    case 'code':
      try {
        const session = await cloudApi.exchangeCode(result.code, redirectUri(), result.verifier)
        storeToken(session.access_token)
        storeRefreshToken(session.refresh_token)
        clearSilentAttempt()
      } catch (error) {
        cloudState.error = (error as Error).message
      }
      return result.returnTo
    case 'signed_out':
      return result.returnTo
    case 'error':
      cloudState.error = result.message
      return result.returnTo
  }
}

/**
 * Restores a saved session at start-up, after completing a central sign-in
 * if this load is the return from one. Answers the hash route to go back to,
 * or null.
 */
export async function initCloud (sessionCheck?: Promise<void>): Promise<string | null> {
  await sessionCheck
  const returnTo = await completeCentralSignIn()
  const token = storedToken()
  if (token) {
    try {
      const me = await cloudApi.me()
      const currentToken = storedToken()
      if (currentToken) await adoptSession(currentToken, me.account)
    } catch (error) {
      if (error instanceof CloudError && error.status === 401) await sessionRefused()
    }
  }
  cloudState.ready = true
  return returnTo
}

/**
 * Signs in with a password. An account with an authenticator app is not
 * signed in yet: the console answers `403` with an `mfa_token`, returned here
 * so the dialog can ask for the code (`signInWithCode`). Null: signed in.
 */
export async function signIn (email: string, password: string): Promise<string | null> {
  try {
    const { token, account } = await cloudApi.signIn(email, password)
    await adoptSession(token, account)
    return null
  } catch (error) {
    const mfa = error instanceof CloudError && error.status === 403 && error.body.mfa_required === true && typeof error.body.mfa_token === 'string'
      ? error.body.mfa_token
      : null
    if (mfa) return mfa
    throw error
  }
}

/** The second step of `signIn`: the six-digit code (or a recovery code). */
export async function signInWithCode (mfaToken: string, code: string) {
  const { token, account } = await cloudApi.signInCode(mfaToken, code.replace(/\s+/g, ''))
  await adoptSession(token, account)
}

export async function signUp (email: string, password: string, name: string, declaredAge?: number) {
  const { token, account } = await cloudApi.signUp(email, password, name, declaredAge)
  await adoptSession(token, account)
}

/** True when the console's logout form is navigating away. */
export async function signOut (): Promise<boolean> {
  if (centralLoginEnabled()) {
    // The console ends the browser session and every session issued from
    // it, this one included, and tells the other surfaces.
    await dropSession()
    forgetBrowserKey()
    setActiveCloudPrinter(null)
    signOutCentral()
    return true
  }
  try {
    await cloudApi.signOut()
  } catch { /* the session ends here either way; on plain HTTP there is none and the call is refused unsent */ }
  await dropSession()
  forgetBrowserKey()
  setActiveCloudPrinter(null)
  return false
}

export async function saveLayout (layout: FleetLayout) {
  layoutEdits++
  cloudState.layout = layout
  // A 401 is retried only for the account that made the change, never with the next one's token.
  const owner = cloudState.account?.id
  try {
    await cloudApi.putLayout(layout, () => owner !== undefined && cloudState.account?.id === owner)
  } catch (error) {
    // A save refused for an account that has since left is not the signed-in account's error.
    if (cloudState.account?.id === owner) cloudState.error = (error as Error).message
  }
}

export function printerName (id: string): string {
  return cloudState.printers.find(p => p.id === id)?.name ?? id.slice(0, 8)
}
