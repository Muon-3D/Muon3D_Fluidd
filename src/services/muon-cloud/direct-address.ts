/**
 * Connecting to a printer by its LAN address, in place on the hosted page (KAN-6283, Recommendation A).
 *
 * Some home routers (BT Home Hub, dnsmasq `stop-dns-rebind`, probably Army networks) drop a public name that points at
 * a private address, so `https://<label>.muonlan.net` never resolves. Chromium's Local Network Access lets the
 * https page reach the printer at `http://<ip>` once the person allows it (one browser question, remembered):
 * requests that carry `targetAddressSpace: 'local'` and pass that permission are exempt from mixed-content blocking,
 * for fetch and for the websocket. No DNS is involved, so the rebinding filter never sees it.
 *
 * What it may dial: only a private or link-local address (RFC1918, 169.254/16, fc00::/7, fe80::/10) that the Muon3D
 * service lists beside this browser, or that the printer itself reported. Never a host typed or sent by anything else.
 * Before the printer is shown as connected, its own `/server/muon/identity` must name the printer expected (its
 * EndpointId, else its name). Nothing from the Muon3D account is sent: a plain GET with no credentials and no
 * redirects, then the printer is opened as any local printer is (with its own Moonraker login).
 */
import type { InstanceConfig } from '@/store/config/types'
import { activateLocalPrinter } from './activate'
import { directAddressState } from './direct-address-state'
import { isOwnHotspot, lanFetch, localNetworkPermission } from './discovery'

/** Said before Chrome asks its one-time local network question, so the question makes sense. */
export const LNA_PREPROMPT = 'Chrome will ask to allow access to devices on your local network. Allow it to connect directly.'

/** The first Chromium with Local Network Access's permission and `targetAddressSpace` (Chrome and Edge 142). */
const LNA_MIN_MAJOR = 142

/**
 * Whether this browser can reach a private address from an https page at all: it has `targetAddressSpace` on a
 * request, or is Chrome/Edge new enough to have Local Network Access. Safari, older Firefox and iOS browsers have
 * neither, and are not tried (the printer's own page is the way there).
 */
export function lnaSupported (): boolean {
  if (typeof location === 'undefined' || location.protocol !== 'https:') return false
  try {
    if (typeof Request !== 'undefined' && 'targetAddressSpace' in Request.prototype) return true
  } catch { /* fall through to the version check */ }
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  if (/CriOS|EdgiOS|FxiOS|Firefox/.test(ua)) return false
  const m = /\b(?:Chrome|Edg)\/(\d+)/.exec(ua)
  return !!m && Number(m[1]) >= LNA_MIN_MAJOR
}

function privateV4 (a: string): boolean {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(a)
  if (!m) return false
  // No leading zeros ('010.0.0.1' is read as octal by some parsers) and no octet above 255.
  if (m.slice(1).some(x => Number(x) > 255 || (x.length > 1 && x.startsWith('0')))) return false
  const [o1, o2] = m.slice(1).map(Number)
  return o1 === 10 || (o1 === 172 && o2 >= 16 && o2 <= 31) || (o1 === 192 && o2 === 168) || (o1 === 169 && o2 === 254)
}

function privateV6 (a: string): boolean {
  if (!/^[0-9a-f:]+$/i.test(a) || !a.includes(':') || a.length > 39) return false
  const first = a.split(':')[0].padStart(4, '0').toLowerCase()
  if (!/^[0-9a-f]{4}$/.test(first)) return false
  const n = parseInt(first, 16)
  // fc00::/7 and fe80::/10
  return (n & 0xfe00) === 0xfc00 || (n & 0xffc0) === 0xfe80
}

/** Whether `a` is a literal address in a private or link-local range. Names are never private addresses. */
export function isPrivateAddress (a: unknown): a is string {
  return typeof a === 'string' && (privateV4(a) || privateV6(a))
}

/** The addresses worth dialling, in order: private or link-local, not the printer's own hotspot, no repeats. */
export function directCandidates (addrs: ReadonlyArray<unknown>): string[] {
  const out: string[] = []
  for (const a of addrs) {
    if (isPrivateAddress(a) && !isOwnHotspot(a) && !out.includes(a.toLowerCase())) out.push(a.toLowerCase())
  }
  return out.slice(0, 3)
}

