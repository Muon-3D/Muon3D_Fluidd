<template>
  <control-card
    title="Movement"
    icon="control"
    :pill="pill"
    :pill-tone="pillTone"
    :locked="ready ? '' : controlLock"
    data-tid="control-move"
  >
    <template #aside>
      <v-menu
        v-model="menu"
        bottom
        left
        offset-y
        nudge-bottom="6"
        min-width="240"
        content-class="muon-account__menu"
      >
        <template #activator="{ on, attrs }">
          <button
            type="button"
            class="move__more"
            aria-label="More for Movement"
            data-tid="move-more"
            v-bind="attrs"
            v-on="on"
          >
            <frame-icon
              name="more"
              small
            />
          </button>
        </template>
        <div
          class="acct-menu"
          role="menu"
          aria-label="More for Movement"
        >
          <button
            type="button"
            class="acct-menu__item"
            role="menuitem"
            :disabled="!ready || busy"
            data-tid="menu-home-xy"
            @click="home('XY')"
          >
            Home X and Y<span class="acct-menu__key">G28 X Y</span>
          </button>
          <button
            type="button"
            class="acct-menu__item"
            role="menuitem"
            :disabled="!ready || busy"
            data-tid="menu-home-z"
            @click="home('Z')"
          >
            Home Z<span class="acct-menu__key">G28 Z</span>
          </button>
          <div class="acct-menu__rule" />
          <button
            type="button"
            class="acct-menu__item"
            role="menuitem"
            :disabled="!ready || busy"
            data-tid="motors-off"
            @click="motorsOff"
          >
            Turn motors off<span class="acct-menu__key">M84</span>
          </button>
          <template v-if="muonPrinter === false">
            <div class="acct-menu__rule" />
            <button
              type="button"
              class="acct-menu__item"
              role="menuitem"
              data-tid="menu-zoffset"
              @click="showZOffset = !showZOffset"
            >
              {{ showZOffset ? 'Hide Z offset' : 'Z offset' }}
            </button>
          </template>
        </div>
      </v-menu>
    </template>

    <!-- Printing: locked, the live position only. -->
    <template v-if="ready && busy">
      <p
        class="move__note"
        data-tid="move-printing"
      >
        {{ printingNote }}
      </p>
      <div class="move__bar move__bar--bare">
        <control-position-readout />
      </div>
    </template>

    <template v-else-if="ready">
      <div
        v-if="!isHomed('XYZ')"
        class="move__callout"
        data-tid="move-not-homed"
      >
        <frame-icon
          name="home"
          small
        />
        <span>Home before moving. The trackpad and jog need to know where the head is.</span>
        <button
          type="button"
          class="cbtn cbtn--primary"
          data-tid="callout-home-all"
          :disabled="busy"
          @click="home()"
        >
          Home all
        </button>
      </div>

      <div
        class="move__body"
        :class="{ 'move__body--phone': phone, 'move__body--dim': !isHomed('XY') && !isHomed('Z') }"
      >
        <div class="move__zone">
          <div class="move__sub">
            Trackpad<span>Tap to pick a spot, or drag and the head follows</span>
          </div>
          <control-trackpad
            v-if="plate"
            :bed="plate"
            :show-head="xyHomedHere"
            :target="target"
            :target-bad="!!targetProblem || !!dragRefusal"
            :no-go="noGo"
            :disabled="!canMoveXY"
            :step="step"
            @pick="pick"
            @drag-start="dragStart"
            @drag="dragTo"
            @drag-end="dragEnd"
            @drag-cancel="dragCancel"
          />
          <div
            class="move__pick"
            data-tid="trackpad-pick"
            aria-live="polite"
          >
            <template v-if="target">
              <span class="move__pick-text">
                <b>X {{ fmt(target.x) }} · Y {{ fmt(target.y) }}</b>
                <span
                  class="move__pick-note"
                  :class="{ 'move__pick-note--bad': !!dragRefusal || !!targetProblem }"
                  data-tid="trackpad-note"
                >{{ pickNote }}</span>
              </span>
              <button
                v-if="!following"
                type="button"
                class="cbtn"
                data-tid="trackpad-clear"
                @click="clearTarget"
              >
                Clear
              </button>
              <button
                v-if="!following"
                type="button"
                class="cbtn cbtn--primary"
                :disabled="!canConfirm"
                data-tid="trackpad-move"
                @click="confirmMove"
              >
                Move here
              </button>
            </template>
            <span
              v-else
              class="move__pick-note"
            >{{ pickHint }}</span>
          </div>
        </div>

        <div class="move__zone">
          <div class="move__sub">
            Fine jog
          </div>
          <seg-picker
            :options="stepOptions"
            :value="step"
            label="Step"
            fill
            @input="step = $event"
          />
          <div
            class="move__jog"
            tabindex="0"
            role="group"
            aria-label="Jog pad. Arrow keys step the head, Page Up and Page Down the plate."
            data-tid="move-pad"
            @keydown="onPadKey"
          >
            <div class="move__xy">
              <template v-for="b in jogButtons">
                <span
                  v-if="b.id === 'centre'"
                  :key="b.id"
                  class="move__dot"
                  aria-hidden="true"
                  data-tid="jog-centre"
                ><i /></span>
                <button
                  v-else
                  :key="b.id"
                  type="button"
                  class="move__b"
                  :class="[`move__b--${b.id}`, { 'move__b--diag': b.diagonal }]"
                  :aria-label="b.label"
                  :title="b.label"
                  :disabled="!canMoveXY"
                  @click="b.run()"
                >
                  {{ b.text }}
                </button>
              </template>
            </div>
            <div class="move__zcol">
              <button
                type="button"
                class="move__b move__b--z"
                :aria-label="zKeys.up.label"
                :title="zKeys.up.title"
                :disabled="!canMoveZ"
                data-tid="jog-z-up"
                @click="moveBy('Z', step)"
              >
                {{ zKeys.up.text }}
              </button>
              <control-position-readout
                class="move__zv"
                axes="Z"
                stack
              />
              <button
                type="button"
                class="move__b move__b--z"
                :aria-label="zKeys.down.label"
                :title="zKeys.down.title"
                :disabled="!canMoveZ"
                data-tid="jog-z-down"
                @click="moveBy('Z', -step)"
              >
                {{ zKeys.down.text }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="move__bar"
        data-tid="move-position"
      >
        <template v-if="!goOpen">
          <control-position-readout />
          <button
            type="button"
            class="cbtn move__goto"
            :disabled="!isHomed('XYZ')"
            data-tid="move-goto"
            @click="openGoTo"
          >
            Go to…
          </button>
        </template>
        <form
          v-else
          class="move__go"
          aria-label="Go to a position"
          data-tid="move-go-form"
          @submit.prevent="go"
        >
          <label
            v-for="(axis, i) in ['X', 'Y', 'Z']"
            :key="axis"
            class="move__field"
          >
            <span>{{ axis }}</span>
            <number-field
              :value="goTo[i]"
              :decimals="2"
              :min="axisMin[i]"
              :max="axisMax[i]"
              :label="`${axis} to go to`"
              @change="setGoTo(i, $event)"
            />
          </label>
          <span
            class="move__pick-note move__go-note"
            :class="{ 'move__pick-note--bad': !!goProblem }"
            data-tid="move-go-note"
          >{{ goProblem || goNote }}</span>
          <button
            type="button"
            class="cbtn"
            data-tid="move-go-cancel"
            @click="goOpen = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="cbtn cbtn--primary"
            :disabled="!canGo"
            data-tid="move-go"
          >
            Go
          </button>
        </form>
        <div class="move__homes">
          <button
            type="button"
            class="cbtn"
            :disabled="busy"
            data-tid="home-all"
            title="G28"
            @click="home()"
          >
            <v-progress-circular
              v-if="homing()"
              indeterminate
              size="14"
              width="2"
            />
            <frame-icon
              v-else
              name="home"
              small
            />
            Home all
          </button>
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="busy"
            aria-label="Home X and Y"
            data-tid="home-xy"
            title="G28 X Y"
            @click="home('XY')"
          >
            <v-progress-circular
              v-if="homing('XY')"
              indeterminate
              size="14"
              width="2"
            />
            XY
          </button>
          <button
            type="button"
            class="cbtn cbtn--ghost"
            :disabled="busy"
            aria-label="Home Z"
            data-tid="home-z"
            title="G28 Z"
            @click="home('Z')"
          >
            <v-progress-circular
              v-if="homing('Z')"
              indeterminate
              size="14"
              width="2"
            />
            Z
          </button>
        </div>
      </div>
    </template>

    <control-z-offset
      v-if="muonPrinter === false && showZOffset"
      class="move__zoffset"
    />
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import { M1_VIEW, X_RIGHT, Y_BACK } from '@/services/machine/orientation'
import { bedFrom, type Bed, type Point } from '@/services/control/trackpad'
import { DragFollow, controlDragHost } from '@/services/control/drag-follow'
import type { MovePlan } from '@/services/control/safe-move'
import ControlCard from './ControlCard.vue'
import ControlTrackpad from './ControlTrackpad.vue'
import ControlPositionReadout from './ControlPositionReadout.vue'
import ControlZOffset from './ControlZOffset.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import NumberField from './NumberField.vue'

type Axis = 'X' | 'Y' | 'Z'

/** The steps a jog takes, mm. Fine jog down to a tenth. */
export const MOVE_STEPS = [0.1, 1, 10, 50]

const sign = (n: number) => (n > 0 ? '+' : '−')

/**
 * The jog pad's nine cells, as you face the printer: up is the back, right
 * is the right (services/machine/orientation). The centre is an inert dot,
 * so a slip between arrows sends nothing. `dx`/`dy` are the axis steps per
 * unit of step size, so the pad and the trackpad agree on every direction.
 */
export function jogLayout (yBack = Y_BACK, xRight = X_RIGHT) {
  const cell = (id: string, right: number, back: number, label: string) => {
    const dx = right * xRight
    const dy = back * yBack
    const text = right && back
      ? ({ '-1,1': '↖', '1,1': '↗', '-1,-1': '↙', '1,-1': '↘' } as Record<string, string>)[`${right},${back}`]
      : right ? `X${sign(dx)}` : `Y${sign(dy)}`
    const axes = [dx ? `X${sign(dx)}` : '', dy ? `Y${sign(dy)}` : ''].filter(Boolean).join(' ')
    return { id, dx, dy, text, diagonal: !!(right && back), label: right && back ? label : `${label} (${axes})` }
  }
  return [
    cell('nw', -1, 1, 'Head back and left'),
    cell('n', 0, 1, 'Head back'),
    cell('ne', 1, 1, 'Head back and right'),
    cell('w', -1, 0, 'Head left'),
    { id: 'centre', dx: 0, dy: 0, text: '', diagonal: false, label: '' },
    cell('e', 1, 0, 'Head right'),
    cell('sw', -1, -1, 'Head forward and left'),
    cell('s', 0, -1, 'Head forward'),
    cell('se', 1, -1, 'Head forward and right')
  ]
}

/**
 * The Z keys' words. On a Muon printer they say how the plate moves (the M1
 * prints upside down; M1_VIEW.zPlus says which way Z+ takes the plate), with
 * the axis in the tooltip. Other printers keep Z+ and Z−.
 */
export function zKeyWords (muon: boolean, zPlus: 'up' | 'down' = M1_VIEW.zPlus) {
  if (!muon) {
    return {
      up: { text: 'Z+', label: 'Z+', title: 'Z+' },
      down: { text: 'Z−', label: 'Z−', title: 'Z−' }
    }
  }
  const plus = zPlus === 'up' ? 'Plate up' : 'Plate down'
  const minus = zPlus === 'up' ? 'Plate down' : 'Plate up'
  return {
    up: { text: plus, label: `${plus} (Z+)`, title: 'Z+' },
    down: { text: minus, label: `${minus} (Z−)`, title: 'Z−' }
  }
}

/** Each tile's drag follower, kept off the component so Vue doesn't make it reactive. */
const followers = new WeakMap<object, DragFollow>()

/**
 * Movement: everything that moves the head, in one tile (the v4 storyboard).
 * The trackpad picks a spot (Move here sends it) or, dragged, has the head
 * follow; the fine jog nudges; the position readout doubles as Go to; and
 * homing sits in a bar under a rule. Motors off is only in the ··· menu.
 * Z offset is not on a Muon printer at all; on any other printer it is in
 * the ··· menu (hidden too while it isn't known yet which it is).
 *
 * Every move goes through ControlMixin's moveBy / moveByXY / moveTo, which
 * gate on homed and printing, plan against the printer's no-go regions, and
 * hold each move until the last hand move has landed. A drag is streamed
 * through services/control/drag-follow, one planned move at a time.
 */
@Component({ components: { ControlCard, ControlTrackpad, ControlPositionReadout, ControlZOffset, SegPicker, NumberField } })
export default class ControlMove extends Mixins(ControlMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  step = 10
  menu = false
  showZOffset = false
  goOpen = false
  goTo: Array<number | null> = [null, null, null]
  /** What the fields started at: an axis left as it was isn't sent (so X alone moves at the head's speed). */
  goStart: Array<number | null> = [null, null, null]
  goTarget = ''
  /** The trackpad's pick, in toolhead (real) coordinates; null when nothing is picked. */
  target: Point | null = null
  targetFor = ''
  /** The target is a drag's: cleared once the drag has finished sending. */
  dragTarget = false
  /** Why the last drag stopped, or ''. */
  dragRefusal = ''
  following = false

  /** Ticks while a pick is shown, so "is the head still moving?" is read again (that state is not reactive). */
  tick = 0
  private ticker: number | null = null

  created () {
    followers.set(this, new DragFollow(controlDragHost(this), {
      onRefused: reason => { this.dragRefusal = reason; this.following = false }
    }))
  }

  get follower (): DragFollow | undefined {
    return followers.get(this)
  }

  @Watch('panelTarget')
  clearDraft () {
    this.stopDrag()
    this.goTo = [null, null, null]
    this.goOpen = false
    this.target = null
  }

  @Watch('target')
  onTarget (target: Point | null) {
    if (target && this.ticker === null) this.ticker = window.setInterval(() => this.onTick(), 250)
    if (!target && this.ticker !== null) { window.clearInterval(this.ticker); this.ticker = null }
  }

  onTick () {
    this.tick++
    const following = !!this.follower?.following
    if (this.following && !following && !this.dragRefusal) {
      // The drag has sent its last move: the head is on its way, the pick is done.
      if (this.dragTarget) this.target = null
      this.dragTarget = false
    }
    this.following = following
  }

  beforeDestroy () {
    this.follower?.cancel()
    followers.delete(this)
    if (this.ticker !== null) window.clearInterval(this.ticker)
    this.ticker = null
  }

  /** A pick and any drag are dropped the moment moving is no longer allowed (a print starts, homing is lost). */
  @Watch('canMoveXY')
  onCanMove (can: boolean) {
    if (!can) {
      this.stopDrag()
      this.target = null
    }
  }

  get ready (): boolean {
    return this.controlReady
  }

  get pill (): string {
    if (!this.ready) return ''
    if (this.busy) return 'Locked while printing'
    return this.isHomed('XYZ') ? 'Homed' : 'Not homed'
  }

  get pillTone (): string {
    return this.pill === 'Homed' ? 'ok' : 'warn'
  }

  get printingNote (): string {
    const file = (this.$store.state.printer.printer.print_stats?.filename as string | undefined) ?? ''
    const name = file.split('/').pop()?.replace(/\.gcode$/i, '') ?? ''
    const what = name ? `${name} is printing.` : 'A print is running.'
    return `${what} Moving comes back when it ends. Print mode and Advanced stay live, to change speed and flow mid-print.`
  }

  get stepOptions (): SegOption[] {
    return MOVE_STEPS.map((s, i) => ({ value: s, label: i === MOVE_STEPS.length - 1 ? `${s} mm` : String(s) }))
  }

  get xyHomedHere (): boolean {
    return this.isHomed('XY')
  }

  get canMoveXY (): boolean {
    return this.ready && !this.busy && this.xyHomedHere
  }

  get canMoveZ (): boolean {
    return this.ready && !this.busy && this.isHomed('Z')
  }

  get plate (): Bed | null {
    return bedFrom(this.axisMin, this.axisMax)
  }

  get jogButtons () {
    return jogLayout().map(b => ({
      ...b,
      run: () => (b.dx && b.dy ? this.moveByXY(b.dx * this.step, b.dy * this.step) : b.dx ? this.moveBy('X', b.dx * this.step) : this.moveBy('Y', b.dy * this.step))
    }))
  }

  get zKeys () {
    return zKeyWords(this.muonPrinter === true)
  }

  fmt (n: number): string {
    return (Math.round(n * 10) / 10).toFixed(1)
  }

  // -- trackpad --------------------------------------------------------------

  get pickHint (): string {
    if (!this.xyHomedHere) return 'Home X and Y, then tap the bed to pick a spot.'
    if (this.noGo === 'invalid') return 'The notch could not be read, so only raising the head is allowed.'
    return 'Tap the bed to pick a spot, then press Move here. Or drag, and the head follows.'
  }

  get pickNote (): string {
    if (this.dragRefusal) return `Stopped following. ${this.dragRefusal}`
    if (this.following) return 'Following the drag…'
    return this.targetProblem || this.pickWait || this.targetNote
  }

  /** Picking only sets the target. Nothing is sent. */
  pick (p: Point) {
    if (!this.canMoveXY || this.following) return
    this.target = { x: p.x, y: p.y }
    this.targetFor = this.panelTarget
    this.dragTarget = false
    this.dragRefusal = ''
  }

  clearTarget () {
    this.target = null
    this.dragRefusal = ''
  }

  /** A point in G-code coordinates (what moveTo takes): the real spot minus the offsets in force. */
  placeOf (p: Point): { X: number, Y: number } {
    const offset = this.gcodeOffset ?? [0, 0, 0]
    return {
      X: Math.round((p.x - offset[0]) * 1000) / 1000,
      Y: Math.round((p.y - offset[1]) * 1000) / 1000
    }
  }

  get targetPlace (): { X: number, Y: number } | null {
    return this.target ? this.placeOf(this.target) : null
  }

  // -- live drag -------------------------------------------------------------

  /** A drag began: the head follows it, one planned move at a time (drag-follow). */
  dragStart (p: Point) {
    if (!this.canMoveXY || !this.follower) return
    this.target = { x: p.x, y: p.y }
    this.targetFor = this.panelTarget
    this.dragTarget = true
    this.dragRefusal = ''
    this.following = true
    this.follower.start(this.placeOf(p))
    this.following = this.follower.following
  }

  dragTo (p: Point) {
    if (!this.follower?.following || !this.canMoveXY) return
    this.target = { x: p.x, y: p.y }
    this.follower.update(this.placeOf(p))
  }

  dragEnd () {
    this.follower?.release()
  }

  /** Pointer cancelled, focus or capture lost: stop at once, send nothing more. The pick stays, for Move here. */
  dragCancel () {
    this.stopDrag()
  }

  stopDrag () {
    this.follower?.cancel()
    this.following = false
    this.dragTarget = false
  }

  /** What the planner would do with the pick now: the same plan moveTo makes when it is confirmed. */
  get targetPlan () {
    if (!this.target) return null
    return this.planHandMove([this.target.x, this.target.y, Number(this.position[2])])
  }

  /** Why the pick can't be moved to, or ''. */
  get targetProblem (): string {
    const place = this.targetPlace
    const plan = this.targetPlan
    if (!place || !plan) return ''
    if (!plan.ok) return plan.reason
    if (place.X < this.axisMin[0] || place.X > this.axisMax[0] || place.Y < this.axisMin[1] || place.Y > this.axisMax[1]) return 'That spot is outside the machine.'
    return ''
  }

  liftNote (plan: MovePlan, there: string): string {
    if (!plan.ok) return ''
    if (plan.lifted) {
      // The plan's steps are in G-code coordinates; say the height in real Z, as the refusals do.
      const lift = Number(plan.steps[0].Z) + (this.gcodeOffset ?? [0, 0, 0])[2]
      return `Lifts to Z ${Math.round(lift * 100) / 100} first, to cross the notch`
    }
    return there
  }

  get targetNote (): string {
    const plan = this.targetPlan
    if (!plan) return ''
    return this.liftNote(plan, `Straight there, at Z ${(Number(this.position[2]) || 0).toFixed(2)}`)
  }

  /** Why Move here must wait (the last hand move or a script hasn't landed), or ''. */
  get pickWait (): string {
    // Read so this is worked out again on each tick and each reported position.
    const seen = [this.tick, this.$store.state.printer.printer.gcode_move?.gcode_position]
    return this.target && seen ? this.handMoveWait() : ''
  }

  get canConfirm (): boolean {
    return this.canMoveXY && !!this.target && !this.targetProblem && !this.pickWait && !this.following && this.targetFor === this.panelTarget
  }

  /** The confirm step: only here does a pick become a move, through moveTo and its planner. The pick stays if nothing was sent. */
  confirmMove () {
    const place = this.targetPlace
    if (!this.canConfirm || !place) return
    if (this.moveTo(place)) this.target = null
  }

  // -- keys --------------------------------------------------------------------

  /** Arrow keys step the head, PgUp and PgDn the plate; Shift is ten steps. */
  onPadKey (event: KeyboardEvent) {
    const by = this.step * (event.shiftKey ? 10 : 1)
    const keys: Record<string, [Axis, number]> = {
      ArrowUp: ['Y', Y_BACK * by],
      ArrowDown: ['Y', -Y_BACK * by],
      ArrowLeft: ['X', -X_RIGHT * by],
      ArrowRight: ['X', X_RIGHT * by],
      PageUp: ['Z', by],
      PageDown: ['Z', -by]
    }
    const move = keys[event.key]
    if (!move || event.target !== event.currentTarget) return
    event.preventDefault()
    if (move[0] === 'Z' ? this.canMoveZ : this.canMoveXY) this.moveBy(move[0], move[1])
  }

  // -- go to -------------------------------------------------------------------

  /** The readout turns into fields, filled with where the head is in G-code coordinates (what Go sends). */
  openGoTo () {
    const g = this.$store.state.printer.printer.gcode_move?.gcode_position as number[] | undefined
    const at = Array.isArray(g) ? g : this.position
    this.goTo = [0, 1, 2].map(i => Math.round(Number(at[i]) * 100) / 100)
    this.goStart = [...this.goTo]
    this.goTarget = this.panelTarget
    this.goOpen = true
  }

  setGoTo (i: number, value: number) {
    this.goTo.splice(i, 1, value)
  }

  get goPlace (): { X?: number, Y?: number, Z?: number } {
    const changed = (i: number) => {
      const v = this.goTo[i]
      return v !== null && v !== this.goStart[i] ? v : undefined
    }
    return { X: changed(0), Y: changed(1), Z: changed(2) }
  }

  get goProblem (): string {
    if (!this.goOpen) return ''
    const place = this.goPlace
    if (place.X === undefined && place.Y === undefined && place.Z === undefined) return 'Change a value to go somewhere.'
    return this.moveRefusal(place)
  }

  get goNote (): string {
    if (!this.goOpen || this.goProblem) return ''
    const offset = this.gcodeOffset ?? [0, 0, 0]
    const real = (['X', 'Y', 'Z'] as Axis[]).map((a, i) => this.goPlace[a] !== undefined ? (this.goPlace[a] as number) + offset[i] : Number(this.position[i])) as [number, number, number]
    return this.liftNote(this.planHandMove(real), 'Straight there.')
  }

  get canGo (): boolean {
    return this.goOpen && this.goTarget === this.panelTarget && !this.goProblem
  }

  go () {
    if (!this.canGo) return
    if (this.moveTo(this.goPlace)) this.goOpen = false
  }
}
</script>

<style lang="scss" scoped>
  .move__more {
    display: inline-grid;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    color: var(--m3d-text-muted);
    place-items: center;

    &:hover { background: var(--m3d-surface-2); }
  }

  .move__note {
    margin: 0 0 12px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .move__callout {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
    padding: 10px 14px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--m3d-warning) 14%, transparent);
    color: var(--m3d-text);
    font-size: 13px;

    span { flex: 1; }
  }

  .move__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
  }

  .move__body--dim {
    opacity: 0.38;
  }

  @media (min-width: 1100px) {
    .move__body:not(.move__body--phone) {
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      align-items: start;
    }
  }

  .move__zone {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .move__sub {
    display: flex;
    align-items: center;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    span {
      margin-left: auto;
      font-weight: 500;
      letter-spacing: 0;
      text-transform: none;
    }
  }

  .move__pick {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-height: 40px;
  }

  .move__pick-text {
    display: flex;
    flex: 1 1 160px;
    flex-direction: column;
    min-width: 0;
    font-family: var(--m3d-font-mono);
    font-size: 13px;
  }

  .move__pick-note {
    color: var(--m3d-text-muted);
    font-family: inherit;
    font-size: 12px;
  }

  .move__pick-note--bad {
    color: var(--m3d-danger);
  }

  .move__jog {
    display: flex;
    justify-content: center;
    gap: 28px;
    margin-top: 4px;
    border-radius: 16px;

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
      outline-offset: 4px;
    }
  }

  .move__body--phone .move__jog {
    gap: 22px;
  }

  .move__xy {
    display: grid;
    grid-template-columns: repeat(3, 58px);
    grid-auto-rows: 58px;
    gap: 8px;
  }

  .move__zcol {
    display: grid;
    grid-template-rows: 58px 74px 58px;
    grid-template-columns: 74px;
    gap: 8px;
  }

  .move__zv {
    display: flex;
  }

  .move__b {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 15px;
    font-weight: 700;
    line-height: 1.1;
    text-align: center;

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }

    &:hover:not(:disabled) {
      background: var(--m3d-border-strong);
    }
  }

  .move__b--diag {
    color: var(--m3d-text-muted);
    font-size: 18px;
  }

  .move__b--z {
    padding: 0 6px;
    font-size: 13px;
  }

  .move__dot {
    display: grid;
    place-items: center;

    i {
      display: block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--m3d-text-subtle);
    }
  }

  .move__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: 8px;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid var(--m3d-border);
  }

  .move__bar--bare {
    margin-top: 0;
    padding-top: 0;
    border-top: 0;
  }

  .move__goto {
    height: auto;
  }

  .move__go {
    display: flex;
    flex: 1 1 100%;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .move__go-note {
    flex: 1 1 160px;
  }

  .move__field {
    display: flex;
    flex: 1 1 90px;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 11px;
  }

  .move__field :deep(.numfield) {
    width: 100%;
    min-width: 0;
  }

  .move__homes {
    display: flex;
    gap: 8px;
    margin-left: 12px;
  }

  .move__body--phone ~ .move__bar .move__homes {
    width: 100%;
    margin-left: 0;

    .cbtn { flex: 1; justify-content: center; }
  }

  .move__zoffset {
    margin-top: 16px;
  }
</style>
