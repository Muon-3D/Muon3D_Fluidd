import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ExtruderSelection from '../ExtruderSelection.vue'
import ExtruderStepperSync from '../ExtruderStepperSync.vue'
import ToolheadControlBarsStepper from '../ToolheadControlBarsStepper.vue'
import ToolheadControlCross from '../ToolheadControlCross.vue'
import ToolheadControlCircle from '../ToolheadControlCircle.vue'
import ToolheadPosition from '../ToolheadPosition.vue'
import ToolheadCard from '../ToolheadCard.vue'
import SpoolSelectionDialog from '@/components/widgets/spoolman/SpoolSelectionDialog.vue'

const socket = vi.hoisted(() => ({ printerGcodeScript: vi.fn().mockResolvedValue(undefined), serverSpoolmanPostSpoolId: vi.fn() }))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock', printerHomePath: () => '/' }))
vi.mock('@/services/muon-access/api', () => ({ currentPrinterAccess: () => ({ capabilities: vi.fn().mockResolvedValue({}) }) }))
vi.mock('@/services/dev-mode/state', () => ({ devModeState: { enabled: null }, refreshDevMode: vi.fn().mockResolvedValue(false) }))

/** The controls Klipper#112 gates, each with the way to make it send. */
interface Case { name: string; component: any; props?: any; send: (vm: any) => void; gcode: RegExp }

const cases: Case[] = [
  { name: 'ACTIVATE_EXTRUDER', component: ExtruderSelection, send: vm => { vm.extruder = 'extruder1' }, gcode: /ACTIVATE_EXTRUDER/ },
  {
    name: 'SET_STEPPER_ENABLE',
    component: ExtruderStepperSync,
    props: { extruderStepper: { key: 'extruder_stepper a', name: 'a', enabled: true, motion_queue: null, config: {} } },
    send: vm => vm.sendSetStepperEnable(false),
    gcode: /SET_STEPPER_ENABLE/
  },
  {
    name: 'FORCE_MOVE (stepper bars)',
    component: ToolheadControlBarsStepper,
    props: { stepper: { key: 'stepper_x', prettyName: 'X' } },
    send: vm => vm.sendForceMoveGcode(10),
    gcode: /FORCE_MOVE/
  },
  { name: 'FORCE_MOVE (cross)', component: ToolheadControlCross, send: vm => vm.moveAxisBy('X', 10), gcode: /FORCE_MOVE/ },
  { name: 'FORCE_MOVE (circle)', component: ToolheadControlCircle, send: vm => vm.moveAxisBy('X', 10), gcode: /FORCE_MOVE/ },
  { name: 'FORCE_MOVE (position)', component: ToolheadPosition, send: vm => vm.moveAxisTo('X', '50'), gcode: /FORCE_MOVE/ }
]

function store (muonGuard: any, components: string[] = ['muon_access']) {
  const printer = Vue.observable<any>({
    toolhead: { position: [10, 10, 10, 0], max_accel: 1000, extruder: 'extruder', homed_axes: 'xyz' },
    gcode_move: { absolute_coordinates: true, gcode_position: [10, 10, 10, 0] },
    ...(muonGuard === undefined ? {} : { muon_guard: muonGuard })
  })
  return {
    state: {
      printer: { printer },
      config: { uiSettings: { general: { defaultToolheadXYSpeed: 130, defaultToolheadZSpeed: 10, axis: { x: {}, y: {}, z: {} }, forceMoveToggleWarning: false }, toolhead: { forceMove: true }, spoolman: {} } },
      spoolman: { dialog: { targetMacro: 'T0', filename: '' } }
    },
    getters: {
      'printer/getKlippyReady': true,
      'printer/getPrinterState': 'ready',
      'printer/getPrinterSettings': () => 100,
      'printer/getExtruders': [{ key: 'extruder', name: 'E0' }, { key: 'extruder1', name: 'E1' }],
      'printer/getPrinterConfig': () => ({}),
      'server/isMuonPrinter': components.some(c => c.startsWith('muon_')),
      'server/componentSupport': (c: string) => components.includes(c),
      'wait/hasWait': () => false,
      'macros/getMacroByName': () => undefined
    } as Record<string, any>,
    dispatch: vi.fn(),
    commit: vi.fn()
  }
}

