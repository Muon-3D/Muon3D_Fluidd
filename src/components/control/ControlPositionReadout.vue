<template>
  <div
    class="posread"
    :class="{ 'posread--stack': stack }"
    data-tid="position-readout"
  >
    <span
      v-for="a in shown"
      :key="a.axis"
      class="posread__cell"
      :data-tid="`pos-${a.axis.toLowerCase()}`"
    >
      <small>{{ a.axis }}</small>{{ a.text }}
    </span>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import PredictedHeadMixin from '@/mixins/predicted-head'

/**
 * The head's position as text, predicted between status updates so it runs
 * smoothly while the head moves (mixins/predicted-head). Only this small
 * component re-renders each frame. Not a control: it can't be pressed.
 */
@Component({})
export default class ControlPositionReadout extends Mixins(PredictedHeadMixin) {
  /** Which axes, in order: 'XYZ' or 'Z'. */
  @Prop({ type: String, default: 'XYZ' }) readonly axes!: string
  /** Label above the number (the Z readout between the Z keys). */
  @Prop({ type: Boolean }) readonly stack!: boolean

  get shown (): Array<{ axis: string, text: string }> {
    const p = this.predictedHead
    return this.axes.split('').map(axis => {
      const i = 'XYZ'.indexOf(axis)
      const v = p ? p[i] : Number.NaN
      return { axis, text: Number.isFinite(v) ? v.toFixed(axis === 'Z' ? 2 : 1) : '–' }
    })
  }
}
</script>

<style lang="scss" scoped>
  .posread {
    display: contents;
  }

  .posread__cell {
    display: flex;
    flex: 1 1 70px;
    flex-direction: column;
    min-width: 0;
    padding: 7px 10px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    font-family: var(--m3d-font-mono);
    font-size: 14px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;

    small {
      color: var(--m3d-text-muted);
      font-family: inherit;
      font-size: 10px;
      letter-spacing: 0.08em;
    }
  }

  .posread--stack .posread__cell {
    align-items: center;
    justify-content: center;
    background: none;
    text-align: center;
  }
</style>
