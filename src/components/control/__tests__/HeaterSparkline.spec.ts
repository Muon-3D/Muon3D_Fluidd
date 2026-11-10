import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import HeaterSparkline from '../HeaterSparkline.vue'

const store = (data: unknown[]) => ({ getters: { 'charts/getChartData': data } })
const at = (s: number, extruder: number, target = 215) => ({ date: new Date(1_800_000_000_000 + s * 1000), extruder, extruderTarget: target })

it('draws the heater\'s recent history as a line, with its target', () => {
  const data = [at(0, 180), at(30, 200), at(60, 214), at(90, 215)]
  const w = mount(HeaterSparkline, { propsData: { series: 'extruder' }, mocks: { $store: store(data) } })
  expect(w.attributes('data-state')).toBe('line')
  expect(w.find('.spark__line').attributes('d')).toMatch(/^M[\d.]+ [\d.]+ L/)
  expect(w.find('.spark__target').exists()).toBe(true)
  w.destroy()
})

it('draws a faint flat line with no history, one sample, or another heater\'s only', () => {
  for (const data of [[], [at(0, 200)], [{ date: new Date(), heater_bed: 60 }, { date: new Date(Date.now() + 1000), heater_bed: 61 }]]) {
    const w = mount(HeaterSparkline, { propsData: { series: 'extruder' }, mocks: { $store: store(data) } })
    expect(w.attributes('data-state')).toBe('empty')
    expect(w.find('.spark__line').exists()).toBe(false)
    expect(w.find('.spark__none').exists()).toBe(true)
    w.destroy()
  }
})

it('reads nothing when the charts store has no data yet', () => {
  const w = mount(HeaterSparkline, { propsData: { series: 'extruder' }, mocks: { $store: { getters: {} } } })
  expect(w.attributes('data-state')).toBe('empty')
  w.destroy()
})
