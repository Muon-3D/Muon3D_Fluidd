import Vue from 'vue'
import type { AuxUpdateStatus } from './model'

/**
 * "Install after this print" (storyboard settings/updates.md, frame 2;
 * Jack's recommended answer: yes). Install is refused while a print runs, so
 * the choice is kept here, per printer, and the install is sent once that
 * print is over: by whichever Control page is open then, or the next one to
 * open. It is dropped, never sent, when the version it was for is no longer
 * the one ready, or after a day.
 */
export interface QueuedInstall {
  from: string | null;
  to: string | null;
  /** The print it waits for, as the person saw it. */
  file: string | null;
  /** When it was asked for, ms. */
  at: number;
}

export const AFTER_PRINT_MAX_MS = 24 * 60 * 60 * 1000

export const afterPrint = Vue.observable({
  printer: '',
  queued: null as QueuedInstall | null
})

const storageKey = (printer: string) => `muon3d.update.after.${printer}`

function save () {
  try {
    const key = storageKey(afterPrint.printer)
    if (afterPrint.queued) localStorage.setItem(key, JSON.stringify(afterPrint.queued))
    else localStorage.removeItem(key)
  } catch { /* private window: it lasts until the tab closes */ }
}

/** The queued install for `printer`, read once when the page switches to it. */
export function loadAfterPrint (printer: string): QueuedInstall | null {
  if (printer === afterPrint.printer) return afterPrint.queued
  afterPrint.printer = printer
  try {
    const raw = localStorage.getItem(storageKey(printer))
    afterPrint.queued = raw ? JSON.parse(raw) as QueuedInstall : null
  } catch {
    afterPrint.queued = null
  }
  return afterPrint.queued
}

export function queueAfterPrint (printer: string, queued: QueuedInstall) {
  afterPrint.printer = printer
  afterPrint.queued = queued
  save()
}

export function cancelAfterPrint () {
  afterPrint.queued = null
  save()
}

const PRINT_OVER = ['complete', 'cancelled', 'standby', 'ready', 'idle']

/**
 * What to do with a queued install now: wait while the print runs (or is
 * paused), install once it is over, drop it when it no longer applies (the
 * version changed or was installed, the printer errored, or a day passed).
 */
export function afterPrintDue (queued: QueuedInstall | null, printerState: string, status: AuxUpdateStatus | null, now: number): 'wait' | 'install' | 'drop' {
  if (!queued) return 'wait'
  if (now - queued.at > AFTER_PRINT_MAX_MS) return 'drop'
  if (!status) return 'wait'
  if (!status.update_available || !status.target_version || status.target_version !== queued.to || status.current_version === queued.to) return 'drop'
  const state = printerState.toLowerCase()
  if (state === 'printing' || state === 'paused') return 'wait'
  if (state === 'error') return 'drop'
  return PRINT_OVER.includes(state) ? 'install' : 'wait'
}

/** The updater's name for MuonOS: the component of type ota. */
export function otaComponent (versionInfo: Record<string, { configured_type?: string }> | null | undefined): string {
  const info = versionInfo ?? {}
  return Object.keys(info).find(k => info[k]?.configured_type === 'ota') ?? 'MuonOS'
}
