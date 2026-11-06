<template>
  <maintenance-tile
    title="Bed mesh"
    icon="mesh"
    data-tid="maintenance-mesh"
  >
    <template #aside>
      <span v-if="run">measuring</span>
      <span v-else-if="measuredWhen">measured {{ measuredWhen }}</span>
    </template>

    <mesh-map />

    <div
      v-if="figures"
      class="mmesh__stats"
    >
      <div>
        <small>Spread</small>
        <b>{{ figures.spread.toFixed(2) }} mm</b>
      </div>
      <div>
        <small>Profile</small>
        <b>{{ profileName || 'None' }}</b>
      </div>
    </div>

    <router-link
      :to="meshPageTo"
      class="cbtn mmesh__more"
    >
      Open bed detail
      <frame-icon
        name="chevronRight"
        small
      />
    </router-link>
  </maintenance-tile>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import MaintenanceTile from './MaintenanceTile.vue'
import MeshMap from './MeshMap.vue'
import { daysAgo } from '@/services/maintenance/model'
import { meshFigures, type MeshFigures } from '@/services/maintenance/heatmap'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/**
 * Maintenance's one view of the bed: a small heat map of the last
 * measurement, how far apart its highest and lowest points are, and the
 * way into Bed for the rest.
 */
@Component({ components: { MaintenanceTile, MeshMap } })
export default class MaintenanceMesh extends Mixins(MaintenanceMixin) {
  get meshPageTo (): string {
    return scopedPath('/tune', activeSlug())
  }

  /** The measurement under way, here or started by the printer itself. */
  get run () {
    return this.meshRun
  }

  get figures (): MeshFigures | null {
    return meshFigures(this.mesh)
  }

  get profileName (): string {
    return this.$store.state.printer.printer.bed_mesh?.profile_name ?? ''
  }

  get measuredWhen (): string {
    const at = this.lastRun.bedMesh
    return at && this.mesh.length ? daysAgo(at, Date.now()) : ''
  }
}
</script>

<style lang="scss" scoped>
  .mmesh__stats {
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
      display: block;
      overflow: hidden;
      font-size: 18px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .mmesh__more {
    width: 100%;
    justify-content: center;
  }
</style>
