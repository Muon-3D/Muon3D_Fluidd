<template>
  <section
    id="presets"
    class="mats"
    data-tid="materials-settings"
  >
    <header class="mats__head">
      <h2 class="mats__title">
        Materials
      </h2>
      <input
        v-model="query"
        type="search"
        class="mats__search"
        aria-label="Search materials"
        placeholder="Search materials"
        data-tid="materials-search"
      >
      <button
        type="button"
        class="cbtn cbtn--primary"
        data-tid="material-add"
        @click="adding = true"
      >
        <frame-icon
          name="plus"
          small
        />
        Add a material
      </button>
    </header>

    <div
      v-for="group in groups"
      :key="group.id"
      class="m3-set mats__group"
      :data-tid="`materials-${group.id}`"
    >
      <h3 class="mats__group-title">
        {{ group.title }}
      </h3>
      <div
        v-for="p in group.presets"
        :key="p.id"
        class="m3-set__row mats__row"
        :class="{ 'mats__row--over': dragOver === p.name }"
        :data-tid="`material-row-${p.name}`"
        @dragover="onDragOver($event, p)"
        @dragleave="dragOver = null"
        @drop="onDrop($event, p)"
      >
        <button
          type="button"
          class="mats__grip"
          :class="{ 'mats__grip--off': !presetPinned(p.name) }"
          :draggable="presetPinned(p.name) ? 'true' : 'false'"
          :aria-label="presetPinned(p.name) ? `Move ${p.name}: arrow keys` : `Pin ${p.name} to set its order`"
          :disabled="!presetPinned(p.name)"
          :data-tid="`material-grip-${p.name}`"
          @dragstart="onDragStart($event, p)"
          @dragend="dragging = null; dragOver = null"
          @keydown.up.prevent="nudge(p, -1)"
          @keydown.down.prevent="nudge(p, 1)"
        >
          <frame-icon
            name="grip"
            small
          />
        </button>
        <span
          class="mats__swatch"
          :style="{ background: swatch(p) }"
        />
        <button
          type="button"
          class="mats__main"
          :data-tid="`material-open-${p.name}`"
          @click="edit(p)"
        >
          <span class="m3-set__label">
            <b>{{ p.name }}</b>
            <span>{{ subtitle(p) }}</span>
          </span>
          <span class="mats__temps">{{ temps(p) }}</span>
        </button>
        <button
          type="button"
          class="mats__pin"
          :class="{ 'mats__pin--on': presetPinned(p.name) }"
          :aria-pressed="presetPinned(p.name) ? 'true' : 'false'"
          :aria-label="`${presetPinned(p.name) ? 'Unpin' : 'Pin'} ${p.name}`"
          :disabled="!presetPinned(p.name) && pinsFull"
          :title="!presetPinned(p.name) && pinsFull ? 'Six are pinned. Unpin one first.' : undefined"
          :data-tid="`material-pin-${p.name}`"
          @click="togglePresetPin(p.name)"
        >
          <frame-icon
            name="pin"
            small
          />
        </button>
        <frame-icon
          name="chevronRight"
          small
          class="mats__chevron"
        />
      </div>
      <p
        v-if="!group.presets.length"
        class="mats__note"
      >
        {{ group.empty }}
      </p>
      <p
        v-if="group.id === 'printer'"
        class="mats__note"
        data-tid="materials-pins-note"
      >
        Pinned materials ({{ pins.length }} of {{ maxPins }}) are the ones the filament picker on Overview and Control shows first. Drag to set their order. PLA, PETG, ABS and TPU are always here; they can be unpinned, not deleted.
      </p>
    </div>

    <div
      class="m3-set mats__library"
      data-tid="material-library"
    >
      <h3 class="mats__group-title">
        Material library
      </h3>
      <library-offline
        v-if="libraryState === 'offline'"
        @retry="loadLibrary"
      />
      <p
        v-else-if="libraryState === 'loading'"
        class="mats__note"
        role="status"
      >
        Loading the material library…
      </p>
      <div
        v-else
        class="mats__lib"
        :class="{ 'mats__lib--phone': isMobileViewport }"
      >
        <div
          class="mats__brands"
          role="group"
          aria-label="Brands"
        >
          <button
            type="button"
            class="mats__brand"
            :aria-pressed="brand === null ? 'true' : 'false'"
            data-tid="library-brand-all"
            @click="brand = null"
          >
            <span>All brands</span><span class="mats__count">{{ libraryEntries.length }}</span>
          </button>
          <button
            v-for="b in brands"
            :key="b.brand"
            type="button"
            class="mats__brand"
            :aria-pressed="brand === b.brand ? 'true' : 'false'"
            :data-tid="`library-brand-${b.brand}`"
            @click="brand = b.brand"
          >
            <span>{{ b.brand }}</span><span class="mats__count">{{ b.count }}</span>
          </button>
        </div>
        <div class="mats__results">
          <input
            v-model="libraryQuery"
            type="search"
            class="mats__search"
            aria-label="Search the library"
            placeholder="Search the library"
            data-tid="library-search"
          >
          <div
            class="mats__chips"
            role="group"
            aria-label="Type"
          >
            <button
              v-for="c in chips"
              :key="c.id"
              type="button"
              class="mats__chip"
              :aria-pressed="chosen.includes(c.id) ? 'true' : 'false'"
              :data-tid="`library-chip-${c.id}`"
              @click="toggleChip(c.id)"
            >
              {{ c.label }}
            </button>
          </div>
          <ul
            class="mats__list"
            data-tid="library-results"
          >
            <li
              v-for="e in shownLibrary"
              :key="e.id"
              class="mats__lrow"
              :data-tid="`library-row-${e.id}`"
            >
              <span
                class="mats__swatch"
                :style="{ background: e.colour }"
              />
              <span class="m3-set__label">
                <b>{{ e.name }}</b>
                <span>{{ e.brand }} · {{ e.testedOnM1 ? 'Tested on M1' : e.abrasive ? 'needs a hardened nozzle' : `${e.diameter} mm` }}</span>
              </span>
              <span class="mats__temps">{{ e.nozzle.default }}° · {{ e.bed.default }}°</span>
              <button
                type="button"
                class="mats__icon"
                :aria-label="`Make my own from ${e.brand} ${e.name}`"
                title="Make my own from this"
                :data-tid="`library-own-${e.id}`"
                @click="makeOwn(e)"
              >
                <frame-icon
                  name="copy"
                  small
                />
              </button>
              <span
                v-if="onPrinter(e)"
                class="mats__on"
                :data-tid="`library-on-${e.id}`"
              >On {{ printerLabel }}</span>
              <button
                v-else
                type="button"
                class="cbtn cbtn--sm"
                :data-tid="`library-add-${e.id}`"
                @click="addEntry(e)"
              >
                <frame-icon
                  name="plus"
                  small
                />
                Add
              </button>
            </li>
            <li
              v-if="!libraryResults.length"
              class="mats__note"
              role="status"
            >
              Nothing in the library matches. "Add a material" › Make my own instead.
            </li>
            <li
              v-else-if="libraryResults.length > shownLibrary.length"
              class="mats__note"
            >
              Showing {{ shownLibrary.length }} of {{ libraryResults.length }}. Search or pick a brand to narrow it down.
            </li>
          </ul>
        </div>
      </div>
      <p class="mats__note">
        Adding copies the material onto {{ printerLabel }}, so it works offline. Library entries are read-only; "Make my own from this" copies one into Your presets.
      </p>
    </div>

    <div
      v-if="hasSpoolman"
      class="m3-set"
      data-tid="materials-spools"
    >
      <h3 class="mats__group-title">
        Spools
      </h3>
      <router-link
        :to="spoolmanTo"
        class="m3-set__row mats__link"
      >
        <span class="m3-set__label">
          <b>Track spools with Spoolman</b>
          <span>Spool weight, low-filament warnings, QR scan.</span>
        </span>
        <frame-icon
          name="chevronRight"
          small
        />
      </router-link>
    </div>

    <add-material-dialog
      v-model="adding"
      hide-see-all
    />
    <preset-dialog
      v-if="editing"
      :key="editingKey"
      :value="!!editing"
      :preset="editing"
      @input="editing = $event ? editing : null"
    />
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PresetDialog from './PresetDialog.vue'
import AddMaterialDialog from './AddMaterialDialog.vue'
import LibraryOffline from './LibraryOffline.vue'
import MaterialLibraryMixin from '@/mixins/material-library'
import BrowserMixin from '@/mixins/browser'
import type { TemperaturePreset } from '@/store/config/types'
import { PANEL_MATERIALS } from '@/services/control/model'
import { isDefaultMaterial } from '@/store/config/default-materials'
import { LIBRARY_CHIPS, brandCounts, searchLibrary, type LibraryEntry } from '@/services/materials/library'
import { MAX_PINS, byPins, movePin, nudgePin } from '@/services/materials/pins'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { ownDraft } from './drafts'

