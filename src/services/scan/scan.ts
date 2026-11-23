/**
 * "Scan for printers" (KAN-5409).
 *
 * A browser cannot scan a LAN or browse mDNS, and an https page cannot fetch http printers. This is the
 * closest real thing, with no typing, from ONE click. It runs three sources in parallel:
 *
 * - Cloud: the account's printers (each with its own secure name) and the console's same-network list
 *   (printers that connect from this browser's public address). Each secure name is probed over https
 *   (the existing probe and marker check, names under our zone only, no credentials sent). A printer that
 *   answers is "On this network (secure)" and opens over https in the same tab.
 * - Bluetooth: the chooser, when the browser has Web Bluetooth. It needs a user gesture, so the click that
 *   starts the scan must reach `runScan` before any await: Bluetooth is started first, synchronously.
 * - The printer's own `.local`, only for a printer the console says is on this network and that did not
 *   answer securely: offered as a plain link, "not secure", because an https page cannot probe it.
 *
 * Every part has a time limit and a failure in one never stops the others. The state is passed in so a
 * test can read it; the page passes a Vue observable.
 */
import { localRoute, mdnsHostFromName } from '@/services/muon-cloud/local-route'
import { secureNameOf } from '@/services/secure-origin/hosted'
import type { CloudNearbyPrinter } from '@/services/muon-cloud/discovery'
import type { NearbyPrinter } from '@/services/muon-ble/nearby'
import { CLOUD_ACCOUNT, CLOUD_NEARBY, OFFLINE_WHY, SCAN_TIMEOUT_MS, newScanState, type ScanAccountPrinter, type ScanState } from './text'

export * from './text'

export interface ScanDeps {
  /** The account's printers; `[]` when signed out. Rejects when the console cannot be reached. */
  accountPrinters: () => Promise<ScanAccountPrinter[]>;
  /** The console's same-network list. Rejects when the console cannot be reached. */
  nearby: () => Promise<CloudNearbyPrinter[]>;
  /** Whether this browser reaches `https://<name>` and it answers as a Muon printer. */
  reach: (secureName: string) => Promise<boolean>;
  /** Opens the Bluetooth chooser; null when this browser cannot. Must be called from the click. */
  bluetooth: (() => Promise<NearbyPrinter | null>) | null;
  /** Why Bluetooth cannot be used here, when `bluetooth` is null. */
  bluetoothUnavailable?: string | null;
  /** The limit for each cloud request and probe, ms. */
  timeoutMs?: number;
  /** The name this page is served from. */
  pageHost?: string;
}

/** `work`, or a throw once `ms` passes. */
function limited<T> (work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('timed out')), ms) })
  return Promise.race([work, late]).finally(() => clearTimeout(timer))
}

async function scanCloud (deps: ScanDeps, st: ScanState) {
  const ms = deps.timeoutMs ?? SCAN_TIMEOUT_MS
  st.cloud = 'running'
  const [accounts, nearby] = await Promise.allSettled([
    limited(deps.accountPrinters(), ms),
    limited(deps.nearby(), ms)
  ])
  if (accounts.status === 'rejected' && nearby.status === 'rejected') {
    st.cloud = 'skipped'
    st.cloudWhy = OFFLINE_WHY
    return
  }
  const mine = accounts.status === 'fulfilled' ? accounts.value : []
  const beside = nearby.status === 'fulfilled' ? nearby.value : []
  if (accounts.status === 'fulfilled') st.tried.push(CLOUD_ACCOUNT)
  if (nearby.status === 'fulfilled') st.tried.push(CLOUD_NEARBY)

  // Only names under our zone are ever probed (secureNameOf), each once, all at the same time.
  const seen = new Set<string>()
  const candidates = mine.flatMap(p => {
    const secureName = secureNameOf(p)
    if (!secureName || seen.has(secureName)) return []
    seen.add(secureName)
    return [{ id: p.id, name: p.name, secureName }]
  })
  const reached = new Set<string>()
  await Promise.all(candidates.map(async c => {
    const ok = await limited(deps.reach(c.secureName), ms).catch(() => false)
    if (!ok) return
    reached.add(c.id.toLowerCase())
    st.secure.push({ id: c.id, name: c.name, secureName: c.secureName, url: `https://${c.secureName}/` })
  }))
  st.secure.sort((a, b) => a.name.localeCompare(b.name))

  // The printer's own page, for a printer the console puts beside this browser that did not answer securely.
  for (const near of beside) {
    if (reached.has(near.printerId.toLowerCase())) continue
    const route = localRoute({
      hosted: true,
      host: null,
      secureName: null,
      pageHost: deps.pageHost ?? '',
      mdnsHost: mdnsHostFromName(near.name),
      nearby: near,
      nearbyChecked: true,
      blockedByPage: false
    })
    if (route.kind === 'page') st.local.push({ id: near.printerId, name: near.name, host: route.host, url: `http://${route.host}/` })
  }
  st.cloud = 'done'
}

async function scanBluetooth (deps: ScanDeps, st: ScanState, started: Promise<NearbyPrinter | null> | null) {
  if (!started) {
    st.bluetooth = 'skipped'
    st.bluetoothWhy = deps.bluetoothUnavailable ?? "This browser can't use Bluetooth."
    return
  }
  st.bluetooth = 'running'
  try {
    st.heard = await started
    st.tried.push('Bluetooth')
  } catch {
    st.heard = null
  }
  st.bluetooth = 'done'
}

/**
 * Runs the scan. Bluetooth is started before anything else and synchronously, so the chooser opens inside
 * the click that called this. Resolves when every part has finished; `st` is updated as results arrive.
 */
export async function runScan (deps: ScanDeps, st: ScanState = newScanState()): Promise<ScanState> {
  const bluetooth = deps.bluetooth ? deps.bluetooth() : null
  Object.assign(st, newScanState(), { phase: 'scanning' as const })
  await Promise.all([
    scanCloud(deps, st).catch(() => {
      st.cloud = 'skipped'
      st.cloudWhy = OFFLINE_WHY
    }),
    scanBluetooth(deps, st, bluetooth)
  ])
  // In a fixed order, whichever part finished first.
  const order = [CLOUD_ACCOUNT, CLOUD_NEARBY, 'Bluetooth']
  st.tried.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  st.phase = 'done'
  return st
}
