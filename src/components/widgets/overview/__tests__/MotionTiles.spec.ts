import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PositionTile from '../tiles/PositionTile.vue'
import ZOffsetTile from '../tiles/ZOffsetTile.vue'
import JogTile from '../tiles/JogTile.vue'
import { resetSocket, sent, tileMount, tileStore } from './fixture'
import { handMoveLock, headStatus, releaseHandMove } from '@/services/control/safe-move'
import { X_RIGHT } from '@/services/machine/orientation'

vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

const m = (C: any, store: ReturnType<typeof tileStore>) => mount(C, tileMount(store))
const seg = (w: any, group: string, label: string) => w.findAll(`[aria-label="${group}"] button`).wrappers.find((b: any) => b.text() === label)
afterEach(() => { resetSocket(); handMoveLock.target = null })

describe('PositionTile', () => {
  it('renders with no data as dashes and not homed', () => {
    const w = m(PositionTile, tileStore({ empty: true }))
    expect(w.text()).toContain('Position')
    expect(w.findAll('[data-tid="axis"]').wrappers.map(a => a.find('b').text())).toEqual(['—', '—', '—'])
    expect(w.find('[data-tid="tile-state"]').text()).toBe('Not homed')
    w.destroy()
  })

  it('shows the live X, Y and Z and that it is homed', () => {
    const w = m(PositionTile, tileStore())
    expect(w.findAll('[data-tid="axis"]').wrappers.map(a => a.find('b').text())).toEqual(['100.0', '87.0', '12.40'])
    expect(w.find('[data-tid="tile-state"]').text()).toBe('Homed')
    w.destroy()
  })

  it('homes from the popover, and refuses while printing', async () => {
    const w = m(PositionTile, tileStore())
    await w.find('[data-tid="tile-door"]').trigger('click')
    await w.find('[data-tid="home-xy"]').trigger('click')
    await w.find('[data-tid="home-z"]').trigger('click')
    await w.find('[data-tid="home-all"]').trigger('click')
    expect(sent()).toEqual(['G28 X Y', 'G28 Z', 'G28'])
    w.destroy()
    resetSocket()
    const busy = m(PositionTile, tileStore({ printing: true }))
    await busy.find('[data-tid="tile-door"]').trigger('click')
    expect(busy.find('[data-tid="home-xy"]').attributes('disabled')).toBeDefined()
    busy.destroy()
  })

  it('keeps endstops and limits behind the three dots', async () => {
    const w = m(PositionTile, tileStore())
    await w.find('[data-tid="tile-more"]').trigger('click')
    expect(w.findAll('[data-menu]').wrappers.map(i => i.attributes('data-menu'))).toEqual(['motors', 'endstops'])
    w.destroy()
  })
})

describe('ZOffsetTile', () => {
  it('renders with no data as 0.000', () => {
    const w = m(ZOffsetTile, tileStore({ empty: true }))
    expect(w.find('[data-tid="zoffset-value"]').text()).toContain('0.000')
    w.destroy()
  })

  it('shows the live offset with a real minus sign', () => {
    const w = m(ZOffsetTile, tileStore())
    expect(w.find('[data-tid="zoffset-value"]').text()).toContain('−0.045')
    w.destroy()
  })

  it('babysteps the nozzle in steps of 0.005 by default, closer and further', async () => {
    headStatus.fresh = true // a nudge closer waits for the head position (KAN-1745)
    const w = m(ZOffsetTile, tileStore())
    await w.find('[data-tid="zoffset-down"]').trigger('click')
    await w.find('[data-tid="zoffset-up"]').trigger('click')
    expect(sent()).toEqual(['SET_GCODE_OFFSET Z_ADJUST=-0.005 MOVE=1', 'SET_GCODE_OFFSET Z_ADJUST=+0.005 MOVE=1'])
    w.destroy()
  })

  it('takes a bigger step from the popover', async () => {
    const w = m(ZOffsetTile, tileStore())
    await w.find('[data-tid="tile-door"]').trigger('click')
    await seg(w, 'Step size', '0.05').trigger('click')
    await w.find('[data-tid="zoffset-up"]').trigger('click')
    expect(sent()).toEqual(['SET_GCODE_OFFSET Z_ADJUST=+0.05 MOVE=1'])
    w.destroy()
  })

  it('refuses when Z is not homed, or the printer is not ready', async () => {
    const store = tileStore()
    store.state.printer.printer.toolhead.homed_axes = 'xy'
    const w = m(ZOffsetTile, store)
    expect(w.find('[data-tid="zoffset-up"]').attributes('disabled')).toBeDefined()
    await w.find('[data-tid="zoffset-up"]').trigger('click')
    expect(sent()).toEqual([])
    w.destroy()
    const off = tileStore()
    Vue.set(off.getters, 'printer/getKlippyReady', false)
    const w2 = m(ZOffsetTile, off)
    expect(w2.find('[data-tid="zoffset-down"]').attributes('disabled')).toBeDefined()
    w2.destroy()
  })

  it('saves to config and runs probe calibration from the three dots only when the printer can', async () => {
    const store = tileStore()
    Vue.set(store.getters, 'printer/getAvailableCommands', { Z_OFFSET_APPLY_PROBE: {}, PROBE_CALIBRATE: {} })
    const w = m(ZOffsetTile, store)
    await w.find('[data-tid="tile-more"]').trigger('click')
    expect(w.findAll('[data-menu]').wrappers.map(i => i.attributes('data-menu'))).toEqual(['save', 'calibrate'])
    await w.find('[data-menu="save"]').trigger('click')
    expect(sent()).toEqual(['Z_OFFSET_APPLY_PROBE'])
    w.destroy()
  })
})

