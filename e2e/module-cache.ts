/**
 * Serves vite's modules from memory after the first test of a worker has loaded them.
 *
 * Why (KAN-2781): under e2e vite serves Control unbundled, about 880 requests per page load, and every test is a
 * fresh browser context with an empty HTTP cache, so each test fetches and (for vite) serves all of them again.
 * Measured on two cores, one worker, nothing else running: 6 to 12 s per page. On a CI runner with two workers, vite,
 * the mock printer and the browsers on the same two cores, that grows to the 60 s `ready()` waits for `.v-application`.
 * HMR is off under e2e (vite.config.ts), so a module never changes during a run and caching it is safe. Only GETs for
 * modules and static assets under vite's own paths are cached; the mock printer, the fakes and config.json are not.
 */
import type { BrowserContext } from '@playwright/test'

interface Entry { status: number; headers: Record<string, string>; body: Buffer }
const cache = new Map<string, Entry>()

/** What vite serves from source: never an API call, never config.json. */
const MODULE = /^\/(src\/|node_modules\/|@vite\/|@fs\/|@id\/|assets\/|fonts\/|img\/)|\.(css|svg|woff2?|png|glb)(\?|$)/

export async function cacheModules (context: BrowserContext, origin: string) {
  await context.route(url => url.origin === origin && MODULE.test(url.pathname + url.search), async route => {
    const request = route.request()
    if (request.method() !== 'GET') return route.fallback()
    const key = request.url()
    const hit = cache.get(key)
    if (hit) return route.fulfill(hit)
    // A reset connection (vite busy) is not this test's failure: let the browser ask vite itself, uncached.
    const response = await route.fetch().catch(() => null)
    if (!response) return route.fallback()
    if (response.status() !== 200) return route.fulfill({ response })
    const entry = { status: response.status(), headers: response.headers(), body: await response.body() }
    cache.set(key, entry)
    return route.fulfill(entry)
  })
}
