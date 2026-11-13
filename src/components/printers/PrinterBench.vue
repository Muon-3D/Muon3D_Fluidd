<template>
  <section
    class="bench"
    :class="[`bench--${kind}`, { 'bench--over': over, 'bench--folded': folded }]"
  >
    <header class="bench__head">
      <span
        v-if="kind === 'shelf' && icon === 'printer'"
        class="bench__fi"
        aria-hidden="true"
      >
        <frame-icon
          name="printer"
          small
        />
      </span>
      <svg
        v-else-if="kind === 'shelf'"
        class="bench__icon"
        viewBox="0 0 20 14"
        aria-hidden="true"
      ><circle
        cx="7"
        cy="5"
        r="3"
      /><circle
        cx="14"
        cy="6"
        r="2.3"
      /><path d="M1.5 13c.5-3 3-4.5 5.5-4.5s5 1.5 5.5 4.5M13 9c2.5 0 4.5 1.3 5 4" /></svg>
      <span
        v-else-if="kind === 'door'"
        class="bench__comet"
        :class="{ 'bench__comet--still': !searching }"
        aria-hidden="true"
      ><i /><i /><i /></span>
      <svg
        v-else
        class="bench__icon"
        viewBox="0 0 20 14"
        aria-hidden="true"
      ><path d="M1 4h18M3 4v9M17 4v9M3 9h14" /></svg>
      <span class="bench__title">
        <slot name="title">
          <h2
            class="bench__name"
            :title="title"
          >
            {{ title }}
          </h2>
        </slot>
      </span>
      <span
        v-if="kind !== 'door'"
        class="bench__sum"
        data-tid="bench-summary"
      >
        <span
          v-for="d in dots"
          :key="d.tone"
          :class="`bench__dot bench__dot--${d.tone}`"
        ><i />{{ d.count }} {{ d.word }}</span>
        <span v-if="!dots.length">Empty</span>
      </span>
      <span
        v-else
        class="bench__caption"
      >{{ caption }}</span>
      <span class="bench__grow" />
      <slot name="actions" />
      <button
        v-if="kind !== 'door'"
        type="button"
        class="bench__fold"
        :aria-label="folded ? `Show ${title || 'this bench'}` : `Fold ${title || 'this bench'} away`"
        :aria-expanded="folded ? 'false' : 'true'"
        data-tid="bench-fold"
        @click="toggleFold"
      >
        <frame-icon
          name="chevronDown"
          small
        />
      </button>
    </header>
    <div
      v-show="!folded"
      class="bench__top"
    >
      <slot />
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { PrinterTile, TileTone } from '@/services/printers-page/model'

const FOLDED_KEY = 'muon3d.printers.folded'

