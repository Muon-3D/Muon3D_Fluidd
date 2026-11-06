import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ControlZOffset from '../ControlZOffset.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
afterEach(() => { socket.printerGcodeScript.mockClear() })

const M1_BED_MESH = { no_go_region_1_min: [75, 0], no_go_region_1_max: [125, 34], no_go_boundary_tolerance: 10, no_go_traverse_z: 6 }
const sent = () => socket.printerGcodeScript.mock.calls.map(c => c[0] as string)

function show (head: [number, number, number], state = 'ready') {
  const store = panelStore()
  const p = store.state.printer.printer
  p.toolhead.position = [...head, 0]
  p.gcode_move.gcode_position = [...head, 0]
  p.configfile.settings = { printer: {}, bed_mesh: M1_BED_MESH }
  store.getters['printer/getPrinterState'] = state
  const wrapper = mount(ControlZOffset, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } } }, stubs: panelStubs })
  return { store, wrapper }
}

it('refuses a minus nudge with the head idle low over the notch, and says why', async () => {
  const { wrapper } = show([100, 10, 2])
  const down = wrapper.find('[data-tid="zoffset--0.05"]')
  expect(down.attributes('disabled')).toBeDefined()
  ;(wrapper.vm as any).nudge(-0.05)
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(wrapper.find('[data-tid="zoffset-refusal"]').text()).toMatch(/over the bed notch/)
  await wrapper.find('[data-tid="zoffset-0.05"]').trigger('click')
  expect(sent()).toEqual(['SET_GCODE_OFFSET Z_ADJUST=+0.05 MOVE=1'])
  wrapper.destroy()
})

it('nudges down away from the notch, and live while printing', async () => {
  const away = show([160, 100, 0.2])
  await away.wrapper.find('[data-tid="zoffset--0.01"]').trigger('click')
  expect(sent()).toEqual(['SET_GCODE_OFFSET Z_ADJUST=-0.01 MOVE=1'])
  away.wrapper.destroy()
  socket.printerGcodeScript.mockClear()
  const printing = show([100, 10, 0.2], 'printing')
  await printing.wrapper.find('[data-tid="zoffset--0.01"]').trigger('click')
  expect(sent()).toEqual(['SET_GCODE_OFFSET Z_ADJUST=-0.01 MOVE=1'])
  printing.wrapper.destroy()
})
