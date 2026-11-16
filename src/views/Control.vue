<template>
  <div
    :key="contextKey"
    class="control-page"
    :class="{ 'control-page--phone': isMobileViewport, 'control-page--edit': editing }"
    data-tid="control-page"
  >
    <plate-clear-bar />

    <div class="control-page__bar">
      <control-actions
        v-if="isMobileViewport && !editing"
        class="control-page__actions"
        phone
      />
      <span class="control-page__grow" />
      <template v-if="editing">
        <button
          type="button"
          class="cbtn"
          data-tid="edit-reset"
          @click="reset"
        >
          Reset layout
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          data-tid="edit-done"
          @click="done"
        >
          Done
        </button>
      </template>
      <button
        v-else
        type="button"
        class="cbtn"
        data-tid="edit-open"
        @click="startEdit"
      >
        <frame-icon
          name="pencil"
          small
        />
        Edit layout
      </button>
    </div>

    <section
      v-if="editing"
      class="control-page__tray"
      data-tid="add-tile-tray"
      aria-label="Hidden tiles"
    >
      <b>Hidden tiles</b>
      <span class="control-page__tray-help">
        Move tiles with the arrows, {{ narrow ? '' : 'make them narrower or wider, ' }}or hide them. Saved for you, on this printer.
      </span>
      <div class="control-page__chips">
        <button
          v-for="def in hiddenDefs"
          :key="def.id"
          type="button"
          class="cbtn"
          :data-tid="`add-${def.id}`"
          @click="add(def.id)"
        >
          {{ def.title }}<span aria-hidden="true"> +</span>
        </button>
        <span
          v-if="!hiddenDefs.length"
          class="control-page__muted"
        >Every tile is on the page.</span>
      </div>
    </section>

    <div
      class="control-page__grid"
      data-tid="control-grid"
    >
      <div
        v-for="tile in tiles"
        :key="tile.id"
        class="control-page__cell"
        :style="cellStyle(tile)"
        :data-cell="tile.id"
      >
        <!-- While editing, the tile is only a picture: nothing in it can be pressed or sent. -->
        <div
          class="control-page__body"
          :inert="editing ? true : undefined"
          :aria-hidden="editing ? 'true' : undefined"
          @click.capture="stopWhileEditing"
          @pointerdown.capture="stopWhileEditing"
          @keydown.capture="stopWhileEditing"
          @input.capture="stopWhileEditing"
          @change.capture="stopWhileEditing"
        >
          <component
            :is="tile.component"
            v-bind="tile.phoneProp ? { phone: isMobileViewport } : {}"
          />
        </div>
        <div
          v-if="editing"
          class="control-page__edit"
          data-tid="tile-edit"
        >
          <b>{{ tile.title }}</b>
          <button
            type="button"
            class="cbtn"
            :aria-label="`Move ${tile.title} earlier`"
            :disabled="indexOf(tile.id) === 0"
            data-tid="tile-earlier"
            @click="shift(tile.id, -1)"
          >
            ←
          </button>
          <button
            type="button"
            class="cbtn"
            :aria-label="`Move ${tile.title} later`"
            :disabled="indexOf(tile.id) === tiles.length - 1"
            data-tid="tile-later"
            @click="shift(tile.id, 1)"
          >
            →
          </button>
          <template v-if="!narrow">
            <button
              type="button"
              class="cbtn"
              :aria-label="`Make ${tile.title} narrower`"
              data-tid="tile-narrower"
              @click="resize(tile.id, -1)"
            >
              −
            </button>
            <button
              type="button"
              class="cbtn"
              :aria-label="`Make ${tile.title} wider`"
              data-tid="tile-wider"
              @click="resize(tile.id, 1)"
            >
              +
            </button>
          </template>
          <button
            type="button"
            class="cbtn"
            :aria-label="`Hide ${tile.title}`"
            data-tid="tile-remove"
            @click="remove(tile.id)"
          >
            Hide
          </button>
        </div>
      </div>
      <p
        v-if="!tiles.length"
        class="control-page__empty"
        data-tid="control-empty"
      >
        {{ editing ? 'No tiles on the page. Add one from Hidden tiles above.' : 'Every tile is hidden. Choose Edit layout to add some back.' }}
      </p>
    </div>
    <p
      class="control-page__sr"
      role="status"
      aria-live="polite"
      data-tid="edit-status"
    >
      {{ status }}
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import { cloudState } from '@/services/muon-cloud/state'
import ControlActions from '@/components/control/ControlActions.vue'
import PlateClearBar from '@/components/ui/PlateClearBar.vue'
import { controlTiles, type ControlTileDef } from '@/components/control/registry'
import { addTile, defaultLayout, moveBy, nudgeSize, removeTile, serverLayoutKey, type OverviewLayout, type PlacedTile } from '@/services/overview/layout'
import { loadLayout, saveLayout, type LayoutContext } from '@/services/overview/layout-store'

type DrawnTile = ControlTileDef & PlacedTile

/**
 * Control: move, heat and feed the printer by hand, as D3 tiles (the v3
 * layout). Which tiles there are is components/control/registry; where they
 * sit and how wide they are is this person's layout on this printer, changed
 * with Edit layout (the same layout rules as the Overview). While editing,
 * the tiles are inert: nothing is sent to the printer.
 */
@Component({ components: { ControlActions, PlateClearBar } })
export default class Control extends Mixins(BrowserMixin) {
  readonly defs = controlTiles
  layout: OverviewLayout = defaultLayout(controlTiles)
  draft: OverviewLayout | null = null
  narrow = false
  status = ''
  private narrowQuery: MediaQueryList | null = null

