<template>
  <div
    class="charts"
    :class="{ 'charts--phone': isMobileViewport }"
    data-tid="charts-page"
  >
    <div
      v-if="!collecting"
      class="charts__state"
      data-tid="charts-off"
      role="status"
    >
      <frame-icon name="pulse" />
      <div class="charts__state-text">
        <b>Charts are off on {{ printerName }}</b>
        <p>Collecting their numbers costs a little on every update from the printer, so they are opt-in. Turn them on here, or in Settings › General.</p>
      </div>
      <button
        type="button"
        class="cbtn cbtn--primary"
        data-tid="charts-turn-on"
        @click="turnOn"
      >
        Turn on charts
      </button>
    </div>

    <template v-else>
      <div
        v-if="paused"
        class="charts__state charts__state--warn"
        data-tid="charts-offline"
        role="status"
      >
        <frame-icon name="alert" />
        <div class="charts__state-text">
          <b>{{ pausedTitle }}</b>
          <p>The charts stop at the last reading and carry on by themselves when it reports again.</p>
        </div>
      </div>

      <div
        v-if="!charts.length"
        class="charts__state"
        data-tid="charts-empty"
      >
        <frame-icon name="pulse" />
        <div class="charts__state-text">
          <b>No charts yet</b>
          <p>Add one: pick what to draw from anything {{ printerName }} reports, its unit and its colour.</p>
        </div>
        <button
          type="button"
          class="cbtn cbtn--primary"
          data-tid="charts-empty-add"
          @click="add"
        >
          <frame-icon
            name="plus"
            small
          />
          Add chart
        </button>
      </div>

      <div
        v-if="shown.length || !isMobileViewport"
        class="charts__grid"
      >
        <tile-shell
          v-for="(chart, i) in shown"
          :key="chart.id"
          :tile="`chart-${chart.id}`"
          :title="chart.title"
          :icon="iconOf(chart)"
          :state="pill(chart)"
          :tone="toneOf(chart)"
          :menu="menuFor(chart, i)"
          class="charts__tile"
          :class="`charts__tile--s${spanOf(chart, i)}`"
          :data-chart="chart.title"
          :data-span="spanOf(chart, i)"
          data-tid="chart-tile"
        >
          <div
            v-if="errorsOf(chart).length"
            class="charts__error"
            data-tid="chart-error"
            role="alert"
          >
            <span
              v-for="e in errorsOf(chart)"
              :key="e.key"
            >Can't read {{ e.name }}: {{ e.message }}.</span>
            <button
              type="button"
              class="charts__link"
              data-tid="chart-error-edit"
              @click="edit(chart)"
            >
              Edit chart
            </button>
          </div>
          <div class="charts__plot">
            <diagnostics-card
              :config="chart"
              :window="range"
              bare
            />
            <p
              v-if="waiting"
              class="charts__waiting"
              data-tid="chart-waiting"
            >
              Waiting for the first reading…
            </p>
          </div>
          <ul
            class="charts__legend"
            data-tid="chart-legend"
          >
            <li
              v-for="metric in legend(chart)"
              :key="metric.key"
              :data-metric="metric.name"
            >
              <i :style="{ background: metric.color }" />
              <span>{{ metric.name }}</span>
              <b>{{ metric.value }}</b>
            </li>
          </ul>
        </tile-shell>

        <button
          v-if="!isMobileViewport"
          type="button"
          class="charts__add charts__tile--s12"
          data-tid="charts-add-tile"
          @click="add"
        >
          <frame-icon name="plus" />
          <span>
            <b>Add a chart</b>
            <small>Pick what to draw from anything {{ printerName }} reports: its unit and its colour.</small>
          </span>
        </button>
      </div>

      <section
        v-if="hidden.length"
        class="charts__hidden"
        data-tid="charts-hidden"
      >
        <h3>Hidden</h3>
        <div class="charts__hidden-list">
          <span
            v-for="chart in hidden"
            :key="chart.id"
            class="charts__hidden-item"
          >
            {{ chart.title }}
            <button
              type="button"
              class="charts__link"
              :data-show="chart.title"
              @click="setShown(chart.id, true)"
            >
              Show
            </button>
          </span>
        </div>
      </section>
    </template>

    <diagnostics-card-config-dialog
      v-if="dialog.open"
      v-model="dialog.open"
      :config="dialog.card"
      @save="save"
      @delete="remove"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import { v4 as uuidv4 } from 'uuid'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import type { DiagnosticsCardConfig, DiagnosticsCardContainer } from '@/store/diagnostics/types'
