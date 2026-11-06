import { shallowMount, type Wrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Camera, { redactCameraUrl } from '../Camera.vue'
import { cameraPage } from '@/services/camera/page-state'
import type { WebcamConfig } from '@/store/webcams/types'

const front: WebcamConfig = {
  uid: 'front',
  name: 'Front camera',
  source: 'database',
  service: 'webrtc-go2rtc',
  stream_url: 'https://viewer:secret@camera.local/live?token=private&quality=high',
  snapshot_url: '/webcam/snapshot?access_token=private',
  target_fps: 30,
  target_fps_idle: 5,
  rotation: 90,
  flip_horizontal: true
}

const side: WebcamConfig = {
  uid: 'side',
  name: 'Side camera',
  source: 'config'
}

function mountCamera (cameras: WebcamConfig[], cameraId = cameras[0]?.uid, phone = true): Wrapper<Camera> {
  return shallowMount(Camera, {
    mocks: {
      $vuetify: { breakpoint: { mobile: false } },
      $store: {
        getters: {
          'webcams/getEnabledWebcams': cameras,
          'server/componentSupport': () => false,
          'config/getDisplayName': 'M1'
        },
        state: { printer: { printer: {} }, config: { uiSettings: {} } }
      }
    },
    computed: {
      cameras: () => cameras,
      camera: () => cameras.find(camera => camera.uid === cameraId) ?? cameras[0] ?? null,
      isMobileViewport: () => phone,
      facts: () => '',
      hasLights: () => false,
      printerPrinting: () => false,
      printerPaused: () => false
    },
    stubs: {
      'camera-item': true,
      'camera-actions': true,
      'frame-icon': true,
      'router-link': {
        props: { to: [String, Object], custom: Boolean },
        render (this: any, h: any) {
          if (this.custom) return this.$scopedSlots.default({ href: this.to, navigate: () => {} })[0]
          return h('router-link-stub', { attrs: { to: this.to } }, this.$slots.default)
        }
      }
    },
    attachTo: document.body
  })
}

describe('Camera stream details on a phone', () => {
  it('makes details reachable without a mode-specific camera stage', async () => {
    const wrapper = mountCamera([front])
    expect(wrapper.get('[data-tid="camera-stage"]').classes()).not.toContain('camera-stage--pro')
    const button = wrapper.get('[data-tid="camera-details-trigger"]')
    expect(wrapper.text()).not.toContain('Pro shows')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(button.attributes('aria-controls')).toBe('camera-details')

    await button.trigger('click')

    expect(button.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('#camera-details').text()).toContain('webrtc-go2rtc')
    expect(wrapper.get('#camera-details').text()).toContain('30 fps, 5 idle')
    expect(wrapper.get('#camera-details').text()).not.toContain('secret')
    expect(wrapper.get('#camera-details').text()).not.toContain('private')
    wrapper.destroy()
  })

  it('closes with Escape and returns focus to its native trigger', async () => {
    const wrapper = mountCamera([front])
    const button = wrapper.get('[data-tid="camera-details-trigger"]')
    ;(button.element as HTMLButtonElement).focus()
    await button.trigger('click')
    await wrapper.get('#camera-details').trigger('keydown.esc')
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)
    wrapper.destroy()
  })

  it('shows unknown rather than blank for a camera without details', async () => {
    const wrapper = mountCamera([side])
    await wrapper.get('[data-tid="camera-details-trigger"]').trigger('click')
    expect(wrapper.findAll('#camera-details dd').wrappers.map(value => value.text())).toEqual([
      'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'
    ])
    wrapper.destroy()
  })

  it('distinguishes an upright camera from missing turn information', async () => {
    const upright: WebcamConfig = {
      ...side,
      rotation: 0,
      flip_horizontal: false,
      flip_vertical: false
    }
    const wrapper = mountCamera([upright])
    await wrapper.get('[data-tid="camera-details-trigger"]').trigger('click')
    expect(wrapper.findAll('#camera-details dd').at(4).text()).toBe('Not turned')
    wrapper.destroy()
  })

  it('shows the selected camera when several cameras are available', async () => {
    const wrapper = mountCamera([front, side], 'side')
    await wrapper.get('[data-tid="camera-details-trigger"]').trigger('click')
    expect(wrapper.get('#camera-details').text()).not.toContain('webrtc-go2rtc')
    wrapper.destroy()
  })

  it('closes on an assistive outside click and returns hidden-panel focus to the trigger', async () => {
    const wrapper = mountCamera([front])
    const button = wrapper.get('[data-tid="camera-details-trigger"]')
    await button.trigger('click')
    expect(document.activeElement).toBe(wrapper.get('#camera-details').element)
    document.body.click()
    await wrapper.vm.$nextTick()
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(button.element)
    wrapper.destroy()
  })

  it('keeps focus on a deliberately clicked outside control when closing', async () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    const wrapper = mountCamera([front])
    const button = wrapper.get('[data-tid="camera-details-trigger"]')
    await button.trigger('click')
    outside.focus()
    outside.click()
    await wrapper.vm.$nextTick()
    expect(button.attributes('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(outside)
    wrapper.destroy()
    outside.remove()
  })

  it('lists the selected camera\'s stream in a side tile on a desktop', () => {
    const wrapper = mountCamera([front], 'front', false)
    expect(wrapper.find('[data-tid="camera-details-trigger"]').exists()).toBe(false)
    const info = wrapper.get('[data-tid="camera-info"]')
    expect(info.text()).toContain('Front camera')
    expect(info.text()).toContain('webrtc-go2rtc')
    expect(info.text()).toContain('30 fps, 5 idle')
    expect(info.text()).not.toContain('secret')
    expect(info.find('[data-tid="camera-settings"]').attributes('to')).toBe('/settings#camera')
    wrapper.destroy()
  })

  it('redacts usernames, passwords, hashes, and every query value', () => {
    const https = redactCameraUrl('https://viewer:secret@camera.local/live?token=private&quality=high#token')
    expect(https).toBe('https://camera.local/live?token=[redacted]&quality=[redacted]')
    expect(https).not.toContain('viewer')
    expect(https).not.toContain('#token')
    expect(redactCameraUrl('rtsp://user:pass@camera.local/live')).toBe('rtsp://camera.local/live')
  })
})

describe('Camera v3 layout', () => {
  it('shows camera chips only when there is more than one camera', () => {
    const one = mountCamera([front], 'front', false)
    expect(one.find('[data-tid="camera-chips"]').exists()).toBe(false)
    one.destroy()

    const two = mountCamera([front, side], 'side', false)
    const chips = two.findAll('[data-tid="camera-chips"] a')
    expect(chips.wrappers.map(chip => chip.text())).toEqual(['Front camera', 'Side camera'])
    expect(chips.at(1).attributes('aria-current')).toBe('page')
    expect(chips.at(0).attributes('aria-current')).toBeUndefined()
    expect(chips.at(0).attributes('href')).toBe('/camera/front')
    two.destroy()
  })

  it('puts Snapshot and Full screen on the stream', () => {
    const wrapper = mountCamera([front], 'front', false)
    const stage = wrapper.get('[data-tid="camera-stage"]')
    expect(stage.find('[data-tid="camera-stage-snapshot"]').text()).toBe('Snapshot')
    expect(stage.find('[data-tid="camera-stage-fullscreen"]').text()).toBe('Full screen')
    expect(stage.find('[data-tid="camera-live"]').text()).toContain('30 fps')
    wrapper.destroy()
  })

  it('says so in the tile when the stream does not load, and draws it again on Retry', async () => {
    const wrapper = mountCamera([front], 'front', false)
    const stage = wrapper.get('[data-tid="camera-stage"]')
    const img = document.createElement('img')
    stage.element.appendChild(img)
    img.dispatchEvent(new Event('error'))
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-tid="camera-error"]').text()).toContain("Can't reach Front camera")
    expect(wrapper.find('[data-tid="camera-live"]').exists()).toBe(false)
    expect(wrapper.find('[data-tid="camera-stage-snapshot"]').exists()).toBe(false)
    const before = wrapper.get('camera-item-stub').element
    await wrapper.get('[data-tid="camera-retry"]').trigger('click')
    expect(wrapper.find('[data-tid="camera-error"]').exists()).toBe(false)
    expect(wrapper.get('camera-item-stub').element).not.toBe(before)
    wrapper.destroy()
  })

  it('names the printer under the page title and clears it on leaving', () => {
    const wrapper = mountCamera([front], 'front', false)
    expect(cameraPage.subtitle).toBe('Live view of M1')
    wrapper.destroy()
    expect(cameraPage.subtitle).toBe('')
  })

  it('offers to add a camera when the printer has none', () => {
    const wrapper = mountCamera([], undefined, false)
    expect(wrapper.find('[data-tid="camera-tile"]').exists()).toBe(false)
    const empty = wrapper.get('[data-tid="camera-empty"]')
    expect(empty.text()).toContain('This printer has no camera set up')
    expect(empty.get('router-link-stub').attributes('to')).toBe('/settings#camera')
    wrapper.destroy()
  })
})
