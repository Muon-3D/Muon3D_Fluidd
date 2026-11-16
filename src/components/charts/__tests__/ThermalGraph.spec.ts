import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ThermalGraph from '../ThermalGraph.vue'

const handle = vi.hoisted(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() }))
vi.mock('@/services/charts/engine', () => ({ createGraph: vi.fn(async () => handle) }))

type Listener = (mutation: { type: string, payload: unknown }) => void

function makeStore (selected: Record<string, boolean> = {}) {
  const printer = Vue.observable<any>({
    extruder: { temperature: 214.6, target: 215, power: 0.4 },
    heater_bed: { temperature: 59.8, target: 60, power: 0.2 },
    'temperature_sensor mcu_temp': { temperature: 44 },
    'temperature_fan box': { temperature: 31, target: 35, speed: 0.5 },
    fan: { speed: 0.55 }
  })
  const getters = Vue.observable<Record<string, any>>({
    'charts/getChartData': [],
    'charts/getChartRetention': 1200,
    'charts/getSelectedLegends': selected
  })
  const listeners: Listener[] = []
  const store = {
    state: Vue.observable<any>({ printer: { printer }, config: { uiSettings: { theme: { isDark: false } } } }),
    getters,
    dispatch: vi.fn(),
    commit: vi.fn(),
    subscribe: vi.fn((fn: Listener) => { listeners.push(fn); return () => listeners.splice(listeners.indexOf(fn), 1) })
  }
  const emit = (type: string, payload: unknown) => listeners.slice().forEach(fn => fn({ type, payload }))
  return { store, printer, emit, listeners }
}

const sample = (t: number, extra: Record<string, number> = {}) => ({ date: new Date(t), extruder: 200 + (t / 1000) % 5, extruderTarget: 215, heater_bed: 60, ...extra })

async function mountGraph (opts: ReturnType<typeof makeStore>, props: Record<string, unknown> = {}) {
  const wrapper = mount(ThermalGraph, { mocks: { $store: opts.store }, propsData: props })
  await Vue.nextTick()
  await new Promise(resolve => setTimeout(resolve, 0)) // the engine loads asynchronously
  return wrapper
}

beforeEach(() => { vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] }); handle.setOption.mockClear() })
afterEach(() => { vi.useRealTimers() })

/** Opens "N more", so every line the printer has is in the legend. */
async function showAll (wrapper: ReturnType<typeof mount>) {
  const more = wrapper.find('[data-tid="legend-more"]')
  if (more.exists()) { await more.trigger('click'); await Vue.nextTick() }
}

describe('legend', () => {
  it('shows only the lines that are on until the rest are asked for, grouped by part', async () => {
    const o = makeStore()
    const wrapper = await mountGraph(o)
    expect(wrapper.findAll('[data-legend]').wrappers.map(w => w.attributes('data-legend'))).toEqual(['extruder', 'heater_bed'])
    expect(wrapper.findAll('[data-group]').wrappers.map(w => w.attributes('data-group'))).toEqual(['Toolhead', 'Bed'])
    expect(wrapper.find('[data-tid="legend-more"]').text()).toContain('more')
    await showAll(wrapper)
    expect(wrapper.findAll('[data-group]').wrappers.map(w => w.attributes('data-group'))).toEqual(['Toolhead', 'Bed', 'Chamber and system', 'Fans'])
    wrapper.destroy()
  })

  it('has a labelled entry per tracked series with the current and target value', async () => {
    const o = makeStore()
    const wrapper = await mountGraph(o)
    await showAll(wrapper)
    const nozzle = wrapper.find('[data-legend="extruder"]')
    expect(nozzle.text()).toContain('Nozzle')
    expect(nozzle.text()).toContain('214.6°')
    expect(nozzle.text()).toContain('215°')
    expect(wrapper.find('[data-legend="temperature_sensor mcu_temp"]').text()).toContain('44.0°')
    expect(wrapper.find('[data-legend="fanSpeed"]').text()).toContain('55%')
    expect(wrapper.find('[data-legend="extruderPower"]').text()).toContain('40%')
    wrapper.destroy()
  })

  it('shows hidden series struck through and toggles one per click, saving the choice', async () => {
    const o = makeStore({ extruder: false })
    const wrapper = await mountGraph(o)
    await showAll(wrapper)
    expect(wrapper.find('[data-legend="extruder"]').attributes('aria-pressed')).toBe('false')
    expect(wrapper.find('[data-legend="heater_bed"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-legend="extruderPower"]').attributes('aria-pressed')).toBe('false')
    await wrapper.find('[data-legend="heater_bed"]').trigger('click')
    expect(o.store.dispatch).toHaveBeenCalledWith('charts/saveSelectedLegends', { extruder: false, heater_bed: false })
    await wrapper.find('[data-legend="extruder"]').trigger('click')
    expect(o.store.dispatch).toHaveBeenCalledWith('charts/saveSelectedLegends', { extruder: true })
    await wrapper.find('[data-legend="extruderPower"]').trigger('click')
    expect(o.store.dispatch).toHaveBeenCalledWith('charts/saveSelectedLegends', { extruder: false, extruderPower: true })
    wrapper.destroy()
  })

  it('keeps long lists short until asked, and never hides a series that is on', async () => {
    const o = makeStore()
    for (let i = 0; i < 12; i++) Vue.set(o.printer, `temperature_sensor extra${i}`, { temperature: 20 + i })
    const wrapper = await mountGraph(o)
    const more = wrapper.find('[data-tid="legend-more"]')
    expect(more.exists()).toBe(true)
    const before = wrapper.findAll('[data-legend]').length
    await more.trigger('click')
    expect(wrapper.findAll('[data-legend]').length).toBeGreaterThan(before)
    expect(wrapper.find('[data-legend="temperature_sensor extra11"]').exists()).toBe(true)
    wrapper.destroy()
  })

  it('finds a sensor that appears after the graph opened', async () => {
    const o = makeStore()
    const wrapper = await mountGraph(o)
    await showAll(wrapper)
    Vue.set(o.printer, 'temperature_sensor late', { temperature: 33 })
    vi.advanceTimersByTime(1000)
    await Vue.nextTick()
    expect(wrapper.find('[data-legend="temperature_sensor late"]').exists()).toBe(true)
    wrapper.destroy()
  })
})

