import Vue from 'vue'
import { expect, it } from 'vitest'
import { mutations } from '../mutations'
import { defaultState } from '../state'

const history = () => Array.from({ length: 5 }, (_, i) => ({ date: new Date(1000 * i), extruder: 20 + i }))

it('keeps the initial history out of Vue reactivity, as later samples already are', () => {
  const state = Vue.observable(defaultState())
  ;(mutations.setChartStore as any)(state, history())
  expect(state.chart).toHaveLength(5)
  for (const sample of state.chart) {
    expect(Object.isFrozen(sample)).toBe(true)
    expect((sample as any).__ob__).toBeUndefined()
  }
  // The list itself stays reactive so the chart still redraws when a sample is added.
  expect((state.chart as any).__ob__).toBeDefined()
})

it('freezes a sample added later', () => {
  const state = Vue.observable(defaultState())
  ;(mutations.setChartEntry as any)(state, { type: 'chart', retention: 1200, data: { date: new Date(), extruder: 21 } })
  expect(Object.isFrozen(state.chart[0])).toBe(true)
})
