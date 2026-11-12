/**
 * Where the model service is, and what its tokens are addressed to. Two
 * different things:
 *
 *  - The SERVICE URL is an address: where requests go. Its public home is the
 *    Library site's own origin, under /models (Jack, 11 Nov: "models.muon3d.com
 *    is not a requirement"). `VITE_MODELS_URL` overrides it for a build.
 *  - The AUDIENCE is an identifier: the string the console signs into each
 *    assertion and the service checks. It names the service, it is never
 *    dialled, and it does not move when the address does.
 *    `VITE_MODELS_AUDIENCE` overrides it; a local stack that sets only
 *    `VITE_MODELS_URL` keeps the old rule (the audience is the URL).
 *
 * Control served from a printer does not call the service URL at all. Its
 * origin is any LAN name or address, which the service's exact CORS list can
 * never hold, so the printer proxies `/models/` same-origin (MuonOS, the
 * Fluidd vhost) and MODELS_URL becomes `${location.origin}/models`.
 */
const trim = (value: string): string => value.replace(/\/+$/, '')

/** The service's public address. Hosted Control calls it; printers proxy to it. */
export const MODELS_SERVICE_URL: string = trim(import.meta.env.VITE_MODELS_URL || 'https://library.muon3d.com/models')

/** What assertions for the service are addressed to. An identifier, not an address. */
export const MODELS_AUDIENCE: string = trim(
  import.meta.env.VITE_MODELS_AUDIENCE ||
  import.meta.env.VITE_MODELS_URL ||
  'https://models.muon3d.com'
)

/**
 * Every base the service may write into an absolute URL of its own (a
 * thumbnail, a transfer, an avatar): its public address, and the name it is
 * configured to call itself, which older deployments still use for links.
 */
const SERVICE_BASES: string[] = Array.from(new Set([MODELS_SERVICE_URL, MODELS_AUDIENCE]))

/** Where this page sends Library requests. Set once host configuration is read. */
export let MODELS_URL: string = MODELS_SERVICE_URL

interface HostConfig {
  hosted: boolean;
  blacklist: string[];
}

export function resolveModelsUrl (config: HostConfig, page: Pick<Location, 'origin' | 'hostname'>, service = MODELS_SERVICE_URL): string {
  return config.hosted === false && !config.blacklist.some(host => host.toLowerCase() === page.hostname.toLowerCase())
    ? `${page.origin}/models`
    : trim(service)
}

export function configureModelsTransport (config: HostConfig): void {
  MODELS_URL = resolveModelsUrl(config, window.location)
}

/**
 * A URL the service handed out, pointed at this page's transport.
 * Service-owned URLs follow the transport; anything else (a presigned bucket
 * URL, another site) is returned as it came, signature untouched.
 *
 * `service` names the base(s) to treat as the service's own; the default is
 * every base it is known by. A relative value is the service's own path.
 */
export function modelsResourceUrl (value: string, base = MODELS_URL, service?: string | string[]): string {
  const bases = (service === undefined ? SERVICE_BASES : Array.isArray(service) ? service : [service]).map(trim)
  // A path of the service's own (`/v1/...`). Not resolved against a base: the
  // service's address has a path of its own, which `new URL('/v1', base)` drops.
  if (/^\/(?!\/)/.test(value)) return `${trim(base)}${value}`
  const url = new URL(value)
  // Longest base first, so https://host/models wins over a bare https://host.
  for (const candidate of [...bases].sort((a, b) => b.length - a.length)) {
    const source = new URL(candidate)
    const prefix = trim(source.pathname)
    if (url.origin === source.origin && (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
      return `${trim(base)}${url.pathname.slice(prefix.length)}${url.search}${url.hash}`
    }
  }
  return url.href
}
