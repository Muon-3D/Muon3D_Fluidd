<template>
  <svg
    v-if="point"
    class="finish-clock"
    viewBox="0 0 64 64"
    role="img"
    :aria-label="`Estimated finish ${point.label}, 24-hour clock`"
    data-tid="finish-clock"
  >
    <circle
      cx="32"
      cy="32"
      r="25"
    />
    <text
      x="32"
      y="12"
    >0</text><text
      x="55"
      y="35"
    >6</text><text
      x="32"
      y="58"
    >12</text><text
      x="9"
      y="35"
    >18</text>
    <line
      x1="32"
      y1="32"
      :x2="point.x"
      :y2="point.y"
    />
    <circle
      :cx="point.x"
      :cy="point.y"
      r="2"
      class="finish-clock__tip"
    />
  </svg>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { finishPoint } from '@/services/overview/heat-stripe'

@Component
export default class FinishClock extends Vue {
  @Prop({ type: Number, default: null }) readonly eta!: number | null
  get point () { return finishPoint(this.eta) }
}
</script>

<style lang="scss" scoped>
.finish-clock { flex: none; width: 48px; height: 48px; color: var(--m3d-text-muted); }
.finish-clock circle { fill: none; stroke: var(--m3d-border-strong); }
.finish-clock text { fill: currentColor; font-size: 7px; text-anchor: middle; font-variant-numeric: tabular-nums; }
.finish-clock line { stroke: var(--m3d-accent); stroke-width: 2; stroke-linecap: round; }
.finish-clock .finish-clock__tip { fill: var(--m3d-accent); stroke: none; }
</style>