  get contextKey (): string {
    return `${this.$store.state.config.apiUrl}|${cloudState.activePrinterId ?? ''}|${cloudState.account?.id ?? ''}|${this.$route?.params?.printer ?? ''}`
  }

  get editing (): boolean { return this.draft !== null }

  get context (): LayoutContext {
    return {
      accountId: cloudState.account?.id ?? null,
      printerId: cloudState.activePrinterId ?? this.$route?.params?.printer ?? this.$store.state.config.apiUrl ?? null,
      page: 'control'
    }
  }

  get savedLayouts (): Record<string, unknown> | undefined {
    return this.$store.state.config.uiSettings?.control?.layouts
  }

  get current (): OverviewLayout { return this.draft ?? this.layout }

  get tiles (): DrawnTile[] {
    return this.current.tiles.flatMap(p => {
      const def = this.defs.find(d => d.id === p.id)
      return def ? [{ ...def, ...p }] : []
    })
  }

  get hiddenDefs (): ControlTileDef[] {
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
    this.narrowQuery?.removeEventListener?.('change', this.onNarrow)
  }

  onNarrow (e: MediaQueryListEvent) { this.narrow = e.matches }

  cellStyle (tile: DrawnTile): Record<string, string> {
    const def = this.defs.find(d => d.id === tile.id)
    const tablet = tile.span === def?.span ? tile.tablet : tile.span > 6 ? 12 : 6
    return { '--span': String(tile.span), '--rows': String(tile.rows), '--tablet': String(tablet) }
  }

  titleOf (id: string): string { return this.defs.find(d => d.id === id)?.title ?? id }

  indexOf (id: string): number { return this.current.tiles.findIndex(t => t.id === id) }

  startEdit () {
    this.draft = { tiles: this.layout.tiles.map(t => ({ ...t })), hidden: [...this.layout.hidden] }
    this.status = 'Editing the Control layout.'
  }

  reset () {
    if (!this.draft) return
    this.draft = defaultLayout(this.defs)
    this.status = 'Every tile is back where it started. Choose Done to keep it.'
  }

  done () {
    const draft = this.draft
    if (!draft) return
    if (JSON.stringify(draft) !== JSON.stringify(this.layout)) {
      const record = saveLayout(this.context, draft, localStorage)
      this.$store.dispatch('config/saveByPath', {
        // Only this person's key on this printer, never the whole map.
        path: `uiSettings.control.layouts.${serverLayoutKey(this.context.accountId, this.context.printerId)}`,
        value: record,
        server: true
      })
      this.layout = { tiles: record.tiles, hidden: record.hidden }
    }
    this.draft = null
    this.status = 'Control layout saved.'
  }

  /** Stops presses, typing and form changes from reaching a tile while the page is being edited. */
  stopWhileEditing (e: Event) {
    if (!this.editing) return
    e.stopPropagation()
    e.preventDefault()
  }

  shift (id: string, by: number) {
    if (!this.draft) return
    this.draft = moveBy(this.draft, id, by)
    this.status = `${this.titleOf(id)} moved to place ${this.indexOf(id) + 1} of ${this.draft.tiles.length}.`
  }

  resize (id: string, by: number) {
    if (!this.draft) return
    this.draft = nudgeSize(this.draft, id, by, 0)
    const t = this.draft.tiles.find(x => x.id === id)
    this.status = t ? `${this.titleOf(id)} is ${t.span} columns wide.` : ''
  }

  remove (id: string) {
    if (!this.draft) return
    this.draft = removeTile(this.draft, id)
    this.status = `${this.titleOf(id)} hidden.`
  }

  add (id: string) {
    if (!this.draft) return
    this.draft = addTile(this.draft, id, this.defs)
    this.status = `${this.titleOf(id)} added.`
  }
}
</script>

<style lang="scss" scoped>
  .control-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .control-page__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .control-page__grow {
    flex: 1 1 auto;
  }

  .control-page--phone .control-page__bar {
    flex-direction: column;
    align-items: stretch;
  }

  .control-page__tray {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 18px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .control-page__tray-help,
  .control-page__muted {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .control-page__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .control-page__grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-auto-flow: row dense;
    gap: 16px;
    align-items: start;
  }

  .control-page__cell {
    position: relative;
    display: flex;
    flex-direction: column;
    grid-column: span var(--span);
    grid-row: span var(--rows);
    min-width: 0;
  }

  .control-page__body {
    display: flex;
    flex-direction: column;
    min-width: 0;

    > * { flex: 1 1 auto; }
  }

  .control-page--edit .control-page__body {
    opacity: 0.55;
    pointer-events: none;
  }

  .control-page__edit {
    position: absolute;
    top: 10px;
    right: 10px;
    left: 10px;
    z-index: 5;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border: 1px solid var(--m3d-border);
    border-radius: 14px;
    background: var(--m3d-surface);
    box-shadow: 0 6px 20px rgb(0 0 0 / 25%);

    b { flex: 1 1 auto; font-size: 14px; }
  }

  .control-page__empty {
    grid-column: 1 / -1;
    margin: 0;
    padding: 24px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);
    text-align: center;
  }

  .control-page__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (max-width: 1099px) {
    .control-page__cell { grid-column: span var(--tablet); grid-row: auto; }
  }

  @media (max-width: 699px) {
    .control-page__grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
    .control-page__cell { grid-column: 1 / -1; }
  }
</style>
