<template>
  <control-card
    title="Surface"
    data-tid="bed-surface"
  >
    <template #aside>
      <span v-if="level">{{ profileName }} · {{ level.range.toFixed(3) }} mm high to low</span>
    </template>

    <bed-mesh-chart
      v-if="level"
      class="bsurf__chart"
      :options="options"
      :data="series"
      :height="isMobileViewport ? '300px' : '480px'"
    />
    <div
      v-else
      class="bsurf__none"
    >
      <frame-icon name="mesh" />
      <p>No mesh loaded. Measure the bed, or load a saved profile.</p>
    </div>

    <p
      v-if="level"
      class="bsurf__note"
      data-tid="bed-surface-note"
    >
      <span>Height ×{{ stretch }}, tilt taken out: the colours show how far each point sits above or below level.</span>
      <span
        v-if="tiltShown"
        class="bsurf__quiet"
      >Tilt {{ level.tilt.toFixed(2) }} mm across the plate. The printer compensates for it.</span>
    </p>

    <div
      v-if="level"
      class="bsurf__chips"
      role="group"
      aria-label="Show"
    >
      <seg-picker
        :options="matrixOptions"
        :value="matrix"
        label="Heights"
        @input="setMatrix"
      />
      <button
        type="button"
        class="bsurf__chip"
        :class="{ 'bsurf__chip--on': flatSurface }"
        :aria-pressed="flatSurface ? 'true' : 'false'"
        @click="$store.dispatch('mesh/onFlatSurface', !flatSurface)"
      >
        Flat plane
      </button>
      <button
        type="button"
        class="bsurf__chip"
        :class="{ 'bsurf__chip--on': wireframe }"
        :aria-pressed="wireframe ? 'true' : 'false'"
        @click="$store.dispatch('mesh/onWireframe', !wireframe)"
      >
        Wireframe
      </button>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import type { KlipperBedMesh, MatrixType } from '@/store/mesh/types'
import ControlCard from '@/components/control/ControlCard.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import BedMeshChart from '@/components/widgets/bedmesh/BedMeshChart.vue'
import { heightStretch, levelMesh, microns, type LevelledMesh } from '@/services/maintenance/mesh-level'

/** How tall the shape stands, as a share of the measured area's shorter side. */
const HEIGHT_SHARE = 0.3

/** The drawing box's width in the chart's own units; depth and height follow from it. */
const BOX_WIDTH = 100

/**
 * The bed as a 3D surface, levelled: the probed points or the smoothed mesh
 * Klipper moves by, less the plane that fits them best, so what shows is the
 * plate's curvature and not its tilt (which the printer follows anyway).
 * Across and deep are true to scale; height is stretched to fill the view,
 * by the factor shown beneath. Display only: the mesh itself is untouched.
 */
@Component({ components: { ControlCard, SegPicker, BedMeshChart } })
export default class BedSurface extends Mixins(StateMixin, BrowserMixin) {
  get bedMesh (): KlipperBedMesh | undefined {
    return this.$store.state.printer.printer.bed_mesh as KlipperBedMesh | undefined
  }

  get matrix (): MatrixType {
    return this.$store.state.mesh.matrix
  }

  setMatrix (value: MatrixType) {
    this.$store.dispatch('mesh/onMatrix', value)
  }

  get matrixOptions (): SegOption[] {
    return [{ value: 'probed_matrix', label: 'Probed' }, { value: 'mesh_matrix', label: 'Smoothed' }]
  }

  get wireframe (): boolean {
    return this.$store.state.mesh.wireframe
  }

  get flatSurface (): boolean {
    return this.$store.state.mesh.flatSurface
  }

  /** The chosen heights, levelled; null until there's a whole mesh with its corners. */
  get level (): LevelledMesh | null {
    const mesh = this.bedMesh
    const matrix = mesh?.[this.matrix]
    if (!mesh?.mesh_min || !mesh.mesh_max || !matrix || matrix.length < 2 || (matrix[0]?.length ?? 0) < 2) return null
    return levelMesh(matrix, mesh.mesh_min, mesh.mesh_max)
  }

