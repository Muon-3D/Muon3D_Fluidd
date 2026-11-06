<template>
  <div class="mmap">
    <div
      v-if="run"
      class="mmap__live"
      data-tid="mesh-live"
    >
      <p
        class="mmap__phase"
        aria-live="polite"
      >
        <span
          class="mmap__dot"
          :class="`mmap__dot--${run.progress.phase}`"
        />
        {{ run.progress.text }}
      </p>
      <div
        class="mmap__bar"
        role="progressbar"
        :aria-valuenow="run.progress.done"
        :aria-valuemax="run.progress.total || undefined"
      >
        <span
          class="mmap__fill"
          :class="{ 'mmap__fill--unknown': !run.progress.total || !run.progress.done }"
          :style="{ width: run.progress.total ? `${Math.round(100 * run.progress.done / run.progress.total)}%` : undefined }"
        />
      </div>
    </div>

    <div
      v-if="grid.length"
      class="mmap__body"
    >
      <div
        class="mmap__grid"
        :class="{ 'mmap__grid--large': large }"
        :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
        :aria-label="`Bed mesh, ${columns} × ${grid.length} points, back at the top`"
        role="table"
        data-tid="mesh-heat"
      >
        <div
          v-for="(row, r) in displayRows"
          :key="r"
          role="row"
          class="mmap__row"
        >
          <i
            v-for="(cell, c) in row"
            :key="c"
            role="cell"
            class="mmap__cell"
            :class="{
              'mmap__cell--empty': cell === null,
              'mmap__cell--value': numbers,
              'mmap__cell--dark': numbers && cell !== null && ink(cell) === 'dark',
              'mmap__cell--new': !!run && r * columns + c === newestCell
            }"
            :style="cell === null ? undefined : { background: colorOf(cell) }"
            :aria-label="cell === null ? 'Not measured' : `${cell.toFixed(3)} mm`"
            :title="cell === null ? 'Not measured' : `${cell.toFixed(3)} mm`"
          >{{ numbers && cell !== null ? meshValue(cell) : '' }}</i>
        </div>
      </div>

      <div
        v-if="large && scale"
        class="mmap__scale"
        data-tid="mesh-scale"
      >
        <span>{{ signedMm(scale.min) }}</span>
        <span
          class="mmap__scale-bar"
          :style="{ background: gradient }"
        />
        <span>{{ signedMm(scale.max) }} mm</span>
      </div>
    </div>

    <div
      v-else
      class="mmap__none"
    >
      <frame-icon name="mesh" />
      <p v-if="run">
        {{ run.progress.text }}…
      </p>
      <p v-else>
        No measurement yet. Level the bed to measure the plate.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import { meshValue } from '@/services/maintenance/model'
import { heatColor, heatAlpha, heatGradient, heatInk, heatScale, signedMm, type HeatScale } from '@/services/maintenance/heatmap'
import { backRowFirst } from '@/services/machine/orientation'

/**
 * The plate as last measured, as a heat map: faint where it measured low,
 * strong where high, drawn as you would see the plate from the front. While
 * the bed is measured, the grid fills in point by point from Klipper's probe lines.
 */
@Component({})
export default class MeshMap extends Mixins(MaintenanceMixin) {
  /** Write each point's height on its cell. */
  @Prop({ type: Boolean })
  readonly numbers?: boolean

  /** The Bed page's map: bigger cells and a scale bar. */
  @Prop({ type: Boolean })
  readonly large?: boolean

  get columns (): number {
    return this.grid[0]?.length ?? 0
  }

  /** The measurement under way, here or started by the printer itself. */
  get run () {
    return this.meshRun
  }

  /** Rows by Y ascending: the mesh being measured, else the last one. */
  get grid (): Array<Array<number | null>> {
    const grid = this.run ? (this.run.points.length ? this.run.grid : []) : this.mesh
    return grid.map(row => row.map(value => typeof value === 'number' && Number.isFinite(value) ? value : null))
  }

  /** Where in `cells` the point measured last is, to show it arriving. */
  get newestCell (): number {
    const last = this.run?.points[this.run.points.length - 1]
    if (!last) return -1
    const rows = backRowFirst(this.grid)
    for (let r = 0; r < rows.length; r++) {
      const c = rows[r].indexOf(last.z)
      if (c >= 0) return r * this.columns + c
    }
    return -1
  }

  /** The cells to draw, back row first, as you would see the plate from the front. */
  get displayRows (): Array<Array<number | null>> {
    return backRowFirst(this.grid)
  }

  get scale (): HeatScale | null {
    return heatScale(this.grid)
  }

  get gradient (): string {
    return heatGradient()
  }

  meshValue (value: number): string {
    return meshValue(value)
  }

  signedMm (value: number): string {
    return signedMm(value)
  }

  colorOf (value: number): string {
    return this.scale ? heatColor(value, this.scale) : ''
  }

  ink (value: number): 'dark' | 'light' {
    return this.scale ? heatInk(heatAlpha(value, this.scale)) : 'light'
  }
}
</script>

<style lang="scss" scoped>
  .mmap {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .mmap__row { display: contents; }

  .mmap__body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  .mmap__grid {
    display: grid;
    gap: 3px;
    width: 100%;
  }

  .mmap__grid--large {
    max-width: 520px;
    margin: 0 auto;
    gap: 4px;
  }

  .mmap__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    border-radius: 4px;
    color: var(--m3d-text);
    font-size: 9px;
    font-style: normal;
    font-variant-numeric: tabular-nums;
  }

  .mmap__grid--large .mmap__cell {
    border-radius: 6px;
    font-size: 11px;
  }

  .mmap__cell--dark {
    color: rgba(0, 0, 0, 0.78);
  }

  .mmap__cell--empty {
    background: var(--m3d-surface-2);
  }

  .mmap__cell--new {
    box-shadow: 0 0 0 2px var(--m3d-text);
    animation: mmap-arrive 0.6s var(--m3d-ease, ease) both;
  }

  @keyframes mmap-arrive {
    from { transform: scale(0.6); opacity: 0.2; }
    to { transform: scale(1); opacity: 1; }
  }

  .mmap__scale {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .mmap__scale-bar {
    flex: 1 1 auto;
    height: 8px;
    border-radius: 999px;
  }

  .mmap__live {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mmap__phase {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }

  .mmap__dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--m3d-accent);
    animation: mmap-pulse 1.2s ease-in-out infinite;
  }

  .mmap__dot--heating {
    background: var(--m3d-warning, #e8963c);
  }

  @keyframes mmap-pulse {
    50% { opacity: 0.35; }
  }

  .mmap__bar {
    position: relative;
    height: 6px;
    overflow: hidden;
    border-radius: 999px;
    background: var(--m3d-surface-2);
  }

  .mmap__fill {
    position: absolute;
    inset: 0 auto 0 0;
    border-radius: inherit;
    background: var(--m3d-accent);
    transition: width var(--m3d-duration-base, 0.2s) var(--m3d-ease, ease);
  }

  .mmap__fill--unknown {
    width: 30%;
    animation: mmap-slide 1.4s ease-in-out infinite;
  }

  @keyframes mmap-slide {
    from { transform: translateX(-100%); }
    to { transform: translateX(340%); }
  }

  @media (prefers-reduced-motion: reduce) {
    .mmap__cell--new,
    .mmap__dot,
    .mmap__fill--unknown {
      animation: none;
    }
  }

  .mmap__none {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 28px 12px;
    color: var(--m3d-text-muted);
    text-align: center;

    p {
      margin: 0;
      font-size: 14px;
    }
  }
</style>
