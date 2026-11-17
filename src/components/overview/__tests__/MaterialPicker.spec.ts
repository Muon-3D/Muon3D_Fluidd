import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import MaterialPicker from '@/components/overview/MaterialPicker.vue'

const choices = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PA', 'PC', 'Bamboo blend'].map(name => ({
  name, nozzle: 215, bed: 60, colour: '#E8A53B', presetId: null
}))

function setup (pins: string[] | null = null, busy = false) {
  const general = Vue.observable({ pinnedMaterials: pins })
  const printer = Vue.observable({ save_variables: { variables: { muon_material: 'PLA' } }, printing: busy, paused: false })
  const send = vi.fn()
  const dispatch = vi.fn((_action, payload) => { general.pinnedMaterials = payload.value })
  const wrapper = shallowMount(MaterialPicker, {
    propsData: { chip: true },
    mocks: {
      $store: {
        state: { printer: { printer }, config: { uiSettings: { general } } },
        getters: { 'spoolman/getActiveSpool': null },
        dispatch
      }
    },
    computed: {
      klippyReady: () => true,
      materialChoices: () => choices,
      printerPrinting: () => printer.printing,
      printerPaused: () => printer.paused
    },
    methods: { sendGcode: send },
    stubs: {
      'frame-icon': true,
      'v-menu': { template: '<div><slot name="activator" :on="{}" :attrs="{}" /><slot /></div>' },
      'v-dialog': { template: '<div><slot /></div>' },
      'add-material-dialog': true,
      'router-link': { template: '<a><slot /></a>' }
    }
  })
  return {
    wrapper,
    general,
    send,
    dispatch,
    cleanup: () => {
      wrapper.destroy()
    }
  }
}

const names = (wrapper: ReturnType<typeof setup>['wrapper']) =>
  wrapper.find('[data-tid="material-shortlist"]').findAll('[role="option"]').wrappers.map(row => row.find('b').text())

describe('material picker (v3 storyboard)', () => {
  it('shows the pinned materials only, in pin order, defaulting to the four every printer has', () => {
    const { wrapper, cleanup } = setup()
    expect(names(wrapper)).toEqual(['PLA', 'PETG', 'ABS', 'TPU'])
    cleanup()
  })

  it('follows pins and their order as Settings › Materials changes them', async () => {
    const { wrapper, general, cleanup } = setup(['TPU', 'Bamboo blend', 'PLA'])
    expect(names(wrapper)).toEqual(['TPU', 'Bamboo blend', 'PLA'])
    general.pinnedMaterials = ['PLA', 'TPU']
    await wrapper.vm.$nextTick()
    expect(names(wrapper)).toEqual(['PLA', 'TPU'])
    cleanup()
  })

  it('never shows more than six', () => {
    const { wrapper, cleanup } = setup(choices.map(c => c.name))
    expect(names(wrapper)).toHaveLength(6)
    cleanup()
  })

  it('has no "See all materials" catalogue, no pin buttons and no temperatures link', () => {
    const { wrapper, cleanup } = setup()
    expect(wrapper.find('[data-tid="material-see-all"]').exists()).toBe(false)
    expect(wrapper.find('[data-tid="material-catalog"]').exists()).toBe(false)
    expect(wrapper.findAll('[aria-label^="Pin "]').length).toBe(0)
    expect(wrapper.text()).not.toContain("Change the materials' temperatures")
    expect(wrapper.find('[data-tid="material-see-materials"]').text()).toBe('See materials ›')
    cleanup()
  })

  it('+ Add opens the shared Add-a-material popup and closes the picker', async () => {
    const { wrapper, cleanup } = setup()
    const vm = wrapper.vm as unknown as { open: boolean, adding: boolean }
    vm.open = true
    await wrapper.find('[data-tid="material-picker-add"]').trigger('click')
    expect(vm.adding).toBe(true)
    expect(vm.open).toBe(false)
    expect(wrapper.findComponent({ name: 'AddMaterialDialog' }).exists()).toBe(true)
    cleanup()
  })

  it('choosing sends the material and is refused while printing', async () => {
    const busy = setup(null, true)
    expect(busy.wrapper.find('[data-tid="material-PETG"]').attributes('disabled')).toBe('disabled')
    busy.cleanup()
    const { wrapper, send, cleanup } = setup()
    await wrapper.find('[data-tid="material-PETG"]').trigger('click')
    expect(send.mock.calls.flat().join('\n')).toContain('muon_material')
    cleanup()
  })
})
