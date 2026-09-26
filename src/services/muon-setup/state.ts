/**
 * What the `/setup` page knows: the printer's latest setup state, whether it
 * can hear the printer, and the little it keeps for itself in this tab.
 *
 * Kept outside Vuex, like the Muon3D account in `muon-cloud/state.ts`: the
 * setup page never runs Fluidd's init, and the dashboard card reads the same
 * state through the main socket.
 */
import Vue from 'vue'
import type { Security, SetupState, StepId } from './types'

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting'

/** Only what may be restored after a captive window reloads. Never a password. */
export interface SetupDraft {
  ssid?: string;
  security?: Security;
  identity?: string;
}

/**
 * What this tab alone knows. `screenFor` reads it next to the printer's state,
 * and all of it survives a captive-window reload (05 §4).
 */
export interface SetupLocal {
  /** Random per tab; the driver claim carries it. */
  clientId: string;
  /** This page drove setup at some point in this session (S8 versus S10). */
  droveSetup: boolean;
  /** "Change Wi-Fi" was chosen on a setup that is already complete. */
  changingWifi: boolean;
  /**
   * The `rev` of the state held when this tab posted Connect, until the owner
   * acknowledges the result (05 §5 rule 5). Null when no join is this tab's.
   */
  joinRev: number | null;
}

/** A write that got no answer: a timeout or a network error (05 §4). */
export interface LostWrite {
  step: StepId | null;
  /** The state that arrived next still showed the step untouched. */
  failed: boolean;
}

const DRAFT_KEY = 'muon.setup.draft'
const LOCAL_KEY = 'muon.setup.local'

const storage = (): Storage | null => {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

const read = <T>(key: string): Partial<T> => {
  try {
    const raw = storage()?.getItem(key)
    const value = raw ? JSON.parse(raw) : null
    return value && typeof value === 'object' ? value as Partial<T> : {}
  } catch {
    return {}
  }
}

const write = (key: string, value: unknown) => {
  try {
    storage()?.setItem(key, JSON.stringify(value))
  } catch { /* no storage, or full: the draft is a convenience */ }
}

/**
 * A v4 UUID. `crypto.randomUUID` exists only in secure contexts, and the
 * hotspot page is plain http://10.42.0.1, so it is built from
 * `getRandomValues`, which works everywhere.
 */
export const newClientId = (): string => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const restoredLocal = read<SetupLocal>(LOCAL_KEY)

export const setupState = Vue.observable({
  state: null as SetupState | null,
  connection: 'connecting' as ConnectionStatus,
  /** When the page last lost the printer, or null while it can hear it. */
  disconnectedSince: null as number | null,
  /**
   * The printer answered, but has no `muon_setup` (its setup GET said 404):
   * firmware from before the setup flow. The page can't set it up.
   */
  unavailable: false,
  lostWrite: null as LostWrite | null,
  local: {
    clientId: typeof restoredLocal.clientId === 'string' ? restoredLocal.clientId : newClientId(),
    droveSetup: restoredLocal.droveSetup === true,
    changingWifi: restoredLocal.changingWifi === true,
    joinRev: typeof restoredLocal.joinRev === 'number' ? restoredLocal.joinRev : null
  } as SetupLocal
})

const saveLocal = () => write(LOCAL_KEY, { ...setupState.local })
saveLocal()

/** Updates this tab's flags, and keeps them for a reload. */
export const setLocal = (patch: Partial<Omit<SetupLocal, 'clientId'>>) => {
  Object.assign(setupState.local, patch)
  saveLocal()
}

/** Whether a lost write evidently arrived: the step moved on, or an op started. */
const writeArrived = (state: SetupState, step: StepId | null) => {
  if (state.op || !step) return true
  if (step === 'network') {
    // A join that finished leaves the step pending in a picker market until
    // the region is confirmed, so an address or an error is what shows it.
    const network = state.steps.network
    if (network.addresses.length > 0 || network.error || network.region_error) return true
  }
  return state.steps[step].status !== 'pending'
}

/**
 * Takes a state from the printer. A notification or a write result is taken
 * only if its `rev` is not older than the one held; a `GET` result replaces
 * the held state whatever its `rev` (02 §6), which is how a printer that was
 * reset, or a different printer, gets through. Nothing local is ever replayed
 * over it (01 §5). Returns whether it was taken.
 */
export const applyState = (next: SetupState | null | undefined, opts: { fromGet?: boolean } = {}): boolean => {
  if (!next || typeof next !== 'object' || typeof next.rev !== 'number') return false
  const current = setupState.state
  if (!opts.fromGet && current && next.rev < current.rev) return false
  setupState.state = next
  setupState.unavailable = false

  // A lost write is settled by the next state: it arrived, or the page says
  // "That didn't reach Walnut".
  const lost = setupState.lostWrite
  if (lost && !lost.failed) {
    setupState.lostWrite = writeArrived(next, lost.step) ? null : { ...lost, failed: true }
  }
  return true
}

/** Forgets the held state, as when Fluidd switches to another printer. */
export const resetSetupState = () => {
  setupState.state = null
  setupState.lostWrite = null
  setupState.unavailable = false
}

export const setConnection = (status: ConnectionStatus, now = Date.now()) => {
  if (status === 'connected') {
    setupState.disconnectedSince = null
  } else if (setupState.connection === 'connected' || setupState.disconnectedSince === null) {
    setupState.disconnectedSince = now
  }
  setupState.connection = status
}

export const loadDraft = (): SetupDraft => {
  const value = read<SetupDraft>(DRAFT_KEY)
  return {
    ...(typeof value.ssid === 'string' ? { ssid: value.ssid } : {}),
    ...(typeof value.security === 'string' ? { security: value.security } : {}),
    ...(typeof value.identity === 'string' ? { identity: value.identity } : {})
  }
}

/**
 * Keeps the SSID, the security type and the Enterprise identity, and only
 * those: fields are copied one by one, so a password passed in by mistake is
 * dropped rather than stored.
 */
export const saveDraft = (draft: SetupDraft) => {
  write(DRAFT_KEY, {
    ...(draft.ssid !== undefined ? { ssid: draft.ssid } : {}),
    ...(draft.security !== undefined ? { security: draft.security } : {}),
    ...(draft.identity !== undefined ? { identity: draft.identity } : {})
  })
}

export const clearDraft = () => {
  try {
    storage()?.removeItem(DRAFT_KEY)
  } catch { /* nothing to clear */ }
}
