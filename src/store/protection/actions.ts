import type { ActionTree } from 'vuex'
import type { ProtectionState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { parseProtectionStatus } from './helpers'

export const actions: ActionTree<ProtectionState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Moonraker lists `muon_protection` among its components. Ask for the level
   * as this browser sees it; `caller_has_identity` is per connection, which is
   * why a change notification is answered by asking again rather than by
   * trusting the level it carries.
   */
  async init ({ commit }) {
    commit('setSupported', true)
    SocketActions.serverMuonGetProtection()
  },

  async onStatus ({ commit, dispatch, getters, rootGetters }, payload) {
    const wasLocked: boolean = getters.isLocked
    commit('setStatus', parseProtectionStatus(payload))

    // The update panel's first request was refused while this browser was
    // locked out. Ask again now that it will be answered.
    if (wasLocked && !getters.isLocked && rootGetters['server/componentSupport']('update_manager')) {
      dispatch('version/init', undefined, { root: true })
    }
  },

  /**
   * Moonraker refused a protected call. That is the first sign the level may
   * have changed, so ask what it is now rather than keep offering a control
   * that will be refused again.
   */
  async onRefused ({ dispatch, state }) {
    if (state.supported) dispatch('init')
  }
}
