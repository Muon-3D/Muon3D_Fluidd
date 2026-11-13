<template>
  <tile-shell
    tile="jog"
    title="Jog"
    icon="control"
    :state="pill"
    :tone="pillTone"
    :menu="menu"
    :class="['jg', `jg--${size}`]"
  >
    <div
      class="jg__body"
      data-tid="jog-body"
    >
      <div
        class="jg__pad"
        role="group"
        aria-label="Move the head"
      >
        <button
          type="button"
          class="jg__b jg__n"
          aria-label="Head back"
          data-jog="y+"
          :disabled="!canMoveXY"
          @click="moveBy('Y', Y_BACK * step)"
        >
          <frame-icon name="chevronUp" />
        </button>
        <button
          type="button"
          class="jg__b jg__w"
          aria-label="Head left"
          data-jog="x-"
          :disabled="!canMoveXY"
          @click="moveBy('X', -X_RIGHT * step)"
        >
          <frame-icon name="chevronLeft" />
        </button>
        <span
          class="jg__b jg__c"
          aria-hidden="true"
          data-jog="centre"
        />
        <button
          type="button"
          class="jg__b jg__e"
          aria-label="Head right"
          data-jog="x+"
          :disabled="!canMoveXY"
          @click="moveBy('X', X_RIGHT * step)"
        >
          <frame-icon name="chevronRight" />
        </button>
        <button
          type="button"
          class="jg__b jg__s"
          aria-label="Head forward"
          data-jog="y-"
          :disabled="!canMoveXY"
          @click="moveBy('Y', -Y_BACK * step)"
        >
          <frame-icon name="chevronDown" />
        </button>
      </div>
      <div
        class="jg__z"
        role="group"
        aria-label="Move the plate"
        data-tid="jog-z"
      >
        <button
          type="button"
          class="jg__zb"
          :aria-label="zKeys.up.label"
          :title="zKeys.up.title"
          data-jog="z+"
          :disabled="!canMoveZ"
          @click="moveBy('Z', step)"
        >
          <frame-icon name="arrowUp" />
          <span>{{ zKeys.up.text }}</span>
        </button>
        <button
          type="button"
          class="jg__zb"
          :aria-label="zKeys.down.label"
          :title="zKeys.down.title"
          data-jog="z-"
          :disabled="!canMoveZ"
          @click="moveBy('Z', -step)"
        >
          <frame-icon name="arrowDown" />
          <span>{{ zKeys.down.text }}</span>
        </button>
      </div>
    </div>
    <seg-picker
      class="jg__step"
      :options="steps"
      :value="step"
      label="Step"
      accent
      fill
      :disabled="!controlReady"
      data-tid="jog-step"
      @input="step = $event"
    />
    <span
      v-if="lock"
      class="jg__sr"
      data-tid="jog-lock"
    >{{ lock }}</span>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { X_RIGHT, Y_BACK } from '@/services/machine/orientation'
import type { TileMenuItem } from '@/services/overview/tiles'
import { zKeyWords } from '@/services/control/z-keys'
import TileShell from './TileShell.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'

/** The steps a jog takes, mm. */
export const JOG_STEPS = [0.1, 1, 10, 100]

/**
 * Jog, Jack's pick B (KAN-2119): the cross pad, Plate up and Plate down as
 * labelled keys beside it, and one row of steps under both. Every size draws
 * all three (S tighter, L roomier), and the pad and keys stretch to fill the
 * tile, so nothing is left blank at the bottom. Homing is the Trackpad's one
 * Home control. Every move is ControlMixin's moveBy, so it is refused while
 * printing, before homing, or when the printer is not ready; the pill says
 * "Printing" only for a real print (KAN-2120).
 */
@Component({ components: { TileShell, SegPicker } })
export default class JogTile extends Mixins(OverviewMixin) {
  readonly Y_BACK = Y_BACK
  /** Right on the pad is the right of the machine, as the trackpad draws it (M1_VIEW). */
  readonly X_RIGHT = X_RIGHT
  step = 1

  get steps (): SegOption[] {
    return JOG_STEPS.map(v => ({ value: v, label: this.size === 'S' ? String(v) : `${v} mm` }))
  }

  get canMoveXY (): boolean { return this.controlReady && !this.busy && this.isHomed('XY') }
  get canMoveZ (): boolean { return this.controlReady && !this.busy && this.isHomed('Z') }

  /** Plate up / Plate down on a Muon printer (it prints upside down); Z+ and Z− on others. */
  get zKeys () { return zKeyWords(this.muonPrinter !== false) }

  get lock (): string {
    if (!this.controlReady) return this.controlLock
    if (this.busy) return this.moveLockReason
    if (!this.isHomed('XY')) return 'Home first (Home on the Trackpad) to move the head.'
    return ''
  }

