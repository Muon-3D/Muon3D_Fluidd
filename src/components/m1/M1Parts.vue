<template>
  <div
    class="m1-parts"
    :class="{ 'm1-parts--touch': touch }"
    data-tid="m1-parts"
    :data-interactive="interactive ? 'on' : 'off'"
    :data-hovered="hovered || ''"
    :data-view="topView ? 'top' : 'free'"
  >
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

    <!-- Looking straight down at the head: X along the bottom, Y up the left, in the printer's millimetres. -->
    <div
      v-if="topView && axisMarks"
      class="m1-parts__axes"
      data-tid="m1-axes"
      aria-hidden="true"
    >
      <span
        v-for="m in axisMarks.x"
        :key="`x${m.v}`"
        class="m1-parts__tick m1-parts__tick--x"
        :style="{ left: `${m.px}px` }"
      >{{ m.v }}</span>
      <span class="m1-parts__axis-name m1-parts__axis-name--x">X</span>
      <span
        v-for="m in axisMarks.y"
        :key="`y${m.v}`"
        class="m1-parts__tick m1-parts__tick--y"
        :style="{ top: `${m.px}px` }"
      >{{ m.v }}</span>
      <span class="m1-parts__axis-name m1-parts__axis-name--y">Y</span>
    </div>

    <!-- While dragging: a target on the cursor, and a live line from where the part is to it. -->
    <svg
      v-if="drag && dragPx"
      class="m1-parts__drag"
      data-tid="m1-drag-target"
      :data-target="dragText"
      aria-hidden="true"
    >
      <line
        :x1="dragPx.from.x"
        :y1="dragPx.from.y"
        :x2="dragPx.to.x"
        :y2="dragPx.to.y"
      />
      <circle
        :cx="dragPx.to.x"
        :cy="dragPx.to.y"
        r="9"
      />
      <path :d="`M${dragPx.to.x - 14} ${dragPx.to.y}h28M${dragPx.to.x} ${dragPx.to.y - 14}v28`" />
      <text
        :x="dragPx.to.x + 14"
        :y="dragPx.to.y - 12"
      >{{ dragText }}</text>
    </svg>

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
    >
      <b>{{ names[selected] }}</b>
      <span class="m1-parts__fact">{{ facts[selected] }}</span>
      <span
        v-if="refused"
        class="m1-parts__refused"
        role="status"
        data-tid="m1-drag-refused"
      >{{ refused }}</span>
      <span
        v-else-if="dragHint"
        class="m1-parts__hint"
      >{{ dragHint }}</span>
      <m1-part-options
        v-if="interactive && selected !== 'screen'"
        :part="selected"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import M1PartOptions from './M1PartOptions.vue'
import { PART_IDS, PART_NAMES, type PartId } from '@/services/m1-3d/parts'
import { HEAD_PLANE_Y, clampMm, headToWorld, plateDragZ, plateTopForZ, releasePlace, ticks, worldToHead, zForPlateTop } from '@/services/m1-3d/drag-map'
import type { M1Viewer } from '@/services/m1-3d/viewer'

/** A drag on the toolhead (X and Y) or the plate (Z), in the printer's toolhead millimetres. */
const round = (p: { x: number, y: number }) => ({ x: Math.round(p.x), y: Math.round(p.y) })
type Px = { from: { x: number, y: number }, to: { x: number, y: number } } | null
const samePx = (a: Px, b: Px) => a === b || (!!a && !!b && a.from.x === b.from.x && a.from.y === b.from.y && a.to.x === b.to.x && a.to.y === b.to.y)

interface PartDrag {
  part: 'toolhead' | 'plate';
  /** The printer the drag began on: a switch mid-drag drops it. */
  printer: string;
  target: { X: number, Y: number } | { Z: number };
  /** For the plate: the bed's Z and the height the pointer met it at, when the drag began. */
  startZ?: number;
  startY?: number;
}

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
 * the way in a top corner, joined to the part by a hairline, with the part's
 * options under it (M1PartOptions). Not idle, or not the person's to
 * control, a part is only named, in grey, with no lean and no options.
 *
 * Selected, the toolhead and the plate can be dragged (Jack, 6 Nov): the
 * toolhead's camera looks straight down, the plate hidden, with X and Y
 * marked along the bottom and left; a target follows the cursor with a live
 * line from where the part is. Letting go sends the move through moveTo and
 * the no-go planner. Nothing here builds G-code of its own.
 *
 * The chips are the same parts as plain buttons: a row under the stage on a
 * touch screen, and for the keyboard and screen readers everywhere (hidden
 * on a desktop until focused).
 */
