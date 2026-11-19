import { httpClientActions } from '@/api/httpClientActions'
import type { AxiosProgressEvent } from 'axios'
import type {
  UsbConflict, UsbDirection, UsbEntry, UsbItemState, UsbJob, UsbJobItem, UsbJobProblem, UsbJobState,
  UsbListing, UsbStatus, UsbStick
} from './types'

/**
 * The printer's USB routes (KAN-4814, API v1 and v1.1), over the same HTTP
 * client as every other Moonraker call, so they travel over a LAN, Bluetooth
 * or the cloud relay alike.
 */

const BASE = '/server/muon/usb'

type Json = Record<string, any>

const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) ? v : 0
const numOrNull = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null
const str = (v: unknown): string => typeof v === 'string' ? v : ''

/** Moonraker wraps an answer as `{ result }`; muon-link may not. */
function unwrap (data: unknown): Json {
  if (isObject(data) && isObject(data.result)) return data.result
  return isObject(data) ? data : {}
}

/** `usb/<stick>/<rel>`, how Moonraker's USB routes spell a path. */
export function usbPath (stick: string, rel = ''): string {
  const clean = rel.replace(/^\/+|\/+$/g, '')
  return clean ? `usb/${stick}/${clean}` : `usb/${stick}`
}

/** Moonraker's path (`usb/<stick>/a/b`, or `<stick>/a/b`) as the path inside the stick. */
export function relativeTo (stick: string, path: string): string {
  const p = path.replace(/^\/+/, '')
  const prefix = p.startsWith('usb/') ? `usb/${stick}` : stick
  if (p === prefix) return ''
  return p.startsWith(`${prefix}/`) ? p.slice(prefix.length + 1) : p
}

export function stickOf (raw: unknown): UsbStick | null {
  if (!isObject(raw) || !str(raw.name)) return null
  return {
    name: raw.name,
    path: str(raw.path) || `usb/${raw.name}`,
    freeBytes: numOrNull(raw.free_bytes ?? raw.free),
    totalBytes: numOrNull(raw.total_bytes ?? raw.total),
    fs: str(raw.fs),
    writable: raw.writable === true,
    readOnly: raw.read_only === true || raw.readonly === true
  }
}

function problems (raw: unknown): UsbJobProblem[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(isObject).map(p => ({ path: str(p.path), reason: str(p.reason) }))
}

const ITEM_STATES: UsbItemState[] = ['pending', 'copying', 'done', 'skipped', 'failed', 'cancelled']
const JOB_STATES: UsbJobState[] = ['queued', 'running', 'done', 'cancelled', 'failed']

function itemOf (raw: unknown): UsbJobItem | null {
  if (!isObject(raw) || !str(raw.path)) return null
  return {
    path: raw.path,
    dest: str(raw.dest),
    bytesTotal: num(raw.bytes_total),
    bytesDone: num(raw.bytes_done),
    state: ITEM_STATES.includes(raw.state) ? raw.state : 'pending',
    error: str(raw.error)
  }
}

/** A job object as the printer sends it (status, `/job`, and `notify_muon_usb_job`). */
export function jobOf (raw: unknown): UsbJob | null {
  const job = isObject(raw) && isObject(raw.job) && !raw.id ? raw.job : raw
  if (!isObject(job) || !str(job.id)) return null
  const first = (problems(job.errors)[0]?.reason) || ''
  return {
    id: job.id,
    direction: job.direction === 'to_usb' ? 'to_usb' : 'to_printer',
    stick: str(job.stick),
    state: JOB_STATES.includes(job.state) ? job.state : 'running',
    filesTotal: num(job.files_total),
    filesDone: num(job.files_done),
    bytesTotal: num(job.bytes_total),
    bytesDone: num(job.bytes_done),
    current: str(job.current),
    items: Array.isArray(job.items) ? job.items.map(itemOf).filter((i): i is UsbJobItem => !!i) : [],
    skipped: problems(job.skipped),
    errors: problems(job.errors),
    reason: str(job.reason) || str(job.error) || (job.state === 'failed' ? first : ''),
    startedAt: numOrNull(job.started_at),
    endedAt: numOrNull(job.ended_at)
  }
}

export function statusOf (data: unknown): UsbStatus {
  const raw = unwrap(data)
  return {
    sticks: (Array.isArray(raw.sticks) ? raw.sticks : []).map(stickOf).filter((s: UsbStick | null): s is UsbStick => !!s),
    ejected: (Array.isArray(raw.ejected) ? raw.ejected : []).filter(isObject).map((e: Json) => ({ name: str(e.name), at: numOrNull(e.at) })).filter((e: { name: string }) => e.name),
    rejected: (Array.isArray(raw.rejected) ? raw.rejected : []).filter(isObject).map((r: Json) => ({ name: str(r.name), fstype: str(r.fstype), label: str(r.label) })),
    job: jobOf(raw.job)
  }
}

