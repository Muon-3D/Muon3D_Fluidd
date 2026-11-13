/**
 * Opening an account printer on its own secure address (KAN-2198, A-6c).
 *
 * The hosted console page may send a person to a printer's own HTTPS name
 * when this browser can really reach it, which is the "on this network"
 * route and beats going through Muon3D. The reach is proven by a probe, and
 * only when the person opens a printer, never on page load: Chrome asks
 * once per site before a public page may reach a private address, and that
 * question belongs to the click that caused it.
 */
import { printerName, probe } from './index'

/** The printer's secure name from the console's list, or null. A name outside our zone is ignored. */
export function secureNameOf (p: { secure_name?: unknown } | undefined | null): string | null {
  return printerName(p?.secure_name)
}

/** Whether to try a secure name at all: only from an HTTPS page. Plain-HTTP printer pages have their own flow. */
export function mayTrySecureName (location: Pick<Location, 'protocol'> = globalThis.location): boolean {
  return location.protocol === 'https:'
}

const REACH_OK_MS = 5 * 60_000
const REACH_FAIL_MS = 60_000
const reach = new Map<string, { ok: boolean, at: number }>()
const inFlight = new Map<string, Promise<boolean>>()

function fresh (name: string, now: number) {
  const known = reach.get(name)
  if (!known) return null
  return now - known.at < (known.ok ? REACH_OK_MS : REACH_FAIL_MS) ? known : null
}

/**
 * Whether this browser reaches `name` now. A success is remembered for five
 * minutes, a failure for one, and callers asking at the same time share one probe.
 */
export function reachSecureName (name: string, now = Date.now()): Promise<boolean> {
  const known = fresh(name, now)
  if (known) return Promise.resolve(known.ok)
  const running = inFlight.get(name)
  if (running) return running
  const attempt = probe(`https://${name}`).then(ok => {
    reach.set(name, { ok, at: now })
    return ok
  }).finally(() => { inFlight.delete(name) })
  inFlight.set(name, attempt)
  return attempt
}

/** Whether `name` has a remembered success. Never probes. */
export function knownReachable (name: string, now = Date.now()): boolean {
  return fresh(name, now)?.ok === true
}

/** Forgets every remembered answer (sign-out, tests). */
export function forgetSecureReach () {
  reach.clear()
  inFlight.clear()
}

const RELAY_KEY = 'muon.route.relay'
let memoryRelay: Set<string> | null = null

function readRelay (): Set<string> {
  try {
    const raw = sessionStorage.getItem(RELAY_KEY)
    const list = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(list) ? list.filter(x => typeof x === 'string') : [])
  } catch {
    return memoryRelay ?? new Set()
  }
}

function writeRelay (ids: Set<string>) {
  memoryRelay = ids
  try {
    sessionStorage.setItem(RELAY_KEY, JSON.stringify([...ids]))
  } catch { /* memory only */ }
}

/** Whether the person chose "through Muon3D" for this printer in this tab. */
export function relayChosen (printerId: string): boolean {
  return readRelay().has(printerId)
}

/** Holds the "through Muon3D" choice for this tab. */
export function chooseRelay (printerId: string) {
  const ids = readRelay()
  ids.add(printerId)
  writeRelay(ids)
}

/** Lets the printer be opened automatically again. */
export function clearRelayChoice (printerId: string) {
  const ids = readRelay()
  ids.delete(printerId)
  writeRelay(ids)
}
