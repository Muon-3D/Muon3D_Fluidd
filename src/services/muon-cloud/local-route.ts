/**
 * What "Connect locally" does for a printer (KAN-2529).
 *
 * On a page the printer served over http, Control reaches the printer itself
 * on the LAN. On the hosted https page it cannot: mixed content and Chrome's
 * local-network check stop it fetching `http://` addresses, and LAN discovery
 * never runs there. What it can do is send the person to the printer:
 *
 * 1. its own secure address (`secure_name`, KAN-2198), once a probe shows this
 *    browser reaches it;
 * 2. else `http://<address>/` in a new tab, from the addresses the Muon3D
 *    service says the printer holds on this browser's network (a top-level
 *    navigation is allowed where a fetch is not);
 * 3. else nothing, and an honest reason.
 */
import { isOwnHotspot, nearbyHost, type CloudNearbyPrinter } from './discovery'

/** Said when the printer is not on this browser's network, as far as anyone knows. */
export const NOT_ON_NETWORK = 'Not found on this network'

/** Said when the page, not the network, is what stops Control reaching the printer. */
export const BLOCKED_BY_PAGE = "This browser can't reach it from this page"

export type LocalRoute =
  | { kind: 'secure', name: string }
  | { kind: 'tab', addr: string }
  | { kind: 'lan' }
  | { kind: 'none', reason: string }

export interface LocalRouteInput {
  /** The page is the hosted https one. */
  hosted: boolean;
  /** The printer's address from LAN discovery, when found. */
  host: string | null;
  /** The printer's secure name from the console, when it has one. */
  secureName: string | null;
  /** The name this page is served from. */
  pageHost: string;
  /** The service's nearby entry for this printer. */
  nearby: CloudNearbyPrinter | undefined;
  /** The service's nearby list has been read. */
  nearbyChecked: boolean;
  /** An http page the browser stops reaching LAN addresses (opened by name). */
  blockedByPage: boolean;
}

/**
 * The address to open: the first the service reports that is not the printer's
 * own hotspot, unless this page is itself on that hotspot.
 */
export function openableAddr (nearby: CloudNearbyPrinter | undefined, pageHost = ''): string | null {
  if (!nearby) return null
  const addrs = nearby.localAddrs.filter(a => isOpenableAddr(a))
  if (isOwnHotspot(pageHost)) return addrs[0] ?? null
  return nearbyHost(addrs)
}

/**
 * Whether an address from the console is safe to build `http://<addr>/` from:
 * a private IPv4 address (10/8, 172.16/12, 192.168/16), or a single-label or
 * `.local` host name. Nothing with a userinfo, port, path or public address.
 * The hotspot range is allowed here and left to the caller to skip.
 */
export function isOpenableAddr (addr: unknown): addr is string {
  if (typeof addr !== 'string') return false
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(addr)
  if (m) {
    const o = m.slice(1).map(Number)
    if (o.some(x => x > 255) || m.slice(1).some(x => x.length > 1 && x.startsWith('0'))) return false
    return o[0] === 10 || (o[0] === 172 && o[1] >= 16 && o[1] <= 31) || (o[0] === 192 && o[1] === 168)
  }
  if (!/^[a-z0-9-]+(\.local)?$/i.test(addr) || /^-|-$|-\.|\.-/.test(addr)) return false
  // A name the URL parser reads as a number is an IPv4 address in disguise ('3232235777', '0x08080808'):
  // only a name that comes back from the parser unchanged is a name.
  try {
    return new URL(`http://${addr}/`).hostname === addr.toLowerCase()
  } catch {
    return false
  }
}

export function localRoute (i: LocalRouteInput): LocalRoute {
  if (i.hosted) {
    if (i.secureName && i.secureName !== i.pageHost) return { kind: 'secure', name: i.secureName }
    const addr = openableAddr(i.nearby, i.pageHost)
    if (addr) return { kind: 'tab', addr }
    // The service's list was read and the printer is not beside this browser (or has
    // no usable address): not found. Not read yet: the page is why it cannot be told.
    return { kind: 'none', reason: i.nearbyChecked ? NOT_ON_NETWORK : BLOCKED_BY_PAGE }
  }
  if (i.host) return { kind: 'lan' }
  return { kind: 'none', reason: i.blockedByPage ? BLOCKED_BY_PAGE : NOT_ON_NETWORK }
}
