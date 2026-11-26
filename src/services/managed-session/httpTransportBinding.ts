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
    let previous = 0
    const started = performance.now()
    const received = await withTimeout(config, transport.fetch(path, requestInit(config), (loaded, total) => {
      if (config.signal?.aborted) return
      const seconds = (performance.now() - started) / 1000
      config.onUploadProgress?.({
        loaded,
        total,
        progress: total ? loaded / total : 1,
        bytes: loaded - previous,
        rate: seconds > 0 ? loaded / seconds : undefined,
        lengthComputable: true,
        upload: true,
        event: { lengthComputable: true, loaded, total }
      })
      previous = loaded
    }))

    // The transport reports upload progress only; a download is counted here, as the body arrives.
    const response = await withDownloadProgress(received, config)

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

/**
 * Reads the body while telling `onDownloadProgress` how much has come (the
 * transport's own progress callback is for uploads), and hands back an
 * equivalent response. Nothing is done when nobody listens, or for a stream.
 */
async function withDownloadProgress (
  response: Response,
  config: InternalAxiosRequestConfig
): Promise<Response> {
  const report = config.onDownloadProgress
  if (!report || !response.body || config.responseType === 'stream') return response
  if (response.status < 200 || response.status > 599) return response
  const total = Number(response.headers.get('content-length')) || undefined
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  const started = performance.now()
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    const bytes = value.byteLength
    loaded += bytes
    if (config.signal?.aborted) continue
    const seconds = (performance.now() - started) / 1000
    report({
      loaded,
      total,
      progress: total ? Math.min(1, loaded / total) : undefined,
      bytes,
      rate: seconds > 0 ? loaded / seconds : undefined,
      lengthComputable: !!total,
      download: true,
      event: { lengthComputable: !!total, loaded, total: total ?? 0 }
    })
  }
  const whole = new Uint8Array(loaded)
  let at = 0
  for (const chunk of chunks) {
    whole.set(chunk, at)
    at += chunk.byteLength
  }
  return new Response(whole, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })
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
