// src/composables/useAuxApi.ts
import Vue, { ref, watch } from 'vue'
import axios from 'axios'
import { ApApi, UpdateApi, WifiApi, DevModeApi, Configuration } from '@/aux_api'
import consola from 'consola'
import store from '@/store'
import { isBoundToPrinterTransport } from '@/services/managed-session/httpTransportBinding'

const auxAxios = axios.create()
auxAxios.interceptors.response.use(resp => {
  if (resp?.data && typeof resp.data === 'object' && 'result' in resp.data) {
    return { ...resp, data: resp.data.result }
  }
  return resp
})

/** Refused before it leaves: the owner decided remote callers may not change Wi-Fi (07 §3). */
export class RemoteWriteRefused extends Error {
  constructor () {
    super("Wi-Fi can only be changed on the printer's own network.")
    this.name = 'RemoteWriteRefused'
  }
}

// Fluidd's own requests travel on Vue.$httpClient, and a cloud printer is
// reached by swapping that client's adapter for the Iroh transport
// (bindHttpClientToPrinterTransport). The Aux API follows whichever transport
// that client uses now, and carries the same sign-in; on its own adapter it
// dialled the placeholder host a cloud printer is given, and failed.
auxAxios.interceptors.request.use(async config => {
  const httpClient = Vue.$httpClient
  if (!httpClient) return config

  // Over Iroh the Aux API is read-only. The cards hide every write there, and
  // muon-link refuses them too; this keeps a stray one from being sent.
  const method = (config.method ?? 'get').toLowerCase()
  if (isBoundToPrinterTransport(httpClient) && method !== 'get' && method !== 'head') {
    throw new RemoteWriteRefused()
  }

  // Refresh a sign-in that is about to expire, as Vue.$httpClient's own
  // interceptor does. Fluidd talks mostly over its websocket, so without this
  // the copied header outlives Moonraker's one-hour token, and Moonraker then
  // refuses the Wi-Fi and hotspot cards with 401 before it looks at the
  // caller's address.
  if (await store.dispatch('auth/checkToken')) await store.dispatch('auth/refreshTokens')

  config.adapter = httpClient.defaults.adapter
  const authorization = httpClient.defaults.headers.common.Authorization
  if (authorization && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', authorization)
  }
  return config
})

/** 1) the current basePath, and whether we can reach it */
const basePathRef = ref<string>('/aux')
const isReachable = ref<boolean | null>(null) // null = not yet tested

/** 2) cached basePath + cached clients */
let _cachedBasePath = basePathRef.value
let _cachedApClient = new ApApi(new Configuration({ basePath: _cachedBasePath }), undefined, auxAxios)
let _cachedUpdateClient = new UpdateApi(new Configuration({ basePath: _cachedBasePath }), undefined, auxAxios)
let _cachedWifiClient = new WifiApi(new Configuration({ basePath: _cachedBasePath }), undefined, auxAxios)
let _cachedDevModeClient = new DevModeApi(new Configuration({ basePath: _cachedBasePath }), undefined, auxAxios)

/** helper to rebuild all 3 */
function recreateClients (newPath: string) {
  _cachedApClient = new ApApi(new Configuration({ basePath: newPath }), undefined, auxAxios)
  _cachedUpdateClient = new UpdateApi(new Configuration({ basePath: newPath }), undefined, auxAxios)
  _cachedWifiClient = new WifiApi(new Configuration({ basePath: newPath }), undefined, auxAxios)
  _cachedDevModeClient = new DevModeApi(new Configuration({ basePath: newPath }), undefined, auxAxios)
  console.debug('[useAuxApi] re-created clients for', newPath)
}

/** watch basePath and rebuild */
watch(basePathRef, (newPath) => {
  if (newPath !== _cachedBasePath) {
    _cachedBasePath = newPath
    recreateClients(newPath)
    // 3) immediately check connectivity
    checkReachable(newPath)
  }
})

/** generic proxy creator so we always hit the latest client */
function makeProxy<T extends object> (getClient: () => T): T {
  return new Proxy({} as T, {
    get (_target, prop) {
      const client = getClient() as any
      const v = client[prop]
      return typeof v === 'function' ? v.bind(client) : v
    }
  })
}

/** 4) proxies for each api */
const apApiProxy = makeProxy(() => _cachedApClient)
const updateApiProxy = makeProxy(() => _cachedUpdateClient)
const wifiApiProxy = makeProxy(() => _cachedWifiClient)

/** 5) setter that components call to change the endpoint */
export function setAuxApiBasePath (raw: string) {
  consola.debug('setAuxApiBasePath:', raw)

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    url = new URL(`http://${raw}`)
  }

  // force the port and path
  // url.port = '7125' // commented out as cuases cors issues
  url.pathname = '/server/aux'
  url.search = ''
  url.hash = ''

  const normalized = url.origin + url.pathname
  if (basePathRef.value !== normalized) {
    consola.debug('setAuxApiBasePath: normalized aux base →', normalized)
    basePathRef.value = normalized
  }
}

/** 6) helper that tests a small GET against the new host */
async function checkReachable (path: string) {
  try {
    await auxAxios.get(`${path}/openapi.json`, { timeout: 2000 })
    isReachable.value = true
  } catch {
    isReachable.value = false
  }
}

/** 7) composable that gives the 3 APIs and the reachability flag */
export function useAuxApi () {
  return {
    ap: apApiProxy,
    update: updateApiProxy,
    wifi: wifiApiProxy,
    devMode: _cachedDevModeClient,
    isReachable
  }
}
