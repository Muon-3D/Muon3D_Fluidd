import type { ActionTree } from 'vuex'
import type { HistoryItem, HistoryState } from './types'
import type { RootState } from '../types'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import { YEAR_LIMIT, dayKey, yearSince } from '@/services/history/year'

const YEAR_TIMEOUT_MS = 15_000

export const actions: ActionTree<HistoryState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  /**
   * Inits moonraker component
   */
  async init () {
    // Get the last 50 history items.
    SocketActions.serverHistoryList({ limit: Globals.JOB_HISTORY_LOAD })

    // Load the known totals.
    SocketActions.serverHistoryTotals()
  },

  async updateHistory ({ commit }, payload) {
    if (payload) {
      commit('setUpdateHistory', payload)
    }
  },

  async clearHistoryThumbnails ({ commit }, payload) {
    if (payload) {
      commit('setClearHistoryThumbnails', payload)
    }
  },

  /**
   * Update the store with history totals data
   */
  async onHistoryTotals ({ commit }, payload) {
    if (payload) {
      commit('setHistoryTotals', payload)
    }
  },

  /**
   * Update the store with history
   */
  async onHistoryList ({ commit }, payload) {
    if (payload) {
      commit('setHistoryList', payload)
    }
  },

  /**
   * Ask for the last year of jobs (the year grid), once per day per store
   * lifetime: not again on every visit or reconnect. `force` asks again (Retry,
   * or a print finished) and keeps showing what is there meanwhile. A request
   * with no answer in 15 seconds is a failed one.
   */
  async loadYear ({ commit, state }, options?: { force?: boolean }) {
    const today = dayKey(new Date())
    if (state.yearStatus === 'loading') return
    if (!options?.force && state.yearStatus === 'ready' && state.yearDay === today) return
    if (state.yearStatus !== 'ready') commit('setYearStatus', 'loading')
    SocketActions.serverHistoryYear(yearSince(new Date()), YEAR_LIMIT)
    setTimeout(() => {
      if (state.yearStatus === 'loading') commit('setYearStatus', 'error')
    }, YEAR_TIMEOUT_MS)
  },

  /**
   * Update the store with the last year of history (the year grid).
   */
  async onYearList ({ commit }, payload) {
    if (payload) {
      commit('setYearJobs', payload)
    }
  },

  /**
   * History has changed, update the data.
   */
  async onHistoryChange ({ commit, dispatch, state }, payload: { action: string; job: HistoryItem }) {
    SocketActions.serverHistoryTotals()
    if (
      payload
    ) {
      if (payload.action === 'added') commit('setAddHistory', payload.job)
      if (payload.action === 'finished') {
        commit('setUpdateHistory', payload.job)
        // A year on screen is a day more right now: ask again, never poll.
        if (state.yearStatus === 'ready') dispatch('loadYear', { force: true })
      }
    }
  },

  async onDelete ({ commit }, payload) {
    commit('setDeleteJob', payload.deleted_jobs)
  }
}
