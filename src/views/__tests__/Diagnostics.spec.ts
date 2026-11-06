import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Diagnostics from '../Diagnostics.vue'
import { chartsPage } from '@/services/charts/page-state'
import type { DiagnosticsCardConfig } from '@/store/diagnostics/types'

const chart = (id: string, title: string, extra: Partial<DiagnosticsCardConfig> = {}): DiagnosticsCardConfig => ({
  id,
  enabled: true,
  collapsed: false,
  title,
  height: 300,
  icon: '',
  axes: [{ enabled: true, unit: '°C', showLegend: true, metrics: [{ collector: `c.${id}`, name: `${title} value`, style: { lineStyle: 'solid', lineColor: '#f00', fillColor: null, fillOpacity: 0, displayLegend: true } }] }],
  ...extra
})

function mountCharts (options: { on?: boolean, charts?: DiagnosticsCardConfig[], points?: Array<Record<string, unknown>>, connected?: boolean, ready?: boolean, phone?: boolean } = {}) {
  const layout = { container1: options.charts ?? [chart('t', 'Temperatures'), chart('m', 'MCU load'), chart('f', 'Fans'), chart('h', 'Old', { enabled: false })] }
  const dispatch = vi.fn()
  const store = {
    getters: {
      'layout/getLayout': () => layout,
      'charts/getChartRetention': 1200,
      'config/getDisplayName': 'Boxwood',
      'socket/getConnectionState': options.connected ?? true,
      'printer/getKlippyReady': options.ready ?? true
    },
    state: Vue.observable({
      config: { uiSettings: { general: { enableDiagnostics: options.on ?? true } } },
      charts: { diagnostics: options.points ?? [{ 'c.t': 214.6, 'c.m': 3, 'c.f': 80 }] }
    }),
    dispatch
  }
  const confirm = vi.fn(async () => true)
  const wrapper = shallowMount(Diagnostics, {
    mocks: { $store: store, $confirm: confirm, $vuetify: { breakpoint: { mobile: false } } },
    computed: { isMobileViewport: () => options.phone ?? false },
    stubs: { 'frame-icon': true, 'diagnostics-card': true, 'diagnostics-card-config-dialog': true }
  })
  const written = () => dispatch.mock.calls.filter(c => c[0] === 'layout/onLayoutChange').map(c => c[1].value.container1 as DiagnosticsCardConfig[])
  return { wrapper, dispatch, confirm, written }
}

const tiles = (wrapper: ReturnType<typeof mountCharts>['wrapper']) => wrapper.findAll('[data-tid="chart-tile"]').wrappers

describe('Charts, off', () => {
  it('says how to turn them on, and turning them on saves the setting', async () => {
    const { wrapper, dispatch } = mountCharts({ on: false })
    expect(wrapper.find('[data-tid="charts-off"]').text()).toContain('Charts are off on Boxwood')
    expect(tiles(wrapper)).toHaveLength(0)
    await wrapper.get('[data-tid="charts-turn-on"]').trigger('click')
    expect(dispatch).toHaveBeenCalledWith('config/saveByPath', { path: 'uiSettings.general.enableDiagnostics', value: true, server: true })
  })
})

describe('Charts, on', () => {
  it('shows each chart as a tile, the first wide, with its live value and legend; hidden ones wait below', () => {
    const { wrapper } = mountCharts()
    expect(tiles(wrapper).map(t => t.attributes('data-chart'))).toEqual(['Temperatures', 'MCU load', 'Fans'])
    expect(tiles(wrapper).map(t => t.attributes('data-span'))).toEqual(['8', '4', '4'])
    expect(tiles(wrapper)[0].attributes('state')).toBe('214.6 °C')
    expect(tiles(wrapper)[0].find('[data-metric="Temperatures value"]').text()).toContain('214.6 °C')
    expect(wrapper.find('[data-tid="charts-hidden"]').text()).toContain('Old')
    expect(wrapper.find('[data-tid="charts-add-tile"]').exists()).toBe(true)
  })

  it('on a phone the add tile goes; Add chart is in the header', () => {
    const { wrapper } = mountCharts({ phone: true })
    expect(wrapper.classes()).toContain('charts--phone')
    expect(wrapper.find('[data-tid="charts-add-tile"]').exists()).toBe(false)
  })

  it('the header\'s Add chart opens the chart editor with a new chart', async () => {
    const { wrapper } = mountCharts()
    chartsPage.addTick++
    await wrapper.vm.$nextTick()
    const dialog = wrapper.findComponent({ name: 'DiagnosticsCardConfigDialog' })
    expect(dialog.exists()).toBe(true)
    expect((dialog.props('config') as DiagnosticsCardConfig).id).toBe('')
  })

  it('each tile\'s menu moves, sizes, hides and removes it', async () => {
    const { wrapper, written, confirm } = mountCharts()
    const menu = (i: number) => tiles(wrapper)[i].props('menu') as Array<{ id: string, action: () => void, disabled?: boolean }>
    const item = (i: number, id: string) => menu(i).find(m => m.id === id)!
    expect(item(0, 'earlier').disabled).toBe(true)
    item(0, 'later').action()
    expect(written()[0].map(c => c.id)).toEqual(['m', 't', 'f', 'h'])
    item(1, 'wider').action()
    expect(written()[1].find(c => c.id === 'm')!.span).toBe(6)
    item(2, 'hide').action()
    expect(written()[2].find(c => c.id === 'f')!.enabled).toBe(false)
    item(2, 'remove').action()
    expect(confirm).toHaveBeenCalled()
    await vi.waitFor(() => expect(written()[3].map(c => c.id)).toEqual(['t', 'm', 'h']))
  })

  it('shows Show for a hidden chart, which brings it back', async () => {
    const { wrapper, written } = mountCharts()
    await wrapper.get('[data-show="Old"]').trigger('click')
    expect(written()[0].find(c => c.id === 'h')!.enabled).toBe(true)
  })
})

describe('Charts\' states', () => {
  it('no charts: says so, with Add chart', () => {
    const { wrapper } = mountCharts({ charts: [] })
    expect(wrapper.find('[data-tid="charts-empty"]').text()).toContain('No charts yet')
  })

  it('a collector that fails: the tile says which and why, with Edit', () => {
    const { wrapper } = mountCharts({ points: [{ 'c.t': 'printer.nope is undefined', 'c.m': 3, 'c.f': 80 }] })
    expect(tiles(wrapper)[0].find('[data-tid="chart-error"]').text()).toContain('Can\'t read Temperatures value: printer.nope is undefined.')
    expect(tiles(wrapper)[0].attributes('state')).toBe('Error')
    expect(tiles(wrapper)[1].find('[data-tid="chart-error"]').exists()).toBe(false)
  })

  it('nothing in yet: each tile waits for its first reading', () => {
    const { wrapper } = mountCharts({ points: [] })
    expect(tiles(wrapper)[0].find('[data-tid="chart-waiting"]').exists()).toBe(true)
  })

  it('offline or Klipper not ready: the charts say they are paused', () => {
    const offline = mountCharts({ connected: false }).wrapper
    expect(offline.find('[data-tid="charts-offline"]').text()).toContain('Boxwood is offline')
    expect(tiles(offline)[0].attributes('state')).toBe('Paused')
    const notReady = mountCharts({ ready: false }).wrapper
    expect(notReady.find('[data-tid="charts-offline"]').text()).toContain('Klipper isn\'t ready on Boxwood')
  })
})
