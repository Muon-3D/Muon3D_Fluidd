/// <reference lib="WebWorker" />

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
import { warmStrategyCache } from 'workbox-recipes'

declare let self: ServiceWorkerGlobalScope

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

precacheAndRoute(self.__WB_MANIFEST)

cleanupOutdatedCaches()

const configPathname = new URL('config.json', self.location.href).pathname

const configStrategy = new StaleWhileRevalidate({
  cacheName: 'config',
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

const denylist = import.meta.env.DEV
  ? undefined
  : [
      /\/websocket/,
      /\/(printer|api|access|machine|server)\//,
      /\/webcam[2-4]?\//,
      // The console's own pages (WEB-12), which a browser must reach rather
      // than be given index.html: the central login's /authorize, /handoff
      // and /logout, an invite link's /j/<code>, and Fluidd's front-channel
      // logout page, which the console frames with ?iss= (so it misses the
      // precache).
      /^\/(?:authorize|handoff|logout)(?:[/?]|$)/,
      /^\/j\//,
      /^\/auth\//
    ]

const allowlist = import.meta.env.DEV
  ? [/^\/$/]
  : undefined

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    allowlist,
    denylist
  })
)
