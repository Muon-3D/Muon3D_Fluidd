export const MODELS_AUDIENCE = (import.meta.env.VITE_MODELS_URL || 'https://models.muon3d.com').replace(/\/+$/, '')
export let MODELS_URL = MODELS_AUDIENCE

interface HostConfig {
  hosted: boolean;
  blacklist: string[];
}

export function resolveModelsUrl (config: HostConfig, page: Pick<Location, 'origin' | 'hostname'>, service = MODELS_AUDIENCE): string {
  return config.hosted === false && !config.blacklist.some(host => host.toLowerCase() === page.hostname.toLowerCase())
    ? `${page.origin}/models`
    : service.replace(/\/+$/, '')
}

export function configureModelsTransport (config: HostConfig): void {
  MODELS_URL = resolveModelsUrl(config, window.location)
}

/** Service-owned URLs follow the transport; presigned bucket URLs keep their signature. */
export function modelsResourceUrl (value: string, base = MODELS_URL, service = MODELS_AUDIENCE): string {
  const source = new URL(service)
  const url = new URL(value, `${source.href.replace(/\/+$/, '')}/`)
  const prefix = source.pathname.replace(/\/+$/, '')
  if (url.origin === source.origin && (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
    return `${base}${url.pathname.slice(prefix.length)}${url.search}${url.hash}`
  }
  return url.href
}
