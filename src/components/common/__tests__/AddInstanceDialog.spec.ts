import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import AddInstanceDialog from '../AddInstanceDialog.vue'
import { bindHttpClientToPrinterTransport } from '@/services/managed-session/httpTransportBinding'
import type { PrinterTransport } from '@/services/managed-transport'

const mocks = {
  $t: (key: string) => key,
  $filters: {
    getApiUrls: (url: string) => ({ apiUrl: url, socketUrl: `${url.replace(/^http/, 'ws')}/websocket` })
  },
  $rules: { required: () => true },
  $store: { state: { config: { hostConfig: { hosted: false } } }, getters: {} }
}

describe('AddInstanceDialog', () => {
  let fetch: Mock<Parameters<PrinterTransport['fetch']>, ReturnType<PrinterTransport['fetch']>>
  let release: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    // A cloud printer is showing: Fluidd's client travels over Iroh and
    // carries that printer's sign-in.
    const httpClient = axios.create()
    httpClient.defaults.headers.common.Authorization = 'Bearer cloud-printer-token'
    Vue.$httpClient = httpClient as typeof Vue.$httpClient
    fetch = vi.fn<Parameters<PrinterTransport['fetch']>, ReturnType<PrinterTransport['fetch']>>(async () => new Response('{"result":{}}', { status: 200 }))
    release = bindHttpClientToPrinterTransport(httpClient, { fetch, openWebSocket: vi.fn(), close: vi.fn() })
  })

  afterEach(() => {
    release()
    vi.useRealTimers()
    vi.restoreAllMocks()
    delete (Vue as { $httpClient?: unknown }).$httpClient
  })

  it('checks a typed address on the network, not over the cloud printer, and without its sign-in', async () => {
    // Not a Muon3D printer: its identity is not found, so Moonraker is asked.
    const network = vi.fn(async () => new Response('', { status: 404 }))
    vi.stubGlobal('fetch', network)
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ status: 200, data: {} })
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })

    ;(wrapper.vm as any).url = 'http://192.168.1.50'
    await vi.advanceTimersByTimeAsync(750)

    expect(fetch).not.toHaveBeenCalled()
    expect((network.mock.calls[0] as unknown[])[0]).toBe('http://192.168.1.50/server/muon/identity')
    expect(get).toHaveBeenCalledTimes(1)
    const [url, config] = get.mock.calls[0]
    expect(url).toMatch(/^http:\/\/192\.168\.1\.50\/server\/info\?t=\d+$/)
    expect(JSON.stringify(config)).not.toContain('cloud-printer-token')
    expect((wrapper.vm as any).verified).toBe(true)
    vi.unstubAllGlobals()
  })

  it('finds a Muon3D printer by its name, trying .local when the bare name does not answer', async () => {
    const endpointId = 'f1f6920f'.repeat(8)
    const network = vi.fn(async (url: string) => {
      if (url.startsWith('http://muon-boxwood-367a/')) throw new TypeError('Failed to fetch')
      if (url.endsWith('/server/muon/identity')) {
        return new Response(JSON.stringify({ result: { display: 'Boxwood · 367A', endpoint_id: endpointId } }), { status: 200 })
      }
      return new Response('{"result":{}}', { status: 200 })
    })
    vi.stubGlobal('fetch', network)
    const get = vi.spyOn(axios, 'get')
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })

    ;(wrapper.vm as any).url = 'muon-boxwood-367a'
    await vi.advanceTimersByTimeAsync(750)

    expect(fetch).not.toHaveBeenCalled()
    expect(get).not.toHaveBeenCalled()
    expect((wrapper.vm as any).verified).toBe(true)
    expect((wrapper.vm as any).note).toBe('app.endpoint.msg.found_printer')
    ;(wrapper.vm as any).addInstance()
    expect(wrapper.emitted('resolve')?.[0][0]).toMatchObject({
      name: 'Boxwood · 367A',
      apiUrl: 'http://muon-boxwood-367a.local',
      socketUrl: 'ws://muon-boxwood-367a.local/websocket',
      endpointId
    })
    vi.unstubAllGlobals()
  })

  it('checks a pasted address, which reaches the watcher before the form revalidates', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })))
    const get = vi.spyOn(axios, 'get').mockResolvedValue({ status: 200, data: {} })
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })
    ;(wrapper.vm as any).valid = false

    ;(wrapper.vm as any).url = 'http://192.168.1.52'
    // The watcher runs now, while the form still reads as invalid.
    await wrapper.vm.$nextTick()
    ;(wrapper.vm as any).valid = true
    await vi.advanceTimersByTimeAsync(750)

    expect(get).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('does not verify an address that does not answer', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue(Object.assign(new Error('Network Error'), {
      isAxiosError: true,
      request: {}
    }))
    const noCors = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', noCors)
    const wrapper = shallowMount(AddInstanceDialog, { mocks, propsData: { value: true } })

    ;(wrapper.vm as any).url = 'http://192.168.1.51'
    await vi.advanceTimersByTimeAsync(750)

    expect(fetch).not.toHaveBeenCalled()
    expect((wrapper.vm as any).verified).toBe(false)
    expect((wrapper.vm as any).note).toBe('app.endpoint.error.cant_connect')
    vi.unstubAllGlobals()
  })
})
