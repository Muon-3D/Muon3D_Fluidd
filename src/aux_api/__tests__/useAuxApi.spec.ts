import Vue from 'vue'
import axios, { type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAuxApiBasePath, useAuxApi } from '../useAuxApi'
import { bindHttpClientToPrinterTransport } from '@/services/managed-session/httpTransportBinding'
import type { PrinterTransport } from '@/services/managed-transport'

const credentials = { ssid: 'Muon-walnut-8987', password: null, autoconnect: true, security_enabled: true }

/** An adapter standing in for the network, answering the way Moonraker's aux proxy does. */
const networkAdapter = () => vi.fn<Parameters<AxiosAdapter>, ReturnType<AxiosAdapter>>(async (config) => ({
  data: JSON.stringify({ result: credentials }),
  status: 200,
  statusText: 'OK',
  headers: {},
  config
}))

const useHttpClient = (adapter: AxiosAdapter, authorization?: string) => {
  const httpClient = axios.create({ adapter })
  if (authorization) httpClient.defaults.headers.common.Authorization = authorization
  Vue.$httpClient = httpClient as typeof Vue.$httpClient
  return httpClient
}

const pointAt = async (apiUrl: string) => {
  setAuxApiBasePath(apiUrl)
  // The clients are rebuilt by a watcher, which runs before the next tick.
  await Vue.nextTick()
}

/** Any request that bypasses Fluidd's client lands here and fails plainly. */
class NoNetwork {
  open () { throw new Error('the Aux client used its own network adapter') }
}

describe('useAuxApi', () => {
  beforeEach(() => {
    vi.stubGlobal('XMLHttpRequest', NoNetwork)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete (Vue as { $httpClient?: unknown }).$httpClient
  })

  it("goes to a local printer on Fluidd's own transport, with its sign-in", async () => {
    const adapter = networkAdapter()
    useHttpClient(adapter, 'Bearer local-token')
    await pointAt('http://muon-walnut-8987.local')

    const response = await useAuxApi().ap.apShowCredentialsWifiApShowGet()

    expect(response.data).toEqual(credentials)
    const call = adapter.mock.calls
      .map(([config]) => config as InternalAxiosRequestConfig)
      .find(config => config.url?.endsWith('/wifi/ap/show'))
    expect(call?.url).toBe('http://muon-walnut-8987.local/server/aux/wifi/ap/show')
    expect(call?.headers.get('Authorization')).toBe('Bearer local-token')
  })

  it('reaches a cloud printer through the Iroh transport Fluidd is bound to', async () => {
    const adapter = networkAdapter()
    const httpClient = useHttpClient(adapter)
    const fetch = vi.fn<Parameters<PrinterTransport['fetch']>, ReturnType<PrinterTransport['fetch']>>(async () => new Response(
      JSON.stringify({ result: { ssid: 'HomeWiFi', signal: 78 } }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    ))
    const release = bindHttpClientToPrinterTransport(httpClient, { fetch, openWebSocket: vi.fn(), close: vi.fn() })
    // What appInit is given for a cloud printer: a placeholder, never dialled.
    await pointAt('https://muon-cloud.invalid')

    const response = await useAuxApi().wifi.wifiCurrentWifiCurrentGet(true)

    expect(response.data).toEqual({ ssid: 'HomeWiFi', signal: 78 })
    expect(fetch.mock.calls.map(([path]) => path)).toContain('/server/aux/wifi/current?update=true')
    expect(adapter).not.toHaveBeenCalled()

    // Back on a local printer, the network carries it again.
    release()
    fetch.mockClear()
    await pointAt('http://muon-walnut-8987.local')
    await useAuxApi().ap.apShowCredentialsWifiApShowGet()
    expect(fetch).not.toHaveBeenCalled()
    expect(adapter).toHaveBeenCalled()
  })
})
