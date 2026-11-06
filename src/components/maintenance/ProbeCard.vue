<template>
  <maintenance-tile
    title="Probe"
    icon="firstLayer"
    :locked="controlLock"
    data-tid="probe-card"
  >
    <div class="probe__row">
      <div class="probe__name">
        <div class="probe__title">
          {{ probeTitle }}
        </div>
        <div
          v-if="zOffset !== null"
          class="probe__sub"
        >
          z offset {{ signedMm(zOffset, 3) }} mm
        </div>
      </div>
      <span
        v-if="queried"
        class="probe__state"
        :class="{ 'probe__state--hit': triggered }"
      >{{ triggered ? 'Triggered: yes' : 'Triggered: no' }}</span>
      <span
        v-else
        class="probe__state probe__state--unknown"
      >Not asked yet</span>
    </div>

    <div
      v-if="accuracy"
      class="probe__result"
      data-tid="probe-accuracy"
    >
      <dl class="probe__stats">
        <div>
          <dt>Spread</dt>
          <dd>{{ micron(accuracy.stddev) }}</dd>
        </div>
        <div>
          <dt>Range</dt>
          <dd>{{ micron(accuracy.range) }}</dd>
        </div>
        <div>
          <dt>Average</dt>
          <dd>{{ accuracy.average.toFixed(4) }} mm</dd>
        </div>
      </dl>
      <p
        class="probe__verdict"
        :class="`probe__verdict--${verdict.tone}`"
      >
        {{ verdict.text }}
        <span class="probe__when">{{ accuracyWhen }}</span>
      </p>
    </div>
    <p
      v-else
      class="probe__note"
    >
      Accuracy test probes the middle of the bed ten times and shows how far apart the heights land.
    </p>

    <div class="probe__buttons">
      <button
        type="button"
        class="cbtn probe__button"
        :disabled="!controlReady || hasWait($waits.onQueryProbe)"
        title="Ask the probe whether it is triggered now"
        data-tid="probe-query"
        @click="query"
      >
        Query probe
      </button>
      <button
        type="button"
        class="cbtn probe__button"
        :disabled="!canCheck"
        :title="checksBlocked"
        data-tid="probe-accuracy-run"
        @click="checkAccuracy"
      >
        {{ checking ? 'Probing…' : 'Accuracy test' }}
      </button>
    </div>
  </maintenance-tile>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import ProbeAccuracyMixin from '@/mixins/probe-accuracy'
import type { ConsoleEntry } from '@/store/console/types'
import type { Probe } from '@/store/printer/types'
import { signedMm } from '@/services/maintenance/heatmap'
import MaintenanceTile from './MaintenanceTile.vue'

/**
 * The probe: its Z offset, whether it is triggered when asked (Query probe),
 * and probe accuracy (ten probes in the middle of the bed) with how
 * repeatable the heights are. Accuracy test goes to the middle of the bed
 * by the no-go-aware path in ProbeAccuracyMixin.
 */
@Component({ components: { MaintenanceTile } })
export default class ProbeCard extends Mixins(ProbeAccuracyMixin) {
  queryAfter = Infinity
  queryPrevious: ConsoleEntry[] = []

  @Watch('maintenanceTarget')
  clearQuery () { this.queryAfter = Infinity; this.queryPrevious = [] }

  get queryReport (): boolean | null {
    const entries = (this.$store.state.console.console as ConsoleEntry[] | undefined) ?? []
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i]
      if (entry.type !== 'response' || (entry.time ?? 0) < this.queryAfter || this.queryPrevious.includes(entry)) continue
      const match = /\bprobe: (open|TRIGGERED)\b/i.exec(entry.message)
      if (match) return match[1].toLowerCase() === 'triggered'
    }
    return null
  }

  get queried (): boolean { return this.queryReport !== null }

  get probe (): Probe | undefined {
    return this.$store.getters['printer/getProbe'] as Probe | undefined
  }

  /** "Probe", or the probe's own name: "Load cell probe", "Bltouch". */
  get probeTitle (): string {
    const name = (this.probe?.name ?? 'probe').replace(/_/g, ' ')
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  get zOffset (): number | null {
    const settings = this.probe?.name ? this.$store.getters['printer/getPrinterSettings'](this.probe.name) : undefined
    const value = Number(settings?.z_offset)
    return settings && Number.isFinite(value) ? value : null
  }

  get triggered (): boolean {
    return this.queryReport === true
  }

  signedMm (value: number, places: number): string {
    return signedMm(value, places)
  }

  query () {
    if (!this.probe || !this.controlReady || this.hasWait(this.$waits.onQueryProbe)) return
    this.queryPrevious = [...(this.$store.state.console.console ?? [])]
    this.queryAfter = Math.floor(Date.now() / 1000)
    this.sendGcode('QUERY_PROBE', this.$waits.onQueryProbe)
  }
}
</script>

<style lang="scss" scoped>
  .probe__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }

  .probe__title {
    font-size: 14px;
    font-weight: 600;
  }

  .probe__sub {
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .probe__state {
    flex: none;
    padding: 2px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--m3d-success) 16%, transparent);
    color: var(--m3d-success);
    font-size: 12px;
    font-weight: 600;
  }

  .probe__state--unknown {
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .probe__state--hit {
    background: color-mix(in srgb, var(--m3d-warning) 16%, transparent);
    color: var(--m3d-warning, #ff9f0a);
  }

  .probe__result {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .probe__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 0;

    div {
      padding: 8px 12px;
      border-radius: 12px;
      background: var(--m3d-surface-2);
    }

    dt {
      color: var(--m3d-text-subtle);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    dd {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .probe__verdict {
    margin: 0;
    font-size: 13px;
  }

  .probe__verdict--ok {
    color: var(--m3d-success, #30d158);
  }

  .probe__verdict--warn {
    color: var(--m3d-warning, #ff9f0a);
  }

  .probe__when {
    color: var(--m3d-text-subtle);
  }

  .probe__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .probe__buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .probe__button {
    flex: 1 1 0;
    justify-content: center;
  }
</style>
