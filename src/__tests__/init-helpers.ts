import Vue from 'vue'
import type { VueConstructor } from 'vue'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import { getApiConfig } from '@/init'
import type { HostConfig } from '@/store/config/types'
import publicConfig from '../../public/config.json'

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
export const stubFilters = (vue: VueConstructor) => {
  vue.$filters = {
    getApiUrls: (endpoint: string) => ({
      apiUrl: endpoint,
      socketUrl: `${endpoint.replace(/^http/, 'ws')}/websocket`
    })
  } as unknown as typeof vue.$filters
}

/** A first visit: no saved printer, fake timers, sockets that never open. */
export const useFirstVisit = () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    NeverOpenSocket.urls = []
    vi.stubGlobal('WebSocket', NeverOpenSocket)
    stubFilters(Vue)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })
}

/** The shipped blacklist makes this page answer at once, probing nothing. */
export const expectAnswersAtOnce = async () => {
  let settled = false
  const result = getApiConfig(hostConfig(publicConfig.blacklist)).finally(() => { settled = true })

  // No timer runs, so a 5 s fallback cannot be what answers.
  await vi.advanceTimersByTimeAsync(0)

  expect(settled).toBe(true)
  await expect(result).resolves.toEqual({ apiUrl: '', socketUrl: '' })
  expect(NeverOpenSocket.urls).toEqual([])
}

/** The page probes its own origin, then falls back after 5 s. */
export const expectProbesItself = async (host: string) => {
  let settled = false
  const result = getApiConfig(hostConfig(publicConfig.blacklist)).finally(() => { settled = true })

  await vi.advanceTimersByTimeAsync(4999)
  expect(settled).toBe(false)
  expect(NeverOpenSocket.urls).toEqual([
    `wss://${host}/websocket`,
    `wss://${host}:7130/websocket`
  ])

  await vi.advanceTimersByTimeAsync(1)
  await expect(result).resolves.toEqual({ apiUrl: '', socketUrl: '' })
}
