import type { MutationTree } from 'vuex'
import type { ProtectionState, ProtectionStatus } from './types'
import { defaultState } from './state'

export const mutations: MutationTree<ProtectionState> = {
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setSupported (state, payload: boolean) {
    state.supported = payload
  },

  setStatus (state, payload: ProtectionStatus | null) {
    state.status = payload
  }
}
