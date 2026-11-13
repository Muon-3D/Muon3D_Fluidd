/**
 * The navigations the service worker (sw.ts) must not answer with Fluidd's
 * index.html: they belong to the server, not to Fluidd.
 */
export const NAVIGATION_DENYLIST: RegExp[] = [
  /^\/models(?:[/?]|$)/,
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
  /^\/auth\//,
  // The Muon3D Slicer the printer serves beside Fluidd (/slicer/, and the
  // /slicer redirect to it): its own pages, which /slice frames. Workbox
  // matches the path with its query, so /slicer?x is the slicer's too.
  /^\/slicer(?:[/?]|$)/,
  // Files the printer or the console serve beside Fluidd, which a browser can
  // open directly: the licence texts, the M1 model and three.js, the Iroh
  // client, and the app association files.
  /^\/(?:licences|muon-3d|muon-link-web|\.well-known)\//,
  /^\/apple-app-site-association$/
]

/** Whether the service worker leaves a navigation to `pathname` to the network. */
export const isDeniedNavigation = (pathname: string): boolean =>
  NAVIGATION_DENYLIST.some(pattern => pattern.test(pathname))

/** How long a navigation waits for the network before the cached page answers. */
export const NETWORK_TIMEOUT_MS = 3500

/**
 * The same navigation, told to revalidate rather than take a fresh-looking
 * copy from the browser's HTTP cache (the I-159 stale index.html). Redirect
 * handling stays as the browser set it, so a server 303 still reaches the page.
 */
export function revalidated (request: Request): Request {
  try {
    return new Request(request, { cache: 'no-cache' })
  } catch {
    return request
  }
}

/** What a navigation handler is given: the request (Workbox passes more). */
export interface NavigationOptions {
  request: Request
}

/**
 * How the service worker answers a navigation it takes: from the network, and
 * with the cached index.html only when the network does not answer (offline).
 *
 * The denylist above cannot be the only guard. A worker already installed in a
 * browser keeps the list it was built with until a newer worker activates, and
 * that waits for every tab of the site to close. On 13 Oct 2026 a browser last
 * on app.muon3d.com in September still ran that month's worker, whose list did
 * not name /authorize: it answered the slicer's sign-in with its own cached
 * Fluidd, so the console never saw the request and the sign-in window showed
 * Fluidd failing to connect. Answering from the network first means a path the
 * server owns reaches the server while online, whatever the list says, and the
 * page is always the current build.
 */
export function networkFirstNavigation<O extends NavigationOptions> (
  network: (request: Request) => Promise<Response>,
  cachedShell: (options: O) => Promise<Response>,
  { timeoutMs = NETWORK_TIMEOUT_MS }: { timeoutMs?: number } = {}
): (options: O) => Promise<Response> {
  return async (options: O): Promise<Response> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('navigation timed out')), timeoutMs)
      })
      return await Promise.race([network(revalidated(options.request)), timeout])
    } catch {
      return cachedShell(options)
    } finally {
      clearTimeout(timer)
    }
  }
}
