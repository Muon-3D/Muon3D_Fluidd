/**
 * Fluidd's connection to its selected printer, as the bridge's host helper
 * (vendor/printer-client/bridge/host.ts) asks for it: reads from the
 * allowlist, print_stats read fresh, the upload of the body the helper built,
 * start, queue and cancel, the host's own dialog and its status feed.
 *
 * Every request goes through Fluidd's own $httpClient, so it travels as all
 * of Fluidd's requests do: to the printer on the network, or over Iroh when a
 * cloud printer is selected (the managed transport the client is bound to).
 * Each method first checks that `key` is still Fluidd's printer: the client
 * always talks to the printer selected now, so a request for another must
 * never be sent. Answers are read with the package's parsers (Moonraker's own
 * words reach the slicer as a PrinterError); a request that never got an
 * answer is `offline` (it never left), `lost` (an upload handed to the
 * transport, with or without progress, or a start or queue entry whose answer
 * was lost) or `cancelled`.
 *
 * The upload sends only the body and its one Content-Type: never a
 * Content-Length or Transfer-Encoding of its own (the browser and the
 * transport frame the request). On the network the browser reports its
 * progress; over Iroh it cannot, so the step's `sent` is null (indeterminate).
 */
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { ConfirmAnswer, ConfirmRequest, HostAdapter, StatusFeed } from './vendor/printer-client/bridge/host'
import type { BridgePrinter, ReadMethod, UploadStep } from './vendor/printer-client/bridge/protocol'
import { printerError, type PrinterError } from './vendor/printer-client/errors/kinds'
import { cancelledError, parsePrinterAnswer, parseUploadAnswer, printerChangedError } from './vendor/printer-client/errors/parse'
import { readRoute } from './reads'

