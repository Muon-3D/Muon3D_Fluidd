<template>
  <div
    class="app-ring-progress"
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
      <circle
        class="app-ring-progress__track"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="width"
      />
      <circle
        v-show="percent > 0"
        class="app-ring-progress__fill"
        :cx="size / 2"
        :cy="size / 2"
        :r="radius"
        :stroke-width="width"
        pathLength="100"
        stroke-dasharray="100 100"
        :stroke-dashoffset="100 - percent"
      />
    </svg>
    <div class="app-ring-progress__label">
      <slot>{{ percent }}<span class="app-ring-progress__unit">%</span></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

// A closed, round-capped ring that fills clockwise from twelve o'clock.
@Component({})
export default class AppRingProgress extends Vue {
  @Prop({ type: Number, required: true })
  readonly value!: number

  @Prop({ type: Number, default: 96 })
  readonly size!: number

  @Prop({ type: Number, default: 10 })
  readonly width!: number

  get percent (): number {
    return Math.round(Math.min(100, Math.max(0, this.value || 0)))
  }

  get radius (): number {
    return (this.size - this.width) / 2
  }
}
</script>

<style lang="scss" scoped>
  .app-ring-progress {
    position: relative;
    flex: 0 0 auto;
  }

  svg {
    display: block;
    transform: rotate(-90deg);
  }

  circle {
    fill: none;
    stroke-linecap: round;
  }

  .app-ring-progress__track {
    stroke: var(--m3d-ring-track, var(--m3d-border));
  }

  .app-ring-progress__fill {
    stroke: var(--m3d-ring-fill, var(--m3d-accent));
    transition: stroke-dashoffset 900ms var(--m3d-ease);
  }

  .app-ring-progress__label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--m3d-text);
    font-family: var(--m3d-font-rounded, inherit);
    font-size: 1.5rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .app-ring-progress__unit {
    margin-left: 1px;
    color: var(--m3d-text-muted);
    font-size: 0.8125rem;
    font-weight: 600;
  }
</style>
