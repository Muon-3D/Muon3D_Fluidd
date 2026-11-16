<template>
  <control-card
    title="Z offset"
    icon="firstLayer"
    :locked="lockReason"
    data-tid="control-zoffset"
  >
    <div class="zoff__value">
      <b data-tid="zoffset-value">{{ valueText }}</b><small>mm</small>
    </div>
    <p class="zoff__sub">
      {{ sub }}
    </p>
    <div class="zoff__nudges">
      <button
        v-for="n in nudges"
        :key="n"
        type="button"
        class="cbtn"
        :aria-label="n < 0 ? `Nozzle ${Math.abs(n)} mm closer` : `Nozzle ${n} mm further`"
        :data-tid="`zoffset-${n}`"
        :disabled="!canStep || !!refusal(n)"
        @click="nudge(n)"
      >
        {{ signed(n, 2) }}
      </button>
    </div>
    <p
      v-if="canStep && lowerRefusal"
      class="zoff__refusal"
      data-tid="zoffset-refusal"
    >
      {{ lowerRefusal }}
    </p>
    <button
      v-if="saveCommand"
      type="button"
      class="cbtn zoff__save"
      :disabled="!canSave"
      data-tid="zoffset-save"
      @click="save"
    >
      Save to config
    </button>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import { signed } from '@/services/overview/tiles'
import { meshSpan, zNudgeRefusal } from '@/services/control/safe-move'
import ControlCard from './ControlCard.vue'

/**
 * The live Z offset, with nudges to babystep the nozzle (the same
 * SET_GCODE_OFFSET every Z adjust sends; minus is closer to the plate), and
 * Save to config where the printer can apply it to its probe or endstop.
 */
@Component({ components: { ControlCard } })
export default class ControlZOffset extends Mixins(ControlMixin) {
  readonly nudges = [-0.05, -0.01, 0.01, 0.05]
  readonly signed = signed

  get origin (): number {
    const o = this.$store.state.printer.printer.gcode_move?.homing_origin as number[] | undefined
    return Array.isArray(o) && Number.isFinite(+o[2]) ? +o[2] : 0
  }

  get valueText (): string { return signed(this.origin) }

  get sub (): string {
    const info = this.$store.state.printer.printer.print_stats?.info as { current_layer?: number | null, total_layer?: number | null } | undefined
    if ((this.printerPrinting || this.printerPaused) && info?.current_layer && info?.total_layer) {
      return `Live adjust while printing · layer ${info.current_layer} of ${info.total_layer}`
    }
    if (this.printerPrinting || this.printerPaused) return 'Live adjust while printing'
    return 'Minus brings the nozzle closer. Not kept until you save it.'
  }

  get canStep (): boolean { return this.controlReady && this.isHomed('Z') }

  /**
   * A nudge moves the head (MOVE=1). While idle with no-go regions set, one
   * that would take the nozzle low over a region is refused. While a print
   * runs the head follows the print's own path, so live babysteps go.
   */
  refusal (by: number): string {
    if (this.printerPrinting || this.printerPaused) return ''
    const p = this.position
    return zNudgeRefusal({ x: Number(p[0]), y: Number(p[1]), z: Number(p[2]) }, by, this.noGo, meshSpan(this.$store.state.printer.printer.bed_mesh), this.isHomed('XY'))
  }

  get lowerRefusal (): string {
    return this.refusal(Math.min(...this.nudges))
  }

  nudge (by: number) {
    if (!this.canStep || this.refusal(by)) return
    this.adjustZ(by)
  }

  get lockReason (): string {
    if (!this.controlReady) return this.controlLock
    return this.isHomed('Z') ? '' : 'Home Z first.'
  }

  get saveCommand (): string | null {
    const commands = (this.$store.getters['printer/getAvailableCommands'] as Record<string, unknown>) ?? {}
    return ['Z_OFFSET_APPLY_PROBE', 'Z_OFFSET_APPLY_ENDSTOP'].find(c => c in commands) ?? null
  }

  get canSave (): boolean { return this.controlReady && !this.busy && !!this.origin }

  save () {
    const command = this.saveCommand
    if (command && this.canSave) this.sendGcode(command)
  }
}
</script>

<style lang="scss" scoped>
  .zoff__value {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;

    b { font-size: 30px; font-weight: 700; font-variant-numeric: tabular-nums; }
    small { color: var(--m3d-text-muted); font-size: 13px; }
  }

  .zoff__sub {
    margin: -8px 0 0;
    color: var(--m3d-text-muted);
    font-size: 12px;
    text-align: center;
  }

  .zoff__nudges {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .zoff__refusal {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .zoff__save {
    width: 100%;
  }
</style>
