/**
 * Whether the Muon3D service is out of reach right now, so a Bluetooth open
 * skips every cloud call instead of waiting each one out. True when the browser
 * says it is offline (DevTools Offline, no network), or when the service's last
 * request failed with no answer (status 0) while the browser still says online
 * (a real outage, a captive network). Any answer from the service clears it.
 */
const OUTAGE_MEMORY_MS = 60_000
let failedAt = 0

export function noteCloudUnreachable () {
  failedAt = Date.now()
}

export function noteCloudReached () {
  failedAt = 0
}

export function cloudUnreachable (): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  return failedAt > 0 && Date.now() - failedAt < OUTAGE_MEMORY_MS
}

/** For tests. */
export function resetCloudOutage () {
  failedAt = 0
}
