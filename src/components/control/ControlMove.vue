<template>
  <control-card
    :title="trackpadOnly ? 'Trackpad' : 'Movement'"
    icon="control"
    :pill="pill"
    :pill-tone="pillTone"
    :locked="ready ? '' : controlLock"
    data-tid="control-move"
  >
    <template #aside>
      <span
        v-if="ready"
        class="move__hhomes"
        data-tid="move-homes"
      >
        <button
          type="button"
          class="move__hbtn"
          :class="{ 'move__hbtn--icon': trackpadOnly }"
          :disabled="busy"
          :aria-label="trackpadOnly ? 'Home all' : undefined"
          title="Home all (G28)"
          data-tid="home-all"
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
          <span v-if="!trackpadOnly">Home all</span>
        </button>
        <button
          v-if="!trackpadOnly"
          type="button"
          class="move__hbtn move__hbtn--z"
          :disabled="busy"
          aria-label="Home Z"
          title="Home Z (G28 Z)"
          data-tid="home-z"
          @click="home('Z')"
        >
          <v-progress-circular
            v-if="homing('Z')"
            indeterminate
            size="14"
            width="2"
          />
          <template v-else>
            Z
          </template>
        </button>
      </span>
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

    <template v-if="ready">
      <p
        v-if="printLocked"
        class="move__note"
        data-tid="move-printing"
      >
        {{ printingNote }}
      </p>
      <p
        v-else-if="busy"
        class="move__note"
        data-tid="move-busy"
      >
        The printer is busy (homing, or running a command). Moving comes back when it finishes.
      </p>
      <div
        v-if="!isHomed('XYZ') && !trackpadOnly"
        class="move__callout"
        data-tid="move-not-homed"
      >
        <frame-icon
          name="home"
          small
        />
        <span>Home before moving. The trackpad needs to know where the head is.</span>
      </div>

      <div
        class="move__body"
        :class="{ 'move__body--phone': phone, 'move__body--solo': trackpadOnly, 'move__body--dim': !isHomed('XY') && !isHomed('Z') }"
      >
        <div
          class="move__zone"
          :class="{ 'move__zone--compact': trackpadOnly }"
        >
          <div
            v-if="!trackpadOnly"
            class="move__sub"
          >
            Trackpad<span>Tap to pick a spot, or drag and the head follows</span>
          </div>
          <div
            class="move__padwrap"
            :class="{ 'move__padwrap--bare': !trackpadOnly }"
          >
            <control-trackpad
              v-if="plate"
              class="move__pad"
              :bed="plate"
              :show-head="xyHomedHere"
              :target="target"
              :target-bad="!!targetProblem || !!dragRefusal"
              :no-go="noGo"
              :disabled="!canMoveXY || moving"
              :on-release="releaseOnly"
              :step="step"
              @pick="pick"
              @drag-start="dragStart"
              @drag="dragTo"
              @drag-end="dragEnd"
              @drag-cancel="dragCancel"
              @release="release"
            >
              <template v-if="trackpadOnly">
                <span
                  v-if="target"
                  class="move__glass move__readout"
                  data-tid="trackpad-readout"
                >X {{ fmt(target.x) }} · Y {{ fmt(target.y) }}</span>
                <span
                  class="move__glass move__mode"
                  role="radiogroup"
                  aria-label="How the trackpad moves"
                  data-tid="trackpad-mode"
                  @pointerdown.stop
                  @keydown.stop
                >
                  <span
                    class="move__modewrap"
                    :title="liveReason"
                    data-tid="trackpad-live-wrap"
                  >
                    <button
                      type="button"
                      role="radio"
                      :aria-checked="liveMoving ? 'true' : 'false'"
                      :class="{ on: liveMoving }"
                      :disabled="!liveAvailable"
                      :aria-description="liveAvailable ? undefined : liveReason"
                      data-tid="trackpad-live"
                      @click="setMode('live')"
                    >Live</button>
                  </span>
                  <button
                    type="button"
                    role="radio"
                    :aria-checked="liveMoving ? 'false' : 'true'"
                    :class="{ on: !liveMoving }"
                    data-tid="trackpad-release"
                    @click="setMode('release')"
                  >On release</button>
                </span>
              </template>
            </control-trackpad>
          </div>
          <div
            v-if="trackpadOnly"
            class="move__pick move__pick--line"
            data-tid="trackpad-pick"
            aria-live="polite"
          >
            <span
              class="move__pick-note"
              :class="{ 'move__pick-note--bad': !!dragRefusal || !!targetProblem }"
              data-tid="trackpad-note"
            >{{ target ? pickNote : tileHint }}</span>
          </div>
          <div
            v-else
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

        <div
          v-if="!trackpadOnly"
          class="move__zone"
        >
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
        v-if="!trackpadOnly"
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
import { X_RIGHT, Y_BACK } from '@/services/machine/orientation'
import { bedFrom, type Bed, type Point } from '@/services/control/trackpad'
import { DragFollow, controlDragHost } from '@/services/control/drag-follow'
import { TRACKPAD_LIVE_AVAILABLE, TRACKPAD_LIVE_REASON, liveTrackpadStream, readTrackpadMode, writeTrackpadMode, type TrackpadMode } from '@/services/control/trackpad-mode'
import { zKeyWords } from '@/services/control/z-keys'
import type { MovePlan } from '@/services/control/safe-move'
import ControlCard from './ControlCard.vue'
import ControlTrackpad from './ControlTrackpad.vue'
import ControlPositionReadout from './ControlPositionReadout.vue'
import ControlZOffset from './ControlZOffset.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import NumberField from './NumberField.vue'
import { normaliseSteps } from '@/services/settings/motion-limits'

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

