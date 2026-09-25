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

/** What this tab alone knows. `screenFor` reads it next to the printer's state. */
export interface SetupLocal {
  /** Random per tab, kept in sessionStorage; the driver claim carries it. */
  clientId: string;
  /** This page drove setup at some point in this session (S8 versus S10). */
  droveSetup: boolean;
  /** "Change Wi-Fi" was chosen on a setup that is already complete. */
  changingWifi: boolean;
  /** Connect was pressed here and its result has not been acknowledged. */
  awaitingNetworkResult: boolean;
}

/** A write that got no answer: a timeout or a network error (05 §4). */
export interface LostWrite {
  step: StepId | null;
  /** The state that arrived next still showed the step pending with no op. */
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
  lostWrite: null as LostWrite | null,
  local: {
    clientId: typeof restoredLocal.clientId === 'string' ? restoredLocal.clientId : newClientId(),
    droveSetup: restoredLocal.droveSetup === true,
    changingWifi: false,
    awaitingNetworkResult: restoredLocal.awaitingNetworkResult === true
  } as SetupLocal
})

write(LOCAL_KEY, {
  clientId: setupState.local.clientId,
  droveSetup: setupState.local.droveSetup,
  awaitingNetworkResult: setupState.local.awaitingNetworkResult
})

/** Updates this tab's flags and keeps the ones that must survive a reload. */
export const setLocal = (patch: Partial<Omit<SetupLocal, 'clientId'>>) => {
  Object.assign(setupState.local, patch)
  write(LOCAL_KEY, {
    clientId: setupState.local.clientId,
    droveSetup: setupState.local.droveSetup,
    awaitingNetworkResult: setupState.local.awaitingNetworkResult
  })
}

const stepHasMovedOn = (state: SetupState, step: StepId | null) => {
  if (state.op) return true
  if (!step) return true
  return state.steps[step].status !== 'pending'
}

/**
 * Takes a state from the printer if it is not older than the one held.
 * Returns whether it was taken. The printer is the only source of truth, so
 * nothing local is ever replayed over it (01 §5).
 */
export const applyState = (next: SetupState | null | undefined): boolean => {
  if (!next || typeof next !== 'object' || typeof next.rev !== 'number') return false
  const current = setupState.state
  if (current && next.rev < current.rev) return false
  setupState.state = next

  // A lost write is settled by the next state: the step moved on or an op
  // started, so it arrived; or it did not, and the page says so.
  const lost = setupState.lostWrite
  if (lost && !lost.failed) {
    if (stepHasMovedOn(next, lost.step)) {
      setupState.lostWrite = null
    } else {
      setupState.lostWrite = { ...lost, failed: true }
    }
  }
  return true
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
