import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import MaintenanceMesh from '../MaintenanceMesh.vue'
import BedMeshTile from '../BedMeshTile.vue'
import { panelStore, panelStubs } from '@/components/control/__tests__/panel-fixture'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'
import { sectionOf, visiblePages } from '@/router/printerSections'

vi.mock('@/api/socketActions', () => ({ SocketActions: { printerGcodeScript: vi.fn() } }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock' }))
vi.mock('@/services/account/control-preferences', async () => {
  const { ControlPreferenceStore } = await import('@/services/control/preferences')
  return { controlPreferenceStore: new ControlPreferenceStore({ read: async () => ({ version: 1, folds: {} }), patch: async (_, folds) => ({ version: 1, folds }) }, localStorage) }
})
const settle = async () => { for (let i = 0; i < 12; i++) { await Promise.resolve(); await Vue.nextTick() } }
function show (managed = false, component: any = BedMeshTile) {
  const store = panelStore()
  store.state.config.apiUrl = managed ? 'https://muon-cloud.invalid' : 'http://mock.local'
  printerTransportBinding.remote = managed
  cloudState.activePrinterId = managed ? 'stable-one' : null
  Vue.set(store.state.printer.printer, 'bed_mesh', { probed_matrix: [[-0.12, 0.04], [0.02, 0.15]], profile_name: 'default' })
  for (const [key, value] of Object.entries({ 'mesh/getSupportsBedMesh': true, 'printer/getHomedAxes': (): boolean => true, 'server/componentSupport': (): boolean => false })) Vue.set(store.getters, key, value)
  const wrapper = mount(component, { mocks: { $store: store, $waits: {}, $route: { params: { printer: 'mock' } } }, stubs: { ...panelStubs, 'bed-surface': { props: ['bare'], template: '<div data-tid="bed-3d" />' }, 'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' } } })
  return { wrapper, store }
}
afterEach(() => { localStorage.clear(); cloudState.account = null; cloudState.activePrinterId = null; printerTransportBinding.remote = false })

it('offers Bed only on a capable printer', () => {
  const section = sectionOf('/maintenance')!
  const context = { slicer: false, camera: null, history: false, timelapse: false, diagnostics: false, foreign: false, bedMesh: true }
  expect(visiblePages(section, context).map(p => p.label)).toEqual(['Health', 'Bed'])
  expect(visiblePages(section, { ...context, bedMesh: false }).map(p => p.label)).toEqual(['Health'])
})

it('always writes the heights on the 2D map, with a scale, and offers no Colours/Numbers choice', () => {
  const { wrapper } = show()
  const labels = wrapper.findAll('[role="radio"]').wrappers.map(w => w.text())
  expect(labels).toEqual(['2D', '3D'])
  expect(wrapper.findAll('.mmap__cell').at(0).text()).toBe('-0.12')
  expect(wrapper.find('[role="table"]').attributes('aria-label')).toContain('Bed mesh')
  expect(wrapper.find('[data-tid="mesh-scale"]').text()).toContain('−0.12')
  wrapper.destroy()
})

it('says the bed is not levelled, with grey question marks, when there is no mesh', async () => {
  const { wrapper, store } = show()
  store.state.printer.printer.bed_mesh.probed_matrix = []
  await Vue.nextTick()
  expect(wrapper.find('[data-tid="mesh-heat"]').exists()).toBe(false)
  expect(wrapper.find('[data-tid="mesh-unlevelled"]').text()).toContain('Bed not levelled')
  expect(wrapper.findAll('.mmap__cell--empty').length).toBe(25)
  expect(wrapper.find('.mmap__cell--empty').text()).toBe('?')
  expect(wrapper.text()).toContain('Not levelled')
  wrapper.destroy()
})

it('is a 2D heat map first, and the 3D toggle swaps it for the 3D surface', async () => {
  const { wrapper } = show()
  const radio = (label: string) => wrapper.findAll('[role="radio"]').wrappers.find(w => w.text() === label)!
  expect(radio('2D').attributes('aria-checked')).toBe('true')
  expect(wrapper.find('[data-tid="mesh-heat"]').exists()).toBe(true)
  expect(wrapper.find('[data-tid="bed-3d"]').exists()).toBe(false)
  await radio('3D').trigger('click'); await settle()
  expect(radio('3D').attributes('aria-checked')).toBe('true')
  expect(wrapper.find('[data-tid="bed-3d"]').exists()).toBe(true)
  expect(wrapper.find('[data-tid="mesh-heat"]').exists()).toBe(false)
  wrapper.destroy()
})

it('remembers 3D by stable printer and clears the previous account and printer view', async () => {
  const first = show(true)
  await settle()
  await first.wrapper.findAll('[role="radio"]').wrappers.find(w => w.text() === '3D')!.trigger('click'); await settle()
  first.wrapper.destroy()
  const next = show(true)
  await settle()
  const threeD = () => next.wrapper.findAll('[role="radio"]').wrappers.find(w => w.text() === '3D')!
  expect(threeD().attributes('aria-checked')).toBe('true')
  cloudState.account = { id: 'alice', email: 'alice@example.test', name: 'Alice', created_at: 1 }
  localStorage.setItem('muon.cloud.token', 'alice-token')
  await settle()
  expect(threeD().attributes('aria-checked')).toBe('false')
  cloudState.activePrinterId = 'stable-two'; await settle()
  expect(threeD().attributes('aria-checked')).toBe('false')
  next.wrapper.destroy()
})

it('shows incomplete or invalid measurement cells as unmeasured without NaN colours', async () => {
  const { wrapper, store } = show()
  store.state.printer.printer.bed_mesh.probed_matrix = [[NaN, Infinity], [null, 0.02]]
  await Vue.nextTick()
  expect(wrapper.findAll('[role="cell"][aria-label="Not measured"]').length).toBe(3)
  expect(wrapper.html()).not.toContain('NaN')
  wrapper.destroy()
})

it('shows Health a small map of the bed once, with the way into scoped Bed and no 3D choice, and no numbers on its small cells', () => {
  const { wrapper } = show(false, MaintenanceMesh)
  expect(wrapper.find('[data-tid="mesh-heat"]').exists()).toBe(true)
  expect(wrapper.find('[data-tid="mesh-scale"]').exists()).toBe(false)
  expect(wrapper.find('a').attributes('href')).toBe('/mock/tune')
  expect(wrapper.text()).toContain('Spread')
  expect(wrapper.text()).toContain('0.27 mm')
  expect(wrapper.text()).toContain('default')
  expect(wrapper.findAll('[role="radio"]').length).toBe(0)
  expect(wrapper.findAll('.mmap__cell').at(0).text()).toBe('')
  wrapper.destroy()
})
