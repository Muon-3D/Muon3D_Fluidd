import Vue from 'vue'
import { missingFor, type PartsAction } from './parts'

/**
 * An action Control asked for that the printer says needs parts (KAN-6012).
 * The pop-up (SetupPartsDialog) shows while one is waiting here, and runs
 * `proceed` once the printer says nothing is missing any more.
 */
export interface PendingParts {
  action: PartsAction
  proceed: () => void
}

export const partsGate = Vue.observable({ pending: null as PendingParts | null })

/**
 * Whether `action` has to wait for parts. When the printer lists parts the
 * action needs, the pop-up opens, `proceed` is kept to run when the last part
 * is fitted, and true comes back (the caller does nothing now). A printer that
 * doesn't say (no `m1_machine`) never holds an action back.
 */
export function needParts (status: unknown, action: PartsAction, proceed: () => void): boolean {
  if (missingFor(status, action).length === 0) return false
  partsGate.pending = { action, proceed }
  return true
}

export function clearPending (): void {
  partsGate.pending = null
}
