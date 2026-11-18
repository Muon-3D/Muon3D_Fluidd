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

/** After this many failures in a row the last count is no longer believable: show nothing. */
export const MAX_FAILURES = 3

let users = 0
let timer: ReturnType<typeof setTimeout> | null = null
let inFlight = false
let slow = false
let failures = 0
let generation = 0
let unwatch: (() => void) | null = null

const visible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
const connected = () => store.getters['socket/getConnectionState'] === true
const printerKey = () => `${store.state.config?.apiUrl ?? ''}|${cloudState.activePrinterId ?? ''}`

function forget () {
  hotspotState.stations = null
  slow = false
  failures = 0
}

function clearTimer () {
  if (timer !== null) clearTimeout(timer)
  timer = null
}

/** Fetch once. Resolves when the shared state is updated. Exported for tests. */
export async function pollHotspotOnce (): Promise<void> {
  if (!connected()) {
    // No printer on the line: nothing to ask, and nothing true to show.
    forget()
    return
  }
  if (inFlight) return
  inFlight = true
  const gen = generation
  try {
    const response = await useAuxApi().apStations()
    if (gen !== generation) return
    hotspotState.stations = normalizeStations(response.data)
    slow = hotspotState.stations === null
    failures = 0
  } catch (e) {
    if (gen !== generation) return
    const status = (e as { response?: { status?: number } })?.response?.status
    if (status === 404 || status === 403 || (e as Error)?.name === 'RemoteAuxRefused') {
      // This printer or route has no such answer: show nothing.
      hotspotState.stations = null
      slow = true
      failures = 0
    } else {
      failures++
      if (failures >= MAX_FAILURES) {
        hotspotState.stations = null
      } else {
        consola.debug('[hotspot] stations poll failed, keeping the last answer', e)
      }
    }
  } finally {
    if (gen === generation) inFlight = false
  }
}

function schedule () {
  clearTimer()
  if (users === 0 || !visible() || !connected()) return
  timer = setTimeout(async () => {
    timer = null
    await pollHotspotOnce()
    schedule()
  }, slow ? MISSING_POLL_MS : POLL_MS)
}

function onVisibility () {
  if (users === 0) return
  if (!visible()) {
    clearTimer()
    return
  }
  // Back on screen: ask now, then carry on.
  pollHotspotOnce().then(schedule)
}

/** The printer switched or the connection came or went: drop the old answer, then ask again at once. */
function onLineChanged () {
  generation++
  inFlight = false
  clearTimer()
  forget()
  if (users === 0 || !visible() || !connected()) return
  pollHotspotOnce().then(schedule)
}

/** Start polling; returns the stop function. Several callers share one poll. */
export function startHotspotPoll (): () => void {
  users++
  if (users === 1) {
    document.addEventListener('visibilitychange', onVisibility)
    unwatch = store.watch(() => `${connected()}|${printerKey()}`, onLineChanged)
    if (visible()) pollHotspotOnce().then(schedule)
  }
  let stopped = false
  return () => {
    if (stopped) return
    stopped = true
    users--
    if (users === 0) {
      document.removeEventListener('visibilitychange', onVisibility)
      if (unwatch) unwatch()
      unwatch = null
      clearTimer()
    }
  }
}
