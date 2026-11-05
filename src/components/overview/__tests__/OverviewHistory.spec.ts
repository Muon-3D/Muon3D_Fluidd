import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import OverviewTemps from '../OverviewTemps.vue'
import { panelStore } from '@/components/control/__tests__/panel-fixture'
const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/charts/engine', () => ({ createGraph: vi.fn(async () => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() })) }))
it('records only observed real status transitions and clears markers on context, disconnect and print restart', async () => {
  const store = panelStore()
  store.getters['charts/getChartRetention'] = 1200
  store.getters['charts/getChartData'] = []
  store.getters['printer/getSensors'] = []
  const printer = store.state.printer.printer
  Vue.set(printer, 'print_stats', { filename: 'part.gcode', total_duration: 50, info: { current_layer: 1 } })
  Vue.set(printer, 'pause_resume', { is_paused: false })
  Vue.set(printer, 'filament_switch_sensor loader', { filament_detected: true })
  const wrapper = mount(OverviewTemps, { mocks: { $store: store }, stubs: { 'frame-icon': true } })
  expect(wrapper.findAll('[data-event]')).toHaveLength(0)
  printer.print_stats.info.current_layer = 2
  printer.pause_resume.is_paused = true
  printer['filament_switch_sensor loader'].filament_detected = false
  await Vue.nextTick()
  expect(wrapper.findAll('[data-event]').wrappers.map(w => w.attributes('data-event'))).toEqual(['Layer 2', 'Paused', 'filament_switch_sensor loader: filament absent'])
  store.getters['printer/getPrintLayer'] = 99
  await Vue.nextTick()
  expect(wrapper.findAll('[data-event]')).toHaveLength(3)
  store.state.config.apiUrl = 'http://other.local'
  await Vue.nextTick()
  expect(wrapper.findAll('[data-event]')).toHaveLength(0)
  printer.pause_resume.is_paused = false
  await Vue.nextTick()
  expect(wrapper.find('[data-event="Resumed"]').exists()).toBe(true)
  store.getters['socket/getConnectionState'] = false
  await Vue.nextTick()
  expect(wrapper.findAll('[data-event]')).toHaveLength(0)
  store.getters['socket/getConnectionState'] = true
  await Vue.nextTick()
  printer.print_stats.info.current_layer = 3
  await Vue.nextTick()
  expect(wrapper.find('[data-event="Layer 3"]').exists()).toBe(true)
  printer.print_stats.total_duration = 1
  await Vue.nextTick()
  expect(wrapper.findAll('[data-event]')).toHaveLength(0)
  wrapper.destroy()
})

it('drops table target drafts on a context switch and refuses a detached old field', async () => {
  const store = panelStore()
  store.getters['charts/getChartRetention'] = 1200
  store.getters['charts/getChartData'] = []
  const wrapper = mount(OverviewTemps, { mocks: { $store: store }, stubs: { 'frame-icon': true } })
  await wrapper.findAll('button').wrappers.find(w => w.text() === 'Table')!.trigger('click')
  expect(wrapper.findComponent({ name: 'ThermalGraph' }).exists()).toBe(false)
  const oldField = wrapper.findComponent({ name: 'NumberField' })
  const input = wrapper.find('input[aria-label="Nozzle target"]')
  await input.setValue('220')
  store.state.config.apiUrl = 'http://other.local'
  oldField.vm.$emit('change', 220)
  await Vue.nextTick()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect((wrapper.find('input[aria-label="Nozzle target"]').element as HTMLInputElement).value).toBe('215')
  wrapper.destroy(); socket.printerGcodeScript.mockClear()
})

it('shows the Fluidd-style graph with a labelled, toggleable legend for every tracked series', async () => {
  const store = panelStore()
  store.getters['charts/getChartRetention'] = 1200
  store.getters['charts/getChartData'] = []
  store.getters['charts/getSelectedLegends'] = { extruder: false }
  Vue.set(store.state.printer.printer, 'extruder', { temperature: 214.6, target: 215, power: 0.41 })
  Vue.set(store.state.printer.printer, 'heater_bed', { temperature: 59.8, target: 60, power: 0.18 })
  Vue.set(store.state.printer.printer, 'temperature_sensor mcu_temp', { temperature: 44 })
  const wrapper = mount(OverviewTemps, { mocks: { $store: store }, stubs: { 'frame-icon': true } })
  const nozzle = wrapper.find('[data-legend="extruder"]')
  const bed = wrapper.find('[data-legend="heater_bed"]')
  expect(nozzle.attributes('aria-pressed')).toBe('false')
  expect(bed.attributes('aria-pressed')).toBe('true')
  expect(bed.text()).toContain('59.8')
  expect(wrapper.find('[data-legend="temperature_sensor mcu_temp"]').exists()).toBe(true)
  await bed.trigger('click')
  expect(store.dispatch).toHaveBeenCalledWith('charts/saveSelectedLegends', { extruder: false, heater_bed: false })
  await nozzle.trigger('click')
  expect(store.dispatch).toHaveBeenCalledWith('charts/saveSelectedLegends', { extruder: true })
  expect(wrapper.find('input[type="range"]').exists()).toBe(false)
  expect(wrapper.find('[data-gap]').exists()).toBe(false)
  wrapper.destroy()
})
