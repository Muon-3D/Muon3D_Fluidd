<template>
  <m3-dialog
    :value="value"
    :eyebrow="printerLabel"
    title="Add a material"
    max-width="520"
    data-tid="add-material"
    @close="close"
  >
    <div class="addm">
      <input
        v-model="query"
        type="search"
        class="addm__search"
        aria-label="Search materials"
        placeholder="Search brand, name or type"
        data-tid="add-material-search"
      >
      <div
        class="addm__chips"
        role="group"
        aria-label="Filters"
      >
        <button
          type="button"
          class="addm__chip"
          :aria-pressed="brand === null ? 'true' : 'false'"
          @click="brand = null"
        >
          All brands
        </button>
        <button
          v-for="b in brands"
          :key="b.brand"
          type="button"
          class="addm__chip"
          :aria-pressed="brand === b.brand ? 'true' : 'false'"
          :data-tid="`add-material-brand-${b.brand}`"
          @click="brand = brand === b.brand ? null : b.brand"
        >
          {{ b.brand }}<template v-if="brand === b.brand">
            ×
          </template>
        </button>
        <button
          v-for="c in chips"
          :key="c.id"
          type="button"
          class="addm__chip"
          :aria-pressed="chosen.includes(c.id) ? 'true' : 'false'"
          :data-tid="`add-material-chip-${c.id}`"
          @click="toggleChip(c.id)"
        >
          {{ c.label }}<template v-if="chosen.includes(c.id)">
            ×
          </template>
        </button>
      </div>

      <button
        type="button"
        class="addm__row addm__own"
        data-tid="add-material-own"
        @click="makeOwn(null)"
      >
        <span class="addm__plus"><frame-icon
          name="plus"
          small
        /></span>
        <span class="addm__text">
          <b>Make my own</b>
          <span>Start blank or from any material below</span>
        </span>
      </button>

      <library-offline
        v-if="libraryState === 'offline'"
        @retry="loadLibrary"
      />
      <p
        v-else-if="libraryState === 'loading'"
        class="addm__note"
        role="status"
      >
        Loading the material library…
      </p>
      <ul
        v-else
        class="addm__list"
        data-tid="add-material-results"
      >
        <li
          v-for="e in shown"
          :key="e.id"
          class="addm__row"
          :data-tid="`add-material-row-${e.id}`"
        >
          <span
            class="addm__swatch"
            :style="{ background: e.colour }"
          />
          <span class="addm__text">
            <b>{{ e.name }}</b>
            <span>{{ describe(e) }}</span>
          </span>
          <button
            type="button"
            class="addm__icon"
            :aria-label="`Make my own from ${e.brand} ${e.name}`"
            title="Make my own from this"
            @click="makeOwn(e)"
          >
            <frame-icon
              name="copy"
              small
            />
          </button>
          <span
            v-if="onPrinter(e)"
            class="addm__added"
            :data-tid="`add-material-added-${e.id}`"
          >Added</span>
          <button
            v-else
            type="button"
            class="cbtn cbtn--sm"
            :data-tid="`add-material-add-${e.id}`"
            @click="addEntry(e)"
          >
            Add
          </button>
        </li>
        <li
          v-if="!results.length"
          class="addm__note"
          role="status"
        >
          Nothing in the library matches. Make my own instead.
        </li>
        <li
          v-else-if="results.length > shown.length"
          class="addm__note"
        >
          Showing {{ shown.length }} of {{ results.length }}. Search to narrow it down.
        </li>
      </ul>
    </div>

    <template #actions>
      <button
        v-if="!hideSeeAll"
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="add-material-see-all"
        @click="seeAll"
      >
        See all materials
      </button>
      <span class="m3-dlg__grow" />
      <button
        type="button"
        class="cbtn cbtn--primary"
        data-tid="add-material-done"
        @click="close"
      >
        Done
      </button>
    </template>

    <preset-dialog
      v-if="draft"
      :key="draftKey"
      :value="!!draft"
      :preset="draft"
      @input="draft = $event ? draft : null"
      @saved="close"
    />
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import PresetDialog from './PresetDialog.vue'
import LibraryOffline from './LibraryOffline.vue'
import MaterialLibraryMixin from '@/mixins/material-library'
import type { TemperaturePreset } from '@/store/config/types'
import { LIBRARY_CHIPS, brandCounts, rangeText, searchLibrary, type LibraryEntry } from '@/services/materials/library'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { ownDraft } from './drafts'

