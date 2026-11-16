import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import HeaterTile from '../tiles/HeaterTile.vue'
import { resetSocket, sent, tileMount, tileStore } from './fixture'

vi.mock('@/services/printer-pages', async orig => ({ ...(await orig() as object), activeSlug: () => 'boxwood-367a' }))
vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

const mountHeater = (store: ReturnType<typeof tileStore>, kind: 'hotend' | 'bed') => mount(HeaterTile, { ...tileMount(store), propsData: { kind } })
const enter = async (input: any, value: string) => { await input.setValue(value); await input.trigger('keydown', { key: 'Enter' }) }
afterEach(() => resetSocket())

describe('HeaterTile', () => {
  it.each(['hotend', 'bed'] as const)('renders %s with no data as a dash, with nothing to press', kind => {
    const w = mountHeater(tileStore({ empty: true }), kind)
    expect(w.text()).toContain(kind === 'hotend' ? 'Hotend' : 'Bed')
    expect(w.text()).toContain('—')
    expect(w.find('[data-tid="tile-door"]').attributes('disabled')).toBeDefined()
    w.destroy()
  })

  it('shows the live hotend: temperature, target, and how close it is', () => {
    const store = tileStore()
    const w = mountHeater(store, 'hotend')
    expect(w.find('[data-tid="heater-value"]').text()).toContain('214.6°')
    expect(w.find('[data-tid="heater-value"]').text()).toContain('/ 215°')
    expect(w.find('[data-tid="tile-state"]').text()).toBe('At temperature')
    w.destroy()
  })

  it('shows the live bed heating', () => {
    const store = tileStore()
    Vue.set(store.getters, 'printer/getHeaters', [{ name: 'extruder', temperature: 214.6, target: 215, power: 0.4, maxTemp: 265 }, { name: 'heater_bed', temperature: 31, target: 60, power: 0.9, maxTemp: 110 }])
    const w = mountHeater(store, 'bed')
    expect(w.find('[data-tid="heater-value"]').text()).toContain('31.0°')
    expect(w.find('[data-tid="tile-state"]').text()).toBe('Heating')
    w.destroy()
  })

  it('opens a popover with the exact target, presets and the Pro depth', async () => {
    const store = tileStore()
    const w = mountHeater(store, 'hotend')
    expect(w.find('[data-tid="tile-popover"]').exists()).toBe(false)
    await w.find('[data-tid="tile-door"]').trigger('click')
    expect(w.find('[data-tid="tile-popover"]').exists()).toBe(true)
    await enter(w.find('input[aria-label="Hotend target"]'), '220')
    expect(sent()).toEqual(['SET_HEATER_TEMPERATURE HEATER=extruder TARGET=220'])
    await w.find('[data-preset="PETG"]').trigger('click')
    expect(sent()[1]).toBe('SET_HEATER_TEMPERATURE HEATER=extruder TARGET=240')
    await w.find('[data-tid="heater-off"]').trigger('click')
    expect(sent()[2]).toBe('SET_HEATER_TEMPERATURE HEATER=extruder TARGET=0')
    expect(w.find('[data-row="pid"]').exists()).toBe(true)
    expect(w.find('[data-row="presets"]').exists()).toBe(true)
    expect(w.find('[data-row="load"]').exists()).toBe(true)
    w.destroy()
  })

  it('sets the bed from its own popover and links the bed mesh', async () => {
    const w = mountHeater(tileStore(), 'bed')
    await w.find('[data-tid="tile-door"]').trigger('click')
    await w.find('[data-preset="PETG"]').trigger('click')
    expect(sent()).toEqual(['SET_HEATER_TEMPERATURE HEATER=heater_bed TARGET=80'])
    expect(w.find('[data-row="mesh"]').attributes('href')).toBe('/boxwood-367a/tune')
    w.destroy()
  })

  it('gates every control when the printer is not ready', async () => {
    const store = tileStore()
    Vue.set(store.getters, 'printer/getKlippyReady', false)
    const w = mountHeater(store, 'hotend')
    await w.find('[data-tid="tile-door"]').trigger('click')
    expect(w.find('input[aria-label="Hotend target"]').attributes('disabled')).toBeDefined()
    await w.find('[data-preset="PETG"]').trigger('click')
    await w.find('[data-tid="heater-off"]').trigger('click')
    expect(sent()).toEqual([])
    w.destroy()
  })

  it('asks before cooling down while the printer is busy', async () => {
    const store = tileStore({ printing: true })
    const w = mountHeater(store, 'hotend')
    await w.find('[data-tid="tile-door"]').trigger('click')
    ;((w.vm as any).$confirm as ReturnType<typeof vi.fn>).mockResolvedValue(false)
    await w.find('[data-tid="cool-down"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(sent()).toEqual([])
    w.destroy()
  })

  it('shows a disconnected bed as a card and does not take a target', async () => {
    const store = tileStore()
    Vue.set(store.state.printer.printer, 'bed_removal_detector', { bedRemoved: true })
    const w = mountHeater(store, 'bed')
    expect(w.text()).toContain('Bed disconnected')
    expect(w.find('[data-tid="tile-door"]').attributes('disabled')).toBeDefined()
    w.destroy()
  })

  it('keeps show-on-graph and PID in the three dots', async () => {
    const store = tileStore()
    const w = mountHeater(store, 'hotend')
    await w.find('[data-tid="tile-more"]').trigger('click')
    expect(w.findAll('[data-menu]').wrappers.map(i => i.attributes('data-menu'))).toEqual(['graph', 'pid', 'load', 'presets'])
    await w.find('[data-menu="graph"]').trigger('click')
    expect(store.dispatch).toHaveBeenCalledWith('charts/saveSelectedLegends', expect.objectContaining({ extruder: expect.any(Boolean) }))
    w.destroy()
  })

  it('has a sparkline at M, where there is room, and none at S', () => {
    const store = tileStore()
    Vue.set(store.getters, 'charts/getChartData', [0, 30, 60].map(s => ({ date: new Date(1_800_000_000_000 + s * 1000), extruder: 200 + s / 10, extruderTarget: 215 })))
    const m = mount(HeaterTile, { ...tileMount(store), propsData: { kind: 'hotend', size: 'M' } })
    expect(m.find('[data-tid="heater-spark"]').attributes('data-state')).toBe('line')
    m.destroy()
    const s = mount(HeaterTile, { ...tileMount(store), propsData: { kind: 'hotend', size: 'S' } })
    expect(s.find('[data-tid="heater-spark"]').exists()).toBe(false)
    s.destroy()
  })
})
