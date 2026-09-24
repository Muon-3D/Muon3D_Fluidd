/**
 * @vitest-environment jsdom
 * @vitest-environment-options { "url": "https://app.muon3d.com/" }
 */
import Vue from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getApiConfig } from '@/init'
import publicConfig from '../../public/config.json'
import serverConfig from '../../server/config.json'
import { NeverOpenSocket, hostConfig, stubFilters } from './init-helpers'

describe('getApiConfig on app.muon3d.com', () => {
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

  it.each([
    ['public/config.json', publicConfig],
    ['server/config.json', serverConfig]
  ])('%s blacklists app.muon3d.com', (_name, config) => {
    expect(config.blacklist).toContain('app.muon3d.com')
  })

  it('answers at once, without probing itself for a printer', async () => {
    expect(document.location.hostname).toBe('app.muon3d.com')
    let settled = false
    const result = getApiConfig(hostConfig(publicConfig.blacklist)).finally(() => { settled = true })

    // No timer runs, so a 5 s fallback cannot be what answers.
    await vi.advanceTimersByTimeAsync(0)

    expect(settled).toBe(true)
    await expect(result).resolves.toEqual({ apiUrl: '', socketUrl: '' })
    expect(NeverOpenSocket.urls).toEqual([])
  })
})