  get profileName (): string {
    return this.bedMesh?.profile_name ?? ''
  }

  /** The measured area across and deep, in mm. */
  get span (): [number, number] {
    const level = this.level
    if (!level) return [1, 1]
    return [level.xs[level.xs.length - 1] - level.xs[0], level.ys[level.ys.length - 1] - level.ys[0]]
  }

  get stretch (): number {
    return heightStretch(this.level?.range ?? 0, Math.min(...this.span), HEIGHT_SHARE)
  }

  /** A tilt that would read 0.00 mm isn't worth a line. */
  get tiltShown (): boolean {
    return (this.level?.tilt ?? 0) >= 0.005
  }

  /** The height axis: as many mm as the stretch fits into the box's height, centred on the shape. */
  get zAxis (): { min: number; max: number } {
    const level = this.level
    const height = Math.min(...this.span) * HEIGHT_SHARE / this.stretch
    const middle = level ? (level.min + level.max) / 2 : 0
    return { min: middle - height / 2, max: middle + height / 2 }
  }

  get options () {
    const level = this.level
    if (!level) return {}
    const [across, deep] = this.span
    const perMm = BOX_WIDTH / across
    const selected = Object.fromEntries(this.series.map(s => [s.name, s.name !== 'flat' || this.flatSurface]))
    const um = (mm: number) => microns(mm)
    return {
      legend: { show: false, selected },
      // Colours span this shape, in microns off level.
      visualMap: { min: level.min, max: level.max, dimension: 2, seriesIndex: 0, formatter: um },
      tooltip: {
        formatter: (params: { value?: number[] }) => {
          const v = params.value
          if (!Array.isArray(v) || !Number.isFinite(v[2])) return ''
          return `${v[0].toFixed(0)}, ${v[1].toFixed(0)} mm<br>${um(v[2])} off level`
        }
      },
      xAxis3D: { min: level.xs[0], max: level.xs[level.xs.length - 1], name: 'X mm' },
      yAxis3D: { min: level.ys[0], max: level.ys[level.ys.length - 1], name: 'Y mm' },
      // The colour scale gives heights, in microns; labels up the stretched axis would crowd it.
      zAxis3D: { ...this.zAxis, name: '', axisLabel: { show: false } },
      grid3D: {
        // Across and deep to scale; the height is the stretched shape plus the room either side of it.
        boxWidth: BOX_WIDTH,
        boxDepth: deep * perMm,
        boxHeight: Math.min(across, deep) * HEIGHT_SHARE * perMm,
        viewControl: { distance: 165, alpha: 28, beta: 30 }
      }
    }
  }

  get series () {
    const level = this.level
    if (!level) return []
    const points = (z: (r: number, c: number) => number) => level.ys.flatMap((y, r) => level.xs.map((x, c) => ({ name: `x${c + 1}_y${r}`, value: [x, y, z(r, c)] })))
    const dataShape = [level.ys.length, level.xs.length]
    return [
      {
        type: 'surface',
        name: this.matrix,
        shading: 'color',
        wireframe: { show: this.wireframe },
        data: points((r, c) => level.residuals[r][c]),
        dataShape
      },
      {
        type: 'surface',
        name: 'flat',
        itemStyle: { color: [0.5, 0.5, 0.5, 0.25] },
        wireframe: { show: this.wireframe, lineStyle: { opacity: 0.25, width: 1, color: '#ffffff' } },
        data: points(() => 0),
        dataShape
      }
    ]
  }
}
</script>

<style lang="scss" scoped>
  .bsurf__chart {
    min-width: 0;
  }

  .bsurf__none {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 260px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    font-size: 14px;
    text-align: center;

    p {
      margin: 0;
    }
  }

  .bsurf__note {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .bsurf__quiet {
    opacity: 0.75;
  }

  .bsurf__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .bsurf__chip {
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .bsurf__chip--on {
    background: rgba(128, 214, 209, 0.14);
    box-shadow: inset 0 0 0 1px rgba(128, 214, 209, 0.5);
    color: var(--m3d-accent);
  }
</style>
