<template>
  <tile-shell
    tile="graph"
    title="Temperatures"
    icon="pulse"
    :menu="menu"
    class="gt"
  >
    <template
      v-if="size === 'L'"
      #head
    >
      <seg-picker
        data-tid="graph-range"
        class="gt__range"
        :options="rangeOptions"
        :value="windowSeconds"
        label="Time shown"
        @input="windowSeconds = $event"
      />
    </template>

    <table
      v-if="table || size === 'S'"
      class="gt__table"
      data-tid="graph-table"
    >
      <thead>
        <tr>
          <th>Name</th>
          <th>Power</th>
          <th>Actual</th>
          <th>Target</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.context + row.key"
        >
          <td>
            <i
              class="gt__swatch"
              :style="{ background: colorOf(row.key) }"
            />{{ row.label }}
          </td>
          <td class="gt__num">
            {{ row.power === null ? '—' : `${row.power}%` }}
          </td>
          <td class="gt__num gt__actual">
            {{ row.actual }}
          </td>
          <td>
            <number-field
              v-if="row.heater"
              :value="row.heater.target"
              unit="°"
              :label="`${row.label} target`"
              :min="0"
              :max="row.heater.maxTemp || 350"
              :disabled="!controlReady"
              class="gt__target"
              @change="commitTarget(row.context, row.heater, $event)"
            />
            <span
              v-else
              class="gt__none"
            >—</span>
          </td>
        </tr>
      </tbody>
    </table>
    <thermal-graph
      v-else
      :events="markers"
      :window-seconds="windowSeconds"
      :phone="phone || size === 'M'"
    />
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { chartWindows, defaultChartWindow, sensorRows, type SensorRow } from '@/services/overview/model'
import { observedEvents, type Observation } from '@/services/overview/timeline'
import type { TileMenuItem } from '@/services/overview/tiles'
import type { Heater, Sensor } from '@/store/printer/types'
import type { HistoryItem } from '@/store/history/types'
import TileShell from './TileShell.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import NumberField from '@/components/control/NumberField.vue'
import ThermalGraph from '@/components/charts/ThermalGraph.vue'

const COLORS: Record<string, string> = { extruder: '#ff8c42', heater_bed: '#6aa8ff' }
/** For the other heaters and sensors, in order. */
const MORE_COLORS = ['#b38cff', '#4fd1a5', '#e6c84a', '#ff6b9a', '#8ab4c8', '#c49a6c']

/**
 * The temperature graph (the same one as before: every heater, sensor and
 * fan, each labelled, each switched on or off from its own chip), for the
 * time shown, with observed markers (layer changes, pauses). The three dots
 * swap it for a table of every sensor with exact targets.
 */
@Component({ components: { TileShell, SegPicker, NumberField, ThermalGraph } })
export default class GraphTile extends Mixins(OverviewMixin) {
  table = false
  pickedWindow: number | null = null
  previous: Observation | null = null
  markers: Array<{ at: number, label: string }> = []
  observedSince = 0

  get phone (): boolean { return !!this.$vuetify?.breakpoint?.mobile }

  get windows (): Array<{ value: number, label: string }> {
    return chartWindows(this.$store.getters['charts/getChartRetention'] as number)
  }

  get rangeOptions (): SegOption[] {
    return this.windows.map(w => ({ value: w.value, label: w.value >= 3600 ? `${w.value / 3600}h` : `${Math.round(w.value / 60)}m`, title: w.label }))
  }

  /** The window picked, while the store keeps that much; else the default. */
  get windowSeconds (): number {
    const picked = this.pickedWindow
    if (picked !== null && this.windows.some(w => w.value === picked)) return picked
    return defaultChartWindow(this.windows)
  }

  set windowSeconds (value: number) { this.pickedWindow = value }

  get sensors (): Sensor[] {
    return (this.$store.getters['printer/getSensors'] as Sensor[] | undefined) ?? []
  }

