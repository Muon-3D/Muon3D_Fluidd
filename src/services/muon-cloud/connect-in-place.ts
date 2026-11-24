/**
 * Connecting to a printer on this network FROM the hosted page, in the same tab (KAN-5459, Jack 23 Nov: "it should
 * just open on control.muon3d.com as 'connected locally'").
 *
 * A printer holds a certificate for its own name, `<label>.muonlan.net`, so an https page may reach it: Moonraker over
 * `https://<name>` and its socket on `wss://<name>/websocket`. Nothing here leaves the page. The printer answers a
 * request from https://control.muon3d.com with the CORS and Private Network Access headers a public page needs.
 *
 * What it sends to the printer: nothing from the Muon3D account. The probe is a plain GET with `credentials: 'omit'`
 * and no headers. After it, the printer is opened as any local printer is (activateLocalPrinter), which speaks to its
 * own Moonraker with that printer's own Moonraker login, kept per printer. No console token is ever an input here.
 *
 * Only a name under our own zone is dialled (`printerName`), and a redirect is an error, so a reply can never send
 * the page off the zone.
 */
import type { InstanceConfig } from '@/store/config/types'
import { printerName } from '@/services/secure-origin'
import { clearRelayChoice } from '@/services/secure-origin/hosted'
import { MUON_LOCAL_URL, MUON_LOCAL_QUESTION, openMuonLocal, setLeave } from './muon-local'
import { activateCloudPrinter, activateLocalPrinter, activationState } from './activate'
import { chooseRouteMode } from './route-choice'
import { cloudState, dropCloudConnection, rememberBluetoothOnly } from './state'
import { discoveryState, lanFetch, localNetworkPermission } from './discovery'
import { openableAddr } from './local-route'
import { isPrinter, nearbyState, permittedPrinterFor, type NearbyPrinter } from '@/services/muon-ble/nearby'
import { heardRecently } from '@/services/muon-ble/heard'
import { reconnectBluetooth, releaseBluetoothLink, stopUsingBluetoothFor, useBluetoothFor } from '@/services/muon-ble/link'
import { retryBluetooth } from '@/services/muon-ble/retry'
import { startPairing } from '@/services/muon-ble/pairing'

/** Said when the browser's local-network question was refused. One line: the person's next step is in it. */
export const LOCAL_ACCESS_BLOCKED =
  "Your browser blocked access to printers on your network. Allow 'local network access' for control.muon3d.com in the address bar, then try again."

/**
 * Said when the secure name did not answer although the printer is on this network (KAN-6283): the router's DNS
 * rebinding protection drops a public name that points at a private address, so the name never resolves.
 */
export const REBINDING_LINE = "Your network's router is blocking the printer's secure address (DNS rebinding protection)."
export const REBINDING_FIX = "To fix it, allow muonlan.net in the router's DNS rebind exceptions, or use another DNS server."

/** Said when the printer is not beside this browser at all: another network. Never a reason to sign in. */
export const NOT_ON_YOUR_NETWORK = "This printer isn't on your network."

export type LocalFailure = 'blocked' | 'rebinding' | 'elsewhere' | 'other'

/**
 * Why a local open failed, as far as a browser can tell. A fetch that cannot resolve or connect only says
 * "TypeError", so the service's own list decides: a printer it puts beside this browser whose secure name still
 * does not answer is the router blocking the name; one it does not list (after the list was read) is on another
 * network. Local-network permission denied is its own case (LOCAL_ACCESS_BLOCKED).
 *
 * An https page cannot fall back to the printer's IP in place: http://<ip> is blocked as mixed content and
 * https://<ip> has no valid certificate. The only ways round are another route or the person opening the printer's
 * own page themselves.
 */
export function localFailure (printerId: string | null | undefined, why: string, probed = true): LocalFailure {
  if (why === 'blocked') return 'blocked'
  if (why !== 'unreachable') return 'other'
  const want = printerId?.toLowerCase()
  const beside = want ? discoveryState.cloud.find(c => c.printerId.toLowerCase() === want) : undefined
  if (beside) return probed ? 'rebinding' : 'other'
  return discoveryState.cloudChecked ? 'elsewhere' : 'other'
}

/** Where the person can open the printer's own page themselves: its address on this network, else muon3d.local. */
export function ownPageUrl (printerId: string | null | undefined): string {
  const want = printerId?.toLowerCase()
  const beside = want ? discoveryState.cloud.find(c => c.printerId.toLowerCase() === want) : undefined
  const addr = openableAddr(beside, window.location.hostname)
  return `http://${addr ?? 'muon3d.local'}/`
}

const PROBE_MS = 8000

export type InPlaceResult =
  | { ok: true }
  | { ok: false, why: 'blocked' | 'unreachable' | 'failed' | 'bad-name' }

/** The Fluidd instance for a printer's secure name, or null for a name that is not under our zone. */
export function secureInstance (name: string, label: string, endpointId?: string | null): InstanceConfig | null {
  const zoned = printerName(name)
  if (!zoned) return null
  return {
    name: label,
    apiUrl: `https://${zoned}`,
    socketUrl: `wss://${zoned}/websocket`,
    active: true,
    ...(endpointId ? { endpointId } : {})
  }
}

