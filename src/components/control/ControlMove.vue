<template>
  <control-card
    title="Move"
    icon="control"
    :pill="busy && ready ? 'Locked while printing' : ''"
    :locked="lockReason"
    data-tid="control-move"
  >
    <seg-picker
      :options="stepOptions"
      :value="step"
      label="Step"
      fill
      :disabled="!ready"
      @input="step = $event"
    />

    <div
      class="move__body"
      :class="{ 'move__body--phone': phone }"
    >
      <div class="move__trackpad">
        <control-trackpad
          v-if="plate"
          :bed="plate"
          :head="xyHomedHere ? head : null"
          :target="target"
          :target-bad="!!targetProblem"
          :no-go="noGo"
          :disabled="!canMoveXY"
          :step="step"
          @pick="pick"
        >
          <div
            v-if="ready && !xyHomedHere"
            class="move__home-first"
          >
            <span>Home X and Y to move the head</span>
            <button
              type="button"
              class="cbtn cbtn--primary"
              :disabled="busy"
              @click.stop="home('XY')"
              @pointerdown.stop
            >
              Home X Y
            </button>
          </div>
        </control-trackpad>
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
                :class="{ 'move__pick-note--bad': !!targetProblem }"
                data-tid="trackpad-note"
              >{{ targetProblem || pickWait || targetNote }}</span>
            </span>
            <button
              type="button"
              class="cbtn"
              data-tid="trackpad-clear"
              @click="clearTarget"
            >
              Clear
            </button>
            <button
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
        class="move__jog"
        tabindex="0"
        role="group"
        aria-label="Jog pad. Arrow keys step the head, Page Up and Page Down the plate."
        data-tid="move-pad"
        @keydown="onPadKey"
      >
        <div class="move__xy">
          <button
            v-for="b in jogButtons"
            :key="b.id"
            type="button"
            class="move__b"
            :class="[`move__b--${b.id}`, { 'move__b--home': b.id === 'home' }]"
            :aria-label="b.label"
            :title="b.label"
            :disabled="b.id === 'home' ? !ready || busy : !canMoveXY"
            @click="b.run()"
          >
            <frame-icon
              v-if="b.icon"
              :name="b.icon"
              small
            />
            <span v-else>{{ b.text }}</span>
          </button>
        </div>
        <div class="move__zcol">
          <button
            type="button"
            class="move__b"
            aria-label="Plate up"
            title="Plate up (Z+)"
            :disabled="!canMoveZ"
            @click="moveBy('Z', step)"
          >
            Z+
          </button>
          <span
            class="move__zlabel"
            aria-hidden="true"
          >Z</span>
          <button
            type="button"
            class="move__b"
            aria-label="Plate down"
            title="Plate down (Z−)"
            :disabled="!canMoveZ"
            @click="moveBy('Z', -step)"
          >
            Z−
          </button>
        </div>
      </div>
    </div>

    <div
      class="move__exact"
      data-tid="move-position"
    >
      <label
        v-for="(axis, i) in ['X', 'Y', 'Z']"
        :key="axis"
        class="move__field"
      >
        <span class="move__field-label">{{ axis }} <small>{{ axisMin[i] }} to {{ axisMax[i] }}</small></span>
        <number-field
          :value="goTo[i] !== null ? goTo[i] : position[i]"
          :decimals="2"
          :min="axisMin[i]"
          :max="axisMax[i]"
          :label="`${axis} to go to`"
          :disabled="!ready || busy || !isHomed(axis)"
          @change="setGoTo(i, $event)"
        />
      </label>
      <button
        v-if="hasGoTo"
        type="button"
        class="cbtn cbtn--primary move__go"
        :disabled="!canGo"
        data-tid="move-go"
        @click="go"
      >
        Go
      </button>
    </div>
    <p class="move__keys">
      Homed {{ homedAxes || 'none' }} · head at {{ xySpeed }} mm/s · plate at {{ zSpeed }} mm/s
    </p>

    <div class="move__actions">
      <button
        type="button"
        class="cbtn"
        :disabled="!ready || busy"
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
        Home all
      </button>
      <button
        type="button"
        class="cbtn"
        :disabled="!ready || busy"
        data-tid="home-xy"
        @click="home('XY')"
      >
        <v-progress-circular
          v-if="homing('XY')"
          indeterminate
          size="14"
          width="2"
        />
        Home XY
      </button>
      <button
        type="button"
        class="cbtn"
        :disabled="!ready || busy"
        data-tid="home-z"
        @click="home('Z')"
      >
        <v-progress-circular
          v-if="homing('Z')"
          indeterminate
          size="14"
          width="2"
        />
        Home Z
      </button>
    </div>
    <!-- Apart from the homing row, so a mis-tap on Home Z can't land on it. -->
    <div class="move__after">
      <button
        type="button"
        class="cbtn move__motors"
        :disabled="!ready || busy"
        title="M84"
        data-tid="motors-off"
        @click="motorsOff"
      >
        Motors off
      </button>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import { Y_BACK } from '@/services/machine/orientation'
