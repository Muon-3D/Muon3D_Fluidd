import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPanelBundle, PANEL_URL, type PanelCopies, type PanelCopy, type PanelFetch } from '../bundle'

const html = '<!doctype html><html><body>screen</body></html>'
const ok = (headers: Record<string, unknown> = { 'content-type': 'text/html', etag: '"b1"' }) => ({ status: 200, headers, data: html })

function copies (start: PanelCopy | null = null): PanelCopies & { kept: PanelCopy | null } {
  const c = { kept: start, latest: () => c.kept, keep: (x: PanelCopy) => { c.kept = x } }
  return c
}

describe('loading the screen from the printer, over the route (KAN-4812)', () => {
  let asked: Array<{ url: string, headers: Record<string, string> }>
  beforeEach(() => { asked = [] })
  const via = (answer: Awaited<ReturnType<PanelFetch>> | Error): PanelFetch => async (url, request) => {
    asked.push({ url, headers: request.headers })
    if (answer instanceof Error) throw answer
    return answer
  }

  it('asks the printer for /panel/index.html (the route, never the page) and returns the page', async () => {
    const c = copies()
    const got = await loadPanelBundle(via(ok()), () => {}, c)
    expect(got).toEqual({ state: 'yes', html, fromCopy: false })
    expect(asked.map(a => a.url)).toEqual([PANEL_URL])
    expect(asked[0].headers['If-None-Match']).toBeUndefined()
    expect(c.kept).toEqual({ etag: '"b1"', html })
  })

  it('on the next open asks if it changed, and a 304 costs no bundle', async () => {
    const c = copies({ etag: '"b1"', html })
    const got = await loadPanelBundle(via({ status: 304 }), () => {}, c)
    expect(got).toEqual({ state: 'yes', html, fromCopy: true })
    expect(asked[0].headers['If-None-Match']).toBe('"b1"')
  })

  it('a new build replaces the kept copy; no ETag means nothing is kept', async () => {
    const c = copies({ etag: '"b1"', html: '<old>' })
    expect(await loadPanelBundle(via(ok({ 'content-type': 'text/html', ETag: '"b2"' })), () => {}, c)).toMatchObject({ state: 'yes', fromCopy: false })
    expect(c.kept?.etag).toBe('"b2"')
    const none = copies()
    await loadPanelBundle(via(ok({ 'content-type': 'text/html' })), () => {}, none)
    expect(none.kept).toBeNull()
  })

  it('says "no" only when the printer has none, and makes no claim when the route gives no answer', async () => {
    expect(await loadPanelBundle(via({ status: 404 }), () => {}, copies())).toEqual({ state: 'no' })
    expect(await loadPanelBundle(via({ status: 403 }), () => {}, copies())).toEqual({ state: 'unknown' })
    expect(await loadPanelBundle(via(new Error('offline')), () => {}, copies())).toEqual({ state: 'unknown' })
    expect(await loadPanelBundle(via({ status: 304 }), () => {}, copies())).toEqual({ state: 'unknown' })
    expect(await loadPanelBundle(via({ status: 200, headers: { 'content-type': 'text/html' }, data: 'plain' }), () => {}, copies())).toEqual({ state: 'unknown' })
  })

  it('reports progress as the route gives it', async () => {
    const progress = vi.fn()
    const fetcher: PanelFetch = async (_url, request) => { request.onProgress(100, 400); return ok() }
    await loadPanelBundle(fetcher, progress, copies())
    expect(progress).toHaveBeenCalledWith(100, 400)
  })
})
