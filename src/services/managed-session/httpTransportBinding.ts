import Vue from 'vue'
import { AxiosError } from 'axios'
import type {
  AxiosAdapter,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'
import type { PrinterTransport } from '@/services/managed-transport'

/**
 * Whether Fluidd's requests go through a printer transport now. Both callers
 * bind only the managed Iroh transport, so this is "the printer is reached
 * over Iroh", and views read it to hide what a remote caller may not do.
 */
export const printerTransportBinding = Vue.observable({ remote: false })

const transportAdapters = new WeakSet<AxiosAdapter>()

/** Whether `httpClient`'s requests travel over a printer transport right now. */
export function isBoundToPrinterTransport (httpClient: AxiosInstance): boolean {
  const adapter = httpClient.defaults.adapter
  return typeof adapter === 'function' && transportAdapters.has(adapter)
}

/**
 * Temporarily route an existing Fluidd Axios instance through the selected
 * printer transport. Releasing restores the exact prior adapter.
 *
 * The built-in adapters settle a response against `validateStatus` and
 * enforce `timeout`; axios leaves both to the adapter, so this one does the
 * same. Without it every non-2xx answer over Iroh resolved as a success.
 */
export function bindHttpClientToPrinterTransport (
  httpClient: AxiosInstance,
  transport: PrinterTransport
): () => void {
  const previousAdapter = httpClient.defaults.adapter
  const transportAdapter: AxiosAdapter = async config => {
    const path = requestPath(httpClient, config)
    const response = await withTimeout(config, transport.fetch(path, requestInit(config)))

    const answer = {
      data: await responseData(response, config),
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
      request: undefined
    } as AxiosResponse

    return settle(answer)
  }
  transportAdapters.add(transportAdapter)

  httpClient.defaults.adapter = transportAdapter
  printerTransportBinding.remote = true

  return () => {
    if (httpClient.defaults.adapter === transportAdapter) {
      httpClient.defaults.adapter = previousAdapter
      printerTransportBinding.remote = false
    }
  }
}

/** axios's own `settle()`: reject a status that `validateStatus` refuses. */
function settle (response: AxiosResponse): AxiosResponse {
  const validateStatus = response.config.validateStatus
  if (!response.status || !validateStatus || validateStatus(response.status)) return response
  throw new AxiosError(
    `Request failed with status code ${response.status}`,
    response.status < 500 ? AxiosError.ERR_BAD_REQUEST : AxiosError.ERR_BAD_RESPONSE,
    response.config,
    undefined,
    response
  )
}

/** axios's `timeout`, which the transport itself does not know about. */
function withTimeout<T> (config: InternalAxiosRequestConfig, work: Promise<T>): Promise<T> {
  const timeout = config.timeout ?? 0
  if (!(timeout > 0)) return work
  let timer: ReturnType<typeof setTimeout> | undefined
  const expired = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new AxiosError(
        config.timeoutErrorMessage || `timeout of ${timeout}ms exceeded`,
        config.transitional?.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
        config
      ))
    }, timeout)
  })
  return Promise.race([work, expired]).finally(() => clearTimeout(timer))
}

function requestPath (
  httpClient: AxiosInstance,
  config: InternalAxiosRequestConfig
) {
  const uri = httpClient.getUri({
    ...config,
    baseURL: 'https://managed-transport.invalid'
  })
  const url = new URL(uri, 'https://managed-transport.invalid')
  return `${url.pathname}${url.search}`
}

function requestInit (config: InternalAxiosRequestConfig): RequestInit {
  const method = (config.method ?? 'get').toUpperCase()
  return {
    method,
    headers: config.headers.toJSON() as HeadersInit,
    body: method === 'GET' || method === 'HEAD'
      ? undefined
      : config.data as BodyInit | null | undefined,
    signal: config.signal as AbortSignal | undefined
  }
}

async function responseData (
  response: Response,
  config: InternalAxiosRequestConfig
) {
  switch (config.responseType) {
    case 'arraybuffer':
      return response.arrayBuffer()
    case 'blob':
      return response.blob()
    case 'stream':
      return response.body
    default:
      return response.text()
  }
}
