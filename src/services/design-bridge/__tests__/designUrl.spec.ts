// Where /design finds Muon3D Design, and whether it is there (Design in the
// nav only then).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_DESIGN_URL, checkDesign, designPresence, designUrl, probeDesign, resetDesignProbe } from '../designUrl'

const PAGE = 'http://walnut.local'
const EMBED = new URL('/design/embed.html', PAGE)

/** Design's embed.html as its build writes it (the frame hosts in the meta tag). */
const EMBED_HTML = '<!doctype html><html lang="en"><head><meta charset="UTF-8" />' +
  '<meta name="muon3d-embed-hosts" content="\'self\'" /><title>Muon3D Design</title></head><body><div id="root"></div></body></html>'
/** What a server without Design answers for any path: Fluidd's own index.html. */
const FLUIDD_HTML = '<!doctype html><html><head><title>Fluidd</title></head><body><div id="app"></div></body></html>'

const answer = (status: number, body: string, type = 'text/html; charset=utf-8') =>
  vi.fn<[RequestInfo | URL, RequestInit?], Promise<Response>>(async () => new Response(body, { status, headers: { 'Content-Type': type } }))

describe('designUrl', () => {
  it('is /design/embed.html on this page by default', () => {
    expect(DEFAULT_DESIGN_URL).toBe('/design/embed.html')
    expect(designUrl(undefined, `${PAGE}/design`)?.href).toBe(EMBED.href)
    expect(designUrl('  ', `${PAGE}/boxwood-367a/design`)?.href).toBe(EMBED.href)
  })

  it('takes VUE_MUON_DESIGN_URL, http(s) only, with no credentials or hash', () => {
    expect(designUrl('https://design.example/embed.html#x', PAGE)?.href).toBe('https://design.example/embed.html')
    expect(designUrl('javascript:alert(1)', PAGE)).toBeNull()
    expect(designUrl('https://user:pw@design.example/embed.html', PAGE)).toBeNull()
  })
})

describe('checkDesign', () => {
  it('finds Design when its embed.html answers, asked without the cache', async () => {
    const fetch = answer(200, EMBED_HTML)
    await expect(checkDesign(EMBED, PAGE, fetch)).resolves.toBe(true)
    expect(fetch).toHaveBeenCalledWith(EMBED.href, expect.objectContaining({ cache: 'no-store', credentials: 'same-origin', redirect: 'error' }))
  })

  it.each([
    ['a 404', answer(404, 'Not Found', 'text/plain')],
    ['Fluidd\'s own index.html (the SPA fallback)', answer(200, FLUIDD_HTML)],
    ['no answer at all', vi.fn(async () => { throw new TypeError('Failed to fetch') })]
  ])('finds no Design for %s', async (_case, fetch) => {
    await expect(checkDesign(EMBED, PAGE, fetch as any)).resolves.toBe(false)
  })

  it('takes Design on another origin (set at build time) as there, without asking it', async () => {
    const fetch = answer(404, '')
    await expect(checkDesign(new URL('https://design.example/embed.html'), PAGE, fetch)).resolves.toBe(true)
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('probeDesign', () => {
  afterEach(() => resetDesignProbe())

  it('asks once per page load and records what it found', async () => {
    const fetch = answer(200, EMBED_HTML)
    expect(designPresence.state).toBe('unknown')
    const [a, b] = await Promise.all([probeDesign(EMBED, PAGE, fetch), probeDesign(EMBED, PAGE, fetch)])
    expect([a, b]).toEqual([true, true])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(designPresence.state).toBe('present')
  })

  it('records a Design that is not there as absent', async () => {
    await expect(probeDesign(EMBED, PAGE, answer(200, FLUIDD_HTML))).resolves.toBe(false)
    expect(designPresence.state).toBe('absent')
  })
})
