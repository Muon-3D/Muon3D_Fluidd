import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SpeedTile from '../tiles/SpeedTile.vue'
import { resetSocket, sent, tileMount, tileStore } from './fixture'

vi.mock('@/components/ui/M3Dialog.vue', async () => (await import('./fixture')).m3DialogModule)
vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

const mountSpeed = (store: ReturnType<typeof tileStore>) => mount(SpeedTile, tileMount(store, { stubs: { ...tileMount(store).stubs, 'control-tuning': true, retract: true } }))
const enter = async (input: any, value: string) => { await input.setValue(value); await input.trigger('keydown', { key: 'Enter' }) }
afterEach(() => resetSocket())

describe('SpeedTile', () => {
  it('renders with no data as 100 / 100', () => {
    const w = mountSpeed(tileStore({ empty: true }))
    expect(w.find('[data-tid="speed-value"]').text()).toContain('100%')
    expect(w.find('[data-tid="speed-value"]').text()).toContain('/ 100%')
    w.destroy()
  })

  it('shows live speed, flow and the pressure advance', () => {
    const w = mountSpeed(tileStore())
    expect(w.find('[data-tid="speed-value"]').text()).toContain('100%')
    expect(w.find('[data-tid="speed-value"]').text()).toContain('/ 98%')
    expect(w.text()).toContain('Pressure advance 0.042')
    w.destroy()
  })

  it('sets speed and flow exactly from the popover', async () => {
    const w = mountSpeed(tileStore({ printing: true }))
    await w.find('[data-tid="tile-door"]').trigger('click')
    await enter(w.find('input[aria-label="Speed"]'), '120')
    await enter(w.find('input[aria-label="Flow"]'), '95')
    expect(sent()).toEqual(['M220 S120', 'M221 S95'])
    w.destroy()
  })

  it('refuses when the printer is not ready', async () => {
    const store = tileStore()
    Vue.set(store.getters, 'printer/getKlippyReady', false)
    const w = mountSpeed(store)
    await w.find('[data-tid="tile-door"]').trigger('click')
    expect(w.find('input[aria-label="Speed"]').attributes('disabled')).toBeDefined()
    expect(w.find('input[aria-label="Flow"]').attributes('disabled')).toBeDefined()
    w.destroy()
  })

  it('keeps limits and retraction behind the three dots', async () => {
    const w = mountSpeed(tileStore())
    await w.find('[data-tid="tile-more"]').trigger('click')
    expect(w.findAll('[data-menu]').wrappers.map(i => i.attributes('data-menu'))).toEqual(['limits', 'retraction'])
    await w.find('[data-menu="retraction"]').trigger('click')
    expect(w.find('[data-stub="dialog"] h2').text()).toBe('Retraction')
    w.destroy()
  })
})
