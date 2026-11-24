import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AdminPanel from '../AdminPanel.vue'
import AdminTile from '../AdminTile.vue'
import type { CatalogPanel } from '@/services/admin/obs'

const stubs = { RouterLink: { template: '<a><slot /></a>' }, AdminChart: { template: '<div class="chart-stub" />' } }
const real: CatalogPanel = { id: 'ov-rps-job', title: 'Requests by service', chart: 'line', unit: 'req/s', status: 'real', query: 'job:muon_http_requests:rate5m' }
const placeholder: CatalogPanel = { id: 'ov-signins', title: 'Sign-ins by method', chart: 'stacked_bar', unit: '/min', status: 'placeholder', needs: { metric: 'muon_console_signins_total{method,result}', emitter: 'muon-console (signin.rs)' } }

describe('admin panel', () => {
  it('a placeholder is dashed, tagged, names its metric and has no menu', () => {
    const w = mount(AdminPanel, { propsData: { panel: placeholder }, stubs })
    expect(w.classes()).toContain('pn--placeholder')
    expect(w.text()).toContain('PLACEHOLDER')
    expect(w.text()).toContain('Not instrumented yet')
    expect(w.text()).toContain('muon_console_signins_total{method,result}')
    expect(w.text()).toContain('Needs: muon-console (signin.rs)')
    expect(w.find('button').exists()).toBe(false)
  })
  it('an unavailable panel names its source, keeps a solid border and offers Retry for that panel', async () => {
    const w = mount(AdminPanel, { propsData: { panel: real, result: { status: 'unavailable', job: 'machine-queue', reason: 'Scrape target 127.0.0.1:9466 is down. Last seen: never.' } }, stubs })
    expect(w.classes()).not.toContain('pn--placeholder')
    expect(w.text()).toContain('No data from machine-queue')
    expect(w.text()).toContain('127.0.0.1:9466')
    await w.get('[data-tid=admin-retry-ov-rps-job]').trigger('click')
    expect(w.emitted('retry')![0]).toEqual(['ov-rps-job'])
  })
  it('a real panel with no points says so, and one with points draws a chart and a table view', async () => {
    expect(mount(AdminPanel, { propsData: { panel: real, result: { status: 'ok', series: [] } }, stubs }).text()).toContain('No data in this range')
    const w = mount(AdminPanel, { propsData: { panel: real, result: { status: 'ok', series: [{ labels: { job: 'muon-console' }, points: [[1, 2], [2, 4]] }] } }, stubs })
    expect(w.find('.chart-stub').exists()).toBe(true)
    await w.get('[data-tid=admin-table-ov-rps-job]').trigger('click')
    expect(w.find('table').text()).toContain('muon-console')
  })
  it('a loading panel is a skeleton, not a chart', () => {
    const w = mount(AdminPanel, { propsData: { panel: real }, stubs })
    expect(w.find('.pn__skel').exists()).toBe(true)
  })
})

describe('admin tile', () => {
  const tile: CatalogPanel = { id: 'ov-services', title: 'Services up', chart: 'tile', status: 'real' }
  it('reads "3 of 5" with an amber dot and the note, so state is never colour alone', () => {
    const w = mount(AdminTile, { propsData: { panel: tile, result: { status: 'ok', value: 3, of: 5, level: 'warning', note: 'machine-queue and tracker are down' } }, stubs })
    expect(w.text()).toContain('3 of 5')
    expect(w.text()).toContain('machine-queue and tracker are down')
    expect(w.find('.tile__dot--warning').exists()).toBe(true)
    expect(w.attributes('aria-label')).toBe('Services up: 3 of 5, machine-queue and tracker are down, warning')
  })
  it('shows a dash and "No data" when the source is unavailable', () => {
    const w = mount(AdminTile, { propsData: { panel: tile, result: { status: 'unavailable' } }, stubs })
    expect(w.text()).toContain('—'); expect(w.text()).toContain('No data')
  })
})
