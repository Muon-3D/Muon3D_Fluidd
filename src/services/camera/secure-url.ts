/**
 * Camera addresses on a page served over https (Jack, 25 Nov: control.muon3d.com showed "Not secure" while connected
 * to a printer by its secure name). Moonraker reports a webcam as `http://<ip>/webcam/?action=stream`, an http
 * address, and an `<img>` pointed at it from the https page is mixed content.
 *
 * Rules, on an https page only (an http page, the printer's own, is left as it was):
 * - A relative address is the printer's: it is resolved against the printer's own origin (the secure name), not the
 *   page's.
 * - An `http://` address that points at the same printer (its own host, or an address it reported or the browser
 *   learned for it) is moved onto the printer's origin, which is https. Another printer's address is not.
 * - Any other `http://` or `ws://` address cannot be made secure: it is blocked, and the page says so.
 */

export interface CameraUrlContext {
  /** The page's own address (`document.URL`). */
  pageUrl: string;
  /** The printer Control is connected to (`config.apiUrl`). */
  apiUrl?: string | null;
  /** Addresses the printer reported for itself (its network interfaces), plus any the browser learned for it. */
  printerHosts?: ReadonlyArray<string>;
}

export type CameraUrl =
  | { blocked: false, url: URL }
  | { blocked: true, url: URL, reason: string }

export const CAMERA_NEEDS_SECURE = 'This camera needs a secure address.'

function absolute (value: string | null | undefined): URL | null {
  if (!value) return null
  try { return new URL(value) } catch { return null }
}

export function resolveCameraUrl (raw: string, ctx: CameraUrlContext): CameraUrl {
  const page = new URL(ctx.pageUrl)
  const printer = absolute(ctx.apiUrl)
  const secure = page.protocol === 'https:'
  // A relative address is the printer's own: on the hosted page that is the secure origin, not control.muon3d.com.
  const base = secure && printer?.protocol === 'https:' ? printer.origin : page.origin
  const url = new URL(raw, base)
  if (!secure) return { blocked: false, url }
  if (url.protocol !== 'http:' && url.protocol !== 'ws:') return { blocked: false, url }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase()
  const known = (ctx.printerHosts ?? []).some(h => h.toLowerCase() === host)
  const sameHost = !!printer && printer.hostname.toLowerCase() === host
  // Only this printer's own host or an address it reported moves onto the secure origin: another printer on the same
  // network answers on its own /webcam/ route, and that stays blocked.
  if (printer?.protocol === 'https:' && (known || sameHost) && (url.port === '' || url.port === '80')) {
    const moved = new URL(`${url.pathname}${url.search}${url.hash}`, printer.origin)
    return { blocked: false, url: moved }
  }
  return { blocked: true, url, reason: CAMERA_NEEDS_SECURE }
}

/** The context from the store's state. */
export function cameraContext (state: any): CameraUrlContext {
  const network = state?.server?.system_info?.network ?? {}
  const printerHosts: string[] = []
  for (const entry of Object.values<any>(network)) {
    for (const a of entry?.ip_addresses ?? []) if (typeof a?.address === 'string') printerHosts.push(a.address)
  }
  return { pageUrl: document.URL, apiUrl: state?.config?.apiUrl, printerHosts }
}
