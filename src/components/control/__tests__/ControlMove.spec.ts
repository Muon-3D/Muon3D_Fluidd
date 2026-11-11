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

function show ({ head = [150, 100, 10] as [number, number, number], phone = false, trackpadOnly = false, bedMesh = M1_BED_MESH as unknown, confirm = vi.fn().mockResolvedValue(true) } = {}) {
  const store = panelStore()
  const p = store.state.printer.printer
  p.toolhead.position = [...head, 0]
  p.gcode_move.gcode_position = [...head, 0]
  p.configfile.settings = bedMesh ? { printer: {}, bed_mesh: bedMesh } : { printer: {} }
  const wrapper = mount(ControlMove, { propsData: { phone, trackpadOnly }, mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } }, $confirm: confirm }, stubs: panelStubs })
  return { store, wrapper, vm: wrapper.vm as any, confirm }
}

beforeEach(() => { headStatus.fresh = true; scriptsInFlight.count = 0; localStorage.clear() })
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

it('Go to turns the readout into fields and goes there through moveTo', async () => {
  const s = show({ bedMesh: null })
  await s.wrapper.find('[data-tid="move-goto"]').trigger('click')
  const x = s.wrapper.find('input[aria-label="X to go to"]')
  await x.setValue('120'); await x.trigger('keydown.enter')
  await s.wrapper.find('[data-tid="move-go-form"]').trigger('submit')
  // Only the changed axis is sent, at the head's speed.
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

it('steps diagonally, cut at the machine edge', () => {
  const s = show({ head: [195, 100, 10], bedMesh: null })
  s.vm.jogButtons.find((b: { id: string }) => b.id === 'ne').run()
  // Back is Y− on the M1; X stops at 200.
  expect(moves()).toEqual(['G1 X5 Y-10 F7800'])
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

  it('a drag streams the pick through moveTo: one move in flight, the rest wait for it to land', async () => {
    const s = show()
    const pad = s.wrapper.findComponent(ControlTrackpad)
    const el = pad.element as HTMLElement
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 368, right: 400, bottom: 368, x: 0, y: 0, toJSON: () => ({}) })
    await pad.trigger('pointerdown', { pointerId: 1, button: 0, pointerType: 'touch', clientX: 100, clientY: 100 })
    for (let x = 110; x < 300; x += 20) await pad.trigger('pointermove', { pointerId: 1, clientX: x, clientY: 150 })
    await pad.trigger('pointerup', { pointerId: 1 })
    // The press only picked; the first move past the slop went at once, the rest wait for it to land.
    expect(moves()).toHaveLength(1)
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

  it('waits behind the last hand move: Move here is disabled and says why, and the pick stays', async () => {
    const s = show()
    s.vm.moveBy('X', 10)
    expect(sent()).toHaveLength(1)
    s.vm.pick({ x: 100, y: 120 })
    await s.wrapper.vm.$nextTick()
    expect(s.vm.canConfirm).toBe(false)
    expect(s.wrapper.find('[data-tid="trackpad-move"]').attributes('disabled')).toBeDefined()
    expect(s.wrapper.find('[data-tid="trackpad-note"]').text()).toBe('Wait for the head to finish moving.')
    s.vm.confirmMove()
    expect(sent()).toHaveLength(1)
    expect(s.vm.target).not.toBeNull()
    // The head arrives: Move here goes.
    s.store.state.printer.printer.toolhead.position = [160, 100, 10, 0]
    s.store.state.printer.printer.gcode_move.gcode_position = [160, 100, 10, 0]
    s.vm.tick++ // what the page's ticker does every 250 ms while a pick is shown
    await s.wrapper.vm.$nextTick()
    expect(s.vm.canConfirm).toBe(true)
    s.vm.confirmMove()
    expect(moves()).toEqual(['G1 X10 F7800', 'G1 X100 Y120 F7800'])
    s.wrapper.destroy()
  })

  it('keeps the pick when the move is refused at send time, and a second press sends nothing more', async () => {
    const s = show({ bedMesh: null })
    s.vm.pick({ x: 160, y: 120 })
    s.vm.confirmMove(); s.vm.confirmMove()
    expect(moves()).toEqual(['G1 X160 Y120 F7800'])
    expect(s.vm.target).toBeNull()
    s.wrapper.destroy()
  })

  it('drops the pick when homing is lost', async () => {
    const s = show()
    s.vm.pick({ x: 160, y: 120 })
    s.store.state.printer.printer.toolhead.homed_axes = ''
    await s.wrapper.vm.$nextTick()
    expect(s.vm.target).toBeNull()
    expect(s.wrapper.find('[data-tid="trackpad-move"]').exists()).toBe(false)
    s.vm.target = { x: 160, y: 120 }; s.vm.confirmMove()
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    s.wrapper.destroy()
  })

  it('says the lift height in real Z, as the refusal does, when a G-code Z offset is in force', async () => {
    const s = show({ head: [60, 20, 1] })
    // Real Z 1, G-code Z 0.8: 0.2 mm of offset in force.
    s.store.state.printer.printer.gcode_move.gcode_position = [60, 20, 0.8, 0]
    s.vm.pick({ x: 140, y: 20 })
    await s.wrapper.vm.$nextTick()
    expect(s.vm.targetNote).toBe('Lifts to Z 6 first, to cross the no-go region')
    s.vm.confirmMove()
    expect(moves()).toEqual(['G1 Z5.8 F600', 'G1 X140 Y20 F7800', 'G1 Z0.8 F600'])
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

it('steps a diagonal as a relative move from the toolhead position, so a lagging G-code position cannot swallow it', () => {
  const s = show({ bedMesh: null })
  // The toolhead has the last step; gcode_position has not caught up.
  s.store.state.printer.printer.toolhead.position = [160, 90, 10, 0]
  s.store.state.printer.printer.gcode_move.gcode_position = [150, 100, 10, 0]
  s.vm.step = 10
  s.vm.jogButtons.find((b: { id: string }) => b.id === 'ne').run()
  expect(sent()).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG91\nG1 X10 Y-10 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
  s.wrapper.destroy()
})

it('a diagonal that would end in the notch low down is refused through the planner, and one across it lifts', () => {
  const into = show({ head: [70, 40, 1] })
  into.vm.step = 10
  into.vm.jogButtons.find((b: { id: string }) => b.id === 'ne').run()
  expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  expect(bus.$emit).toHaveBeenCalledWith(expect.stringContaining('bed notch'), { type: 'warning' })
  into.wrapper.destroy()
  const across = show({ head: [70, 40, 1] })
  across.vm.step = 50
  across.vm.jogButtons.find((b: { id: string }) => b.id === 'se').run()
  // Forward is Y+ on the M1: 70,40 → 120,90 clips the notch's tolerance band low down.
  expect(moves()[0]).toMatch(/^G1 Z6(\.\d+)? F600$/)
  expect(moves().slice(1)).toEqual(['G1 X120 Y90 F7800', 'G1 Z1 F600'])
  across.wrapper.destroy()
})

it('Motors off sends M84 at once, and is only in the menu', async () => {
  const s = show()
  const motors = s.wrapper.find('[data-tid="motors-off"]')
  expect(motors.attributes('role')).toBe('menuitem')
  expect(motors.element.closest('.move__bar')).toBeNull()
  expect(s.wrapper.find('.move__homes [data-tid="home-z"]').exists()).toBe(true)
  await motors.trigger('click')
  expect(sent()).toEqual(['M84'])
  expect(s.confirm).not.toHaveBeenCalled()
  s.wrapper.destroy()
})

it('has no Home Z between Z+ and Z−: the live Z readout is there; Home Z is in the homing bar', () => {
  const s = show()
  expect(s.wrapper.findAll('.move__zcol button').length).toBe(2)
  expect(s.wrapper.find('.move__zcol [data-tid="pos-z"]').exists()).toBe(true)
  expect(s.wrapper.findAll('[data-tid="home-z"]').length).toBe(1)
  expect(s.wrapper.find('[data-tid="home-z"]').element.closest('.move__homes')).not.toBeNull()
  s.wrapper.destroy()
})

it('offers the step sizes set in Settings › Moving and extruding, for the head and the plate', () => {
  const s = show({})
  s.store.state.config.uiSettings = { general: { toolheadXYMoveDistances: [5, 25], toolheadZMoveDistances: [0.2, 5] } }
  expect(s.vm.stepOptions.map((o: { value: number }) => o.value)).toEqual([0.2, 5, 25])
  s.wrapper.destroy()
})

describe('the Overview Trackpad: one move, when the pointer lifts', () => {
  const padOf = (s: ReturnType<typeof show>) => {
    const pad = s.wrapper.findComponent(ControlTrackpad)
    ;(pad.element as HTMLElement).getBoundingClientRect = () => ({ left: 0, top: 0, width: 400, height: 368, right: 400, bottom: 368, x: 0, y: 0, toJSON: () => ({}) })
    return pad
  }

  it('has no Move here button', () => {
    const s = show({ trackpadOnly: true })
    expect(s.wrapper.find('[data-tid="trackpad-move"]').exists()).toBe(false)
    expect(s.wrapper.text()).not.toContain('Move here')
    s.wrapper.destroy()
  })

  it('sends nothing while the pointer is down or dragging, and exactly one move when it lifts', async () => {
    const s = show({ trackpadOnly: true })
    const pad = padOf(s)
    await pad.trigger('pointerdown', { pointerId: 1, button: 0, pointerType: 'touch', clientX: 100, clientY: 100 })
    for (let x = 110; x < 300; x += 20) await pad.trigger('pointermove', { pointerId: 1, clientX: x, clientY: 150 })
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    await pad.trigger('pointerup', { pointerId: 1 })
    expect(moves()).toHaveLength(1)
    expect(moves()[0]).toMatch(/^G1 X14\d(\.\d+)? Y\d+(\.\d+)? F7800$/)
    s.wrapper.destroy()
  })

  it('a tap is one move, on release', async () => {
    const s = show({ trackpadOnly: true })
    const pad = padOf(s)
    await pad.trigger('pointerdown', { pointerId: 1, button: 0, pointerType: 'mouse', clientX: 200, clientY: 184 })
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    await pad.trigger('pointerup', { pointerId: 1 })
    expect(moves()).toHaveLength(1)
    s.wrapper.destroy()
  })

  it('a cancelled press sends nothing and leaves no pick', async () => {
    const s = show({ trackpadOnly: true })
    const pad = padOf(s)
    await pad.trigger('pointerdown', { pointerId: 1, button: 0, pointerType: 'touch', clientX: 100, clientY: 100 })
    await pad.trigger('pointermove', { pointerId: 1, clientX: 200, clientY: 160 })
    await pad.trigger('pointercancel', { pointerId: 1 })
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    expect(s.vm.target).toBeNull()
    s.wrapper.destroy()
  })

  it('the move on release still lifts across the notch (the planner, not a raw G1)', async () => {
    const s = show({ trackpadOnly: true, head: [60, 20, 1] })
    s.vm.pick({ x: 140, y: 20 })
    s.vm.release()
    expect(moves()).toEqual(['G1 Z6 F600', 'G1 X140 Y20 F7800', 'G1 Z1 F600'])
    s.wrapper.destroy()
  })

  it('refuses a spot inside the notch at low Z on release, and sends nothing', async () => {
    const s = show({ trackpadOnly: true, head: [60, 100, 1] })
    s.vm.pick({ x: 100, y: 10 })
    s.vm.release()
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    s.wrapper.destroy()
  })

  it('Enter on the pad moves to the keyboard pick, once', async () => {
    const s = show({ trackpadOnly: true })
    const pad = padOf(s)
    await pad.trigger('keydown', { key: 'ArrowRight' })
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
    await pad.trigger('keydown', { key: 'Enter' })
    expect(moves()).toHaveLength(1)
    s.wrapper.destroy()
  })

  it('Live is shown but disabled, with the reason; On release is the one chosen, and a remembered live is ignored', async () => {
    localStorage.setItem('m3d.trackpad.mode', 'live')
    const s = show({ trackpadOnly: true })
    const live = s.wrapper.find('[data-tid="trackpad-live"]')
    expect(live.attributes('disabled')).toBeDefined()
    expect(live.attributes('title')).toBe('Live moving arrives with a printer update')
    expect(s.wrapper.find('[data-tid="trackpad-release"]').attributes('aria-checked')).toBe('true')
    await live.trigger('click')
    expect(s.vm.mode).toBe('release')
    s.wrapper.destroy()
  })
})
