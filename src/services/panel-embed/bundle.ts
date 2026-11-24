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
 * for several hundred KB each time the screen opens. The kept copy belongs to one
 * printer (its id, as Control holds it) and is hash-checked; it is never offered
 * to another. With no verified printer id (the LAN has none) nothing is kept,
 * no validator is sent, and the page is fetched fresh every time.
 *
 * Over Bluetooth the page is never fetched (KAN-6069): it is 1.9 MB (about 500 KB
 * gzipped) and the radio link that carries it also carries everything else, so one
 * pull of it starved the link until the printer dropped it. A kept copy is shown;
 * with none the screen says it needs a network connection.
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
  get: (key: string) => PanelCopy | null | Promise<PanelCopy | null>
  keep: (key: string, copy: PanelCopy) => void | Promise<void>
}

/** Holds a few records by key and says which it holds: IndexedDB in the page, a Map in a test. */
export interface PanelStore {
  get: (key: string) => Promise<unknown>
  put: (key: string, value: unknown) => Promise<void>
  /** Keys, oldest written first. */
  keys: () => Promise<string[]>
  delete: (key: string) => Promise<void>
}

/**
 * How the printer is being reached, so the screen is asked for in a way the route can bear.
 * - `bluetooth`: the session travels over the radio: nothing is fetched (see above).
 * - `compressed`: the route is one a browser cannot negotiate gzip for itself (Iroh, a relay): ask for it, and unzip it.
 * - `sameOrigin`: the page's own address for the screen, tried first when Control is served by the printer, so it
 *   never reaches across to the printer's secure name for a page its own origin serves (KAN-6062).
 */
export interface PanelRoute {
  bluetooth?: boolean
  compressed?: boolean
  sameOrigin?: string | null
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
  /** Over Bluetooth with no kept copy: the page is not fetched over the radio. */
  | { state: 'needs-network' }

/** Where the printer serves it through Moonraker: the one place Bluetooth and the relay gateway reach (it never reaches nginx). */
export const PANEL_URL_MOONRAKER = '/server/muon/panel/index.html'
/** Where nginx serves it on the LAN. */
export const PANEL_URL = '/panel/index.html'
/** What the screen's page says to its parent on load (protocol.ts): the mark of the real page. */
const EMBED_MARK = 'muon-panel-hello'
/** More than this is not the screen. */
export const PANEL_MAX_CHARS = 8 * 1024 * 1024
const LEGACY_STORAGE_KEY = 'muon.panel-copies.v2'
/** Printers kept, newest last: the screen is a few hundred KB each. */
export const MAX_PRINTERS = 3

function isCopy (copy: unknown): copy is PanelCopy {
  const c = copy as PanelCopy | null
  return !!c && typeof c.etag === 'string' && typeof c.html === 'string' && typeof c.sha256 === 'string'
}

/**
 * The kept copies, held in `store` and in memory while the page lives. Every store call is guarded: a store that is
 * missing, full or blocked (a private window) leaves the memory copy, never an error.
 */
export function createCopies (store: PanelStore | null): PanelCopies {
  const memory = new Map<string, PanelCopy>()
  return {
    get: async key => {
      const held = memory.get(key)
      if (held) return held
      try {
        const copy = await store?.get(key)
        if (isCopy(copy)) {
          memory.set(key, copy)
          return copy
        }
      } catch { /* unreadable: no copy */ }
      return null
    },
    keep: async (key, copy) => {
      memory.delete(key)
      memory.set(key, copy)
      while (memory.size > MAX_PRINTERS) memory.delete(memory.keys().next().value as string)
      if (!store) return
      try {
        await store.delete(key)
        await store.put(key, copy)
        const keys = await store.keys()
        for (const old of keys.slice(0, Math.max(0, keys.length - MAX_PRINTERS))) await store.delete(old)
      } catch { /* too big or blocked: memory only */ }
    }
  }
}

const DB_NAME = 'muon-panel'
const DB_STORE = 'copies'

/** IndexedDB, where there is one: the screen is too big for localStorage's few MB, which everything else shares. */
export function indexedDbStore (factory: IDBFactory | undefined = typeof indexedDB === 'undefined' ? undefined : indexedDB): PanelStore | null {
  if (!factory) return null
  let opening: Promise<IDBDatabase> | null = null
  const db = () => {
    opening ??= new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const request = factory.open(DB_NAME, 1)
        request.onupgradeneeded = () => { request.result.createObjectStore(DB_STORE) }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      } catch (error) {
        reject(error)
      }
    })
    return opening
  }
  const run = async <T>(mode: IDBTransactionMode, work: (objects: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const open = await db()
    return new Promise<T>((resolve, reject) => {
      const tx = open.transaction(DB_STORE, mode)
      const request = work(tx.objectStore(DB_STORE))
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  }
  return {
    get: key => run('readonly', o => o.get(key)).then(row => (row as { copy?: unknown } | undefined)?.copy ?? null),
    put: (key, value) => run('readwrite', o => o.put({ copy: value, at: Date.now() }, key)).then(() => undefined),
    keys: async () => {
      const rows = await run('readonly', o => o.getAll() as IDBRequest<Array<{ at?: number }>>)
      const keys = await run('readonly', o => o.getAllKeys())
      return keys.map((k, i) => ({ k: String(k), at: rows[i]?.at ?? 0 })).sort((a, b) => a.at - b.at).map(r => r.k)
    },
    delete: key => run('readwrite', o => o.delete(key)).then(() => undefined)
  }
}

let legacyCleared = false
function clearLegacyCopies () {
  if (legacyCleared) return
  legacyCleared = true
  // The old home was one localStorage key holding up to three whole pages: it left no room for anything else.
  try { localStorage.removeItem(LEGACY_STORAGE_KEY) } catch { /* blocked */ }
}

let shared: PanelCopies | null = null
const own = (): PanelCopies => {
  shared ??= createCopies(indexedDbStore())
  return shared
}

/** The page's own copies: IndexedDB, with memory in front of it. */
export const defaultCopies: PanelCopies = {
  get: key => own().get(key),
  keep: (key, copy) => {
    clearLegacyCopies()
    return own().keep(key, copy)
  }
}

/** The kept copy for `key`, only while it is still the bytes that were kept. */
export async function keptCopy (key: string | null, copies: PanelCopies = defaultCopies): Promise<PanelCopy | null> {
  if (!key) return null
  try {
    const held = await copies.get(key)
    return held && isCopy(held) && sha256Hex(held.html) === held.sha256 ? held : null
  } catch {
    return null
  }
}

/**
 * The page as text. A gzip body (a route that does not undo it, as Iroh does not) is unzipped, found by its magic
 * bytes rather than a header, because a browser that already decoded it still shows the header. A string, or bytes
 * already decoded, are read as they are.
 */
export async function pageText (data: unknown): Promise<string | null> {
  if (typeof data === 'string') return data
  let bytes: Uint8Array
  // By tag, not instanceof: the buffer may come from another realm (a worker, a test's jsdom).
  if (Object.prototype.toString.call(data) === '[object ArrayBuffer]') bytes = new Uint8Array(data as ArrayBuffer)
  else if (ArrayBuffer.isView(data)) bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  else return null
  if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream === 'undefined') return null
    const source = new Response(bytes as unknown as BodyInit).body
    if (!source) return null
    return new Response(source.pipeThrough(new DecompressionStream('gzip'))).text()
  }
  return new TextDecoder().decode(bytes)
}

