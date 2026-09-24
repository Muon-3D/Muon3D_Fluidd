import type { VueConstructor } from 'vue'
import type { HostConfig } from '@/store/config/types'

/** A WebSocket that never opens, and records what was dialled. */
export class NeverOpenSocket {
  static urls: string[] = []
  onopen: (() => void) | null = null
  onerror: (() => void) | null = null
  onclose: (() => void) | null = null
  constructor (url: string) {
    NeverOpenSocket.urls.push(url)
  }

  close () {}
}

export const hostConfig = (blacklist: string[]): HostConfig => ({
  blacklist,
  endpoints: [],
  hosted: false,
  themePresets: []
})

/** The one filter `getApiConfig` uses, without installing the plugin. */
export const stubFilters = (Vue: VueConstructor) => {
  Vue.$filters = {
    getApiUrls: (endpoint: string) => ({
      apiUrl: endpoint,
      socketUrl: `${endpoint.replace(/^http/, 'ws')}/websocket`
    })
  } as unknown as typeof Vue.$filters
}
