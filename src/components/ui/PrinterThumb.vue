<template>
  <span
    class="printer-thumb"
    :class="{ 'printer-thumb--off': state === 'offline' }"
    :style="{ width: `${size}px`, height: `${size}px`, borderRadius: `${Math.round(size * 0.28)}px` }"
  >
    <img
      :src="src"
      alt=""
      :width="size"
      :height="size"
    >
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import idle from '@/assets/m1/m1-accurate-idle-thumb.webp'
import printing from '@/assets/m1/m1-accurate-printing-thumb.webp'

export type ThumbState = 'idle' | 'printing' | 'offline'

/** The M1, small, on the theme's stage: printing, idle or offline. */
@Component({})
export default class PrinterThumb extends Vue {
  @Prop({ type: Number, default: 40 })
  readonly size!: number

  @Prop({ type: String, default: 'idle' })
  readonly state!: ThumbState

  get src (): string {
    if (this.state === 'printing') return printing
    return idle
  }
}
</script>

<style lang="scss" scoped>
  .printer-thumb {
    display: inline-flex;
    flex: none;
    overflow: hidden;
    background: radial-gradient(120% 90% at 50% 40%, var(--m3d-stage-hi) 0%, var(--m3d-stage-mid) 62%, var(--m3d-stage-lo) 100%);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .printer-thumb--off img {
    opacity: 0.45;
  }
</style>
