<template>
  <div
    :key="commandTarget"
    class="bedmesh-page"
    :class="{ 'bedmesh-page--phone': isMobileViewport }"
    data-tid="bedmesh-page"
  >
    <template v-if="supportsBedMesh">
      <bed-mesh-tile class="bedmesh-page__mesh" />
      <div class="bedmesh-page__side">
        <bed-figures />
        <probe-card v-if="hasProbe" />
      </div>
      <mesh-profiles class="bedmesh-page__wide" />
    </template>
    <template v-else>
      <probe-card
        v-if="hasProbe"
        class="bedmesh-page__mesh"
      />
      <div class="bedmesh-page__none">
        <span class="bedmesh-page__ico"><frame-icon name="mesh" /></span>
        <b>No bed mesh on this printer</b>
        <p>This printer has no bed mesh in its printer.cfg.</p>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import TypedCommandsMixin from '@/mixins/typed-commands'
import BrowserMixin from '@/mixins/browser'
import BedMeshTile from '@/components/maintenance/BedMeshTile.vue'
import BedFigures from '@/components/maintenance/BedFigures.vue'
import MeshProfiles from '@/components/maintenance/MeshProfiles.vue'
import ProbeCard from '@/components/maintenance/ProbeCard.vue'

/**
 * Bed (`/boxwood-367a/tune`): the mesh as a heat map or a 3D surface, its
 * figures, the probe and the saved profiles. Reached from Health's bed mesh
 * tile; the page header's back chevron returns there, and its one primary
 * action is Calibrate mesh.
 */
@Component({ components: { BedMeshTile, BedFigures, MeshProfiles, ProbeCard } })
export default class Tune extends Mixins(TypedCommandsMixin, BrowserMixin) {
  get supportsBedMesh (): boolean {
    return this.$store.getters['mesh/getSupportsBedMesh'] as boolean
  }

  get hasProbe (): boolean {
    return !!this.$store.getters['printer/getProbe']
  }
}
</script>

<style lang="scss" scoped>
  .bedmesh-page {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
    min-width: 0;
  }

  .bedmesh-page__mesh { grid-column: span 8; min-width: 0; }
  .bedmesh-page__wide { grid-column: span 12; }

  .bedmesh-page__side {
    display: flex;
    grid-column: span 4;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .bedmesh-page__none {
    display: flex;
    grid-column: span 12;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px 18px;
    border-radius: 22px;
    background: var(--m3d-surface);
    text-align: center;

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .bedmesh-page__ico {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  @media (max-width: 1023px) {
    .bedmesh-page { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    .bedmesh-page__mesh,
    .bedmesh-page__side,
    .bedmesh-page__wide,
    .bedmesh-page__none { grid-column: span 6; }
  }

  @media (max-width: 699px) {
    .bedmesh-page { grid-template-columns: minmax(0, 1fr); gap: 12px; }
    .bedmesh-page__mesh,
    .bedmesh-page__side,
    .bedmesh-page__wide,
    .bedmesh-page__none { grid-column: auto; }
  }

  .bedmesh-page--phone {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;

    > * { grid-column: auto; }
  }
</style>