  get allKeys (): string[] {
    const main = ['extruder', 'heater_bed'].filter(k => this.heaters.some(h => h.name === k))
    const others = this.heaters.map(h => h.name).filter(k => !main.includes(k))
    return [...main, ...others, ...this.sensors.map(s => s.key)]
  }

  get rows (): Array<SensorRow<Heater> & { context: string }> {
    return sensorRows(this.heaters, this.sensors).map(row => ({ ...row, context: this.panelTarget }))
  }

  commitTarget (context: string, heater: Heater, value: number) {
    if (context === this.panelTarget) this.setHeater(heater, value)
  }

  colorOf (key: string): string {
    if (COLORS[key]) return COLORS[key]
    const others = this.allKeys.filter(k => !COLORS[k])
    const i = others.indexOf(key)
    return i >= 0 ? MORE_COLORS[i % MORE_COLORS.length] : 'var(--m3d-text-muted)'
  }

  get diagnosticsOn (): boolean { return !!this.$store.state.config.uiSettings.general.enableDiagnostics }

  get menu (): TileMenuItem[] {
    const items: TileMenuItem[] = [
      { id: 'table', label: this.table ? 'Show the graph' : 'Show every sensor as a table', action: () => { this.table = !this.table } },
      { id: 'presets', label: 'Temperature presets…', to: `${this.pagePath('/settings')}#presets` }
    ]
    if (this.diagnosticsOn) items.push({ id: 'charts', label: 'Open Charts…', to: this.pagePath('/diagnostics') })
    return items
  }

  // What has been seen happen to the print, drawn on the graph. Only real changes are kept.
  get currentHistory (): HistoryItem | undefined {
    return this.$store.state.history?.jobs?.find((j: HistoryItem) => j.status === 'in_progress' && j.filename === this.jobFile)
  }

  get historyContext (): string {
    return `${this.panelTarget}|${this.currentHistory?.job_id ?? this.jobFile}|${this.socketConnected && this.klippyConnected}`
  }

  get liveObservation (): Observation {
    const printer = this.$store.state.printer.printer
    const filament: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(printer)) {
      const sensor = value as { filament_detected?: boolean } | null
      if (/^filament_(switch|motion)_sensor /.test(key) && typeof sensor?.filament_detected === 'boolean') filament[key] = sensor.filament_detected
    }
    return { context: this.historyContext, layer: printer.print_stats?.info?.current_layer, paused: printer.pause_resume?.is_paused, duration: printer.print_stats?.total_duration, filament }
  }

  @Watch('liveObservation', { deep: true, immediate: true })
  recordObservation (current: Observation) {
    if (!this.socketConnected || !this.klippyConnected || !this.apiConnected) { this.previous = null; this.markers = []; this.observedSince = 0; return }
    const at = Date.now()
    if (!this.previous || current.context !== this.previous.context || (typeof current.duration === 'number' && typeof this.previous.duration === 'number' && current.duration < this.previous.duration)) { this.markers = []; this.observedSince = at; this.previous = null }
    this.markers.push(...observedEvents(this.previous, current, at))
    if (this.markers.length > 512) { this.markers = this.markers.slice(-512); this.observedSince = this.markers[0].at }
    this.previous = current
  }
}
</script>

<style lang="scss">
.gt { container-type: inline-size; }
.gt__range { max-width: 220px; }
.gt__table { width: 100%; border-collapse: collapse; font-size: 14px; }
.gt__table th { padding: 0 8px 8px 0; color: var(--m3d-text-muted); font-size: 12px; font-weight: 500; text-align: left; }
.gt__table td { height: 36px; padding: 0 8px 0 0; border-top: 1px solid var(--m3d-border); white-space: nowrap; }
.gt__swatch { display: inline-block; width: 10px; height: 10px; margin-right: 8px; border-radius: 3px; vertical-align: -1px; }
.gt__num { color: var(--m3d-text-muted); font-variant-numeric: tabular-nums; }
.gt__actual { color: var(--m3d-text); font-weight: 600; }
.gt__target { width: 88px; }
.gt__none { color: var(--m3d-text-subtle); }
</style>
