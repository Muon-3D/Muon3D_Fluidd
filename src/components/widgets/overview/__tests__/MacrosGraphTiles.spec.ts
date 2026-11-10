import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MacrosTile from '../tiles/MacrosTile.vue'
import GraphTile from '../tiles/GraphTile.vue'
import { resetSocket, sent, tileMount, tileStore, withMacros } from './fixture'

vi.mock('@/services/printer-pages', async orig => ({ ...(await orig() as object), activeSlug: () => 'boxwood-367a' }))
vi.mock('@/components/ui/M3Dialog.vue', async () => (await import('./fixture')).m3DialogModule)
vi.mock('@/api/socketActions', async () => ({ SocketActions: (await import('./fixture')).socket }))

afterEach(() => resetSocket())

const macroList = [
  { name: 'PARK', description: 'Park the head', disabledWhilePrinting: true },
  { name: 'PURGE', description: 'Purge a line', disabledWhilePrinting: false }
]

describe('MacrosTile', () => {
  const mountMacros = (store: ReturnType<typeof tileStore>) => mount(MacrosTile, tileMount(store, { stubs: { ...tileMount(store).stubs, 'control-macros': true } }))

  it('renders with no data: says there are none', () => {
    const w = mountMacros(tileStore({ empty: true }))
    expect(w.text()).toContain('Quick commands')
    expect(w.text()).toContain('No quick commands')
    w.destroy()
  })

  it('shows the macros as chips and runs one', async () => {
    const store = tileStore()
    withMacros(store, macroList)
    const w = mountMacros(store)
    const chips = w.findAll('[data-tid="macro-chip"]')
    expect(chips.length).toBeGreaterThan(0)
    await w.find('[data-macro="PURGE"]').trigger('click')
    expect(sent()).toEqual(['PURGE'])
    w.destroy()
  })

  it('locks a macro that is not for use while printing, and every chip when not ready', async () => {
    const store = tileStore({ printing: true })
    withMacros(store, macroList)
    const w = mountMacros(store)
    expect(w.find('[data-macro="PARK"]').attributes('disabled')).toBeDefined()
    expect(w.find('[data-macro="PURGE"]').attributes('disabled')).toBeUndefined()
    Vue.set(store.getters, 'printer/getKlippyReady', false)
    await w.vm.$nextTick()
    expect(w.find('[data-macro="PURGE"]').attributes('disabled')).toBeDefined()
    w.destroy()
  })

  it('opens every macro in a dialog and keeps the console behind the three dots', async () => {
    const store = tileStore()
    withMacros(store, macroList)
    const w = mountMacros(store)
    await w.find('[data-tid="macros-all"]').trigger('click')
    expect(w.find('[data-stub="dialog"] h2').text()).toBe('All quick commands')
    await w.find('[data-tid="tile-more"]').trigger('click')
    expect(w.find('[data-menu="console"]').attributes('href')).toBe('/boxwood-367a/console')
    expect(w.find('[data-menu="manage"]').attributes('href')).toBe('/boxwood-367a/settings#macros')
    w.destroy()
  })
})

describe('GraphTile', () => {
  const mountGraph = (store: ReturnType<typeof tileStore>) => mount(GraphTile, tileMount(store, { propsData: { size: 'L' }, stubs: { ...tileMount(store).stubs, 'thermal-graph': { props: ['windowSeconds', 'events', 'phone'], template: '<div data-stub="graph" :data-window="windowSeconds" />' } } }))

  it('renders with no data: the graph still draws, with a range to pick', () => {
    const w = mountGraph(tileStore({ empty: true }))
    expect(w.text()).toContain('Temperatures')
    expect(w.find('[data-stub="graph"]').exists()).toBe(true)
    w.destroy()
  })

  it('draws the live graph for the chosen time range', async () => {
    const w = mountGraph(tileStore())
    const first = Number(w.find('[data-stub="graph"]').attributes('data-window'))
    expect(first).toBeGreaterThan(0)
    const buttons = w.findAll('[data-tid="graph-range"] button')
    await buttons.at(0).trigger('click')
    expect(Number(w.find('[data-stub="graph"]').attributes('data-window'))).toBe(300)
    w.destroy()
  })

  it('shows every sensor and heater as a table with exact targets, from the three dots', async () => {
    const w = mountGraph(tileStore())
    await w.find('[data-tid="tile-more"]').trigger('click')
    await w.find('[data-menu="table"]').trigger('click')
    expect(w.find('[data-stub="graph"]').exists()).toBe(false)
    expect(w.find('[data-tid="graph-table"]').text()).toContain('Nozzle')
    expect(w.find('[data-tid="graph-table"]').text()).toContain('CPU')
    expect(w.find('input[aria-label="Nozzle target"]').exists()).toBe(true)
    w.destroy()
  })

  it('links the temperature presets and the sensor settings', async () => {
    const w = mountGraph(tileStore())
    await w.find('[data-tid="tile-more"]').trigger('click')
    expect(w.find('[data-menu="presets"]').attributes('href')).toBe('/boxwood-367a/settings#presets')
    w.destroy()
  })
})
