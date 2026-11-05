import type { Commit } from 'vuex'
import type { RootState } from './types'
import { discoverSeries, recordSample } from '@/services/charts/series'

/** Minimum spacing of temperature history samples. */
export const CHART_SAMPLE_INTERVAL_MS = 1000

export const handleMcuStatsChange = (payload: any, state: RootState, commit: Commit) => {
  const keys = Object.keys(payload).filter(key => key.startsWith('mcu'))
  if (keys.length > 0) {
    keys.forEach(key => {
      // swap underscores for spaces.
      // const name = key.replace(' ', '_')

      // Combine existing with the update.
      const stats = {
        ...state.printer.printer[key],
        ...payload[key]
      }

      if (stats.last_stats) {
        // Datestamp for this chart entry.
        const date = new Date()

        // The last entry in our chart data.
        let lastEntry: any
        if (state.charts[key]) {
          lastEntry = state.charts[key][state.charts[key].length - 1]
        }

        // Load & Awake times
        const task_max = 0.0025
        const stats_interval = 5
        const load = 100 * (stats.last_stats.mcu_task_avg + (3 * stats.last_stats.mcu_task_stddev)) / task_max
        const awake = 100 * (stats.last_stats.mcu_awake / stats_interval)

        // Bandwidth
        // We really need the time passed on from klipper, and the a known
        // max for serial, usb or can to accurately chart this.
        // 25000 === 250,0000 bps is a guess and not accurate.
        // The time delta below is innacurate since its not reflective of when
        // klipper recorded the data.
        const maxbw = 25000

        // The time delta between the last and this entry.
        const timedelta = (lastEntry) ? date.getTime() - lastEntry.date.getTime() : 1000

        let bw = stats.last_stats.bytes_write + stats.last_stats.bytes_retransmit
        let lastbw = (lastEntry) ? parseFloat(lastEntry.bw) : bw
        if (bw < lastbw) lastbw = bw
        bw = 100 * (bw - lastbw) / (maxbw * timedelta)

        // Commit the formatted result to our chart data.
        commit('charts/setChartEntry', {
          type: key,
          retention: 600,
          data: {
            date,
            load: load.toFixed(2),
            awake: awake.toFixed(2),
            bw: bw.toFixed(2)
          }
        }, { root: true })
      }
    })
  }
}

export const handleSystemStatsChange = (payload: any, state: RootState, commit: Commit) => {
  if (
    'system_stats' in payload
  ) {
    // Combine existing with the update.
    const stats = {
      ...state.printer.printer.system_stats,
      ...payload.system_stats
    }

    // Datestamp for this chart entry.
    const date = new Date()

    // Add an entry for the memory graph.
    if (
      'memavail' in stats &&
      state.server.system_info?.cpu_info?.total_memory
    ) {
      const total_memory = state.server.system_info?.cpu_info?.total_memory || 0
      const mem_used = total_memory - stats.memavail
      const percent_mem_used = Math.ceil(mem_used / total_memory * 100)

      // Commit the formatted result to our chart data.
      commit('charts/setChartEntry', {
        type: 'memory',
        retention: 600,
        data: {
          date,
          memused: percent_mem_used.toFixed(2)
        }
      }, { root: true })
    }

    // Add an entry for the cpu time and sysload.
    if (
      'cputime' in stats &&
      'sysload' in stats
    ) {
      const cputime = stats.cputime
      const last_cputime = state.printer.printer.system_stats?.cputime || stats.cputime || 0

      // Commit the formatted result to our chart data.
      commit('charts/setChartEntry', {
        type: 'klipper',
        retention: 600,
        data: {
          date,
          load: stats.sysload.toFixed(2),
          cputime_change: ((cputime - last_cputime) * 100).toFixed(2)
        }
      }, { root: true })
    }
  }
}

/**
 * Prepare packet data for a chart entry.
 * Every packet should contain an entry for all known sensors we want to track.
 */
export const handleAddChartEntry = (retention: number, state: RootState, commit: Commit) => {
  // Klipper reports every 250 ms or faster, once per subscribed object. History is one
  // sample per second, so a burst of status updates adds at most one entry per second.
  const last = state.charts.chart[state.charts.chart.length - 1]
  if (last && Date.now() - last.date.valueOf() < CHART_SAMPLE_INTERVAL_MS) return

  if (state.charts.ready) {
    // Every heater, sensor and fan Klipper reports, found afresh so a hot-plugged one is recorded too.
    const data = recordSample(state.printer.printer, discoverSeries(state.printer.printer))
    commit('charts/setChartEntry', {
      type: 'chart',
      data,
      retention
    }, { root: true })
  }
}
