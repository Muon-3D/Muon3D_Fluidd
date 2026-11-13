<template>
  <section
    class="mc-browse"
    :data-tid="query ? 'library-grid-search' : 'library-category-page'"
  >
    <header class="mc-browse__head">
      <div>
        <button
          type="button"
          class="mlib-link"
          @click="$emit('back')"
        >
          ‹ Discover
        </button>
        <p class="mlib-eyebrow">
          {{ query ? 'Find your next project' : 'Explore the Library' }}
        </p>
        <h1
          ref="heading"
          tabindex="-1"
        >
          {{ query ? `Results for “${query}”` : selected ? selected.name : 'Made for your everyday' }}
        </h1>
        <p class="mlib-muted">
          {{ selected ? selected.description : query ? 'Original ideas, shared by their makers.' : 'A useful little print. A new hobby. Start with a category.' }}
        </p>
      </div>
      <library-search-box
        :value="query"
        tid="library-grid-find"
        :instant="!!query"
        @search="$emit('search', $event)"
        @open="openSummary"
      />
    </header>
    <div
      v-if="!category && !query"
      class="mc-browse__categories"
      data-tid="library-categories"
    >
      <template v-if="categoryBusy">
        <span
          v-for="n in 9"
          :key="n"
          class="mlib-skeleton mc-category"
          aria-hidden="true"
        /><span
          class="mlib-hidden"
          role="status"
        >Loading categories</span>
      </template>
      <button
        v-for="c in categories"
        :key="c.slug"
        type="button"
        class="mc-category"
        :data-tid="`library-category-${c.slug}`"
        @click="$emit('category', c.slug)"
      >
        <img
          v-if="categoryPicture(c.slug)"
          :src="categoryPicture(c.slug) || undefined"
          width="160"
          height="160"
          alt=""
        >
        <span><strong>{{ c.name }}</strong><small>{{ c.count === null ? 'Explore' : `${c.count} ${c.count === 1 ? 'model' : 'models'}` }}</small></span>
      </button>
    </div>
    <library-state
      v-if="!category && !query && !categoryBusy && !categories.length && !categoryError"
      title="New ideas are on their way"
      text="There are no categories to explore yet. Discover is a good place to start."
      action="Discover"
      @action="$emit('back')"
    />
    <template v-else-if="category || query">
      <form
        class="mc-browse__filters"
        aria-label="Browse filters"
        @submit.prevent="load(true)"
      >
        <label>Sort<select
          v-model="filters.sort"
          aria-label="Sort models"
          @change="load(true)"
        ><option
          v-for="s in sorts"
          :key="s"
          :value="s"
        >{{ s.charAt(0).toUpperCase() + s.slice(1) }}</option></select></label>
        <label
          v-if="volume"
          class="mc-browse__fit"
        ><input
          v-model="fits"
          :disabled="legacy"
          type="checkbox"
          @change="load(true)"
        > Fits {{ printerName || 'this printer' }}</label>
        <details>
          <summary
            class="mlib-chip"
            data-tid="library-browse-filters"
          >
            Refine your search
          </summary>
          <fieldset
            class="mc-browse__refine"
            :disabled="legacy"
          >
            <label>Material<select
              v-model="filters.material"
              aria-label="Material"
            ><option value="">Any material</option><option>PLA</option><option>PETG</option><option>ABS</option><option>TPU</option></select></label>
            <label>Licence<select
              v-model="filters.licence"
              aria-label="Licence"
            ><option value="">Any licence</option><option>CC0-1.0</option><option>CC-BY-4.0</option><option>CC-BY-SA-4.0</option><option>CC-BY-NC-4.0</option></select></label>
            <label>Minimum size (mm)<input
              v-model="filters.min_size"
              aria-label="Minimum size in millimetres"
              type="number"
              min="0.1"
              max="2000"
              step="0.1"
            ></label>
            <label>Maximum size (mm)<input
              v-model="filters.max_size"
              aria-label="Maximum size in millimetres"
              type="number"
              min="0.1"
              max="2000"
              step="0.1"
            ></label>
            <label>Minimum time (minutes)<input
              v-model="minMinutes"
              aria-label="Minimum time in minutes"
              type="number"
              min="0"
              max="525600"
            ></label>
            <label>Maximum time (minutes)<input
              v-model="maxMinutes"
              aria-label="Maximum time in minutes"
              type="number"
              min="0"
              max="525600"
            ></label>
            <label v-if="ratings">Minimum rating<input
              v-model="filters.rating"
              aria-label="Minimum rating"
              type="number"
              min="1"
              max="5"
              step="0.5"
            ></label>
            <button
              type="submit"
              class="mlib-btn mlib-btn--primary"
            >
              Apply filters
            </button>
            <button
              type="button"
              class="mlib-btn"
              @click="clear"
            >
              Reset filters
            </button>
          </fieldset>
        </details>
      </form>
      <p
        v-if="legacy"
        class="mlib-muted"
        role="status"
      >
        This service shows its newest models. Advanced filters need the catalogue update.
      </p>
      <library-state
        v-if="query && query.trim().length < 2"
        icon="search"
        title="Search for two letters or more"
        text="Type a model, a maker or a tag."
        tid="library-grid-short"
      />
      <div
        v-else-if="busy && !cards.length"
        class="mc-browse__grid"
        role="status"
      >
        <span class="mlib-hidden">Loading models</span><span
          v-for="n in 8"
          :key="n"
          class="mlib-skeleton-card"
        ><span class="mlib-skeleton" /><span class="mlib-skeleton mlib-skeleton--line" /></span>
      </div>
      <library-state
        v-else-if="error"
        kind="error"
        :title="error"
        action="Try again"
        tid="library-grid-error"
        @action="load(true)"
      />
      <div
        v-else-if="!cards.length"
        class="mc-browse__empty"
        data-tid="library-grid-empty"
      >
        <library-state
          icon="search"
          :title="legacy && query ? 'No match among the newest models' : query ? `Nothing found for “${query}”` : 'Make room for something new'"
          :text="help ? help.message : 'Try fewer filters or explore another category.'"
          action="Reset filters"
          @action="clear"
        />
        <div class="mlib-chips">
          <button
            v-for="c in help ? help.categories : categories.slice(0, 4)"
            :key="c.slug"
            type="button"
            class="mlib-chip"
            @click="$emit('category', c.slug)"
          >
            {{ c.name }}
          </button>
        </div>
      </div>
      <template v-else>
        <p
          class="mlib-muted"
          aria-live="polite"
          data-tid="library-grid-count"
        >
          {{ cards.length }}{{ cursor ? '+' : '' }} models{{ busy ? ' · Updating' : '' }}
        </p>
        <div
          class="mc-browse__grid"
          data-tid="library-grid-cards"
        >
          <library-model-card
            v-for="card in cards"
            :key="card.key"
            :card="card"
            :printer-name="printerName"
            :busy="printing === card.key"
            @open="$emit('open', $event)"
            @print="$emit('print', $event)"
          />
        </div>
        <button
          v-if="cursor"
          type="button"
          class="mlib-btn mlib-more"
          :disabled="busy"
          data-tid="library-grid-more"
          @click="load(false)"
        >
          {{ busy ? 'Loading' : 'Load more' }}
        </button>
      </template>
    </template>
    <library-state
      v-if="categoryError"
      kind="callout"
      :title="categoryError"
      action="Try again"
      @action="readCategories"
    />
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import LibrarySearchBox from './LibrarySearchBox.vue'
import LibraryModelCard from './LibraryModelCard.vue'
import LibraryState from './LibraryState.vue'
import { browse, categories, type Category, type CatalogueFilters, type BrowsePage } from '@/services/library/catalogue'
import { isNetworkError, summaryCard, type ShelfCard, type PublicationSummary } from '@/services/library/shelves'

