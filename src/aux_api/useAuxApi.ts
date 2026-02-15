// src/composables/useAuxApi.ts
import { ref, watch } from 'vue'
import axios from 'axios'
import { ApApi, UpdateApi, WifiApi, DevModeApi, Configuration } from '@/aux_api'
import consola from 'consola'

const auxAxios = axios.create()
auxAxios.interceptors.response.use(resp => {
  if (resp?.data && typeof resp.data === 'object' && 'result' in resp.data) {
    return { ...resp, data: resp.data.result }
  }
  return resp
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
    await axios.get(`${path}/openapi.json`, { timeout: 2000 })
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
