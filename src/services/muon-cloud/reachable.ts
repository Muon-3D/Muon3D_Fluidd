/**
 * Whether the Muon3D service can be reached from here. On a printer's own
 * hotspot the browser reports "online" with no internet behind it, so
 * `navigator.onLine` is no answer: ask the service itself. Any HTTP answer,
 * even an error status, means it is reachable.
 *
 * A slow link is not a dead one: each ask waits up to 8 s, and a failed ask is
 * made once more before the service is called unreachable. A hotspot never
 * fires `online`, so the check also repeats when the tab is shown or focused,
 * at most once a minute.
 */
import Vue from 'vue'
import { cloudBaseUrl } from './api'

export const CLOUD_CHECK_MS = 8000
export const CLOUD_RECHECK_MS = 60_000

export const reachState = Vue.observable({
  /** Optimistic until a check says otherwise, so a slow check never hides a working button. */
  reachable: true,
  checked: false,
  /** When the last check finished (ms since the epoch); 0 before the first. */
  checkedAt: 0
})

async function ask (): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CLOUD_CHECK_MS)
  try {
    await fetch(`${cloudBaseUrl()}/v1/config`, { cache: 'no-store', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

let running: Promise<boolean> | null = null

export function checkCloudReachable (): Promise<boolean> {
  if (running) return running
  running = (async () => {
    try {
      reachState.reachable = await ask() || await ask()
    } finally {
      reachState.checked = true
      reachState.checkedAt = Date.now()
      running = null
    }
    return reachState.reachable
  })()
  return running
}

/**
 * Checks now, again when the browser regains a network, and when the tab is
 * shown or focused (once a minute at most). Returns a stop function.
 */
export function watchCloudReachable (): () => void {
  const again = () => { checkCloudReachable().catch(() => {}) }
  const onShown = () => {
    if (document.visibilityState === 'hidden') return
    if (Date.now() - reachState.checkedAt < CLOUD_RECHECK_MS) return
    again()
  }
  again()
  window.addEventListener('online', again)
  window.addEventListener('focus', onShown)
  document.addEventListener('visibilitychange', onShown)
  return () => {
    window.removeEventListener('online', again)
    window.removeEventListener('focus', onShown)
    document.removeEventListener('visibilitychange', onShown)
  }
}
