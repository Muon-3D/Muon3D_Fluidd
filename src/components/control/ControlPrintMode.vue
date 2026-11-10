<template>
  <control-card
    :title="modes ? 'Print mode' : 'Speed and flow'"
    icon="pulse"
    :locked="controlLock"
    data-tid="control-printmode"
  >
    <div
      v-if="modes"
      class="pmode__cards"
      role="radiogroup"
      aria-label="Print mode"
    >
      <button
        v-for="card in modes.cards"
        :key="card.id"
        type="button"
        role="radio"
        class="pmode__card"
        :class="{ 'pmode__card--on': card.id === modes.current }"
        :aria-checked="card.id === modes.current ? 'true' : 'false'"
        :disabled="!controlReady"
        :data-tid="`mode-${card.id}`"
        @click="setMode(card.id)"
      >
        <frame-icon
          :name="card.icon"
          small
        />
        <b>{{ card.label }}</b>
        <span v-if="card.blurb">{{ card.blurb }}</span>
      </button>
    </div>

    <button
      type="button"
      class="pmode__disc"
      :class="{ 'pmode__disc--bare': !modes }"
      :aria-expanded="advanced ? 'true' : 'false'"
      aria-controls="pmode-advanced"
      data-tid="advanced-toggle"
      @click="advanced = !advanced"
    >
      <span class="pmode__disc-text">
        <b>Speed, flow and fans</b>
        <span data-tid="advanced-summary">{{ summary }}</span>
      </span>
      <frame-icon
        :name="advanced ? 'chevronUp' : 'chevronDown'"
        small
      />
    </button>

    <div
      v-show="advanced"
      id="pmode-advanced"
      class="pmode__adv"
      data-tid="advanced"
    >
      <div class="pmode__row">
        <b>Speed</b>
        <span>{{ speedFactor }}%</span>
        <button
          v-if="speedFactor !== 100 || flowFactor !== 100 || paChanged"
          type="button"
          class="pmode__reset"
          :disabled="!controlReady"
          data-tid="advanced-reset"
          @click="backToNormal"
        >
          Back to normal
        </button>
      </div>
      <range-slider
        :key="`speed-${panelTarget}`"
        :value="speedFactor"
        :min="50"
        :max="200"
        :step="5"
        label="Speed"
        :value-text-formatter="percentText"
        :disabled="!controlReady"
        data-tid="advanced-speed"
        @change="setSpeed"
      />
      <div class="pmode__row">
        <b>Flow</b>
        <span>{{ flowFactor }}%</span>
      </div>
      <range-slider
        :key="`flow-${panelTarget}`"
        :value="flowFactor"
        :min="75"
        :max="125"
        :step="1"
        label="Flow"
        :value-text-formatter="percentText"
        :disabled="!controlReady"
        data-tid="advanced-flow"
        @change="setFlow"
      />
      <template v-if="partFan">
        <div class="pmode__row">
          <b>Part fan</b>
          <span data-tid="advanced-fan-value">{{ fanValue(partFan) ? `${fanValue(partFan)}%` : 'off' }}</span>
        </div>
        <range-slider
          :key="`fan-${panelTarget}`"
          :value="fanValue(partFan)"
          :min="0"
          :max="100"
          :step="5"
          label="Part fan"
          :value-text-formatter="percentText"
          :disabled="!controlReady"
          data-tid="advanced-fan"
          @change="setFan(partFan, $event)"
        />
        <p
          v-if="busy"
          class="pmode__fan-note"
        >
          The print's next fan command sets it again.
        </p>
      </template>
      <div
        v-if="pressureAdvance !== null"
        class="pmode__pa"
      >
        <span class="pmode__pa-text">
          <b>Pressure advance</b>
          <span>{{ paNote }}</span>
        </span>
        <button
          type="button"
          class="cbtn"
          aria-label="Less pressure advance"
          :disabled="!controlReady || pressureAdvance <= paRange.min"
          data-tid="pa-less"
          @click="nudgePa(-1)"
        >
          −
        </button>
        <number-field
          :key="`pa-${panelTarget}`"
          :value="pressureAdvance"
          :decimals="3"
          :min="paRange.min"
          :max="paRange.max"
          label="Pressure advance"
          :disabled="!controlReady"
          @change="setPa"
        />
        <button
          type="button"
          class="cbtn"
          aria-label="More pressure advance"
          :disabled="!controlReady || pressureAdvance >= paRange.max"
          data-tid="pa-more"
          @click="nudgePa(1)"
        >
          +
        </button>
      </div>

      <control-task-fold
        fold-key="printmode.limits"
        title="Motion limits"
        summary="Velocity, acceleration and corners"
      >
        <tuning-value
          v-for="limit in limits"
          :key="limit.key"
          :context="panelTarget"
          :label="limit.label"
          :value="limit.value"
          :unit="limit.unit"
          :min="['VELOCITY', 'ACCEL'].includes(limit.key) ? 0.001 : 0"
          :max="limit.max ?? 0"
          :decimals="limit.decimals"
          :disabled="!controlReady || limit.max === null"
          :reason="limit.max === null ? limitReason : ''"
          @change="setLimit(limit.key, $event)"
        />
        <h3
          v-if="retractionRows.length"
          class="pmode__retract"
        >
          Firmware retraction · G10 and G11
        </h3>
        <tuning-value
          v-for="row in retractionRows"
          :key="row.key"
          :context="panelTarget"
          :label="row.label"
          :value="row.value"
          :unit="row.unit"
          :min="row.key.endsWith('speed') ? 0.1 : 0"
          :max="row.max"
          :decimals="row.decimals"
          :disabled="!controlReady"
          @change="setRetraction(row.key, $event)"
        />
        <p class="pmode__lifetime">
          These values last until Klipper restarts. To keep them, save them in Files › printer.cfg.
        </p>
      </control-task-fold>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import ControlSpeed from './ControlSpeed.vue'