@Component({ components: { LibrarySearchBox, LibraryModelCard, LibraryState } })
export default class LibraryBrowsePage extends Vue {
  @Prop({ type: String, default: null }) readonly category!: string | null
  @Prop({ type: String, default: '' }) readonly query!: string
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: Object, default: null }) readonly volume!: { x: number, y: number, z: number } | null
  @Prop({ type: Array, default: () => [] }) readonly pictures!: ShelfCard[]
  @Prop({ type: String, default: '' }) readonly printing!: string
  categories: Category[] = []
  cards: ShelfCard[] = []
  cursor: string | null = null
  help: BrowsePage['help'] = null
  busy = false
  error = ''
  categoryError = ''
  categoryBusy = true
  ratings = false
  legacy = false
  fits = false
  minMinutes = ''
  maxMinutes = ''
  filters: CatalogueFilters = { sort: 'new' }
  sorts = ['relevance', 'popular', 'new', 'trending']
  controller: AbortController | null = null
  categoryController = new AbortController()
  created () { this.readCategories() }
  get selected (): Category | undefined { return this.categories.find(c => c.slug === this.category) }
  categoryPicture (slug: string): string | null { return this.pictures.find(c => c.category === slug && c.picture)?.picture ?? null }
  openSummary (item: PublicationSummary) { this.$emit('open', summaryCard(item)) }
  async readCategories () { this.categoryError = ''; this.categoryBusy = true; try { this.categories = await categories(this.categoryController.signal) } catch (e) { if (!this.categoryController.signal.aborted) this.categoryError = e instanceof Error ? e.message : String(e) } finally { if (!this.categoryController.signal.aborted) this.categoryBusy = false } }
  mounted () { this.focusHeading() }
  @Watch('category') focusHeading () { this.$nextTick(() => (this.$refs.heading as HTMLElement | undefined)?.focus()) }
  @Watch('volume') volumeChanged () { if (this.fits) this.load(true) }
  @Watch('category', { immediate: true })
  @Watch('query')
  changed () { this.filters = { sort: this.query ? 'relevance' : 'new' }; this.minMinutes = this.maxMinutes = ''; this.load(true) }

  clear () { this.filters = { sort: this.query ? 'relevance' : 'new' }; this.fits = false; this.minMinutes = this.maxMinutes = ''; this.load(true) }
  async load (fresh: boolean) {
    this.controller?.abort()
    if (!this.category && !this.query) { this.cards = []; this.cursor = null; this.busy = false; return }
    if (this.query && this.query.trim().length < 2) { this.cards = []; this.cursor = null; this.busy = false; return }
    const controller = this.controller = new AbortController()
    if (fresh) { this.cards = []; this.cursor = null }
    this.busy = true
    this.error = ''
    const filters = { ...this.filters, fits: this.fits && this.volume ? `${this.volume.x},${this.volume.y},${this.volume.z}` : undefined, min_seconds: this.minMinutes ? String(Number(this.minMinutes) * 60) : undefined, max_seconds: this.maxMinutes ? String(Number(this.maxMinutes) * 60) : undefined }
    try {
      const page = await browse(this.category, this.query, filters, this.cursor, controller.signal)
      if (controller.signal.aborted) return
      this.cards = [...this.cards, ...page.cards.filter(c => !this.cards.some(old => old.key === c.key))]
      this.cursor = page.cursor; this.help = page.help; this.ratings = page.ratings; this.legacy = page.legacy
    } catch (e) { if (!controller.signal.aborted) this.error = isNetworkError(e) ? 'The Library couldn\'t be reached. Check the connection and try again.' : e instanceof Error ? e.message : String(e) } finally { if (!controller.signal.aborted) this.busy = false }
  }

  beforeDestroy () { this.controller?.abort(); this.categoryController.abort() }
}
</script>

