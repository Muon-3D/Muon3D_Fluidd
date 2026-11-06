import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ControlMove, { jogLayout, zKeyWords } from '../ControlMove.vue'
import ControlTrackpad from '../ControlTrackpad.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'
import { handMoveLock, headStatus, lockHandMove, scriptsInFlight } from '@/services/control/safe-move'
import { bedToPixel, regionRect } from '@/services/control/trackpad'
import { X_RIGHT, Y_BACK } from '@/services/machine/orientation'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
const bus = vi.hoisted(() => ({ $emit: vi.fn() }))
vi.mock('@/eventBus', () => ({ EventBus: bus }))

const M1_BED_MESH = { no_go_region_1_min: [75, 0], no_go_region_1_max: [125, 34], no_go_boundary_tolerance: 10, no_go_traverse_z: 6 }
const sent = () => socket.printerGcodeScript.mock.calls.map(c => c[0] as string)

function show ({ head = [150, 100, 10] as number[], bedMesh = M1_BED_MESH as unknown, muon = false } = {}) {
  const store = panelStore()
  const p = store.state.printer.printer
  p.toolhead.position = [...head, 0]
  p.gcode_move.gcode_position = [...head, 0]
  p.configfile.settings = bedMesh ? { printer: {}, bed_mesh: bedMesh } : { printer: {} }
  store.getters['server/isMuonPrinter'] = muon
  const wrapper = mount(ControlMove, { propsData: {}, mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } }, $confirm: vi.fn() }, stubs: panelStubs })
  return { store, wrapper, vm: wrapper.vm as any }
}

beforeEach(() => { headStatus.fresh = true; scriptsInFlight.count = 0 })
afterEach(() => { socket.printerGcodeScript.mockClear(); bus.$emit.mockClear(); handMoveLock.target = null; vi.restoreAllMocks() })

describe('the jog pad and the trackpad agree on every direction', () => {
  const bed = { min: [0, -10] as [number, number], max: [200.1, 174.1] as [number, number] }
  const box = { width: 100, height: 100 }

  it('a jog key moves the head on the trackpad the way its arrow points', () => {
    const screen: Record<string, [number, number]> = { nw: [-1, 1], n: [0, 1], ne: [1, 1], w: [-1, 0], e: [1, 0], sw: [-1, -1], s: [0, -1], se: [1, -1] }
    for (const cell of jogLayout()) {
      if (cell.id === 'centre') { expect([cell.dx, cell.dy]).toEqual([0, 0]); continue }
      const [right, back] = screen[cell.id]
      const from = bedToPixel({ x: 100, y: 80 }, bed, box)
      const to = bedToPixel({ x: 100 + cell.dx * 10, y: 80 + cell.dy * 10 }, bed, box)
      // Right on screen is +x pixels; back (up) is −y pixels.
      expect(Math.sign(to.x - from.x)).toBe(right)
      expect(Math.sign(from.y - to.y)).toBe(back)
    }
  })

  it('labels the keys with the axis signs they send', () => {
    const cells = Object.fromEntries(jogLayout().map(c => [c.id, c]))
    expect(cells.n.text).toBe(`Y${Y_BACK > 0 ? '+' : '−'}`)
    expect(cells.e.text).toBe(`X${X_RIGHT > 0 ? '+' : '−'}`)
    expect(cells.e.label).toBe(`Head right (X${X_RIGHT > 0 ? '+' : '−'})`)
    expect(cells.ne.label).toBe('Head back and right')
  })

  it('draws the M1 notch (x 75–125, y 0–34, the middle of Y=0) on the edge "Head back" moves toward', () => {
    const r = regionRect({ min: [75, 0], max: [125, 34] }, bed, box)
    const back = jogLayout().find(c => c.id === 'n')!
    // Head back steps Y toward 0 (Y_BACK), and Y=0 is drawn at the top: the notch touches the top edge.
    expect(Math.sign(back.dy)).toBe(-1)
    expect(Math.abs(r.top - bedToPixel({ x: 0, y: 0 }, bed, box).y)).toBeLessThan(1e-9)
    expect(r.top).toBeLessThan(10)
    // Centred on x 100.
    expect(Math.abs(r.left + r.width / 2 - bedToPixel({ x: 100, y: 0 }, bed, box).x)).toBeLessThan(1e-9)
  })

  it('the centre of the pad is an inert dot, not a button', () => {
    const s = show()
    expect(s.wrapper.find('[data-tid="jog-centre"]').element.tagName).toBe('SPAN')
    expect(s.wrapper.findAll('.move__xy button')).toHaveLength(8)
    expect(s.wrapper.find('[aria-label="Home X and Y"].move__b').exists()).toBe(false)
    s.wrapper.destroy()
  })
})