@Component({ components: { M1PartOptions } })
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

  drag: PartDrag | null = null
  /** The pointer a drag may come from: one that went down on the selected part with the main button. Null for anything else. */
  dragPointer: number | null = null
  dragPx: { from: { x: number, y: number }, to: { x: number, y: number } } | null = null
  axisMarks: { x: Array<{ v: number, px: number }>, y: Array<{ v: number, px: number }> } | null = null
  /** Why the last drag's move was refused, said in the label until the next drag. */
  refused = ''

  /** Parts offer their options only on an idle printer this person can control. */
  get interactive (): boolean {
    return this.stageState === 'idle' && this.controlReady && !this.busy
  }

  /** The selected part can be dragged: the toolhead in X and Y, the plate in Z, once homed, on the accurate model (whose millimetres the drag is read in). */
  get movable (): 'toolhead' | 'plate' | null {
    const part = this.selected
    if (!this.interactive || !this.viewer?.accurate) return null
    if (part === 'toolhead' && this.isHomed('XY')) return 'toolhead'
    if (part === 'plate' && this.isHomed('Z')) return 'plate'
    return null
  }

  /** The toolhead selected: look straight down for clear axes, the plate out of the way. */
  get topView (): boolean {
    return this.selected === 'toolhead' && this.interactive && !!this.viewer?.accurate
  }

  get dragHint (): string {
    if (this.movable === 'toolhead') return 'Drag the head to move it'
    if (this.movable === 'plate') return 'Drag the plate up or down to move it'
    if ((this.selected === 'toolhead' || this.selected === 'plate') && this.interactive && !this.isHomed('XYZ')) return 'Home it to move it by hand'
    return ''
  }

  get dragText (): string {
    const t = this.drag?.target
    if (!t) return ''
    return 'Z' in t ? `Z ${t.Z.toFixed(1)}` : `X ${t.X.toFixed(1)}  Y ${t.Y.toFixed(1)}`
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
    this.viewer?.setView('free')
    this.viewer?.setOrbit(true)
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
      old.removeEventListener('pointerdown', this.onDown, true)
      old.removeEventListener('pointerup', this.onUp)
      old.removeEventListener('pointercancel', this.onCancel)
      old.removeEventListener('lostpointercapture', this.onCancel)
      old.style.cursor = ''
      old.style.touchAction = ''
    }
    this.bound = canvas
    if (!canvas) return
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerleave', this.onLeave)
    // In the capture phase, so it runs before the viewer's own pointerdown and can keep a drag on a part from also turning the model.
    canvas.addEventListener('pointerdown', this.onDown, true)
    canvas.addEventListener('pointerup', this.onUp)
    // A touch that becomes a page scroll ends here, not in pointerup.
    canvas.addEventListener('pointercancel', this.onCancel)
    // Capture lost mid-drag (focus gone, a context menu): the drag ends and sends nothing.
    canvas.addEventListener('lostpointercapture', this.onCancel)
    if (this.movable) canvas.style.touchAction = 'none'
  }

  /** Ends any drag and sends nothing. */
  onCancel () {
    this.down = null
    this.dragged = false
    this.drag = null
    this.dragPx = null
    this.dragPointer = null
    this.viewer?.setOrbit(!this.topView)
  }

  onDown (e: PointerEvent) {
    // A second finger, or any new press, ends a drag in progress without sending it.
    if (this.drag || this.dragPointer !== null) {
      this.onCancel()
      return
    }
    this.down = { x: e.clientX, y: e.clientY }
    this.dragged = false
    // A part moves only by a drag that starts on it, with the main button.
    const onPart = !!this.movable && e.button === 0 && e.isPrimary && this.viewer?.pick(e.clientX, e.clientY) === this.movable
    this.viewer?.setOrbit(!onPart && !this.topView)
    if (onPart) {
      this.dragPointer = e.pointerId
      this.bound?.setPointerCapture?.(e.pointerId)
    }
  }

  onMove (e: PointerEvent) {
    if (this.dragPointer !== null) {
      if (e.pointerId !== this.dragPointer) return
      if (this.drag || (this.down && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > TAP_PX)) {
        this.dragged = true
        this.dragTo(e.clientX, e.clientY)
      }
      return
    }
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
    const dragPointer = this.dragPointer
    this.dragPointer = null
    this.viewer?.setOrbit(!this.topView)
    if (this.drag) {
      if (e.pointerId === dragPointer && e.button === 0) this.release()
      else this.onCancel()
      return
    }
    if (!start || this.dragged || e.button !== 0) return
    // A click or a tap: select what is under it, or clear on empty stage.
    const part = this.viewer?.pick(e.clientX, e.clientY) ?? null
    if (part) this.select(part)
    else this.selected = null
  }

  /** The drag's target under the pointer: the head on its plane, or the plate up or down from where it was. */
  dragTo (x: number, y: number) {
    const viewer = this.viewer
    const part = this.movable
    if (!viewer || !part) return
    if (part === 'toolhead') {
      const hit = viewer.onLevel(x, y, HEAD_PLANE_Y)
      if (!hit) return
      const at = worldToHead(hit)
      if (!this.drag) this.refused = ''
      this.drag = {
        part,
        printer: this.drag?.printer ?? this.panelTarget,
        target: { X: clampMm(at.X, this.axisMin[0], this.axisMax[0]), Y: clampMm(at.Y, this.axisMin[1], this.axisMax[1]) }
      }
    } else {
      const z0 = this.drag?.startZ ?? Number(this.position[2])
      const through = { x: 0, y: plateTopForZ(z0), z: 0 }
      const hit = viewer.onUpright(x, y, through)
      if (!hit) return
      if (!this.drag) {
        this.refused = ''
        this.drag = { part, printer: this.panelTarget, target: { Z: z0 }, startZ: z0, startY: hit.y }
      }
      const by = zForPlateTop(hit.y) - zForPlateTop(this.drag.startY ?? hit.y)
      this.drag = { ...this.drag, target: { Z: plateDragZ(z0, by, this.axisMin[2], this.axisMax[2]) } }
    }
    this.follow()
  }

  /**
   * Letting go sends the target once, through moveTo: the same checks as
   * every hand move (homed, idle, the hand-move wait and the no-go planner,
   * lifting over the bed's notch when it must). moveTo takes G-code
   * coordinates; the drag is read in the toolhead's.
   */
  release () {
    const drag = this.drag
    this.drag = null
    this.dragPx = null
    // Only to the printer the drag began on, and only while that part can still be moved.
    if (!drag || this.movable !== drag.part || drag.printer !== this.panelTarget) return
    const place = releasePlace(drag.target, this.gcodeOffset ?? [0, 0, 0], this.axisMin, this.axisMax)
    // Why it can't go, said in the label: moveTo toasts only the planner's refusals.
    const wait = this.handMoveWait()
    const sent = this.moveTo(place)
    if (!sent) this.refused = `Not moved: ${wait || this.refusalFor(place)}`
  }

  /** Why moveTo would turn this place down, in words. */
  refusalFor (place: { X?: number, Y?: number, Z?: number }): string {
    if (!this.controlReady) return this.controlLock
    if (this.busy) return 'the printer is busy.'
    const offset = this.gcodeOffset ?? [0, 0, 0]
    const realTo = (['X', 'Y', 'Z'] as const).map((a, i) => place[a] !== undefined ? (place[a] as number) + offset[i] : Number(this.position[i])) as [number, number, number]
    const plan = this.planHandMove(realTo)
    return plan.ok ? 'that is outside what the printer can reach.' : plan.reason
  }

  /** The drag's line and target, and the axes' marks, as drawn now. */
  placeDrag () {
    const viewer = this.viewer
    if (!viewer) return
    const drag = this.drag
    if (drag) {
      const t = drag.target
      const world = 'Z' in t
        ? { x: 0, y: plateTopForZ(t.Z), z: 0 }
        : headToWorld(t.X, t.Y)
      const to = viewer.project(world)
      const from = viewer.anchor(drag.part)
      const next = to && from ? { from: round(from), to: round(to) } : null
      if (!samePx(next, this.dragPx)) this.dragPx = next
    }
    if (this.topView) {
      const [x0, y0] = [this.axisMin[0], this.axisMin[1]]
      const [x1, y1] = [this.axisMax[0], this.axisMax[1]]
      const xs = ticks(Math.max(0, x0), x1).map(v => ({ v, px: viewer.project(headToWorld(v, y1))?.x ?? NaN }))
      const ys = ticks(Math.max(0, y0), y1).map(v => ({ v, px: viewer.project(headToWorld(x0, v))?.y ?? NaN }))
      const next = { x: xs.filter(m => Number.isFinite(m.px)).map(m => ({ v: m.v, px: Math.round(m.px) })), y: ys.filter(m => Number.isFinite(m.px)).map(m => ({ v: m.v, px: Math.round(m.px) })) }
      // Written only when a mark moves, so an idle top-down view doesn't render every frame.
      if (JSON.stringify(next) !== JSON.stringify(this.axisMarks)) this.axisMarks = next
    } else if (this.axisMarks) {
      this.axisMarks = null
    }
  }

  @Watch('topView')
  onTopView (top: boolean) {
    this.viewer?.setView(top ? 'top' : 'free')
    this.viewer?.setOrbit(!top)
    this.follow()
  }

  /** Another printer: a drag on this one ends, sending nothing. */
  @Watch('panelTarget')
  onPrinterChange () {
    if (this.drag || this.dragPointer !== null) this.onCancel()
  }

  /** A selected part that can be dragged takes the drag from the model: the model stops turning, and touch stops scrolling the page. */
  @Watch('movable')
  onMovable (part: 'toolhead' | 'plate' | null) {
    if (this.bound) this.bound.style.touchAction = part ? 'none' : ''
    if (!part && (this.drag || this.dragPointer !== null)) this.onCancel()
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
    if (e.key !== 'Escape') return
    // Not while typing somewhere or inside a dialog: that Esc is theirs.
    const t = e.target as HTMLElement | null
    if (t && t !== document.body && !this.$el.contains(t) && (t.closest('input, textarea, select, [contenteditable], .v-dialog, [role="dialog"]'))) return
    // Esc mid-drag drops the drag and sends nothing; otherwise it lets the part go.
    if (this.drag || this.dragPointer !== null) {
      this.onCancel()
      return
    }
    if (!this.selected) return
    this.selected = null
    this.refused = ''
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
    // Looking down at the head, the label keeps right, clear of the Y marks on the left. Otherwise it goes
    // to the side away from the part, and changes side only once the part is well past the middle, so a
    // part near the middle doesn't flip it every frame.
    const w = el.clientWidth
    const side = this.topView ? 'right' : a.x < w * 0.42 ? 'right' : a.x > w * 0.58 ? 'left' : this.side
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
      const at = part ? this.viewer?.anchor(part) ?? null : null
      const next = at ? round(at) : null
      // Written only when it moves a pixel: a selected head that sits still renders nothing.
      if (next?.x !== this.anchor?.x || next?.y !== this.anchor?.y) this.anchor = next
      this.placeLabel()
      this.placeDrag()
      // A head or plate that may move keeps its line followed for as long as it is selected.
      const moving = this.selected === 'toolhead' || this.selected === 'plate'
      this.followFrame = performance.now() < this.followUntil || this.down || moving ? requestAnimationFrame(step) : 0
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

  .m1-parts__hint,
  .m1-parts__refused {
    font-size: 12px;
    color: #98989d;
  }

  .m1-parts__refused {
    color: #ffc48a;
  }

  .m1-parts__label {
    pointer-events: auto;
    white-space: normal;
    max-width: 260px;
  }

  .m1-parts__drag {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;

    line {
      stroke: #80d6d1;
      stroke-width: 1.5;
      stroke-dasharray: 4 4;
    }

    circle {
      fill: rgb(128 214 209 / 18%);
      stroke: #80d6d1;
      stroke-width: 1.5;
    }

    path {
      stroke: #80d6d1;
      stroke-width: 1;
    }

    text {
      fill: #f5f5f7;
      font-size: 12px;
      font-weight: 600;
      paint-order: stroke;
      stroke: rgb(0 0 0 / 60%);
      stroke-width: 3px;
    }
  }

  .m1-parts__axes {
    position: absolute;
    inset: 0;
    color: #98989d;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .m1-parts__tick {
    position: absolute;

    &--x {
      bottom: 58px;
      transform: translateX(-50%);
      border-left: 1px solid rgb(152 152 157 / 50%);
      padding-left: 3px;
    }

    &--y {
      left: 12px;
      transform: translateY(-50%);
      border-top: 1px solid rgb(152 152 157 / 50%);
      padding-top: 1px;
    }
  }

  .m1-parts__axis-name {
    position: absolute;
    font-weight: 700;
    color: #d8d8dc;

    &--x {
      right: 16px;
      bottom: 58px;
    }

    &--y {
      left: 12px;
      top: 12px;
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
    /* No backdrop blur: over the live WebGL canvas it makes the browser read the canvas back and re-blur it every
       frame (it halves the frame rate without a GPU, which starved clicks in CI), so the chip is a little more opaque. */
    background: rgb(44 44 48 / 86%);
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
