import { afterEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import Console from '../Console.vue'
import { SocketActions } from '@/api/socketActions'
import { cloudState } from '@/services/muon-cloud/state'
import { printerTransportBinding } from '@/services/managed-session/httpTransportBinding'

vi.mock('@/api/socketActions', () => ({ SocketActions: { printerGcodeScript: vi.fn(), printerEmergencyStop: vi.fn() } }))
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'hazel-1234' }))
vi.mock('@/services/muon-cloud/state', async () => {
  const Vue = (await import('vue')).default
  return { cloudState: Vue.observable({ ready: true, account: null, activePrinterId: null, printers: [], activePrinterId2: null }) }
})

interface Opts { ready?: boolean, connected?: boolean, state?: string, homed?: string, apiUrl?: string }

function show (o: Opts = {}) {
  const { ready = true, connected = true, state = 'ready', homed = 'xyz', apiUrl = 'http://hazel.local' } = o
  return shallowMount(Console, {
    mocks: {
      $store: {
        state: { printer: { printer: { configfile: {}, toolhead: { homed_axes: homed } } }, console: { console: [], commandHistory: [] }, config: { apiUrl, uiSettings: { general: {} } } },
        getters: {
          'socket/getConnectionState': true,
          'socket/getApiConnected': true,
          'auth/getAuthenticated': true,
          'printer/getKlippyReady': ready,
          'printer/getKlippyConnected': connected,
          'printer/getPrinterState': state,
          'console/getAllKnownCommands': {},
          'console/getConsoleEntries': [],
          'macros/getMacros': []
        },
        dispatch: vi.fn()
      },
      $vuetify: { breakpoint: { mdAndDown: false } },
      $confirm: vi.fn().mockResolvedValue(true)
    },
    stubs: { 'router-link': true, 'dynamic-scroller': { template: '<div />', methods: { scrollToBottom () {} } } }
  })
}

const chip = (w: ReturnType<typeof show>, name: string) => w.find(`[data-tid="console-quick-${name}"]`).element as HTMLButtonElement

afterEach(() => {
  vi.clearAllMocks()
  cloudState.ready = true
  cloudState.account = null
  cloudState.activePrinterId = null
  cloudState.printers = []
  printerTransportBinding.remote = false
})

describe('Console quick commands', () => {
  it('are not drawn while the account is still loading, then appear for the account', async () => {
    cloudState.ready = false
    const w = show()
    expect(w.find('[data-tid="console-quick-G28"]').exists()).toBe(false)
    cloudState.ready = true
    await w.vm.$nextTick()
    expect(w.find('[data-tid="console-quick-G28"]').exists()).toBe(true)
  })

  it('are all live on an idle, homed, ready printer', () => {
    const w = show()
    for (const c of ['G28', 'M105', 'BED_MESH_CALIBRATE', 'QUERY_PROBE', 'STATUS']) expect(chip(w, c).disabled, c).toBe(false)
  })

  it('leave every chip but the restart off when Klipper is connected but not ready', () => {
    const w = show({ ready: false })
    for (const c of ['G28', 'M105', 'BED_MESH_CALIBRATE', 'QUERY_PROBE', 'STATUS']) expect(chip(w, c).disabled, c).toBe(true)
  })

  it('leave the moving chips off while the printer is busy', () => {
    const w = show({ state: 'printing' })
    expect(chip(w, 'G28').disabled).toBe(true)
    expect(chip(w, 'BED_MESH_CALIBRATE').disabled).toBe(true)
    expect(chip(w, 'M105').disabled).toBe(false)
  })

  it('leave the mesh chip off until every axis is homed', () => {
    const w = show({ homed: 'xy' })
    expect(chip(w, 'BED_MESH_CALIBRATE').disabled).toBe(true)
    expect(chip(w, 'BED_MESH_CALIBRATE').title).toBe('Home the printer first')
    expect(chip(w, 'G28').disabled).toBe(false)
  })

  it('are all off for a viewer who cannot control the printer', () => {
    printerTransportBinding.remote = true
    const w = show({ apiUrl: 'https://muon3d.example/api' })
    for (const c of ['G28', 'M105', 'BED_MESH_CALIBRATE', 'QUERY_PROBE', 'STATUS']) expect(chip(w, c).disabled, c).toBe(true)
    expect(SocketActions.printerGcodeScript).not.toHaveBeenCalled()
  })
})
