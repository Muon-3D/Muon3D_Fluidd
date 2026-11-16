import Vue from 'vue'
import { ACTIVE_PHASES, DEFAULT_BUDGET_MS, expired, lost, outcome, remember, type AuxUpdateStatus, type Remembered } from './model'
import { recordOutcome, type HistoryOutcome } from './history'

/**
 * Fluidd's eye on the printer's own update: its Aux /update/status, read
 * every minute (every 5 s while an install is under way), and the install
 * it last saw under way, kept per printer in this browser so it outlives a
 * reload. When the printer goes quiet mid-install, `lostAt` is set and the
 * Updating screen takes the place of "can't reach" (model.ts offlineScreen).
 *
 * In this bundle's main chunk, not a lazy one: during the restart the
 * printer can't serve a chunk, and on plain HTTP there is no service worker
 * to serve it either.
 */
export const updateWatch = Vue.observable({
  status: null as AuxUpdateStatus | null,
  remembered: null as Remembered | null,
  /** The printer these are for (its address name). */
  printer: '',
  /** The printer has answered (any answer) since this page loaded: what the browser kept is believed only after that. */
  answered: false,
  /** Ticks while an install is under way, so the screens can say when the restart is taking long. */
  now: Date.now()
})

type Get = (url: string) => Promise<{ status?: number, data?: unknown }>

const storageKey = (printer: string) => `muon3d.update.${printer}`

function save () {
  try {
    const key = storageKey(updateWatch.printer)
    if (updateWatch.remembered) localStorage.setItem(key, JSON.stringify(updateWatch.remembered))
    else localStorage.removeItem(key)
  } catch { /* private window: it lasts until the tab closes */ }
}

/**
 * What this browser remembered of the printer's install. Kept even past its
 * time: a tab discarded mid-install must still hear how it ended (updated, or
 * rolled back), and the first answer from the printer decides. Until it
 * answers, the bar and the restart screen hold back (model.ts bannerVisible,
 * offlineScreen).
 */
function load (printer: string): Remembered | null {
  try {
    const raw = localStorage.getItem(storageKey(printer))
    const r = raw ? JSON.parse(raw) as Remembered : null
    // "Lost" was about the page that wrote it: in this one the printer has not yet gone quiet.
    return r ? { ...r, lostAt: null } : null
  } catch {
    return null
  }
}

let timer: ReturnType<typeof setTimeout> | null = null
let ticker: ReturnType<typeof setInterval> | null = null
let get: Get | null = null
let generation = 0
/**
 * The session was refused the route (401/403: over a cloud session, policy
 * doesn't let every role read it). Asking again changes nothing, so the
 * watch stays quiet until it is started afresh: a reconnect, another
 * printer, or an install the user just asked for.
 */
let refused = false
/**
 * A refusal right after a reconnect may only be an identity that is not ready
 * yet (the printer has just restarted): it is asked once more shortly, and
 * only that once, so a printer that does refuse is still not hammered.
 */
let retryDenied = false
const RETRY_DENIED_MS = 10 * 1000

/** Under way and within its time: a stale entry that nothing can confirm (a refused route) does not poll fast for ever. */
const active = () => !!updateWatch.remembered && ACTIVE_PHASES.includes(updateWatch.remembered.phase) && !expired(updateWatch.remembered, Date.now())

const hasActiveEntry = () => !!updateWatch.remembered && ACTIVE_PHASES.includes(updateWatch.remembered.phase)

function stopTicker () {
  if (ticker) clearInterval(ticker)
  ticker = null
}

/**
 * Keeps `now` moving while an install is remembered, so its time can run out (the bar and the
 * restart screen read it). While the route is refused it makes no requests, and an entry that
 * has run out is dropped, since nothing can confirm it any more.
 */
function startTicker () {
  if (ticker) return
  ticker = setInterval(() => {
    updateWatch.now = Date.now()
    if (refused && expired(updateWatch.remembered, updateWatch.now)) {
      updateWatch.remembered = null
      save()
      stopTicker()
    }
  }, 5000)
}

