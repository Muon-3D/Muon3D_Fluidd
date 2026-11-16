<template>
  <maintenance-tile
    title="Uptime and wear"
    icon="clock"
    data-tid="maintenance-wear"
  >
    <div class="mwear__stats">
      <div>
        <small>Print hours</small>
        <b>{{ printHours === null ? '—' : `${printHours} h` }}</b>
      </div>
      <div>
        <small>Prints</small>
        <b>{{ printCount === null ? '—' : printCount }}</b>
      </div>
    </div>
    <p class="mwear__note">
      {{ note }}
    </p>
  </maintenance-tile>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import MaintenanceTile from './MaintenanceTile.vue'
import { SERVICE_PRINT_HOURS } from '@/services/maintenance/consumables'

/** What this printer has done: print hours and prints, with when a service is due. */
@Component({ components: { MaintenanceTile } })
export default class MaintenanceWear extends Mixins(MaintenanceMixin) {
  get note (): string {
    if (this.printHours === null) return 'Print history is not available on this printer.'
    const left = SERVICE_PRINT_HOURS - this.printHours
    return left > 0
      ? `Service reminder at ${SERVICE_PRINT_HOURS} print hours, ${left} h to go.`
      : `Past the ${SERVICE_PRINT_HOURS} print hour service reminder.`
  }
}
</script>

<style lang="scss" scoped>
  .mwear__stats {
    display: flex;
    gap: 10px;

    > div {
      flex: 1 1 0;
      min-width: 0;
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--m3d-surface-2);
    }

    small {
      display: block;
      color: var(--m3d-text-subtle);
      font-size: 11px;
    }

    b {
      font-size: 18px;
      font-variant-numeric: tabular-nums;
    }
  }

  .mwear__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
