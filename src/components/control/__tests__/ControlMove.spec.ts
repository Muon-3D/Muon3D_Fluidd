import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ControlMove, { MOVE_STEPS } from '../ControlMove.vue'
import ControlTrackpad from '../ControlTrackpad.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'
import { handMoveLock, headStatus, scriptsInFlight } from '@/services/control/safe-move'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
const bus = vi.hoisted(() => ({ $emit: vi.fn() }))
vi.mock('@/eventBus', () => ({ EventBus: bus }))

const M1_BED_MESH = { no_go_region_1_min: [75, 0], no_go_region_1_max: [125, 34], no_go_boundary_tolerance: 10, no_go_traverse_z: 6 }

const sent = () => socket.printerGcodeScript.mock.calls.map(c => c[0] as string)
const moves = () => sent().flatMap(s => s.split('\n')).filter(l => l.startsWith('G1'))

function show ({ head = [150, 100, 10] as [number, number, number], phone = false, bedMesh = M1_BED_MESH as unknown } = {}) {
  const store = panelStore()
  const p = store.state.printer.printer
  p.toolhead.position = [...head, 0]
  p.gcode_move.gcode_position = [...head, 0]
  p.configfile.settings = bedMesh ? { printer: {}, bed_mesh: bedMesh } : { printer: {} }
  const wrapper = mount(ControlMove, { propsData: { phone }, mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } } }, stubs: panelStubs })
  return { store, wrapper, vm: wrapper.vm as any }
}

beforeEach(() => { headStatus.fresh = true; scriptsInFlight.count = 0 })
afterEach(() => { socket.printerGcodeScript.mockClear(); bus.$emit.mockClear(); handMoveLock.target = null })

it.each([false, true])('offers fine jog steps down to 0.1 mm on phone=%s', phone => {
  const s = show({ phone })
  expect(MOVE_STEPS.slice(0, 3)).toEqual([0.1, 1, 10])
  expect(s.vm.stepOptions.map((o: { value: number }) => o.value)).toEqual(MOVE_STEPS)
  s.vm.step = 0.1
  s.vm.jogButtons.find((b: { id: string }) => b.id === 'e').run()
  expect(sent()).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X0.1 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
  s.wrapper.destroy()
})

it('types an exact place, shows the limits and speeds, and goes there through moveTo', async () => {
  const s = show({ bedMesh: null })
  expect(s.wrapper.text()).toContain('0 to 200'); expect(s.wrapper.text()).toContain('130 mm/s')
  const x = s.wrapper.find('input[aria-label="X to go to"]')
  await x.setValue('120'); await x.trigger('keydown.enter')
  await s.wrapper.find('[data-tid="move-go"]').trigger('click')
  expect(sent()).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG90\nG1 X120 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
  s.wrapper.destroy()
})

it('keeps an exact draft when a changed limit or lost homing refuses it', () => {
  const s = show({ bedMesh: null })
  s.vm.setGoTo(0, 190); s.store.state.printer.printer.toolhead.axis_maximum = [180, 174, 160]; s.vm.go()
  expect(s.vm.goTo[0]).toBe(190)
  s.store.state.printer.printer.toolhead.homed_axes = ''; s.vm.go()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled(); s.wrapper.destroy()
})

it('steps diagonally through moveTo, cut at the machine edge', () => {
  const s = show({ head: [195, 100, 10], bedMesh: null })
  s.vm.jogButtons.find((b: { id: string }) => b.id === 'ne').run()
  // Back is Y− on the M1; X stops at 200.
  expect(moves()).toEqual(['G1 X200 Y90 F7800'])
  s.wrapper.destroy()
})