const SHOWN = 30

/**
 * Add a material (Settings › Materials frame 1): one popup for Settings ›
 * Materials, the Heat panel and the filament picker. Search matches brand,
 * name and type; brand and type filters stack as chips. Adding copies the
 * entry onto the printer, so it keeps working offline.
 */
@Component({ components: { M3Dialog, PresetDialog, LibraryOffline } })
export default class AddMaterialDialog extends Mixins(MaterialLibraryMixin) {
  @Prop({ type: Boolean, required: true })
  readonly value!: boolean

  /** On Settings › Materials itself there is nothing more to see. */
  @Prop({ type: Boolean })
  readonly hideSeeAll?: boolean

  query = ''
  brand: string | null = null
  chosen: string[] = []
  chips = LIBRARY_CHIPS
  draft: TemperaturePreset | null = null
  draftKey = 0

  @Watch('value', { immediate: true })
  onOpen (open: boolean) {
    if (open && this.libraryState !== 'ready') this.loadLibrary()
    if (!open) {
      this.query = ''
      this.brand = null
      this.chosen = []
      this.draft = null
    }
  }

  get brands () {
    return brandCounts(this.libraryEntries)
  }

  get results (): LibraryEntry[] {
    return searchLibrary(this.libraryEntries, { text: this.query, brand: this.brand, chips: this.chosen })
  }

  get shown (): LibraryEntry[] {
    return this.results.slice(0, SHOWN)
  }

  toggleChip (id: string) {
    this.chosen = this.chosen.includes(id) ? this.chosen.filter(c => c !== id) : [...this.chosen, id]
  }

  describe (e: LibraryEntry): string {
    if (e.abrasive) return `${e.brand} · needs a hardened nozzle`
    return `${e.brand} · ${rangeText(e.nozzle)} · bed ${rangeText(e.bed)}`
  }

  makeOwn (entry: LibraryEntry | null) {
    this.draft = ownDraft(entry ? this.presetFor(entry) : null, this.heaterNames)
    this.draftKey++
  }

  seeAll () {
    this.close()
    this.$router.push(`${scopedPath('/settings', activeSlug())}#presets`).catch(() => undefined)
  }

  close () {
    this.$emit('input', false)
  }
}
</script>

<style lang="scss" scoped>
  .addm {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .addm__search {
    width: 100%;
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid var(--m3d-border);
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font: inherit;
  }

  .addm__chips {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .addm__chip {
    flex: none;
    min-height: 30px;
    padding: 0 12px;
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-pill);
    color: var(--m3d-text);
    font-size: 13px;
    white-space: nowrap;

    &[aria-pressed="true"] {
      border-color: var(--m3d-accent);
      background: var(--m3d-surface-2);
      font-weight: 600;
    }
  }

  .addm__list {
    display: flex;
    flex-direction: column;
    max-height: 360px;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  .addm__row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 52px;
    padding: 6px 4px;
    color: var(--m3d-text);
    text-align: left;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .addm__own {
    width: 100%;
    border-radius: 12px;

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .addm__plus {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--m3d-surface-2);
  }

  .addm__swatch {
    flex: none;
    width: 14px;
    height: 14px;
    margin: 0 7px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
  }

  .addm__text {
    flex: 1 1 auto;
    min-width: 0;

    b {
      display: block;
      font-size: 14px;
      font-weight: 600;
    }

    span {
      display: block;
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .addm__icon {
    display: inline-flex;
    padding: 8px;
    border-radius: 10px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-hover);
    }
  }

  .addm__added {
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .addm__note {
    margin: 4px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
