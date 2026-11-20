import { beforeEach, describe, expect, it, vi } from 'vitest'
import { failureOf, jobOf, relativeTo, statusOf, usbCancel, usbCopy, usbDownload, usbEject, usbList, usbPath, usbPrint, usbStatus } from '../api'
import { applyUsbJob, isUnsupported, refreshUsb, resetUsb, usb } from '../state'
import { bytesWords, jobHeadline, reasonWords } from '../words'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/api/httpClientActions', () => ({ httpClientActions: http }))

beforeEach(() => {
  vi.clearAllMocks()
  resetUsb()
})

const JOB = {
  id: 'j1',
  direction: 'to_printer',
  stick: 'SANDISK',
  state: 'running',
  files_total: 2,
  files_done: 1,
  bytes_total: 300,
  bytes_done: 150,
  current: 'b.gcode',
  items: [
    { path: 'a.gcode', dest: 'usb-import/SANDISK/a.gcode', bytes_total: 100, bytes_done: 100, state: 'done', error: '' },
    { path: 'b.gcode', dest: 'usb-import/SANDISK/b.gcode', bytes_total: 200, bytes_done: 50, state: 'copying', error: '' }
  ],
  skipped: [],
  errors: [],
  started_at: 1,
  ended_at: null
}

describe('the printer\'s USB routes, through the page\'s own HTTP client', () => {
  it('spells paths the way Moonraker does, and reads them back', () => {
    expect(usbPath('SANDISK', '')).toBe('usb/SANDISK')
    expect(usbPath('SANDISK', '/parts/a.gcode')).toBe('usb/SANDISK/parts/a.gcode')
    expect(relativeTo('SANDISK', 'usb/SANDISK/parts/a.gcode')).toBe('parts/a.gcode')
    expect(relativeTo('SANDISK', 'SANDISK/a.gcode')).toBe('a.gcode')
    expect(relativeTo('SANDISK', 'usb/SANDISK')).toBe('')
  })

  it('reads the status: sticks with their space, what was ejected, and the job', async () => {
    http.get.mockResolvedValue({
      data: {
        result: {
          sticks: [{ name: 'SANDISK', path: 'usb/SANDISK', free_bytes: 10, total_bytes: 20, fs: 'vfat', writable: false }],
          ejected: [{ name: 'OLD', at: 5 }],
          rejected: [{ name: 'X', fstype: 'ntfs', label: 'BACKUP' }],
          job: JOB
        }
      }
    })
    const status = await usbStatus()
    expect(http.get).toHaveBeenCalledWith('/server/muon/usb/status')
    expect(status.sticks).toEqual([{ name: 'SANDISK', path: 'usb/SANDISK', freeBytes: 10, totalBytes: 20, fs: 'vfat', writable: false, readOnly: false }])
    expect(status.ejected).toEqual([{ name: 'OLD', at: 5 }])
    expect(status.rejected[0].fstype).toBe('ntfs')
    expect(status.job?.id).toBe('j1')
  })

  it('a printer that sends no new fields still reads: no job, no space, no ejected', () => {
    const status = statusOf({ sticks: [{ name: 'A', path: 'usb/A' }], rejected: [] })
    expect(status.sticks[0]).toMatchObject({ freeBytes: null, totalBytes: null, readOnly: false })
    expect(status.ejected).toEqual([])
    expect(status.job).toBeNull()
  })

  it('lists a page (API v1.2: dirs and files, with total), with the offset and limit; an entries list is still read', async () => {
    http.get.mockResolvedValueOnce({
      data: {
        result: {
          dirs: [{ name: 'parts', path: 'usb/SANDISK/parts', modified: 3 }],
          files: [{ name: 'a.gcode', path: 'usb/SANDISK/a.gcode', size: 100, modified: 2 }],
          total: 250,
          truncated: false
        }
      }
    })
    const page = await usbList('SANDISK', '', 100, 100)
    expect(http.get).toHaveBeenCalledWith('/server/muon/usb/list', { params: { path: 'usb/SANDISK', offset: 100, limit: 100 } })
    expect(page.total).toBe(250)
    expect(page.entries.map(e => [e.name, e.isDir, e.rel, e.size])).toEqual([['parts', true, 'parts', 0], ['a.gcode', false, 'a.gcode', 100]])

    http.get.mockResolvedValueOnce({
      data: {
        result: {
          dirs: [{ name: 'x', path: 'usb/S/x', modified: 1 }], files: [{ name: 'b.gcode', path: 'usb/S/x/b.gcode', modified: 1, size: 5 }], truncated: true
        }
      }
    })
    const short = await usbList('S', 'x')
    expect(short.entries.map(e => [e.name, e.isDir, e.rel])).toEqual([['x', true, 'x'], ['b.gcode', false, 'x/b.gcode']])
    expect(short.total).toBe(2)
    expect(short.truncated).toBe(true)

    http.get.mockResolvedValueOnce({ data: { result: { entries: [{ name: 'd', path: 'usb/S/d', is_dir: true }], total: 1 } } })
    expect((await usbList('S', '')).entries[0].isDir).toBe(true)
  })

  it('copies: the direction, the stick, the items and the conflict choice, and returns the job id', async () => {
    http.post.mockResolvedValue({ data: { result: { job_id: 'j9' } } })
    expect(await usbCopy({ direction: 'to_printer', stick: 'SANDISK', items: ['/'], onConflict: 'replace' })).toBe('j9')
    expect(http.post).toHaveBeenCalledWith('/server/muon/usb/copy', { direction: 'to_printer', stick: 'SANDISK', items: ['/'], on_conflict: 'replace' })
    await usbCopy({ direction: 'to_usb', stick: 'SANDISK', items: ['a.gcode'], dest: 'backup', onConflict: 'skip' })
    expect(http.post).toHaveBeenLastCalledWith('/server/muon/usb/copy', { direction: 'to_usb', stick: 'SANDISK', items: ['a.gcode'], on_conflict: 'skip', dest: 'backup' })
  })

  it('cancels, ejects and prints with the bodies the printer takes', async () => {
    http.post.mockResolvedValue({ data: { result: { filename: 'usb-import/a.gcode' } } })
    await usbCancel('j1')
    expect(http.post).toHaveBeenLastCalledWith('/server/muon/usb/job/cancel', { job_id: 'j1' })
    await usbEject('SANDISK')
    expect(http.post).toHaveBeenLastCalledWith('/server/muon/usb/eject', { stick: 'SANDISK' })
    expect(await usbPrint('SANDISK', 'parts/a.gcode')).toBe('usb-import/a.gcode')
    expect(http.post).toHaveBeenLastCalledWith('/server/muon/usb/print', { path: 'usb/SANDISK/parts/a.gcode' })
  })

  it('downloads as a blob through the client and reports its progress', async () => {
    const blob = new Blob(['G28'])
    http.get.mockImplementation(async (_url: string, options: any) => {
      options.onDownloadProgress({ loaded: 5, total: 10 })
      return { data: blob }
    })
    const seen: Array<[number, number]> = []
    expect(await usbDownload('SANDISK', 'a.gcode', { onProgress: (l, t) => seen.push([l, t]) })).toBe(blob)
    expect(http.get.mock.calls[0][0]).toBe('/server/muon/usb/file')
    expect(http.get.mock.calls[0][1]).toMatchObject({ params: { path: 'usb/SANDISK/a.gcode' }, responseType: 'blob' })
    expect(seen).toEqual([[5, 10]])
  })

  it('reads a refusal: its status, the printer\'s reason and its words', () => {
    expect(failureOf({ response: { status: 409, data: { error: { code: 409, message: 'A copy is running.', reason: 'job_running' } } } })).toEqual({ status: 409, reason: 'job_running', message: 'A copy is running.' })
    expect(failureOf({ response: { status: 403, data: { error: 'muon-link policy refused' } } }).message).toBe('muon-link policy refused')
    expect(failureOf(new Error('Network Error'))).toEqual({ status: 0, reason: '', message: 'Network Error' })
  })
})