describe('the Z keys and Z offset follow the Muon gate', () => {
  it('names the plate on a Muon printer, keeping the axis in the tooltip', () => {
    expect(zKeyWords(true, 'up')).toEqual({
      up: { text: 'Plate up', label: 'Plate up (Z+)', title: 'Z+' },
      down: { text: 'Plate down', label: 'Plate down (Z−)', title: 'Z−' }
    })
    expect(zKeyWords(true, 'down').up.text).toBe('Plate down')
    expect(zKeyWords(false).up.text).toBe('Z+')
  })

  it('a Muon printer has no Z offset anywhere on the tile', () => {
    const s = show({ muon: true })
    expect(s.vm.muonPrinter).toBe(true)
    expect(s.wrapper.find('[data-tid="menu-zoffset"]').exists()).toBe(false)
    expect(s.wrapper.find('[data-tid="jog-z-up"]').text()).toBe('Plate up')
    s.wrapper.destroy()
  })

  it('a printer that is not a Muon has Z offset in the ··· menu', async () => {
    const s = show({ muon: false })
    expect(s.vm.muonPrinter).toBe(false)
    await s.wrapper.find('[data-tid="menu-zoffset"]').trigger('click')
    expect(s.wrapper.find('[data-tid="control-zoffset"]').exists()).toBe(true)
    expect(s.wrapper.find('[data-tid="jog-z-up"]').text()).toBe('Z+')
    s.wrapper.destroy()
  })

  it('motors off is only in the menu', () => {
    const s = show()
    const off = s.wrapper.findAll('[data-tid="motors-off"]')
    expect(off).toHaveLength(1)
    expect(off.at(0).attributes('role')).toBe('menuitem')
    s.wrapper.destroy()
  })
})

describe('KAN-1745', () => {
  it('a diagonal is refused while the last hand move is still on its way, with no no-go regions too', () => {
    const s = show({ head: [140, 100, 10], bedMesh: null })
    lockHandMove([150, 100, 10], s.vm.panelTarget)
    s.vm.jogButtons.find((b: { id: string }) => b.id === 'ne').run()
    expect(sent()).toEqual([])
    expect(bus.$emit).toHaveBeenCalledWith('Wait for the head to finish moving.', { type: 'warning' })
    s.wrapper.destroy()
  })

  it('a lifted plan waits for a lagging position, then is planned from the commanded one', () => {
    // Sent to 60,20 low down; the printer still reports 40,20.
    const s = show({ head: [40, 20, 1] })
    lockHandMove([60, 20, 1], s.vm.panelTarget)
    expect(s.vm.moveTo({ X: 140, Y: 20 })).toBe(false)
    expect(sent()).toEqual([])
    s.store.state.printer.printer.toolhead.position = [60, 20, 1, 0]
    s.store.state.printer.printer.gcode_move.gcode_position = [60, 20, 1, 0]
    expect(s.vm.moveTo({ X: 140, Y: 20 })).toBe(true)
    expect(sent()).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG90\nG1 Z6 F600\nG1 X140 Y20 F7800\nG1 Z1 F600\nRESTORE_GCODE_STATE NAME=_ui_movement'])
    s.wrapper.destroy()
  })

  it('every hand move locks the next, with no no-go regions too', () => {
    const s = show({ bedMesh: null })
    s.vm.moveBy('X', 10)
    s.vm.moveBy('X', 10)
    expect(sent()).toHaveLength(1)
    expect(handMoveLock.target).toEqual([160, 100, 10])
    s.wrapper.destroy()
  })

  it('a nudge of the Z offset closer waits for a hand move in flight', () => {
    const s = show({ bedMesh: null })
    lockHandMove([150, 100, 20], s.vm.panelTarget)
    s.vm.adjustZ(-0.05)
    expect(sent()).toEqual([])
    s.vm.adjustZ(0.05)
    expect(sent()).toEqual(['SET_GCODE_OFFSET Z_ADJUST=+0.05 MOVE=1'])
    s.wrapper.destroy()
  })

  it('the pick timer is cleared on destroy', async () => {
    const clear = vi.spyOn(window, 'clearInterval')
    const s = show()
    s.wrapper.findComponent(ControlTrackpad).vm.$emit('pick', { x: 160, y: 120 })
    await s.wrapper.vm.$nextTick()
    const id = s.vm.ticker
    expect(id).not.toBeNull()
    s.wrapper.destroy()
    expect(clear).toHaveBeenCalledWith(id)
  })
})

