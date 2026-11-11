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
          class="jg__b"
          aria-label="Plate up"
          data-jog="z+"
          :disabled="!canMoveZ"
          @click="moveBy('Z', step)"
        >
          <frame-icon name="chevronUp" />
        </button>
        <span class="jg__zl">Z</span>
        <button
          type="button"
          class="jg__b"
          aria-label="Plate down"
          data-jog="z-"
          :disabled="!canMoveZ"
          @click="moveBy('Z', -step)"
        >
          <frame-icon name="chevronDown" />
        </button>
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
    </div>
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
/* KAN-2078: the pad, the Z keys and the step side by side, so the tile is as tall as the pad and nothing is left blank under it. */
.jg { gap: 10px; }
.jg > .ot__door { flex: 1 1 auto; }
.jg__body { display: grid; flex: 1 1 auto; grid-template-columns: minmax(0, 1fr) 64px 64px; gap: 14px; min-height: 232px; }
.jg--M .jg__body, .jg--L .jg__body { grid-template-columns: minmax(0, 1fr) 64px 64px; }
.jg--S .jg__body { grid-template-columns: minmax(0, 1fr); min-height: 0; }
.jg__pad { display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); gap: 8px; width: 100%; max-width: 288px; justify-self: center; }
.jg--S .jg__pad { grid-template-rows: repeat(3, 52px); max-width: 180px; }
.jg__b { display: inline-flex; align-items: center; justify-content: center; min-width: 0; border-radius: 16px; background: var(--m3d-surface-2); cursor: pointer; }
.jg__b .frame-icon { color: var(--m3d-text); }
.jg__b:hover:not(:disabled) { filter: brightness(1.15); }
.jg__b:disabled { opacity: 0.4; cursor: default; }
.jg__n { grid-area: 1 / 2; } .jg__w { grid-area: 2 / 1; } .jg__c { grid-area: 2 / 2; background: var(--m3d-surface-2); opacity: 0.45; cursor: default; }
.jg__e { grid-area: 2 / 3; } .jg__s { grid-area: 3 / 2; }
.jg__z { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
.jg__z .jg__b { flex: 1 1 0; }
.jg__zl { color: var(--m3d-text-muted); font-family: var(--m3d-font-mono); font-size: 12px; font-weight: 600; text-align: center; }
.jg .jg__step.seg { flex-direction: column; align-self: stretch; gap: 6px; padding: 0; background: transparent; }
.jg .jg__step.seg button { flex: 1 1 0; height: auto; min-width: 0; padding: 0; border-radius: 12px; background: var(--m3d-surface-2); }
.jg .jg__step.seg button.on { background: var(--m3d-accent); color: var(--m3d-on-accent, #00201e); }
.jg__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (max-width: 599px) {
  .jg__body { grid-template-columns: minmax(0, 1fr) 52px 52px; gap: 10px; min-height: 216px; }
  .jg--M .jg__body, .jg--L .jg__body { grid-template-columns: minmax(0, 1fr) 52px 52px; }
  .jg--S .jg__body { grid-template-columns: minmax(0, 1fr); min-height: 0; }
}
</style>
