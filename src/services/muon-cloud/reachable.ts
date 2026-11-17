/**
 * Whether the Muon3D service can be reached from here. On a printer's own
 * hotspot the browser reports "online" with no internet behind it, so
 * `navigator.onLine` is no answer: ask the service itself, briefly. Any HTTP
 * answer, even an error status, means it is reachable.
 */
import Vue from 'vue'
import { cloudBaseUrl } from './api'

export const CLOUD_CHECK_MS = 4000

export const reachState = Vue.observable({
  /** Optimistic until a check says otherwise, so a slow check never hides a working button. */
  reachable: true,
  checked: false
})

let running: Promise<boolean> | null = null

export function checkCloudReachable (): Promise<boolean> {
  if (running) return running
  running = (async () => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), CLOUD_CHECK_MS)
    try {
      await fetch(`${cloudBaseUrl()}/v1/config`, { cache: 'no-store', signal: controller.signal })
      reachState.reachable = true
    } catch {
      reachState.reachable = false
    } finally {
      clearTimeout(timer)
      reachState.checked = true
      running = null
    }
    return reachState.reachable
  })()
  return running
}

/** Checks now, and again whenever the browser regains a network. Returns a stop function. */
export function watchCloudReachable (): () => void {
  const again = () => { checkCloudReachable().catch(() => {}) }
  again()
  window.addEventListener('online', again)
  return () => window.removeEventListener('online', again)
}
