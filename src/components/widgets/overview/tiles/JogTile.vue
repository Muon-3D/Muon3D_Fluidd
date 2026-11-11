<template>
  <tile-shell
    tile="jog"
    title="Jog"
    icon="control"
    :menu="menu"
    :state="lockShort"
    tone="warm"
    :class="['jg', `jg--${size}`]"
  >
    <div class="jg__body">
      <div class="jg__pad">
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
        v-if="size !== 'S'"
        class="jg__z"
      >
        <button
          type="button"
          class="jg__zb"
          aria-label="Plate up"
          data-jog="z+"
          :disabled="!canMoveZ"
          @click="moveBy('Z', step)"
        >
          <frame-icon name="arrowUp" />
          <span>Plate up</span>
        </button>
        <button
          type="button"
          class="jg__zb"
          aria-label="Plate down"
          data-jog="z-"
          :disabled="!canMoveZ"
          @click="moveBy('Z', -step)"
        >
          <frame-icon name="arrowDown" />
          <span>Plate down</span>
        </button>
      </div>
    </div>
    <seg-picker
      v-if="size !== 'S'"
      class="jg__step"
      :options="steps"
      :value="step"
      label="Step"
      accent
      fill
      :disabled="!controlReady"
      @input="step = $event"
    />
    <span
      v-if="lock"
      class="jg__sr"
      role="status"
    >{{ lock }}</span>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { X_RIGHT, Y_BACK } from '@/services/machine/orientation'
import type { TileMenuItem } from '@/services/overview/tiles'
import TileShell from './TileShell.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'

/**
 * The jog pad: the head over the plate with arrows and Z beside it. Homing
 * is the Trackpad's one Home all. It is Control move, from the one ControlMixin, so it refuses to
 * move while printing, before homing, or when the printer is not ready.
 */
@Component({ components: { TileShell, SegPicker } })
export default class JogTile extends Mixins(OverviewMixin) {
  readonly Y_BACK = Y_BACK
  /** Right on the pad is the right of the machine, as the trackpad draws it (M1_VIEW). */
  readonly X_RIGHT = X_RIGHT
  step = 1
  readonly steps: SegOption[] = [0.1, 1, 10, 100].map(v => ({ value: v, label: String(v) }))

  get canMoveXY (): boolean { return this.controlReady && !this.busy && this.isHomed('XY') }
  get canMoveZ (): boolean { return this.controlReady && !this.busy && this.isHomed('Z') }

  /** The lock as a word or two for the tile's header; the whole sentence is `lock`, for a screen reader. */
  get lockShort (): string {
    if (!this.controlReady) return 'Not ready'
    if (this.busy) return 'Printing'
    if (!this.isHomed('XY')) return 'Home first'
    return ''
  }

  get lock (): string {
    if (!this.controlReady) return this.controlLock
    if (this.busy) return 'Not while printing.'
    if (!this.isHomed('XY')) return 'Home all (on the Trackpad) to move the head.'
    return ''
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
/* KAN-2078, Jack's pick B: the cross pad with labelled Plate up / Plate down beside it, and one step row under. As tall as its neighbour, with nothing blank under the step row. */
.jg { gap: 10px; }
.jg > .ot__door { flex: 1 1 auto; gap: 10px; }
.jg__body { display: flex; flex: 1 1 auto; gap: 14px; min-height: 184px; }
.jg__pad { display: grid; flex: 1 1 0; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 8px; min-width: 0; max-width: 340px; margin: 0 auto; }
.jg--S .jg__pad { grid-template-rows: repeat(3, 52px); max-width: 190px; }
.jg__b { display: inline-flex; align-items: center; justify-content: center; min-width: 0; border-radius: 14px; background: var(--m3d-surface-2); cursor: pointer; }
.jg__b .frame-icon { color: var(--m3d-text); }
.jg__b:hover:not(:disabled) { filter: brightness(1.15); }
.jg__b:disabled { opacity: 0.4; cursor: default; }
.jg__n { grid-area: 1 / 2; } .jg__w { grid-area: 2 / 1; } .jg__c { grid-area: 2 / 2; opacity: 0.45; cursor: default; }
.jg__e { grid-area: 2 / 3; } .jg__s { grid-area: 3 / 2; }
.jg__z { display: flex; flex: 0 0 150px; flex-direction: column; gap: 8px; }
.jg__zb { display: flex; flex: 1 1 0; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-width: 0; padding: 8px 6px; border-radius: 14px; background: var(--m3d-surface-2); color: var(--m3d-text); font-size: 12.5px; font-weight: 600; line-height: 1.15; cursor: pointer; }
.jg__zb .frame-icon { width: 22px; height: 22px; color: var(--m3d-text-muted); }
.jg__zb:hover:not(:disabled) { filter: brightness(1.15); }
.jg__zb:disabled { opacity: 0.4; cursor: default; }
.jg .jg__step.seg { gap: 6px; padding: 0; background: transparent; }
.jg .jg__step.seg button { height: 40px; border-radius: 12px; background: var(--m3d-surface-2); }
.jg .jg__step.seg button.on { background: var(--m3d-accent); color: var(--m3d-on-accent, #00201e); }
.jg__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 599px) {
  .jg__body { gap: 10px; min-height: 176px; }
  .jg__z { flex-basis: 96px; }
}
</style>
