<template>
  <div
    :key="contextKey"
    class="overview"
    :class="{ 'overview--edit': editing, 'overview--narrow': narrow }"
    data-tid="overview-page"
  >
    <div class="overview__head">
      <h1 class="overview__title">
        Overview
      </h1>
      <div class="overview__actions">
        <template v-if="editing">
          <button
            type="button"
            class="overview__btn"
            data-tid="edit-reset"
            @click="reset"
          >
            Reset layout
          </button>
          <button
            type="button"
            class="overview__btn overview__btn--primary"
            data-tid="edit-done"
            @click="done"
          >
            Done
          </button>
        </template>
        <button
          v-else
          type="button"
          class="overview__btn"
          data-tid="edit-open"
          @click="startEdit"
        >
          Edit
        </button>
      </div>
    </div>

    <section
      v-if="editing"
      class="overview__tray"
      data-tid="add-tile-tray"
      aria-label="Add tile"
    >
      <div class="overview__tray-head">
        <b>Add tile</b>
        <span v-if="narrow">Tap a tile to add it at the end. Drag the grip to move a tile, or the × to hide it.</span>
        <span v-else>Tap a tile to add it at the end, or drag it onto the page. Drag the grip to move a tile and the corner to resize it. Saved for you, on this printer.</span>
      </div>
      <div class="overview__tray-chips">
        <button
          v-for="def in hiddenDefs"
          :key="def.id"
          type="button"
          class="overview__chip"
          :data-tid="`add-${def.id}`"
          @pointerdown="startAdd($event, def.id)"
          @click="clickAdd(def.id)"
        >
          {{ def.title }}<span aria-hidden="true"> +</span>
        </button>
        <span
          v-if="!hiddenDefs.length"
          class="overview__tray-none"
          data-tid="add-none"
        >Every tile is on the page.</span>
      </div>
    </section>

    <div
      ref="grid"
      class="overview__grid"
      data-tid="overview-grid"
    >
      <div
        v-for="tile in tiles"
        :key="tile.id"
        :ref="`cell-${tile.id}`"
        class="overview__cell"
        :class="[`overview__cell--${tile.id}`, { 'overview__cell--moving': drag && drag.kind === 'move' && drag.id === tile.id, 'overview__cell--over': drag && drag.over === tile.id }]"
        :style="cellStyle(tile)"
        :data-cell="tile.id"
      >
        <!-- While editing, the tile is only a picture: nothing in it can be pressed or focused. -->
        <div
          class="overview__body"
          :inert="editing ? true : undefined"
          :aria-hidden="editing ? 'true' : undefined"
          data-tid="tile-body"
          @click.capture="stopWhileEditing"
          @dblclick.capture="stopWhileEditing"
          @mousedown.capture="stopWhileEditing"
          @pointerdown.capture="stopWhileEditing"
          @keydown.capture="stopWhileEditing"
          @keyup.capture="stopWhileEditing"
          @submit.capture="stopWhileEditing"
          @input.capture="stopWhileEditing"
          @change.capture="stopWhileEditing"
        >
          <component
            :is="tile.component"
            v-bind="tile.props"
          />
        </div>
        <template v-if="editing">
          <button
            type="button"
            class="overview__grip"
            :aria-label="gripLabel(tile)"
            data-tid="tile-grip"
            @pointerdown="startMove($event, tile.id)"
            @keydown="gripKey($event, tile.id)"
          >
            <i /><i /><i /><i /><i /><i />
          </button>
          <button
            type="button"
            class="overview__remove"
            :aria-label="`Hide ${tile.title}`"
            :title="`Hide ${tile.title}`"
            data-tid="tile-remove"
            @click="remove(tile.id)"
          >
            <span aria-hidden="true">×</span>
          </button>
          <span
            v-if="!narrow"
            class="overview__resize"
            data-tid="tile-resize"
            aria-hidden="true"
            @pointerdown="startResize($event, tile.id)"
          />
        </template>
      </div>
      <p
        v-if="!tiles.length"
        class="overview__empty"
        data-tid="overview-empty"
      >
        {{ editing ? 'No tiles on the page. Add one from the tray above.' : 'Every tile is hidden. Choose Edit to add some back.' }}
      </p>
    </div>

    <div
      v-if="drag && drag.kind === 'add'"
      class="overview__ghost"
      :style="{ left: `${drag.x}px`, top: `${drag.y}px` }"
    >
      {{ titleOf(drag.id) }}
    </div>
    <p
      class="overview__sr"
      role="status"
      aria-live="polite"
      data-tid="edit-status"
    >
      {{ status }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { cloudState } from '@/services/muon-cloud/state'
import { overviewTiles, type OverviewTileDef } from '@/components/widgets/overview/registry'
import {
  addTile, defaultLayout, moveBy, moveTile, nudgeSize, removeTile, resizeTile, serverLayoutKey,
  type OverviewLayout, type PlacedTile
} from '@/services/overview/layout'
import { loadLayout, saveLayout, type LayoutContext } from '@/services/overview/layout-store'

/** A tile as drawn: what the registry says it is, at the size the layout gives it. */
type DrawnTile = OverviewTileDef & PlacedTile

interface Drag { kind: 'move' | 'add'; id: string; over: string | null; x: number; y: number }

const GRID_GAP = 16
const DRAG_START = 6

/**
 * The printer's own page: the live 3D view, the print job, the filament,
 * then instrument tiles for the heaters, fans, speed, position and Z offset,
 * a jog pad, macros and the temperature graph. Each tile opens its full
 * controls in a popover, and keeps the Pro-level depth behind its three dots.
 * Which tiles there are is the list in widgets/overview/registry; where they
 * sit and how big they are is this person's saved layout (services/overview),
 * changed with Edit. While editing the tiles are inert: nothing is sent to the printer.
 */
@Component({})
export default class Overview extends Vue {
  readonly defs = overviewTiles
  layout: OverviewLayout = defaultLayout(overviewTiles)
  draft: OverviewLayout | null = null
  drag: Drag | null = null
  /** Below 1100 px (tablet and phone) tiles can be moved and hidden but not resized: sizes are the desktop grid. */
  narrow = false
  status = ''
  private narrowQuery: MediaQueryList | null = null
  private skipClick = false
  private stopDrag: (() => void) | null = null

  get editing (): boolean { return this.draft !== null }

  /** A different printer or account starts every tile afresh, so nothing half-typed crosses over. */
  get contextKey (): string {
    return `${this.$store.state.config.apiUrl}|${cloudState.activePrinterId ?? ''}|${cloudState.account?.id ?? ''}|${this.$route?.params?.printer ?? ''}`
  }

  get context (): LayoutContext {
    return { accountId: cloudState.account?.id ?? null, printerId: cloudState.activePrinterId ?? this.$route?.params?.printer ?? this.$store.state.config.apiUrl ?? null }
  }

  /** What this printer's settings hold, which fills in after the page opens. */
  get savedLayouts (): Record<string, unknown> | undefined {
    return this.$store.state.config.uiSettings?.overview?.layouts
  }

  get current (): OverviewLayout { return this.draft ?? this.layout }

  get tiles (): DrawnTile[] {
    return this.current.tiles.flatMap(p => {
      const def = this.defs.find(d => d.id === p.id)
      return def ? [{ ...def, ...p }] : []
    })
  }

  get hiddenDefs (): OverviewTileDef[] {
    return this.current.hidden.flatMap(id => this.defs.find(d => d.id === id) ?? [])
  }

  @Watch('contextKey')
  @Watch('savedLayouts')
  load () {
    if (this.editing) return
    this.layout = loadLayout(this.context, this.savedLayouts, localStorage, this.defs)
  }

  created () {
    this.load()
  }

  mounted () {
    if (typeof window.matchMedia === 'function') {
      this.narrowQuery = window.matchMedia('(max-width: 1099px)')
      this.narrow = this.narrowQuery.matches
      this.narrowQuery.addEventListener?.('change', this.onNarrow)
    }
  }

  beforeDestroy () {
    this.stopDrag?.()
    this.narrowQuery?.removeEventListener?.('change', this.onNarrow)
  }

  onNarrow (e: MediaQueryListEvent) { this.narrow = e.matches }

  cellStyle (tile: DrawnTile): Record<string, string> {
    // A tile left at its own width keeps its own tablet width; a resized one takes half or the whole row.
    const tablet = tile.span === this.defs.find(d => d.id === tile.id)?.span ? tile.tablet : tile.span > 6 ? 12 : 6
    return { '--span': String(tile.span), '--rows': String(tile.rows), '--tablet': String(tablet), '--phone': String(tile.phone) }
  }

  titleOf (id: string): string { return this.defs.find(d => d.id === id)?.title ?? id }

  /* Edit mode */

  startEdit () {
    this.draft = { tiles: this.layout.tiles.map(t => ({ ...t })), hidden: [...this.layout.hidden] }
    this.status = 'Editing the Overview.'
  }

  reset () {
    if (!this.draft) return
    this.draft = defaultLayout(this.defs)
    this.status = 'Every tile is back where it started. Choose Done to keep it.'
  }

  done () {
    const draft = this.draft
    if (!draft) return
    this.stopDrag?.()
    if (JSON.stringify(draft) !== JSON.stringify(this.layout)) {
      const record = saveLayout(this.context, draft, localStorage)
      this.$store.dispatch('config/saveByPath', {
        path: 'uiSettings.overview.layouts',
        value: { ...(this.savedLayouts ?? {}), [serverLayoutKey(this.context.accountId, this.context.printerId)]: record },
        server: true
      })
      this.layout = { tiles: record.tiles, hidden: record.hidden }
    }
    this.draft = null
    this.status = 'Overview saved.'
  }

  /** Stops presses, typing and form changes from reaching a tile while the page is being edited. */
  stopWhileEditing (e: Event) {
    if (!this.editing) return
    e.stopPropagation()
    e.preventDefault()
  }

  remove (id: string) {
    if (!this.draft) return
    this.draft = removeTile(this.draft, id)
    this.status = `${this.titleOf(id)} hidden.`
  }

  clickAdd (id: string) {
    if (this.skipClick) { this.skipClick = false; return }
    this.add(id)
  }

  add (id: string, at?: number) {
    if (!this.draft) return
    this.draft = addTile(this.draft, id, this.defs, at)
    this.status = `${this.titleOf(id)} added.`
  }

  gripLabel (tile: DrawnTile): string {
    const pos = this.current.tiles.findIndex(t => t.id === tile.id) + 1
    return `Move ${tile.title}, place ${pos} of ${this.current.tiles.length}. Arrow keys move it${this.narrow ? '' : ', Shift and arrow keys resize it'}.`
  }

  gripKey (e: KeyboardEvent, id: string) {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    if (!this.draft || !keys.includes(e.key)) return
    e.preventDefault()
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp'
    if (e.shiftKey) {
      if (this.narrow) return
      const step = back ? -1 : 1
      const horizontal = e.key === 'ArrowLeft' || e.key === 'ArrowRight'
      this.draft = nudgeSize(this.draft, id, horizontal ? step : 0, horizontal ? 0 : step)
      const t = this.draft.tiles.find(x => x.id === id)
      this.status = t ? `${this.titleOf(id)} is ${t.span} columns wide and ${t.rows} ${t.rows === 1 ? 'row' : 'rows'} tall.` : ''
    } else {
      this.draft = moveBy(this.draft, id, back ? -1 : 1)
      this.status = `${this.titleOf(id)} moved to place ${this.draft.tiles.findIndex(t => t.id === id) + 1} of ${this.draft.tiles.length}.`
    }
    this.$nextTick(() => (this.$refs[`cell-${id}`] as HTMLElement[] | undefined)?.[0]?.querySelector<HTMLElement>('[data-tid="tile-grip"]')?.focus())
  }

  /** The tile under the pointer, if it is one on the page. */
  private cellAt (x: number, y: number): string | null {
    const found = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(x, y) : null
    return found?.closest<HTMLElement>('[data-cell]')?.dataset.cell ?? null
  }

  /** Follows the pointer until it lifts, calling back with each move and the final position. */
  private track (e: PointerEvent, onMove: (e: PointerEvent) => void, onEnd: (e: PointerEvent, cancelled: boolean) => void) {
    this.stopDrag?.()
    const move = (ev: PointerEvent) => { if (ev.pointerId === e.pointerId) onMove(ev) }
    const end = (ev: PointerEvent) => { if (ev.pointerId === e.pointerId) { stop(); onEnd(ev, ev.type === 'pointercancel') } }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      this.stopDrag = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    this.stopDrag = () => { stop(); this.drag = null }
  }

  private edgeScroll (y: number) {
    if (typeof window.scrollBy !== 'function') return
    if (y < 70) window.scrollBy(0, -18)
    else if (y > window.innerHeight - 70) window.scrollBy(0, 18)
  }

  startMove (e: PointerEvent, id: string) {
    if (!this.draft || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
    this.drag = { kind: 'move', id, over: null, x: e.clientX, y: e.clientY }
    this.track(e, ev => {
      this.edgeScroll(ev.clientY)
      const over = this.cellAt(ev.clientX, ev.clientY)
      this.drag = { kind: 'move', id, over: over === id ? null : over, x: ev.clientX, y: ev.clientY }
    }, (ev, cancelled) => {
      const over = cancelled ? null : this.cellAt(ev.clientX, ev.clientY)
      if (this.draft && over && over !== id) {
        const to = this.draft.tiles.findIndex(t => t.id === over)
        if (to >= 0) { this.draft = moveTile(this.draft, id, to); this.status = `${this.titleOf(id)} moved to place ${to + 1} of ${this.draft.tiles.length}.` }
      }
      this.drag = null
    })
  }

  /** A press on a tray tile is a tap until it moves; then it is carried onto the page. */
  startAdd (e: PointerEvent, id: string) {
    if (!this.draft || (e.pointerType === 'mouse' && e.button !== 0)) return
    const x0 = e.clientX
    const y0 = e.clientY
    let carrying = false
    this.track(e, ev => {
      if (!carrying && Math.hypot(ev.clientX - x0, ev.clientY - y0) < DRAG_START) return
      carrying = true
      this.edgeScroll(ev.clientY)
      this.drag = { kind: 'add', id, over: this.cellAt(ev.clientX, ev.clientY), x: ev.clientX, y: ev.clientY }
    }, (ev, cancelled) => {
      if (carrying) {
        this.skipClick = true
        setTimeout(() => { this.skipClick = false }, 0)
        if (!cancelled && this.draft && this.overGrid(ev.clientX, ev.clientY)) {
          const over = this.cellAt(ev.clientX, ev.clientY)
          const at = over ? this.draft.tiles.findIndex(t => t.id === over) : -1
          this.add(id, at >= 0 ? at : undefined)
        }
      }
      this.drag = null
    })
  }

  private overGrid (x: number, y: number): boolean {
    const r = (this.$refs.grid as HTMLElement | undefined)?.getBoundingClientRect()
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
  }

  /** Dragging the corner resizes in whole grid steps: columns of the 12, and rows. */
  startResize (e: PointerEvent, id: string) {
    const grid = this.$refs.grid as HTMLElement | undefined
    const cell = (this.$refs[`cell-${id}`] as HTMLElement[] | undefined)?.[0]
    const from = this.draft?.tiles.find(t => t.id === id)
    if (!this.draft || !grid || !cell || !from || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement | null)?.setPointerCapture?.(e.pointerId)
    const base = this.draft
    const column = (grid.getBoundingClientRect().width + GRID_GAP) / 12
    const row = (cell.getBoundingClientRect().height + GRID_GAP) / from.rows
    this.track(e, ev => {
      if (!column || !row) return
      this.edgeScroll(ev.clientY)
      this.draft = resizeTile(base, id, from.span + Math.round((ev.clientX - e.clientX) / column), from.rows + Math.round((ev.clientY - e.clientY) / row))
    }, () => {
      const t = this.draft?.tiles.find(x => x.id === id)
      if (t) this.status = `${this.titleOf(id)} is ${t.span} columns wide and ${t.rows} ${t.rows === 1 ? 'row' : 'rows'} tall.`
    })
  }
}
</script>

<style lang="scss" scoped>
.overview { display: flex; flex-direction: column; gap: 16px; color: var(--m3d-text); }
.overview__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; }
.overview__title { margin: 0; font-size: 20px; font-weight: 600; }
.overview__actions { display: flex; gap: 8px; }
.overview__btn {
  min-height: 40px; padding: 0 18px; border-radius: 999px; background: var(--m3d-fill); color: var(--m3d-text); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer;
  &:hover { background: var(--m3d-fill-2, var(--m3d-fill)); }
  &:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 2px; }
  &--primary { background: var(--m3d-accent); color: var(--m3d-on-accent, #00201e); &:hover { background: var(--m3d-accent); filter: brightness(1.06); } }
}

.overview__tray { display: flex; flex-direction: column; gap: 10px; padding: 14px 18px; border-radius: 22px; background: var(--m3d-surface); box-shadow: inset 0 0 0 1px var(--m3d-border-strong); }
.overview__tray-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
.overview__tray-head b { font-size: 15px; font-weight: 600; }
.overview__tray-head span { color: var(--m3d-text-muted); font-size: 13px; }
.overview__tray-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.overview__tray-none { color: var(--m3d-text-muted); font-size: 13px; }
.overview__chip {
  min-height: 36px; padding: 0 14px; border-radius: 999px; background: var(--m3d-accent-soft, var(--m3d-fill)); color: var(--m3d-accent); font: inherit; font-size: 13.5px; font-weight: 600; cursor: grab; touch-action: none; user-select: none;
  &:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 2px; }
}

.overview__grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-auto-flow: row dense; gap: 16px; align-items: stretch; }
.overview__cell { position: relative; display: flex; grid-column: span var(--span); grid-row: span var(--rows); min-width: 0; }
/* Normally the wrapper takes no part in layout: the tile is the cell's only child, as it always was. */
.overview__body { display: contents; }
.overview__body > * { flex: 1 1 auto; min-width: 0; }
.overview__empty { grid-column: 1 / -1; margin: 0; padding: 24px; border-radius: 22px; background: var(--m3d-surface); color: var(--m3d-text-muted); text-align: center; }