<style lang="scss">
.mc-browse {
  display: flex; flex-direction: column; gap: 28px;
  button, input, select { scroll-margin-block: 80px; }
  &__head { display: flex; justify-content: space-between; gap: 24px; align-items: flex-end; h1 { font-family: var(--m3d-font-title); font-size: clamp(28px, 3vw, 40px); line-height: 1.15; margin: 8px 0 12px; } p { max-width: 48ch; margin: 12px 0 0; } .mc-search { width: 340px; flex: none; } }
  &__categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
  &__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 28px 20px; }
  &__filters { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; label { display: flex; flex-direction: column; gap: 6px; color: var(--m3d-text-muted); font-size: var(--m3d-text-xs); } select, input[type='number'] { min-height: 42px; padding: 8px 12px; border-radius: var(--m3d-radius-sm); background: var(--m3d-fill); color: var(--m3d-text); max-width: 100%; } summary { cursor: pointer; min-height: 44px; } details { margin-left: auto; } details[open] { flex: 1 0 100%; margin-left: 0; } }
  &__filters &__fit { flex-direction: row; align-items: center; gap: 8px; font-size: var(--m3d-text-sm); input { width: 18px; height: 18px; accent-color: var(--m3d-accent); } }
  &__refine { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 20px; background: var(--m3d-surface); border-radius: var(--m3d-radius-md); padding: 24px; margin-top: 16px; align-items: end; }
  &__empty { padding: 32px 0; .mlib-chips { justify-content: center; } }
}
.mc-category { display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; padding: 20px; min-height: 150px; border-radius: var(--m3d-radius-md); background: var(--m3d-surface); box-shadow: var(--m3d-shadow-sm); img { object-fit: contain; width: 100px; height: 100px; } strong, small { display: block; } strong { font-size: var(--m3d-text-lg); } small { margin-top: 6px; color: var(--m3d-text-muted); } }
@media (max-width: 760px) { .mc-browse { &__head { flex-direction: column; align-items: stretch; .mc-search { width: 100%; } } &__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 12px; } &__categories { grid-template-columns: 1fr; } &__refine { padding: 16px; } } }
</style>
