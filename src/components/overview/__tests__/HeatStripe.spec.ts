import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import HeatStripe from '../HeatStripe.vue'
import FinishClock from '../FinishClock.vue'

it('labels empty history honestly and replaces it only with reported values', async () => {
  const store = Vue.observable({ getters: { 'charts/getChartData': [] as unknown[] } })
  const w = mount(HeatStripe, { propsData: { series: 'extruder', name: 'Nozzle' }, mocks: { $store: store } })
  expect(w.find('svg').attributes('aria-label')).toBe('Nozzle: last ten minutes of reported heat, no history yet')
  expect(w.findAll('[data-state]')).toHaveLength(0)
  store.getters['charts/getChartData'] = [{ date: new Date(), extruder: 210, extruderTarget: 200 }]
  await Vue.nextTick()
  expect(w.find('[data-state="over"]').exists()).toBe(true)
  expect(w.text()).toContain('210.0° / 200°')
  expect(w.text()).toContain('Latest report')
  w.destroy()
})

it('reads the requested heater, not another nozzle, and does not mutate history', () => {
  const points = Object.freeze([Object.freeze({ date: new Date(), extruder: 20, extruderTarget: 0, heater_bed: 60, heater_bedTarget: 60 })])
  const w = mount(HeatStripe, { propsData: { series: 'heater_bed', name: 'Plate' }, mocks: { $store: { getters: { 'charts/getChartData': points } } } })
  expect(w.find('[data-state="ready"]').exists()).toBe(true)
  expect(w.find('[data-state="cold"]').exists()).toBe(false)
  expect(w.find('svg').attributes('aria-label')).toContain('Plate')
  expect(points).toHaveLength(1)
  w.destroy()
})

it('hides an unknown dial and updates an accessible 24-hour finish when ETA changes', async () => {
  const w = mount(FinishClock)
  expect(w.find('[data-tid="finish-clock"]').exists()).toBe(false)
  await w.setProps({ eta: new Date(2026, 10, 12, 18, 0).getTime() })
  expect(w.attributes('aria-label')).toContain('24-hour clock')
  expect(Number(w.find('line').attributes('x2'))).toBeCloseTo(11)
  await w.setProps({ eta: new Date(2026, 10, 13, 6, 0).getTime() })
  expect(Number(w.find('line').attributes('x2'))).toBeCloseTo(53)
  await w.setProps({ eta: NaN })
  expect(w.find('[data-tid="finish-clock"]').exists()).toBe(false)
  w.destroy()
})
