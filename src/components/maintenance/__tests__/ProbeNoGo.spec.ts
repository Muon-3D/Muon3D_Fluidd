import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ProbeCard from '../ProbeCard.vue'
import { panelStore, panelStubs, waits } from '@/components/control/__tests__/panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn(), printerQueryEndstops: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))
const bus = vi.hoisted(() => ({ $emit: vi.fn() }))
vi.mock('@/eventBus', () => ({ EventBus: bus }))

const M1_BED_MESH = { no_go_region_1_min: [75, 0], no_go_region_1_max: [125, 34], no_go_boundary_tolerance: 10, no_go_traverse_z: 6 }

/** ProbeCard on a printer whose head is at real Z `toolZ`, G-code Z `gcodeZ`. */
function show ({ toolZ = 1, gcodeZ = toolZ, homed = true, settings = { printer: {}, bed_mesh: M1_BED_MESH } as Record<string, unknown> } = {}) {
  const store = panelStore()
  store.getters['printer/getHomedAxes'] = () => homed
  Vue.set(store.state.printer.printer, 'gcode', { commands: { PROBE_ACCURACY: {} } })
  store.getters['server/componentSupport'] = () => false
  store.getters['printer/getProbe'] = { name: 'probe', last_query: false }
  store.getters['printer/getPrinterSettings'] = () => ({ z_offset: 0 })
  const p = store.state.printer.printer
  p.toolhead.position = [20, 150, toolZ, 0]
  Vue.set(p.gcode_move, 'gcode_position', [20, 150, gcodeZ, 0])
  p.configfile.settings = settings
  p.bed_mesh = { profile_name: '' }
  const wrapper = mount(ProbeCard, {
    mocks: { $store: store, $waits: { ...waits, onProbeAccuracy: 'accuracy', onQueryProbe: 'query' }, $confirm: vi.fn().mockResolvedValue(true), $route: { params: { printer: 'mock' } } },
    computed: { isMobileViewport: () => false },
    stubs: { ...panelStubs, 'router-link': { template: '<a><slot /></a>' } }
  })
  return { wrapper, vm: wrapper.vm as any }
}

const script = () => socket.printerGcodeScript.mock.calls.map(c => c[0] as string)[0] ?? ''

afterEach(() => { vi.clearAllMocks() })

it('lifts to the crossing height, in G-code Z, when the head is low', async () => {
  // Real 1.0, G-code 1.3: real 6 is G-code 6.3.
  const s = show({ toolZ: 1, gcodeZ: 1.3 })
  await s.vm.checkAccuracy()
  expect(script().split('\n')).toEqual(['G90', 'G1 Z6.3 F600', expect.stringMatching(/^G1 X\d+ Y\d+ F6000$/), 'PROBE_ACCURACY'])
  s.wrapper.destroy()
})

it('never lowers the head: no lift when it is already high', async () => {
  const s = show({ toolZ: 50 })
  await s.vm.checkAccuracy()
  expect(script()).not.toMatch(/G1 Z/)
  expect(script()).toMatch(/PROBE_ACCURACY$/)
  s.wrapper.destroy()
})

it('asks for a homed head first on a printer with no-go regions', async () => {
  const s = show({ homed: false })
  await s.vm.checkAccuracy()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  s.wrapper.destroy()
})

it('does nothing while the printer config has not loaded', async () => {
  const s = show({ settings: {} })
  await s.vm.checkAccuracy()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(bus.$emit).toHaveBeenCalledWith(expect.stringContaining('could not be read'), { type: 'warning' })
  s.wrapper.destroy()
})