function readFolded (): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(FOLDED_KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/**
 * A group of printers drawn as a bench (KAN-2257, control-ctx): a soft panel
 * with a lit top edge, a full-width bench line with legs and a lower shelf;
 * its name, a count in status-coloured dots and a fold. "Shared with you" is
 * a shelf without legs; "Found nearby" is hatched ground with a dashed line.
 */
@Component({})
export default class PrinterBench extends Vue {
  @Prop({ type: String, default: 'bench' })
  readonly kind!: 'bench' | 'shelf' | 'door'

  /** Kept across visits, in this browser, so a bench stays folded. */
  @Prop({ type: String, required: true })
  readonly benchId!: string

  @Prop({ type: String, default: '' })
  readonly title!: string

  @Prop({ type: Array, default: () => [] })
  readonly tiles!: PrinterTile[]

  @Prop({ type: Boolean })
  readonly over!: boolean

  /** A shelf's icon: the people it came from (default), or the printer frame. */
  @Prop({ type: String, default: 'people' })
  readonly icon!: 'people' | 'printer'

  @Prop({ type: String, default: '' })
  readonly caption!: string

  /** A door's comet spins only while the page is still looking. */
  @Prop({ type: Boolean })
  readonly searching!: boolean

  folded = false

  // A class field can't read a prop (it is undefined then): read it here.
  created () {
    this.folded = readFolded().includes(this.benchId)
  }

  toggleFold () {
    this.folded = !this.folded
    const others = readFolded().filter(id => id !== this.benchId)
    try {
      localStorage.setItem(FOLDED_KEY, JSON.stringify(this.folded ? [...others, this.benchId] : others))
    } catch {
      // Folded for this visit.
    }
  }

  /** "2 printing · 1 ready · 1 needs you", as dots in each state's colour. */
  get dots (): Array<{ tone: TileTone, count: number, word: string }> {
    const n = (f: (t: PrinterTile) => boolean) => this.tiles.filter(f).length
    return ([
      { tone: 'run', count: n(t => t.state === 'printing'), word: 'printing' },
      { tone: 'ok', count: n(t => t.state === 'ready'), word: 'ready' },
      { tone: 'warn', count: n(t => t.tone === 'warn' || t.tone === 'err'), word: 'need you' },
      { tone: 'off', count: n(t => t.tone === 'off'), word: 'asleep' },
      { tone: 'info', count: n(t => t.tone === 'info'), word: 'new' }
    ] as Array<{ tone: TileTone, count: number, word: string }>).filter(d => d.count)
  }
}
</script>

<style lang="scss" scoped>
  // A bench: a quiet panel whose own lines are the furniture.
  .bench {
    position: relative;
    margin-bottom: 14px;
    padding: 14px 20px 18px;
    border-radius: 24px;
    background: linear-gradient(180deg, var(--m3d-surface), color-mix(in srgb, var(--m3d-surface) 72%, var(--m3d-bg)));
    box-shadow:
      inset 0 0.5px 0 rgb(255 255 255 / 9%),
      inset 0 0 0 1px var(--m3d-border),
      0 12px 24px -18px rgb(0 0 0 / 60%);
    transition: box-shadow var(--m3d-motion-base) var(--m3d-ease-standard);
  }

  // A bench a printer is dragged over glows from inside.
  .bench--over {
    box-shadow:
      inset 0 0 0 1.5px var(--m3d-accent),
      inset 0 0 40px -12px color-mix(in srgb, var(--m3d-accent) 40%, transparent),
      0 12px 24px -18px rgb(0 0 0 / 60%);
  }

  .bench--shelf {
    background: none;
    box-shadow: inset 0 0 0 1px var(--m3d-border);
  }

  .bench--door {
    padding-bottom: 10px;
    background: repeating-linear-gradient(135deg, transparent 0 9px, color-mix(in srgb, var(--m3d-text) 3%, transparent) 9px 10px);
    box-shadow: inset 0 0 0 1px var(--m3d-border);
  }

  .bench--folded { padding-bottom: 12px; }

  .bench__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    min-height: 26px;
    margin-bottom: 4px;
  }

  // The title gives way first (an ellipsis); the actions never wrap off the row.
  .bench__title {
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;

    :deep(h2),
    :deep(input) { max-width: 100%; }

    :deep(h2) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .bench__name {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }

  .bench__fi {
    display: inline-grid;
    color: var(--m3d-text-muted);
  }

  .bench__icon {
    width: 18px;
    height: 13px;
    fill: none;
    stroke: var(--m3d-text-muted);
    stroke-width: 1.5;
    stroke-linecap: round;
  }

  .bench__comet {
    position: relative;
    display: inline-block;
    width: 16px;
    height: 16px;
    animation: bench-spin 1.3s linear infinite;

    i {
      position: absolute;
      top: 0;
      left: 6px;
      width: 4px;
      height: 4px;
      background: var(--m3d-accent);
      transform-origin: 2px 8px;
    }

    i:nth-child(2) { transform: rotate(-38deg); opacity: 0.6; }
    i:nth-child(3) { transform: rotate(-76deg); opacity: 0.3; }
  }

  .bench__comet--still { animation: none; }

  @keyframes bench-spin {
    to { transform: rotate(360deg); }
  }

  .bench__sum {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: var(--m3d-text-muted);
    font-size: 12.5px;
  }

  .bench__dot {
    display: inline-flex;
    align-items: center;
    gap: 5px;

    i {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--m3d-text-subtle);
    }
  }

  .bench__dot--run i { background: var(--m3d-accent); }
  .bench__dot--ok i { background: var(--m3d-success); }
  .bench__dot--warn i { background: var(--m3d-warning); }
  .bench__dot--info i { background: var(--m3d-text-muted); }

  .bench__caption {
    color: var(--m3d-text-muted);
    font-size: 12.5px;
  }

  .bench__grow { flex: 1; }

  .bench__fold {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--m3d-text-muted);
    cursor: pointer;
    flex: none;
    transform: rotate(180deg);
    transition:
      transform var(--m3d-spring-snappy-duration) var(--m3d-spring-snappy),
      background-color var(--m3d-motion-fast) var(--m3d-ease-standard);

    &:hover { background: var(--m3d-hover); }
  }

  .bench--folded .bench__fold { transform: none; }

  // The bench line, its legs and the lower shelf, drawn across the whole bench.
  // Each printer is one row tall (--row) and the drawing repeats every row, so
  // however many rows the printers wrap into, every row stands on its own line.
  .bench__top {
    --row: 268px;

    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 0 12px;
    min-height: var(--row);
    padding: 0 18px;
  }

  .bench--bench .bench__top {
    background:
      linear-gradient(to bottom, transparent 170px, var(--m3d-text-muted) 170px 173px, transparent 173px) 8px 0 / calc(100% - 16px) var(--row) repeat-y,
      linear-gradient(to bottom, transparent 262px, var(--m3d-border) 262px 263.5px, transparent 263.5px) 8px 0 / calc(100% - 16px) var(--row) repeat-y,
      linear-gradient(to bottom, transparent 173px, var(--m3d-text-muted) 173px 262px, transparent 262px) 8px 0 / 3px var(--row) repeat-y,
      linear-gradient(to bottom, transparent 173px, var(--m3d-text-muted) 173px 262px, transparent 262px) right 8px top 0 / 3px var(--row) repeat-y;
  }

  .bench--shelf .bench__top {
    background: linear-gradient(to bottom, transparent 170px, var(--m3d-border) 170px 172px, transparent 172px) 8px 0 / calc(100% - 16px) var(--row) repeat-y;
  }

  // A dashed line on every row: the dashes are masked down to one line per row.
  .bench--door .bench__top::before {
    content: '';
    position: absolute;
    inset: 0 8px;
    pointer-events: none;
    background: repeating-linear-gradient(90deg, var(--m3d-text-subtle) 0 6px, transparent 6px 11px);
    -webkit-mask: linear-gradient(to bottom, transparent 170px, #000 170px 172px, transparent 172px) 0 0 / 100% var(--row) repeat-y;
    mask: linear-gradient(to bottom, transparent 170px, #000 170px 172px, transparent 172px) 0 0 / 100% var(--row) repeat-y;
  }

  @media (max-width: 599px) {
    .bench { padding: 12px 12px 14px; }
    .bench__top { padding: 0 6px; justify-content: center; }

    // The status summary may wrap under the title; the actions stay on the title row.
    .bench__sum { order: 5; flex: 1 0 100%; }
  }
</style>
