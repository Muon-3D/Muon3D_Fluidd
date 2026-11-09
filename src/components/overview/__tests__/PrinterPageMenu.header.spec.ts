import VueRouter from 'vue-router'
import { mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import AppPageTitle from '@/components/layout/AppPageTitle.vue'
import { panelStore, panelStubs, waits } from '@/components/control/__tests__/panel-fixture'

vi.mock('@/api/socketActions', () => ({ SocketActions: { printerGcodeScript: vi.fn() } }))
vi.mock('@/services/printer-pages', async importOriginal => ({
  ...await importOriginal<typeof import('@/services/printer-pages')>(),
  activeSlug: () => 'mock',
  isForeignSlug: () => false
}))

const header = (home: boolean) => mount(AppPageTitle, {
  router: new VueRouter({ mode: 'abstract' }),
  mocks: { $store: panelStore(), $waits: waits },
  computed: {
    foreignRecord: () => undefined,
    displayName: () => 'Mock',
    pillText: () => 'Ready',
    pillTone: () => 'ok',
    currentSection: () => ({ id: home ? 'overview' : 'control', label: 'X', pages: [] }),
    currentPage: () => (home ? '/' : '/control'),
    isMobileViewport: () => false,
    tabs: () => [],
    subtitle: () => ''
  },
  stubs: { ...panelStubs, OverviewActions: true, PrinterPageMenu: true, MaintenanceDue: true, CameraActions: true, TonePill: true }
})

it('puts the three-dot menu in the header of the printer\'s own page only (KAN-1429)', () => {
  const own = header(true)
  expect(own.findAll('printerpagemenu-stub').length).toBe(1)
  own.destroy()
  const other = header(false)
  expect(other.findAll('printerpagemenu-stub').length).toBe(0)
  other.destroy()
})
