import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import ThermalGraph from '../ThermalGraph.vue'

it('mounts and unmounts in a browser with no 2D canvas, without an error or a stray animation frame', async () => {
  const errors: unknown[] = []
  const onError = (e: unknown) => errors.push(e)
  process.on('unhandledRejection', onError)
  window.addEventListener('error', onError)
  const frames = vi.spyOn(window, 'requestAnimationFrame')
  const printer = Vue.observable<any>({ extruder: { temperature: 200, target: 210, power: 0.3 } })
  const store: any = {
    state: Vue.observable({ printer: { printer }, config: { uiSettings: { theme: { isDark: false } } } }),
    getters: Vue.observable({ 'charts/getChartData': [], 'charts/getChartRetention': 1200, 'charts/getSelectedLegends': {} }),
    dispatch: vi.fn(), commit: vi.fn(), subscribe: vi.fn(() => vi.fn())
  }
  const host = document.createElement('div')
  document.body.appendChild(host)
  const wrapper = mount(ThermalGraph, { mocks: { $store: store }, attachTo: host })
  await new Promise(resolve => setTimeout(resolve, 50))
  expect(wrapper.find('[data-legend="extruder"]').exists()).toBe(true)
  wrapper.destroy()
  await new Promise(resolve => setTimeout(resolve, 100))
  expect(frames).not.toHaveBeenCalled()
  expect(errors).toEqual([])
  process.off('unhandledRejection', onError)
  window.removeEventListener('error', onError)
  host.remove()
})