const mocks = (s: any) => ({ $store: s, $waits: {}, $t: (k: string) => k, $tc: (k: string) => k, $vuetify: { breakpoint: {} } })

afterEach(() => { vi.clearAllMocks() })

describe.each(cases)('$name', c => {
  const run = (s: any) => {
    const sendGcode = vi.fn()
    const wrapper = shallowMount(c.component, {
      propsData: c.props,
      mocks: mocks(s),
      methods: { sendGcode, sendMoveGcode: vi.fn() } as any,
      // The logic is under test, not the layout, which needs a whole printer.
      render: (h: any) => h('div')
    } as any)
    c.send(wrapper.vm)
    wrapper.destroy()
    return sendGcode.mock.calls.map(x => String(x[0]))
  }

  it('sends nothing when muon_guard says dev mode is off', () => {
    expect(run(store({ dev_mode: false })).filter(g => c.gcode.test(g))).toEqual([])
  })

  it('sends it when muon_guard says dev mode is on', () => {
    expect(run(store({ dev_mode: true })).some(g => c.gcode.test(g))).toBe(true)
  })

  it('sends it on a printer known not to be Muon', () => {
    expect(run(store(undefined, ['file_manager'])).some(g => c.gcode.test(g))).toBe(true)
  })

  it('treats a Muon printer with no muon_guard and no answer as not dev mode', () => {
    expect(run(store(undefined)).filter(g => c.gcode.test(g))).toEqual([])
  })
})

describe('the notes', () => {
  const mount = (component: any, s: any) => shallowMount(component, {
    mocks: mocks(s),
    stubs: { DevOnlyNote: { template: '<i data-tid="dev-only-note" />' } }
  })

  it('the extruder picker is disabled with the note outside dev mode, and free inside it', () => {
    const off = mount(ExtruderSelection, store({ dev_mode: false }))
    expect(off.find('[data-tid="dev-only-note"]').exists()).toBe(true)
    expect(off.find('v-select-stub').attributes('disabled')).toBeTruthy()
    const on = mount(ExtruderSelection, store({ dev_mode: true }))
    expect(on.find('[data-tid="dev-only-note"]').exists()).toBe(false)
    expect(on.find('v-select-stub').attributes('disabled')).toBeFalsy()
  })

  it('the FORCE_MOVE toggle in the toolhead menu does nothing outside dev mode', async () => {
    const off = store({ dev_mode: false })
    const wrapper = shallowMount(ToolheadCard, { mocks: mocks(off), render: (h: any) => h('div') } as any)
    expect((wrapper.vm as any).devOnlyLocked).toBe(true)
    await (wrapper.vm as any).toggleForceMove()
    expect(off.dispatch).not.toHaveBeenCalled()
    const on = store({ dev_mode: true })
    const free = shallowMount(ToolheadCard, { mocks: mocks(on), render: (h: any) => h('div') } as any)
    await (free.vm as any).toggleForceMove()
    expect(on.dispatch).toHaveBeenCalled()
  })

  it('the spool picker for a macro is locked outside dev mode, and sends nothing', async () => {
    const off = shallowMount(SpoolSelectionDialog, { mocks: mocks(store({ dev_mode: false })), render: (h: any) => h('div') } as any)
    expect((off.vm as any).macroSelectLocked).toBe(true)
    await (off.vm as any).handleSelectSpool()
    expect(socket.printerGcodeScript).not.toHaveBeenCalled()
  })

  it('the spool picker for a macro sends its variables in dev mode', async () => {
    const on = shallowMount(SpoolSelectionDialog, { mocks: { ...mocks(store({ dev_mode: true })), $confirm: vi.fn().mockResolvedValue(true) }, render: (h: any) => h('div') } as any)
    expect((on.vm as any).macroSelectLocked).toBe(false)
    await (on.vm as any).handleSelectSpool()
    expect(socket.printerGcodeScript.mock.calls[0][0]).toContain('SET_GCODE_VARIABLE MACRO=T0')
  })
})
