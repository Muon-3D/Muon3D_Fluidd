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
    handleAddChartEntry(1200, state, commit)
    vi.advanceTimersByTime(10) // 200 updates over 2 s
  }
  expect(commit.mock.calls.length).toBeLessThanOrEqual(3)
  expect(commit.mock.calls.length).toBeGreaterThanOrEqual(2)
})

it('records again once a second has passed', () => {
  const { state, commit } = setup()
  handleAddChartEntry(1200, state, commit)
  vi.advanceTimersByTime(999)
  handleAddChartEntry(1200, state, commit)
  expect(commit).toHaveBeenCalledTimes(1)
  vi.advanceTimersByTime(1)
  handleAddChartEntry(1200, state, commit)
  expect(commit).toHaveBeenCalledTimes(2)
})

it('records every heater, sensor and fan the printer reports, not just the nozzle', () => {
  const { state, commit } = setup()
  Object.assign(state.printer.printer, {
    heater_bed: { temperature: 60, target: 60, power: 0.5 },
    'temperature_sensor mcu_temp': { temperature: 41 },
    'temperature_fan box': { temperature: 30, target: 35, speed: 0.25 },
    fan: { speed: 0.8 },
    toolhead: { position: [0, 0, 0] }
  })
  handleAddChartEntry(1200, state, commit)
  const sample = commit.mock.calls[0][1].data
  expect(sample).toMatchObject({ extruder: 200, extruderTarget: 210, heater_bed: 60, heater_bedPower: 0.5, 'temperature_sensor mcu_temp': 41, 'temperature_fan box': 30, 'temperature_fan boxTarget': 35, 'temperature_fan boxSpeed': 0.25, fanSpeed: 0.8 })
  expect('toolhead' in sample).toBe(false)
})
