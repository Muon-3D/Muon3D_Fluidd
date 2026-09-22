import type {
  AxiosAdapter,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios'
import type { PrinterTransport } from '@/services/managed-transport'

/**
 * Temporarily route an existing Fluidd Axios instance through the selected
 * printer transport. Releasing restores the exact prior adapter.
 */
export function bindHttpClientToPrinterTransport (
  httpClient: AxiosInstance,
  transport: PrinterTransport
): () => void {
  const previousAdapter = httpClient.defaults.adapter
  const transportAdapter: AxiosAdapter = async config => {
    const path = requestPath(httpClient, config)
    const response = await transport.fetch(path, requestInit(config))

    return {
      data: await responseData(response, config),
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
      request: undefined
    } as AxiosResponse
  }

  httpClient.defaults.adapter = transportAdapter

  return () => {
    if (httpClient.defaults.adapter === transportAdapter) {
      httpClient.defaults.adapter = previousAdapter
    }
  }
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
