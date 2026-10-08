/**
 * An in-memory Moonraker for the bridge's specs, reached the way Fluidd's
 * $httpClient reaches a printer: `get` and `post` as axios answers them with
 * every status taken (the adapter asks for that) and the body as text. Each
 * request goes to the printer selected when it is made, as axios captures
 * its base URL and adapter then.
 *
 * Its files, queue and history answer as Moonraker does: a missing file's
 * metadata and a printer without [history] are 404 with Moonraker's error
 * body; an upload is read by the package's own rules for the slicer's
 * uploads (checkPrintUpload: root, checksum and the file, never `print` or
 * `path`) and answers 201 with its item.
 */
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { HttpClient } from '../adapter'
import { checkPrintUpload } from '../vendor/printer-client/multipart/check'

export interface HistoryJob {
  job_id: string;
  filename: string;
  status: string;
  filament_used: number;
}

export interface MoonrakerPrinter {
  name: string;
  state: string;
  filename: string;
  files: string[];
  queued: string[];
  jobs: HistoryJob[];
  history: boolean;
}

export interface Request {
  method: 'GET' | 'POST';
  url: string;
  headers: Record<string, string>;
  data?: unknown;
}

export function newPrinter (name: string): MoonrakerPrinter {
  return { name, state: 'standby', filename: '', files: [], queued: [], jobs: [], history: true }
}

const json = (status: number, body: unknown, config: AxiosRequestConfig): AxiosResponse<unknown> =>
  ({ status, statusText: '', data: JSON.stringify(body), headers: {}, config: config as any })

const moonrakerError = (status: number, message: string, config: AxiosRequestConfig) =>
  json(status, { error: { code: status, message, traceback: '' } }, config)

/** Rejects as axios does when its signal aborts. */
const canceled = () => Object.assign(new Error('canceled'), { name: 'CanceledError', code: 'ERR_CANCELED' })

export interface FakeMoonraker {
  http: HttpClient;
  /** Every request, in order. */
  requests: Request[];
  /** The writes the printers took, as the vectors list them ("upload walnut a.gcode", "start walnut a.gcode", …). */
  calls: string[];
  /** Runs while an upload's body is "on the wire": the upload then waits for its signal. */
  during: (() => void) | null;
  addJob (printer: MoonrakerPrinter, filename: string): void;
}

export function fakeMoonraker (printers: Record<string, MoonrakerPrinter>, selected: () => string | null): FakeMoonraker {
  let jobs = 0
  const fake: FakeMoonraker = {
    requests: [],
    calls: [],
    during: null,
    addJob (p, filename) {
      p.jobs.push({ job_id: (++jobs).toString(16).padStart(6, '0'), filename, status: 'in_progress', filament_used: 0 })
    },
    http: {
      async get (url, config = {}) {
        const name = selected()
        fake.requests.push({ method: 'GET', url, headers: { ...(config.headers as Record<string, string> ?? {}) } })
        if (config.signal?.aborted) throw canceled()
        if (!name) throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })
        const p = printers[name]
        const { pathname, searchParams } = new URL(url, 'http://printer.invalid')
        switch (pathname) {
          case '/server/job_queue/status':
            return json(200, { result: { queued_jobs: p.queued.map(filename => ({ filename })), queue_state: 'paused' } }, config)
          case '/server/files/metadata': {
            const filename = searchParams.get('filename') ?? ''
            if (!p.files.includes(filename)) return moonrakerError(404, `Metadata not available for <${filename}>`, config)
            return json(200, { result: { filename, size: 15 } }, config)
          }
          case '/server/history/list': {
            if (!p.history) return moonrakerError(404, 'Not Found', config)
            const limit = Number(searchParams.get('limit'))
            const newest = [...p.jobs].reverse()
            return json(200, { result: { count: p.jobs.length, jobs: searchParams.get('order') === 'asc' ? p.jobs.slice(0, limit) : newest.slice(0, limit) } }, config)
          }
          case '/printer/objects/query': {
            const status: Record<string, Record<string, unknown>> = {}
            for (const [object, fields] of searchParams.entries()) {
              const values: Record<string, unknown> = object === 'print_stats' ? { state: p.state, filename: p.filename } : {}
              status[object] = fields ? Object.fromEntries(fields.split(',').map(f => [f, values[f] ?? null])) : values
            }
            return json(200, { result: { eventtime: 1, status } }, config)
          }
          default:
            return json(200, { result: { url } }, config)
        }
      },
      async post (url, data, config = {}) {
        const name = selected()
        const headers = { ...(config.headers as Record<string, string> ?? {}) }
        fake.requests.push({ method: 'POST', url, headers, data })
        if (config.signal?.aborted) throw canceled()
        if (!name) throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })
        const p = printers[name]
        if (url === '/server/files/upload') {
          const body = new Uint8Array(data as ArrayBuffer)
          // On the wire the browser (or the Iroh binding) adds the body's length: the adapter sets none of its own.
          const verdict = checkPrintUpload({ headers: [...Object.entries(headers), ['Content-Length', String(body.byteLength)]], body })
          if (!verdict.ok) return json(400, { error: `muon-link refused this upload: ${verdict.reason}` }, config)
          const filename = verdict.file.name
          fake.calls.push(`upload ${name} ${filename}`)
          config.onUploadProgress?.({ loaded: body.byteLength, total: body.byteLength, bytes: body.byteLength, lengthComputable: true } as any)
          if (fake.during) {
            const run = fake.during
            fake.during = null
            run()
            await new Promise((_resolve, reject) => {
              if (config.signal?.aborted) reject(canceled())
              ;(config.signal as AbortSignal | undefined)?.addEventListener('abort', () => reject(canceled()))
            })
          }
          if (!p.files.includes(filename)) p.files.push(filename)
          return json(201, { item: { path: filename, root: 'gcodes', size: verdict.file.bytes.byteLength }, print_started: false, print_queued: false, action: 'create_file' }, config)
        }
        const body = typeof data === 'string' ? JSON.parse(data) as Record<string, unknown> : {}
        if (url === '/printer/print/start') {
          fake.calls.push(`start ${name} ${String(body.filename)}`)
          fake.addJob(p, String(body.filename))
          return json(200, { result: 'ok' }, config)
        }
        if (url === '/server/job_queue/job') {
          const filenames = body.filenames as string[]
          fake.calls.push(`queue ${name} ${filenames.join(',')}`)
          p.queued.push(...filenames)
          return json(200, { result: { queued_jobs: [], queue_state: 'paused' } }, config)
        }
        if (url === '/printer/print/cancel') {
          fake.calls.push(`cancel ${name}`)
          return json(200, { result: 'ok' }, config)
        }
        return moonrakerError(404, 'Not Found', config)
      }
    }
  }
  return fake
}
