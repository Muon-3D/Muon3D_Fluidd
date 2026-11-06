import consola from 'consola'
import { currentPrinterAccess } from '@/services/muon-access/api'
import { refreshDevMode } from '@/services/dev-mode/state'
import { activeSlug } from '@/services/printer-pages'
import { gateState, keep } from './state'

export { MUON_COMPONENTS, muonFromComponents } from './components'
export { gateState, resetGates, valueFor } from './state'

/**
 * Shared gates for Settings pages. They only read what Control already
 * knows; they decide nothing the printer does not also enforce.
 *
 * Every answer belongs to the printer it was asked of. A reply is kept only
 * if no reset happened and the active printer is still the one asked.
 */

function stale (epoch: number, key: string): boolean {
  return gateState.epoch !== epoch || activeSlug() !== key
}

/**
 * Whether this client may manage access on the active printer: the printer
 * reports `protection: allowed`. A refusal (403), a server error, a
 * timeout, or no muon_access leaves it unknown, and unknown is never shown
 * as permitted.
 *
 * Not "is the account owner": the printer also allows it to any admin, to
 * the panel, to local addresses and to gateway callers with no level.
 */
export async function refreshCanManageAccess (): Promise<void> {
  const key = activeSlug()
  if (key === null || gateState.checking.manage) return
  const epoch = gateState.epoch
  gateState.checking.manage = true
  try {
    const actions = await currentPrinterAccess().capabilities()
    if (stale(epoch, key)) return
    keep('manage', key, actions.protection === 'allowed')
  } catch (err) {
    consola.debug('Access management is not known on this printer:', err)
    if (!stale(epoch, key)) keep('manage', key, null)
  } finally {
    if (gateState.epoch === epoch) {
      gateState.checking.manage = false
      // The printer changed while asking (a learned identity, a late cloud
      // slug): the reply was dropped, so ask the new one.
      if (activeSlug() !== key) refreshCanManageAccess()
    }
  }
}

/**
 * Developer mode on the active printer, from this request's own answer. The
 * shared devModeState is one global that keeps another printer's value, so
 * it is neither read nor cleared here.
 */
export async function refreshGateDevMode (): Promise<void> {
  const key = activeSlug()
  if (key === null || gateState.checking.dev) return
  const epoch = gateState.epoch
  gateState.checking.dev = true
  try {
    // This request's own answer, never the shared devModeState, which keeps
    // another printer's value and a late reply from it.
    const enabled = await refreshDevMode()
    if (stale(epoch, key)) return
    keep('dev', key, enabled)
  } finally {
    if (gateState.epoch === epoch) {
      gateState.checking.dev = false
      if (activeSlug() !== key) refreshGateDevMode()
    }
  }
}
