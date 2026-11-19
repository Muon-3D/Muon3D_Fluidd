import { classifyPanelResponse, type PanelOnPrinter } from './served'

/**
 * The printer's screen, fetched from the printer over the route Control is
 * using for it (LAN, Bluetooth or relay) and framed from memory, so hosted
 * Control (control.muon3d.com, which serves no /panel/) can show it too
 * (KAN-4812, KAN-3635).
 *
 * MuonUI's embed build is one self-contained index.html (every script, style
 * and asset inlined, its own CSP inside), so a single request carries the
 * whole screen and there is nothing to rewrite. It goes into the sandboxed
 * frame as `srcdoc`.
 *
 * The page is kept by its ETag. The next open asks "If-None-Match" and, when
 * the printer says 304, uses the kept copy, so a Bluetooth link is not asked
 * for several hundred KB each time the screen opens. A conditional answer
 * means "the printer's current build is the kept one", whichever printer it
 * is, so the kept copy is per build, not per printer.
 */
export interface PanelCopy {
  etag: string
  html: string
}

/** Where kept copies live; the default is memory plus (best effort) localStorage. */
export interface PanelCopies {
  /** The newest copy kept, or null. */
  latest: () => PanelCopy | null
  keep: (copy: PanelCopy) => void
}

export interface PanelRequest {
  headers: Record<string, string>
  /** Bytes so far and the whole size, when the route reports them. */
  onProgress: (loaded: number, total: number) => void
}

export type PanelFetch = (url: string, request: PanelRequest) => Promise<{ status: number, headers?: Record<string, unknown>, data?: unknown }>

export type PanelBundle =
  | { state: 'yes', html: string, fromCopy: boolean }
  | { state: Exclude<PanelOnPrinter, 'yes'> }

export const PANEL_URL = '/panel/index.html'
/** More than this is not the screen. */
export const PANEL_MAX_CHARS = 8 * 1024 * 1024
const STORAGE_KEY = 'muon.panel-copy.v1'

let memory: PanelCopy | null = null

export const defaultCopies: PanelCopies = {
  latest: () => {
    if (memory) return memory
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const copy = raw ? JSON.parse(raw) as Partial<PanelCopy> : null
      if (copy && typeof copy.etag === 'string' && typeof copy.html === 'string') memory = { etag: copy.etag, html: copy.html }
    } catch { /* storage is a convenience */ }
    return memory
  },
  keep: copy => {
    memory = copy
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(copy)) } catch { /* too big or blocked: memory only */ }
  }
}

function etagOf (headers: Record<string, unknown> | undefined): string {
  if (!headers) return ''
  for (const [k, v] of Object.entries(headers)) if (k.toLowerCase() === 'etag' && typeof v === 'string') return v.trim()
  return ''
}

export async function loadPanelBundle (
  get: PanelFetch,
  onProgress: (loaded: number, total: number) => void = () => {},
  copies: PanelCopies = defaultCopies
): Promise<PanelBundle> {
  const kept = copies.latest()
  const headers: Record<string, string> = { Accept: 'text/html' }
  if (kept?.etag) headers['If-None-Match'] = kept.etag
  let response
  try {
    response = await get(PANEL_URL, { headers, onProgress })
  } catch {
    return { state: 'unknown' }
  }
  if (response.status === 304) return kept ? { state: 'yes', html: kept.html, fromCopy: true } : { state: 'unknown' }
  const verdict = classifyPanelResponse(response)
  if (verdict !== 'yes') return { state: verdict }
  const html = response.data
  if (typeof html !== 'string' || !html.includes('<') || html.length > PANEL_MAX_CHARS) return { state: 'unknown' }
  const etag = etagOf(response.headers)
  if (etag) copies.keep({ etag, html })
  return { state: 'yes', html, fromCopy: false }
}
