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
  if (isOwnHotspot(pageHost)) return nearby.localAddrs[0] ?? null
  return nearbyHost(nearby.localAddrs)
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