/** A host as it goes in a URL. */
export function urlHost (addr: string): string {
  return addr.includes(':') ? `[${addr}]` : addr
}

export interface ExpectedPrinter {
  /** The ids the printer is known by (account id, EndpointId). */
  ids: ReadonlyArray<string | null | undefined>;
  /** Names the printer may report, used only when it reports no id. */
  names: ReadonlyArray<string | null | undefined>;
}

/**
 * Whether what a printer says of itself at `/server/muon/identity` is the printer expected. An id it reports must be
 * one of ours; a printer that reports none is matched by name; nothing matching is a different printer.
 */
export function identityMatches (identity: unknown, want: ExpectedPrinter): boolean {
  if (!identity || typeof identity !== 'object') return false
  const i = identity as Record<string, unknown>
  const same = (a: unknown, b: unknown) => typeof a === 'string' && typeof b === 'string' && a.trim() !== '' && a.trim().toLowerCase() === b.trim().toLowerCase()
  const id = typeof i.endpoint_id === 'string' && i.endpoint_id ? i.endpoint_id : null
  if (id) return want.ids.some(w => same(id, w))
  return [i.name, i.display].some(n => want.names.some(w => same(n, w)))
}

export type DirectResult =
  | { ok: true, host: string }
  | { ok: false, why: 'unsupported' | 'no-address' | 'blocked' | 'unreachable' | 'mismatch' | 'failed' }

const PROBE_MS = 8000
/** While the browser's own question is open the request waits for the person. */
const ASKING_MS = 45000

async function identityAt (addr: string, timeout: number): Promise<{ status: 'ok', identity: unknown } | { status: 'fail' }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await lanFetch(`http://${urlHost(addr)}/server/muon/identity`, {
      mode: 'cors', credentials: 'omit', redirect: 'error', cache: 'no-store', signal: controller.signal
    })
    if (!response.ok) return { status: 'fail' }
    const body = await response.json()
    return { status: 'ok', identity: body?.result ?? body }
  } catch {
    return { status: 'fail' }
  } finally {
    clearTimeout(timer)
  }
}

export function directInstance (addr: string, label: string, endpointId?: string | null): InstanceConfig {
  const host = urlHost(addr)
  return { name: label, apiUrl: `http://${host}`, socketUrl: `ws://${host}/websocket`, active: true, ...(endpointId ? { endpointId } : {}) }
}

/**
 * Connects Control to the printer at one of `addrs`, in place. Call it from the person's click: the browser's
 * local-network question belongs to that gesture. `onAsking` runs once, before the first request, when the browser
 * has yet to be asked (so the person is told what the question is for).
 */
export async function connectByAddress (o: {
  addrs: ReadonlyArray<unknown>;
  label: string;
  printerId?: string | null;
  endpointId?: string | null;
  names?: ReadonlyArray<string | null | undefined>;
  onAsking?: () => void;
}): Promise<DirectResult> {
  if (!lnaSupported()) return { ok: false, why: 'unsupported' }
  const candidates = directCandidates(o.addrs)
  if (!candidates.length) return { ok: false, why: 'no-address' }
  const permission = await localNetworkPermission()
  if (permission === 'denied') return { ok: false, why: 'blocked' }
  const asking = permission !== 'granted'
  if (asking) {
    o.onAsking?.()
    await new Promise(resolve => setTimeout(resolve, 0))
  }
  const want: ExpectedPrinter = { ids: [o.printerId, o.endpointId], names: [o.label, ...(o.names ?? [])] }
  let why: 'unreachable' | 'mismatch' = 'unreachable'
  for (const addr of candidates) {
    const read = await identityAt(addr, asking ? ASKING_MS : PROBE_MS)
    if (read.status === 'fail') {
      if (await localNetworkPermission() === 'denied') return { ok: false, why: 'blocked' }
      continue
    }
    if (!identityMatches(read.identity, want)) {
      why = 'mismatch'
      continue
    }
    const instance = directInstance(addr, o.label, o.endpointId ?? o.printerId)
    if (await activateLocalPrinter(instance, o.printerId ?? o.endpointId ?? null)) {
      directAddressState.host = addr
      return { ok: true, host: addr }
    }
    return { ok: false, why: 'failed' }
  }
  return { ok: false, why }
}
