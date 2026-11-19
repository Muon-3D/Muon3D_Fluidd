/**
 * The printer's USB routes (KAN-4814, API v1 and v1.1), for a page's
 * printer: status, list (paged), file (download), print, copy, job, cancel,
 * eject, and the `notify_muon_usb_job` notification. The test drives the
 * copy by hand (`progress`, `complete`, `fail`), so each state the panel can
 * be in is held still while the test looks at it.
 *
 *   const usb = await useUsb(page, printer, { files: [{ rel: 'a.gcode', size: 1000 }] })
 *   await open('/jobs')
 */
import type { Page, Route } from '@playwright/test'
import { MOCK_PORT } from '../ports'
import type { PrinterHandle } from '../control/printer'

type Json = Record<string, any>

export interface UsbFile { rel: string, size: number, modified?: number }

export interface UsbCall { method: string, path: string, query: Record<string, string>, body: Json }

export interface UsbInit {
  stick?: string | null;
  files?: UsbFile[];
  /** Files on the printer (gcodes/), the source of a copy to the stick. */
  printerFiles?: UsbFile[];
  /** Names already in the destination: a copy with on_conflict `skip` skips them. */
  existing?: string[];
  readOnly?: boolean;
  free?: number;
  total?: number;
}

export interface UsbHandle {
  calls: UsbCall[];
  /** Calls of one route: `called('POST', 'copy')`. */
  called: (method: string, route: string) => UsbCall[];
  job: Json | null;
  /** The printer: the stick is out. */
  removeStick: () => void;
  insertStick: (name?: string) => void;
  /** The running copy has moved to this fraction of its bytes (0 to 1). */
  progress: (fraction: number) => void;
  /** Every file of the running copy is finished. */
  complete: () => void;
  /** The running copy stops: the file it was on fails with this code, the job as `failed` or, with `jobReason`, with that reason. */
  fail: (code: string, jobReason?: string) => void;
}

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }

const reply = (route: Route, result: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(status < 300 ? { result } : result) })

