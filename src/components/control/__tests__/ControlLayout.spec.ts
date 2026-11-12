import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import Control from '@/views/Control.vue'
import AppPageTitle from '@/components/layout/AppPageTitle.vue'
import { panelStore, panelStubs, waits } from './panel-fixture'

vi.mock('@/api/socketActions', () => ({ SocketActions: { printerGcodeScript: vi.fn(), printerQueryEndstops: vi.fn() } }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))

const printerActions = ['motors-off', 'restart-klipper', 'restart-firmware', 'save-config']

it.each([false, true])('renders each printer action once across the Control page and header on phone=%s', phone => {
  const store = panelStore()
  const mocks = { $store: store, $waits: waits, $route: { name: 'control', path: '/mock/control', params: { printer: 'mock' }, meta: { frame: 'printer' } }, $confirm: vi.fn() }
  const page = mount(Control, { mocks, computed: { isMobileViewport: () => phone }, stubs: { ...panelStubs, MaterialPicker: true } })
  const header = mount(AppPageTitle, {
    mocks,
    computed: {
      currentSection: () => ({ id: 'control', label: 'Control', pages: [] }),
      currentPage: () => '/control',
      isMobileViewport: () => phone,
      tabs: () => [],
      subtitle: () => ''
    },
    stubs: { ...panelStubs, OverviewActions: true, PrinterPageMenu: true, MaintenanceDue: true, CameraActions: true, TonePill: true }
  })

  for (const action of printerActions) {
    expect(page.findAll(`[data-tid="${action}"]`).length + header.findAll(`[data-tid="${action}"]`).length).toBe(1)
  }

  page.destroy()
  header.destroy()
})

it.each([false, true])('keeps all five task panels with either legacy setting on phone=%s', phone => {
  const store = panelStore()
  store.state.printer.printer.configfile.settings.input_shaper = { shaper_type_x: 'mzv', shaper_freq_x: 47.4, shaper_type_y: 'mzv', shaper_freq_y: 71.4 }
  for (const pro of [false, true]) {
    localStorage.setItem('muon3d.pro', pro ? '1' : '0')
    const wrapper = mount(Control, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } } }, computed: { isMobileViewport: () => phone }, stubs: { ...panelStubs, MaterialPicker: true } })
    for (const name of ['heat', 'move', 'filament', 'printmode', 'quick']) expect(wrapper.findAll(`[data-tid="control-${name}"]`).length).toBe(1)
    expect(wrapper.find('[data-tid="control-shaper"]').exists()).toBe(false)
    expect(wrapper.find('[data-tid="control-endstops"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-tid="control-retraction"]').length).toBe(0)
    expect(wrapper.find('[data-tid="control-actions"]').exists()).toBe(phone)
    wrapper.destroy()
  }
})

it('drops the previous printer’s macro form when the selected connection changes', async () => {
  const store = panelStore()
  store.state.printer.printer.configfile.settings['gcode_macro PARK_HEAD'] = { gcode: '{params.SPEED | default(100)}' }
  const wrapper = mount(Control, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } } }, computed: { isMobileViewport: () => false }, stubs: { ...panelStubs, MaterialPicker: true } })
  await wrapper.find('[data-tid="qc-PARK_HEAD"]').trigger('click')
  expect(wrapper.find('[data-tid="macro-send"]').exists()).toBe(true)
  store.state.config.apiUrl = 'http://other.local'; await wrapper.vm.$nextTick()
  expect(wrapper.find('[data-tid="macro-send"]').exists()).toBe(false)
  wrapper.destroy()
})

it('lays the page out as D3 tiles, and Edit layout hides, reorders and saves per person per printer', async () => {
  localStorage.clear()
  const store = panelStore()
  const mocks = { $store: store, $waits: waits, $route: { params: { printer: 'mock' } } }
  const wrapper = mount(Control, { mocks, computed: { isMobileViewport: () => false }, stubs: { ...panelStubs, MaterialPicker: true } })
  const order = () => wrapper.findAll('[data-cell]').wrappers.map(w => w.attributes('data-cell'))
  // Movement, Heaters, Print mode, Filament, Quick commands. No Z offset tile; Fans is added from Edit layout (KAN-1951).
  expect(order()).toEqual(['move', 'heat', 'speed', 'filament', 'macros'])
  expect(wrapper.find('[data-tid="control-fans"]').exists()).toBe(false)
  expect(wrapper.find('[data-tid="control-zoffset"]').exists()).toBe(false)

  await wrapper.find('[data-tid="edit-open"]').trigger('click')
  await wrapper.find('[aria-label="Hide Quick commands"]').trigger('click')
  await wrapper.find('[aria-label="Move Heaters later"]').trigger('click')
  expect(order()).toEqual(['move', 'speed', 'heat', 'filament'])
  expect(wrapper.find('[data-tid="add-macros"]').exists()).toBe(true)
  await wrapper.find('[data-tid="edit-done"]').trigger('click')

  expect(store.dispatch).toHaveBeenCalledWith('config/saveByPath', expect.objectContaining({ path: expect.stringMatching(/^uiSettings.control.layouts.anonymous__/), server: true }))
  expect(Object.keys(localStorage).some(k => k.startsWith('muon.control.layout.v3.'))).toBe(true)
  expect(Object.keys(localStorage).some(k => k.startsWith('muon.overview.layout.v3.'))).toBe(false)
  wrapper.destroy()
  localStorage.clear()
})

it('sends nothing from a tile while the layout is being edited', async () => {
  const store = panelStore()
  const wrapper = mount(Control, { mocks: { $store: store, $waits: waits, $route: { params: { printer: 'mock' } } }, computed: { isMobileViewport: () => false }, stubs: { ...panelStubs, MaterialPicker: true } })
  await wrapper.find('[data-tid="edit-open"]').trigger('click')
  await wrapper.find('[data-tid="home-all"]').trigger('click')
  await wrapper.find('[aria-label="Head right (X+)"]').trigger('click')
  const { SocketActions } = await import('@/api/socketActions')
  expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
  wrapper.destroy()
})
