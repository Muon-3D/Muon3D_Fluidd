import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { expect, it, vi } from 'vitest'
import Maintenance from '@/views/Maintenance.vue'
import ControlTaskFold from '../ControlTaskFold.vue'
import { panelStore, waits } from './panel-fixture'

vi.mock('@/api/socketActions', () => ({ SocketActions: { printerGcodeScript: vi.fn() } }))

const localVue = createLocalVue()
localVue.use(VueRouter)

it.each([
  { query: { sensors: 'open' }, expanded: true },
  { query: {}, expanded: false },
  { query: { sensors: 'closed' }, expanded: false },
  { query: { sensors: ['open'] }, expanded: false },
  { query: { filament: 'open' }, expanded: false }
])('expands Health sensors only for the exact link query $query', async ({ query, expanded }) => {
  const router = new VueRouter({ mode: 'abstract', routes: [{ path: '/maintenance' }] })
  await router.push({ path: '/maintenance', query })
  const wrapper = shallowMount(Maintenance, { localVue, router, mocks: { $store: panelStore(), $waits: waits }, computed: { isMobileViewport: () => false } })
  const fold = wrapper.findComponent(ControlTaskFold)
  expect(fold.props('foldKey')).toBe('maintenance.sensors')
  expect(fold.props('expand')).toBe(expanded)
  wrapper.destroy()
})