function schedule (delay?: number) {
  if (timer) clearTimeout(timer)
  timer = null
  if (refused) {
    if (hasActiveEntry()) startTicker()
    else stopTicker()
    return
  }
  timer = setTimeout(() => { poll() }, delay ?? (active() ? 5000 : 60000))
  if (active()) startTicker()
  else stopTicker()
}

/** Reads the printer's update status now. A refusal (network protection, over Iroh) shows nothing and stops the polling. */
export async function poll (): Promise<void> {
  if (!get) return
  const mine = generation
  try {
    const answer = await get('/server/aux/update/status')
    if (mine !== generation) return
    const denied = answer.status === 401 || answer.status === 403
    if (denied && retryDenied) {
      retryDenied = false
      refused = false
      updateWatch.now = Date.now()
      schedule(RETRY_DENIED_MS)
      return
    }
    refused = denied
    // A refusal confirms nothing: what was believed before the restart is not believed now.
    if (denied) updateWatch.answered = false
    if (denied && expired(updateWatch.remembered, Date.now())) {
      // Nothing can confirm it any more: a stale entry does not wait for ever on a refused route.
      updateWatch.remembered = null
      save()
    }
    const data = answer.data as Record<string, unknown> | undefined
    const status = (data && typeof data === 'object' && 'result' in data ? data.result : data) as AuxUpdateStatus | undefined
    if (answer.status === 200 && status && typeof status === 'object') {
      updateWatch.answered = true
      updateWatch.status = status
      const before = updateWatch.remembered
      updateWatch.remembered = remember(before, status, Date.now())
      const ended = updateWatch.remembered?.phase
      if (before && ACTIVE_PHASES.includes(before.phase) && (ended === 'updated' || ended === 'rolled_back' || ended === 'failed')) {
        recordOutcome(updateWatch.printer, { version: updateWatch.remembered?.to ?? null, outcome: ended as HistoryOutcome, at: Date.now() })
      }
      save()
    }
  } catch { /* the next poll tries again */ }
  if (mine !== generation) return
  updateWatch.now = Date.now()
  schedule()
}

/** Starts watching `printer`, with Fluidd's own HTTP client. */
export function watchUpdates (printer: string, http: Get, managed = false) {
  stopWatching()
  if (managed) {
    updateWatch.printer = printer
    updateWatch.status = null
    updateWatch.answered = false
    updateWatch.remembered = null
    return
  }
  get = http
  refused = false
  retryDenied = true
  if (printer !== updateWatch.printer) {
    updateWatch.printer = printer
    updateWatch.status = null
    updateWatch.answered = false
    updateWatch.remembered = load(printer)
  }
  // The printer has just been reached (a load, a reconnect, after a restart): its first answers are not yet to be believed.
  if (updateWatch.remembered) updateWatch.remembered = { ...updateWatch.remembered, reconnectedAt: Date.now() }
  poll()
}

/** The printer stopped answering: remember when, if an install was under way. */
export function printerLost () {
  // An entry the printer has not confirmed in this page (never answered, or refused) is not "lost".
  if (!updateWatch.answered) return
  updateWatch.remembered = lost(updateWatch.remembered, Date.now())
  updateWatch.now = Date.now()
  save()
  schedule()
}

/** An install was just asked for: follow it closely from now. */
export function installStarted (from: string | null, to: string | null) {
  updateWatch.remembered = {
    jobId: null,
    phase: 'preparing',
    from,
    to,
    progress: null,
    seenAt: Date.now(),
    lostAt: null,
    budgetMs: updateWatch.remembered?.budgetMs ?? DEFAULT_BUDGET_MS,
    startedAt: Date.now(),
    reconnectedAt: null,
    startedJobId: updateWatch.status?.install?.job_id ?? null
  }
  save()
  refused = false
  poll()
}

/** How the followed install ended, once the printer is back. */
export function currentOutcome () {
  return outcome(updateWatch.remembered, updateWatch.status)
}

/** The outcome has been shown: forget the install. */
export function forgetInstall () {
  updateWatch.remembered = null
  save()
  schedule()
}

export function stopWatching () {
  ++generation
  get = null
  if (timer) clearTimeout(timer)
  if (ticker) clearInterval(ticker)
  timer = null
  ticker = null
}
