<template>
  <control-task-fold
    fold-key="bed.view3d"
    title="Bed view"
    summary="2D or 3D"
    choice
  >
    <template #default="{ value: threeD, choose: chooseDimension }">
      <div>
        <maintenance-tile
          :title="profileName ? `Mesh · ${profileName}` : 'Mesh'"
          icon="mesh"
          data-tid="bed-mesh-tile"
        >
          <template #aside>
            <tone-pill
              v-if="run"
              tone="run"
            >
              Measuring
            </tone-pill>
            <tone-pill
              v-else-if="meshMeasured"
              :tone="meshInUse ? 'ok' : 'off'"
            >
              {{ meshInUse ? 'Loaded' : 'Not loaded' }}
            </tone-pill>
            <tone-pill
              v-else
              tone="warn"
            >
              Not levelled
            </tone-pill>
          </template>

          <div class="bmesh__views">
            <seg-picker
              :options="dimensionOptions"
              :value="threeD ? '3d' : '2d'"
              label="Bed view"
              @input="chooseDimension($event === '3d')"
            />
          </div>

          <bed-surface
            v-if="threeD"
            bare
          />
          <mesh-map
            v-else
            large
            numbers
          />
        </maintenance-tile>
      </div>
    </template>
  </control-task-fold>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import ControlTaskFold from '@/components/control/ControlTaskFold.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import TonePill from '@/components/printers/TonePill.vue'
import MaintenanceTile from './MaintenanceTile.vue'
import MeshMap from './MeshMap.vue'
import BedSurface from './BedSurface.vue'

/**
 * The Bed page's mesh: a heat map (2D, with a colour scale) or the 3D
 * surface, whichever was chosen last, remembered per printer. The map always
 * writes each height on its cell; with no mesh it says the bed is not levelled.
 */
@Component({ components: { ControlTaskFold, SegPicker, TonePill, MaintenanceTile, MeshMap, BedSurface } })
export default class BedMeshTile extends Mixins(MaintenanceMixin) {
  get run () {
    return this.meshRun
  }

  get profileName (): string {
    return this.$store.state.printer.printer.bed_mesh?.profile_name ?? ''
  }

  get dimensionOptions (): SegOption[] {
    return [{ value: '2d', label: '2D' }, { value: '3d', label: '3D' }]
  }
}
</script>

<style lang="scss" scoped>
  .bmesh__views {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
  }
</style>