import { newChartTemplate } from '@/store/layout/state'
import {
  chartIcon, chartSpan, effectiveRange, flattenCharts, formatMetric, layoutFrom, metricError, metricValue, moveChart, nextSpan,
  type ChartSpan
} from '@/services/charts/model'
import { chartsPage } from '@/services/charts/page-state'
import { printerNameParts } from '@/util/printer-name'
import TileShell from '@/components/widgets/overview/tiles/TileShell.vue'
import type { TileMenuItem } from '@/services/overview/tiles'
import DiagnosticsCard from '@/components/widgets/diagnostics/DiagnosticsCard.vue'
import DiagnosticsCardConfigDialog from '@/components/widgets/diagnostics/DiagnosticsCardConfigDialog.vue'

const SPAN_NAMES: Record<ChartSpan, string> = { 4: 'Small', 6: 'Half', 8: 'Wide', 12: 'Full width' }

/**
 * Charts: your own charts from anything the printer reports, as tiles on a
 * twelve-column grid (the first wide, the rest small, unless you size them),
 * each with a live value and a legend. The header holds one time range for
 * them all, and Add chart. Each tile's menu edits, moves, sizes, hides and
 * removes it; hidden ones wait below. Each is still Fluidd's chart, kept in
 * Fluidd's layout store and edited with Fluidd's chart editor.
 */
@Component({ components: { TileShell, DiagnosticsCard, DiagnosticsCardConfigDialog } })
export default class Diagnostics extends Mixins(StateMixin, BrowserMixin) {
  dialog: { open: boolean, card: DiagnosticsCardConfig | null } = { open: false, card: null }
  page = chartsPage

  @Watch('page.addTick')
  onAddTick () {
    this.add()
  }

  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  get charts (): DiagnosticsCardConfig[] {
    return flattenCharts(this.$store.getters['layout/getLayout']('diagnostics') as DiagnosticsCardContainer)
  }

  get shown (): DiagnosticsCardConfig[] {
    return this.charts.filter(c => c.enabled)
  }

  get hidden (): DiagnosticsCardConfig[] {
    return this.charts.filter(c => !c.enabled)
  }

  /** Settings › General's diagnostics switch, which also shows this page's tab. */
  get collecting (): boolean {
    return !!this.$store.state.config.uiSettings.general.enableDiagnostics
  }

  get points (): Array<Record<string, unknown>> {
    return (this.$store.state.charts.diagnostics as Array<Record<string, unknown>> | undefined) ?? []
  }

  get range (): number {
    return effectiveRange(this.page.range, this.$store.getters['charts/getChartRetention'] as number)
  }

  /** Nothing new comes in: the printer is offline, or Klipper isn't ready. */
  get paused (): boolean {
    return !this.socketConnected || !this.klippyReady
  }

  get pausedTitle (): string {
    return this.socketConnected
      ? `Klipper isn't ready on ${this.printerName}, so nothing new is drawn`
      : `${this.printerName} is offline, so nothing new is drawn`
  }

  get waiting (): boolean {
    return !this.points.length && !this.paused
  }

  turnOn () {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.enableDiagnostics', value: true, server: true })
  }

  iconOf (chart: DiagnosticsCardConfig): string {
    return chartIcon(chart)
  }

  spanOf (chart: DiagnosticsCardConfig, index: number): ChartSpan {
    return chartSpan(chart, index)
  }

  legend (chart: DiagnosticsCardConfig) {
    return chart.axes
      .filter(axis => axis.enabled)
      .flatMap((axis, a) => axis.metrics.map((metric, i) => ({
        key: `${a}-${i}`,
        name: metric.name,
        color: metric.style.lineColor,
        value: formatMetric(metricValue(this.points, metric.collector), axis.unit)
      })))
  }

  errorsOf (chart: DiagnosticsCardConfig) {
    return chart.axes
      .filter(axis => axis.enabled)
      .flatMap((axis, a) => axis.metrics.map((metric, i) => ({
        key: `${a}-${i}`,
        name: metric.name,
        message: metricError(this.points, metric.collector)
      })))
      .filter(e => e.message !== null)
  }

  /** The tile's pill: its first value, live; Error, or Paused. */
  pill (chart: DiagnosticsCardConfig): string {
    if (this.errorsOf(chart).length) return 'Error'
    if (this.paused) return 'Paused'
    const axis = chart.axes.find(a => a.enabled && a.metrics.length)
    if (!axis) return ''
    const value = metricValue(this.points, axis.metrics[0].collector)
    return formatMetric(value === null ? null : Number(value.toFixed(Math.abs(value) >= 1 ? 1 : 3)), axis.unit)
  }

  toneOf (chart: DiagnosticsCardConfig): string {
    if (this.errorsOf(chart).length) return 'bad'
    if (this.paused || this.waiting) return 'off'
    return 'run'
  }

