import { sha256Hex } from './sha256'
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
  /** SHA-256 of `html`, checked before a kept copy is served. */
  sha256: string
}

/**
 * Where kept copies live, one per printer (`key`: the printer Control is
 * connected to, from what Control holds, never from what the printer says).
 * A printer's ETag proves nothing about another printer's page, so a copy is
 * only ever offered back to the printer it came from.
 */
export interface PanelCopies {
  get: (key: string) => PanelCopy | null
  keep: (key: string, copy: PanelCopy) => void
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
const STORAGE_KEY = 'muon.panel-copies.v2'
/** Printers kept, newest last: the screen is a few hundred KB each. */
const MAX_PRINTERS = 3

const memory = new Map<string, PanelCopy>()

function stored (): Record<string, PanelCopy> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as unknown
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, PanelCopy> : {}
  } catch { return {} }
}

export const defaultCopies: PanelCopies = {
  get: key => {
    const copy = memory.get(key) ?? stored()[key]
    return copy && typeof copy.etag === 'string' && typeof copy.html === 'string' && typeof copy.sha256 === 'string' ? copy : null
  },
  keep: (key, copy) => {
    memory.delete(key)
    memory.set(key, copy)
    while (memory.size > MAX_PRINTERS) memory.delete(memory.keys().next().value as string)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(memory))) } catch { /* too big or blocked: memory only */ }
  }
}

function etagOf (headers: Record<string, unknown> | undefined): string {
  if (!headers) return ''
  for (const [k, v] of Object.entries(headers)) if (k.toLowerCase() === 'etag' && typeof v === 'string') return v.trim()
  return ''
}

export async function loadPanelBundle (
  get: PanelFetch,
  key: string,
  onProgress: (loaded: number, total: number) => void = () => {},
  copies: PanelCopies = defaultCopies
): Promise<PanelBundle> {
  // Only this printer's own copy, and only if it is still the bytes that were kept.
  const own = copies.get(key)
  const kept = own && sha256Hex(own.html) === own.sha256 ? own : null
  const headers: Record<string, string> = { Accept: 'text/html' }
  if (kept?.etag) headers['If-None-Match'] = kept.etag
  let response
  try {
    response = await get(PANEL_URL, { headers, onProgress })
  } catch {
    return { state: 'unknown' }
  }
  if (response.status === 304) {
    // No validator is sent without this printer's own verified copy, so a 304 with none is not believed.
    return kept ? { state: 'yes', html: kept.html, fromCopy: true } : { state: 'unknown' }
  }
  const verdict = classifyPanelResponse(response)
  if (verdict !== 'yes') return { state: verdict }
  const html = response.data
  if (typeof html !== 'string' || !html.includes('<') || html.length > PANEL_MAX_CHARS) return { state: 'unknown' }
  const etag = etagOf(response.headers)
  if (etag) copies.keep(key, { etag, html, sha256: sha256Hex(html) })
  return { state: 'yes', html, fromCopy: false }
}
