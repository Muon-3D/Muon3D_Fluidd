<template>
  <div
    ref="pad"
    class="tpad"
    :class="{ 'tpad--off': disabled }"
    :style="{ aspectRatio: aspect }"
    tabindex="0"
    role="application"
    :aria-label="label"
    :aria-disabled="disabled ? 'true' : undefined"
    data-tid="move-trackpad"
    @pointerdown="onDown"
    @pointermove="onDrag"
    @pointerup="onUp"
    @pointercancel="onUp"
    @keydown="onKey"
  >
    <span class="tpad__watermark">MUON3D</span>
    <template v-if="regions">
      <span
        v-for="(r, i) in regions"
        :key="`band-${i}`"
        class="tpad__band"
        :style="r.band"
        aria-hidden="true"
      />
      <span
        v-for="(r, i) in regions"
        :key="`nogo-${i}`"
        class="tpad__nogo"
        :style="r.rect"
        data-tid="trackpad-nogo"
        aria-hidden="true"
      >
        <span v-if="i === 0">No-go</span>
      </span>
    </template>
    <span
      v-if="headAt"
      class="tpad__head"
      :style="{ left: `${headAt.x}%`, top: `${headAt.y}%` }"
      data-tid="trackpad-head"
    />
    <span
      v-if="targetAt"
      class="tpad__target"
      :class="{ 'tpad__target--bad': targetBad }"
      :style="{ left: `${targetAt.x}%`, top: `${targetAt.y}%` }"
      data-tid="trackpad-target"
    />
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { aspectOf, bedToPixel, nudgeTarget, pixelToBed, regionRect, type Bed, type Point, type Rect } from '@/services/control/trackpad'
import type { NoGoConfig } from '@/services/control/safe-move'
import { Y_BACK } from '@/services/machine/orientation'

/** Percentages of the trackpad: every drawing scales with it, desktop or phone. */
const PERCENT = { width: 100, height: 100 }
const pct = (r: Rect) => ({ left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%`, height: `${r.height}%` })

/**
 * The bed, to scale, with the head and the printer's no-go regions on it.
 * A tap or a drag only PICKS a target (`pick`); it never moves anything.
 * Arrow keys nudge the target. The Move tile sends a picked target, through
 * the no-go planner, only when its "Move here" is pressed.
 */
@Component({})
export default class ControlTrackpad extends Vue {
  @Prop({ type: Object, required: true }) readonly bed!: Bed
  @Prop({ type: Object, default: null }) readonly head!: Point | null
  @Prop({ type: Object, default: null }) readonly target!: Point | null
  @Prop({ default: null }) readonly noGo!: NoGoConfig | null | 'invalid'
  @Prop({ type: Boolean }) readonly disabled!: boolean
  @Prop({ type: Boolean }) readonly targetBad!: boolean
  @Prop({ type: Number, default: 10 }) readonly step!: number

  private pointer: number | null = null

  get aspect (): string {
    return String(aspectOf(this.bed))
  }

  get label (): string {
    return 'The bed, to scale. Tap to pick where the head should go, then press Move here. Arrow keys move the pick.'
  }

  get regions () {
    const noGo = this.noGo
    if (!noGo || noGo === 'invalid') return null
    return noGo.regions.map(r => ({
      rect: pct(regionRect(r, this.bed, PERCENT)),
      band: pct(regionRect(r, this.bed, PERCENT, noGo.tolerance))
    }))
  }

  get headAt (): Point | null {
    return this.head ? bedToPixel(this.head, this.bed, PERCENT) : null
  }

  get targetAt (): Point | null {
    return this.target ? bedToPixel(this.target, this.bed, PERCENT) : null
  }

  /** The bed point under a pointer event, or null. */
  pointAt (clientX: number, clientY: number): Point | null {
    const el = this.$refs.pad as HTMLElement | undefined
    if (!el) return null
    const r = el.getBoundingClientRect()
    return pixelToBed({ x: clientX - r.left, y: clientY - r.top }, this.bed, { width: r.width, height: r.height })
  }

  pick (p: Point | null) {
    if (p && !this.disabled) this.$emit('pick', p)
  }

  onDown (e: PointerEvent) {
    if (this.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return
    this.pointer = e.pointerId
    ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
    this.pick(this.pointAt(e.clientX, e.clientY))
  }

  /** Dragging moves the pick with the finger. It still sends nothing. */
  onDrag (e: PointerEvent) {
    if (this.pointer === null || e.pointerId !== this.pointer) return
    this.pick(this.pointAt(e.clientX, e.clientY))
  }

  onUp (e: PointerEvent) {
    if (e.pointerId === this.pointer) this.pointer = null
  }

  onKey (e: KeyboardEvent) {
    const keys: Record<string, [number, number]> = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
    const k = keys[e.key]
    if (!k || this.disabled) return
    e.preventDefault()
    const from = this.target ?? this.head
    if (!from) return
    const by = this.step * (e.shiftKey ? 10 : 1)
    this.$emit('pick', nudgeTarget(from, k[0] * by, k[1] * by, this.bed, Y_BACK))
  }
}
</script>

<style lang="scss" scoped>
  .tpad {
    position: relative;
    width: 100%;
    max-height: 360px;
    overflow: hidden;
    border-radius: 16px;
    background:
      linear-gradient(var(--m3d-border) 1px, transparent 1px) 0 0 / 100% 10%,
      linear-gradient(90deg, var(--m3d-border) 1px, transparent 1px) 0 0 / 10% 100%,
      var(--m3d-surface-2);
    box-shadow: inset 0 0 0 1px var(--m3d-border);
    cursor: crosshair;
    touch-action: none;
    user-select: none;

    &:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px var(--m3d-accent);
    }
  }

  .tpad--off {
    cursor: default;
  }

  .tpad__watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    color: var(--m3d-text);
    font-family: var(--m3d-font-display, sans-serif);
    font-size: clamp(14px, 3vw, 26px);
    letter-spacing: 0.24em;
    opacity: 0.06;
    transform: translate(-50%, -50%);
    pointer-events: none;
    white-space: nowrap;
  }

  .tpad__band,
  .tpad__nogo {
    position: absolute;
    pointer-events: none;
  }

  .tpad__band {
    background: color-mix(in srgb, var(--m3d-warning) 8%, transparent);
    outline: 1px dashed color-mix(in srgb, var(--m3d-warning) 40%, transparent);
  }

  .tpad__nogo {
    display: flex;
    align-items: center;
    justify-content: center;
    background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--m3d-danger) 30%, transparent) 0 6px, color-mix(in srgb, var(--m3d-danger) 12%, transparent) 6px 12px);
    color: var(--m3d-text);
    font-size: 11px;
    font-weight: 600;
  }

  .tpad__head,
  .tpad__target {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  .tpad__head {
    width: 22px;
    height: 22px;
    margin: -11px 0 0 -11px;
    background: #fff;
    box-shadow: 0 0 0 6px rgb(255 255 255 / 12%), 0 2px 6px rgb(0 0 0 / 50%);
    transition: left 300ms var(--m3d-ease), top 300ms var(--m3d-ease);
  }

  .tpad__target {
    width: 26px;
    height: 26px;
    margin: -13px 0 0 -13px;
    border: 2px solid var(--m3d-accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--m3d-accent) 20%, transparent);

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 4px;
      height: 4px;
      margin: -2px 0 0 -2px;
      border-radius: 50%;
      background: var(--m3d-accent);
    }
  }

  .tpad__target--bad {
    border-color: var(--m3d-danger);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--m3d-danger) 20%, transparent);

    &::after { background: var(--m3d-danger); }
  }
</style>
