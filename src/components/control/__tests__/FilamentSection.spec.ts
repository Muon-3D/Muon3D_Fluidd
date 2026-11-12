import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import FilamentSection from '../FilamentSection.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))
afterEach(() => { socket.printerGcodeScript.mockClear() })
const sent = () => socket.printerGcodeScript.mock.calls.map(c => c[0] as string)

const M1_MACROS = [{ name: 'M600', config: { gcode: 'PAUSE' } }, { name: 'LOAD_FILAMENT', config: { gcode: '' } }, { name: 'UNLOAD_FILAMENT', config: { gcode: '' } }]

function mountIt (propsData: Record<string, unknown> = {}, prepare: (store: ReturnType<typeof panelStore>) => void = () => {}) {
  const store = panelStore()
  store.getters['macros/getMacros'] = M1_MACROS
  prepare(store)
  const wrapper = mount(FilamentSection, { propsData, mocks: { $store: store, $waits: waits, $confirm: vi.fn(async () => true) }, stubs: { ...panelStubs, MaterialPicker: true } })
  return { store, wrapper }
}

it('is the ring and its name, then Change filament, Load and Unload', () => {
  const { wrapper } = mountIt()
  expect(wrapper.find('[data-tid="filament-row"]').exists()).toBe(true)
  expect(wrapper.find('[data-tid="filament-swatch"]').exists()).toBe(true)
  expect(wrapper.find('[data-tid="change-filament"]').text()).toBe('Change filament')
  expect(wrapper.find('[data-tid="load-filament"]').exists()).toBe(true)
  expect(wrapper.find('[data-tid="unload-filament"]').exists()).toBe(true)
  wrapper.destroy()
})

it('keeps each page its own data-tids, and shows only the row when compact', () => {
  const overview = mountIt({ tidPrefix: 'overview-' }).wrapper
  expect(overview.find('[data-tid="overview-change-filament"]').exists()).toBe(true)
  overview.destroy()
  const small = mountIt({ compact: true }).wrapper
  expect(small.find('[data-tid="filament-row"]').exists()).toBe(true)
  expect(small.find('[data-tid="change-filament"]').exists()).toBe(false)
  small.destroy()
})

it('idle, Change filament opens the material panel and sends nothing', async () => {
  const { wrapper } = mountIt()
  const vm = wrapper.vm as unknown as { $refs: { picker: { open: boolean } } }
  vm.$refs.picker = { open: false } as never
  await wrapper.find('[data-tid="change-filament"]').trigger('click')
  await wrapper.vm.$nextTick(); await wrapper.vm.$nextTick()
  expect(vm.$refs.picker.open).toBe(true)
  expect(sent()).toEqual([])
  wrapper.destroy()
})

it('mid-print, Change filament is M600 after its confirm; Load waits', async () => {
  const { wrapper } = mountIt({}, store => { store.getters['printer/getPrinterState'] = 'printing' })
  expect(wrapper.find('[data-tid="load-filament"]').attributes('disabled')).toBeDefined()
  await (wrapper.vm as any).changeFilament()
  expect(sent()).toEqual(['M600'])
  wrapper.destroy()
})

it('shows the filament sensors beside the buttons, with a way to Health that opens Switches and sensors', () => {
  const { wrapper } = mountIt({}, store => {
    store.getters['printer/getRunoutSensors'] = [{ name: 'runout', prettyName: 'Runout', enabled: true, filament_detected: true }]
    store.state.printer.printer.configfile.settings['filament_switch_sensor runout'] = { pause_on_runout: true }
  })
  expect(wrapper.find('[data-tid="filament-sensor"]').text()).toContain('Runout · filament in')
  expect(wrapper.find('[data-tid="filament-sensors-link"]').attributes('to')).toBe('/mock/maintenance?sensors=open')
  wrapper.destroy()
})

it('has no sensor link on a printer without sensors', () => {
  const { wrapper } = mountIt()
  expect(wrapper.find('[data-tid="filament-sensors-link"]').exists()).toBe(false)
  wrapper.destroy()
})
