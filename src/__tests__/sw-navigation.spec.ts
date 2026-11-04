import { describe, expect, it, vi } from 'vitest'
import { isDeniedNavigation, networkFirstNavigation } from '@/swNavigation'
import swSource from '@/sw.ts?raw'

const shellPage = () => new Response('<!doctype html><title>Fluidd</title>', { status: 200 })

describe('a navigation the service worker takes', () => {
  it('is answered by the network while it answers', async () => {
    const fromNetwork = new Response('page from the server', { status: 200 })
    const network = vi.fn(async (request: Request) => (request ? fromNetwork : fromNetwork))
    const shell = vi.fn(async () => shellPage())
    const handle = networkFirstNavigation(network, shell)

    const request = new Request('https://app.muon3d.com/boxwood-367a/jobs')
    expect(await handle({ request })).toBe(fromNetwork)
    expect(network).toHaveBeenCalledTimes(1)
    expect(network.mock.calls[0][0].url).toBe(request.url)
    expect(shell).not.toHaveBeenCalled()
  })

  it('reaches the server for a path the denylist does not name, redirect and all', async () => {
    // A server path added after this worker was built: the server's own answer
    // (here the console's 303 to its sign-in page) goes back to the browser.
    const path = '/a-console-page-added-later?continue=%2Fauthorize'
    expect(isDeniedNavigation(path)).toBe(false)
    const redirect = new Response(null, { status: 303, headers: { Location: '/sign-in' } })
    const handle = networkFirstNavigation(async () => redirect, async () => shellPage())

    const answer = await handle({ request: new Request(`https://app.muon3d.com${path}`) })
    expect(answer.status).toBe(303)
    expect(answer.headers.get('Location')).toBe('/sign-in')
  })

  it('is answered with the cached page when the network does not answer', async () => {
    const shell = vi.fn(async () => shellPage())
    const handle = networkFirstNavigation(async () => { throw new TypeError('Failed to fetch') }, shell)

    const options = { request: new Request('https://app.muon3d.com/') }
    const answer = await handle(options)
    expect(await answer.text()).toContain('<title>Fluidd</title>')
    expect(shell).toHaveBeenCalledWith(options)
  })

  it('keeps a server error from the network rather than hiding it behind the cached page', async () => {
    const shell = vi.fn(async () => shellPage())
    const handle = networkFirstNavigation(async () => new Response('Bad gateway', { status: 502 }), shell)

    expect((await handle({ request: new Request('https://app.muon3d.com/') })).status).toBe(502)
    expect(shell).not.toHaveBeenCalled()
  })
})

describe('a fresh index', () => {
  it('beats the cached one while the network is up, and is never read from the HTTP cache', async () => {
    const fresh = new Response('<title>new build</title>')
    const seen: Request[] = []
    const network = vi.fn(async (request: Request) => { seen.push(request); return fresh })
    const cached = vi.fn(async () => new Response('<title>old build</title>'))
    const handle = networkFirstNavigation(network, cached, { timeoutMs: 3500 })

    const answer = await handle({ request: new Request('https://control.muon3d.com/') })
    expect(await answer.text()).toContain('new build')
    expect(cached).not.toHaveBeenCalled()
    expect(seen[0].cache).toBe('no-cache')
  })

  it('falls back to the cached index when the network is slower than the timeout', async () => {
    vi.useFakeTimers()
    const network = () => new Promise<Response>(() => {})
    const handle = networkFirstNavigation(network, async () => new Response('<title>old build</title>'), { timeoutMs: 3500 })
    const pending = handle({ request: new Request('https://control.muon3d.com/') })
    await vi.advanceTimersByTimeAsync(3600)
    expect(await (await pending).text()).toContain('old build')
    vi.useRealTimers()
  })

  it('still leaves the console and server paths to the server', () => {
    for (const path of ['/authorize?client_id=slicer', '/handoff', '/logout', '/j/abc123', '/auth/callback', '/slicer/', '/printer/info', '/server/info', '/websocket', '/.well-known/x']) {
      expect(isDeniedNavigation(path.split('?')[0]), path).toBe(true)
    }
  })
})

describe('sw.ts', () => {
  it('routes navigations network first, with the precached index.html as the offline answer', () => {
    expect(swSource).toMatch(/new NavigationRoute\(networkFirstNavigation\(\(request\) => fetch\(request\), createHandlerBoundToURL\('index\.html'\)\)/)
    // The precached page is no longer the first answer to any navigation.
    expect(swSource).not.toMatch(/new NavigationRoute\(createHandlerBoundToURL/)
  })
})
