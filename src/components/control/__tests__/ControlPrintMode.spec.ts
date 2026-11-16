import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlPrintMode from '../ControlPrintMode.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear() })
const sent = () => socket.printerGcodeScript.mock.calls.map(c => c[0] as string)

function show (pa: number, base = 0.04, fanModes?: unknown) {
  const store = panelStore()
  if (fanModes) store.state.printer.printer.fan_modes = fanModes
  store.extruder.pressure_advance = pa
  store.state.printer.printer.configfile.settings.extruder = { pressure_advance: base }
  const wrapper = mount(ControlPrintMode, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } } }, stubs: panelStubs })
  return { store, wrapper, vm: wrapper.vm as any }
}

it('nudges pressure advance by the range step, 0.001', () => {
  const s = show(0.04)
  s.vm.nudgePa(1)
  s.vm.nudgePa(-1)
  expect(sent()).toEqual(['SET_PRESSURE_ADVANCE ADVANCE=0.041', 'SET_PRESSURE_ADVANCE ADVANCE=0.039'])
  s.wrapper.destroy()
})

it('clamps an overshoot to the bounds instead of ignoring it', () => {
  const top = show(0.08)
  top.vm.nudgePa(1)
  top.vm.setPa(0.5)
  expect(sent()).toEqual(['SET_PRESSURE_ADVANCE ADVANCE=0.08', 'SET_PRESSURE_ADVANCE ADVANCE=0.08'])
  top.wrapper.destroy()
  socket.printerGcodeScript.mockClear()
  const bottom = show(0)
  bottom.vm.nudgePa(-1)
  bottom.vm.setPa(Number.NaN)
  expect(sent()).toEqual(['SET_PRESSURE_ADVANCE ADVANCE=0'])
  bottom.wrapper.destroy()
})

it('sends SET_PRINT_MODE for a mode the printer reports, and nothing for the current one', () => {
  const s = show(0.04, 0.04, { mode: 'normal', modes: ['normal', 'quiet', 'turbo'] })
  s.vm.setMode('normal')
  s.vm.setMode('turbo')
  expect(sent()).toEqual(['SET_PRINT_MODE MODE=turbo'])
  s.wrapper.destroy()
})