/**
 * Whether this page reaches the printer's Moonraker over its secure name: `GET /server/info`, no credentials, no
 * redirects. 'blocked' is a refused local-network permission, told apart from a printer that is off or elsewhere.
 */
export async function probeSecureApi (name: string): Promise<'reached' | 'blocked' | 'unreachable'> {
  const zoned = printerName(name)
  if (!zoned) return 'unreachable'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PROBE_MS)
  try {
    const response = await lanFetch(`https://${zoned}/server/info`, {
      mode: 'cors', credentials: 'omit', redirect: 'error', cache: 'no-store', signal: controller.signal
    })
    return response.ok ? 'reached' : 'unreachable'
  } catch {
    return (await localNetworkPermission()) === 'denied' ? 'blocked' : 'unreachable'
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Connects Control to the printer over its secure name, in place. Call it straight from the click: the browser's
 * local-network question belongs to that gesture, and the probe is the first thing this does.
 */
export async function connectInPlace (o: { name: string, label: string, endpointId?: string | null, printerId?: string | null }): Promise<InPlaceResult> {
  const instance = secureInstance(o.name, o.label, o.endpointId ?? o.printerId)
  if (!instance) return { ok: false, why: 'bad-name' }
  const reach = await probeSecureApi(o.name)
  if (reach !== 'reached') return { ok: false, why: reach }
  return (await activateLocalPrinter(instance, o.printerId ?? o.endpointId ?? null)) ? { ok: true } : { ok: false, why: 'failed' }
}

export interface OpenOnNetwork {
  /** The printer was opened (in place, or through Muon3D): the caller goes to it. */
  opened: boolean;
  /** The one plain line to show, when there is one. */
  line: string | null;
  /** Nothing opened it: ask whether to open muon3d.local. */
  ask: boolean;
}

/**
 * The printer's Bluetooth device when it is detected nearby without a chooser: heard in the last 30 seconds, or a
 * device this browser already holds permission for (what the printer tile's failover uses). Null otherwise; the
 * chooser needs its own click and is never opened from here.
 */
async function detectedNearby (printerId: string): Promise<NearbyPrinter | null> {
  const now = Date.now()
  const heard = nearbyState.printers.find(p => !!p.device && isPrinter(p, printerId) && heardRecently(p, now))
  return heard ?? await permittedPrinterFor(printerId).catch(() => null)
}

/**
 * Opens the printer over Bluetooth, as the tile does (pairNearbyPrinter with no held route). A printer that does
 * not know this browser goes into pairing. Returns whether Bluetooth took it; on a failure nothing stays held.
 */
async function openOverBluetooth (printerId: string, label: string, heard: NearbyPrinter): Promise<'opened' | 'pairing' | 'failed'> {
  chooseRouteMode(printerId, 'auto')
  if (!cloudState.printers.some(p => p.id === printerId)) rememberBluetoothOnly(printerId, heard.display || heard.localName || label)
  retryBluetooth(printerId)
  try {
    useBluetoothFor(printerId, heard.device)
    await releaseBluetoothLink(printerId)
    reconnectBluetooth(printerId)
    dropCloudConnection(printerId)
    await activateCloudPrinter(printerId)
    return 'opened'
  } catch {
    if (activationState.pairing === printerId) {
      await startPairing(printerId).catch(() => {})
      return 'pairing'
    }
    stopUsingBluetoothFor(printerId)
    return 'failed'
  }
}

/**
 * What a click on a printer found on this network does from the hosted page when no route was picked (a scan result,
 * the sign-in page's list): connect in place over its secure name, else Muon3D's relay where the account holds the
 * printer online, else Bluetooth where the printer is detected nearby, else ask about muon3d.local. Signed out there
 * is no relay: this network, Bluetooth, the question. Never an address of the printer itself.
 */
export async function openOnNetwork (o: { name: string, label: string, printerId: string }): Promise<OpenOnNetwork> {
  const done = await connectInPlace({ name: o.name, label: o.label, printerId: o.printerId })
  if (done.ok) {
    chooseRouteMode(o.printerId, 'auto')
    clearRelayChoice(o.printerId)
    return { opened: true, line: null, ask: false }
  }
  const blocked = done.why === 'blocked'
  const why = localFailure(o.printerId, done.why)
  const reason = blocked ? LOCAL_ACCESS_BLOCKED : why === 'rebinding' ? `${REBINDING_LINE} ${REBINDING_FIX}` : null
  if (cloudState.printers.some(p => p.id === o.printerId && p.online)) {
    try {
      await activateCloudPrinter(o.printerId)
      return { opened: true, line: reason, ask: false }
    } catch { /* fall to Bluetooth */ }
  }
  const heard = await detectedNearby(o.printerId)
  if (heard) {
    const bt = await openOverBluetooth(o.printerId, o.label, heard)
    if (bt === 'opened') return { opened: true, line: null, ask: false }
    if (bt === 'pairing') return { opened: false, line: null, ask: false }
  }
  if (why === 'elsewhere') return { opened: false, line: NOT_ON_YOUR_NETWORK, ask: false }
  return { opened: false, line: reason, ask: true }
}

export { MUON_LOCAL_URL, MUON_LOCAL_QUESTION, openMuonLocal, setLeave }