  menuFor (chart: DiagnosticsCardConfig, index: number): TileMenuItem[] {
    const span = this.spanOf(chart, index)
    return [
      { id: 'edit', label: 'Edit chart…', action: () => this.edit(chart) },
      { id: 'earlier', label: 'Move earlier', disabled: index === 0, action: () => this.move(chart.id, -1) },
      { id: 'later', label: 'Move later', disabled: index === this.shown.length - 1, action: () => this.move(chart.id, 1) },
      { id: 'wider', label: 'Make wider', hint: SPAN_NAMES[span], disabled: span === 12, action: () => this.resize(chart, index, 1) },
      { id: 'narrower', label: 'Make narrower', hint: SPAN_NAMES[span], disabled: span === 4, action: () => this.resize(chart, index, -1) },
      { id: 'hide', label: 'Hide', action: () => this.setShown(chart.id, false) },
      { id: 'remove', label: 'Remove…', action: () => this.confirmRemove(chart) }
    ]
  }

  write (charts: DiagnosticsCardConfig[]) {
    this.$store.dispatch('layout/onLayoutChange', { name: 'diagnostics', value: layoutFrom(charts) })
  }

  move (id: string, by: number) {
    // Moving among the charts shown; hidden ones keep their places after them.
    this.write([...moveChart(this.shown, id, by), ...this.hidden])
  }

  resize (chart: DiagnosticsCardConfig, index: number, by: 1 | -1) {
    const span = nextSpan(this.spanOf(chart, index), by)
    this.write(this.charts.map(c => (c.id === chart.id ? { ...c, span } : c)))
  }

  setShown (id: string, enabled: boolean) {
    this.write(this.charts.map(c => (c.id === id ? { ...c, enabled } : c)))
  }

  async confirmRemove (chart: DiagnosticsCardConfig) {
    const ok = await this.$confirm('Its numbers stop being collected. You can add it again from Add chart.', {
      title: `Remove ${chart.title} from ${this.printerName}'s charts?`,
      buttonTrueText: 'Remove',
      danger: true
    })
    if (ok) this.remove(chart.id)
  }

  add () {
    const card = JSON.parse(JSON.stringify(newChartTemplate())) as DiagnosticsCardConfig
    card.id = ''
    delete card.span
    this.dialog = { open: true, card }
  }

  edit (chart: DiagnosticsCardConfig) {
    this.dialog = { open: true, card: JSON.parse(JSON.stringify(chart)) }
  }

  save (card: DiagnosticsCardConfig) {
    if (card.id === '') {
      this.write([...this.charts, { ...card, id: uuidv4(), enabled: true }])
    } else {
      this.write(this.charts.map(c => (c.id === card.id ? card : c)))
    }
  }

  remove (id: string) {
    this.write(this.charts.filter(c => c.id !== id))
  }
}
</script>

<style lang="scss" scoped>
  .charts {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .charts__state {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    border-radius: 22px;
    background: var(--m3d-surface);

    > .frame-icon {
      flex: none;
      color: var(--m3d-text-muted);
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13.5px;
    }

    b {
      font-size: 15px;
      font-weight: 600;
    }
  }

  .charts__state--warn > .frame-icon {
    color: var(--m3d-warning);
  }

  .charts__state-text {
    flex: 1 1 auto;
    min-width: 0;
  }

  .charts__grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 16px;
  }

  .charts__tile--s4 { grid-column: span 4; }
  .charts__tile--s6 { grid-column: span 6; }
  .charts__tile--s8 { grid-column: span 8; }
  .charts__tile--s12 { grid-column: span 12; }

  .charts__plot {
    position: relative;
    min-width: 0;
  }

  .charts__waiting {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
    pointer-events: none;
  }

  .charts__error {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 8px;
    padding: 8px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--m3d-danger) 12%, transparent);
    color: var(--m3d-danger);
    font-size: 13px;
  }

  .charts__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;
  }

  .charts__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 12.5px;

    li {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    i {
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }

    span {
      color: var(--m3d-text-muted);
    }

    b {
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .charts__add {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 88px;
    padding: 16px 18px;
    border: 1.5px dashed var(--m3d-border-strong);
    border-radius: 22px;
    color: var(--m3d-text-muted);
    text-align: left;

    span {
      display: flex;
      flex-direction: column;
    }

    b {
      color: var(--m3d-text);
      font-size: 15px;
      font-weight: 600;
    }

    small {
      font-size: 13px;
    }

    &:hover {
      background: var(--m3d-hover, var(--m3d-fill));
    }
  }

  .charts__hidden h3 {
    margin: 0 0 8px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .charts__hidden-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .charts__hidden-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px 6px 14px;
    border-radius: 999px;
    background: var(--m3d-surface);
    font-size: 13px;
  }

  @media (max-width: 1100px) {
    .charts__tile--s4,
    .charts__tile--s6 { grid-column: span 6; }
    .charts__tile--s8 { grid-column: span 12; }
  }

  .charts--phone {
    .charts__grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 12px;
    }

    .charts__tile--s4,
    .charts__tile--s6,
    .charts__tile--s8,
    .charts__tile--s12 { grid-column: auto; }

    .charts__state {
      flex-wrap: wrap;
    }
  }
</style>
