import Vue from 'vue'
import { pairableRefusal } from './refusal'

/**
 * How hard Control tries to reach a printer over Bluetooth in the background
 * (I-129). Before this, each failed status poll dialled again about every 3 s,
 * 21 times a minute, for as long as the tab stayed open.
 *
 * - Waits of 2, 4, 8, 16, then 30 s between tries, and 5 tries at most.
 * - A definitive refusal (the printer refusing this browser, NET-17) is not
 *   retried at all: the person pairs, or picks another route.
 * - Once stopped it stays stopped until `retryBluetooth` (the Retry button).
 */
export const BLE_MAX_ATTEMPTS = 5
const BASE_MS = 2000
const CAP_MS = 30_000

/** The wait after the `failures`-th failed try. */
export const backoffMs = (failures: number): number => Math.min(CAP_MS, BASE_MS * 2 ** Math.max(0, failures - 1))

/** Printers whose background tries stopped, with the reason to show. */
export const bleRetryState = Vue.observable({ stopped: {} as Record<string, string> })

const failures = new Map<string, { count: number, nextAt: number }>()

/** Whether a background try may be made now. */
export function mayDialBluetooth (printerId: string, now = Date.now()): boolean {
  if (bleRetryState.stopped[printerId]) return false
  const f = failures.get(printerId)
  return !f || now >= f.nextAt
}

/** Whether this error is a refusal that another try cannot change. */
export function isDefinitiveRefusal (error: unknown): boolean {
  if (pairableRefusal(error)) return true
  const e = error as { kind?: unknown } | null
  return !!e && typeof e === 'object' && e.kind === 'refused'
}

export function noteBluetoothFailure (printerId: string, error: unknown, now = Date.now()): void {
  const message = (error as Error)?.message || 'The printer did not answer over Bluetooth.'
  const count = (failures.get(printerId)?.count ?? 0) + 1
  if (isDefinitiveRefusal(error) || count >= BLE_MAX_ATTEMPTS) {
    failures.delete(printerId)
    Vue.set(bleRetryState.stopped, printerId, message)
    return
  }
  failures.set(printerId, { count, nextAt: now + backoffMs(count) })
}

export function noteBluetoothSuccess (printerId: string): void {
  failures.delete(printerId)
  Vue.delete(bleRetryState.stopped, printerId)
}

/** The Retry button: forget the failures so the next poll dials afresh. */
export const retryBluetooth = noteBluetoothSuccess