  get pill (): string {
    if (!this.controlReady) return ''
    if (this.printLocked) return 'Printing'
    if (this.busy) return 'Busy'
    return this.isHomed('XYZ') ? '' : 'Home first'
  }

  get pillTone (): string {
    return this.printLocked || this.busy ? 'run' : 'warm'
  }

  get commands (): Record<string, unknown> {
    return (this.$store.getters['printer/getAvailableCommands'] as Record<string, unknown>) ?? {}
  }

  get screwsCommand (): string | null {
    return ['BED_SCREWS_ADJUST', 'SCREWS_TILT_CALCULATE'].find(c => c in this.commands) ?? null
  }

  get menu (): TileMenuItem[] {
    const items: TileMenuItem[] = [
      { id: 'extrude', label: 'Extrude and retract…', to: this.pagePath('/control') },
      { id: 'motors', label: 'Turn motors off', disabled: !this.controlReady || this.busy, action: () => this.motorsOff() }
    ]
    if (this.screwsCommand) {
      const command = this.screwsCommand
      items.push({ id: 'screws', label: 'Bed screws and tilt…', disabled: !this.controlReady || this.busy, action: () => { this.sendTypedGcode(command) } })
    }
    return items
  }
}
</script>

<style lang="scss">
/* KAN-2119, Jack's pick B: the cross pad, labelled Plate up / Plate down beside it, one step row under both. The body grows to fill the tile. */
.jg { gap: 10px; }
.jg > .ot__door { flex: 1 1 auto; gap: 10px; }
.jg__body { display: flex; flex: 1 1 auto; gap: 12px; min-height: 0; }
.jg__pad { display: grid; flex: 1 1 0; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(3, minmax(40px, 1fr)); gap: 8px; min-width: 0; }
.jg__b { display: inline-flex; align-items: center; justify-content: center; min-width: 0; border-radius: 14px; background: var(--m3d-surface-2); cursor: pointer; }
.jg__b .frame-icon { color: var(--m3d-text); }
.jg__b:hover:not(:disabled) { filter: brightness(1.15); }
.jg__b:disabled { opacity: 0.4; cursor: default; }
.jg__n { grid-area: 1 / 2; } .jg__w { grid-area: 2 / 1; } .jg__e { grid-area: 2 / 3; } .jg__s { grid-area: 3 / 2; }
.jg__c { grid-area: 2 / 2; opacity: 0.45; cursor: default; }
.jg__z { display: flex; flex: 0 0 34%; flex-direction: column; gap: 8px; min-width: 0; }
.jg__zb { display: flex; flex: 1 1 0; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-width: 0; min-height: 52px; padding: 6px; border-radius: 14px; background: var(--m3d-surface-2); color: var(--m3d-text); font-size: 13px; font-weight: 600; line-height: 1.15; text-align: center; cursor: pointer; }
.jg__zb .frame-icon { width: 20px; height: 20px; color: var(--m3d-text-muted); }
.jg__zb:hover:not(:disabled) { filter: brightness(1.15); }
.jg__zb:disabled { opacity: 0.4; cursor: default; }
.jg .jg__step.seg { flex: 0 0 auto; gap: 6px; padding: 0; background: transparent; }
.jg .jg__step.seg button { height: 40px; border-radius: 12px; background: var(--m3d-surface-2); }
.jg .jg__step.seg button.on { background: var(--m3d-accent); color: var(--m3d-on-accent, #00201e); }
/* S: tighter keys, the icon over a short word. */
.jg--S .jg__body { gap: 8px; }
.jg--S .jg__pad { gap: 6px; grid-template-rows: repeat(3, minmax(34px, 1fr)); }
.jg--S .jg__zb { gap: 2px; min-height: 44px; font-size: 11.5px; }
.jg--S .jg__step.seg button { height: 34px; font-size: 12px; }
/* L, the wide variant: pad, Plate keys and the steps side by side (the steps as a column), so the width is used, not stretched into slabs. */
.jg--L > .ot__door { display: grid; grid-template-columns: minmax(0, 1fr) minmax(120px, 0.32fr); grid-template-rows: auto minmax(0, 1fr); column-gap: 14px; }
.jg--L > .ot__door > .ot__head { grid-column: 1 / -1; }
.jg--L .jg__body { gap: 14px; }
.jg--L .jg__z { flex-basis: 40%; }
.jg--L .jg__zb { font-size: 14px; }
.jg.jg--L .jg__step.seg { flex-direction: column; align-self: stretch; }
.jg.jg--L .jg__step.seg button { flex: 1 1 0; height: auto; min-height: 36px; }
.jg__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 599px) {
  .jg__pad { grid-template-rows: repeat(3, minmax(48px, 1fr)); }
  .jg__z { flex-basis: 38%; }
}
</style>
