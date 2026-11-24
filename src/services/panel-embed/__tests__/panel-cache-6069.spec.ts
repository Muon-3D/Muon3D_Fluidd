import { describe, expect, it } from 'vitest'
import { gzipSync } from 'node:zlib'
import { createCopies, loadPanelBundle, MAX_PRINTERS, PANEL_URL, PANEL_URL_MOONRAKER, type PanelCopy, type PanelFetch, type PanelStore } from '../bundle'
import { sha256Hex } from '../sha256'

const html = '<!doctype html><html><body>screen muon-panel-hello</body></html>'
const copyOf = (page: string, etag = '"b1"'): PanelCopy => ({ etag, html: page, sha256: sha256Hex(page) })

function memoryStore (): PanelStore & { rows: Map<string, unknown>, fail: boolean } {
  const s = {
    rows: new Map<string, unknown>(),
    fail: false,
    get: async (k: string) => { if (s.fail) throw new Error('blocked'); return s.rows.get(k) },
    put: async (k: string, v: unknown) => { if (s.fail) throw new Error('full'); s.rows.set(k, v) },
    keys: async () => [...s.rows.keys()],
    delete: async (k: string) => { s.rows.delete(k) }
  }
  return s
}

describe('the ETag cache for the printer screen (KAN-6069)', () => {
  it('keeps a page by printer and gives it back after the page reloads (a new cache over the same store)', async () => {
    const store = memoryStore()
    await createCopies(store).keep('A', copyOf(html))
    expect(await createCopies(store).get('A')).toEqual(copyOf(html))
    expect(await createCopies(store).get('B')).toBeNull()
  })

  it('keeps only the newest few printers', async () => {
    const store = memoryStore()
    const c = createCopies(store)
    for (const k of ['A', 'B', 'C', 'D']) await c.keep(k, copyOf(html, `"${k}"`))
    expect(store.rows.size).toBe(MAX_PRINTERS)
    expect(store.rows.has('A')).toBe(false)
    expect(await createCopies(store).get('D')).not.toBeNull()
  })

  it('a store that is blocked or full never throws: the page lives in memory', async () => {
    const store = memoryStore()
    store.fail = true
    const c = createCopies(store)
    await expect(c.keep('A', copyOf(html))).resolves.toBeUndefined()
    expect(await c.get('A')).toEqual(copyOf(html))
    expect(await createCopies(store).get('A')).toBeNull()
    expect(await createCopies(null).get('A')).toBeNull()
  })

  it('a stored row that is not a copy is ignored', async () => {
    const store = memoryStore()
    store.rows.set('A', { etag: 5 })
    expect(await createCopies(store).get('A')).toBeNull()
  })

  it('a copy whose bytes changed under it is not used or offered', async () => {
    const bad = { ...copyOf('<html>x</html>'), html: '<html>tampered</html>' }
    let sent: Record<string, string> = {}
    await loadPanelBundle(async (_u, r) => { sent = r.headers; return { status: 404 } }, 'A', () => {}, { get: () => bad, keep: () => {} })
    expect(sent['If-None-Match']).toBeUndefined()
    expect(await loadPanelBundle(async () => ({ status: 200 }), 'A', () => {}, { get: () => bad, keep: () => {} }, { bluetooth: true })).toEqual({ state: 'needs-network' })
  })
})

describe('the screen over Bluetooth, gzip and the page origin (KAN-6069, KAN-6062)', () => {
  it('over Bluetooth with no kept copy asks for nothing and says it needs a network', async () => {
    let asked = 0
    const got = await loadPanelBundle(async () => { asked++; return { status: 200 } }, 'A', () => {}, createCopies(null), { bluetooth: true })
    expect(got).toEqual({ state: 'needs-network' })
    expect(asked).toBe(0)
  })

  it('over Bluetooth with a kept copy shows it and still asks for nothing', async () => {
    let asked = 0
    const c = createCopies(null)
    await c.keep('A', copyOf(html))
    const got = await loadPanelBundle(async () => { asked++; return { status: 200 } }, 'A', () => {}, c, { bluetooth: true })
    expect(got).toEqual({ state: 'yes', html, fromCopy: true })
    expect(asked).toBe(0)
  })

  it('asks for gzip only on a route that needs it asked, and unzips what comes back', async () => {
    const seen: Array<Record<string, string>> = []
    const zipped = gzipSync(Buffer.from(html))
    const get: PanelFetch = async (_u, r) => {
      seen.push(r.headers)
      return { status: 200, headers: { 'content-type': 'text/html', 'content-encoding': 'gzip', etag: '"z"' }, data: zipped.buffer.slice(zipped.byteOffset, zipped.byteOffset + zipped.byteLength) }
    }
    const c = createCopies(null)
    const got = await loadPanelBundle(get, 'A', () => {}, c, { compressed: true })
    expect(got).toEqual({ state: 'yes', html, fromCopy: false })
    expect(seen[0]['Accept-Encoding']).toBe('gzip')
    expect((await c.get('A'))?.etag).toBe('"z"')
    await loadPanelBundle(get, 'B', () => {}, createCopies(null), {})
    expect(seen[1]['Accept-Encoding']).toBeUndefined()
  })

  it('reads a body the browser already decoded, as bytes or as text', async () => {
    const bytes = new TextEncoder().encode(html)
    const get: PanelFetch = async () => ({ status: 200, headers: { 'content-type': 'text/html', 'content-encoding': 'gzip' }, data: bytes.buffer })
    expect(await loadPanelBundle(get, null, () => {}, createCopies(null))).toEqual({ state: 'yes', html, fromCopy: false })
  })

  it("Control served by the printer asks the page's own origin first, and only the real screen counts there", async () => {
    const own = `http://192.168.1.20${PANEL_URL}`
    const asked: string[] = []
    const shell = async (url: string) => {
      asked.push(url)
      // The origin answers any path with its app shell.
      return url === own
        ? { status: 200, headers: { 'content-type': 'text/html' }, data: '<!doctype html><html><div id="app"></div></html>' }
        : { status: 200, headers: { 'content-type': 'text/html' }, data: html }
    }
    expect(await loadPanelBundle(shell, null, () => {}, createCopies(null), { sameOrigin: own })).toEqual({ state: 'yes', html, fromCopy: false })
    expect(asked).toEqual([own, PANEL_URL_MOONRAKER])

    asked.length = 0
    const real = async (url: string) => { asked.push(url); return { status: 200, headers: { 'content-type': 'text/html' }, data: html } }
    expect(await loadPanelBundle(real, null, () => {}, createCopies(null), { sameOrigin: own })).toEqual({ state: 'yes', html, fromCopy: false })
    expect(asked).toEqual([own])
  })

  it('a page origin that refuses or fails falls through to the printer route', async () => {
    const own = 'http://x.local/panel/index.html'
    const asked: string[] = []
    const get: PanelFetch = async url => {
      asked.push(url)
      if (url === own) throw new Error('refused to connect')
      return { status: 200, headers: { 'content-type': 'text/html' }, data: html }
    }
    expect((await loadPanelBundle(get, null, () => {}, createCopies(null), { sameOrigin: own })).state).toBe('yes')
    expect(asked).toEqual([own, PANEL_URL_MOONRAKER])
  })
})
