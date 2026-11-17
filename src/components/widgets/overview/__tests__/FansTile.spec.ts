import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FansTile from '../tiles/FansTile.vue'
import { resetSocket, sent, tileMount, tileStore } from './fixture'

vi.mock('@/components/ui/M3Dialog.vue', async () => (await import('./fixture')).m3DialogModule)
vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

const mountFans = (store: ReturnType<typeof tileStore>) => mount(FansTile, tileMount(store, { stubs: { ...tileMount(store).stubs, 'control-fans': true, 'control-outputs': true } }))
afterEach(() => resetSocket())

describe('FansTile', () => {
  it('renders with no data: no fans reported', () => {
    const w = mountFans(tileStore({ empty: true }))
    expect(w.text()).toContain('Fans')
    expect(w.text()).toContain('No fans reported')
    expect(w.find('[data-tid="tile-door"]').attributes('disabled')).toBeDefined()
    w.destroy()
  })

  it('shows the part fan and the others in a line', () => {
    const w = mountFans(tileStore())
    expect(w.find('[data-tid="fan-value"]').text()).toContain('80%')
    expect(w.text()).toContain('Hotend fan on')
    w.destroy()
  })

  it('sets a controllable fan from the popover; the one the printer runs by itself has no slider', async () => {
    const w = mountFans(tileStore())
    await w.find('[data-tid="tile-door"]').trigger('click')
    expect(w.findAll('input[type="range"]')).toHaveLength(1)
    const range = w.find('input[type="range"]')
    await range.setValue('50')
    await range.trigger('change')
    expect(sent()).toEqual(['M106 S128'])
    w.destroy()
  })

  it('gates the sliders when the printer is not ready', async () => {
    const store = tileStore()
    Vue.set(store.getters, 'printer/getKlippyReady', false)
    const w = mountFans(store)
    await w.find('[data-tid="tile-door"]').trigger('click')
    expect(w.find('input[type="range"]').attributes('disabled')).toBeDefined()
    w.destroy()
  })

  it('keeps every fan and output, and the power devices, behind the three dots', async () => {
    const store = tileStore()
    Vue.set(store.getters, 'server/componentSupport', () => true)
    Vue.set(store.getters, 'power/getDevices', [{ device: 'psu', status: 'on' }])
    const w = mountFans(store)
    await w.find('[data-tid="tile-more"]').trigger('click')
    expect(w.findAll('[data-menu]').wrappers.map(i => i.attributes('data-menu'))).toEqual(['all', 'power'])
    await w.find('[data-menu="all"]').trigger('click')
    expect(w.find('[data-stub="dialog"]').exists()).toBe(true)
    w.destroy()
  })
})
