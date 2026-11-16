<template>
  <maintenance-tile
    title="Mesh figures"
    icon="pulse"
    data-tid="bed-figures"
  >
    <div
      v-if="figures"
      class="bfig__stats"
    >
      <div>
        <small>Spread</small>
        <b>{{ figures.spread.toFixed(2) }} mm</b>
      </div>
      <div>
        <small>Max</small>
        <b>{{ signedMm(figures.max) }}</b>
      </div>
      <div>
        <small>Min</small>
        <b>{{ signedMm(figures.min) }}</b>
      </div>
      <div>
        <small>Points</small>
        <b>{{ figures.columns }} × {{ figures.rows }}</b>
      </div>
    </div>
    <p
      v-else
      class="bfig__none"
    >
      No measurement yet.
    </p>

    <p
      v-if="notice"
      class="bfig__callout"
      :class="`bfig__callout--${notice.tone}`"
      data-tid="bed-notice"
    >
      {{ notice.text }}
    </p>
  </maintenance-tile>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import MaintenanceTile from './MaintenanceTile.vue'
import { checkStatus, daysAgo } from '@/services/maintenance/model'
import { meshFigures, signedMm, type MeshFigures } from '@/services/maintenance/heatmap'

/**
 * Bed's figures: how far apart the plate's highest and lowest points are,
 * the grid's size, and a line when the mesh is old or says the plate is
 * uneven.
 */
@Component({ components: { MaintenanceTile } })
export default class BedFigures extends Mixins(MaintenanceMixin) {
  get figures (): MeshFigures | null {
    return meshFigures(this.mesh)
  }

  get notice (): { tone: 'ok' | 'warn' | 'err', text: string } | null {
    if (!this.figures) return null
    const at = this.lastRun.bedMesh
    const status = checkStatus('bedMesh', at, Date.now())
    if (status.due) {
      return {
        tone: 'warn',
        text: at ? `Calibrated ${daysAgo(at, Date.now())}. Re-run after moving the printer.` : 'Not calibrated from here yet. Re-run after moving the printer.'
      }
    }
    const summary = this.meshSummary
    if (summary && summary.tone !== 'ok') return { tone: summary.tone === 'err' ? 'err' : 'warn', text: summary.verdict }
    return { tone: 'ok', text: `Calibrated ${at ? daysAgo(at, Date.now()) : 'here'}. ${summary?.verdict ?? ''}`.trim() }
  }

  signedMm (value: number): string {
    return signedMm(value)
  }
}
</script>

<style lang="scss" scoped>
  .bfig__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;

    > div {
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

  .bfig__none {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .bfig__callout {
    margin: 0;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 13px;
  }

  .bfig__callout--ok { background: color-mix(in srgb, var(--m3d-success) 12%, transparent); color: var(--m3d-success); }
  .bfig__callout--warn { background: color-mix(in srgb, var(--m3d-warning) 12%, transparent); color: var(--m3d-warning); }
  .bfig__callout--err { background: color-mix(in srgb, var(--m3d-danger) 12%, transparent); color: var(--m3d-danger); }
</style>
