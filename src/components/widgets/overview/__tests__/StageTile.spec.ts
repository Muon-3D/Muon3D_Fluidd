import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import StageTile from '../tiles/StageTile.vue'
import { tileMount, tileStore } from './fixture'

const cam = { uid: 'c1', name: 'Boxwood camera', enabled: true, service: 'mjpegstreamer' }
const extra = { 'overview-stage': { template: '<div data-stub="stage" />' }, 'camera-item': { props: ['camera'], template: '<div data-stub="camera">{{ camera.name }}</div>' } }

afterEach(() => { vi.clearAllMocks() })

describe('StageTile', () => {
  it('shows the live 3D view with no camera toggle when no camera is configured', () => {
    const store = tileStore()
    const w = mount(StageTile, tileMount(store, { stubs: { ...tileMount(store).stubs, ...extra } }))
    expect(w.find('[data-stub="stage"]').exists()).toBe(true)
    expect(w.find('[data-tid="view-toggle"]').exists()).toBe(false)
    w.destroy()
  })

  it('offers 3D view and Camera at the top right when a camera is configured, and switches', async () => {
    const store = tileStore()
    Vue.set(store.getters, 'webcams/getEnabledWebcams', [cam])
    const w = mount(StageTile, tileMount(store, { stubs: { ...tileMount(store).stubs, ...extra } }))
    const toggle = w.find('[data-tid="view-toggle"]')
    expect(toggle.exists()).toBe(true)
    expect(toggle.findAll('button').wrappers.map(b => b.text())).toEqual(['3D view', 'Camera'])
    expect(w.find('[data-stub="camera"]').exists()).toBe(false)
    await toggle.findAll('button').at(1).trigger('click')
    expect(w.find('[data-stub="camera"]').text()).toBe('Boxwood camera')
    expect(w.find('[data-stub="stage"]').exists()).toBe(false)
    await toggle.findAll('button').at(0).trigger('click')
    expect(w.find('[data-stub="stage"]').exists()).toBe(true)
    w.destroy()
  })

  it('hides the toggle when the setting says so, and stays on the 3D view', async () => {
    const store = tileStore()
    Vue.set(store.getters, 'webcams/getEnabledWebcams', [cam])
    store.state.config.uiSettings.general.overviewCameraToggle = false
    const w = mount(StageTile, tileMount(store, { stubs: { ...tileMount(store).stubs, ...extra } }))
    expect(w.find('[data-tid="view-toggle"]').exists()).toBe(false)
    expect(w.find('[data-stub="stage"]').exists()).toBe(true)
    w.destroy()
  })

  it('goes back to the 3D view when the camera is gone', async () => {
    const store = tileStore()
    Vue.set(store.getters, 'webcams/getEnabledWebcams', [cam])
    const w = mount(StageTile, tileMount(store, { stubs: { ...tileMount(store).stubs, ...extra } }))
    await w.find('[data-tid="view-toggle"]').findAll('button').at(1).trigger('click')
    Vue.set(store.getters, 'webcams/getEnabledWebcams', [])
    await w.vm.$nextTick()
    expect(w.find('[data-stub="stage"]').exists()).toBe(true)
    w.destroy()
  })
})
