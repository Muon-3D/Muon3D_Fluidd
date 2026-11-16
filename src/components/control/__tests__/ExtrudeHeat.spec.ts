import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlFilament from '../ControlFilament.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))
afterEach(() => { socket.printerGcodeScript.mockClear() })
const sent = () => socket.printerGcodeScript.mock.calls.map(c => c[0] as string)

const PETG = { id: 2, name: 'PETG', gcode: '', values: { extruder: { active: true, type: 'heater', value: 240 }, heater_bed: { active: true, type: 'heater', value: 80 } } }

function mountIt (loaded: string | null) {
  const store = panelStore()
  store.getters['config/getTempPresets'] = [PETG]
  Vue.set(store.state.printer.printer, 'save_variables', { variables: loaded ? { muon_material: loaded } : {} })
  store.extruder.temperature = 26
  store.extruder.can_extrude = false
  store.getters['printer/getHeaters'] = [
    { name: 'extruder', temperature: 26, target: 0, power: 0, maxTemp: 265 },
    { name: 'heater_bed', temperature: 24, target: 0, power: 0, maxTemp: 110 }
  ]
  const wrapper = mount(ControlFilament, { mocks: { $store: store, $waits: waits }, stubs: { ...panelStubs, MaterialPicker: true } })
  return { store, wrapper }
}

it('heats the nozzle to the loaded material\'s temperature, and nothing else', async () => {
  const { wrapper } = mountIt('PETG')
  expect(wrapper.find('[data-tid="extrude-heat-note"]').text()).toBe('for PETG')
  expect((wrapper.find('input[aria-label="Extrude temperature"]').element as HTMLInputElement).value).toBe('240')
  await wrapper.find('[data-tid="extrude-heat"]').trigger('click')
  expect(sent()).toEqual(['SET_HEATER_TEMPERATURE HEATER=extruder TARGET=240'])
  wrapper.destroy()
})

it('can be changed before heating', async () => {
  const { wrapper } = mountIt('PETG')
  const input = wrapper.find('input[aria-label="Extrude temperature"]')
  await input.setValue('250'); await input.trigger('keydown.enter')
  await wrapper.find('[data-tid="extrude-heat"]').trigger('click')
  expect(sent()).toEqual(['SET_HEATER_TEMPERATURE HEATER=extruder TARGET=250'])
  wrapper.destroy()
})

it('uses the printer default material when nothing is loaded', async () => {
  const { wrapper } = mountIt(null)
  expect(wrapper.find('[data-tid="extrude-heat-note"]').text()).toBe('for PLA')
  await wrapper.find('[data-tid="extrude-heat"]').trigger('click')
  expect(sent()).toEqual(['SET_HEATER_TEMPERATURE HEATER=extruder TARGET=215'])
  wrapper.destroy()
})

it('says what is needed without "heat the nozzle first", and is not pressable while printing', async () => {
  const { store, wrapper } = mountIt('PETG')
  expect(wrapper.text()).not.toMatch(/heat the nozzle first/i)
  expect(wrapper.find('[data-tid="extrude-reason"]').text()).toBe('The nozzle is at 26°; extruding needs 170°. Press Heat.')
  store.getters['printer/getPrinterState'] = 'printing'
  await wrapper.vm.$nextTick()
  expect(wrapper.find('[data-tid="extrude-heat"]').attributes('disabled')).toBeDefined()
  const vm = wrapper.vm as any
  vm.heatForExtrude()
  expect(sent()).toEqual([])
  wrapper.destroy()
})
