<template>
  <div
    class="app-arc-progress"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="percent"
  >
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      aria-hidden="true"
    >
      <path
        class="app-arc-progress__track"
        :d="path"
        :stroke-width="width"
      />
      <path
        v-show="percent > 0"
        class="app-arc-progress__fill"
        :d="path"
        :stroke-width="width"
        pathLength="100"
        stroke-dasharray="100 100"
        :stroke-dashoffset="100 - percent"
      />
    </svg>
    <div class="app-arc-progress__label">
      <slot>{{ percent }}%</slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

// The printer panel's (MuonUI) print gauge: an open, round-capped arc. Its
// gap is at the bottom here because the labels sit beside it, not inside.
const SWEEP_DEGREES = 280

@Component({})
export default class AppArcProgress extends Vue {
  @Prop({ type: Number, required: true })
  readonly value!: number

  @Prop({ type: Number, default: 100 })
  readonly size!: number

  @Prop({ type: Number, default: 9 })
  readonly width!: number

  get percent (): number {
    return Math.round(Math.min(100, Math.max(0, this.value || 0)))
  }

  get path (): string {
    const center = this.size / 2
    const radius = (this.size - this.width) / 2
    const start = (180 + (360 - SWEEP_DEGREES) / 2) * Math.PI / 180
    const end = start + SWEEP_DEGREES * Math.PI / 180
    const point = (angle: number) => [
      center + radius * Math.sin(angle),
      center - radius * Math.cos(angle)
    ].map(n => n.toFixed(2)).join(' ')

    return `M ${point(start)} A ${radius} ${radius} 0 1 1 ${point(end)}`
  }
}
</script>

<style lang="scss" scoped>
  .app-arc-progress {
    position: relative;
    flex: 0 0 auto;
  }

  svg {
    display: block;
  }

  path {
    fill: none;
    stroke-linecap: round;
  }

  .app-arc-progress__track {
    stroke: var(--m3d-arc-track, var(--m3d-border));
  }

  .app-arc-progress__fill {
    stroke: var(--m3d-accent);
    transition: stroke-dashoffset 700ms var(--m3d-ease);
  }

  .app-arc-progress__label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--m3d-text);
    font-size: 1.375rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
</style>
