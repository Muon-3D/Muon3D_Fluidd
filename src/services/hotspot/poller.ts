import consola from 'consola'
import store from '@/store'
import { cloudState } from '@/services/muon-cloud/state'
import { useAuxApi } from '@/aux_api/useAuxApi'
import { hotspotState, normalizeStations } from './model'

/**
 * One light poll of the printer's hotspot stations (KAN-4297). The panel never
 * takes printer compute, so it is one small GET about every 10 s, paused while
 * the page is hidden, and slowed to a minute when the printer has no such
 * route. Anything that shows the count starts it and stops it when it goes.
 */
export const POLL_MS = 10_000
export const MISSING_POLL_MS = 60_000

let users = 0
let timer: ReturnType<typeof setTimeout> | null = null
let inFlight = false
let slow = false
let key = ''

const visible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
const printerKey = () => `${store.state.config?.apiUrl ?? ''}|${cloudState.activePrinterId ?? ''}`

/** Fetch once. Resolves when the shared state is updated. Exported for tests. */
export async function pollHotspotOnce (): Promise<void> {
  if (inFlight) return
  inFlight = true
  const asked = printerKey()
  if (asked !== key) {
    key = asked
    hotspotState.stations = null
    slow = false
  }
  try {
    const response = await useAuxApi().apStations()
    if (asked !== printerKey()) return
    hotspotState.stations = normalizeStations(response.data)
    slow = hotspotState.stations === null
  } catch (e) {
    if (asked !== printerKey()) return
    const status = (e as { response?: { status?: number } })?.response?.status
    if (status === 404 || status === 403 || (e as Error)?.name === 'RemoteAuxRefused') {
      // This printer or route has no such answer: show nothing.
      hotspotState.stations = null
      slow = true
    } else {
      consola.debug('[hotspot] stations poll failed, keeping the last answer', e)
    }
  } finally {
    inFlight = false
  }
}

function schedule () {
  if (timer !== null) clearTimeout(timer)
  timer = null
  if (users === 0 || !visible()) return
  timer = setTimeout(async () => {
    timer = null
    await pollHotspotOnce()
    schedule()
  }, slow ? MISSING_POLL_MS : POLL_MS)
}

function onVisibility () {
  if (users === 0) return
  if (!visible()) {
    if (timer !== null) clearTimeout(timer)
    timer = null
    return
  }
  // Back on screen: ask now, then carry on.
  pollHotspotOnce().then(schedule)
}

/** Start polling; returns the stop function. Several callers share one poll. */
export function startHotspotPoll (): () => void {
  users++
  if (users === 1) {
    document.addEventListener('visibilitychange', onVisibility)
    if (visible()) pollHotspotOnce().then(schedule)
  }
  let stopped = false
  return () => {
    if (stopped) return
    stopped = true
    users--
    if (users === 0) {
      document.removeEventListener('visibilitychange', onVisibility)
      if (timer !== null) clearTimeout(timer)
      timer = null
    }
  }
}
