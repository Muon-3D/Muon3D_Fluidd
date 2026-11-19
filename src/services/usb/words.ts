import type { UsbItemState, UsbJob } from './types'

/** The printer's error codes (KAN-4814, API v1.1) in plain words. */
const REASONS: Record<string, string> = {
  stick_removed: 'The USB stick was taken out.',
  no_space: 'There is not enough space.',
  exists: 'A file with that name is already there, so it was skipped.',
  read_error: 'The file could not be read.',
  write_error: 'The file could not be written. The stick may be write-protected.',
  cancelled: 'Cancelled.',
  name_invalid: 'The name can\'t be used on a USB stick.',
  folder_full: 'That folder is full.',
  too_large: 'The file is too big for this stick (4 GB limit).',
  source_changed: 'The file changed while it was being copied.',
  job_running: 'A copy is still running.'
}

/** An error code as a sentence; a code Control doesn't know is shown as the printer wrote it. */
export function reasonWords (code: string | undefined | null): string {
  if (!code) return ''
  return REASONS[code] ?? code
}

export function itemStateWords (state: UsbItemState): string {
  switch (state) {
    case 'pending': return 'Waiting'
    case 'copying': return 'Copying'
    case 'done': return 'Copied'
    case 'skipped': return 'Skipped'
    case 'failed': return 'Failed'
    case 'cancelled': return 'Cancelled'
  }
}

export function isRunning (job: UsbJob | null | undefined): boolean {
  return !!job && (job.state === 'queued' || job.state === 'running')
}

/** The sentence over the progress bar. */
export function jobHeadline (job: UsbJob): string {
  const where = job.direction === 'to_printer' ? 'to the printer' : 'to the USB stick'
  const count = `${job.filesTotal} ${job.filesTotal === 1 ? 'file' : 'files'}`
  switch (job.state) {
    case 'queued': return `Getting ready to copy ${count} ${where}`
    case 'running': return `Copying ${job.filesDone} of ${count} ${where}`
    case 'done': return job.errors.length || job.skipped.length
      ? `Finished copying ${where}, with some left out`
      : `Copied ${count} ${where}`
    case 'cancelled': return `Cancelled. ${job.filesDone} of ${count} had been copied ${where}`
    case 'failed': return `Stopped. ${reasonWords(job.reason) || 'The copy failed.'}`
  }
}

/** Bytes as the files list shows them. */
export function bytesWords (bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return ''
  if (bytes < 1000) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes
  let i = -1
  while (value >= 1000 && i < units.length - 1) { value /= 1000; i++ }
  return `${value >= 100 ? Math.round(value) : Math.round(value * 10) / 10} ${units[i]}`
}

export function percentOf (done: number, total: number): number {
  if (!total || total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)))
}