describe('a job, from the printer\'s notification', () => {
  it('reads the per-item bytes, the errors and the skips', () => {
    const job = jobOf({ ...JOB, skipped: [{ path: 'c.gcode', reason: 'exists' }], errors: [{ path: 'd.gcode', reason: 'read_error' }] })!
    expect(job.items.map(i => [i.path, i.state, i.bytesDone, i.bytesTotal])).toEqual([['a.gcode', 'done', 100, 100], ['b.gcode', 'copying', 50, 200]])
    expect(job.skipped).toEqual([{ path: 'c.gcode', reason: 'exists' }])
    expect(job.errors).toEqual([{ path: 'd.gcode', reason: 'read_error' }])
  })

  it('past 200 items the notification carries only the item that changed: it is merged into the list', () => {
    const items = Array.from({ length: 250 }, (_, i) => ({ path: `f${i}.gcode`, dest: '', bytes_total: 10, bytes_done: 0, state: 'pending', error: '' }))
    applyUsbJob(jobOf({ ...JOB, files_total: 250, items }))
    expect(usb.job?.items).toHaveLength(250)
    applyUsbJob(jobOf({ ...JOB, files_total: 250, files_done: 1, items: [{ path: 'f7.gcode', dest: '', bytes_total: 10, bytes_done: 10, state: 'done', error: '' }] }))
    expect(usb.job?.items).toHaveLength(250)
    expect(usb.job?.items[7].state).toBe('done')
    expect(usb.job?.items[8].state).toBe('pending')
    expect(usb.job?.filesDone).toBe(1)
  })

  it('a new job replaces the old one', () => {
    applyUsbJob(jobOf(JOB))
    applyUsbJob(jobOf({ ...JOB, id: 'j2', items: [] }))
    expect(usb.job?.id).toBe('j2')
    expect(usb.job?.items).toEqual([])
  })
})

