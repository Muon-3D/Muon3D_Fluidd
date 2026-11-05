import Vue from 'vue'
import { vi } from 'vitest'
import { panelStore } from '@/components/control/__tests__/panel-fixture'

/** Stand-in for SocketActions: each spec mocks the module with this (see mockSocket). */
export const socket = { printerGcodeScript: vi.fn(), printerPrintCancel: vi.fn(), printerPrintPause: vi.fn(), printerPrintResume: vi.fn() }

/** The gcode lines sent through the mocked socket, in order. */
export const sent = (): string[] => socket.printerGcodeScript.mock.calls.map(c => c[0] as string)

export const resetSocket = () => Object.values(socket).forEach(f => f.mockClear())

interface Options {
  /** A print is running. */
  printing?: boolean;
  /** A printer that reports nothing at all. */
  empty?: boolean;
}

/**
 * The store an Overview tile reads, built on Control panel fixture: a ready
 * M1, homed, with two heaters; or, with `empty`, one that has told us nothing.
 */
export function tileStore (options: Options = {}) {
  const store = panelStore() as ReturnType<typeof panelStore> & { state: any, getters: any }
  const g = store.getters
  const printer = store.state.printer.printer
  const set = (key: string, value: unknown) => Vue.set(g, key, value)

  set('printer/getPrinterState', options.printing ? 'printing' : 'ready')
  set('printer/getPrintProgress', options.printing ? 0.45 : 0)
  set('printer/getPrintLayer', options.printing ? 27 : 0)
  set('printer/getPrintLayers', options.printing ? 63 : 0)
  set('printer/getTimeEstimates', { eta: options.printing ? Date.now() + 48 * 60000 : 0 })
  set('printer/getAvailableCommands', {})
  set('printer/getProbe', undefined)
  set('webcams/getEnabledWebcams', [])
  set('spoolman/getActiveSpool', undefined)
  set('spoolman/getAvailable', false)
  set('jobQueue/getQueuedJobs', [])
  set('history/getUniqueHistory', () => [])
  set('mesh/getSupportsBedMesh', true)
  set('server/componentSupport', () => false)
  set('power/getDevices', [])
  set('charts/getChartRetention', 600)
  set('charts/getSelectedLegends', {})
  set('charts/getChartData', [])
  set('printer/getAllFans', [
    { name: 'fan', prettyName: 'Part fan', type: 'fan', speed: 0.8, controllable: true, config: { max_power: 1, off_below: 0 } },
    { name: 'heater_fan hotend_fan', prettyName: 'Hotend fan', type: 'heater_fan', speed: 1, controllable: false, config: { max_power: 1, off_below: 0 } }
  ])
  set('macros/getMacros', [])
  set('config/getTempPresets', [
    { id: 1, name: 'PLA', gcode: '', values: { extruder: { active: true, type: 'heater', value: 215 }, heater_bed: { active: true, type: 'heater', value: 60 } } },
    { id: 2, name: 'PETG', gcode: '', values: { extruder: { active: true, type: 'heater', value: 240 }, heater_bed: { active: true, type: 'heater', value: 80 } } }
  ])

  Vue.set(printer, 'gcode_move', { speed_factor: 1, extrude_factor: 0.98, homing_origin: [0, 0, -0.045, 0] })
  Vue.set(printer, 'print_stats', { filename: options.printing ? 'M1_bracket_PLA.gcode' : '', state: options.printing ? 'printing' : 'standby', total_duration: options.printing ? 2400 : 0, print_duration: options.printing ? 2300 : 0 })
  Vue.set(printer, 'current_file', {})
  Vue.set(printer, 'bed_mesh', { mesh_matrix: [[0]] })
  Vue.set(store.extruder, 'pressure_advance', 0.042)

  if (options.empty) {
    set('printer/getHeaters', [])
    set('printer/getSensors', [])
    set('printer/getAllFans', [])
    set('macros/getMacros', [])
    set('config/getTempPresets', [])
    Vue.set(printer, 'toolhead', {})
    Vue.set(printer, 'gcode_move', {})
    Vue.delete(printer, 'bed_mesh')
    set('printer/getActiveExtruder', undefined)
  }
  return store
}

/** What every tile needs mounted: the store, waits, a desktop viewport, and our own bits stubbed. */
export function tileMount (store: ReturnType<typeof tileStore>, extra: Record<string, unknown> = {}) {
  return {
    mocks: {
      $store: store,
      $waits: { onHomeXY: 'homeXY', onHomeZ: 'homeZ', onHomeAll: 'homeAll', onZAdjust: 'zAdjust' },
      $vuetify: { breakpoint: { mobile: false } },
      $confirm: vi.fn().mockResolvedValue(true)
    },
    stubs: {
      'frame-icon': true,
      'v-icon': { template: '<i class="v-icon"><slot /></i>' },
      'router-link': { props: ['to'], template: '<a :href="to"><slot /></a>' }
    },
    ...extra
  }
}

/** Stands in for M3Dialog (the real one needs Vuetify): shows its title and content while open. Use with vi.mock('@/components/ui/M3Dialog.vue', ...). */
export const m3DialogModule = {
  default: {
    name: 'M3Dialog',
    props: ['value', 'title'],
    render (this: any, h: any) {
      return this.value ? h('div', { attrs: { 'data-stub': 'dialog' } }, [h('h2', this.title), this.$slots.default]) : h()
    }
  }
}

/** Gives the printer macros: what Klipper publishes, and what Settings says about each. */
export function withMacros (store: ReturnType<typeof tileStore>, macros: Array<{ name: string, description?: string, disabledWhilePrinting?: boolean }>) {
  const settings = store.state.printer.printer.configfile.settings
  macros.forEach(m => Vue.set(settings, `gcode_macro ${m.name.toLowerCase()}`, { description: m.description ?? '', gcode: '' }))
  Vue.set(store.getters, 'macros/getMacros', macros.map(m => ({ name: m.name, visible: true, disabledWhilePrinting: !!m.disabledWhilePrinting })))
}
