import Vue from 'vue'
import { failureOf, jobOf, usbJob, usbStatus } from './api'
import type { UsbJob, UsbStatus } from './types'
import { isRunning } from './words'

/**
 * What Control knows about the printer's USB sticks (KAN-4814).
 *
 * `supported` is null until the first look. A printer without the routes
 * answers 404 (or refuses with 403 / 405 over a gateway that doesn't carry
 * them), and the USB view then stays hidden: there is nothing to show.
 */
export const usb = Vue.observable({
  supported: null as boolean | null,
  status: null as UsbStatus | null,
  job: null as UsbJob | null,
  /** The finished job whose panel the person closed. */
  dismissed: ''
})

/** The state of the job, from the printer's notification or a read. */
export function applyUsbJob (next: UsbJob | null): void {
  if (!next) return
  const have = usb.job
  if (have && have.id === next.id && next.items.length < have.items.length) {
    // Past 200 items the printer sends only the item that changed, plus the totals.
    const items = have.items.slice()
    for (const item of next.items) {
      const at = items.findIndex(i => i.path === item.path)
      if (at >= 0) items.splice(at, 1, item)
      else items.push(item)
    }
    usb.job = { ...next, items }
  } else {
    usb.job = next
  }
}

/** A `notify_muon_usb_job` payload. */
export function onUsbJobNotification (payload: unknown): void {
  applyUsbJob(jobOf(payload))
}

export function dismissJob (): void {
  if (usb.job) usb.dismissed = usb.job.id
}

export function applyUsbStatus (status: UsbStatus): void {
  usb.supported = true
  usb.status = status
  if (status.job) applyUsbJob(status.job)
}

/** A printer without the routes: 404, or a gateway that refuses a path it doesn't carry. */
export function isUnsupported (error: unknown): boolean {
  const { status } = failureOf(error)
  return status === 404 || status === 403 || status === 405 || status === 501
}

export async function refreshUsb (): Promise<void> {
  try {
    applyUsbStatus(await usbStatus())
  } catch (error) {
    if (isUnsupported(error)) {
      usb.supported = false
      usb.status = null
    }
    // Anything else (a dropped connection) leaves what was known; the next look tries again.
  }
}

/** Reads the job as the printer has it now (a notification may have been missed). */
export async function refreshUsbJob (): Promise<void> {
  try {
    applyUsbJob(await usbJob())
  } catch {
    // Not reachable right now; the next look tries again.
  }
}

export function resetUsb (): void {
  usb.supported = null
  usb.status = null
  usb.job = null
  usb.dismissed = ''
}

const STATUS_EVERY_MS = 4000
const JOB_EVERY_MS = 1500
const UNSUPPORTED_EVERY_MS = 15000

/**
 * Looks at the printer's sticks while a page that shows them is open: the
 * status every few seconds, and the job every second or so while one runs
 * (the notification is the fast path; this covers a socket that is down, as
 * over Bluetooth). Returns what stops it.
 */
export function watchUsb (): () => void {
  let stopped = false
  let misses = 0
  let statusTimer: ReturnType<typeof setTimeout> | undefined
  let jobTimer: ReturnType<typeof setTimeout> | undefined

  const status = async () => {
    await refreshUsb()
    if (stopped) return
    // A printer without the routes is looked at again now and then: the first look can come before the page
    // has its printer's address, or the printer can be updated while the page is open.
    statusTimer = setTimeout(status, usb.supported === false && ++misses > 5 ? UNSUPPORTED_EVERY_MS : STATUS_EVERY_MS)
  }
  const job = async () => {
    if (stopped) return
    if (usb.supported && isRunning(usb.job)) await refreshUsbJob()
    if (stopped) return
    jobTimer = setTimeout(job, JOB_EVERY_MS)
  }
  status()
  jobTimer = setTimeout(job, JOB_EVERY_MS)
  return () => {
    stopped = true
    if (statusTimer) clearTimeout(statusTimer)
    if (jobTimer) clearTimeout(jobTimer)
  }
}
