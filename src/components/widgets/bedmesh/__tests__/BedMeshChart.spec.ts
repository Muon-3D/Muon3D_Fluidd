import { shallowMount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import BedMeshChart from '../BedMeshChart.vue'
import { chartInk } from '@/services/charts/theme'

function options (isDark: boolean): any {
  const $store = {
    state: { config: { uiSettings: { theme: { isDark } } }, mesh: { flatSurface: false } },
    getters: { 'printer/getBedSize': { minX: 0, maxX: 200, minY: 0, maxY: 200 }, 'config/getChartFontFamily': 'Inter' }
  }
  const wrapper = shallowMount(BedMeshChart as any, { propsData: { data: [] }, mocks: { $store, $vuetify: { breakpoint: { mobile: false } } }, stubs: { 'e-chart': { template: '<div />', methods: { dispose () {} } } } })
  const opts = (wrapper.vm as any).opts
  wrapper.destroy()
  return opts
}

// echarts-gl takes a 3D axis label's colour from axisLabel.color; set only
// under textStyle (the ECharts 4 place), the labels came out white on white.
it('colours the 3D axis labels with the theme text token, in both themes', () => {
  for (const isDark of [true, false]) {
    const opts = options(isDark)
    for (const axis of ['xAxis3D', 'yAxis3D', 'zAxis3D']) {
      expect(opts[axis].axisLabel.color).toBe(chartInk(isDark).label)
      expect(opts[axis].nameTextStyle.color).toBe(chartInk(isDark).label)
    }
    expect(opts.visualMap.textStyle.color).toBe(chartInk(isDark).label)
  }
})