/** The part of an axios instance the adapter uses (Fluidd's $httpClient). */
export interface HttpClient {
  get (url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<unknown>>;
  post (url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<unknown>>;
}

export interface AdapterOptions {
  http: HttpClient;
  /** The printer Fluidd has selected now (selection.ts). */
  selected: () => BridgePrinter | null;
  /** Whether the route reports an upload's progress (false over Iroh). */
  reportsProgress: () => boolean;
  /** The status feed of the selected printer (statusFeed.ts). */
  status: (key: string) => StatusFeed | null;
  /** Fluidd's own dialog (PrintConfirmDialog.vue, shown by Slice.vue). */
  confirm: (request: ConfirmRequest) => Promise<ConfirmAnswer>;
}

/** How long a start, a queue entry or a cancel may take to answer: a printer may take up to 150 s to answer a start. */
export const WRITE_ANSWER_MS = 150_000

/** Every answer as text and every status as an answer: the adapter reads them itself (and Fluidd shows no toast). */
const raw: AxiosRequestConfig = {
  responseType: 'text',
  transformResponse: [(data: unknown) => data],
  validateStatus: () => true
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A Moonraker success's `result` (the body is JSON text). */
function resultOf (body: unknown): unknown {
  let value: unknown = body
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      throw printerError('protocol', 'Unexpected answer: a body that is not JSON')
    }
  }
  return isRecord(value) && 'result' in value ? value.result : value
}

/** A request that failed without an answer, as a PrinterError. */
function failure (err: unknown, signal: AbortSignal, how: { sent?: number, committed?: boolean } = {}): PrinterError {
  const e = isRecord(err) ? err : {}
  if (signal.aborted || e.name === 'CanceledError' || e.code === 'ERR_CANCELED') return cancelledError()
  if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') return printerError('timeout', 'The request timed out')
  const detail = typeof e.message === 'string' ? e.message.slice(0, 200) : ''
  if (how.sent) return printerError('lost', `The upload broke off after ${how.sent} bytes`, { detail })
  if (how.committed) return printerError('lost', 'The answer was lost: the request may have reached the printer', { detail })
  return printerError('offline', 'The request failed on the network', { detail })
}

export function createFluiddAdapter (options: AdapterOptions): HostAdapter {
  const { http } = options

  /** Throws `printer-changed` unless `key` is still Fluidd's printer. */
  const current = (key: string) => {
    if (options.selected()?.key !== key) throw printerChangedError()
  }

  /** A GET's result, or the printer's refusal as a PrinterError. */
  const get = async (key: string, url: string, signal: AbortSignal): Promise<unknown> => {
    current(key)
    let answer: AxiosResponse<unknown>
    try {
      answer = await http.get(url, { ...raw, signal })
    } catch (err) {
      throw failure(err, signal)
    }
    const error = parsePrinterAnswer({ status: answer.status, body: answer.data })
    if (error) throw error
    return resultOf(answer.data)
  }

  /** A POST that changes the printer: sent once, its lost answer `lost`. */
  const write = async (key: string, url: string, json: unknown, signal: AbortSignal): Promise<unknown> => {
    current(key)
    let answer: AxiosResponse<unknown>
    try {
      answer = await http.post(url, JSON.stringify(json), {
        ...raw,
        headers: { 'Content-Type': 'application/json' },
        timeout: WRITE_ANSWER_MS,
        signal
      })
    } catch (err) {
      throw failure(err, signal, { committed: true })
    }
    const error = parsePrinterAnswer({ status: answer.status, body: answer.data })
    if (error) throw error
    return resultOf(answer.data)
  }

  return {
    selected: () => options.selected(),

    read: (key, method: ReadMethod, params, signal) => get(key, readRoute(method, params), signal),

    async printStats (key, signal) {
      const result = await get(key, '/printer/objects/query?print_stats=state,filename', signal)
      const stats = isRecord(result) && isRecord(result.status) && isRecord(result.status.print_stats) ? result.status.print_stats : null
      if (!stats || typeof stats.state !== 'string') throw printerError('protocol', 'Unexpected answer: print_stats without a state')
      return { state: stats.state, filename: typeof stats.filename === 'string' ? stats.filename : '' }
    },

    async upload (key, body, { signal, onStep }) {
      current(key)
      const total = body.body.byteLength
      const counted = options.reportsProgress()
      if (!counted) onStep({ step: 'sending', sent: null, total })
      let sent = 0
      // Set as axios hands the request to its transport (after Fluidd's interceptors): from then on, a failure is
      // a body broken off on its way (`lost`), with or without a progress event (none ever comes over Iroh).
      let started = false
      let answer: AxiosResponse<unknown>
      try {
        // The exact bytes the helper built, as their own buffer; the type is the body's one Content-Type.
        const bytes = body.body.buffer.slice(body.body.byteOffset, body.body.byteOffset + total)
        answer = await http.post('/server/files/upload', bytes, {
          ...raw,
          headers: { 'Content-Type': body.contentType },
          transformRequest: [(data: unknown) => {
            started = true
            return data
          }],
          timeout: 0,
          signal,
          onUploadProgress: counted
            ? (event) => {
                sent = Math.min(event.loaded, total)
                const step: UploadStep = sent >= total ? { step: 'checking' } : { step: 'sending', sent, total }
                onStep(step)
              }
            : undefined
        })
      } catch (err) {
        throw failure(err, signal, { sent, committed: started })
      }
      const stored = parseUploadAnswer({ status: answer.status, body: answer.data })
      if ('kind' in stored) throw stored
      return stored
    },

    async start (key, path, signal) {
      await write(key, '/printer/print/start', { filename: path }, signal)
    },

    async queue (key, paths, signal) {
      await write(key, '/server/job_queue/job', { filenames: paths }, signal)
    },

    async cancelPrint (key, signal) {
      await write(key, '/printer/print/cancel', {}, signal)
    },

    confirm: (request) => options.confirm(request),

    status: (key) => options.selected()?.key === key ? options.status(key) : null
  }
}
