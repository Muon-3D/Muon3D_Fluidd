<template>
  <div
    class="tg"
    data-tid="thermal-graph"
  >
    <div
      ref="plot"
      class="tg__plot"
      :style="{ height: `${height}px` }"
      role="img"
      aria-label="Temperature history. Hover or touch the graph for exact readings."
    />
    <div
      class="tg__legend"
      role="group"
      aria-label="Temperature series"
    >
      <div
        v-for="g in groups"
        :key="g.name"
        class="tg__group"
        :data-group="g.name"
      >
        <span class="tg__group-name">{{ g.name }}</span>
        <button
          v-for="s in g.chips"
          :key="s.key"
          type="button"
          class="tg__chip"
          :class="{ off: !isOn(s) }"
          :data-legend="s.key"
          :aria-pressed="isOn(s) ? 'true' : 'false'"
          :title="`${s.group}: ${isOn(s) ? 'click to hide' : 'click to show'}`"
          @click="toggle(s)"
        >
          <i
            class="tg__swatch"
            :class="{ dotted: s.kind !== 'temp' }"
            :style="{ '--tg-color': s.color }"
          />
          <span class="tg__name">{{ s.label }}</span>
          <span
            class="tg__val"
            :data-val="s.key"
          />
        </button>
      </div>
      <button
        v-if="extra > 0 || expanded"
        type="button"
        class="tg__more"
        data-tid="legend-more"
        :aria-expanded="expanded ? 'true' : 'false'"
        @click="expanded = !expanded"
      >
        {{ expanded ? 'Fewer' : `${extra} more` }}
      </button>
    </div>
    <details
      v-if="events.length"
      class="tg__events"
    >
      <summary>Observed markers ({{ events.length }})</summary>
      <ul>
        <li
          v-for="(event, index) in events"
          :key="index"
          :data-event="event.label"
        >
          {{ clock(event.at) }} � {{ event.label }}
        </li>
      </ul>
    </details>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { createGraph, type GraphHandle } from '@/services/charts/engine'
import { buildGraphOption, type GraphLine } from '@/services/charts/graph-option'
import { SeriesRing } from '@/services/charts/ring'
import { discoverSeries, GROUP_ORDER, isSeriesOn, type SeriesDef, type SeriesSelection } from '@/services/charts/series'

/** The graph redraws and the legend refreshes this often, however fast Klipper reports. */
const TICK_MS = 1000

interface Live {
  ring: SeriesRing
  handle: GraphHandle | null
  timer: number | null
  unsubscribe: (() => void) | null
  resizer: ResizeObserver | null
  observer: IntersectionObserver | null
  inView: boolean
  destroyed: boolean
  pending: number | null
  signature: string
}

/**
 * Everything that changes every second lives here, outside Vue's reactivity, so
 * a status update, a new sample or a redraw never re-renders the component.
 */
const live = new WeakMap<Vue, Live>()

/**
 * The temperature graph: a canvas line chart of every heater, sensor and fan the
 * printer reports, with a legend that shows each one's current and target value
 * and lets people hide or show it. Choices are remembered with the chart settings.
 */
@Component({ name: 'ThermalGraph' })
export default class ThermalGraph extends Vue {
  @Prop({ type: Number, default: 1200 }) readonly windowSeconds!: number
  @Prop({ type: Array, default: () => [] }) readonly events!: Array<{ at: number, label: string }>
  @Prop({ type: Number, default: 220 }) readonly height!: number
  @Prop({ type: Boolean, default: false }) readonly phone!: boolean

  /** Changes only when the printer gains or loses a heater, sensor or fan. */
  defs: SeriesDef[] = []
  expanded = false

  get selected (): SeriesSelection { return (this.$store.getters['charts/getSelectedLegends'] ?? {}) as SeriesSelection }
  get dark (): boolean { return !!this.$store.state.config?.uiSettings?.theme?.isDark }

  /** The lines on, until "N more" is opened: then every line the printer has. */
  get chips (): SeriesDef[] {
    if (this.expanded) return this.defs
    return this.defs.filter(d => isSeriesOn(d, this.selected))
  }

  /** The legend by part of the printer, in the graph's own order. */
  get groups (): Array<{ name: string, chips: SeriesDef[] }> {
    return GROUP_ORDER
      .map(name => ({ name, chips: this.chips.filter(d => d.group === name) }))
      .filter(g => g.chips.length)
  }

  get extra (): number { return this.defs.length - this.chips.length }

  clock (at: number): string { return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }

  isOn (def: SeriesDef): boolean { return isSeriesOn(def, this.selected) }

  toggle (def: SeriesDef) {
    this.$store.dispatch('charts/saveSelectedLegends', { ...this.selected, [def.key]: !this.isOn(def) })
  }

  created () {
    const retention = Number(this.$store.getters['charts/getChartRetention']) || 1200
    const state: Live = { ring: new SeriesRing(Math.ceil(retention) + 60), handle: null, timer: null, unsubscribe: null, resizer: null, observer: null, inView: true, destroyed: false, pending: null, signature: '' }
    live.set(this, state)
    state.ring.seed(this.$store.getters['charts/getChartData'] ?? [])
    state.unsubscribe = this.$store.subscribe((mutation: { type: string, payload: any }) => {
      if (mutation.type === 'charts/setChartEntry') { if (mutation.payload?.type === 'chart') state.ring.push(mutation.payload.data) } else if (mutation.type === 'charts/setChartStore') state.ring.seed(mutation.payload ?? [])
      else if (mutation.type === 'charts/setReset') state.ring.clear()
    })
    this.refreshDefs()
  }

