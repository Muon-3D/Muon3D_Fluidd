/// <reference lib="WebWorker" />

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim, setCacheNameDetails } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { warmStrategyCache } from 'workbox-recipes'
import { NAVIGATION_DENYLIST, networkFirstNavigation } from './swNavigation'
import { buildCacheNames, buildSuffix, deleteStaleCaches } from './swCaches'

declare let self: ServiceWorkerGlobalScope

// I-159: every cache is named by the build that wrote it (swCaches.ts), so a
// deploy never reads the previous build's entries.
const BUILD_COMMIT: string = import.meta.env.BUILD_COMMIT ?? ''
const cacheNames = buildCacheNames(BUILD_COMMIT)
setCacheNameDetails({
  prefix: 'muon',
  suffix: buildSuffix(BUILD_COMMIT),
  precache: 'precache',
  runtime: 'runtime'
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// A new build's worker takes over at once instead of waiting for every tab to
// close, which is how a stuck worker kept serving an old bundle.
self.skipWaiting()
clientsClaim()

self.addEventListener('activate', (event) => {
  event.waitUntil(deleteStaleCaches(self.caches, BUILD_COMMIT))
})

precacheAndRoute(self.__WB_MANIFEST)

cleanupOutdatedCaches()

const configPathname = new URL('config.json', self.location.href).pathname

const configStrategy = new StaleWhileRevalidate({
  cacheName: cacheNames.config,
  fetchOptions: {
    cache: 'no-cache'
  }
})

warmStrategyCache({
  urls: [
    configPathname
  ],
  strategy: configStrategy
})

registerRoute(configPathname, configStrategy, 'GET')

// Static assets the precache no longer covers (KAN-525): a lazy chunk, a
// Monaco worker, an icon stays a week past its first fetch instead of
// downloading with every install. Never Moonraker or the API: those are the
// printer's answers, not files to reuse.
const SERVER_API_PATHS = /^\/(?:server|printer|machine|access|websocket|api|models)(?:\/|$)/
const ASSET_DESTINATIONS = new Set(['script', 'style', 'font', 'image', 'worker'])

registerRoute(
  ({ url, request }) => (
    url.origin === self.location.origin &&
    url.pathname !== configPathname &&
    !SERVER_API_PATHS.test(url.pathname) &&
    (ASSET_DESTINATIONS.has(request.destination) ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/monacoeditorwork/'))
  ),
  new StaleWhileRevalidate({
    cacheName: cacheNames.assets,
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, purgeOnQuotaError: true })
    ]
  }),
  'GET'
)

const denylist = import.meta.env.DEV
  ? undefined
  : NAVIGATION_DENYLIST

const allowlist = import.meta.env.DEV
  ? [/^\/$/]
  : undefined

// The network first, the cached index.html when offline (swNavigation.ts says
// why the denylist alone is not enough).
registerRoute(
  new NavigationRoute(networkFirstNavigation((request) => fetch(request), createHandlerBoundToURL('index.html')), {
    allowlist,
    denylist
  })
)