describe('JogTile', () => {
  it('renders with no data, every button locked', () => {
    const w = m(JogTile, tileStore({ empty: true }))
    expect(w.text()).toContain('Jog')
    expect(w.findAll('button[data-jog]:not([data-jog="home"])').wrappers.every(b => b.attributes('disabled') !== undefined)).toBe(true)
    w.destroy()
  })

  it('moves by the chosen step, along the plate directions, right as M1_VIEW draws it', async () => {
    headStatus.fresh = true
    const w = m(JogTile, tileStore())
    // Each hand move waits for the last to land (KAN-1745); the test lands it.
    await w.find('[data-jog="x+"]').trigger('click')
    releaseHandMove()
    await seg(w, 'Step', '10').trigger('click')
    await w.find('[data-jog="x-"]').trigger('click')
    releaseHandMove()
    await w.find('[data-jog="z+"]').trigger('click')
    const lines = sent()
    expect(lines).toHaveLength(3)
    // Right on the pad is X_RIGHT: the same way the Control trackpad and jog keys go.
    expect(lines[0]).toContain(`G1 X${X_RIGHT} F7800`)
    expect(lines[1]).toContain(`G1 X${-10 * X_RIGHT} F7800`)
    expect(lines[2]).toContain('G1 Z10 F600')
    w.destroy()
  })

  it('homes X and Y from the middle button', async () => {
    const w = m(JogTile, tileStore())
    await w.find('[data-jog="home"]').trigger('click')
    expect(sent()).toEqual(['G28 X Y'])
    w.destroy()
  })

  it('refuses to move while printing, when unhomed, or when not ready', async () => {
    const busy = m(JogTile, tileStore({ printing: true }))
    expect(busy.find('[data-jog="x+"]').attributes('disabled')).toBeDefined()
    await busy.find('[data-jog="x+"]').trigger('click')
    busy.destroy()
    const unhomed = tileStore()
    unhomed.state.printer.printer.toolhead.homed_axes = ''
    const u = m(JogTile, unhomed)
    expect(u.find('[data-jog="x+"]').attributes('disabled')).toBeDefined()
    u.destroy()
    expect(sent()).toEqual([])
  })

  it('keeps motors off, extrude and bed screws behind the three dots', async () => {
    const store = tileStore()
    Vue.set(store.getters, 'printer/getAvailableCommands', { BED_SCREWS_ADJUST: {} })
    const w = m(JogTile, store)
    await w.find('[data-tid="tile-more"]').trigger('click')
    expect(w.findAll('[data-menu]').wrappers.map(i => i.attributes('data-menu'))).toEqual(['extrude', 'motors', 'screws'])
    await w.find('[data-menu="motors"]').trigger('click')
    expect(sent()).toEqual(['M84'])
    w.destroy()
  })
})