describe('live drag', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('a drag sends through moveTo, holds the rest while the move is in flight, and the final point on release', async () => {
    const s = show({ head: [100, 100, 10] })
    const pad = s.wrapper.findComponent(ControlTrackpad)
    pad.vm.$emit('drag-start', { x: 110, y: 100 })
    pad.vm.$emit('drag', { x: 120, y: 100 })
    pad.vm.$emit('drag', { x: 130, y: 105 })
    expect(sent()).toEqual(['SAVE_GCODE_STATE NAME=_ui_movement\nG90\nG1 X110 Y100 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement'])
    pad.vm.$emit('drag-end')
    const p = s.store.state.printer.printer
    p.toolhead.position = [110, 100, 10, 0]
    p.gcode_move.gcode_position = [110, 100, 10, 0]
    vi.advanceTimersByTime(300)
    expect(sent()[1]).toBe('SAVE_GCODE_STATE NAME=_ui_movement\nG90\nG1 X130 Y105 F7800\nRESTORE_GCODE_STATE NAME=_ui_movement')
    vi.advanceTimersByTime(2000)
    expect(sent()).toHaveLength(2)
    s.wrapper.destroy()
  })

  it('a drag into the notch low down stops and says why; a cancelled drag sends nothing more', async () => {
    const s = show({ head: [60, 100, 1] })
    const pad = s.wrapper.findComponent(ControlTrackpad)
    pad.vm.$emit('drag-start', { x: 100, y: 15 })
    await s.wrapper.vm.$nextTick()
    expect(sent()).toEqual([])
    expect(s.vm.dragRefusal).toMatch(/over the bed notch/)
    expect(s.wrapper.find('[data-tid="trackpad-note"]').text()).toMatch(/^Stopped following\./)
    pad.vm.$emit('drag', { x: 160, y: 100 })
    pad.vm.$emit('drag-end')
    vi.advanceTimersByTime(1000)
    expect(sent()).toEqual([])

    pad.vm.$emit('drag-start', { x: 60, y: 120 })
    expect(sent()).toHaveLength(1)
    pad.vm.$emit('drag', { x: 60, y: 140 })
    pad.vm.$emit('drag-cancel')
    s.store.state.printer.printer.gcode_move.gcode_position = [60, 120, 1, 0]
    vi.advanceTimersByTime(1000)
    expect(sent()).toHaveLength(1)
    s.wrapper.destroy()
  })

  it('a print starting or homing lost stops following at once', () => {
    const s = show({ head: [100, 100, 10] })
    const pad = s.wrapper.findComponent(ControlTrackpad)
    pad.vm.$emit('drag-start', { x: 110, y: 100 })
    pad.vm.$emit('drag', { x: 150, y: 100 })
    s.store.state.printer.printer.toolhead.homed_axes = ''
    return s.wrapper.vm.$nextTick().then(() => {
      s.store.state.printer.printer.gcode_move.gcode_position = [110, 100, 10, 0]
      vi.advanceTimersByTime(1000)
      expect(sent()).toHaveLength(1)
      expect(s.vm.follower.following).toBe(false)
      s.wrapper.destroy()
    })
  })
})
