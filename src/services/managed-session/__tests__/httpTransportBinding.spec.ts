import axios, { AxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  bindHttpClientToPrinterTransport,
  isBoundToPrinterTransport,
  printerTransportBinding
} from '../httpTransportBinding'
import type { PrinterTransport } from '@/services/managed-transport'

const transportAnswering = (fetch: PrinterTransport['fetch']): PrinterTransport => ({
  fetch,
  openWebSocket: vi.fn(),
  close: vi.fn()
})

const answer = (status: number, body: unknown = {}) => async () => new Response(
  JSON.stringify(body),
  { status, headers: { 'content-type': 'application/json' } }
)

describe('the Iroh HTTP binding', () => {
  let release: (() => void) | undefined

  afterEach(() => {
    release?.()
    release = undefined
    vi.useRealTimers()
  })

  it('resolves a 2xx answer, parsed as axios would', async () => {
    const client = axios.create({ baseURL: 'https://muon-cloud.invalid' })
    release = bindHttpClientToPrinterTransport(client, transportAnswering(answer(200, { result: { ok: true } })))

    const response = await client.get('/server/info')

    expect(response.status).toBe(200)
    expect(response.data).toEqual({ result: { ok: true } })
  })

  it('forwards real body-byte progress as Axios upload events', async () => {
    const client = axios.create()
    const progress = vi.fn()
    release = bindHttpClientToPrinterTransport(client, transportAnswering(async (_path, _init, report) => {
      report?.(0, 100)
      report?.(25, 100)
      report?.(100, 100)
      return new Response('{}')
    }))
    await client.post('/server/files/upload', 'body', { onUploadProgress: progress })
    expect(progress.mock.calls.map(([event]) => [event.loaded, event.total, event.progress, event.bytes]))
      .toEqual([[0, 100, 0, 0], [25, 100, 0.25, 25], [100, 100, 1, 75]])
  })

  it.each([400, 403, 404, 500, 503])('rejects a %i, as axios settles one on the network', async (status) => {
    const client = axios.create({ baseURL: 'https://muon-cloud.invalid' })
    release = bindHttpClientToPrinterTransport(client, transportAnswering(answer(status, { error: { message: 'no' } })))

    const error = await client.get('/server/aux/wifi/show').catch(e => e)

    expect(error).toBeInstanceOf(AxiosError)
    expect(error.response.status).toBe(status)
    // The body is kept, so a caller can still show Moonraker's reason.
    expect(error.response.data).toEqual({ error: { message: 'no' } })
    expect(error.code).toBe(status < 500 ? AxiosError.ERR_BAD_REQUEST : AxiosError.ERR_BAD_RESPONSE)
  })

  it('lets a request that accepts any status have it', async () => {
    const client = axios.create({ baseURL: 'https://muon-cloud.invalid' })
    release = bindHttpClientToPrinterTransport(client, transportAnswering(answer(403)))

    const response = await client.get('/server/aux/wifi/show', { validateStatus: () => true })

    expect(response.status).toBe(403)
  })

  it('enforces the request timeout the transport knows nothing about', async () => {
    vi.useFakeTimers()
    const client = axios.create({ baseURL: 'https://muon-cloud.invalid' })
    release = bindHttpClientToPrinterTransport(client, transportAnswering(() => new Promise(() => {})))

    const request = client.get('/server/aux/openapi.json', { timeout: 2000 }).catch(e => e)
    await vi.advanceTimersByTimeAsync(2000)
    const error = await request

    expect(error).toBeInstanceOf(AxiosError)
    expect(error.code).toBe(AxiosError.ECONNABORTED)
  })

  it('says whether the client is on a printer transport, and forgets it on release', () => {
    const client = axios.create()
    expect(isBoundToPrinterTransport(client)).toBe(false)
    expect(printerTransportBinding.remote).toBe(false)

    const unbind = bindHttpClientToPrinterTransport(client, transportAnswering(answer(200)))
    expect(isBoundToPrinterTransport(client)).toBe(true)
    expect(printerTransportBinding.remote).toBe(true)

    unbind()
    expect(isBoundToPrinterTransport(client)).toBe(false)
    expect(printerTransportBinding.remote).toBe(false)
  })
})