describe('the trackpad', () => {
  it('a pick only sets the target: nothing is sent until Move here', async () => {
    const s = show()
    s.wrapper.findComponent(ControlTrackpad).vm.$emit('pick', { x: 160, y: 120 })
    await s.wrapper.vm.$nextTick()
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    expect(s.wrapper.find('[data-tid="trackpad-target"]').exists()).toBe(true)
    expect(s.wrapper.find('[data-tid="trackpad-note"]').text()).toContain('Straight there')
    await s.wrapper.find('[data-tid="trackpad-move"]').trigger('click')
    expect(moves()).toEqual(['G1 X160 Y120 F7800'])
    expect(s.vm.target).toBeNull()
    s.wrapper.destroy()
  })

  it('dragging moves the pick and sends nothing', async () => {
    const s = show()
    const pad = s.wrapper.findComponent(ControlTrackpad)
    const el = pad.element as HTMLElement
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 368, right: 400, bottom: 368, x: 0, y: 0, toJSON: () => ({}) })
    await pad.trigger('pointerdown', { pointerId: 1, button: 0, pointerType: 'touch', clientX: 100, clientY: 100 })
    for (let x = 110; x < 300; x += 20) await pad.trigger('pointermove', { pointerId: 1, clientX: x, clientY: 150 })
    await pad.trigger('pointerup', { pointerId: 1 })
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    expect(s.vm.target.x).toBeCloseTo(290 / 400 * 200, 0)
    s.wrapper.destroy()
  })

  it('previews a lift across the notch, and the confirmed move lifts first', async () => {
    const s = show({ head: [60, 20, 1] })
    s.vm.pick({ x: 140, y: 20 })
    await s.wrapper.vm.$nextTick()
    expect(s.vm.targetNote).toContain('Lifts to Z 6')
    s.vm.confirmMove()
    expect(moves()).toEqual(['G1 Z6 F600', 'G1 X140 Y20 F7800', 'G1 Z1 F600'])
    s.wrapper.destroy()
  })

  it('refuses a target inside the notch at low Z: Move here is disabled and nothing is sent', async () => {
    const s = show({ head: [60, 100, 1] })
    s.vm.pick({ x: 100, y: 10 })
    await s.wrapper.vm.$nextTick()
    expect(s.vm.targetProblem).toMatch(/over the bed notch/)
    expect(s.wrapper.find('[data-tid="trackpad-move"]').attributes('disabled')).toBeDefined()
    s.vm.confirmMove()
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    s.wrapper.destroy()
  })

  it('allows the same spot once the head is above the traverse height', () => {
    const s = show({ head: [60, 100, 8] })
    s.vm.pick({ x: 100, y: 10 })
    expect(s.vm.targetProblem).toBe('')
    s.vm.confirmMove()
    expect(moves()).toEqual(['G1 X100 Y10 F7800'])
    s.wrapper.destroy()
  })

  it('when the no-go regions cannot be read, a pick cannot be moved to', () => {
    const s = show({ bedMesh: { no_go_region_1_min: 'nonsense', no_go_region_1_max: [125, 34], no_go_traverse_z: 6 } })
    s.vm.pick({ x: 160, y: 120 })
    expect(s.vm.targetProblem).toMatch(/could not be read/)
    s.vm.confirmMove()
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    s.wrapper.destroy()
  })

  it('picks nothing and sends nothing when unhomed or printing, and drops a pick when a print starts', async () => {
    const s = show()
    s.store.state.printer.printer.toolhead.homed_axes = 'z'
    await s.wrapper.vm.$nextTick()
    s.vm.pick({ x: 160, y: 120 })
    expect(s.vm.target).toBeNull()
    s.store.state.printer.printer.toolhead.homed_axes = 'xyz'
    await s.wrapper.vm.$nextTick()
    s.vm.pick({ x: 160, y: 120 })
    expect(s.vm.target).not.toBeNull()
    s.store.getters['printer/getPrinterState'] = 'printing'
    s.store.getters['printer/getPrinterPrinting'] = true
    await s.wrapper.vm.$nextTick()
    expect(s.vm.busy).toBe(true)
    expect(s.vm.target).toBeNull()
    s.vm.target = { x: 160, y: 120 }
    s.vm.confirmMove()
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    s.wrapper.destroy()
  })

  it('waits behind the last hand move: a confirmed pick right after a jog is held, not sent', async () => {
    const s = show()
    s.vm.moveBy('X', 10)
    expect(sent()).toHaveLength(1)
    s.vm.pick({ x: 100, y: 120 })
    s.vm.confirmMove()
    expect(sent()).toHaveLength(1)
    expect(bus.$emit).toHaveBeenCalledWith('Wait for the head to finish moving.', { type: 'warning' })
    s.wrapper.destroy()
  })

  it('drops a pick when the printer changes', async () => {
    const s = show()
    s.vm.pick({ x: 160, y: 120 })
    s.store.state.config.apiUrl = 'http://other.local'
    await s.wrapper.vm.$nextTick()
    expect(s.vm.target).toBeNull()
    s.wrapper.destroy()
  })
})
