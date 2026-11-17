import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FileSystemAddMenu from '../FileSystemAddMenu.vue'

describe('FileSystemAddMenu storage picker', () => {
  it.each([
    { root: 'calibration', accepts: ['.cfg'] },
    { root: 'config', accepts: [] },
    { root: 'calibration', accepts: ['.gcode', '.3mf'] },
    { root: 'gcodes', accepts: ['.gcode'] }
  ])('retains root types and adds storage formats only to storage pickers: %j', ({ root, accepts }) => {
    const wrapper = shallowMount(FileSystemAddMenu, {
      propsData: { root },
      mocks: {
        $store: { getters: { 'files/getRootProperties': () => ({ accepts }) } },
        $t: (key: string) => key
      },
      computed: { printerReady: () => true },
      stubs: ['v-menu', 'v-tooltip', 'v-btn', 'v-icon', 'v-list', 'v-list-item', 'v-list-item-icon', 'v-list-item-content', 'v-list-item-title']
    })
    const actual = (wrapper.vm as any).accepts.split(',')
    expect(actual).toEqual(root === 'gcodes' ? accepts : [...new Set([...accepts, '.gcode', '.3mf'])])
    wrapper.destroy()
  })
})
