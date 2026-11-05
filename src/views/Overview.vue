<template>
  <div
    :key="contextKey"
    class="overview"
    data-tid="overview-page"
  >
    <h1 class="overview__title">
      Overview
    </h1>
    <div
      class="overview__grid"
      data-tid="overview-grid"
    >
      <div
        v-for="tile in tiles"
        :key="tile.id"
        class="overview__cell"
        :class="`overview__cell--${tile.id}`"
        :style="cellStyle(tile)"
        :data-cell="tile.id"
      >
        <component
          :is="tile.component"
          v-bind="tile.props"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import { overviewTiles, type OverviewTileDef } from '@/components/widgets/overview/registry'

/**
 * The printer's own page: the live 3D view, the print job, the filament,
 * then instrument tiles for the heaters, fans, speed, position and Z offset,
 * a jog pad, macros and the temperature graph. Each tile opens its full
 * controls in a popover, and keeps the Pro-level depth behind its three dots.
 * Which tiles there are, and where, is the list in widgets/overview/registry.
 */
@Component({})
export default class Overview extends Vue {
  readonly tiles = overviewTiles

  /** A different printer or account starts every tile afresh, so nothing half-typed crosses over. */
  get contextKey (): string {
    return `${this.$store.state.config.apiUrl}|${cloudState.activePrinterId ?? ''}|${cloudState.account?.id ?? ''}|${this.$route?.params?.printer ?? ''}`
  }

  cellStyle (tile: OverviewTileDef): Record<string, string> {
    return { '--span': String(tile.span), '--rows': String(tile.rows ?? 1), '--tablet': String(tile.tablet), '--phone': String(tile.phone) }
  }
}
</script>

<style lang="scss" scoped>
.overview { display: flex; flex-direction: column; gap: 16px; color: var(--m3d-text); }
.overview__title { margin: 0; font-size: 20px; font-weight: 600; }
.overview__grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-auto-flow: row dense; gap: 16px; align-items: stretch; }
.overview__cell { display: flex; grid-column: span var(--span); grid-row: span var(--rows); min-width: 0; }
.overview__cell > * { flex: 1 1 auto; }
@media (max-width: 1099px) {
  .overview__cell { grid-column: span var(--tablet); grid-row: auto; }
}
@media (max-width: 599px) {
  .overview__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .overview__cell { grid-column: span var(--phone); }
}
</style>
