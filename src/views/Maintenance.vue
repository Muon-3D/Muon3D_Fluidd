<template>
  <div
    :key="commandTarget"
    class="maintenance-page"
    :class="{ 'maintenance-page--phone': isMobileViewport }"
    data-tid="maintenance-page"
  >
    <maintenance-health
      class="maintenance-page__checks"
      :class="{ 'maintenance-page__checks--alone': !supportsBedMesh && !hasProbe }"
    />
    <maintenance-mesh
      v-if="supportsBedMesh"
      class="maintenance-page__mesh"
    />
    <probe-card
      v-else-if="hasProbe"
      class="maintenance-page__mesh"
    />
    <maintenance-calibration class="maintenance-page__third" />
    <maintenance-consumables class="maintenance-page__third" />
    <maintenance-wear class="maintenance-page__third maintenance-page__wear" />
    <control-task-fold
      fold-key="maintenance.sensors"
      title="Switches and sensors"
      summary="Endstops, probe and filament state"
      class="maintenance-page__wide"
    >
      <control-outputs diagnostics-only />
    </control-task-fold>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import TypedCommandsMixin from '@/mixins/typed-commands'
import MaintenanceHealth from '@/components/maintenance/MaintenanceHealth.vue'
import MaintenanceMesh from '@/components/maintenance/MaintenanceMesh.vue'
import MaintenanceCalibration from '@/components/maintenance/MaintenanceCalibration.vue'
import MaintenanceConsumables from '@/components/maintenance/MaintenanceConsumables.vue'
import MaintenanceWear from '@/components/maintenance/MaintenanceWear.vue'
import ControlOutputs from '@/components/control/ControlOutputs.vue'
import ControlTaskFold from '@/components/control/ControlTaskFold.vue'
import ProbeCard from '@/components/maintenance/ProbeCard.vue'

/**
 * Health (`/boxwood-367a/maintenance`): what keeps prints coming out right,
 * as tiles. Checks and the bed mesh sit side by side; Calibration, the
 * consumables and the printer's wear are the second row, and the switches
 * and sensors (endstops, filament) close the page, folded. The bed mesh is here
 * once, as a small map with a way into Bed; on a printer with a probe but no
 * bed mesh, the Probe tile takes its place.
 */
@Component({ components: { MaintenanceHealth, MaintenanceMesh, MaintenanceCalibration, MaintenanceConsumables, MaintenanceWear, ControlOutputs, ControlTaskFold, ProbeCard } })
export default class Maintenance extends Mixins(BrowserMixin, TypedCommandsMixin) {
  get supportsBedMesh (): boolean {
    return this.$store.getters['mesh/getSupportsBedMesh'] as boolean
  }

  /** A probe without a [bed_mesh] has no Bed page: its Query probe and Z offset stay here. */
  get hasProbe (): boolean {
    return !!this.$store.getters['printer/getProbe']
  }
}
</script>

<style lang="scss" scoped>
  // 12 columns on a desktop, 6 on a tablet, one on a phone; a 16 px gap throughout.
  .maintenance-page {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 16px;
    align-items: stretch;
    min-width: 0;
  }

  .maintenance-page__checks { grid-column: span 8; }
  .maintenance-page__mesh { grid-column: span 4; }
  .maintenance-page__third { grid-column: span 4; }
  .maintenance-page__wide { grid-column: span 12; }

  // Without a bed mesh, Checks has the row to itself.
  .maintenance-page__checks--alone { grid-column: span 12; }

  @media (max-width: 1023px) {
    .maintenance-page { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .maintenance-page__checks,
    .maintenance-page__mesh,
    .maintenance-page__wide { grid-column: span 6; }
    .maintenance-page__third { grid-column: span 3; }
    .maintenance-page__wear { grid-column: span 6; }
  }

  @media (max-width: 699px) {
    .maintenance-page { grid-template-columns: minmax(0, 1fr); gap: 12px; }
    .maintenance-page__checks,
    .maintenance-page__mesh,
    .maintenance-page__third,
    .maintenance-page__wide,
    .maintenance-page__wear { grid-column: auto; }
  }

  .maintenance-page--phone {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;

    > * { grid-column: auto; }
  }
</style>
