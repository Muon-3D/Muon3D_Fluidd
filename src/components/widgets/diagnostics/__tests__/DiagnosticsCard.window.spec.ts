import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DiagnosticsCard from '../DiagnosticsCard.vue'
import type { DiagnosticsCardConfig } from '@/store/diagnostics/types'

const config: DiagnosticsCardConfig = {
  id: 'c',
  enabled: true,
  collapsed: false,
  title: 'Speed',
  height: 200,
  icon: '',
  axes: [{ enabled: true, unit: 'mm/s', showLegend: true, metrics: [{ collector: 'x', name: 'X', style: { lineStyle: 'solid', lineColor: '#f00', fillColor: null, fillOpacity: 0, displayLegend: true } }] }]
}

function xMin (window: number | undefined, latest: number): number {
  const wrapper = shallowMount(DiagnosticsCard, {
    propsData: { config, bare: true, ...(window === undefined ? {} : { window }) },
    mocks: {
      $store: {
        state: { config: { uiSettings: { theme: { isDark: true } } }, charts: { diagnostics: [] } },
        getters: { 'charts/getChartRetention': 1200, 'config/getChartFontFamily': 'sans-serif' }
      },
      $vuetify: { breakpoint: { mobile: false }, theme: { currentTheme: { primary: '#111', secondary: '#222' } } }
    },
    stubs: { 'app-chart': true }
  })
  const axis = (wrapper.vm as unknown as { options: { xAxis: { min: (v: { max: number }) => number } } }).options.xAxis
  return axis.min({ max: latest })
}

describe('the range the charts plot', () => {
  it('starts that many seconds before the latest reading, so the range picker changes it', () => {
    const latest = 10_000_000
    expect(xMin(60, latest)).toBe(latest - 60_000)
    expect(xMin(600, latest)).toBe(latest - 600_000)
    expect(xMin(3600, latest)).toBe(latest - 3_600_000)
    expect(xMin(60, latest)).not.toBe(xMin(600, latest))
  })

  it('shows all the printer keeps when no range is given', () => {
    expect(xMin(undefined, 10_000_000)).toBe(10_000_000 - 1_200_000)
  })
})
