import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { handleAddChartEntry } from '../chart_helpers'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

function setup () {
  const chart: Array<{ date: Date }> = []
  const state: any = { charts: { ready: true, chart }, printer: { printer: { extruder: { temperature: 200, target: 210 } } } }
  const commit = vi.fn((_name: string, payload: any) => { chart.push(payload.data) })
  return { state, commit }
}

it('records at most one temperature sample per second under a burst of status updates', () => {
  const { state, commit } = setup()
  for (let i = 0; i < 200; i++) {
    handleAddChartEntry(1200, state, commit, { getChartableSensors: ['extruder'] })
    vi.advanceTimersByTime(10) // 200 updates over 2 s
  }
  expect(commit.mock.calls.length).toBeLessThanOrEqual(3)
  expect(commit.mock.calls.length).toBeGreaterThanOrEqual(2)
})

it('records again once a second has passed', () => {
  const { state, commit } = setup()
  handleAddChartEntry(1200, state, commit, { getChartableSensors: ['extruder'] })
  vi.advanceTimersByTime(999)
  handleAddChartEntry(1200, state, commit, { getChartableSensors: ['extruder'] })
  expect(commit).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  handleAddChartEntry(1200, state, commit, { getChartableSensors: ['extruder'] })
  expect(commit).toHaveBeenCalledTimes(2)
})
