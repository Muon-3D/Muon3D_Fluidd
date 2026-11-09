import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const gate = vi.hoisted(() => ({ muon: true as boolean | null, dev: false }))
vi.mock('@/mixins/muon-gates', async () => {
  const { Component, Vue: V } = await import('vue-property-decorator')
  return {
    default: Component(class extends V {
      get isMuonPrinter () { return gate.muon }
      get devModeEnabled () { return gate.dev }
    })
  }
})

const { default: ToolheadSettings } = await import('../ToolheadSettings.vue')
const { default: NumberField } = await import('@/components/control/NumberField.vue')
const { defaultState } = await import('@/store/config/state')

function show ({ muon = true as boolean | null, dev = false, settings = {} as Record<string, unknown>, confirm = true } = {}) {
  gate.muon = muon
  gate.dev = dev
  const general = Vue.observable({ ...defaultState().uiSettings.general, instanceName: 'Boxwood' })
  const config: Record<string, unknown> = { 'printer.max_velocity': 300, 'force_move.enable_force_move': true, ...settings }
  const $store = {
    state: { socket: { open: true }, config: { uiSettings: { general } }, printer: { printer: { toolhead: { max_velocity: 300 } } } },
    getters: {
      'config/getDisplayName': 'Boxwood',
      'printer/getPrinterSettings': (path: string) => config[path]
    },
    dispatch: vi.fn()
  }
  const $confirm = vi.fn().mockResolvedValue(confirm)
  const wrapper = mount(ToolheadSettings as any, {
    mocks: { $store, $confirm },
    stubs: {
      'frame-icon': true,
      'locked-row': { props: ['label', 'reasonText'], template: '<div class="locked" :data-label="label">{{ label }} — {{ reasonText }}</div>' }
    }
  })
  const saved = () => $store.dispatch.mock.calls.map(([, p]) => p)
  const field = (label: string) => wrapper.findAllComponents(NumberField).wrappers.find(w => w.props('label') === label)
  const locks = () => wrapper.findAll('.locked').wrappers.map(w => w.attributes('data-label'))
  return { wrapper, saved, field, locks, $confirm }
}

const mounted: Array<{ destroy: () => void }> = []
afterEach(() => mounted.splice(0).forEach(w => w.destroy()))
const track = <T extends { wrapper: { destroy: () => void } }>(s: T): T => { mounted.push(s.wrapper); return s }

