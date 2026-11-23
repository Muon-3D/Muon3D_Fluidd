import Vue from 'vue'
import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import { dayKey } from '@/services/history/year'
import type { HistoryItem, HistoryState } from './types'

export const mutations: MutationTree<HistoryState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Applies currently known history totals
   */
  setHistoryTotals (state, payload: HistoryState) {
    if (payload) Vue.set(state, 'job_totals', payload.job_totals)
  },

  /**
   * Applies history list
   */
  setHistoryList (state, payload: HistoryState) {
    if (payload.jobs !== undefined) Vue.set(state, 'jobs', payload.jobs)
    if (payload.count !== undefined) Vue.set(state, 'count', payload.count)
  },

  /**
   * Applies the last year of jobs (the year grid), apart from the list.
   */
  setYearJobs (state, payload: { jobs?: HistoryItem[], count?: number }) {
    if (!payload || !Array.isArray(payload.jobs)) {
      // A reply with no list is a failed one.
      Vue.set(state, 'yearStatus', 'error')
      return
    }
    Vue.set(state, 'yearJobs', payload.jobs)
    Vue.set(state, 'yearCount', Number(payload.count) || payload.jobs.length)
    Vue.set(state, 'yearDay', dayKey(new Date()))
    Vue.set(state, 'yearStatus', 'ready')
  },

  /**
   * Where the year's request is.
   */
  setYearStatus (state, status: 'idle' | 'loading' | 'ready' | 'error') {
    Vue.set(state, 'yearStatus', status)
  },

  /**
   * Adds a history item.
   */
  setAddHistory (state, payload: HistoryItem) {
    if (payload) {
      state.jobs.push(payload)
      state.count++
    }
  },

  /**
   * Updates a history item.
   */
  setUpdateHistory (state, payload: HistoryItem) {
    if (payload) {
      const i = state.jobs.findIndex(job => job.job_id === payload.job_id)
      if (i >= 0) {
        Vue.set(state.jobs, i, payload)
      }
    }
  },

  setClearHistoryThumbnails (state, payload: string) {
    if (payload) {
      const i = state.jobs.findIndex(job => job.job_id === payload)
      if (i >= 0) {
        const job = state.jobs[i]
        Vue.set(state.jobs, i, {
          ...job,
          metadata: {
            ...job.metadata,
            thumbnails: []
          }
        })
      }
    }
  },

  setDeleteJob (state, payload: string[]) {
    if (payload) {
      payload.forEach((job_id) => {
        const i = state.jobs.findIndex(job => job.job_id === job_id)
        if (i >= 0) state.jobs.splice(i, 1)
      })
    }
  }
}