function etagOf (headers: Record<string, unknown> | undefined): string {
  if (!headers) return ''
  for (const [k, v] of Object.entries(headers)) if (k.toLowerCase() === 'etag' && typeof v === 'string') return v.trim()
  return ''
}

export async function loadPanelBundle (
  get: PanelFetch,
  key: string | null,
  onProgress: (loaded: number, total: number) => void = () => {},
  copies: PanelCopies = defaultCopies,
  route: PanelRoute = {}
): Promise<PanelBundle> {
  // Only this printer's own copy, and only if it is still the bytes that were kept.
  const kept = await keptCopy(key, copies)
  // Over Bluetooth nothing is asked of the printer: a kept page is the screen, and with none the radio is not used for it.
  if (route.bluetooth) return kept ? { state: 'yes', html: kept.html, fromCopy: true } : { state: 'needs-network' }
  const headers: Record<string, string> = { Accept: 'text/html' }
  if (route.compressed) headers['Accept-Encoding'] = 'gzip'
  if (kept?.etag) headers['If-None-Match'] = kept.etag
  let response: Awaited<ReturnType<PanelFetch>> | undefined
  let decoded: string | null | undefined
  const urls = [...(route.sameOrigin ? [route.sameOrigin] : []), PANEL_URL_MOONRAKER, PANEL_URL]
  for (const url of urls) {
    try {
      response = await get(url, { headers, onProgress })
    } catch {
      // The page's own origin may not serve it, or refuse the call: the printer's route is next.
      if (url === route.sameOrigin) continue
      return { state: 'unknown' }
    }
    // The page's own origin may answer any path with its app shell: only the screen itself (it says hello) counts there.
    if (url === route.sameOrigin && response.status >= 200 && response.status < 300) {
      decoded = await pageText(response.data).catch(() => null)
      if (!decoded?.includes(EMBED_MARK)) {
        decoded = undefined
        response = undefined
        continue
      }
    }
    // Not there (404, 410) or not reachable on this route (403, the gateway's refusal): try the next place.
    if (![403, 404, 410].includes(response.status)) break
  }
  if (!response) return { state: 'unknown' }
  // Neither place has it on this route: the printer needs an update.
  if ([403, 404, 410].includes(response.status)) return { state: 'no' }
  if (response.status === 304) {
    // No validator is sent without this printer's own verified copy, so a 304 with none is not believed.
    return kept ? { state: 'yes', html: kept.html, fromCopy: true } : { state: 'unknown' }
  }
  const verdict = classifyPanelResponse(response)
  if (verdict !== 'yes') return { state: verdict }
  let html: string | null
  try {
    html = decoded ?? await pageText(response.data)
  } catch {
    return { state: 'unknown' }
  }
  if (typeof html !== 'string' || !html.includes('<') || html.length > PANEL_MAX_CHARS) return { state: 'unknown' }
  const etag = etagOf(response.headers)
  if (etag && key) await Promise.resolve(copies.keep(key, { etag, html, sha256: sha256Hex(html) })).catch(() => undefined)
  return { state: 'yes', html, fromCopy: false }
}
