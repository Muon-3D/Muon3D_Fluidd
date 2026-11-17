<template>
  <maintenance-tile
    title="Consumables"
    icon="nozzle"
    data-tid="maintenance-consumables"
  >
    <div
      v-for="row in rows"
      :key="row.id"
      class="mcons__item"
      :data-tid="`consumable-${row.id}`"
    >
      <div class="mcons__label">
        <b>
          <i
            v-if="row.colour"
            class="mcons__dot"
            :style="{ background: row.colour }"
          />
          {{ row.title }}
        </b>
        <span>{{ row.value }}</span>
      </div>
      <div
        v-if="row.usage"
        class="mcons__bar"
        role="progressbar"
        :aria-label="row.title"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="row.usage.percent"
      >
        <i
          :class="{ 'mcons__fill--warn': row.usage.tone === 'warn' }"
          :style="{ width: `${row.usage.percent}%` }"
        />
      </div>
    </div>
  </maintenance-tile>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import MaintenanceTile from './MaintenanceTile.vue'
import { NOZZLE_SERVICE_HOURS, PLATE_SERVICE_PRINTS, spoolLeft, usageOf, type Usage } from '@/services/maintenance/consumables'
import type { Spool } from '@/store/spoolman/types'

interface ConsumableRow {
  id: string;
  title: string;
  value: string;
  usage: Usage | null;
  colour?: string;
}

/**
 * Consumables: the nozzle, the build plate and the spool. The nozzle and
 * the plate count this printer's hours and prints against a service
 * interval (the printer keeps no replacement date); the spool shows what is
 * loaded, and how much is left when Spoolman says.
 */
@Component({ components: { MaintenanceTile } })
export default class MaintenanceConsumables extends Mixins(MaintenanceMixin) {
  get spool (): Spool | undefined {
    return this.$store.getters['spoolman/getActiveSpool'] as Spool | undefined
  }

  get rows (): ConsumableRow[] {
    const hours = this.printHours
    const prints = this.printCount
    const spoolPercent = this.spool ? spoolLeft(this.spool.remaining_weight, this.spool.filament?.weight) : null
    const loaded = this.loadedMaterial
    const material = this.spool?.filament?.material ?? loaded?.name ?? this.printingWith?.name
    const colour = this.spool?.filament?.color_hex ? `#${this.spool.filament.color_hex.replace('#', '')}` : (loaded?.colour ?? this.printingWith?.colour ?? undefined)
    return [
      {
        id: 'nozzle',
        title: 'Nozzle',
        value: hours === null ? 'Hours unavailable' : `${hours} of ${NOZZLE_SERVICE_HOURS} h`,
        usage: usageOf(hours, NOZZLE_SERVICE_HOURS)
      },
      {
        id: 'plate',
        title: 'Build plate',
        value: prints === null ? 'Prints unavailable' : `${prints} of ${PLATE_SERVICE_PRINTS} prints`,
        usage: usageOf(prints, PLATE_SERVICE_PRINTS)
      },
      {
        id: 'filament',
        title: material ? `Filament, ${material}` : 'Filament',
        value: spoolPercent !== null ? `${spoolPercent}% left` : material ? 'Loaded' : 'None set',
        usage: spoolPercent === null ? null : { percent: spoolPercent, tone: 'ok' },
        colour
      }
    ]
  }
}
</script>

<style lang="scss" scoped>
  .mcons__item + .mcons__item {
    margin-top: 2px;
  }

  .mcons__label {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    font-weight: 600;

    b {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }
  }

  .mcons__dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .mcons__bar {
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--m3d-accent);
    }
  }

  .mcons__fill--warn {
    background: var(--m3d-warning) !important;
  }
</style>
