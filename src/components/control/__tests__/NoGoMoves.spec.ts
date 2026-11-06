import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ControlMixin from '@/mixins/control'
import { panelStore, waits } from './panel-fixture'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
const bus = vi.hoisted(() => ({ $emit: vi.fn() }))
vi.mock('@/eventBus', () => ({ EventBus: bus }))

// The M1's notch, as the printer declares it.
const M1_BED_MESH = {
  no_go_region_1_min: [75, 0],
  no_go_region_1_max: [125, 34],
  no_go_boundary_tolerance: 10,
  no_go_traverse_z: 6
}

function show (head: [number, number, number], bedMesh: unknown = M1_BED_MESH, gcodeZ = head[2]) {
  const store = panelStore()
  const p = store.state.printer.printer
  p.toolhead.position = [...head, 0]
  p.gcode_move.gcode_position = [head[0], head[1], gcodeZ, 0]
  p.configfile.settings = bedMesh ? { bed_mesh: bedMesh } : {}
  const wrapper = mount({ mixins: [ControlMixin], render: h => h('div') }, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } }, $confirm: vi.fn().mockResolvedValue(true) } })
  return { wrapper, vm: wrapper.vm as any }
}

const sent = () => socket.printerGcodeScript.mock.calls.map(c => c[0] as string)
const moves = () => sent().flatMap(s => s.split('\n')).filter(l => l.startsWith('G1'))

describe('hand moves and the bed notch', () => {
  afterEach(() => { socket.printerGcodeScript.mockClear(); bus.$emit.mockClear() })

  it('lifts to the traverse height before a pad click that crosses the notch low down', () => {
    const s = show([60, 10, 0.4])
    s.vm.moveTo({ X: 140, Y: 10 })
    expect(moves()).toEqual(['G1 Z6 F600', 'G1 X140 Y10 F7800', 'G1 Z0.4 F600'])
    expect(sent()[0].startsWith('SAVE_GCODE_STATE NAME=_ui_movement\nG90\n')).toBe(true)
    s.wrapper.destroy()
  })

  it('lifts for a jog step that crosses the notch', () => {
    const s = show([70, 7, 1])
    s.vm.moveBy('X', 60)
    expect(moves()).toEqual(['G1 Z6 F600', 'G1 X130 Y7 F7800', 'G1 Z1 F600'])
    s.wrapper.destroy()
  })

  it('refuses a low move that ends over the notch, and says why', () => {
    const s = show([10, 100, 1])
    s.vm.moveTo({ X: 100, Y: 10 })
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    expect(bus.$emit).toHaveBeenCalledWith(expect.stringContaining('bed notch'), { type: 'warning' })
    s.wrapper.destroy()
  })

  it('refuses lowering Z into the notch while the head is over it', () => {
    const s = show([100, 10, 8])
    s.vm.moveBy('Z', -5)
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    s.wrapper.destroy()
  })

  it('judges height by the lower of toolhead and G-code Z (mesh active)', () => {
    // G-code says 6.5 (above the traverse height), toolhead says 5.6: unsafe.
    const s = show([60, 10, 5.6], M1_BED_MESH, 6.5)
    s.vm.moveTo({ X: 140, Y: 10 })
    expect(moves()[0]).toBe('G1 Z6.5 F600')
    expect(moves()).toHaveLength(2)
    s.wrapper.destroy()
  })

  it('keeps an ordinary jog exactly as before', () => {
    const s = show([10, 100, 1])
    s.vm.moveBy('X', 10)
    expect(sent()).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X10 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
    s.wrapper.destroy()
  })

  it('moves as before on printers that declare no regions', () => {
    const s = show([60, 10, 0.4], null)
    s.vm.moveTo({ X: 140, Y: 10 })
    expect(moves()).toEqual(['G1 X140 Y10 F7800'])
    s.wrapper.destroy()
  })

  it('only lets the head go up when the regions cannot be read', () => {
    const s = show([10, 100, 1], { no_go_region_1_min: 'nonsense', no_go_region_1_max: [125, 34], no_go_traverse_z: 6 })
    s.vm.moveBy('X', 10)
    s.vm.moveBy('Z', -0.5)
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    s.vm.moveBy('Z', 5)
    expect(moves()).toEqual(['G1 Z5 F600'])
    s.wrapper.destroy()
  })
})
