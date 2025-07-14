// src/composables/useAuxApi.ts
import { ref, watch } from 'vue'
import axios from 'axios'
import { DefaultApi, Configuration } from '@/aux_api'
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

/** 2) the cached client, same as before */
let _cachedBasePath = basePathRef.value
let _cachedClient = new DefaultApi(new Configuration({ basePath: _cachedBasePath }), undefined, auxAxios)

watch(basePathRef, (newPath) => {
  if (newPath !== _cachedBasePath) {
    _cachedBasePath = newPath
    _cachedClient = new DefaultApi(new Configuration({ basePath: newPath }), undefined, auxAxios)
    console.debug('[useAuxApi] re-created client for', newPath)
    // 3) immediately check connectivity
    checkReachable(newPath)
  }
})

/** 4) Proxy so you always call the latest client */
const apiProxy = new Proxy<DefaultApi>({} as DefaultApi, {
  get (_, prop) {
    const client = _cachedClient as any
    const v = client[prop]
    return typeof v === 'function' ? v.bind(client) : v
  }
})

/** 5) setter that components call to change the endpoint */
export function setAuxApiBasePath (raw: string) {
  consola.debug('setAuxApiBasePath:', raw)

  let url: URL
  try {
    // try parsing it as a full URL
    url = new URL(raw)
  } catch {
    // if that fails, assume http:// + what they passed
    url = new URL(`http://${raw}`)
  }

  // force the port and path
  url.port = '7125'
  url.pathname = '/server/aux'
  url.search = '' // drop any query
  url.hash = '' // drop any fragment

  const normalized = url.origin + url.pathname
  if (basePathRef.value !== normalized) {
    consola.debug('setAuxApiBasePath: normalized aux base →', normalized)
    basePathRef.value = normalized
  }
}

/** 6) helper that tests a small GET against the new host */
async function checkReachable (path: string) {
  try {
    // pick a lightweight endpoint you know always exists
    await axios.get(`${path}/openapi.json`, { timeout: 2000 })
    isReachable.value = true
  } catch {
    isReachable.value = false
  }
}

/** 7) composable that gives both the API proxy and the reachability flag */
export function useAuxApi () {
  return {
    api: apiProxy,
    isReachable
  }
}