/** The Z keys' words: services/control/z-keys (shared with the Overview's Jog). */
export { zKeyWords }

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

  /** Only the trackpad and Home all: Jog and Position are their own Overview widgets (KAN-2038). */
  @Prop({ type: Boolean })
  readonly trackpadOnly?: boolean

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

  /** How a drag on the Trackpad moves the head (services/control/trackpad-mode): On release by default, remembered on this device. */
  mode: TrackpadMode = readTrackpadMode()
  readonly liveAvailable = TRACKPAD_LIVE_AVAILABLE
  readonly liveReason = TRACKPAD_LIVE_AVAILABLE ? '' : TRACKPAD_LIVE_REASON

  /**
   * A release that came while this page's last move hadn't landed yet
   * (KAN-2120): the new target is kept and sent, through moveTo, the moment
   * the wait clears. A newer release replaces it. The Klipper half (turning
   * the head mid-move) is the motion project's MUON_JOG.
   */
  queued = false

  /** Live moving: only on the Overview's Trackpad, and only once the printer can stream it. Never a run of G1s. */
  get liveMoving (): boolean {
    return !!this.trackpadOnly && this.liveAvailable && this.mode === 'live' && !!liveTrackpadStream(this.$store.getters['printer/getAvailableCommands'])
  }

  /** The Overview's Trackpad sends one move, when the pointer lifts; nothing while it is down. */
  get releaseOnly (): boolean { return !!this.trackpadOnly && !this.liveMoving }

  setMode (mode: TrackpadMode) {
    this.mode = writeTrackpadMode(mode)
  }

  get tileHint (): string {
    if (!this.xyHomedHere) return 'Home first, then tap or drag the bed.'
    if (this.noGo === 'invalid') return 'The notch could not be read, so only raising the head is allowed.'
    return this.releaseOnly ? 'Tap or drag, then let go: the head moves there once.' : 'Drag, and the head follows.'
  }

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
    if (this.queued) this.sendQueued()
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
      this.queued = false
    }
  }

  @Watch('moving')
  onMoving (moving: boolean) {
    if (moving) {
      this.stopDrag()
      this.target = null
      this.queued = false
    }
  }

  /** A queued target goes as soon as the printer reports the last move landed. */
  @Watch('$store.state.printer.printer.gcode_move.gcode_position')
  onGcodePosition () {
    if (this.queued) this.$nextTick(() => this.sendQueued())
  }

  get ready (): boolean {
    return this.controlReady
  }

  /** "Locked while printing" only for a real print (print_stats); never for this page's own moves (KAN-2120). */
  get pill (): string {
    if (!this.ready) return ''
    if (this.printLocked) return 'Locked while printing'
    if (this.busy) return 'Busy'
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

  /** Settings › Moving and extruding's step sizes for the head and the plate, one picker for both. */
  get moveSteps (): number[] {
    const general = this.$store.state.config?.uiSettings?.general
    const steps = normaliseSteps([...(general?.toolheadXYMoveDistances ?? []), ...(general?.toolheadZMoveDistances ?? [])])
    return steps.length ? steps : MOVE_STEPS
  }

  get stepOptions (): SegOption[] {
    const steps = this.moveSteps
    return steps.map((s, i) => ({ value: s, label: i === steps.length - 1 ? `${s} mm` : String(s) }))
  }

  get xyHomedHere (): boolean {
    return this.isHomed('XY')
  }

  /** The printer is moving on its own account (a print, or homing): the trackpad greys out and waits (KAN-2039). Existing state only. */
  get moving (): boolean {
    return this.busy || this.homing() || this.homing('Z')
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
    if (!this.xyHomedHere) return 'Home all, then tap the bed to pick a spot.'
    if (this.noGo === 'invalid') return 'The no-go regions could not be read, so only raising the head is allowed.'
    return 'Tap the bed to pick a spot, then press Move here. Or drag, and the head follows.'
  }

  get pickNote (): string {
    if (this.dragRefusal) return `Stopped following. ${this.dragRefusal}`
    if (this.following) return 'Following the drag…'
    if (this.queued && !this.targetProblem) return 'Goes there as soon as the current move lands.'
    if (this.releaseOnly) return this.targetProblem || this.targetNote
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

  /**
   * The pointer lifted (or Enter was pressed) on the Overview's Trackpad: the
   * one move, through moveTo and its planner (so the notch rule holds).
   * Nothing was sent while the pointer was down. If this page's last move
   * hasn't landed yet, the target is queued and sent when it has (a later
   * release replaces it); a refused target stays on the pad and says why.
   */
  release () {
    if (!this.releaseOnly || !this.target || !this.canMoveXY || this.targetFor !== this.panelTarget) return
    if (this.targetProblem) { this.queued = false; return }
    if (this.handMoveWait()) { this.queued = true; return }
    this.queued = false
    this.confirmMove()
  }

  /** Send the queued target once nothing is in the way any more; drop it if it can no longer go. */
  sendQueued () {
    if (!this.queued) return
    if (!this.target || !this.canMoveXY || this.targetFor !== this.panelTarget || this.targetProblem) { this.queued = false; return }
    if (this.handMoveWait()) return
    this.queued = false
    this.confirmMove()
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
    if (this.releaseOnly) { this.pick(p); return }
    this.target = { x: p.x, y: p.y }
    this.targetFor = this.panelTarget
    this.dragTarget = true
    this.dragRefusal = ''
    this.following = true
    this.follower.start(this.placeOf(p))
    this.following = this.follower.following
  }

  dragTo (p: Point) {
    if (this.releaseOnly) { this.pick(p); return }
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
    // On release nothing was sent, so a cancelled press leaves no pick (and no queued move) behind.
    if (this.releaseOnly) { this.target = null; this.queued = false }
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
      return `Lifts to Z ${Math.round(lift * 100) / 100} first, to cross the no-go region`
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
    .move__body:not(.move__body--phone):not(.move__body--solo) {
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

  /*
   * The Overview's Trackpad (Jack's pick B, KAN-2077): the pad fills the
   * tile, the picked spot and the Live / On release choice sit on the pad's
   * lower corners, and one line under it says what a press will do. No
   * button sends the move: lifting the pointer does.
   */
  .move__zone--compact {
    gap: 8px;
  }

  .move__padwrap {
    position: relative;
    width: 100%;
    margin: 0 auto;
  }

  .move__padwrap--bare {
    margin: 0;
  }

  .move__padwrap:not(.move__padwrap--bare) :deep(.tpad) {
    margin: 0 auto;
  }

  .move__glass {
    position: absolute;
    bottom: 8px;
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--m3d-surface) 84%, transparent);
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    font-size: 12px;
    pointer-events: none;
  }

  .move__readout {
    left: 8px;
    font-family: var(--m3d-font-mono);
    font-weight: 600;
  }

  .move__mode {
    right: 8px;
    gap: 2px;
    padding: 3px;
    pointer-events: auto;

    button {
      height: 24px;
      padding: 0 9px;
      border-radius: 999px;
      color: var(--m3d-text-muted);
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;

      &.on {
        background: var(--m3d-accent);
        color: var(--m3d-on-accent, #00201e);
      }

      &:disabled {
        opacity: 0.45;
        cursor: default;
      }
    }
  }

  .move__modewrap {
    display: inline-flex;
  }

  .move__pick--line {
    min-height: 20px;
  }

  /* CT-03: the one Home control sits in the header, beside the title, on the Overview and on Control. */
  .move__hhomes {
    display: inline-flex;
    gap: 6px;
  }

  .move__hbtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 34px;
    padding: 0 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;

    &:hover:not(:disabled) { filter: brightness(1.15); }
    &:disabled { opacity: 0.45; cursor: default; }
  }

  .move__hbtn--icon,
  .move__hbtn--z {
    width: 34px;
    padding: 0;
    font-family: var(--m3d-font-mono);
  }

  .move__zoffset {
    margin-top: 16px;
  }
</style>
