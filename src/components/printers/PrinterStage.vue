<template>
  <div
    class="printer-stage"
    :class="{ 'printer-stage--off': state === 'offline' }"
    :style="height ? { height: `${height}px` } : undefined"
  >
    <img
      :src="src"
      alt=""
      fetchpriority="high"
      class="printer-stage__m1"
    >
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import idle from '@/assets/m1/m1-accurate-idle.webp'
import printing from '@/assets/m1/m1-accurate-printing.webp'
import type { ThumbState } from '@/components/ui/PrinterThumb.vue'

/**
 * The whole M1 on the theme's stage, never cropped:
 * idle, printing (a part on the plate) or offline (the idle still, dimmed).
 */
@Component({})
export default class PrinterStage extends Vue {
  @Prop({ type: String, default: 'idle' })
  readonly state!: ThumbState

  @Prop({ type: Number })
  readonly height?: number

  get src (): string {
    if (this.state === 'printing') return printing
    return idle
  }
}
</script>

<style lang="scss" scoped>
  .printer-stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 18px;
    background:
      radial-gradient(60% 45% at 50% 30%, color-mix(in srgb, var(--m3d-accent) var(--m3d-stage-glow), transparent) 0%, transparent 70%),
      radial-gradient(120% 90% at 50% 40%, var(--m3d-stage-hi) 0%, var(--m3d-stage-mid) 62%, var(--m3d-stage-lo) 100%);
  }

  /* Isometric grid, fading out from the floor. */
  .printer-stage::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      repeating-linear-gradient(60deg, var(--m3d-stage-grid) 0 1px, transparent 1px 28px),
      repeating-linear-gradient(120deg, var(--m3d-stage-grid) 0 1px, transparent 1px 28px);
    mask-image: radial-gradient(70% 60% at 50% 62%, #000 0%, transparent 100%);
  }

  /* Floor shadow. */
  .printer-stage::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 86%;
    width: 44%;
    height: 9%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    background: radial-gradient(closest-side, var(--m3d-stage-shadow), transparent);
  }

  .printer-stage__m1 {
    position: relative;
    z-index: 1;
    display: block;
    max-width: 92%;
    max-height: 92%;
    object-fit: contain;
  }

  .printer-stage--off::before {
    display: none;
  }

  .printer-stage--off {
    background: radial-gradient(120% 90% at 50% 40%, var(--m3d-stage-hi) 0%, var(--m3d-stage-mid) 62%, var(--m3d-stage-lo) 100%);
  }

  .printer-stage--off .printer-stage__m1 {
    opacity: 0.45;
  }
</style>
