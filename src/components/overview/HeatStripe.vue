<template>
  <div
    class="heat-stripe"
    data-tid="heat-stripe"
    :data-series="series"
  >
    <svg
      viewBox="0 0 600 10"
      preserveAspectRatio="none"
      role="img"
      :aria-label="`${name}: last ten minutes of reported heat${bands.length ? '' : ', no history yet'}`"
    >
      <rect
        class="heat-stripe__track"
        width="600"
        height="10"
        rx="5"
      />
      <rect
        v-for="(band, i) in bands"
        :key="i"
        :x="band.x"
        :width="band.width"
        height="10"
        :class="`heat-stripe__${band.state}`"
        :data-state="band.state"
      >
        <title>{{ band.temperature.toFixed(1) }}° / {{ band.target }}° · {{ labels[band.state] }}</title>
      </rect>
    </svg>
    <span class="heat-stripe__key"><span>10 min ago</span><span>{{ bands.length ? 'Latest report' : 'No history yet' }}</span></span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { heatBands } from '@/services/overview/heat-stripe'
import type { ChartPoint } from '@/services/overview/model'

@Component
export default class HeatStripe extends Vue {
  @Prop({ type: String, required: true }) readonly series!: string
  @Prop({ type: String, required: true }) readonly name!: string
  readonly labels = { cold: 'Off / no target', heating: 'Below target', ready: 'Within 5° of target', over: 'Over target' }
  get bands () { return heatBands(this.$store.getters['charts/getChartData'] ?? [], this.series, this.latest) }
  get latest (): number {
    const points: ChartPoint[] = this.$store.getters['charts/getChartData'] ?? []
    return points.reduce((at, p) => p.date instanceof Date && Number.isFinite(p.date.getTime()) ? Math.max(at, p.date.getTime()) : at, 0)
  }
}
</script>

<style lang="scss" scoped>
/* State palette copied from @muon3d/design-system v0.6.0 (design-language §3). */
.heat-stripe { --m3d-state-asleep: #636366; --m3d-state-heating: #ff9230; --m3d-state-ready: #30d158; --m3d-state-fault: #ff4245; width: 100%; }
.theme--light .heat-stripe { --m3d-state-asleep: #aeaeb2; --m3d-state-heating: #c93400; --m3d-state-ready: #008932; --m3d-state-fault: #d70015; }
.heat-stripe svg { display: block; width: 100%; height: 10px; overflow: hidden; border-radius: 5px; }
.heat-stripe__track { fill: var(--m3d-fill); }
.heat-stripe__cold { fill: var(--m3d-state-asleep); }
.heat-stripe__heating { fill: var(--m3d-state-heating); }
.heat-stripe__ready { fill: var(--m3d-state-ready); }
.heat-stripe__over { fill: var(--m3d-state-fault); }
.heat-stripe__key { display: flex; justify-content: space-between; gap: 8px; margin-top: 5px; font-size: 10px; color: var(--m3d-text-subtle); }
</style>
