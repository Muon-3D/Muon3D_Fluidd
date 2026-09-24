import type { Module } from 'vuex'
import { state } from './state'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import type { ProtectionState } from './types'
import type { RootState } from '../types'

const namespaced = true

export const protection: Module<ProtectionState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
