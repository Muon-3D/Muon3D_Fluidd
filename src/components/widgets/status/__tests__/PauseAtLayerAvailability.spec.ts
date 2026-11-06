import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PauseResumeBtn from '../PauseResumeBtn.vue'
import StatusControls from '../StatusControls.vue'

function store (commands: Record<string, unknown>) {
  return {
    state: { printer: { printer: { print_stats: { info: { total_layer: 10, current_layer: 2 }, filename: 'a.gcode' } } } },
    getters: {
      'macros/getMacroByName': (...names: string[]) => names.includes('set_pause_at_layer') ? { name: 'SET_PAUSE_AT_LAYER', variables: {} } : undefined,
      'printer/getAvailableCommands': commands,
      'printer/getPrinterState': 'printing',
      'wait/hasWait': () => false,
      'server/componentSupport': () => false,
      'parts/getParts': {}
    } as Record<string, any>
  }
}

const mocks = (s: any) => ({ $store: s, $waits: {}, $t: (k: string) => k })

describe('pause at layer', () => {
  it('PauseResumeBtn offers it when the printer reports SET_PAUSE_AT_LAYER, and not when it does not (the M1)', () => {
    const on = shallowMount(PauseResumeBtn, { mocks: mocks(store({ G28: {}, SET_PAUSE_AT_LAYER: {} })), render: (h: any) => h('div') } as any)
    const vmOn = on.vm as any
    expect(vmOn.hasPauseAtLayerMacros).toBe(true)
    const off = shallowMount(PauseResumeBtn, { mocks: mocks(store({ G28: {}, PAUSE: {} })), render: (h: any) => h('div') } as any)
    expect((off.vm as any).hasPauseAtLayerMacros).toBe(false)
    expect((off.vm as any).hasPrintAtLayerMacros).toBe(false)
  })

  it('StatusControls does not show the dialog without the command, even if asked to', () => {
    const wrapper = shallowMount(StatusControls, { mocks: mocks(store({ G28: {} })), stubs: { PauseAtLayerDialog: { template: '<i data-tid="dialog" />' } } })
    const vm = wrapper.vm as any
    vm.showPauseAtLayerDialog = true
    expect(vm.hasPauseAtLayer).toBe(false)
  })
})
