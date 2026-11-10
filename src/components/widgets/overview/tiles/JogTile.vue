<template>
  <tile-shell
    tile="jog"
    title="Jog"
    icon="control"
    :menu="menu"
    class="jg"
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
        <button
          type="button"
          class="jg__b jg__c"
          aria-label="Home all"
          data-jog="home"
          :disabled="!controlReady || busy"
          @click="home()"
        >
          <frame-icon name="home" />
        </button>
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
      <div class="jg__z">
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
    </div>
    <p
      v-if="lock"
      class="ot__lock"
    >
      {{ lock }}
    </p>
    <seg-picker
      class="jg__step"
      :options="steps"
      :value="step"
      label="Step"
      accent
      fill
      :disabled="!controlReady"
      @input="step = $event"
    />
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
 * The jog pad: the head over the plate with arrows, Z beside it, home in the
 * middle. It is Control move, from the one ControlMixin, so it refuses to
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

  get lock (): string {
    if (!this.controlReady) return this.controlLock
    if (this.busy) return 'Not while printing.'
    if (!this.isHomed('XY')) return 'Home all to move the head.'
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
.jg { gap: 10px; }
.jg__body { display: flex; align-items: center; justify-content: center; gap: 18px; padding: 6px 0 2px; }
.jg__pad { display: grid; grid-template-columns: repeat(3, 52px); grid-template-rows: repeat(3, 52px); gap: 6px; }
.jg__b { display: inline-flex; align-items: center; justify-content: center; width: 52px; height: 52px; border-radius: 16px; background: var(--m3d-surface-2); cursor: pointer; }
.jg__b .frame-icon { color: var(--m3d-text); }
.jg__b:hover:not(:disabled) { filter: brightness(1.15); }
.jg__b:disabled { opacity: 0.4; cursor: default; }
.jg__n { grid-area: 1 / 2; } .jg__w { grid-area: 2 / 1; } .jg__c { grid-area: 2 / 2; background: var(--m3d-accent-soft); }
.jg__c .frame-icon { color: var(--m3d-accent); }
.jg__e { grid-area: 2 / 3; } .jg__s { grid-area: 3 / 2; }
.jg__z { display: flex; flex-direction: column; align-items: center; justify-content: space-between; gap: 6px; height: 166px; }
.jg__zl { color: var(--m3d-text-muted); font-family: var(--m3d-font-mono); font-size: 12px; font-weight: 600; }
.jg__step { margin-top: auto; }
@media (max-width: 599px) {
  .jg__pad { grid-template-columns: repeat(3, 56px); grid-template-rows: repeat(3, 56px); }
  .jg__b { width: 56px; height: 56px; }
  .jg__z { height: 180px; }
}
</style>
