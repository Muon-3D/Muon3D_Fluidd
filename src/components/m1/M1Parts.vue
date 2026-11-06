<template>
  <div
    class="m1-parts"
    :class="{ 'm1-parts--touch': touch }"
    data-tid="m1-parts"
    :data-interactive="interactive ? 'on' : 'off'"
    :data-hovered="hovered || ''"
  >
    <svg
      v-if="selected && anchor && leader"
      class="m1-parts__leader"
      aria-hidden="true"
    >
      <circle
        :cx="anchor.x"
        :cy="anchor.y"
        r="2.5"
      />
      <line
        :x1="anchor.x"
        :y1="anchor.y"
        :x2="leader.x"
        :y2="leader.y"
      />
    </svg>
    <div
      v-if="selected"
      ref="label"
      class="m1-parts__label"
      :class="[`m1-parts__label--${side}`, { 'm1-parts__label--info': !interactive }]"
      data-tid="m1-parts-label"
      :data-part="selected"
      aria-hidden="true"
    >
      <b>{{ names[selected] }}</b>
      <span class="m1-parts__fact">{{ facts[selected] }}</span>
    </div>

    <div
      class="m1-parts__chips"
      role="toolbar"
      :aria-label="`${printerName}, 3D view: parts`"
      @keydown="onKeys"
    >
      <button
        v-for="(id, i) in ids"
        :key="id"
        ref="chips"
        type="button"
        class="m1-parts__chip"
        :class="{ 'm1-parts__chip--on': selected === id }"
        :data-tid="`m1-part-${id}`"
        :aria-pressed="selected === id ? 'true' : 'false'"
        :aria-label="`${names[id]}, ${facts[id]}`"
        :tabindex="i === focusIndex ? 0 : -1"
        @click="select(id)"
        @focus="onChipFocus(id)"
      >
        {{ names[id] }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import { PART_IDS, PART_NAMES, type PartId } from '@/services/m1-3d/parts'
import type { M1Viewer } from '@/services/m1-3d/viewer'

/** A pointer must rest on a part this long before it lights, so passing over doesn't. */
const HOVER_INTENT_MS = 120
/** After the pointer leaves the printer, the camera eases back after this long. */
const LEAVE_MS = 600
/** A press that moves less than this is a click or a tap, not a drag. */
const TAP_PX = 10
/** The label follows the part while the camera eases, for this long after a change. */
const FOLLOW_MS = 700
/** The label's distance from the stage's top and side, as its style has it. */
const LABEL_INSET = 16

/**
 * The parts of the M1 a person can point at on the Overview stage
 * (control-mockups/v3/overview-3d, Jack's OK 6 Nov): hovering one glows it in
 * the accent and leans the camera toward it; a click, a tap or the keyboard
 * selects it, and only then a quiet panel names it with one live fact, out of
 * the way in a top corner, joined to the part by a hairline. Selecting emits `select`; this component sends
 * nothing to the printer. Not idle, or not the person's to control, a part
 * is only named, in white, with no lean.
 *
 * The chips are the same parts as plain buttons: a row under the stage on a
 * touch screen, and for the keyboard and screen readers everywhere (hidden
 * on a desktop until focused).
 */
@Component
export default class M1Parts extends Mixins(ControlMixin) {
  /** The live viewer, once it draws. */
  @Prop({ type: Object, default: null })
  readonly viewer!: M1Viewer | null

  @Prop({ type: HTMLCanvasElement, default: null })
  readonly canvas!: HTMLCanvasElement | null

  /** The stage's own state: offline, printing or idle. */
  @Prop({ type: String, default: 'idle' })
  readonly stageState!: string

  readonly ids = PART_IDS
  readonly names = PART_NAMES

  hovered: PartId | null = null
  selected: PartId | null = null
  /** The selected part's middle on the stage, and where the line meets the label. */
  anchor: { x: number, y: number } | null = null
  leader: { x: number, y: number } | null = null
  /** The label sits in the top corner away from the part, out of the way. */
  side: 'left' | 'right' = 'right'
  focusIndex = 0
  touch = false
  reducedMotion = false

  hoverTimer = 0
  leaveTimer = 0
  pickFrame = 0
  followFrame = 0
  followUntil = 0
  down: { x: number, y: number } | null = null
  dragged = false
  bound: HTMLCanvasElement | null = null
  motionQuery: MediaQueryList | null = null

  /** Parts offer their options only on an idle printer this person can control. */
  get interactive (): boolean {
    return this.stageState === 'idle' && this.controlReady && !this.busy
  }

  get shownPart (): PartId | null {
    return this.selected ?? this.hovered
  }

  get printerName (): string {
    return (this.$store.getters['config/getDisplayName'] as string | undefined) || 'The printer'
  }

  /** One live fact per part, as the label and the button name say it. */
  get facts (): Record<PartId, string> {
    const printer = this.$store.state.printer.printer
    const deg = (t: unknown) => typeof t === 'number' ? `${Math.round(t)} °C` : '– °C'
    const homed = ((printer.toolhead?.homed_axes as string | undefined) ?? '').length >= 3
    const mesh = (printer.bed_mesh?.profile_name as string | undefined) ?? ''
    const material = this.loadedMaterial
    return {
      plate: `${deg(printer.heater_bed?.temperature)} · ${mesh ? 'mesh loaded' : 'no mesh'}`,
      toolhead: `${deg(printer.extruder?.temperature)} · ${homed ? 'homed' : 'not homed'}`,
      filament: material ? material.name : 'No material loaded',
      screen: "The printer's own screen"
    }
  }

  mounted () {
    this.touch = window.matchMedia?.('(pointer: coarse)').matches ?? false
    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null
    this.reducedMotion = !!this.motionQuery?.matches
    this.motionQuery?.addEventListener?.('change', this.onMotionPref)
    document.addEventListener('keydown', this.onEscape)
    this.bind(this.canvas)
  }

  beforeDestroy () {
    this.bind(null)
    this.motionQuery?.removeEventListener?.('change', this.onMotionPref)
    document.removeEventListener('keydown', this.onEscape)
    clearTimeout(this.hoverTimer)
    clearTimeout(this.leaveTimer)
    cancelAnimationFrame(this.pickFrame)
    cancelAnimationFrame(this.followFrame)
    this.viewer?.setFocus(null, 'info', false)
  }

  onMotionPref (e: MediaQueryListEvent) {
    this.reducedMotion = e.matches
    this.show()
  }

  @Watch('canvas')
  bind (canvas: HTMLCanvasElement | null) {
    const old = this.bound
    if (old) {
      old.removeEventListener('pointermove', this.onMove)
      old.removeEventListener('pointerleave', this.onLeave)
      old.removeEventListener('pointerdown', this.onDown)
      old.removeEventListener('pointerup', this.onUp)
      old.removeEventListener('pointercancel', this.onCancel)
      old.style.cursor = ''
    }
    this.bound = canvas
    if (!canvas) return
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerleave', this.onLeave)
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointerup', this.onUp)
    // A touch that becomes a page scroll ends here, not in pointerup.
    canvas.addEventListener('pointercancel', this.onCancel)
  }

  onCancel () {
    this.down = null
    this.dragged = false
  }

  onDown (e: PointerEvent) {
    this.down = { x: e.clientX, y: e.clientY }
    this.dragged = false
  }

  onMove (e: PointerEvent) {
    if (this.down && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > TAP_PX) {
      // Turning the model: hover is off until the button comes up.
      if (!this.dragged) {
        this.dragged = true
        clearTimeout(this.hoverTimer)
        this.hovered = null
      }
      this.follow()
      return
    }
    if (e.pointerType === 'touch' || this.down) return
    cancelAnimationFrame(this.pickFrame)
    const { clientX, clientY } = e
    this.pickFrame = requestAnimationFrame(() => this.onPoint(this.viewer?.pick(clientX, clientY) ?? null))
  }

  /** The pointer is over this part (or none). */
  onPoint (part: PartId | null) {
    if (this.bound) this.bound.style.cursor = part && this.interactive ? 'pointer' : ''
    if (part) {
      clearTimeout(this.leaveTimer)
      if (part === this.hovered) return
      clearTimeout(this.hoverTimer)
      // Straight from one part to another re-aims at once; from nothing, after the intent delay.
      if (this.hovered) this.hovered = part
      else this.hoverTimer = window.setTimeout(() => { this.hovered = part }, HOVER_INTENT_MS)
      return
    }
    clearTimeout(this.hoverTimer)
    if (this.hovered && !this.leaveTimer) {
      this.leaveTimer = window.setTimeout(() => {
        this.leaveTimer = 0
        this.hovered = null
      }, LEAVE_MS)
    }
  }

  onLeave () {
    cancelAnimationFrame(this.pickFrame)
    this.onPoint(null)
  }

  onUp (e: PointerEvent) {
    const start = this.down
    this.down = null
    if (!start || this.dragged || e.button !== 0) return
    // A click or a tap: select what is under it, or clear on empty stage.
    const part = this.viewer?.pick(e.clientX, e.clientY) ?? null
    if (part) this.select(part)
    else this.selected = null
  }

  select (part: PartId) {
    this.selected = part
    this.focusIndex = PART_IDS.indexOf(part)
    this.$emit('select', part)
  }

  onChipFocus (id: PartId) {
    this.focusIndex = PART_IDS.indexOf(id)
    this.selected = id
  }

  /** ← → and 1–4 move between the parts' buttons. */
  onKeys (e: KeyboardEvent) {
    const n = PART_IDS.length
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (this.focusIndex + 1) % n
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (this.focusIndex + n - 1) % n
    else if (/^[1-4]$/.test(e.key)) next = Number(e.key) - 1
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    if (next < 0) return
    e.preventDefault()
    this.focusIndex = next
    ;(this.$refs.chips as HTMLButtonElement[] | undefined)?.[next]?.focus()
  }

  onEscape (e: KeyboardEvent) {
    if (e.key !== 'Escape' || !this.selected) return
    this.selected = null
  }

  @Watch('shownPart')
  @Watch('interactive')
  @Watch('viewer')
  show () {
    const part = this.shownPart
    this.viewer?.setFocus(part, this.interactive ? 'active' : 'info', this.interactive && !this.reducedMotion)
    if (this.bound && !part) this.bound.style.cursor = ''
    this.follow()
  }

  /** Puts the label in the top corner away from the part, and ends the line at its near edge. */
  placeLabel () {
    const a = this.anchor
    const el = this.$el as HTMLElement | undefined
    if (!a || !el) {
      if (this.leader) this.leader = null
      return
    }
    const side = a.x < el.clientWidth / 2 ? 'right' : 'left'
    if (side !== this.side) this.side = side
    const label = this.$refs.label as HTMLElement | undefined
    if (!label) return
    // From the label's size and its corner (16 px in, as the style puts it), not where it was last drawn.
    const x = this.side === 'right' ? el.clientWidth - LABEL_INSET - label.offsetWidth : LABEL_INSET + label.offsetWidth
    const y = LABEL_INSET + label.offsetHeight / 2
    // Set only when it moves: updated() calls this, and a new object each time would render forever.
    if (this.leader?.x !== x || this.leader?.y !== y) this.leader = { x, y }
  }

  updated () {
    if (this.selected) this.placeLabel()
  }

  /** Keeps the label's line on its part while the camera eases. */
  follow () {
    this.followUntil = performance.now() + FOLLOW_MS
    if (this.followFrame) return
    const step = () => {
      const part = this.selected
      this.anchor = part ? this.viewer?.anchor(part) ?? null : null
      this.placeLabel()
      this.followFrame = performance.now() < this.followUntil || this.down ? requestAnimationFrame(step) : 0
    }
    this.followFrame = requestAnimationFrame(step)
  }
}
</script>

<style lang="scss" scoped>
  .m1-parts {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 2;
  }

  /* One quiet panel: the part's name and one fact, in a top corner. */
  .m1-parts__label {
    position: absolute;
    top: 16px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 9px 14px;
    border-radius: 12px;
    background: rgb(36 36 40 / 78%);
    backdrop-filter: blur(20px);
    color: #f5f5f7;
    font-size: 13px;
    white-space: nowrap;
    animation: m1-parts-in 0.16s ease-out;

    b {
      font-size: 14px;
      font-weight: 600;
    }

    &--right {
      right: 16px;
    }

    &--left {
      left: 16px;
    }

    &--info b {
      color: #d8d8dc;
    }
  }

  /* A hairline from the part to the panel, in the panel's own colour. */
  .m1-parts__leader {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;

    line {
      stroke: rgb(36 36 40 / 78%);
      stroke-width: 1;
    }

    circle {
      fill: rgb(36 36 40 / 78%);
    }
  }

  .m1-parts__fact {
    color: #98989d;
    font-size: 12px;
  }

  .m1-parts__chips {
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    pointer-events: auto;
    /* On a desktop the chips are for the keyboard: out of sight until one is focused. */
    clip-path: inset(50%);
    opacity: 0;

    &:focus-within {
      clip-path: none;
      opacity: 1;
    }
  }

  .m1-parts--touch .m1-parts__chips {
    clip-path: none;
    opacity: 1;
  }

  .m1-parts__chip {
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    background: rgb(44 44 48 / 70%);
    backdrop-filter: blur(20px);
    color: #d8d8dc;
    font-size: 13px;
    font-weight: 600;

    &--on {
      background: rgb(128 214 209 / 16%);
      color: #80d6d1;
      box-shadow: inset 0 0 0 1px rgb(128 214 209 / 45%);
    }

    &:focus-visible {
      outline: 2px solid #80d6d1;
      outline-offset: 2px;
    }
  }

  @keyframes m1-parts-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .m1-parts__label {
      animation: none;
    }
  }
</style>
