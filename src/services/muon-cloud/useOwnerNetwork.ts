import Vue from 'vue'
import { currentAccount, onAccountCleared } from './account-events'
import {
  getNetworkSettings,
  putNetworkSettings,
  networkErrorOf,
  type NetworkPath,
  type NetworkSettings,
  type NetworkSettingsChange,
  OwnerNetworkError
} from './ownerNetwork'

/**
 * Whether this printer exposes managed network routes, and their rules.
 *
 * Feature detection is one GET of `/muon-link/network/settings`. A 404 (an
 * older muon-link) or a legacy 403 `forbidden` means "show nothing
 * new": every card then behaves exactly as it did. One answer is shared by
 * every card, so the page asks once.
 */
export type OwnerNetworkStatus = 'unknown' | 'checking' | 'available' | 'unavailable'

interface State {
  generation: number;
  status: OwnerNetworkStatus;
  settings: NetworkSettings | null;
  /** Why it is unavailable, for a test or a log line; never shown. */
  reason: string | null;
}

const state = Vue.observable<State>({ generation: 0, status: 'unknown', settings: null, reason: null })
let context: unknown[] = []

function syncContext () {
  const client = Vue.$httpClient
  const next = [client, client?.defaults?.adapter, client?.defaults?.baseURL, currentAccount().id]
  if (next.some((value, index) => value !== context[index])) {
    context = next
    resetOwnerNetwork()
  }
}

let detecting: Promise<void> | null = null

function reset (): void {
  state.status = 'unknown'
  state.settings = null
  state.reason = null
}

/** Ask once. Cards call this when they find the printer is reached through muon-link. */
export function detectOwnerNetwork (force = false): Promise<void> {
  syncContext()
  const generation = state.generation
  if (detecting) return detecting
  if (!force && (state.status === 'available' || state.status === 'unavailable')) return Promise.resolve()
  // A refresh of an answer already in hand must not hide what it shows.
  if (state.status !== 'available') state.status = 'checking'
  detecting = getNetworkSettings()
    .then(settings => {
      syncContext()
      if (generation !== state.generation) return
      state.settings = settings
      state.status = 'available'
      state.reason = null
    })
    .catch((error: unknown) => {
      syncContext()
      if (generation !== state.generation) return
      const kind = networkErrorOf(error).kind
      // A hiccup (timeout, dropped link) on a refresh keeps the last good answer.
      if (state.status === 'available' && kind !== 'not_available' && kind !== 'not_owner') return
      state.settings = null
      state.status = 'unavailable'
      state.reason = kind
    })
    .finally(() => { if (generation === state.generation) detecting = null })
  return detecting
}

/** Forget the answer, e.g. when the printer connection changes. */
export function resetOwnerNetwork (): void {
  state.generation++
  detecting = null
  reset()
}

/** The owner changes a rule. Rejects with an OwnerNetworkError and leaves the rules as they were. */
export async function saveNetworkRules (change: NetworkSettingsChange): Promise<void> {
  syncContext()
  const generation = state.generation
  const settings = await putNetworkSettings(change)
  syncContext()
  if (generation !== state.generation) throw new OwnerNetworkError('failed', 'The printer connection changed. Try again.')
  state.settings = settings
}

onAccountCleared(resetOwnerNetwork)

export interface OwnerNetwork {
  readonly generation: number;
  readonly status: OwnerNetworkStatus;
  readonly available: boolean;
  readonly settings: NetworkSettings | null;
  readonly currentPath: NetworkPath | null;
  /** A restricted remote path cannot lift the rule that restricts it. */
  readonly rulesReadOnly: boolean;
}

export function useOwnerNetwork () {
  const view: OwnerNetwork = {
    get generation () { syncContext(); return state.generation },
    get status () { syncContext(); return state.status },
    get available () { syncContext(); return state.status === 'available' },
    get settings () { syncContext(); return state.settings },
    get currentPath () { syncContext(); return state.settings?.currentPath ?? null },
    get rulesReadOnly () {
      syncContext()
      const path = state.settings?.currentPath
      return (path === 'relay' || path === 'direct_wan') && state.settings?.fromRelay !== 'allow'
    }
  }
  return { network: view, detect: detectOwnerNetwork, reset: resetOwnerNetwork, save: saveNetworkRules }
}

export type { OwnerNetworkError }