import { bedFrom, type Bed, type Point } from '@/services/control/trackpad'
import ControlCard from './ControlCard.vue'
import ControlTrackpad from './ControlTrackpad.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import NumberField from './NumberField.vue'
import { normaliseSteps } from '@/services/settings/motion-limits'

type Axis = 'X' | 'Y' | 'Z'

/** The steps a jog takes, mm. Fine jog down to a tenth. */
export const MOVE_STEPS = [0.1, 1, 10, 50]

/**
 * Move: the bed as a trackpad, a jog pad with home in the centre and Z
 * beside it, the live position (type a value to go there), and homing.
 *
 * Every move goes through ControlMixin's moveBy / moveTo / moveByXY, which
 * plan it against the printer's no-go regions and hold it until the last
 * hand move has landed. A tap on the trackpad only picks a target: it is
 * sent when "Move here" is pressed, and dragging never streams moves.
 * Nothing moves until the axes are homed, and nothing while a print runs.
 */
@Component({ components: { ControlCard, ControlTrackpad, SegPicker, NumberField } })
export default class ControlMove extends Mixins(ControlMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  step = 10
  goTo: Array<number | null> = [null, null, null]
  goTarget = ''
  /** The trackpad's pick, in toolhead (real) coordinates; null when nothing is picked. */
  target: Point | null = null
  targetFor = ''

  /** Ticks while a pick is shown, so "is the head still moving?" is read again (that state is not reactive). */
  tick = 0
  private ticker: number | null = null

  @Watch('panelTarget')
  clearDraft () { this.goTo = [null, null, null]; this.target = null }

  @Watch('target')
  onTarget (target: Point | null) {
    if (target && this.ticker === null) this.ticker = window.setInterval(() => { this.tick++ }, 250)
    if (!target && this.ticker !== null) { window.clearInterval(this.ticker); this.ticker = null }
  }

  beforeDestroy () {
    if (this.ticker !== null) window.clearInterval(this.ticker)
  }

  /** A pick is dropped the moment moving is no longer allowed (a print starts, homing is lost). */
  @Watch('canMoveXY')
  onCanMove (can: boolean) { if (!can) this.target = null }

  get ready (): boolean {
    return this.controlReady
  }

  get lockReason (): string {
    if (!this.ready) return this.controlLock
    if (this.busy) return 'Not while printing: moving the head would ruin the print'
    return ''
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

  get canMoveXY (): boolean {
    return this.ready && !this.busy && this.xyHomedHere
  }

  get canMoveZ (): boolean {
    return this.ready && !this.busy && this.isHomed('Z')
  }

  get plate (): Bed | null {
    return bedFrom(this.axisMin, this.axisMax)
  }

  get head (): Point {
    return { x: Number(this.position[0]), y: Number(this.position[1]) }
  }

  /** Up on the pad is the back of the machine, whichever way its Y runs. */
  get jogButtons () {
    const s = (n: number) => (n > 0 ? '+' : '−')
    const back = Y_BACK
    const step = () => this.step
    return [
      { id: 'nw', text: '↖', label: 'Head back and left', run: () => this.moveByXY(-step(), back * step()) },
      { id: 'n', text: `Y${s(back)}`, label: `Head back (Y${s(back)})`, run: () => this.moveBy('Y', back * step()) },
      { id: 'ne', text: '↗', label: 'Head back and right', run: () => this.moveByXY(step(), back * step()) },
      { id: 'w', text: 'X−', label: 'Head left (X−)', run: () => this.moveBy('X', -step()) },
      { id: 'home', icon: 'home', label: 'Home X and Y', run: () => this.home('XY') },
      { id: 'e', text: 'X+', label: 'Head right (X+)', run: () => this.moveBy('X', step()) },
      { id: 'sw', text: '↙', label: 'Head forward and left', run: () => this.moveByXY(-step(), -back * step()) },
      { id: 's', text: `Y${s(-back)}`, label: `Head forward (Y${s(-back)})`, run: () => this.moveBy('Y', -back * step()) },
      { id: 'se', text: '↘', label: 'Head forward and right', run: () => this.moveByXY(step(), -back * step()) }
    ] as Array<{ id: string, text?: string, icon?: string, label: string, run: () => void }>
  }

  fmt (n: number): string {
    return (Math.round(n * 10) / 10).toFixed(1)
  }

  // -- trackpad --------------------------------------------------------------

  get pickHint (): string {
    if (!this.ready) return ''
    if (this.busy) return 'The trackpad is locked while a print runs.'
    if (!this.xyHomedHere) return 'Home X and Y, then tap the bed to pick a spot.'
    if (this.noGo === 'invalid') return 'The no-go regions could not be read, so only raising the head is allowed.'
    return 'Tap the bed to pick a spot, then press Move here.'
  }

  /** Picking only sets the target. Nothing is sent. */
  pick (p: Point) {
    if (!this.canMoveXY) return
    this.target = { x: p.x, y: p.y }
    this.targetFor = this.panelTarget
  }

  clearTarget () {
    this.target = null
  }

  /** The pick in G-code coordinates (what moveTo takes): the real spot minus the offsets in force. */
  get targetPlace (): { X: number, Y: number } | null {
    if (!this.target) return null
    const offset = this.gcodeOffset ?? [0, 0, 0]
    return {
      X: Math.round((this.target.x - offset[0]) * 1000) / 1000,
      Y: Math.round((this.target.y - offset[1]) * 1000) / 1000
    }
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

  get targetNote (): string {
    const plan = this.targetPlan
    if (!plan || !plan.ok) return ''
    if (plan.lifted) {
      // The plan's steps are in G-code coordinates; say the height in real Z, as the refusals do.
      const lift = Number(plan.steps[0].Z) + (this.gcodeOffset ?? [0, 0, 0])[2]
      return `Lifts to Z ${Math.round(lift * 100) / 100} first, to cross the no-go region`
    }
    return 'Straight there, at this height'
  }

  /** Why Move here must wait (the last hand move or a script hasn't landed), or ''. */
  get pickWait (): string {
    // Read so this is worked out again on each tick and each reported position.
    const seen = [this.tick, this.$store.state.printer.printer.gcode_move?.gcode_position]
    return this.target && seen ? this.handMoveWait() : ''
  }

  get canConfirm (): boolean {
    return this.canMoveXY && !!this.target && !this.targetProblem && !this.pickWait && this.targetFor === this.panelTarget
  }

  /** The confirm step: only here does a pick become a move, through moveTo and its planner. The pick stays if nothing was sent. */
  confirmMove () {
    const place = this.targetPlace
    if (!this.canConfirm || !place) return
    if (this.moveTo(place)) this.target = null
  }

  // -- keys and exact moves --------------------------------------------------

  /** Arrow keys step the head, PgUp and PgDn the plate; Shift is ten steps. */
  onPadKey (event: KeyboardEvent) {
    const by = this.step * (event.shiftKey ? 10 : 1)
    const keys: Record<string, [Axis, number]> = {
      ArrowUp: ['Y', Y_BACK * by],
      ArrowDown: ['Y', -Y_BACK * by],
      ArrowLeft: ['X', -by],
      ArrowRight: ['X', by],
      PageUp: ['Z', by],
      PageDown: ['Z', -by]
    }
    const move = keys[event.key]
    if (!move || event.target !== event.currentTarget) return
    event.preventDefault()
    if (move[0] === 'Z' ? this.canMoveZ : this.canMoveXY) this.moveBy(move[0], move[1])
  }

  setGoTo (i: number, value: number) {
    if (!this.hasGoTo) this.goTarget = this.panelTarget
    this.goTo.splice(i, 1, value)
  }

  get hasGoTo (): boolean {
    return this.goTo.some(v => v !== null)
  }

  get canGo (): boolean {
    return this.ready && !this.busy && this.hasGoTo && this.goTarget === this.panelTarget &&
      this.goTo.every((v, i) => v === null || (Number.isFinite(v) && v >= this.axisMin[i] && v <= this.axisMax[i] && this.isHomed('XYZ'[i])))
  }

  go () {
    if (!this.canGo) return
    const [X, Y, Z] = this.goTo
    this.moveTo({ X: X ?? undefined, Y: Y ?? undefined, Z: Z ?? undefined })
    this.goTo = [null, null, null]
  }
}
</script>

<style lang="scss" scoped>
  .move__body {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    container-type: inline-size;
  }

  @container (min-width: 600px) {
    .move__body:not(.move__body--phone) {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
    }
  }

  .move__trackpad {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }

  .move__home-first {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: color-mix(in srgb, var(--m3d-surface-2) 70%, transparent);
    color: var(--m3d-text);
    font-size: 14px;
    cursor: default;
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
    gap: 16px;
    border-radius: 16px;

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
      outline-offset: 4px;
    }
  }

  .move__xy {
    display: grid;
    grid-template-columns: repeat(3, 64px);
    grid-auto-rows: 52px;
    gap: 8px;
  }

  .move__zcol {
    display: grid;
    grid-template-columns: 64px;
    grid-auto-rows: 52px;
    gap: 8px;
  }

  .move__body--phone .move__xy {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    flex: 3 1 0;
  }

  .move__body--phone .move__zcol {
    grid-template-columns: minmax(0, 1fr);
    flex: 1 1 0;
  }

  .move__b {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 14px;
    font-weight: 600;

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }

    &:hover:not(:disabled) {
      background: var(--m3d-border-strong);
    }
  }

  .move__zlabel {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--m3d-text-muted);
    font-size: 14px;
    font-weight: 600;
  }

  .move__b--home {
    background: color-mix(in srgb, var(--m3d-accent) 22%, var(--m3d-surface-2));
  }

  .move__exact {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    align-items: end;
    gap: 8px;
  }

  .move__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 12px;

    small { opacity: 0.7; font-size: 11px; }
  }

  .move__field :deep(.numfield) {
    width: 100%;
    min-width: 0;
  }

  .move__keys {
    margin: 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .move__actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .move__after {
    display: flex;
    justify-content: flex-end;
    padding-top: 8px;
    border-top: 1px solid var(--m3d-border);
  }
</style>
