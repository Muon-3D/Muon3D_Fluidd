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
  setSessionHooks,
  storedToken,
  storeRefreshToken,
  currentSessionId,
  forgetSessionId,
  storeToken,
  TOKEN_KEY,
  type CloudAccount,
  type CloudConfig,
  type CloudPrinter,
  type AccessHandoff
} from './api'
import { watchFocus } from './focus-check'
import { centralLoginEnabled, clearSilentAttempt, redirectUri, signInAgainOnPrinterOrigin, signOutCentral, takeCallback } from './centralLogin'
import { browserEndpoint, forgetBrowserKey, managedEndpointFactory } from './iroh'
import { createPrinterTransportForSelection, type AuthorizedManagedRelaySession, type PrinterTransport, type PrinterSocket } from '@/services/managed-transport'
import { consolePresence } from './presence'
import { announceAccount, confirmedAccountId, confirmToken, currentAccount, identityOf, SIGNED_OUT } from './account-events'
import { STATUS_QUERY, statusFrom, type PrinterStatus } from './status'
import { deletionState } from './deletion'
import { forgetOwnAvatar } from '@/services/account/avatar'
import { wantsBluetoothFor } from '@/services/muon-ble/link'
import { forgetSecureReach } from '@/services/secure-origin/hosted'
import { mayDialBluetooth, noteBluetoothFailure, noteBluetoothSuccess } from '@/services/muon-ble/retry'
import { onEndpointRebound } from './endpoint-hooks'
import { ENDED_KEY, reconnectIfTokenChanged, sessionStreamAvailable, startSessionStream, stopSessionStream } from './session-events'
import { forgetSignedOut, noteSignedOut, scopeOfReason } from '@/services/account/signed-out-note'

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

