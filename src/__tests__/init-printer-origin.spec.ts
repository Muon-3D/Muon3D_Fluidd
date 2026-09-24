/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "url": "https://muon-walnut-8987.local/" }
 */
import Vue from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getApiConfig } from '@/init'
import publicConfig from '../../public/config.json'
import { NeverOpenSocket, hostConfig, stubFilters } from './init-helpers'

describe('getApiConfig on a printer', () => {
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

  it('still probes the origin that served the page, and falls back after 5 s', async () => {
    let settled = false
    const result = getApiConfig(hostConfig(publicConfig.blacklist)).finally(() => { settled = true })

    await vi.advanceTimersByTimeAsync(4999)
    expect(settled).toBe(false)
    expect(NeverOpenSocket.urls).toEqual([
      'wss://muon-walnut-8987.local/websocket',
      'wss://muon-walnut-8987.local:7130/websocket'
    ])

    await vi.advanceTimersByTimeAsync(1)
    await expect(result).resolves.toEqual({ apiUrl: '', socketUrl: '' })
  })
})
