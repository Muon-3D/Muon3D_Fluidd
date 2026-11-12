<template>
  <div
    class="bprint"
    :class="[`bprint--${tile.tone}`, { 'bprint--found': found, 'bprint--grab': draggable }]"
    :draggable="draggable ? 'true' : undefined"
    :data-tid="`printer-tile-${tile.key}`"
    @dragstart="$emit('dragstart', $event)"
    @dragend="$emit('dragend', $event)"
  >
    <!-- A focusable element, not a <button>: a drag can't start on a button. -->
    <div
      role="button"
      tabindex="0"
      class="bprint__stand"
      :aria-label="found ? `${tile.name}: ${tile.detail}` : `Open ${tile.name}`"
      @click="activate"
      @keydown.enter.prevent="activate"
      @keydown.space.prevent="activate"
    >
      <printer-drawing
        :kind="foreign ? 'other' : 'm1'"
        :state="tile.state"
        :tone="tile.tone"
        :progress="tile.job ? tile.job.progress : null"
        :colour="colour"
        :draw-on="drawOn"
        :dim="tile.state === 'offline' || found"
        :label="`${tile.name}, ${tile.label}`"
      />
    </div>
    <div
      v-if="actions.length"
      class="bprint__acts"
      :class="{ 'bprint__acts--always': found }"
    >
      <button
        v-for="a in actions"
        :key="a.id"
        type="button"
        class="bprint__act"
        :disabled="a.disabled"
        :data-tid="`bench-action-${a.id}`"
        @click.stop="$emit('action', a.id)"
      >
        {{ a.label }}
      </button>
    </div>
    <div class="bprint__under">
      <svg
        class="bprint__spool"
        viewBox="-24 -24 48 48"
        aria-hidden="true"
      >
        <circle
          r="21"
          class="bprint__flange"
        />
        <circle
          v-if="colour"
          r="15"
          :fill="colour"
        />
        <circle
          r="6"
          class="bprint__hub"
        />
      </svg>
      <div class="bprint__text">
        <b class="bprint__name">
          {{ tile.name }}
          <span
            v-if="tile.sharedBy"
            class="bprint__tag"
            data-tid="shared-by"
          >from {{ tile.sharedBy }}</span>
          <span
            v-else-if="foreign"
            class="bprint__tag"
          >Klipper</span>
        </b>
        <span class="bprint__state"><i />{{ stateWords }}</span>
        <small v-if="materialLine">{{ materialLine }}</small>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import PrinterDrawing from './PrinterDrawing.vue'
import type { PrinterTile } from '@/services/printers-page/model'

export interface BenchAction {
  id: string;
  label: string;
  disabled?: boolean;
}

/**
 * One printer standing on a bench (KAN-2257, control-ctx): its drawing,
 * the two most likely things to do with it on hover (a found printer shows
 * its one action all the time), and under it its spool, name and state.
 */
@Component({ components: { PrinterDrawing } })
export default class BenchPrinter extends Vue {
  @Prop({ type: Object, required: true })
  readonly tile!: PrinterTile

  @Prop({ type: Array, default: () => [] })
  readonly actions!: BenchAction[]

  @Prop({ type: Boolean })
  readonly draggable!: boolean

  @Prop({ type: Boolean })
  readonly found!: boolean

  @Prop({ type: Boolean })
  readonly drawOn!: boolean

  activate () {
    if (this.found) {
      if (this.actions[0] && !this.actions[0].disabled) this.$emit('action', this.actions[0].id)
    } else {
      this.$emit('open')
    }
  }

  get foreign (): boolean {
    return !!this.tile.entry.foreign
  }

  get colour (): string | null {
    return this.tile.job?.material?.colour ?? null
  }

  get stateWords (): string {
    if (this.found) return this.tile.detail
    const label = this.tile.label
    const detail = this.tile.state === 'printing' || this.tile.state === 'paused' ? this.tile.detail : ''
    return detail && detail !== label ? `${label} · ${detail}` : label
  }

  /** What is loaded, when the printer has said. How much is left isn't known yet, so it isn't drawn as known. */
  get materialLine (): string {
    return this.tile.job?.material?.name ?? ''
  }
}
</script>

<style lang="scss" scoped>
  .bprint {
    --bp-state: var(--m3d-text-subtle);

    position: relative;
    width: 150px;
    flex: none;
    user-select: none;
  }

  .bprint--run { --bp-state: var(--m3d-accent); }
  .bprint--ok { --bp-state: var(--m3d-success); }
  .bprint--warn { --bp-state: var(--m3d-warning); }
  .bprint--err { --bp-state: var(--m3d-danger); }
  .bprint--info { --bp-state: var(--m3d-text-muted); }

  .bprint--grab { cursor: grab; }

  .bprint__stand {
    display: block;
    width: 150px;
    height: 170px;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
    outline: none;
    transition: transform var(--m3d-spring-snappy-duration) var(--m3d-spring-snappy);

    &:focus-visible { outline: 2px solid var(--m3d-focus-ring); outline-offset: 4px; border-radius: 12px; }
  }

  .bprint:hover .bprint__stand { transform: translateY(-4px); }

  .bprint__acts {
    position: absolute;
    top: 6px;
    left: 0;
    right: 24px;
    z-index: 2;
    display: flex;
    justify-content: center;
    gap: 6px;
    opacity: 0;
    transform: translateY(5px);
    pointer-events: none;
    transition:
      opacity var(--m3d-motion-fast) var(--m3d-ease-standard),
      transform var(--m3d-spring-snappy-duration) var(--m3d-spring-snappy);
  }

  .bprint:hover .bprint__acts,
  .bprint:focus-within .bprint__acts,
  .bprint__acts--always {
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }

  .bprint__act {
    padding: 4px 10px;
    border: 0;
    border-radius: 999px;
    background: var(--m3d-fill-strong);
    color: var(--m3d-text);
    font-size: 11.5px;
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);

    &:disabled { opacity: 0.45; cursor: default; }
  }

  .bprint--found .bprint__act {
    background: var(--m3d-accent);
    color: var(--m3d-on-accent, #00201e);
  }

  .bprint__under {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-height: 78px;
    padding: 10px 0 0 2px;
  }

  .bprint__spool {
    width: 42px;
    height: 42px;
    flex: none;
  }

  .bprint__flange { fill: var(--m3d-fill-2); stroke: var(--m3d-border); }
  .bprint__hub { fill: var(--m3d-surface); stroke: var(--m3d-border); }

  .bprint__text {
    display: grid;
    min-width: 0;
  }

  .bprint__name {
    font-size: 13.5px;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bprint__tag {
    margin-left: 6px;
    padding: 1px 6px;
    border-radius: 6px;
    background: var(--m3d-fill);
    color: var(--m3d-text-muted);
    font-size: 10px;
    font-weight: 600;
    vertical-align: 1px;
  }

  .bprint__state {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    color: var(--bp-state);
    font-size: 11.5px;
    line-height: 1.2;

    i {
      flex: none;
      width: 7px;
      height: 7px;
      margin-top: 3px;
      border-radius: 50%;
      background: var(--bp-state);
    }
  }

  .bprint--run .bprint__state i { animation: bprint-breathe 1.8s ease-in-out infinite; }

  @keyframes bprint-breathe {
    50% { opacity: 0.35; transform: scale(1.5); }
  }

  .bprint--found .bprint__state { color: var(--m3d-text-muted); }
  .bprint--found .bprint__state i { background: var(--m3d-text-subtle); }

  .bprint__text small {
    color: var(--m3d-text-muted);
    font-size: 11px;
    white-space: nowrap;
  }
</style>
