<template>
  <div
    class="m1-parts"
    :class="{ 'm1-parts--touch': touch }"
    data-tid="m1-parts"
    :data-interactive="interactive ? 'on' : 'off'"
    :data-hovered="hovered || ''"
    :data-selected="selected || ''"
    :data-view="zoomedIn ? 'screen' : topView ? 'top' : 'free'"
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

    <!-- Looking straight down at the head: X and Y marked along the limits of its reach, in the printer's millimetres. -->
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
        :style="{ left: `${m.px}px`, top: `${m.at}px` }"
      >{{ m.v }}</span>
      <span
        v-if="axisMarks.x.length"
        class="m1-parts__axis-name m1-parts__axis-name--x"
        :style="{ left: `${axisMarks.x[axisMarks.x.length - 1].px}px`, top: `${axisMarks.x[axisMarks.x.length - 1].at}px` }"
      >X</span>
      <span
        v-for="m in axisMarks.y"
        :key="`y${m.v}`"
        class="m1-parts__tick m1-parts__tick--y"
        :style="{ top: `${m.px}px`, left: `${m.at}px` }"
      >{{ m.v }}</span>
      <span
        v-if="axisMarks.y.length"
        class="m1-parts__axis-name m1-parts__axis-name--y"
        :style="{ top: `${axisMarks.y[axisMarks.y.length - 1].px}px`, left: `${axisMarks.y[axisMarks.y.length - 1].at}px` }"
      >Y</span>
    </div>

    <!-- Looking down: where the head can go (its corners), and the bed's notch, quietly. -->
    <svg
      v-if="topView && boundsPx"
      class="m1-parts__bounds"
      data-tid="m1-bounds"
      aria-hidden="true"
    >
      <path
        class="m1-parts__bounds-corners"
        :d="boundsPx.corners"
      />
      <path
        v-for="(d, i) in boundsPx.notch"
        :key="`notch${i}`"
        class="m1-parts__bounds-notch"
        data-tid="m1-notch"
        :d="d"
      />
    </svg>

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
      v-if="selected && anchor && leader && !screenOpen"
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
      v-if="selected && !screenOpen"
      ref="label"
      class="m1-parts__label"
      :class="[`m1-parts__label--${side}`, { 'm1-parts__label--info': !interactive }]"
      data-tid="m1-parts-label"
      :data-part="selected"
      @pointerenter="onLabelEnter"
      @pointerleave="onLabelLeave"
      @pointerdown="hoverPicked = false"
      @focusin="hoverPicked = false"
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
        v-if="interactive"
        :key="selected"
        :part="selected"
        @use-screen="select('screen')"
      />
    </div>
    <m1-screen
      v-if="screenOpen && interactive"
      ref="screen"
      :from="screenFrom"
      :reduced-motion="reducedMotion"
      :viewer="zoomedIn ? viewer : null"
      @turn="viewer && viewer.turnKnob($event)"
      @close="screenOpen = false"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import M1PartOptions from './M1PartOptions.vue'
import M1Screen from './M1Screen.vue'
import { PART_IDS, PART_NAMES, type PartId } from '@/services/m1-3d/parts'
import { axisEdges, boundCorners } from '@/services/m1-3d/drag-bounds'
import { wheelDetents } from '@/services/m1-3d/knob'
import { HEAD_PLANE_Y, clampMm, headToWorld, plateDragZ, plateTopForZ, releasePlace, ticks, worldToHead, zForPlateTop } from '@/services/m1-3d/drag-map'
import type { M1Viewer } from '@/services/m1-3d/viewer'
import { modelAnimates } from '@/services/m1-3d/render-options'
import { modelSettings } from '@/services/m1-3d/device-settings'

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

/**
 * Off a part onto empty stage, the glow stays this long: enough to bridge a
 * gap between a part's meshes without a flicker, short enough to read as
 * instant. From one part straight to another it moves at once.
 */
