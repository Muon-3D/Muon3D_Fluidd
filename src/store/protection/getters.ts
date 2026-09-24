import type { GetterTree } from 'vuex'
import type { ProtectionState } from './types'
import type { RootState } from '../types'
import { LEVEL_PROTECTED } from './types'
import { isLockedPath } from './helpers'

export const getters: GetterTree<ProtectionState, RootState> = {
  /**
   * Protection is on, whoever is asking.
   */
  isProtected: (state): boolean => {
    return state.status?.level === LEVEL_PROTECTED
  },

  /**
   * Protection is on and this browser has no identity, so Wi-Fi, the Aux API
   * and updates will refuse it. A paired device is not locked.
   */
  isLocked: (state): boolean => {
    return state.status?.level === LEVEL_PROTECTED && !state.status.callerHasIdentity
  },

  isLockedPath: (state) => (path: string): boolean => {
    return isLockedPath(state.status, path)
  }
}