import RangeSlider from './RangeSlider.vue'
import { pressureAdvanceRange, printModeCommand, readPrintModes, type PrintModes } from '@/services/control/print-mode'

/**
 * Print mode: Quiet, Normal and Turbo cards (SET_PRINT_MODE, read back from
 * printer.fan_modes.mode), hidden on a printer without fan_modes. Below them
 * "Speed, flow and fans", collapsed, so the three are adjusted together
 * (KAN-1976): speed %, flow %, the part fan %, and pressure advance as a fine
 * adjustment around the profile's value, with the motion limits and firmware
 * retraction that Speed and flow had, folded. All of it stays live while a
 * print runs: changing speed mid-print is its main use.
 *
 * Built on ControlSpeed (still used by the Overview's Speed tile) for the
 * limits and retraction rows.
 */
@Component({ components: { RangeSlider } })
export default class ControlPrintMode extends ControlSpeed {
  advanced = false

  get modes (): PrintModes | null {
    const commands = this.$store.getters['printer/getAvailableCommands'] as Record<string, unknown> | undefined
    return readPrintModes(this.$store.state.printer.printer.fan_modes, commands)
  }

  setMode (mode: string) {
    const command = printModeCommand(mode, this.modes)
    if (!this.controlReady || !command || mode === this.modes?.current) return
    this.sendGcode(command)
  }

  /** The profile's pressure advance: the configured value. */
  get paBase (): number | null {
    const v = Number(this.$store.state.printer.printer.configfile?.settings?.extruder?.pressure_advance)
    return Number.isFinite(v) ? v : null
  }

  percentText (v: number): string {
    return `${v}%`
  }

  get paRange () {
    return pressureAdvanceRange(this.paBase)
  }

  get paChanged (): boolean {
    return this.pressureAdvance !== null && this.paBase !== null && Math.abs(this.pressureAdvance - this.paBase) > 1e-6
  }

  get paNote (): string {
    const base = this.paBase === null ? '' : `The profile has ${this.paBase.toFixed(3)}. `
    return `${base}Changes last until a restart.`
  }

  get summary (): string {
    const pa = this.pressureAdvance === null ? '' : ` · Pressure advance ${this.pressureAdvance.toFixed(3)}`
    const fan = this.partFan ? ` · Fan ${this.fanValue(this.partFan)}%` : ''
    return `Speed ${this.speedFactor}% · Flow ${this.flowFactor}%${fan}${pa}`
  }

  /** Kept inside the fine-adjustment range: an overshoot goes to the bound, not nowhere. */
  setPa (value: number) {
    if (!Number.isFinite(value)) return
    const { min, max } = this.paRange
    const v = Math.round(Math.min(max, Math.max(min, value)) * 1000) / 1000
    this.setPressureAdvance(v)
  }

  nudgePa (by: number) {
    if (this.pressureAdvance === null) return
    this.setPa(this.pressureAdvance + by * this.paRange.step)
  }

  backToNormal () {
    if (!this.controlReady) return
    if (this.speedFactor !== 100) this.setSpeed(100)
    if (this.flowFactor !== 100) this.setFlow(100)
    if (this.paChanged && this.paBase !== null) this.setPressureAdvance(this.paBase)
  }
}
</script>

<style lang="scss" scoped>
  .pmode__cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  .pmode__card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 12px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    text-align: left;

    .frame-icon { color: var(--m3d-text-muted); }

    b {
      margin-top: 6px;
      font-size: 15px;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }

    &:disabled { opacity: 0.5; cursor: default; }
  }

  .pmode__card--on {
    background: color-mix(in srgb, var(--m3d-accent) 16%, var(--m3d-surface-2));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--m3d-accent) 45%, transparent);

    .frame-icon { color: var(--m3d-accent); }
  }

  .pmode__disc {
    display: flex;
    align-items: center;
    gap: 10px;
    width: calc(100% + 36px);
    margin: 14px -18px -4px;
    padding: 14px 18px 4px;
    border-top: 1px solid var(--m3d-border);
    color: var(--m3d-text);
    text-align: left;
  }

  .pmode__disc--bare {
    margin-top: 0;
    padding-top: 0;
    border-top: 0;
  }

  .pmode__fan-note { margin: 0; color: var(--m3d-text-subtle); font-size: 12px; }

  .pmode__disc-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .pmode__adv {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 12px;
  }

  .pmode__row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-top: 6px;

    b { font-size: 15px; }
    span { color: var(--m3d-text-muted); font-size: 13px; }
  }

  .pmode__reset {
    margin-left: auto;
    color: var(--m3d-accent);
    font-size: 13px;
  }

  .pmode__pa {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--m3d-border);
  }

  .pmode__pa-text {
    display: flex;
    flex: 1 1 160px;
    flex-direction: column;

    span { color: var(--m3d-text-muted); font-size: 13px; }
  }

  .pmode__retract {
    margin: 12px 0 4px;
    font-size: 13px;
    font-weight: 600;
  }

  .pmode__lifetime {
    margin: 8px 0 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }
</style>
