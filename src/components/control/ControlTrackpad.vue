<template>
  <div
    ref="pad"
    class="tpad"
    :class="{ 'tpad--off': disabled }"
    :style="{ aspectRatio: aspect, maxWidth: `calc(${MAX_HEIGHT}px * ${aspect})` }"
    tabindex="0"
    role="application"
    :aria-label="label"
    :aria-disabled="disabled ? 'true' : undefined"
    data-tid="move-trackpad"
    @pointerdown="onDown"
    @pointermove="onDrag"
    @pointerup="onUp"
    @pointercancel="onCancel"
    @lostpointercapture="onLost"
    @blur="onBlur"
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
    <svg
      v-if="headAt && targetAt"
      class="tpad__line"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      data-tid="trackpad-line"
    >
      <line
        :x1="headAt.x"
        :y1="headAt.y"
        :x2="targetAt.x"
        :y2="targetAt.y"
        vector-effect="non-scaling-stroke"
      />
    </svg>
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
import { Component, Mixins, Prop } from 'vue-property-decorator'
import PredictedHeadMixin from '@/mixins/predicted-head'
import { aspectOf, bedToPixel, nudgeTarget, pixelToBed, regionRect, type Bed, type Point, type Rect } from '@/services/control/trackpad'
import type { NoGoConfig } from '@/services/control/safe-move'
import { X_RIGHT, Y_BACK } from '@/services/machine/orientation'

/** Percentages of the trackpad: every drawing scales with it, desktop or phone. */
const PERCENT = { width: 100, height: 100 }
const MAX_HEIGHT = 360
const pct = (r: Rect) => ({ left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%`, height: `${r.height}%` })

/** How far a pointer moves before a press becomes a drag, px. */
const DRAG_SLOP = 6

/**
 * The bed, to scale and seen from above as you face the printer, with the
 * head (drawn where it is predicted to be, not where it was last reported),
 * the printer's no-go regions, the target, and a live line from the head to
 * the target.
 *
 * This component sends nothing. It tells the Movement tile what the pointer
 * does: a tap or an arrow key `pick`s a target (sent only by Move here); a
 * press that moves past DRAG_SLOP is a drag: `drag-start`, `drag` as it
 * moves, then `drag-end` on release or `drag-cancel` (pointer cancelled,
 * capture or focus lost). Movement streams a drag through drag-follow.
 */
@Component({})
export default class ControlTrackpad extends Mixins(PredictedHeadMixin) {
  @Prop({ type: Object, required: true }) readonly bed!: Bed
  /** Draw the head (false while its position isn't known: not homed). */
  @Prop({ type: Boolean }) readonly showHead!: boolean
  @Prop({ type: Object, default: null }) readonly target!: Point | null
  @Prop({ default: null }) readonly noGo!: NoGoConfig | null | 'invalid'
  @Prop({ type: Boolean }) readonly disabled!: boolean
  @Prop({ type: Boolean }) readonly targetBad!: boolean
  @Prop({ type: Number, default: 10 }) readonly step!: number

  /** The tallest the bed is drawn, px. Width is capped from it, so the bed stays to scale. */
  readonly MAX_HEIGHT = MAX_HEIGHT
  private pointer: number | null = null
  private downAt: { x: number, y: number } | null = null
  dragging = false

  get aspect (): string {
    return String(aspectOf(this.bed))
  }

  get label (): string {
    return 'The bed, to scale, seen from above. Tap to pick where the head should go, then press Move here; or drag, and the head follows. Arrow keys move the pick.'
  }

  get regions () {
    const noGo = this.noGo
    if (!noGo || noGo === 'invalid') return null
    return noGo.regions.map(r => ({
      rect: pct(regionRect(r, this.bed, PERCENT)),
      band: pct(regionRect(r, this.bed, PERCENT, noGo.tolerance))
    }))
  }

  /** Where the head is drawn: predicted between reports (services/control/position-predict). */
  get head (): Point | null {
    const p = this.predictedHead
    return this.showHead && p ? { x: p[0], y: p[1] } : null
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
    // One pointer at a time: a second finger while one is down does nothing.
    if (this.disabled || this.pointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return
    this.pointer = e.pointerId
    this.downAt = { x: e.clientX, y: e.clientY }
    this.dragging = false
    ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
    this.pick(this.pointAt(e.clientX, e.clientY))
  }

  /** Past DRAG_SLOP a press is a drag: the target follows the pointer, and Movement streams it. */
  onDrag (e: PointerEvent) {
    if (this.pointer === null || e.pointerId !== this.pointer || this.disabled) return
    const p = this.pointAt(e.clientX, e.clientY)
    if (!p) return
    if (!this.dragging) {
      const from = this.downAt
      if (from && Math.hypot(e.clientX - from.x, e.clientY - from.y) < DRAG_SLOP) return
      this.dragging = true
      this.$emit('drag-start', p)
      return
    }
    this.$emit('drag', p)
  }

  onUp (e: PointerEvent) {
    if (e.pointerId !== this.pointer) return
    this.pointer = null
    if (this.dragging) { this.dragging = false; this.$emit('drag-end') }
  }

  /** The pointer was taken away (a system gesture, a palm, a call): stop at once. */
  onCancel (e: PointerEvent) {
    if (e.pointerId !== this.pointer) return
    this.endWithCancel()
  }

  /** Capture lost without a pointer-up (the element hid, another capture). */
  onLost (e: PointerEvent) {
    if (e.pointerId === this.pointer) this.endWithCancel()
  }

  onBlur () {
    if (this.dragging) this.endWithCancel()
  }

  endWithCancel () {
    const was = this.dragging
    this.pointer = null
    this.dragging = false
    if (was) this.$emit('drag-cancel')
  }

  mounted () {
    window.addEventListener('blur', this.onBlur)
  }

  beforeDestroy () {
    window.removeEventListener('blur', this.onBlur)
    this.endWithCancel()
  }

  onKey (e: KeyboardEvent) {
    const keys: Record<string, [number, number]> = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
    const k = keys[e.key]
    if (!k || this.disabled) return
    e.preventDefault()
    const from = this.target ?? this.head
    if (!from) return
    const by = this.step * (e.shiftKey ? 10 : 1)
    this.$emit('pick', nudgeTarget(from, k[0] * by, k[1] * by, this.bed, Y_BACK, X_RIGHT))
  }
}
</script>

<style lang="scss" scoped>
  .tpad {
    position: relative;
    width: 100%;
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

  /* Disabled (a print or homing is moving the printer, or it is not homed): greyed out, still there. */
  .tpad--off {
    cursor: default;
    opacity: 0.45;
    filter: grayscale(1);
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

  .tpad__line {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;

    line {
      stroke: color-mix(in srgb, var(--m3d-accent) 70%, transparent);
      stroke-width: 2;
      stroke-dasharray: 5 4;
    }
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
