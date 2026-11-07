import Vue from 'vue'
import { CHART_RANGES } from './model'

const RANGE_KEY = 'muon3d.charts.range.v3'

function readRange (): number {
  try {
    const saved = Number(localStorage.getItem(RANGE_KEY))
    if (CHART_RANGES.some(r => r.value === saved)) return saved
  } catch {
    // The default below.
  }
  return 600
}

/**
 * What the Charts header and the Charts page share: the header holds the
 * time range and Add chart, and the page holds the charts they act on.
 */
export const chartsPage = Vue.observable({
  range: readRange(),
  /** Bumped by the header's Add chart; the page opens the chart editor. */
  addTick: 0,
  /** The chart to start from (a preset's title); empty, a custom chart. */
  addPreset: ''
})

export function setChartsRange (seconds: number) {
  chartsPage.range = seconds
  try {
    localStorage.setItem(RANGE_KEY, String(seconds))
  } catch {
    // Kept for this visit only.
  }
}
