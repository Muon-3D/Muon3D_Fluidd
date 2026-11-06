import { shallowMount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CameraActions from '../CameraActions.vue'
import { EventBus } from '@/eventBus'

function mountActions (cameras: unknown[], timelapse = false, phone = false) {
  return shallowMount(CameraActions, {
    mocks: {
      $vuetify: { breakpoint: { mobile: false } },
      $store: {
        getters: {
          'webcams/getEnabledWebcams': cameras,
          'server/componentSupport': (name: string) => name === 'timelapse' && timelapse
        }
      }
    },
    computed: { isMobileViewport: () => phone },
    stubs: {
      'frame-icon': true,
      'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' },
      'v-menu': { template: '<div><slot name="activator" :on="{}" :attrs="{}" /><slot /></div>' },
      'v-list': { template: '<div><slot /></div>' },
      'v-list-item': { props: ['to'], template: '<div :data-to="to" @click="$emit(\'click\')"><slot /></div>' },
      'v-list-item-title': { template: '<span><slot /></span>' }
    }
  })
}

describe('Camera header actions', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('shows nothing when the printer has no camera', () => {
    expect(mountActions([]).find('.camera-actions').exists()).toBe(false)
  })

  it('offers Snapshot and the ··· menu, and Timelapse only when the printer records them', () => {
    const without = mountActions([{ uid: 'front' }])
    expect(without.find('[data-tid="camera-snapshot"]').text()).toBe('Snapshot')
    expect(without.find('[data-tid="camera-timelapse"]').exists()).toBe(false)
    expect(without.find('[data-tid="camera-more"]').exists()).toBe(true)

    const withTimelapse = mountActions([{ uid: 'front' }], true)
    expect(withTimelapse.get('[data-tid="camera-timelapse"]').attributes('href')).toBe('/timelapse')
  })

  it('asks the page for a snapshot and for full screen, and links to the camera settings', async () => {
    const emit = vi.spyOn(EventBus.bus, '$emit')
    const wrapper = mountActions([{ uid: 'front' }])
    await wrapper.get('[data-tid="camera-snapshot"]').trigger('click')
    await wrapper.get('[data-tid="camera-fullscreen"]').trigger('click')
    expect(emit.mock.calls.map(call => call[0])).toEqual(['camera-snapshot', 'camera-fullscreen'])
    expect(wrapper.get('[data-tid="camera-more-settings"]').attributes('data-to')).toBe('/settings#camera')
    expect(wrapper.get('[data-tid="camera-fullscreen"]').text()).toContain('F')
  })

  it('has one link to the camera settings, not a second one for adding a camera', () => {
    const wrapper = mountActions([{ uid: 'front' }])
    expect(wrapper.findAll('[data-tid^="camera-more-"]')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('Add a camera')
  })

  it('on a phone leaves Snapshot and Full screen to the picture, and keeps Timelapse and the settings', () => {
    const wrapper = mountActions([{ uid: 'front' }], true, true)
    expect(wrapper.find('[data-tid="camera-snapshot"]').exists()).toBe(false)
    expect(wrapper.find('[data-tid="camera-fullscreen"]').exists()).toBe(false)
    expect(wrapper.find('[data-tid="camera-timelapse"]').exists()).toBe(true)
    expect(wrapper.find('[data-tid="camera-more-settings"]').exists()).toBe(true)
  })
})
