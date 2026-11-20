import { beforeEach, describe, expect, it } from 'vitest'
import { loadPanelBundle, PANEL_URL, PANEL_URL_MOONRAKER, type PanelCopies, type PanelCopy, type PanelFetch } from '../bundle'
import { sha256Hex } from '../sha256'
import { createHash } from 'node:crypto'

const html = '<!doctype html><html><body>screen</body></html>'
const ok = (headers: Record<string, unknown> = { 'content-type': 'text/html', etag: '"b1"' }, data = html) => ({ status: 200, headers, data })

function copies (start: Record<string, PanelCopy> = {}): PanelCopies & { kept: Record<string, PanelCopy> } {
  const c = { kept: { ...start }, get: (k: string) => c.kept[k] ?? null, keep: (k: string, x: PanelCopy) => { c.kept[k] = x } }
  return c
}
const copyOf = (page: string, etag = '"b1"'): PanelCopy => ({ etag, html: page, sha256: sha256Hex(page) })

describe('loading the screen from the printer, over the route (KAN-4812)', () => {
  let asked: Array<{ url: string, headers: Record<string, string> }>
  beforeEach(() => { asked = [] })
  const via = (answer: Awaited<ReturnType<PanelFetch>> | Error): PanelFetch => async (url, request) => {
    asked.push({ url, headers: request.headers })
    if (answer instanceof Error) throw answer
    return answer
  }

  it('sha256 is the real one', () => {
    for (const text of ['', 'abc', 'x'.repeat(1000), 'é€😀'.repeat(50)]) expect(sha256Hex(text)).toBe(createHash('sha256').update(text).digest('hex'))
  })

  it('asks the printer for /panel/index.html (the route, never the page) and returns the page', async () => {
    const c = copies()
    const got = await loadPanelBundle(via(ok()), 'A', () => {}, c)
    expect(got).toEqual({ state: 'yes', html, fromCopy: false })
    expect(asked.map(a => a.url)).toEqual([PANEL_URL_MOONRAKER])
    expect(asked[0].headers['If-None-Match']).toBeUndefined()
    expect(c.kept.A).toEqual(copyOf(html))
  })

  it('on the next open asks if it changed, and a 304 costs no bundle', async () => {
    const c = copies({ A: copyOf(html) })
    const got = await loadPanelBundle(via({ status: 304 }), 'A', () => {}, c)
    expect(got).toEqual({ state: 'yes', html, fromCopy: true })
    expect(asked[0].headers['If-None-Match']).toBe('"b1"')
  })

  it("printer A's kept page is never served for printer B, even under the same ETag", async () => {
    const c = copies({ A: copyOf('<html>A: hostile page</html>', '"same"') })
    // B has no copy of its own: no validator goes out, and a 304 from B is not believed.
    expect(await loadPanelBundle(via({ status: 304 }), 'B', () => {}, c)).toEqual({ state: 'unknown' })
    expect(asked[0].headers['If-None-Match']).toBeUndefined()
    // B answers with its own page: that is what is served and kept, under B only.
    const got = await loadPanelBundle(via(ok({ 'content-type': 'text/html', etag: '"same"' })), 'B', () => {}, c)
    expect(got).toEqual({ state: 'yes', html, fromCopy: false })
    expect(c.kept.A.html).toBe('<html>A: hostile page</html>')
    expect(c.kept.B.html).toBe(html)
  })

  it('with no verified printer id nothing is offered, served or kept: always fresh', async () => {
    const c = copies({ A: copyOf(html) })
    expect(await loadPanelBundle(via({ status: 304 }), null, () => {}, c)).toEqual({ state: 'unknown' })
    expect(asked[0].headers['If-None-Match']).toBeUndefined()
    expect(await loadPanelBundle(via(ok()), null, () => {}, c)).toEqual({ state: 'yes', html, fromCopy: false })
    expect(Object.keys(c.kept)).toEqual(['A'])
  })

  it('a kept copy that no longer matches its hash is not served or offered', async () => {
    const tampered = { ...copyOf(html), html: '<html>changed</html>' }
    const c = copies({ A: tampered })
    expect(await loadPanelBundle(via({ status: 304 }), 'A', () => {}, c)).toEqual({ state: 'unknown' })
    expect(asked[0].headers['If-None-Match']).toBeUndefined()
  })

  it('a new build replaces the kept copy; no ETag means nothing is kept', async () => {
    const c = copies({ A: copyOf('<old>') })
    expect(await loadPanelBundle(via(ok({ 'content-type': 'text/html', ETag: '"b2"' })), 'A', () => {}, c)).toMatchObject({ state: 'yes', fromCopy: false })
    expect(c.kept.A.etag).toBe('"b2"')
    const none = copies()
    await loadPanelBundle(via(ok({ 'content-type': 'text/html' })), 'A', () => {}, none)
    expect(none.kept.A).toBeUndefined()
  })

  it('asks the Moonraker endpoint first, then the nginx one; both missing is "needs an update"', async () => {
    const byUrl = (answers: Record<string, Awaited<ReturnType<PanelFetch>>>): PanelFetch => async (url, request) => { asked.push({ url, headers: request.headers }); return answers[url] }
    expect(await loadPanelBundle(byUrl({ [PANEL_URL_MOONRAKER]: { status: 404 }, [PANEL_URL]: ok() }), 'A', () => {}, copies())).toMatchObject({ state: 'yes' })
    expect(asked.map(a => a.url)).toEqual([PANEL_URL_MOONRAKER, PANEL_URL])
    asked = []
    expect(await loadPanelBundle(byUrl({ [PANEL_URL_MOONRAKER]: ok(), [PANEL_URL]: { status: 404 } }), 'A', () => {}, copies())).toMatchObject({ state: 'yes' })
    expect(asked.map(a => a.url)).toEqual([PANEL_URL_MOONRAKER])
    expect(await loadPanelBundle(byUrl({ [PANEL_URL_MOONRAKER]: { status: 403 }, [PANEL_URL]: { status: 404 } }), 'A', () => {}, copies())).toEqual({ state: 'no' })
    expect(await loadPanelBundle(byUrl({ [PANEL_URL_MOONRAKER]: { status: 404 }, [PANEL_URL]: { status: 502 } }), 'A', () => {}, copies())).toEqual({ state: 'unknown' })
  })

  it('says "no" only when the printer has none, and makes no claim when the route gives no answer', async () => {
    expect(await loadPanelBundle(via({ status: 404 }), 'A', () => {}, copies())).toEqual({ state: 'no' })
    expect(await loadPanelBundle(via({ status: 403 }), 'A', () => {}, copies())).toEqual({ state: 'no' })
    expect(await loadPanelBundle(via({ status: 502 }), 'A', () => {}, copies())).toEqual({ state: 'unknown' })
    expect(await loadPanelBundle(via(new Error('offline')), 'A', () => {}, copies())).toEqual({ state: 'unknown' })
    expect(await loadPanelBundle(via({ status: 200, headers: { 'content-type': 'text/html' }, data: 'plain' }), 'A', () => {}, copies())).toEqual({ state: 'unknown' })
  })

  it('reports progress as the route gives it', async () => {
    const seen: Array<[number, number]> = []
    const fetcher: PanelFetch = async (_url, request) => { request.onProgress(100, 400); return ok() }
    await loadPanelBundle(fetcher, 'A', (l, t) => seen.push([l, t]), copies())
    expect(seen).toEqual([[100, 400]])
  })
})