const SHOWN = 40

interface Group {
  id: 'yours' | 'printer';
  title: string;
  presets: TemperaturePreset[];
  empty: string;
}

/**
 * Settings › Materials (v3 storyboard): your presets, then everything else
 * on the printer (the four defaults always among them), each with a pin
 * that puts it in the filament picker, in drag order; then the material
 * library to add from. Everything here is kept on the printer.
 */
@Component({ components: { PresetDialog, AddMaterialDialog, LibraryOffline } })
export default class PresetSettings extends Mixins(MaterialLibraryMixin, BrowserMixin) {
  query = ''
  libraryQuery = ''
  brand: string | null = null
  chosen: string[] = []
  chips = LIBRARY_CHIPS
  maxPins = MAX_PINS
  adding = false
  editing: TemperaturePreset | null = null
  editingKey = 0
  dragging: string | null = null
  dragOver: string | null = null

  mounted () {
    this.loadLibrary()
  }

  isOwn (p: TemperaturePreset): boolean {
    if (isDefaultMaterial(p)) return false
    return p.origin === 'own' || (!p.origin && !p.libraryId)
  }

  matches (p: TemperaturePreset): boolean {
    const words = this.query.toLowerCase().split(/\s+/).filter(Boolean)
    const hay = `${p.name} ${p.source ?? ''} ${p.type ?? ''}`.toLowerCase()
    return words.every(w => hay.includes(w))
  }