/* Edit mode: the tile is a picture with handles on it. */
.overview--edit .overview__body { display: flex; flex: 1 1 auto; min-width: 0; pointer-events: none; user-select: none; }
.overview--edit .overview__body :deep(.tm) { visibility: hidden; }
.overview--edit .overview__body :deep(.ot__head) { padding-left: 30px; }
/* The 3D view's own corner pieces step aside for the grip and the remove button. */
.overview--edit .overview__body :deep(.ov-stage__badge) { left: 50px; }
.overview--edit .overview__body :deep(.st__seg) { right: 50px; }
.overview--edit .overview__cell::after {
  content: ''; position: absolute; inset: 0; z-index: 4; border-radius: 22px; pointer-events: none;
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--m3d-accent) 55%, transparent);
}
.overview__cell--moving { opacity: 0.55; }
.overview__cell--over::after { box-shadow: inset 0 0 0 3px var(--m3d-accent) !important; background: color-mix(in srgb, var(--m3d-accent) 10%, transparent); }
.overview__grip {
  position: absolute; top: 14px; left: 12px; z-index: 5; display: grid; grid-template-columns: repeat(2, 4px); gap: 3px; padding: 6px 5px; border-radius: 8px;
  background: var(--m3d-fill); cursor: grab; touch-action: none;
  i { width: 4px; height: 4px; border-radius: 50%; background: var(--m3d-text-muted); }
  &:hover, &:focus-visible { background: var(--m3d-accent-soft, var(--m3d-fill-2)); }
  &:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 2px; }
}
.overview__remove {
  position: absolute; top: 12px; right: 12px; z-index: 5; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%;
  background: var(--m3d-fill); color: var(--m3d-text); font-size: 20px; line-height: 1; cursor: pointer;
  &:hover { background: color-mix(in srgb, var(--m3d-danger) 18%, transparent); color: var(--m3d-danger); }
  &:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 2px; }
}
.overview__resize {
  position: absolute; right: 8px; bottom: 8px; z-index: 5; width: 22px; height: 22px; border-radius: 6px; cursor: nwse-resize; touch-action: none;
  background: linear-gradient(135deg, transparent 0 48%, var(--m3d-accent) 48% 56%, transparent 56% 66%, var(--m3d-accent) 66% 74%, transparent 74%);
}
.overview__ghost {
  position: fixed; z-index: 40; padding: 8px 16px; border-radius: 999px; background: var(--m3d-accent); color: var(--m3d-on-accent, #00201e);
  font-size: 13.5px; font-weight: 600; pointer-events: none; transform: translate(-50%, -140%); box-shadow: var(--m3d-shadow-float);
}
.overview__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

@media (max-width: 1099px) {
  .overview__cell { grid-column: span var(--tablet); grid-row: auto; }
}
@media (max-width: 599px) {
  .overview__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .overview__cell { grid-column: span var(--phone); }
}
</style>
