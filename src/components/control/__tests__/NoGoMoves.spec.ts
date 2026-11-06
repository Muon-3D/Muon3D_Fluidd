import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ControlMixin from '@/mixins/control'
import { panelStore, waits } from './panel-fixture'
import { handMoveLock } from '@/services/control/safe-move'

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
  p.configfile.settings = bedMesh ? { printer: {}, bed_mesh: bedMesh } : { printer: {} }
  const wrapper = mount({ mixins: [ControlMixin], render: h => h('div') }, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } }, $confirm: vi.fn().mockResolvedValue(true) } })
  return { store, wrapper, vm: wrapper.vm as any }
}

const sent = () => socket.printerGcodeScript.mock.calls.map(c => c[0] as string)
const moves = () => sent().flatMap(s => s.split('\n')).filter(l => l.startsWith('G1'))

describe('hand moves and the bed notch', () => {
  afterEach(() => { socket.printerGcodeScript.mockClear(); bus.$emit.mockClear(); handMoveLock.target = null; vi.useRealTimers() })

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

  it('judges height by the real (toolhead) Z and sends the lift in G-code Z (offsets in force)', () => {
    // G-code says 6.5, above the traverse height; the nozzle is really at 5.6.
    // The lift must bring the REAL height to 6, which is G-code 6.9; the head
    // then comes back down to where it was (G-code 6.5).
    const s = show([60, 10, 5.6], M1_BED_MESH, 6.5)
    s.vm.moveTo({ X: 140, Y: 10 })
    expect(moves()).toEqual(['G1 Z6.9 F600', 'G1 X140 Y10 F7800', 'G1 Z6.5 F600'])
    s.wrapper.destroy()
  })

  it('refuses Z steps down over the notch even when G-code Z reads higher than the real height', () => {
    // The hole the review found: G-code 6.2, real 6.0, over the notch.
    const s = show([100, 20, 6.0], M1_BED_MESH, 6.2)
    s.vm.moveBy('Z', -0.1)
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    s.wrapper.destroy()
  })

  it('adds the spread of the active mesh to the crossing height', () => {
    const s = show([60, 10, 1])
    s.store.state.printer.printer.bed_mesh = { profile_name: 'default', mesh_matrix: [[-0.3, 0.1], [0.2, 0.4]] }
    s.vm.moveTo({ X: 140, Y: 10 })
    expect(moves()).toEqual(['G1 Z6.7 F600', 'G1 X140 Y10 F7800', 'G1 Z1 F600'])
    s.wrapper.destroy()
  })

  it('waits for one hand move to land before planning the next from a stale position', () => {
    const s = show([150, 60, 1])
    s.vm.moveTo({ X: 150, Y: 20 })
    s.vm.moveTo({ X: 50, Y: 60 }) // the printer hasn't reported the first yet
    expect(sent()).toHaveLength(1)
    expect(bus.$emit).toHaveBeenCalledWith('Wait for the head to finish moving.', { type: 'warning' })
    // The printer reports the head at the first target: the next move is planned from there.
    const p = s.store.state.printer.printer
    p.toolhead.position = [150, 20, 1, 0]; p.gcode_move.gcode_position = [150, 20, 1, 0]
    s.vm.moveTo({ X: 50, Y: 60 })
    expect(moves().slice(1)).toEqual(['G1 Z6 F600', 'G1 X50 Y60 F7800', 'G1 Z1 F600'])
    s.wrapper.destroy()
  })

  it('treats a printer whose config has not loaded as unreadable: only up', () => {
    const s = show([10, 100, 1])
    s.store.state.printer.printer.configfile.settings = {}
    s.vm.moveBy('X', 10)
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    s.vm.moveBy('Z', 5)
    expect(moves()).toEqual(['G1 Z5 F600'])
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

  it('shares the wait across components: another tile cannot plan from the stale spot', () => {
    // Overview's Position and Jog tiles are separate components moving one head.
    const a = show([150, 60, 1])
    const b = show([150, 60, 1])
    a.vm.moveTo({ X: 150, Y: 20 })
    b.vm.moveTo({ X: 50, Y: 60 })
    expect(sent()).toHaveLength(1)
    a.wrapper.destroy(); b.wrapper.destroy()
  })

  it('clears the wait on the G-code position, even when a mesh moves the real Z', () => {
    const s = show([150, 60, 1])
    s.vm.moveTo({ X: 150, Y: 20 })
    const p = s.store.state.printer.printer
    // Arrived: G-code exactly at the target; the real Z differs by the mesh slope.
    p.gcode_move.gcode_position = [150, 20, 1, 0]; p.toolhead.position = [150, 20, 1.04, 0]
    s.vm.moveTo({ X: 140, Y: 60 })
    expect(sent()).toHaveLength(2)
    s.wrapper.destroy()
  })

  it('stops waiting after 8 s if the printer never reports the target (a refused move)', () => {
    vi.useFakeTimers()
    const s = show([150, 60, 1])
    s.vm.moveTo({ X: 150, Y: 20 })
    s.vm.moveTo({ X: 140, Y: 60 })
    expect(sent()).toHaveLength(1)
    vi.advanceTimersByTime(8001)
    s.vm.moveTo({ X: 140, Y: 60 })
    expect(sent()).toHaveLength(2)
    s.wrapper.destroy()
  })

  it('converts X/Y offsets: plans where the nozzle really is, sends G-code coordinates', () => {
    // G92-style X offset: G-code X reads 10 less than the real X.
    const s = show([60, 10, 1])
    s.store.state.printer.printer.gcode_move.gcode_position = [50, 10, 1, 0]
    s.vm.moveTo({ X: 130, Y: 10 }) // G-code 130 is real 140: across the notch
    expect(moves()).toEqual(['G1 Z6 F600', 'G1 X130 Y10 F7800', 'G1 Z1 F600'])
    s.wrapper.destroy()
  })
})
