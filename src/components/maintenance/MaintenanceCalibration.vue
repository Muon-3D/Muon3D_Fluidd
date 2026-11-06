<template>
  <maintenance-tile
    title="Calibration"
    icon="firstLayer"
    flush
    data-tid="maintenance-calibration"
  >
    <template #aside>
      <maintenance-due />
    </template>

    <div
      v-if="saveConfigPending"
      class="mcal__save"
    >
      <span>New results are kept until the printer restarts. Save them to keep them for good.</span>
      <button
        type="button"
        class="cbtn cbtn--primary"
        :disabled="!!saveBlocked"
        :title="saveBlocked || undefined"
        @click="saveResults"
      >
        Save
      </button>
    </div>

    <ul
      v-if="rows.length"
      class="mcal__list"
    >
      <li
        v-for="row in rows"
        :key="row.id"
        class="mcal__item"
        :data-tid="`cal-${row.id}`"
      >
        <div class="mcal__row">
          <span class="mcal__text">
            <span class="mcal__title">{{ row.title }}</span>
            <span class="mcal__sub">{{ row.sub }}</span>
          </span>
          <tone-pill
            v-if="row.due"
            tone="warn"
            :dot="false"
          >
            Due
          </tone-pill>
          <button
            v-if="row.details"
            type="button"
            class="mcal__more"
            :aria-expanded="isOpen(row.id) ? 'true' : 'false'"
            :aria-label="`${isOpen(row.id) ? 'Hide' : 'Show'} the values for ${row.title}`"
            :data-tid="`cal-more-${row.id}`"
            @click="toggle(row.id)"
          >
            <frame-icon :name="isOpen(row.id) ? 'chevronUp' : 'chevronDown'" />
          </button>
          <button
            type="button"
            class="cbtn mcal__run"
            :disabled="row.disabled"
            :title="row.disabled ? blockedReason : undefined"
            :aria-label="`${row.action} ${row.title}`"
            :data-tid="`cal-run-${row.id}`"
            @click="row.run()"
          >
            {{ row.busy ? 'Running…' : row.action }}
          </button>
        </div>
        <div
          v-if="row.details && isOpen(row.id)"
          class="mcal__details"
        >
          <p class="mcal__desc">
            {{ row.description }}
          </p>
          <maintenance-result
            v-if="row.details === 'result'"
            :check="row.id"
          />
          <control-tuning
            v-else
            shaper-only
          />
        </div>
      </li>
    </ul>
    <div
      v-else
      class="mcal__empty"
    >
      <span class="mcal__ico"><frame-icon name="firstLayer" /></span>
      <b>No calibration to run from here</b>
      <p>This printer has no probe, mesh or tuning commands yet.</p>
    </div>

    <p
      v-if="rows.length && blockedReason && !runningId"
      class="mcal__blocked"
    >
      <frame-icon
        name="lock"
        small
      />
      {{ blockedReason }}
    </p>

    <manual-probe-recovery
      v-model="manualProbeDialogOpen"
    />
  </maintenance-tile>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import ProbeAccuracyMixin from '@/mixins/probe-accuracy'
import MaintenanceTile from './MaintenanceTile.vue'
import MaintenanceDue from './MaintenanceDue.vue'
import MaintenanceResult from './MaintenanceResult.vue'
import TonePill from '@/components/printers/TonePill.vue'
import ControlTuning from '@/components/control/ControlTuning.vue'
import type { CheckId } from '@/services/maintenance/model'

interface CalibrationRow {
  id: CheckId | 'probeAccuracy';
  title: string;
  sub: string;
  description: string;
  action: string;
  due: boolean;
  busy: boolean;
  disabled: boolean;
  /** Values to open under the row: a result Klipper reported, or the input shaper. */
  details: 'result' | 'shaper' | null;
  run: () => void;
}