const LEAVE_MS = 120
/** A part picked by pointing lets go this long after the pointer leaves it, unless the pointer is on its panel by then. */
const HOVER_RELEASE_MS = 700
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
@Component({ components: { M1PartOptions, M1Screen } })
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

  leaveTimer = 0
  /** The selection was made by pointing (the filament, Jack 11 Nov), not clicked: it goes again when the pointer goes away. */
  hoverPicked = false
  releaseTimer = 0
  labelOver = false
  pickFrame = 0
  /** The newest pointer position waiting for the next frame's pick. */
  pickAt: { x: number, y: number } | null = null
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
  axisMarks: { x: Array<{ v: number, px: number, at: number }>, y: Array<{ v: number, px: number, at: number }> } | null = null
  /** Looking down: the corners of where the head can go, and the bed's notch, as drawn now. */
  boundsPx: { corners: string, notch: string[] } | null = null
  /** Why the last drag's move was refused, said in the label until the next drag. */
  refused = ''
  /** The printer's own screen, open over the stage. */
  screenOpen = false
  /** Where the screen was on the stage when it opened: the zoom flies in from there and back out to it. */
  screenFrom: { x: number, y: number } | null = null

  /**
   * The camera holds still while the toolhead or the plate is selected on an
   * idle printer (Jack, 9 Nov): a drag there moves the part, never the view,
   * and a drag on empty stage leaves the selection as it is.
   */
  get cameraLocked (): boolean {
    return this.topView || this.zoomedIn || (this.selected === 'plate' && this.interactive)
  }

  @Watch('cameraLocked')
  onCameraLocked (locked: boolean) {
    if (this.dragPointer === null) this.viewer?.setOrbit(!locked)
  }

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
    clearTimeout(this.leaveTimer)
    clearTimeout(this.releaseTimer)
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
      old.removeEventListener('wheel', this.onWheel)
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
    // Not passive: with the printer's screen open a scroll turns the model's knob and must not also scroll the page.
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
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
    this.viewer?.holdPan(false)
    this.viewer?.setOrbit(!this.cameraLocked)
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
    this.viewer?.setOrbit(!onPart && !this.cameraLocked)
    if (onPart) {
      this.dragPointer = e.pointerId
      // The camera stays where it is while the part is dragged, so the target stays under the pointer.
      this.viewer?.holdPan(true)
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
        this.hovered = null
      }
      this.follow()
      return
    }
    if (e.pointerType === 'touch' || this.down) return
    // One pick a frame, at the newest position. (Cancelling and asking again on every move starved it:
    // moves come once a frame too, so while the pointer moved the pick never ran.)
    this.pickAt = { x: e.clientX, y: e.clientY }
    if (this.pickFrame) return
    this.pickFrame = requestAnimationFrame(() => {
      this.pickFrame = 0
      const at = this.pickAt
      this.pickAt = null
      if (at) this.onPoint(this.viewer?.pick(at.x, at.y) ?? null)
    })
  }

  /** The pointer is over this part (or none). */
  onPoint (part: PartId | null) {
    if (this.bound) this.bound.style.cursor = part && this.interactive ? 'pointer' : ''
    if (part) {
      clearTimeout(this.leaveTimer)
      this.leaveTimer = 0
      clearTimeout(this.releaseTimer)
      this.releaseTimer = 0
      if (part !== this.hovered) this.hovered = part
      this.pointPick(part)
      return
    }
    // Off the part it was picked by: it lets go soon, unless the pointer has reached its panel.
    if (this.hoverPicked && !this.labelOver && !this.releaseTimer) {
      this.releaseTimer = window.setTimeout(() => {
        this.releaseTimer = 0
        if (this.hoverPicked && !this.labelOver) this.deselect()
      }, HOVER_RELEASE_MS)
    }
    if (this.hovered && !this.leaveTimer) {
      this.leaveTimer = window.setTimeout(() => {
        this.leaveTimer = 0
        this.hovered = null
      }, LEAVE_MS)
    }
  }

  onLeave (e?: PointerEvent) {
    cancelAnimationFrame(this.pickFrame)
    this.pickFrame = 0
    this.pickAt = null
    this.onPoint(null)
    // Off the stage altogether, the selection lets go (Jack, 11 Nov). Not for a finger (it has no cursor to move off),
    // a press held (turning the model, or a drag that sends nothing until it is let go), the pointer going onto the
    // part's own panel or the printer's screen, or the screen open.
    if (!this.selected || !e || e.pointerType === 'touch' || this.down || this.drag || this.dragPointer !== null || this.screenOpen) return
    const to = e.relatedTarget as Node | null
    if (to && this.$el.contains(to)) return
    this.deselect()
  }

  /** Lets the selected part go. */
  deselect () {
    clearTimeout(this.releaseTimer)
    this.releaseTimer = 0
    this.hoverPicked = false
    if (!this.selected) return
    this.selected = null
    this.refused = ''
  }

  /** Pointing at the filament picks it (Jack, 11 Nov: hover the spool), so its panel is there to use; nothing else is picked by pointing. */
  pointPick (part: PartId) {
    if (part !== 'filament' || this.selected || this.touch || this.down || this.screenOpen) return
    this.select(part)
    this.hoverPicked = true
  }

  onLabelEnter () {
    this.labelOver = true
    clearTimeout(this.releaseTimer)
    this.releaseTimer = 0
  }

  onLabelLeave (e: PointerEvent) {
    this.labelOver = false
    if (!this.hoverPicked) return
    // A menu or dialog the panel opened is part of it.
    const to = e.relatedTarget as HTMLElement | null
    if (to?.closest?.('.v-menu__content, .v-dialog, [role="menu"], [role="listbox"], [role="dialog"]')) return
    this.deselect()
  }

  /** With the printer's screen open, a scroll over the model turns its knob, as the knob on the printer would turn. Only the picture: nothing is sent. */
  onWheel (e: WheelEvent) {
    if (!this.screenOpen || !this.viewer) return
    e.preventDefault()
    this.viewer.turnKnob(wheelDetents(e.deltaY, e.deltaMode))
  }

  onUp (e: PointerEvent) {
    const start = this.down
    this.down = null
    const dragPointer = this.dragPointer
    this.dragPointer = null
    this.viewer?.holdPan(false)
    this.viewer?.setOrbit(!this.cameraLocked)
    if (this.drag) {
      if (e.pointerId === dragPointer && e.button === 0) this.release()
      else this.onCancel()
      return
    }
    if (!start || this.dragged || e.button !== 0) return
    // The printer's screen open: a click on the model's screen or knob presses the knob (the knob sits under the live screen,
    // so the press is the picture's); a click anywhere else leaves the screen.
    if (this.screenOpen) {
      if (this.viewer?.knobAt(e.clientX, e.clientY) || this.viewer?.pick(e.clientX, e.clientY) === 'screen') this.viewer.pressKnob()
      else (this.$refs.screen as { close?: () => void } | undefined)?.close?.()
      return
    }
    // A click or a tap: the knob, if it is under it, is pressed in for a moment; then select what is under it, or clear on empty stage.
    if (this.viewer?.knobAt(e.clientX, e.clientY)) this.viewer.pressKnob()
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
      // From the nozzle itself (not the part's middle, where the panel's own line starts): where the head is now, so the line closes as it comes in.
      const [x, y, z] = this.position
      const from = viewer.project(drag.part === 'plate'
        ? { x: 0, y: plateTopForZ(z), z: 0 }
        : headToWorld(x, y))
      const next = to && from ? { from: round(from), to: round(to) } : null
      if (!samePx(next, this.dragPx)) this.dragPx = next
    }
    if (this.topView) {
      const lo = [this.axisMin[0], this.axisMin[1]] as [number, number]
      const hi = [this.axisMax[0], this.axisMax[1]] as [number, number]
      const screen = (x: number, y: number) => viewer.project(headToWorld(x, y))
      // X marked along the limit nearest the bottom of the view, Y along the one nearest the left.
      const edges = axisEdges(lo, hi, screen)
      const mark = (v: number, p: { x: number, y: number } | null, axis: 'x' | 'y') =>
        p && Number.isFinite(p.x) && Number.isFinite(p.y) ? { v, px: Math.round(axis === 'x' ? p.x : p.y), at: Math.round(axis === 'x' ? p.y : p.x) } : null
      const xs = ticks(Math.max(0, lo[0]), hi[0]).map(v => mark(v, screen(v, edges.y), 'x'))
      const ys = ticks(Math.max(0, lo[1]), hi[1]).map(v => mark(v, screen(edges.x, v), 'y'))
      const next = {
        x: xs.filter((m): m is NonNullable<typeof m> => !!m),
        y: ys.filter((m): m is NonNullable<typeof m> => !!m)
      }
      // Written only when a mark moves, so an idle top-down view doesn't render every frame.
      if (JSON.stringify(next) !== JSON.stringify(this.axisMarks)) this.axisMarks = next
      const noGo = this.noGo
      const regions = noGo && noGo !== 'invalid' ? noGo.regions : []
      const bounds = {
        corners: boundCorners(lo, hi, screen),
        notch: regions.map(r => boundCorners(r.min, r.max, screen, true)).filter(Boolean)
      }
      if (JSON.stringify(bounds) !== JSON.stringify(this.boundsPx)) this.boundsPx = bounds
    } else {
      if (this.axisMarks) this.axisMarks = null
      if (this.boundsPx) this.boundsPx = null
    }
  }

  /** The screen open: the camera flies in to it (not with reduced motion: then the screen just opens). */
  get zoomedIn (): boolean {
    return this.screenOpen && this.interactive && !this.reducedMotion
  }

  @Watch('zoomedIn')
  onZoomedIn () {
    this.onTopView(this.topView)
  }

  @Watch('topView')
  onTopView (top: boolean) {
    this.viewer?.setView(this.zoomedIn ? 'screen' : top ? 'top' : 'free')
    this.viewer?.setOrbit(!this.cameraLocked)
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
    this.hoverPicked = false
    this.selected = part
    // A click on the screen goes into it: the printer's own screen, flown in from where it is on the model.
    if (part === 'screen' && this.interactive) {
      this.screenFrom = this.anchor ?? this.viewer?.anchor('screen') ?? null
      this.screenOpen = true
    }
    this.focusIndex = PART_IDS.indexOf(part)
    this.$emit('select', part)
  }

  onChipFocus (id: PartId) {
    this.hoverPicked = false
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
    // With the printer's screen open, Esc closes it (M1Screen), and nothing else.
    if (this.screenOpen) return
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
    this.viewer?.setFocus(part, this.interactive ? 'active' : 'info', this.interactive && modelAnimates(modelSettings.animations, this.reducedMotion))
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
      transform: translate(-50%, 8px);
      border-left: 1px solid rgb(152 152 157 / 50%);
      padding-left: 3px;
    }

    &--y {
      transform: translate(calc(-100% - 8px), -50%);
      border-top: 1px solid rgb(152 152 157 / 50%);
      padding-top: 1px;
    }
  }

  .m1-parts__axis-name {
    position: absolute;
    font-weight: 700;
    color: #d8d8dc;

    &--x {
      transform: translate(18px, 8px);
    }

    &--y {
      transform: translate(calc(-100% - 8px), calc(-100% - 10px));
    }
  }

  /* Where the head can go, and the notch it must not cross low: quiet, under everything else. */
  .m1-parts__bounds {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }

  .m1-parts__bounds-corners {
    fill: none;
    stroke: rgb(216 216 220 / 55%);
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  .m1-parts__bounds-notch {
    fill: rgb(255 159 10 / 8%);
    stroke: rgb(255 159 10 / 45%);
    stroke-width: 1;
    stroke-dasharray: 3 3;
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

  :root.m3d-reduced-motion {
    .m1-parts__label {
      animation: none;
    }
  }
</style>
