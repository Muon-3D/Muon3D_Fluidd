<template>
  <!-- A placeholder: no upstream query, no menu, no hover (spec 4.6). -->
  <section
    v-if="panel.status === 'placeholder'"
    class="pn pn--placeholder"
    :class="{ 'pn--wide': wide }"
    :data-tid="`admin-panel-${panel.id}`"
    data-kind="placeholder"
  >
    <header class="pn__head">
      <h3 class="pn__title pn__title--muted">
        {{ panel.title }}
      </h3>
      <span class="pn__tag mono">PLACEHOLDER</span>
    </header>
    <div class="pn__plot pn__plot--skeleton">
      <svg
        class="pn__wave"
        viewBox="0 0 200 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 40 C 25 10, 50 10, 75 30 S 125 55, 150 25 S 190 15, 200 30"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-dasharray="5 5"
          vector-effect="non-scaling-stroke"
        />
      </svg>
      <div class="pn__over">
        <b>Not instrumented yet</b>
        <code class="mono">{{ metric }}</code>
        <span v-if="panel.needs && panel.needs.emitter">Needs: {{ panel.needs.emitter }}</span>
      </div>
    </div>
  </section>

  <section
    v-else
    class="pn"
    :class="{ 'pn--wide': wide }"
    :data-tid="`admin-panel-${panel.id}`"
    :data-kind="state"
  >
    <header class="pn__head">
      <h3 class="pn__title">
        {{ panel.title }}<span
          v-if="panel.unit && panel.unit !== 'count'"
          class="pn__unit"
        > {{ panel.unit }}</span>
      </h3>
      <span class="pn__tools">
        <span
          v-if="grafana"
          class="pn__graf"
        >
          <button
            type="button"
            class="pn__link"
            :aria-expanded="grafanaOpen"
            @click="grafanaOpen = !grafanaOpen"
          >Grafana</button>
          <span
            v-if="grafanaOpen"
            class="pn__pop"
            role="dialog"
            aria-label="Open in Grafana"
          >
            <template v-if="grafanaUrl">
              <a
                :href="grafanaUrl"
                target="_blank"
                rel="noopener"
              >Open in Grafana</a>
            </template>
            <template v-else>
              Grafana is reachable through an SSH tunnel only. Run <code class="mono">ssh -L 3000:127.0.0.1:3000 vps</code>, then open:
              <code class="mono">{{ tunnelUrl }}</code>
            </template>
          </span>
        </span>
        <span
          v-if="state === 'ok' || state === 'empty'"
          class="pn__menu"
        >
          <button
            type="button"
            class="pn__link"
            :aria-pressed="asTable"
            :data-tid="`admin-table-${panel.id}`"
            @click="asTable = !asTable"
          >{{ asTable ? 'Show chart' : 'Show as table' }}</button>
          <button
            v-if="panel.query"
            type="button"
            class="pn__link"
            @click="copy"
          >{{ copied ? 'Copied' : 'Copy query' }}</button>
        </span>
      </span>
    </header>

    <div
      v-if="state === 'loading'"
      class="pn__plot pn__skel"
      aria-busy="true"
    />
    <div
      v-else-if="state === 'unavailable'"
      class="pn__plot pn__unavail"
      :data-tid="`admin-unavailable-${panel.id}`"
    >
      <b><i class="pn__dot" /> No data from {{ result && result.job ? result.job : 'the data source' }}</b>
      <span>{{ (result && result.reason) || 'The data source did not answer.' }}</span>
      <button
        type="button"
        class="pn__retry"
        :data-tid="`admin-retry-${panel.id}`"
        @click="$emit('retry', panel.id)"
      >
        Retry
      </button>
    </div>
    <div
      v-else-if="state === 'empty'"
      class="pn__plot pn__empty"
    >
      No data in this range
    </div>
    <template v-else>
      <table
        v-if="asTable || isTable"
        class="pn__table"
      >
        <caption class="sr">
          {{ panel.title }}
        </caption>
        <thead>
          <tr>
            <th
              v-for="c in columns"
              :key="c"
              scope="col"
            >
              <button
                type="button"
                class="pn__sort"
                @click="sortBy(c)"
              >
                {{ c }}<span v-if="sort === c">{{ desc ? ' ▼' : ' ▲' }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in rows"
            :key="i"
          >
            <td
              v-for="c in columns"
              :key="c"
              :class="{ mono: typeof row[c] === 'number' }"
            >
              {{ cell(row[c]) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-else-if="panel.chart === 'heatmap'"
        class="pn__heat"
        role="img"
        :aria-label="aria"
      >
        <div
          v-for="(s, i) in series"
          :key="i"
          class="pn__heatrow"
        >
          <span class="mono">{{ name(s, i) }}</span><i
            v-for="(p, j) in s.points"
            :key="j"
            :style="{ opacity: heatOpacity(p[1]) }"
          />
        </div>
      </div>
      <div
        v-else-if="panel.chart === 'state_timeline'"
        class="pn__heat"
        role="img"
        :aria-label="aria"
      >
        <div
          v-for="(s, i) in series"
          :key="i"
          class="pn__heatrow"
        >
          <span class="mono">{{ name(s, i) }}</span><i
            v-for="(p, j) in s.points"
            :key="j"
            :class="p[1] === 1 ? 'up' : p[1] === 0 ? 'down' : 'none'"
          />
        </div>
      </div>
      <admin-chart
        v-else
        :id="panel.id"
        :kind="panel.chart"
        :series="series"
        :unit="panel.unit || ''"
        :thresholds="panel.thresholds || []"
        :label="aria"
      />
      <ul
        v-if="!asTable && !isTable && series.length >= 2 && panel.chart !== 'heatmap' && panel.chart !== 'state_timeline'"
        class="pn__legend"
      >
        <li
          v-for="(s, i) in series.slice(0, 4)"
          :key="i"
        >
          <i :style="{ background: `var(--m3d-chart-${i + 1})` }" />{{ name(s, i) }}
        </li>
        <li v-if="series.length > 4">
          <i style="background: var(--m3d-text-subtle)" />Other
        </li>
      </ul>
    </template>
  </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import AdminChart from './AdminChart.vue'
import { seriesName } from '@/services/admin/graph'
import { formatValue } from '@/services/admin/format'
import type { CatalogPanel, PanelResult, Series } from '@/services/admin/obs'

/**
 * One panel (spec 4.4 to 4.7). The catalogue's `status` decides REAL or PLACEHOLDER;
 * the result's `status` decides live data or the "No data from ..." body. A
 * placeholder never queries and has no menu.
 */
export default defineComponent({
  components: { AdminChart },
  props: {
    panel: { type: Object as PropType<CatalogPanel>, required: true },
    result: { type: Object as PropType<PanelResult | undefined>, default: undefined },
    loading: Boolean,
    grafanaUid: { type: String, default: '' },
    grafanaBase: { type: String, default: '' },
    range: { type: String, default: '6h' }
  },
  data () { return { asTable: false, copied: false, grafanaOpen: false, sort: '', desc: false } },
  computed: {
    wide (): boolean { return !!this.panel.wide || ['table', 'heatmap', 'state_timeline', 'log_list'].includes(this.panel.chart) },
    metric (): string { return this.panel.needs?.metric ?? this.panel.id },
    isTable (): boolean { return this.panel.chart === 'table' || this.panel.chart === 'log_list' },
    series (): Series[] { return this.result?.series ?? [] },
    state (): 'loading' | 'unavailable' | 'empty' | 'ok' {
      if (!this.result) return 'loading'
      if (this.result.status === 'unavailable') return 'unavailable'
      const rows = this.result.rows?.length ?? 0
      const points = this.series.reduce((n, s) => n + s.points.length, 0)
      return this.isTable ? (rows ? 'ok' : 'empty') : (points || rows ? 'ok' : 'empty')
    },
    grafana (): boolean { return !!this.grafanaUid },
    grafanaUrl (): string { return this.grafanaBase ? `${this.grafanaBase.replace(/\/$/, '')}/d/${this.grafanaUid}?from=now-${this.range}&to=now` : '' },
    tunnelUrl (): string { return `http://localhost:3000/d/${this.grafanaUid}?from=now-${this.range}&to=now` },
    tableRows (): Array<Record<string, unknown>> {
      if (this.result?.rows?.length && (this.isTable || !this.series.length)) return this.result.rows
      return this.series.map((s, i) => {
        const values = s.points.map(p => p[1]).filter((v): v is number => typeof v === 'number')
        return { Series: seriesName(s, i), Latest: values[values.length - 1] ?? null, Min: values.length ? Math.min(...values) : null, Max: values.length ? Math.max(...values) : null }
      })
    },
    columns (): string[] { return this.tableRows.length ? Object.keys(this.tableRows[0]) : [] },
    rows (): Array<Record<string, unknown>> {
      const rows = [...this.tableRows]
      const key = this.sort
      if (key) rows.sort((a, b) => (Number(a[key]) - Number(b[key])) || String(a[key]).localeCompare(String(b[key])) * (this.desc ? -1 : 1))
      return this.desc && key ? rows.reverse() : rows
    },
    aria (): string {
      const last = this.series[0]?.points.slice().reverse().find(p => p[1] !== null)?.[1]
      return `${this.panel.title}${this.panel.unit ? `, ${this.panel.unit}` : ''}${last !== undefined ? `, latest ${formatValue(last, this.panel.unit)}` : ''}`
    }
  },
  methods: {
    name: seriesName,
    cell (value: unknown): string { return typeof value === 'number' ? formatValue(value, this.panel.unit && this.columns.length <= 4 ? this.panel.unit : '') : value === null || value === undefined ? '—' : String(value) },
    heatOpacity (v: number | null): number { return v === null ? 0.05 : Math.min(1, 0.1 + v / (Math.max(...this.series.flatMap(s => s.points.map(p => p[1] ?? 0)), 1))) },
    sortBy (column: string) { this.desc = this.sort === column ? !this.desc : false; this.sort = column },
    async copy () {
      try { await navigator.clipboard.writeText(this.panel.query ?? ''); this.copied = true; window.setTimeout(() => { this.copied = false }, 2000) } catch { /* no clipboard */ }
    }
  }
})
</script>

<style lang="scss" scoped>
.mono { font-family: var(--m3d-font-mono); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.pn { min-width: 0; padding: 12px 14px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); }
.pn--wide { grid-column: 1 / -1; }
.pn--placeholder { border-style: dashed; background: transparent; }
.pn__head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.pn__title { margin: 0; font-size: 13px; font-weight: 600; }
.pn__title--muted { color: var(--m3d-text-muted); }
.pn__unit { font-size: 12px; font-weight: 400; color: var(--m3d-text-subtle); }
.pn__tag { padding: 1px 5px; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-sm, 4px); font-size: 10px; letter-spacing: .06em; color: var(--m3d-text-muted); }
.pn__tools { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.pn__graf { position: relative; }
.pn__pop { position: absolute; right: 0; top: 100%; z-index: 20; width: 280px; padding: 10px; background: var(--m3d-surface); border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); box-shadow: var(--m3d-shadow-float); font-size: 12px; color: var(--m3d-text-muted); code { display: block; margin-top: 6px; word-break: break-all; color: var(--m3d-text); } }
.pn__link { min-height: 32px; padding: 0; border: 0; background: none; color: var(--m3d-accent); font: inherit; font-size: 12px; cursor: pointer; }
.pn__plot { position: relative; height: 150px; }
.pn__plot--skeleton { color: var(--m3d-border); background-image: linear-gradient(var(--m3d-border) 1px, transparent 1px); background-size: 100% 25%; background-repeat: repeat-y; opacity: 1; }
.pn__wave { position: absolute; inset: 20px 0; width: 100%; height: calc(100% - 40px); color: var(--m3d-border); }
.pn__over { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; font-size: 12px; color: var(--m3d-text-subtle); b { font-size: 13px; color: var(--m3d-text-muted); } code { padding: 2px 6px; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-sm, 4px); background: var(--m3d-surface-2); color: var(--m3d-text); word-break: break-all; } }
.pn__skel { background: var(--m3d-surface-2); border-radius: var(--m3d-radius-sm, 4px); }
.pn__unavail, .pn__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 8px; text-align: center; background: var(--m3d-surface-2); border-radius: var(--m3d-radius-sm, 4px); font-size: 12px; color: var(--m3d-text-subtle); b { font-size: 13px; color: var(--m3d-text); } }
.pn__dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--m3d-text-subtle); }
.pn__retry { min-height: 32px; padding: 0 12px; border: 1px solid var(--m3d-border); border-radius: var(--m3d-radius-md); background: transparent; color: var(--m3d-text); font: inherit; font-size: 12px; cursor: pointer; }
.pn__table { width: 100%; border-collapse: collapse; font-size: 12px; th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid var(--m3d-border); overflow-wrap: anywhere; } th { color: var(--m3d-text-muted); font-weight: 600; } }
.pn__sort { padding: 0; border: 0; background: none; color: inherit; font: inherit; font-weight: 600; cursor: pointer; min-height: 24px; }
.pn__heat { display: flex; flex-direction: column; gap: 3px; max-height: 190px; overflow: auto; }
.pn__heatrow { display: flex; align-items: center; gap: 2px; span { width: 110px; flex: none; font-size: 10px; color: var(--m3d-text-subtle); overflow: hidden; text-overflow: ellipsis; } i { flex: 1; height: 14px; background: var(--m3d-chart-1); } i.up { background: var(--m3d-success); opacity: 1; } i.down { background: var(--m3d-danger); } i.none { background: var(--m3d-surface-2); } }
.pn__legend { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 6px 0 0; padding: 0; list-style: none; font-size: 11px; color: var(--m3d-text-muted); i { display: inline-block; width: 10px; height: 3px; margin-right: 6px; vertical-align: middle; } }
:focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
</style>