  mounted () {
    const state = live.get(this)!
    createGraph(this.$refs.plot as HTMLElement).then(handle => {
      if (state.destroyed) { handle.dispose(); return }
      state.handle = handle
      this.draw()
    }).catch(() => { /* No canvas (an old browser): the legend still works. */ })
    state.timer = window.setInterval(() => this.tick(), TICK_MS)
    document.addEventListener('visibilitychange', this.onVisibility)
    if (typeof IntersectionObserver !== 'undefined') {
      state.observer = new IntersectionObserver(entries => {
        const was = this.shouldDraw()
        state.inView = entries[entries.length - 1]?.isIntersecting !== false
        if (!was && this.shouldDraw()) this.tick()
      })
      state.observer.observe(this.$el)
    }
    if (typeof ResizeObserver !== 'undefined') {
      state.resizer = new ResizeObserver(() => { state.handle?.resize(); this.scheduleDraw() })
      state.resizer.observe(this.$refs.plot as HTMLElement)
    }
    this.paintValues()
  }

  updated () { this.paintValues() }

  beforeDestroy () {
    const state = live.get(this)
    if (!state) return
    state.destroyed = true
    if (state.timer !== null) window.clearInterval(state.timer)
    if (state.pending !== null) window.clearTimeout(state.pending)
    state.unsubscribe?.()
    state.resizer?.disconnect()
    state.observer?.disconnect()
    state.handle?.dispose()
    document.removeEventListener('visibilitychange', this.onVisibility)
    live.delete(this)
  }

  @Watch('windowSeconds')
  @Watch('events')
  @Watch('selected')
  @Watch('dark')
  @Watch('defs')
  @Watch('phone')
  scheduleDraw () {
    const state = live.get(this)
    if (!state || state.pending !== null) return
    state.pending = window.setTimeout(() => { state.pending = null; this.draw() }, 0)
  }

  shouldDraw (): boolean {
    return document.visibilityState !== 'hidden' && live.get(this)?.inView !== false
  }

  onVisibility () { if (this.shouldDraw()) this.tick() }

  /** Once a second: look for new objects, refresh the numbers, redraw. */
  tick () {
    if (!this.shouldDraw()) return
    this.refreshDefs()
    this.paintValues()
    this.draw()
  }

  /** Replaces the series list only when the printer's objects actually changed. */
  refreshDefs () {
    const state = live.get(this)
    if (!state) return
    const next = discoverSeries(this.$store.state.printer.printer)
    const signature = next.map(d => d.key).join('|')
    if (signature === state.signature) return
    state.signature = signature
    this.defs = Object.freeze(next) as SeriesDef[]
  }

  draw () {
    const state = live.get(this)
    if (!state?.handle || !this.shouldDraw()) return
    const to = Date.now()
    const from = to - this.windowSeconds * 1000
    const width = Math.max(120, (this.$refs.plot as HTMLElement).clientWidth || 600)
    const lines: GraphLine[] = []
    for (const def of this.defs) {
      if (!this.isOn(def)) continue
      const line: GraphLine = { def, points: state.ring.extract(def.key, from, to, width, def.scale) }
      // A heater that is off has a target of 0; drawing that would only hug the floor.
      if (def.targetKey) line.targetPoints = state.ring.extract(def.targetKey, from, to, width).filter(p => p[1] > 0)
      lines.push(line)
    }
    state.handle.setOption(buildGraphOption({ lines, from, to, dark: this.dark, markers: this.events, phone: this.phone }))
  }

  /** Writes the current numbers into the legend directly, so a reading never re-renders the component. */
  paintValues () {
    const printer = this.$store.state.printer.printer
    const cells = this.$el?.querySelectorAll?.('[data-val]')
    if (!cells) return
    const byKey = new Map(this.defs.map(d => [d.key, d]))
    cells.forEach(cell => {
      const def = byKey.get(cell.getAttribute('data-val') ?? '')
      if (!def) return
      const object = printer[def.object]
      const value = object?.[def.field]
      let text = ''
      if (typeof value === 'number' && Number.isFinite(value)) {
        if (def.unit === '%') text = `${Math.round(value * def.scale)}%`
        else {
          text = `${value.toFixed(1)}°`
          const target = def.targetKey ? object?.target : undefined
          if (typeof target === 'number' && target > 0) text += ` / ${Math.round(target)}°`
        }
      }
      if (cell.textContent !== text) cell.textContent = text
    })
  }
}
</script>

<style lang="scss" scoped>
  .tg__plot {
    width: 100%;
    min-height: 120px;
  }

  .tg__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    margin-top: 6px;
  }

  .tg__group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px 14px;
  }

  .tg__group-name {
    color: var(--m3d-text-subtle);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .tg__chip,
  .tg__more {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    border: 0;
    background: none;
    color: var(--m3d-text-muted);
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }

  .tg__chip:hover,
  .tg__more:hover {
    color: var(--m3d-text);
  }

  .tg__chip.off {
    opacity: 0.45;
    text-decoration: line-through;
  }

  .tg__swatch {
    display: inline-block;
    width: 14px;
    height: 0;
    border-top: 3px solid var(--tg-color);
    border-radius: 2px;
  }

  .tg__swatch.dotted {
    border-top-style: dotted;
  }

  .tg__name {
    color: var(--m3d-text);
  }

  .tg__val {
    min-width: 3.2em;
    font-variant-numeric: tabular-nums;
  }

  .tg__more {
    text-decoration: underline;
  }

  .tg__events {
    margin-top: 6px;
    font-size: 13px;
    color: var(--m3d-text-muted);
  }

  .tg__events ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }
</style>
