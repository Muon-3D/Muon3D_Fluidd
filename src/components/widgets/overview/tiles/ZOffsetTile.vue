<template>
  <tile-shell
    tile="zoffset"
    title="Z offset"
    icon="firstLayer"
    :menu="menu"
    :open="open"
    class="zo"
    @toggle="open = !open"
  >
    <span
      class="ot__value"
      data-tid="zoffset-value"
    >{{ valueText }}<small>mm</small></span>
    <span class="ot__sub">{{ sub }}</span>

    <template #after>
      <span class="zo__step">
        <button
          type="button"
          class="zo__round"
          aria-label="Lower the nozzle"
          data-tid="zoffset-down"
          :disabled="!canStep || !!refusal(-step)"
          :title="refusal(-step) || undefined"
          @click="nudge(-step)"
        >
          <frame-icon
            name="minus"
            small
          />
        </button>
        <button
          type="button"
          class="zo__round"
          aria-label="Raise the nozzle"
          data-tid="zoffset-up"
          :disabled="!canStep"
          @click="nudge(step)"
        >
          <frame-icon
            name="plus"
            small
          />
        </button>
      </span>
    </template>

    <template #popover>
      <div class="zo__pop">
        <p class="ot__note">
          Moves the nozzle a little closer to or further from the plate, now. Minus is closer.
        </p>
        <seg-picker
          :options="stepOptions"
          :value="step"
          label="Step size"
          accent
          fill
          @input="step = $event"
        />
        <p
          v-if="!canStep"
          class="ot__lock"
        >
          {{ controlReady ? 'Home Z first.' : controlLock }}
        </p>
      </div>
    </template>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { signed, type TileMenuItem } from '@/services/overview/tiles'
import TileShell from './TileShell.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import { meshSpan, zNudgeRefusal } from '@/services/control/safe-move'

/**
 * The live Z offset, with minus and plus to babystep the nozzle (Control
 * sends the same G-code as every other Z adjust). The step size is in the
 * popover; saving it to the printer config and probe calibration are behind
 * the three dots, and only for printers that can.
 */
@Component({ components: { TileShell, SegPicker } })
export default class ZOffsetTile extends Mixins(OverviewMixin) {
  open = false
  step = 0.005
  readonly stepOptions: SegOption[] = [0.005, 0.01, 0.025, 0.05].map(v => ({ value: v, label: String(v) }))

  get origin (): number | null {
    const o = this.gcodeMove.homing_origin as number[] | undefined
    return Array.isArray(o) && Number.isFinite(+o[2]) ? +o[2] : null
  }

  get valueText (): string { return signed(this.origin ?? 0) }
  get sub (): string { return `Not saved until you save it · steps of ${this.step}` }
  get canStep (): boolean { return this.controlReady && this.isHomed('Z') }

  /**
   * The same notch rule as Control's Z offset card (ControlZOffset): a nudge moves the head (MOVE=1), so while idle
   * one that would take the nozzle low over the notch, or lower it with X/Y unhomed, is refused. Live babysteps
   * during a print follow the print's own path and go.
   */
  refusal (by: number): string {
    if (this.printerPrinting || this.printerPaused) return ''
    const p = this.position
    return zNudgeRefusal({ x: Number(p[0]), y: Number(p[1]), z: Number(p[2]) }, by, this.noGo, meshSpan(this.$store.state.printer.printer.bed_mesh), this.isHomed('XY'))
  }

  nudge (by: number) {
    if (!this.canStep || this.refusal(by)) return
    this.adjustZ(by)
  }

  get commands (): Record<string, unknown> {
    return (this.$store.getters['printer/getAvailableCommands'] as Record<string, unknown>) ?? {}
  }

  get saveCommand (): string | null {
    return ['Z_OFFSET_APPLY_PROBE', 'Z_OFFSET_APPLY_ENDSTOP'].find(c => c in this.commands) ?? null
  }

  get calibrateCommand (): boolean { return 'PROBE_CALIBRATE' in this.commands || 'Z_ENDSTOP_CALIBRATE' in this.commands }

  get menu (): TileMenuItem[] {
    const items: TileMenuItem[] = []
    const save = this.saveCommand
    if (save) items.push({ id: 'save', label: 'Save to config', disabled: !this.controlReady || this.busy || !this.origin, action: () => { if (this.controlReady && !this.busy) this.sendGcode(save) } })
    if (this.calibrateCommand) items.push({ id: 'calibrate', label: 'Run probe calibration…', to: this.pagePath('/maintenance') })
    return items
  }
}
</script>

<style lang="scss">
.zo__step { position: absolute; top: 46px; right: 18px; display: inline-flex; gap: 8px; }
.zo__round { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--m3d-surface-2); cursor: pointer; }
.zo__round .frame-icon { color: var(--m3d-text); }
.zo__round:disabled { opacity: 0.4; cursor: default; }
.zo__pop { display: flex; flex-direction: column; gap: 12px; }
</style>
