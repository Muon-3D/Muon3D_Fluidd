<template>
  <svg
    class="spark"
    :class="{ 'spark--fill': fill, 'spark--empty': !path }"
    :viewBox="`0 0 ${W} ${H}`"
    preserveAspectRatio="none"
    aria-hidden="true"
    data-tid="heater-spark"
    :data-series="series"
    :data-state="path ? 'line' : 'empty'"
  >
    <line
      v-if="targetY !== null"
      class="spark__target"
      x1="0"
      :x2="W"
      :y1="targetY"
      :y2="targetY"
    />
    <path
      v-if="path"
      class="spark__line"
      :d="path"
    />
    <line
      v-else
      class="spark__none"
      x1="0"
      :x2="W"
      :y1="H / 2"
      :y2="H / 2"
    />
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { chartLines, type ChartPoint } from '@/services/overview/model'

/**
 * A heater's last few minutes as a small line beside its temperature (Jack,
 * 6 Nov 2026: "Each temperature line gets a small inline sparkline"). It
 * reads the history the temperature graph already keeps (the charts store);
 * it polls nothing itself. With no history yet it draws a flat, faint line.
 */
@Component({})
export default class HeaterSparkline extends Vue {
  /** The charts store key: the Klipper object (`extruder`, `heater_bed`, `temperature_sensor chamber`). */
  @Prop({ type: String, required: true }) readonly series!: string
  /** How far back, in seconds. */
  @Prop({ type: Number, default: 300 }) readonly seconds!: number
  /** As wide as its box, rather than a fixed small size. */
  @Prop({ type: Boolean }) readonly fill?: boolean

  readonly W = 120
  readonly H = 28

  get samples (): ChartPoint[] {
    return (this.$store.getters['charts/getChartData'] as ChartPoint[] | undefined) ?? []
  }

  get lines () {
    const data = this.samples
    const last = data[data.length - 1]
    if (!last || !(last.date instanceof Date)) return null
    const result = chartLines(data, [this.series], this.seconds, last.date.getTime(), this.W, this.H)
    const line = result.lines[0]
    if (!line) return null
    const points = line.path.split(/[ML]/).filter(Boolean).length
    return points >= 2 ? line : null
  }

  get path (): string { return this.lines?.path ?? '' }
  get targetY (): number | null { return this.lines?.targetY ?? null }
}
</script>

<style lang="scss" scoped>
  .spark { flex: none; width: 64px; height: 22px; overflow: visible; }
  .spark--fill { width: 100%; height: 28px; }
  .spark__line { fill: none; stroke: var(--m3d-text-muted); stroke-width: 1.5; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
  .spark__target { stroke: var(--m3d-text-subtle); stroke-width: 1; stroke-dasharray: 3 3; vector-effect: non-scaling-stroke; opacity: 0.6; }
  .spark__none { stroke: var(--m3d-border); stroke-width: 1; stroke-dasharray: 2 4; vector-effect: non-scaling-stroke; }
</style>