export async function usbStatus (): Promise<UsbStatus> {
  const response = await httpClientActions.get(`${BASE}/status`)
  return statusOf(response.data)
}

function entryOf (stick: string, raw: unknown, isDir?: boolean): UsbEntry | null {
  if (!isObject(raw) || !str(raw.name)) return null
  const dir = isDir ?? raw.is_dir === true
  const path = str(raw.path) || usbPath(stick, str(raw.name))
  return { name: raw.name, path, rel: relativeTo(stick, path), size: num(raw.size), modified: num(raw.modified), isDir: dir }
}

/**
 * One page of a folder on the stick, folders first, newest first (the printer
 * sorts before it pages). `rel` is the folder inside the stick ('' is its root).
 */
export async function usbList (stick: string, rel: string, offset = 0, limit = 200): Promise<UsbListing> {
  const response = await httpClientActions.get(`${BASE}/list`, { params: { path: usbPath(stick, rel), offset, limit } })
  const raw = unwrap(response.data)
  let entries: UsbEntry[]
  if (Array.isArray(raw.entries)) {
    entries = raw.entries.map((e: unknown) => entryOf(stick, e)).filter((e: UsbEntry | null): e is UsbEntry => !!e)
  } else {
    // The first version answered dirs and files as two lists.
    const dirs = (Array.isArray(raw.dirs) ? raw.dirs : []).map((e: unknown) => entryOf(stick, e, true))
    const files = (Array.isArray(raw.files) ? raw.files : []).map((e: unknown) => entryOf(stick, e, false))
    entries = [...dirs, ...files].filter((e): e is UsbEntry => !!e)
  }
  const total = numOrNull(raw.total) ?? offset + entries.length
  return { entries, total, truncated: raw.truncated === true }
}

/** Starts a print of a file on the stick (the printer copies it to itself first). */
export async function usbPrint (stick: string, rel: string): Promise<string> {
  const response = await httpClientActions.post(`${BASE}/print`, { path: usbPath(stick, rel) })
  return str(unwrap(response.data).filename)
}

export interface CopyRequest {
  direction: UsbDirection;
  stick: string;
  /** Paths inside the source (the stick, or gcodes/ going to the stick); `['/']` is everything. */
  items: string[];
  dest?: string;
  onConflict: UsbConflict;
}

export async function usbCopy (request: CopyRequest): Promise<string> {
  const body: Json = { direction: request.direction, stick: request.stick, items: request.items, on_conflict: request.onConflict }
  if (request.dest) body.dest = request.dest
  const response = await httpClientActions.post(`${BASE}/copy`, body)
  return str(unwrap(response.data).job_id)
}

export async function usbJob (): Promise<UsbJob | null> {
  const response = await httpClientActions.get(`${BASE}/job`)
  return jobOf(unwrap(response.data))
}

export async function usbCancel (jobId: string): Promise<void> {
  await httpClientActions.post(`${BASE}/job/cancel`, { job_id: jobId })
}

export async function usbEject (stick: string): Promise<void> {
  await httpClientActions.post(`${BASE}/eject`, { stick })
}

/**
 * One file off the stick, through the same client as every other call (so it
 * works over a LAN, Bluetooth or the cloud relay), with its progress.
 */
export async function usbDownload (stick: string, rel: string, options: { onProgress?: (loaded: number, total: number) => void, signal?: AbortSignal } = {}): Promise<Blob> {
  const response = await httpClientActions.get<Blob>(`${BASE}/file`, {
    params: { path: usbPath(stick, rel) },
    responseType: 'blob',
    signal: options.signal,
    onDownloadProgress: (event: AxiosProgressEvent) => options.onProgress?.(event.loaded, event.total ?? 0)
  })
  return response.data
}

/** Hands a blob to the browser as a download. */
export function saveBlob (blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** The HTTP status and the printer's `reason`, from a failed call. */
export function failureOf (error: unknown): { status: number, reason: string, message: string } {
  const e = error as { response?: { status?: number, data?: any }, message?: string }
  const data = e?.response?.data
  const inner: Json = isObject(data) ? (isObject(data.error) ? data.error : data) : {}
  const message = typeof data === 'string' ? data : str(inner.message) || (isObject(data) && typeof data.error === 'string' ? data.error : '')
  return { status: e?.response?.status ?? 0, reason: str(inner.reason), message: message || str(e?.message) }
}
