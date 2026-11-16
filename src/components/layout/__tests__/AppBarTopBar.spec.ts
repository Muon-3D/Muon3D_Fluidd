import { describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import AppBar from '../AppBar.vue'

vi.mock('@/api/socketActions', () => ({ SocketActions: {} }))
vi.mock('@/services/muon-cloud/state', () => ({ cloudState: { account: null, activePrinterId: null, printers: [] } }))
vi.mock('@/services/printer-pages', () => ({
  activeSlug: () => 'hazel-1234',
  isForeignSlug: () => false,
  knownPrinters: () => []
}))

function bar (computed: Record<string, unknown> = {}) {
  return shallowMount(AppBar, {
    computed: {
      phone: () => false,
      printerFrame: () => true,
      sectionContext: () => ({ foreign: false }),
      authenticated: () => true,
      socketConnected: () => true,
      klippyReady: () => true,
      showUploadAndPrint: () => true,
      enableKeyboardShortcuts: () => true,
      topNavPowerToggle: () => null,
      inLayout: () => false,
      printerPrinting: () => false,
      printerPaused: () => false,
      uploadTooltip: () => '',
      gcodeAccept: () => '',
      places: () => [],
      placeName: () => 'Printers',
      onLibrary: () => false,
      ...computed
    },
    mocks: {
      $store: { state: { config: { uiSettings: { general: {} } } }, getters: {} },
      $route: { name: 'Overview', path: '/hazel-1234', params: { printer: 'hazel-1234' } },
      $globals: { HEADER_HEIGHT: 64, HEADER_HEIGHT_PHONE: 56 },
      $tc: (key: string) => key,
      $t: (key: string) => key,
      $vuetify: { breakpoint: { mdAndUp: true } }
    },
    stubs: { 'v-app-bar': { template: '<header><slot /></header>' }, 'v-tooltip': { template: '<div><slot name="activator" :on="{}" :attrs="{}" /></div>' } }
  })
}

describe('the top bar', () => {
  it('has no separate keyboard shortcuts button: the account menu holds them', () => {
    const w = bar()
    expect(w.find('[data-tid="keys"]').exists()).toBe(false)
    expect(w.find('[aria-label="Keyboard shortcuts"]').exists()).toBe(false)
  })

  it('has Quick actions and the E-STOP on a printer', () => {
    const w = bar()
    expect(w.find('quickactionsmenu-stub').exists()).toBe(true)
    expect(w.find('[data-tid="estop"]').exists()).toBe(true)
    expect(w.find('[data-tid="estop"]').attributes('disabled')).toBeUndefined()
  })

  it('keeps the E-STOP in the bar, greyed, when the printer cannot be reached', () => {
    const w = bar({ socketConnected: () => false })
    const stop = w.find('[data-tid="estop"]')
    expect(stop.exists()).toBe(true)
    expect(stop.attributes('disabled')).toBeDefined()
  })

  it('has neither on a page with no printer', () => {
    const w = bar({ printerFrame: () => false })
    expect(w.find('quickactionsmenu-stub').exists()).toBe(false)
    expect(w.find('[data-tid="estop"]').exists()).toBe(false)
  })

  it('on a phone, Quick actions take the place of the search icon and the E-STOP stays', () => {
    const w = bar({ phone: () => true })
    expect(w.find('quickactionsmenu-stub').exists()).toBe(true)
    expect(w.find('[data-tid="command-bar-open"]').exists()).toBe(false)
    expect(w.find('[data-tid="estop"]').exists()).toBe(true)
  })

  it('on a phone with no printer, search stays', () => {
    const w = bar({ phone: () => true, printerFrame: () => false })
    expect(w.find('[data-tid="command-bar-open"]').exists()).toBe(true)
  })
})
