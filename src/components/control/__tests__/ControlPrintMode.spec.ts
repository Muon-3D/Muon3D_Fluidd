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

it('groups speed, flow and the part fan behind one disclosure without sending on open', async () => {
  const s = show(0.04)
  s.store.getters['printer/getAllFans'] = [{ name: 'fan', type: 'fan', speed: 0.8 }]
  await s.wrapper.find('[data-tid="advanced-toggle"]').trigger('click')
  const group = s.wrapper.find('[role="group"][aria-labelledby="pmode-advanced-title"]')
  expect(group.isVisible()).toBe(true)
  expect(s.wrapper.find('#pmode-advanced-title').text()).toBe('Speed, flow and fans')
  expect(sent()).toEqual([])
  for (const [label, value] of [['Speed', '105'], ['Flow', '101'], ['Part fan', '85']]) {
    const input = group.find(`input[aria-label="${label}"]`)
    await input.setValue(value)
    await input.trigger('change')
  }
  expect(sent()).toEqual(['M220 S105', 'M221 S101', 'M106 S217'])
  s.wrapper.destroy()
})

it('keeps speed and flow together without inventing a part fan on hardware without one', async () => {
  const s = show(0.04)
  await s.wrapper.find('[data-tid="advanced-toggle"]').trigger('click')
  const group = s.wrapper.find('[role="group"][aria-labelledby="pmode-advanced-title"]')
  expect(group.find('input[aria-label="Speed"]').exists()).toBe(true)
  expect(group.find('input[aria-label="Flow"]').exists()).toBe(true)
  expect(group.find('input[aria-label="Part fan"]').exists()).toBe(false)
  expect(sent()).toEqual([])
  s.wrapper.destroy()
})

it('disables all three grouped controls when the connection is lost', async () => {
  const s = show(0.04)
  s.store.getters['printer/getAllFans'] = [{ name: 'fan', type: 'fan', speed: 0.8 }]
  await s.wrapper.find('[data-tid="advanced-toggle"]').trigger('click')
  s.store.getters['socket/getConnectionState'] = false
  await s.wrapper.vm.$nextTick()
  const group = s.wrapper.find('[role="group"][aria-labelledby="pmode-advanced-title"]')
  for (const label of ['Speed', 'Flow', 'Part fan']) {
    expect((group.find(`input[aria-label="${label}"]`).element as HTMLInputElement).disabled).toBe(true)
  }
  expect(sent()).toEqual([])
  s.wrapper.destroy()
})
