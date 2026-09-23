/**
 * Finds Muon3D printers on the network this browser is on.
 *
 * A browser cannot browse mDNS, so this asks addresses directly. Every M1
 * answers `GET /server/muon/identity` on port 80. The search goes in order:
 * the printers Fluidd already knows, then the /24 networks those printers sit
 * on, then common home and hotspot networks. A network is swept only after its
 * `.1` address answered quickly, which is how a network the browser can reach
 * looks. A network that is not there leaves the probe waiting until it times out.
 *
 * A page served over HTTPS cannot fetch plain HTTP on the LAN, so there the
 * search reports itself unavailable and the code is the way to link.
 */
import Vue from 'vue'
import store from '@/store'
import type { InstanceConfig } from '@/store/config/types'

export interface LanLinkStatus {
  phase: 'unavailable' | 'unlinked' | 'connecting' | 'code' | 'offer' | 'linked' | 'failed' | string;
  account?: string;
  code?: string;
  message?: string;
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
  '192.168.1', '192.168.0', '192.168.137', '10.0.0', '192.168.4', '192.168.68',
  '192.168.86', '192.168.2', '192.168.10', '10.0.1', '172.20.10', '10.42.0'
]

const PROBE_TIMEOUT_MS = 1500
const ALIVE_WITHIN_MS = 900
const CONCURRENCY = 64
const FRESH_FOR_MS = 60_000

export const discoveryState = Vue.observable({
  scanning: false,
  unavailable: false,
  /** The network being swept now, for the progress line. */
  network: '' as string,
  found: [] as LanPrinter[],
  finishedAt: 0
})

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
export async function probe (host: string): Promise<LanPrinter | null> {
  const apiUrl = apiUrlFor(host)
  let identity: any
  try {
    identity = await getJson(`${apiUrl}/server/muon/identity`)
  } catch {
    return null
  }
  if (!identity || typeof identity !== 'object') return null
  const name = String(identity.display || identity.name || host)
  return { host, apiUrl, name, link: await lanLinkStatus(apiUrl) }
}

function remember (printer: LanPrinter) {
  const i = discoveryState.found.findIndex(p => p.host === printer.host)
  if (i >= 0) discoveryState.found.splice(i, 1, printer)
  else discoveryState.found.push(printer)
}

/** Whether something answered at `host` quickly: a refusal is an answer. */
async function answersQuickly (host: string): Promise<boolean> {
  const controller = new AbortController()
  const started = performance.now()
  const timer = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  try {
    await fetch(`http://${host}/`, { mode: 'no-cors', signal: controller.signal, cache: 'no-store' })
    return true
  } catch {
    return performance.now() - started < ALIVE_WITHIN_MS
  } finally {
    window.clearTimeout(timer)
  }
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

    const own = known.filter(isIpv4).map(h => h.split('.').slice(0, 3).join('.'))
    const candidates = [...new Set([...own, ...COMMON_NETWORKS])]
    const alive: string[] = [...new Set(own)]
    await pool(candidates.filter(n => !alive.includes(n)), async network => {
      if (await answersQuickly(`${network}.1`)) alive.push(network)
    })

    const seen = new Set(discoveryState.found.map(p => p.host))
    for (const network of alive) {
      discoveryState.network = `${network}.x`
      const hosts: string[] = []
      for (let i = 1; i < 255; i++) {
        const host = `${network}.${i}`
        if (!seen.has(host)) hosts.push(host)
      }
      await pool(hosts, async host => {
        const printer = await probe(host)
        if (printer) {
          seen.add(host)
          remember(printer)
        }
      })
    }
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