export async function useUsb (page: Page, printer: PrinterHandle, init: UsbInit = {}): Promise<UsbHandle> {
  const files: UsbFile[] = init.files ?? []
  const printerFiles: UsbFile[] = init.printerFiles ?? []
  let stick: string | null = init.stick === undefined ? 'SANDISK' : init.stick
  let ejected: Array<{ name: string, at: number }> = []
  const calls: UsbCall[] = []
  let job: Json | null = null

  const modifiedOf = (f: UsbFile) => f.modified ?? 1_700_000_000

  const push = () => { if (job) printer.notify('notify_muon_usb_job', job) }

  const handle: UsbHandle = {
    calls,
    called: (method, route) => calls.filter(c => c.method === method && c.path === `/server/muon/usb/${route}`),
    get job () { return job },
    removeStick: () => { stick = null },
    insertStick: (name = 'SANDISK') => { stick = name; ejected = [] },
    progress: fraction => {
      if (!job) return
      let budget = Math.round(job.bytes_total * fraction)
      let done = 0
      let active = false
      for (const item of job.items) {
        if (item.state === 'skipped' || item.state === 'failed') continue
        const take = Math.min(item.bytes_total, budget)
        budget -= take
        item.bytes_done = take
        if (take >= item.bytes_total) { item.state = 'done'; done++ }
        else if (!active) { item.state = 'copying'; active = true }
        else item.state = 'pending'
      }
      job.files_done = done
      job.bytes_done = job.items.reduce((n: number, i: Json) => n + i.bytes_done, 0)
      job.current = job.items.find((i: Json) => i.state === 'copying')?.path ?? ''
      push()
    },
    complete: () => {
      if (!job) return
      for (const item of job.items) {
        if (item.state === 'skipped' || item.state === 'failed') continue
        item.state = 'done'
        item.bytes_done = item.bytes_total
      }
      job.files_done = job.items.filter((i: Json) => i.state === 'done').length
      job.bytes_done = job.items.reduce((n: number, i: Json) => n + i.bytes_done, 0)
      job.state = 'done'
      job.current = ''
      job.ended_at = Date.now() / 1000
      push()
    },
    fail: (code, jobReason) => {
      if (!job) return
      const item = job.items.find((i: Json) => i.state === 'copying') ?? job.items.find((i: Json) => i.state === 'pending')
      if (item) {
        item.state = 'failed'
        item.error = code
        job.errors.push({ path: item.path, reason: code })
      }
      for (const i of job.items) if (i.state === 'pending') i.state = 'cancelled'
      job.state = 'failed'
      if (jobReason) job.reason = jobReason
      job.ended_at = Date.now() / 1000
      push()
    }
  }

  const sticks = () => stick
    ? [{ name: stick, path: `usb/${stick}`, free_bytes: init.free ?? 12_300_000_000, total_bytes: init.total ?? 32_000_000_000, fs: 'vfat', writable: false, read_only: init.readOnly === true }]
    : []

  /** The files a copy covers: `/` is all, a folder is what is in it, a file is itself. */
  const expand = (from: UsbFile[], items: string[]): UsbFile[] => {
    const out = new Map<string, UsbFile>()
    for (const raw of items) {
      // v1.2: the stick's side is usb/<stick>/<path>; the printer's side is relative to gcodes/.
      const item = raw.startsWith('usb/') ? raw.replace(/^usb\/[^/]+\/?/, '') || '/' : raw
      for (const f of from) {
        if (item === '/' || f.rel === item || f.rel.startsWith(`${item}/`)) out.set(f.rel, f)
      }
    }
    return [...out.values()]
  }

  /** One page of a folder: folders first, then newest first. */
  const listing = (rel: string, offset: number, limit: number) => {
    const prefix = rel ? `${rel}/` : ''
    const dirs = new Map<string, number>()
    const here: UsbFile[] = []
    for (const f of files) {
      if (!f.rel.startsWith(prefix)) continue
      const rest = f.rel.slice(prefix.length)
      const slash = rest.indexOf('/')
      if (slash >= 0) dirs.set(rest.slice(0, slash), Math.max(dirs.get(rest.slice(0, slash)) ?? 0, modifiedOf(f)))
      else here.push(f)
    }
    const dirList = [...dirs.entries()].sort((a, b) => b[1] - a[1]).map(([name, modified]) => ({ name, path: `usb/${stick}/${prefix}${name}`, modified }))
    const fileList = here.sort((a, b) => modifiedOf(b) - modifiedOf(a)).map(f => ({ name: f.rel.slice(prefix.length), path: `usb/${stick}/${f.rel}`, size: f.size, modified: modifiedOf(f) }))
    // v1.2: the dirs/files split, folders first; the page is cut over the two lists together.
    const total = dirList.length + fileList.length
    return {
      path: `usb/${stick}/${rel}`,
      dirs: dirList.slice(offset, offset + limit),
      files: fileList.slice(Math.max(0, offset - dirList.length), Math.max(0, offset + limit - dirList.length)),
      total,
      truncated: false
    }
  }

  await page.route(new RegExp(`:${MOCK_PORT}/server/muon/usb/`), async route => {
    const request = route.request()
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: CORS }); return }
    const url = new URL(request.url())
    const body = request.method() === 'POST' ? (request.postDataJSON() ?? {}) as Json : {}
    const query = Object.fromEntries(url.searchParams.entries())
    calls.push({ method: request.method(), path: url.pathname, query, body })
    const name = url.pathname.replace('/server/muon/usb/', '')

    if (name === 'status') {
      await reply(route, { sticks: sticks(), rejected: [], ejected, job }); return
    }
    if (name === 'list') {
      if (!stick) { await reply(route, { error: { code: 404, message: 'The USB stick or path is no longer available.' } }, 404); return }
      const rel = String(query.path ?? '').replace(`usb/${stick}`, '').replace(/^\//, '')
      await reply(route, listing(rel, Number(query.offset ?? 0), Number(query.limit ?? 500))); return
    }
    if (name === 'file') {
      const rel = String(query.path ?? '').replace(`usb/${stick}/`, '')
      const file = files.find(f => f.rel === rel)
      if (!stick || !file) { await reply(route, { error: { code: 404, message: 'The USB stick or path is no longer available.' } }, 404); return }
      const content = `; ${rel}\nG28\n`
      await route.fulfill({
        status: 200,
        headers: { ...CORS, 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.rel.split('/').pop() ?? '')}`, 'access-control-expose-headers': '*' },
        contentType: 'application/octet-stream',
        body: content
      })
      return
    }
    if (name === 'print') {
      await reply(route, { filename: `usb-import/${String(body.path).split('/').pop()}` }); return
    }
    if (name === 'copy') {
      if (job && (job.state === 'running' || job.state === 'queued')) {
        await reply(route, { error: { code: 409, message: 'A copy is already running.' } }, 409); return
      }
      const toPrinter = body.direction === 'to_printer'
      const covered = expand(toPrinter ? files : printerFiles, body.items ?? [])
      const items = covered.map(f => {
        const exists = (init.existing ?? []).includes(f.rel)
        const skipped = exists && body.on_conflict === 'skip'
        return { path: f.rel, dest: f.rel, bytes_total: f.size, bytes_done: 0, state: skipped ? 'skipped' : 'pending', error: skipped ? 'exists' : '' }
      })
      job = {
        id: `job-${calls.length}`,
        direction: body.direction,
        stick: body.stick,
        state: 'running',
        files_total: items.length,
        files_done: 0,
        bytes_total: items.filter(i => i.state !== 'skipped').reduce((n, i) => n + i.bytes_total, 0),
        bytes_done: 0,
        current: '',
        items,
        skipped: items.filter(i => i.state === 'skipped').map(i => ({ path: i.path, reason: 'exists' })),
        errors: [],
        started_at: Date.now() / 1000,
        ended_at: null
      }
      handle.progress(0)
      await reply(route, { job_id: job.id }, 202); return
    }
    if (name === 'job') {
      await reply(route, job ?? {}); return
    }
    if (name === 'job/cancel') {
      if (job && job.state === 'running') {
        for (const i of job.items) if (i.state === 'pending' || i.state === 'copying') { i.state = 'cancelled'; i.error = 'cancelled' }
        job.state = 'cancelled'
        job.ended_at = Date.now() / 1000
        push()
      }
      await reply(route, {}); return
    }
    if (name === 'eject') {
      if (job && (job.state === 'running' || job.state === 'queued')) {
        await reply(route, { error: { code: 409, message: 'A copy is running.', reason: 'job_running', job_id: job.id } }, 409); return
      }
      if (stick) ejected = [{ name: stick, at: Date.now() / 1000 }]
      stick = null
      await reply(route, {}); return
    }
    await reply(route, { error: { code: 404, message: 'Not Found' } }, 404)
  })

  return handle
}
