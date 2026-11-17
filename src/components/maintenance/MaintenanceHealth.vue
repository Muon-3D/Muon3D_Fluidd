<template>
  <maintenance-tile
    title="Checks"
    icon="shield"
    flush
    data-tid="maintenance-checks"
  >
    <template #aside>
      <tone-pill
        v-if="rows.length"
        :tone="attention ? 'warn' : 'ok'"
      >
        {{ attention ? `${attention} needs attention` : 'All clear' }}
      </tone-pill>
    </template>

    <ul
      v-if="rows.length"
      class="mhealth__list"
    >
      <li
        v-for="row in rows"
        :key="row.id"
        class="mhealth__row"
        :data-tid="`health-${row.id}`"
      >
        <span class="mhealth__ico"><frame-icon :name="row.icon" /></span>
        <span class="mhealth__text">
          <span class="mhealth__title">{{ row.title }}</span>
          <span class="mhealth__sub">{{ row.sub }}</span>
        </span>
        <tone-pill
          :tone="row.tone"
          :dot="false"
        >
          {{ row.pill }}
        </tone-pill>
      </li>
    </ul>
    <div
      v-else
      class="mhealth__empty"
    >
      <span class="mhealth__ico"><frame-icon name="shield" /></span>
      <b>Nothing to check yet</b>
      <p>Checks appear here as soon as the printer connects.</p>
    </div>
  </maintenance-tile>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import MaintenanceTile from './MaintenanceTile.vue'
import TonePill from '@/components/printers/TonePill.vue'
import { checkStatus, daysAgo } from '@/services/maintenance/model'
import { attentionCount, healthRows, type HealthRow } from '@/services/maintenance/health'
import { maintenancePage } from '@/services/maintenance/page-state'
import { meshFigures } from '@/services/maintenance/heatmap'
import type { Heater, MCU } from '@/store/printer/types'

/**
 * Checks: what the printer can say about itself without moving or running a
 * test. Klipper, its boards, the heater readings, the bed mesh and storage,
 * each as a row with a verdict. The tests that move the head
 * live in Calibration.
 */
@Component({ components: { MaintenanceTile, TonePill } })
export default class MaintenanceHealth extends Mixins(MaintenanceMixin) {
  get supportsBedMesh (): boolean {
    return this.$store.getters['mesh/getSupportsBedMesh'] as boolean
  }

  get rows (): HealthRow[] {
    const printer = this.$store.state.printer.printer
    const disk = this.$store.getters['files/getUsage'] as { used: number, total: number, free: number } | undefined
    const mcus = (this.$store.getters['printer/getMcus'] as MCU[] | undefined) ?? []
    const heaters = (this.$store.getters['printer/getHeaters'] as Heater[] | undefined) ?? []
    const meshAt = this.lastRun.bedMesh
    const figures = meshFigures(this.mesh)
    return healthRows({
      socketConnected: !!this.$store.getters['socket/getConnectionState'],
      klippyState: this.$store.getters['printer/getKlippyState'] as string,
      klippyReady: !!this.klippyReady,
      version: printer.info?.software_version,
      mcus: mcus.map(m => ({ name: m.name, awake: Number(m.last_stats?.mcu_awake) })),
      heaters: heaters.map(h => ({ name: h.name, temperature: h.temperature, maxTemp: h.maxTemp })),
      bedMesh: this.supportsBedMesh
        ? { loaded: this.meshMeasured, status: checkStatus('bedMesh', meshAt, Date.now()), spread: figures?.spread ?? null, measured: meshAt ? daysAgo(meshAt, Date.now()) : '' }
        : null,
      disk: disk ?? null
    })
  }

  get attention (): number {
    return attentionCount(this.rows)
  }

  /** The header says how the printer stands, from these rows. */
  @Watch('rows', { immediate: true })
  share (rows: HealthRow[]) {
    maintenancePage.rows = rows
    const runs = Object.values(this.lastRun).filter((t): t is number => typeof t === 'number')
    maintenancePage.lastRun = runs.length ? Math.max(...runs) : null
  }

  beforeDestroy () {
    maintenancePage.rows = []
    maintenancePage.lastRun = null
  }
}
</script>

<style lang="scss" scoped>
  .mhealth__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mhealth__row {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 52px;
    padding: 10px 18px;

    + .mhealth__row {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .mhealth__ico {
    display: grid;
    flex: none;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .mhealth__text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-width: 0;
  }

  .mhealth__title {
    font-size: 14px;
    font-weight: 600;
  }

  .mhealth__sub {
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .mhealth__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 18px;
    text-align: center;

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }
</style>
