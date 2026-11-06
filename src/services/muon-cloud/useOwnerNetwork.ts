import Vue from 'vue'
import {
  getNetworkSettings,
  putNetworkSettings,
  networkErrorOf,
  type NetworkPath,
  type NetworkSettings,
  type NetworkSettingsChange,
  type OwnerNetworkError
} from './ownerNetwork'

/**
 * Whether this session can use the owner's network routes, and their rules.
 *
 * Feature detection is one GET of `/muon-link/network/settings`. A 404 (an
 * older muon-link) or a 403 `forbidden` (not the owner) means "show nothing
 * new": every card then behaves exactly as it did. One answer is shared by
 * every card, so the page asks once.
 */
export type OwnerNetworkStatus = 'unknown' | 'checking' | 'available' | 'unavailable'

interface State {
  status: OwnerNetworkStatus;
  settings: NetworkSettings | null;
  /** Why it is unavailable, for a test or a log line; never shown. */
  reason: string | null;
}

const state = Vue.observable<State>({ status: 'unknown', settings: null, reason: null })

let detecting: Promise<void> | null = null

function reset (): void {
  state.status = 'unknown'
  state.settings = null
  state.reason = null
}

/** Ask once. Cards call this when they find the printer is reached through muon-link. */
export function detectOwnerNetwork (force = false): Promise<void> {
  if (detecting) return detecting
  if (!force && (state.status === 'available' || state.status === 'unavailable')) return Promise.resolve()
  // A refresh of an answer already in hand must not hide what it shows.
  if (state.status !== 'available') state.status = 'checking'
  detecting = getNetworkSettings()
    .then(settings => {
      state.settings = settings
      state.status = 'available'
      state.reason = null
    })
    .catch((error: unknown) => {
      const kind = networkErrorOf(error).kind
      // A hiccup (timeout, dropped link) on a refresh keeps the last good answer.
      if (state.status === 'available' && kind !== 'not_available' && kind !== 'not_owner') return
      state.settings = null
      state.status = 'unavailable'
      state.reason = kind
    })
    .finally(() => { detecting = null })
  return detecting
}

/** Forget the answer, e.g. when the printer connection changes. */
export function resetOwnerNetwork (): void {
  detecting = null
  reset()
}

/** The owner changes a rule. Rejects with an OwnerNetworkError and leaves the rules as they were. */
export async function saveNetworkRules (change: NetworkSettingsChange): Promise<void> {
  state.settings = await putNetworkSettings(change)
}

export interface OwnerNetwork {
  readonly status: OwnerNetworkStatus;
  readonly available: boolean;
  readonly settings: NetworkSettings | null;
  readonly currentPath: NetworkPath | null;
  /** Remote sessions may not loosen their own rule: muon-link refuses the PUT. */
  readonly rulesReadOnly: boolean;
}

export function useOwnerNetwork () {
  const view: OwnerNetwork = {
    get status () { return state.status },
    get available () { return state.status === 'available' },
    get settings () { return state.settings },
    get currentPath () { return state.settings?.currentPath ?? null },
    get rulesReadOnly () {
      const path = state.settings?.currentPath
      return path === 'relay' || path === 'direct_wan'
    }
  }
  return { network: view, detect: detectOwnerNetwork, reset: resetOwnerNetwork, save: saveNetworkRules }
}

export type { OwnerNetworkError }
