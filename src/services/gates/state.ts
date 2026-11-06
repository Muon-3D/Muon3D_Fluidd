import Vue from 'vue'

/**
 * What the gates know, for ONE printer at a time. It is kept apart from
 * every service that talks to a printer so the socket and init code can
 * reset it without importing them.
 *
 * `key` names the printer the answers belong to. A reader asks `valueFor`
 * with the printer it is showing now, and gets an answer only when the key
 * matches, so one printer's answer never reads as another's. `epoch`
 * counts resets: a reply that started in an earlier epoch is stale and is
 * dropped.
 */
export interface GateState {
  epoch: number;
  key: string | null;
  /** Whether this client may manage access (protection: allowed), once asked. */
  manage: boolean | null;
  /** Developer mode on this printer, once asked. */
  dev: boolean | null;
  checking: { manage: boolean, dev: boolean };
}

export const gateState: GateState = Vue.observable({
  epoch: 0,
  key: null,
  manage: null,
  dev: null,
  checking: { manage: false, dev: false }
})

/**
 * Forgets everything. Called centrally on app init (which a printer switch
 * runs), and whenever the socket closes, so a reconnect asks again.
 */
export function resetGates (): void {
  gateState.epoch++
  gateState.key = null
  gateState.manage = null
  gateState.dev = null
  gateState.checking.manage = false
  gateState.checking.dev = false
}

/** An answer held for `key`, or null (unknown) if it is another printer's. */
export function valueFor (field: 'manage' | 'dev', key: string | null): boolean | null {
  return key !== null && gateState.key === key ? gateState[field] : null
}

/** Stores an answer for `key`, dropping the other printer's first. */
export function keep (field: 'manage' | 'dev', key: string, value: boolean | null): void {
  if (gateState.key !== key) {
    gateState.key = key
    gateState.manage = null
    gateState.dev = null
  }
  gateState[field] = value
}