  get groups (): Group[] {
    const shown = byPins(this.printerPresets.filter(p => this.matches(p)), this.pins)
    return [
      { id: 'yours', title: 'Your presets', presets: shown.filter(p => this.isOwn(p)), empty: this.query ? 'None of yours match.' : 'None yet. "Add a material" › Make my own, or change one below.' },
      { id: 'printer', title: `On ${this.printerLabel}`, presets: shown.filter(p => !this.isOwn(p)), empty: 'None match.' }
    ]
  }

  subtitle (p: TemperaturePreset): string {
    if (this.isOwn(p)) return p.source ? `Yours · from ${p.source}` : 'Yours'
    if (isDefaultMaterial(p)) return `Always on ${this.printerLabel}`
    return p.source ? `From ${p.source}` : `On ${this.printerLabel}`
  }

  temps (p: TemperaturePreset): string {
    const n = p.values?.extruder
    const b = p.values?.heater_bed
    return [n?.active ? `${n.value}°` : '', b?.active ? `${b.value}°` : ''].filter(Boolean).join(' · ')
  }

  swatch (p: TemperaturePreset): string {
    return p.colour ?? PANEL_MATERIALS.find(m => m.name.toUpperCase() === p.name.trim().toUpperCase())?.colour ?? '#8a9597'
  }

  edit (p: TemperaturePreset) {
    this.editing = p
    this.editingKey++
  }

  makeOwn (e: LibraryEntry) {
    this.editing = ownDraft(this.presetFor(e), this.heaterNames)
    this.editingKey++
  }

  onDragStart (event: DragEvent, p: TemperaturePreset) {
    this.dragging = p.name
    event.dataTransfer?.setData('text/plain', p.name)
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  }

  onDragOver (event: DragEvent, p: TemperaturePreset) {
    if (!this.dragging || !this.presetPinned(p.name)) return
    event.preventDefault()
    this.dragOver = p.name
  }

  onDrop (event: DragEvent, p: TemperaturePreset) {
    event.preventDefault()
    const from = this.dragging ?? event.dataTransfer?.getData('text/plain')
    this.dragging = null
    this.dragOver = null
    if (from && this.presetPinned(p.name)) this.savePins(movePin(this.pins, from, p.name))
  }

