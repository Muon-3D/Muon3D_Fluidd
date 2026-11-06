import Vue from 'vue'
import consola from 'consola'
import { currentPrinterAccess } from '@/services/muon-access/api'

/**
 * Shared gates for Settings pages. They only read what Control already
 * knows; they decide nothing the printer does not also enforce.
 */

export { MUON_COMPONENTS, hasMuonComponents } from './components'

export interface OwnerState {
  /** null while unknown: not asked yet, no access component, or the printer didn't answer. */
  isOwner: boolean | null;
  checking: boolean;
}

export const ownerState: OwnerState = Vue.observable({ isOwner: null, checking: false })

/**
 * Whether this browser is the printer's owner. It is the same test the
 * Access settings use for "Only the owner can change this": the printer
 * allows this client to change who can use it (`protection: 'allowed'`).
 * 'ask' (a request at the panel) is not ownership.
 */
export async function refreshOwner (): Promise<void> {
  ownerState.checking = true
  try {
    const actions = await currentPrinterAccess().capabilities()
    ownerState.isOwner = actions.protection === 'allowed'
  } catch (err) {
    consola.debug('Owner is not known on this printer:', err)
    ownerState.isOwner = null
  } finally {
    ownerState.checking = false
  }
}

/** Forgets the answer, e.g. when the active printer changes. */
export function resetOwner (): void {
  ownerState.isOwner = null
  ownerState.checking = false
}