/** How long a Bluetooth open waits for the console's config (the relay URL) when none is cached. */
export const BLUETOOTH_CONFIG_WAIT_MS = 4_000

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
 * So any console failure ends the wait (503, 401, 403, 404, 500, a timeout, no
 * network, a failed endpoint registration), and the session is local and
 * grantless (`grantless: true`). The one exception is checked first: an
 * account whose deletion is pending (`deletionRefusal()`) is the console's
 * answer about this account and is raised (KAN-1396).
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
    // Whatever goes wrong asking (any CloudError status, ensureEndpoint, an
    // abort) means no grant, never a failed connect.
    const asked = askConsole(printerId, own.signal).catch((): null => null)
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
  // The ask itself may have been the first to learn the account is waiting to
  // be deleted (a 403 deletion_pending sets deletionState). That refusal stands.
  const refusedNow = deletionRefusal()
  if (refusedNow) throw refusedNow
  if (grant) return sessionFrom(grant)
  let relayUrl = cloudState.config?.relay_url
  if (!relayUrl) {
    // Bounded and swallowed: a stalled or failing console must not hold the radio.
    let configTimer: ReturnType<typeof setTimeout> | undefined
    try {
      const config = await Promise.race([
        cloudApi.config(),
        new Promise<null>(resolve => { configTimer = setTimeout(() => resolve(null), BLUETOOTH_CONFIG_WAIT_MS) })
      ])
      if (config) relayUrl = (cloudState.config = config).relay_url
    } catch { /* no console either: the error below says so */ } finally {
      clearTimeout(configTimer)
    }
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
 * An explicit Bluetooth connect replaced the tab's endpoint (KAN-2531): every
 * other printer's transport died with it. Drop them, so the next poll and open
 * dial again on the new one.
 */
export function dropOtherCloudConnections (except: string) {
  for (const id of [...statusConnections.keys()]) if (id.toLowerCase() !== except.toLowerCase()) dropCloudConnection(id)
}
onEndpointRebound(dropOtherCloudConnections)

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

/**
 * KAN-1389: while something on screen must outlive the session (the recovery codes, which are the only copy),
 * a session that ends is remembered, not acted on: the account stays, so the page and its dialog stay mounted.
 * `releaseSignOut` lets it through. Counted, so two holders do not release each other's hold.
 */
let signOutHolds = 0
let dropDeferred = false
/** KAN-2509: why the deferred drop is, when something said (a pushed `session_ended`, a refusal that carried it). */
let deferredReason: string | undefined

/** Defers every session-ended drop (a refused call, another tab's sign-out, the focus check) until `releaseSignOut`. */
export function holdSignOut () {
  signOutHolds++
}

/**
 * Lets go of one hold. When the last one goes, a session that ended meanwhile is dropped now, as any refusal is
 * (then, on a printer's own address, signed in again), unless `dropNow` is false (the caller signs out itself right
 * after, which does the same).
 */
export function releaseSignOut (dropNow = true) {
  if (signOutHolds > 0) signOutHolds--
  if (signOutHolds === 0 && dropDeferred) {
    dropDeferred = false
    const reason = deferredReason
    deferredReason = undefined
    if (dropNow) sessionRefused(true, reason).catch(() => {})
  }
}

/**
 * The one path for a session the console refused (a refresh refused for good, a refused call, a focus check, a
 * reconcile): end it, and on a printer's own address sign in again (once a minute at most). While a hold defers the
 * drop the session is still on screen, so nothing signs in again. Calls that overlap share one run (the refresh's own
 * hook and the request that met the refusal both arrive here). `force` is the released hold's: drop it now.
 *
 * KAN-2509: a refusal that says why (`reason`, the console's wire string: a pushed `session_ended`, another tab's, a
 * refused refresh) also leaves the note the signed-out page words and goes there, in place of signing in again.
 * One path, so every tab and every source ends the same way. No reason: as before.
 */
let refusing: Promise<void> | null = null
// The shared run's reason, and where it has got to, for a caller that arrives with the reason after it began.
let refusingReason: string | undefined
let refusingEmail: string | undefined
let refusingDropped = false
function sessionRefused (force = false, reason?: string): Promise<void> {
  if (!refusing) {
    refusingReason = reason
    refusingEmail = cloudState.account?.email
    refusingDropped = false
    refusing = (async () => {
      if (!await dropSession(force, refusingReason)) return
      refusingDropped = true
      // Read after the drop: a caller that joined the run meanwhile may have brought the reason.
      if (refusingReason) {
        showSignedOut(refusingReason, refusingEmail)
        return
      }
      await signInAgainOnPrinterOrigin().catch(() => {})
    })().finally(() => { refusing = null })
  } else if (reason && !refusingReason) {
    // A run already on its way without a reason (the refresh's own hook) is joined by the caller that has it.
    refusingReason = reason
    if (signOutHolds > 0) deferredReason = reason
    else if (refusingDropped) showSignedOut(reason, refusingEmail)
  }
  return refusing
}

/** Where a session that ended with a reason goes. A whole page load, as a sign-out from a cloud printer is: nothing of the session is left to clean. */
let leaveForSignedOut = () => { window.location.assign('/signed-out') }

/** For tests: replaces the navigation. */
export function setSignedOutNavigation (go: () => void) {
  leaveForSignedOut = go
}

function showSignedOut (reason: string, email: string | undefined) {
  try {
    // Already there: the page has read its note, and a new one would greet the next visit to `/` with a stale sign-out.
    if (window.location.pathname === '/signed-out') return
    noteSignedOut({ scope: scopeOfReason(reason), email, reason })
    leaveForSignedOut()
  } catch { /* no window */ }
}

/** True when the session was dropped, false when a hold deferred it (`force` drops through a hold). */
async function dropSession (force = false, reason?: string): Promise<boolean> {
  if (signOutHolds > 0 && !force) {
    dropDeferred = true
    if (reason) deferredReason = reason
    return false
  }
  dropDeferred = false
  deferredReason = undefined
  stopSessionStream()
  forgetSessionId()
  // Before anything of the session is cleared: whoever answers for the account hears that it left (account-events.ts).
  if (cloudState.account || currentAccount().signedIn) announceAccount(SIGNED_OUT)
  confirmToken(null)
  stopReconcileRetry()
  forgetOwnAvatar()
  forgetSecureReach()
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
  return true
}

/** Bumped by every layout change made here, and by every sign-out, so a slower load knows it is stale. */
let layoutEdits = 0

/** A fresh copy of the default layout, sharing no nested object with DEFAULT_FLEET_LAYOUT. */
function defaultLayout (): FleetLayout {
  return { ...DEFAULT_FLEET_LAYOUT, groups: [], widgets: { ...DEFAULT_FLEET_LAYOUT.widgets } }
}

async function adoptSession (token: string, account: CloudAccount, fresh = false) {
  // A sign-in is a new session: the id learned for the last one is not it, and no earlier sign-out note is about it.
  if (fresh) {
    forgetSessionId()
    forgetSignedOut()
  }
  // A different account than the one on screen (a sign-in, or a switch without a sign-out) is announced before the
  // new session replaces the old one. The same account with a new token announces nothing: nobody changed.
  if (cloudState.account?.id !== account.id) announceAccount(identityOf(account))
  storeToken(token)
  confirmToken(token)
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
  watchSessionEnd(account.id)
}

/**
 * KAN-2509: this tab learns its session id (what makes another tab's `muon.cloud.ended` ours), and takes part in the
 * browser's one live sign-out stream (session-events.ts). A new session in the leader tab reconnects its stream.
 */
function watchSessionEnd (accountId: string) {
  if (!sessionStreamAvailable()) return
  if (!currentSessionId(accountId)) cloudApi.me().catch(() => {})
  startSessionStream(streamDeps)
}

/**
 * The leader's stream heard `session_ended`. Written for every other tab first (their `storage` event), then this tab
 * drops the session the one way a refusal does. The write comes before the drop, so a tab reads the reason before it
 * sees the token go.
 *
 * `sessionId` and `token` are the session the connection was opened for. The reason is about that session: if another
 * tab has stored another since, nothing is written and nothing is dropped (false: the stream asks again with the
 * stored one). The id written is the connection's, never whatever is current now. Exported for tests.
 */
export function publishEnded (reason: string | undefined, sessionId: string | null, token: string): boolean {
  if (storedToken() !== token) return false
  const why = reason ?? 'signed_out'
  try {
    localStorage.setItem(ENDED_KEY, JSON.stringify({ reason: why, session_id: sessionId ?? currentSessionId(cloudState.account?.id), at: Date.now() }))
  } catch { /* no storage: the other tabs find out from the token going, or on focus */ }
  sessionRefused(false, why).catch(() => {})
  return true
}

const streamDeps = { sessionId: () => currentSessionId(cloudState.account?.id), onEnded: publishEnded }

/**
 * Another tab's leader wrote `muon.cloud.ended` (publishEnded). Only a record of THIS tab's session counts: another
 * session id is a leftover of another account and changes nothing (the token going still ends this tab, as before).
 */
function endedElsewhere (raw: string | null) {
  if (!raw || !cloudState.account) return
  try {
    const note = JSON.parse(raw) as { reason?: unknown, session_id?: unknown }
    const mine = currentSessionId(cloudState.account.id)
    if (!mine || note.session_id !== mine || typeof note.reason !== 'string') return
    sessionRefused(false, note.reason).catch(() => {})
  } catch { /* not ours to read */ }
}

// Another tab signed out, or the console's front-channel logout page
// (public/auth/logout.html) cleared the token: this tab is signed out too.
// Another tab signed in, or as someone else, or only rotated the token: this tab asks the console whose session it now
// is (reconcileStoredSession) instead of keeping the account it had.
try {
  window.addEventListener('storage', (event) => {
    if (event.key === ENDED_KEY) return endedElsewhere(event.newValue)
    if (event.key !== TOKEN_KEY && event.key !== null) return
    if (!storedToken()) {
      if (cloudState.account) dropSession()
      return
    }
    reconcileStoredSession().catch(() => {})
  })
} catch { /* no window */ }

// KAN-1389: a tab that comes back checks its session still stands (a refusal then reaches sessionRefused through api.ts's hook).
watchFocus(() => cloudState.account !== null, () => cloudApi.me())

/**
 * The stored token's account, asked of the console: the same account as on screen is confirmed for this token and
 * kept as it is; another (or none yet) is adopted, which announces it before anything is replaced; a refusal ends the
 * session. A console that cannot be reached (status 0, 5xx, 429) leaves the account unconfirmed for this token, which
 * keeps assertions and run reports from being served under a mismatched account, and is retried on a backoff and when
 * the browser comes back online until it answers. Never more than one is in flight.
 */
let reconciling: Promise<void> | null = null

export function reconcileStoredSession (): Promise<void> {
  if (!reconciling) reconciling = reconcileOnce().finally(() => { reconciling = null })
  return reconciling
}

async function reconcileOnce (): Promise<void> {
  for (;;) {
    const token = storedToken()
    if (!token) return stopReconcileRetry()
    let me: Awaited<ReturnType<typeof cloudApi.me>>
    try {
      me = await cloudApi.me()
    } catch (error) {
      if (error instanceof CloudError && error.status === 401) {
        stopReconcileRetry()
        await sessionRefused()
      } else if (storedToken() && isTransient(error)) {
        scheduleReconcileRetry()
      }
      return
    }
    const now = storedToken()
    if (!now) return stopReconcileRetry()
    // Another token since the question was asked: its account is asked afresh, never paired with this answer.
    if (now !== token) continue
    stopReconcileRetry()
    if (cloudState.account?.id === me.account.id) {
      confirmToken(now)
      // Another tab stored a new session or a rotated pair for this account: the stream follows the stored one.
      reconnectIfTokenChanged()
    } else await adoptSession(now, me.account)
    return
  }
}

/** Only a console that did not answer, or answered "later" (0, 5xx, 429), is asked again; 403 and 404 are answers. */
// A 2xx whose body would not parse (a captive portal's page) and a 408 are passing, too.
const isTransient = (error: unknown): boolean => error instanceof CloudError &&
  (error.status === 0 || error.status === 408 || error.status === 429 || error.status >= 500 || (error.status >= 200 && error.status < 300))

/** For tests: no timer, no count left from the last one. */
export function resetReconcileForTests () {
  stopReconcileRetry()
}

/** Waits before the nth retry: 5 s, 15 s, 60 s, then every 5 minutes. */
export const RECONCILE_RETRY_MS = [5_000, 15_000, 60_000, 300_000]
let reconcileTimer: ReturnType<typeof setTimeout> | null = null
let reconcileAttempts = 0

function scheduleReconcileRetry () {
  if (reconcileTimer !== null) return
  const token = storedToken()
  if (!token || confirmedAccountId(token)) return
  const wait = RECONCILE_RETRY_MS[Math.min(reconcileAttempts, RECONCILE_RETRY_MS.length - 1)]
  reconcileAttempts++
  reconcileTimer = setTimeout(() => {
    reconcileTimer = null
    reconcileStoredSession().catch(() => {})
  }, wait)
}

/** The one shared timer, cleared when the account is known, the token is gone, the console refused it, or on sign-out. */
function stopReconcileRetry () {
  if (reconcileTimer !== null) clearTimeout(reconcileTimer)
  reconcileTimer = null
  reconcileAttempts = 0
}

try {
  window.addEventListener('online', () => {
    const token = storedToken()
    if (!token || confirmedAccountId(token)) return
    if (reconcileTimer !== null) { clearTimeout(reconcileTimer); reconcileTimer = null }
    reconcileStoredSession().catch(() => {})
  })
} catch { /* no window */ }

// Where the console client changes the session on its own (api.ts): the account is announced first (sessionRefused
// reaches dropSession, which announces before it clears anything, and api.ts clears the tokens after), then, on a
// printer's own address, signs in again as for any refusal. A recovered pair is checked against the account on screen.
setSessionHooks({
  refused: (reason) => { sessionRefused(false, reason).catch(() => {}) },
  check: () => { reconcileStoredSession().catch(() => {}) },
  async recovered () {
    const asked = storedToken()
    try {
      const me = await cloudApi.meWithoutRefresh()
      const token = storedToken()
      if (!token) return false
      // Another token since /me was asked (another tab): its account is asked afresh, never paired with this answer.
      if (token !== asked) {
        reconcileStoredSession().catch(() => {})
        return true
      }
      if (cloudState.account?.id === me.account.id) confirmToken(token)
      else adoptSession(token, me.account).catch(() => {})
      // The recovered pair is another session of the account: its stream is the one to hold.
      startSessionStream(streamDeps)
      return true
    } catch (error) {
      // Only a refusal ends the session. A console that did not answer leaves the pair in place, unconfirmed, and the
      // retry finishes the check.
      if (error instanceof CloudError && error.status === 401) {
        await dropSession()
        return false
      }
      if (isTransient(error)) scheduleReconcileRetry()
      return true
    }
  }
})

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
      // The account /me named belongs to the token it was asked with. Another token now (another tab, a recovery)
      // is asked about afresh, never paired with this answer.
      if (currentToken === token) await adoptSession(currentToken, me.account)
      else if (currentToken) await reconcileStoredSession()
    } catch (error) {
      if (error instanceof CloudError && error.status === 401) await sessionRefused()
      // The console could not be reached: no account yet, so nothing is served or reported; asked again on a backoff.
      else if (isTransient(error)) scheduleReconcileRetry()
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
    await adoptSession(token, account, true)
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
  await adoptSession(token, account, true)
}

export async function signUp (email: string, password: string, name: string, declaredAge?: number) {
  const { token, account } = await cloudApi.signUp(email, password, name, declaredAge)
  await adoptSession(token, account, true)
}

/** True when the console's logout form is navigating away. */
export async function signOut (): Promise<boolean> {
  if (centralLoginEnabled()) {
    // The console ends the browser session and every session issued from
    // it, this one included, and tells the other surfaces.
    await dropSession(true)
    forgetBrowserKey()
    setActiveCloudPrinter(null)
    signOutCentral()
    return true
  }
  try {
    await cloudApi.signOut()
  } catch { /* the session ends here either way; on plain HTTP there is none and the call is refused unsent */ }
  await dropSession(true)
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