/** What each check is called here, in the order Calibration lists them (Probe accuracy goes first). */
const TITLES: Record<CheckId, string> = {
  bedMesh: 'Bed mesh calibrate',
  shaper: 'Resonance test',
  firstLayer: 'First layer height',
  pid: 'Heater tuning'
}
const ORDER: CheckId[] = ['bedMesh', 'shaper', 'firstLayer', 'pid']

/**
 * Calibration: the tests that move the head or heat the nozzle, each a row
 * with a Run button. Every Run asks first (what it will do, the plate check),
 * and is off while the printer is busy or printing: the checks and probe
 * accuracy keep the confirmation, homed and no-go paths they always had.
 */
@Component({ components: { MaintenanceTile, MaintenanceDue, MaintenanceResult, TonePill, ControlTuning } })
export default class MaintenanceCalibration extends Mixins(ProbeAccuracyMixin, BrowserMixin) {
  manualProbeDialogOpen = false
  opened: Record<string, boolean> = {}

  get hasProbe (): boolean { return !!this.$store.getters['printer/getProbe'] }

  @Watch('isManualProbeActive')
  onManualProbe (active: boolean) {
    if (active && this.klippyReady && !this.printerPrinting && !this.printerPaused) this.manualProbeDialogOpen = true
  }

  @Watch('evidence', { immediate: true })
  onEvidence () {
    this.recordIfDone()
  }

  isOpen (id: string): boolean { return !!this.opened[id] }
  toggle (id: string) { this.$set(this.opened, id, !this.opened[id]) }

  /** Why no Run works now: the checks' reason, and for the probe test its own (a test already under way). */
  get blockedReason (): string { return this.checksBlocked }

  get rows (): CalibrationRow[] {
    const rows: CalibrationRow[] = []
    if (this.hasProbe && 'PROBE_ACCURACY' in this.gcodeCommands) {
      const accuracy = this.accuracy
      rows.push({
        id: 'probeAccuracy',
        title: 'Probe accuracy',
        sub: accuracy ? `Spread ${Math.round(accuracy.stddev * 1000)} µm ${this.accuracyWhen}`.trim() : 'Ten probes in the middle of the bed',
        description: '',
        action: 'Run',
        due: false,
        busy: this.checking,
        disabled: !this.canCheck,
        details: null,
        run: () => { this.checkAccuracy() }
      })
    }
    for (const id of ORDER) {
      const check = this.checks.find(c => c.id === id)
      if (!check) continue
      rows.push({
        id,
        title: TITLES[id],
        sub: this.runningId === id ? 'Running…' : check.status.text,
        description: check.description,
        action: check.action,
        due: check.status.due,
        busy: this.runningId === id,
        disabled: !!this.checksBlocked || !check.gcode,
        details: id === 'shaper' ? 'shaper' : id === 'bedMesh' ? null : 'result',
        run: () => { this.runCheck(check) }
      })
    }
    return rows
  }
}
</script>

<style lang="scss" scoped>
  .mcal__save {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 12px;
    margin: 0 18px;
    padding: 12px;
    border-radius: 12px;
    background: var(--m3d-accent-soft);
    font-size: 13px;

    span {
      flex: 1 1 180px;
    }
  }

  .mcal__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mcal__item + .mcal__item {
    border-top: 1px solid var(--m3d-border);
  }

  .mcal__row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 10px 18px;
  }

  .mcal__text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-width: 0;
  }

  .mcal__title {
    font-size: 14px;
    font-weight: 600;
  }

  .mcal__sub {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .mcal__more {
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: var(--m3d-text-muted);
  }

  .mcal__run {
    flex: none;
    min-width: 64px;
    justify-content: center;
  }

  .mcal__details {
    padding: 0 18px 12px;
  }

  .mcal__desc {
    margin: 0 0 8px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .mcal__blocked {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 4px 18px 8px;
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }

  .mcal__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 28px 18px;
    text-align: center;

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .mcal__ico {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }
</style>
