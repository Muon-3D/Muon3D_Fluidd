/**
 * Finds Muon3D printers on the network this browser is on.
 *
 * A browser cannot browse mDNS, so this asks addresses directly. Every M1
 * answers `GET /server/muon/identity` on port 80. The search goes in order:
 * the printers Fluidd already knows, then the /24 networks those printers sit
 * on, then the common home networks whose gateway (.1 or .254) answers
 * quickly, then the Windows hotspot network.
 *
 * An address nobody holds and an address on a network the browser has no route
 * to both just time out, so only a gateway that answers says that a network is
 * there. On a Windows hotspot the gateway is this machine, and its firewall
 * drops the probe, so that network is swept without the check.
 *
 * The sweep is paced. Chromium slows down when it cancels many pending
 * connections at once. Above about 25 a second, later probes wait in its queue
 * past their own timeout, and a printer that answers in 60 ms is missed.
 * Measured on 2026-09-23: 64 probes at a time with a 3 s timeout found the
 * printer every time. At 0.8 s or 1.5 s it was missed.
 *
 * A page served over HTTPS cannot fetch plain HTTP on the LAN, so there the
 * sweep reports itself unavailable. The Muon3D service fills the gap: it lists
 * the unlinked printers that connect to it from this browser's public address
 * (`refreshCloudNearby`), on any page, HTTPS included.
 */
import Vue from 'vue'
import store from '@/store'
import type { InstanceConfig } from '@/store/config/types'
import { cloudApi } from './api'

export interface LanLinkStatus {
  phase: 'unavailable' | 'unlinked' | 'connecting' | 'code' | 'offer' | 'linked' | 'failed' | string;
  account?: string;
  code?: string;
  message?: string;
}

/** A printer the Muon3D service sees behind this browser's public address. */
export interface CloudNearbyPrinter {
  printerId: string;
  name: string;
  model: string;
  /** Some account has linked it: this one's, or another's. */
  linked: boolean;
}

export interface LanPrinter {
  /** The address the printer answered on. */
  host: string;
  /** What Fluidd connects to for this printer. */
  apiUrl: string;
  /** "Boxwood · 367A". */
  name: string;
  link: LanLinkStatus;
}

/** Networks worth trying when nothing else says where the printers are. */
const COMMON_NETWORKS = [
  '192.168.1', '192.168.0', '10.0.0', '192.168.4', '192.168.68', '192.168.86',
  '192.168.2', '192.168.10', '10.0.1', '172.20.10', '192.168.43', '10.42.0'
]

/** Windows Mobile Hotspot always uses this network, with this machine as .1. */
const WINDOWS_HOTSPOT_NETWORK = '192.168.137'

const PROBE_TIMEOUT_MS = 3000
const GATEWAY_TIMEOUT_MS = 1500
const GATEWAY_ANSWERS_WITHIN_MS = 900
const CONCURRENCY = 64
const FRESH_FOR_MS = 60_000

export const discoveryState = Vue.observable({
  scanning: false,
  unavailable: false,
  /** The network being swept now, for the progress line. */
  network: '' as string,
  found: [] as LanPrinter[],
  /** From the service, which works on an HTTPS page too. */
  cloud: [] as CloudNearbyPrinter[],
  cloudChecked: false,
  finishedAt: 0
})

/** Letters and digits only, lower case: "Boxwood · 367A" and "Muon-boxwood-367a" both contain "boxwood367a". */
function nameKey (name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Whether a printer found on the LAN is the same one the service reported. */
export function sameNamedPrinter (a: string, b: string) {
  const x = nameKey(a)
  const y = nameKey(b)
  return !!x && !!y && (x.includes(y) || y.includes(x))
}

/** Asks the Muon3D service which unlinked printers share this browser's network. */
export async function refreshCloudNearby () {
  try {
    const { printers } = await cloudApi.nearby()
    discoveryState.cloud = printers.map(p => ({ printerId: p.printer_id, name: p.name, model: p.model, linked: !!p.linked }))
  } catch {
    discoveryState.cloud = []
  } finally {
    discoveryState.cloudChecked = true
  }
}

let running: Promise<void> | null = null

function isIpv4 (host: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host)
}

function hostOf (url: string): string | null {
  try {
    return new URL(url).hostname || null
  } catch {
    return null
  }
}

async function getJson (url: string, init: RequestInit = {}, timeout = PROBE_TIMEOUT_MS): Promise<any> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const body = await response.json()
    return body?.result ?? body
  } finally {
    window.clearTimeout(timer)
  }
}

function apiUrlFor (host: string) {
  return `http://${host}`
}

/** Reads a printer's link state through its own Moonraker. */
export async function lanLinkStatus (apiUrl: string): Promise<LanLinkStatus> {
  try {
    const s = await getJson(`${apiUrl}/server/muon/link`, {}, 3000)
    return s && typeof s.phase === 'string' ? s : { phase: 'unavailable' }
  } catch {
    return { phase: 'unavailable' }
  }
}

