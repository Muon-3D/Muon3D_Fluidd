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
import { activateCloudPrinter, activateLocalPrinter } from './activate'
import { chooseRouteMode } from './route-choice'
import { cloudState } from './state'
import { lanFetch, localNetworkPermission } from './discovery'

/** Said when the browser's local-network question was refused. One line: the person's next step is in it. */
export const LOCAL_ACCESS_BLOCKED =
  "Your browser blocked access to printers on your network. Allow 'local network access' for control.muon3d.com in the address bar, then try again."

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
 * What a click on a printer found on this network does from the hosted page when no route was picked (a scan result,
 * the sign-in page's list): connect in place over its secure name, else Muon3D's relay where the account holds the
 * printer online, else ask about muon3d.local. Never an address of the printer itself.
 */
export async function openOnNetwork (o: { name: string, label: string, printerId: string }): Promise<OpenOnNetwork> {
  const done = await connectInPlace({ name: o.name, label: o.label, printerId: o.printerId })
  if (done.ok) {
    chooseRouteMode(o.printerId, 'auto')
    clearRelayChoice(o.printerId)
    return { opened: true, line: null, ask: false }
  }
  const blocked = done.why === 'blocked'
  if (cloudState.printers.some(p => p.id === o.printerId && p.online)) {
    try {
      await activateCloudPrinter(o.printerId)
      return { opened: true, line: blocked ? LOCAL_ACCESS_BLOCKED : null, ask: false }
    } catch { /* fall to the question */ }
  }
  return { opened: false, line: blocked ? LOCAL_ACCESS_BLOCKED : null, ask: true }
}

export { MUON_LOCAL_URL, MUON_LOCAL_QUESTION, openMuonLocal, setLeave }