describe('Settings › Moving and extruding', () => {
  it('on a Muon printer: the callout, Gentle/Normal/Fast from max_velocity, the M1 caps and the locked rows', async () => {
    const s = track(show())
    expect(s.wrapper.get('[data-tid="moving-muon-callout"]').text()).toBe('Boxwood is a Muon printer. Speeds stay inside what the M1 is built for. Anything that could damage it is under Developer mode.')
    const presets = s.wrapper.get('[data-tid="moving-head-presets"]').findAll('button')
    expect(presets.wrappers.map(b => [b.text(), b.attributes('title')])).toEqual([['Gentle', '75 mm/s'], ['Normal', '150 mm/s'], ['Fast', '240 mm/s']])
    await presets.at(2).trigger('click')
    expect(s.saved()).toContainEqual({ path: 'uiSettings.general.defaultToolheadXYSpeed', value: 240, server: true })
    expect(s.field('Length per press')?.props('max')).toBe(50)
    expect(s.field('Extrude speed')?.props('max')).toBe(8)
    expect(s.field('Plate speed')).toBeUndefined()
    expect(s.field('Head speed')).toBeUndefined()
    expect(s.locks()).toEqual(['Reverse X or Y', 'Plate speed', 'Speeds above the M1\'s limits', 'Move without homing (FORCE_MOVE)'])
    expect(s.wrapper.text()).toContain('An M1\'s directions are fixed. Only for a modified machine.')
    expect(s.wrapper.find('[data-tid="moving-reverse-x"]').exists()).toBe(false)
    expect(s.wrapper.find('[data-tid="moving-reverse-z"]').exists()).toBe(false)
    expect(s.wrapper.text()).toContain('From the material')
  })

  it('reads the extrude caps from the printer\'s config before the M1 defaults, and locks FORCE_MOVE only where the printer has it', () => {
    const s = track(show({ settings: { 'extruder.max_extrude_only_distance': 30, 'extruder.max_extrude_only_velocity': 6, 'force_move.enable_force_move': false } }))
    expect(s.field('Length per press')?.props('max')).toBe(30)
    expect(s.field('Extrude speed')?.props('max')).toBe(6)
    expect(s.locks()).not.toContain('Move without homing (FORCE_MOVE)')
  })

  it('counts a printer whose server info hasn\'t loaded as Muon', () => {
    const s = track(show({ muon: null }))
    expect(s.wrapper.find('[data-tid="moving-muon-callout"]').exists()).toBe(true)
    expect(s.locks()).toHaveLength(4)
  })

  it('with developer mode on a Muon printer: the locked rows are real controls', () => {
    const s = track(show({ dev: true }))
    expect(s.locks()).toEqual([])
    expect(s.wrapper.find('[data-tid="moving-reverse-x"]').exists()).toBe(true)
    expect(s.wrapper.find('[data-tid="moving-reverse-z"]').exists()).toBe(false)
    expect(s.field('Plate speed')?.props('max')).toBe(300)
    expect(s.field('Head speed')?.props('max')).toBe(300)
    expect(s.field('Length per press')?.props('max')).toBe(200)
    expect(s.wrapper.find('[data-tid="moving-force-move"]').exists()).toBe(true)
  })

  it('on another printer: plain fields capped at its own limits, Reverse X and Y only, no callout or locks', () => {
    const s = track(show({ muon: false, settings: { 'printer.max_velocity': 500, 'printer.max_z_velocity': 20 } }))
    expect(s.wrapper.find('[data-tid="moving-muon-callout"]').exists()).toBe(false)
    expect(s.wrapper.find('[data-tid="moving-developer"]').exists()).toBe(false)
    expect(s.locks()).toEqual([])
    expect(s.field('Head speed')?.props('max')).toBe(500)
    expect(s.field('Plate speed')?.props('max')).toBe(20)
    expect(s.field('Length per press')?.props('max')).toBe(200)
    expect(s.wrapper.findAll('[data-tid^="moving-reverse-"]').wrappers.map(w => w.attributes('data-tid'))).toEqual(['moving-reverse-x', 'moving-reverse-y'])
    expect(s.wrapper.find('[data-tid="moving-force-move"]').exists()).toBe(true)
  })

  it('asks before reversing an axis, and leaves it as it was when the answer is no', async () => {
    const no = track(show({ muon: false, confirm: false }))
    const box = no.wrapper.get('[data-tid="moving-reverse-x"]')
    ;(box.element as HTMLInputElement).checked = true
    await box.trigger('change')
    await new Promise(resolve => setTimeout(resolve))
    expect(no.$confirm).toHaveBeenCalledWith('Moves will go the other way.', expect.objectContaining({ title: 'Reverse X?' }))
    expect((box.element as HTMLInputElement).checked).toBe(false)
    expect(no.saved()).toEqual([])

    const yes = track(show({ muon: false }))
    const y = yes.wrapper.get('[data-tid="moving-reverse-y"]')
    ;(y.element as HTMLInputElement).checked = true
    await y.trigger('change')
    await new Promise(resolve => setTimeout(resolve))
    expect(yes.saved()).toEqual([{ path: 'uiSettings.general.axis.y.inverted', value: true, server: true }])
  })

  it('saves a step size added with +', async () => {
    const s = track(show())
    await s.wrapper.get('[data-tid="moving-steps-head-add"]').trigger('click')
    const input = s.wrapper.get('[data-tid="moving-steps-head-input"]')
    await input.setValue('5')
    await input.trigger('keydown.enter')
    expect(s.saved()).toEqual([{ path: 'uiSettings.general.toolheadXYMoveDistances', value: [1, 5, 10, 50], server: true }])
  })
})