  nudge (p: TemperaturePreset, by: -1 | 1) {
    const next = nudgePin(this.pins, p.name, by)
    if (next !== this.pins) {
      this.savePins(next)
      this.$nextTick(() => (this.$el.querySelector(`[data-tid="material-grip-${p.name}"]`) as HTMLElement | null)?.focus())
    }
  }

  get brands () {
    return brandCounts(this.libraryEntries)
  }

  get libraryResults (): LibraryEntry[] {
    return searchLibrary(this.libraryEntries, { text: this.libraryQuery, brand: this.brand, chips: this.chosen })
  }

  get shownLibrary (): LibraryEntry[] {
    return this.libraryResults.slice(0, SHOWN)
  }

  toggleChip (id: string) {
    this.chosen = this.chosen.includes(id) ? this.chosen.filter(c => c !== id) : [...this.chosen, id]
  }

  get hasSpoolman (): boolean {
    return this.$store.getters['server/componentSupport']('spoolman') as boolean
  }

  get spoolmanTo (): string {
    return `${scopedPath('/settings', activeSlug())}#spoolman`
  }
}
</script>

<style lang="scss" scoped>
  .mats {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .mats__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .mats__title {
    flex: 1 1 auto;
    margin: 0;
    font-size: 22px;
    font-weight: 600;
  }

  .mats__search {
    flex: 0 1 260px;
    min-width: 0;
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid var(--m3d-border);
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font: inherit;
  }

  .mats__group-title {
    margin: 0 0 4px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .mats__row {
    gap: 8px;
  }

  .mats__row--over {
    box-shadow: inset 0 2px 0 var(--m3d-accent);
  }

  .mats__grip {
    display: inline-flex;
    flex: none;
    padding: 6px 2px;
    border-radius: 8px;
    color: var(--m3d-text-muted);
    cursor: grab;

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
    }
  }

  .mats__grip--off {
    opacity: 0.25;
    cursor: default;
  }

  .mats__swatch {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
  }

  .mats__main {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: 12px;
    min-width: 0;
    color: var(--m3d-text);
    text-align: left;
  }

  .mats__temps {
    flex: none;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .mats__pin {
    display: inline-flex;
    flex: none;
    padding: 8px;
    border-radius: 10px;
    color: var(--m3d-text-muted);
    opacity: 0.55;

    &:hover:not(:disabled) {
      background: var(--m3d-hover);
    }

    &:disabled {
      opacity: 0.2;
    }
  }

  .mats__pin--on {
    color: var(--m3d-accent);
    opacity: 1;
  }

  .mats__chevron {
    flex: none;
    color: var(--m3d-text-muted);
  }

  .mats__note {
    margin: 6px 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .mats__lib {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 16px;
  }

  .mats__lib--phone {
    grid-template-columns: 1fr;

    .mats__brands {
      flex-direction: row;
      overflow-x: auto;
    }

    .mats__brand {
      flex: none;
      gap: 8px;
    }
  }

  .mats__brands {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mats__brand {
    display: flex;
    justify-content: space-between;
    min-height: 36px;
    padding: 0 10px;
    align-items: center;
    border-radius: 10px;
    color: var(--m3d-text);
    font-size: 14px;
    text-align: left;

    &[aria-pressed="true"] {
      background: var(--m3d-surface-2);
      font-weight: 600;
    }

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .mats__count {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .mats__results {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;

    .mats__search {
      flex: none;
      width: 100%;
    }
  }

  .mats__chips {
    display: flex;
    gap: 6px;
    overflow-x: auto;
  }

  .mats__chip {
    flex: none;
    min-height: 30px;
    padding: 0 12px;
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-pill);
    color: var(--m3d-text);
    font-size: 13px;

    &[aria-pressed="true"] {
      border-color: var(--m3d-accent);
      background: var(--m3d-surface-2);
      font-weight: 600;
    }
  }

  .mats__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .mats__lrow {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .mats__icon {
    display: inline-flex;
    padding: 8px;
    border-radius: 10px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .mats__on {
    flex: none;
    padding: 4px 10px;
    border-radius: var(--m3d-radius-pill);
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  .mats__link {
    color: var(--m3d-text) !important;
    text-decoration: none;
  }
</style>