/** Asks one address whether it is a Muon3D printer. */
export async function probe (host: string, timeout = PROBE_TIMEOUT_MS): Promise<LanPrinter | null> {
  const apiUrl = apiUrlFor(host)
  let identity: any
  try {
    identity = await getJson(`${apiUrl}/server/muon/identity`, {}, timeout)
  } catch {
    return null
  }
  if (!identity || typeof identity !== 'object') return null
  const name = String(identity.display || identity.name || host)
  return { host, apiUrl, name, link: await lanLinkStatus(apiUrl) }
}

/** Whether something answered at `host` quickly. A refusal is an answer. */
async function answersQuickly (host: string): Promise<boolean> {
  const controller = new AbortController()
  const started = performance.now()
  const timer = window.setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS)
  try {
    await fetch(`http://${host}/`, { mode: 'no-cors', signal: controller.signal, cache: 'no-store' })
    return true
  } catch {
    return performance.now() - started < GATEWAY_ANSWERS_WITHIN_MS
  } finally {
    window.clearTimeout(timer)
  }
}

function remember (printer: LanPrinter) {
  const i = discoveryState.found.findIndex(p => p.host === printer.host)
  if (i >= 0) discoveryState.found.splice(i, 1, printer)
  else discoveryState.found.push(printer)
}

async function pool<T> (items: T[], work: (item: T) => Promise<void>) {
  let next = 0
  const runners = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]
      await work(item)
    }
  })
  await Promise.all(runners)
}

function knownHosts (): string[] {
  const instances: InstanceConfig[] = store.getters['config/getInstances'] ?? []
  const hosts = instances.map(i => hostOf(i.apiUrl)).filter((h): h is string => !!h && !h.endsWith('.invalid'))
  if (isIpv4(location.hostname) && location.hostname !== '127.0.0.1') hosts.push(location.hostname)
  return [...new Set(hosts)]
}

async function sweep () {
  discoveryState.scanning = true
  try {
    const known = knownHosts()
    discoveryState.network = 'printers you have added'
    await pool(known, async host => {
      const printer = await probe(host)
      if (printer) remember(printer)
    })

    const own = [...new Set(known.filter(isIpv4).map(h => h.split('.').slice(0, 3).join('.')))]
    discoveryState.network = 'this network'
    const answering = new Set<string>()
    await pool(COMMON_NETWORKS.filter(n => !own.includes(n)), async network => {
      const [first, last] = await Promise.all([answersQuickly(`${network}.1`), answersQuickly(`${network}.254`)])
      if (first || last) answering.add(network)
    })
    const networks = [...new Set([
      ...own,
      ...COMMON_NETWORKS.filter(n => answering.has(n)),
      WINDOWS_HOTSPOT_NETWORK
    ])]
    const seen = new Set(discoveryState.found.map(p => p.host))
    const hosts: string[] = []
    for (const network of networks) {
      for (let i = 1; i < 255; i++) {
        const host = `${network}.${i}`
        if (!seen.has(host)) hosts.push(host)
      }
    }
    await pool(hosts, async host => {
      discoveryState.network = `${host.slice(0, host.lastIndexOf('.'))}.x`
      const printer = await probe(host)
      if (printer) remember(printer)
    })
  } finally {
    discoveryState.scanning = false
    discoveryState.network = ''
    discoveryState.finishedAt = Date.now()
  }
}

/**
 * Searches the network, or returns the search already running. A search that
 * finished in the last minute is reused unless `force` is set.
 */
export function discoverPrinters (force = false): Promise<void> {
  refreshCloudNearby().catch(() => {})
  if (location.protocol === 'https:') {
    discoveryState.unavailable = true
    return Promise.resolve()
  }
  if (running) return running
  if (!force && Date.now() - discoveryState.finishedAt < FRESH_FOR_MS) return Promise.resolve()
  running = sweep().finally(() => { running = null })
  return running
}

/** Refreshes the link state of the printers already found. */
export async function refreshLinkStates () {
  await Promise.all(discoveryState.found.map(async p => {
    remember({ ...p, link: await lanLinkStatus(p.apiUrl) })
  }))
}

/**
 * Starts a link on a printer through its own Moonraker and returns the code
 * its screen shows. Moonraker only lets the LAN start a link. Only the
 * printer's owner, at the printer, can confirm it.
 */
export async function startLanLink (apiUrl: string): Promise<string> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(`${apiUrl}/server/muon/link/start`, { method: 'POST', signal: controller.signal })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.error?.message ?? `The printer refused to start linking (HTTP ${response.status}).`)
    }
  } finally {
    window.clearTimeout(timer)
  }
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 700))
    const s = await lanLinkStatus(apiUrl)
    if (s.phase === 'code' && s.code) return s.code
    if (s.phase === 'failed') throw new Error(s.message || 'The printer could not reach the Muon3D service.')
    if (s.phase === 'unavailable') throw new Error('This printer cannot link to an account yet. Update it first.')
  }
  throw new Error('The printer did not get a code from the Muon3D service.')
}

/** A Fluidd instance for a printer found on the network. */
export function instanceFor (printer: LanPrinter): InstanceConfig {
  return {
    name: printer.name,
    apiUrl: printer.apiUrl,
    socketUrl: `ws://${printer.host}/websocket`,
    active: true
  }
}