describe('drawing', () => {
  it('draws only the series that are on, from the history the store holds', async () => {
    const o = makeStore({ heater_bed: false })
    o.store.getters['charts/getChartData'] = [sample(Date.now() - 2000), sample(Date.now() - 1000)]
    const wrapper = await mountGraph(o)
    vi.advanceTimersByTime(1000)
    const option = handle.setOption.mock.calls.at(-1)![0] as any
    const ids = option.series.map((s: any) => s.id)
    expect(ids).toContain('extruder')
    expect(ids).toContain('extruderTarget')
    expect(ids).not.toContain('heater_bed')
    expect(ids).not.toContain('extruderPower')
    expect(option.series.find((s: any) => s.id === 'extruder').data).toHaveLength(2)
    wrapper.destroy()
  })

  it('redraws at most once a second however fast samples and status updates arrive', async () => {
    const o = makeStore()
    const wrapper = await mountGraph(o)
    handle.setOption.mockClear()
    for (let i = 0; i < 400; i++) {
      o.emit('charts/setChartEntry', { type: 'chart', retention: 1200, data: sample(Date.now() + i) })
      o.printer.extruder.temperature += 0.01
      vi.advanceTimersByTime(10)
    }
    expect(handle.setOption.mock.calls.length).toBeLessThanOrEqual(5)
    expect(handle.setOption.mock.calls.length).toBeGreaterThanOrEqual(3)
    wrapper.destroy()
  })

  it('does not re-render the component on a status tick, a new sample or a redraw', async () => {
    const o = makeStore()
    const wrapper = await mountGraph(o)
    let renders = 0
    const vm = wrapper.vm as any
    const original = vm._render
    vm._render = function (this: unknown, ...args: unknown[]) { renders++; return original.apply(this, args) }
    for (let i = 0; i < 60; i++) {
      o.printer.extruder.temperature += 0.1
      o.printer.heater_bed.target = 60 + (i % 2)
      o.emit('charts/setChartEntry', { type: 'chart', retention: 1200, data: sample(Date.now() + i * 1000) })
      vi.advanceTimersByTime(1000)
      await Vue.nextTick()
    }
    expect(renders).toBe(0)
    // ...but the legend values still moved, written straight into the page.
    expect(wrapper.find('[data-legend="extruder"]').text()).toContain('220.')
    // Negative control: a real change to what is shown does re-render.
    o.store.getters['charts/getSelectedLegends'] = { extruder: false }
    await Vue.nextTick()
    expect(renders).toBe(1)
    wrapper.destroy()
  })

  it('does not draw while the page is hidden, and catches up when it shows', async () => {
    const o = makeStore()
    const wrapper = await mountGraph(o)
    handle.setOption.mockClear()
    const state = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(5000)
    expect(handle.setOption).not.toHaveBeenCalled()
    state.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(handle.setOption).toHaveBeenCalledTimes(1)
    state.mockRestore()
    wrapper.destroy()
  })

  it('reseeds from a fresh history load and clears on reset', async () => {
    const o = makeStore()
    const wrapper = await mountGraph(o)
    o.emit('charts/setChartStore', [sample(Date.now() - 3000), sample(Date.now() - 2000), sample(Date.now() - 1000)])
    vi.advanceTimersByTime(1000)
    expect((handle.setOption.mock.calls.at(-1)![0] as any).series.find((s: any) => s.id === 'extruder').data).toHaveLength(3)
    o.emit('charts/setReset', undefined)
    vi.advanceTimersByTime(1000)
    expect((handle.setOption.mock.calls.at(-1)![0] as any).series.find((s: any) => s.id === 'extruder').data).toHaveLength(0)
    wrapper.destroy()
  })

  it('stops listening, ticking and drawing once removed', async () => {
    const o = makeStore()
    const wrapper = await mountGraph(o)
    wrapper.destroy()
    expect(o.listeners).toHaveLength(0)
    handle.setOption.mockClear()
    vi.advanceTimersByTime(5000)
    expect(handle.setOption).not.toHaveBeenCalled()
    expect(handle.dispose).toHaveBeenCalled()
  })
})