describe('whether the printer has the USB routes', () => {
  it('a 404 (or a gateway that refuses the path) means no USB view', async () => {
    http.get.mockRejectedValue({ response: { status: 404, data: 'Not Found' } })
    await refreshUsb()
    expect(usb.supported).toBe(false)
    expect(isUnsupported({ response: { status: 403 } })).toBe(true)
    expect(isUnsupported({ response: { status: 405 } })).toBe(true)
  })

  it('a dropped connection says nothing either way', async () => {
    http.get.mockRejectedValue(new Error('Network Error'))
    await refreshUsb()
    expect(usb.supported).toBeNull()
  })

  it('an answer means it does', async () => {
    http.get.mockResolvedValue({ data: { result: { sticks: [{ name: 'A', path: 'usb/A' }] } } })
    await refreshUsb()
    expect(usb.supported).toBe(true)
    expect(usb.status?.sticks).toHaveLength(1)
  })
})

describe('the words', () => {
  it('every error code the printer sends is a sentence', () => {
    for (const code of ['stick_removed', 'no_space', 'exists', 'read_error', 'write_error', 'cancelled', 'name_invalid', 'folder_full', 'too_large', 'source_changed']) {
      expect(reasonWords(code)).not.toBe(code)
      expect(reasonWords(code)).toMatch(/\.$/)
    }
    expect(reasonWords('something_new')).toBe('something_new')
  })

  it('sizes and headlines', () => {
    expect(bytesWords(2_400_000)).toBe('2.4 MB')
    expect(bytesWords(999)).toBe('999 B')
    expect(jobHeadline(jobOf(JOB)!)).toBe('Copying 1 of 2 files to the printer')
    expect(jobHeadline(jobOf({ ...JOB, state: 'cancelled' })!)).toContain('Cancelled')
  })
})
