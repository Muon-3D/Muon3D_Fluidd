<template>
  <section
    class="mgrid"
    :data-tid="`library-grid-${source}`"
    :aria-label="title"
  >
    <header class="mgrid__head">
      <div class="mgrid__titles">
        <button
          type="button"
          class="mlib-link mgrid__back"
          data-tid="library-grid-back"
          @click="$emit('back')"
        >
          ‹ Discover
        </button>
        <h1>{{ title }}</h1>
        <p
          class="mlib-muted"
          data-tid="library-grid-count"
        >
          {{ countLine }}
        </p>
      </div>
      <div class="mgrid__acts">
        <label class="mlib-search mgrid__search">
          <frame-icon
            name="search"
            small
          />
          <input
            v-model="draft"
            type="search"
            :placeholder="source === 'search' ? 'Search prints, makers, tags' : `Search ${title}`"
            :aria-label="source === 'search' ? 'Search the Library' : `Search ${title}`"
            data-tid="library-grid-find"
            @keydown.enter="submit"
          >
        </label>
        <div
          v-if="source !== 'search'"
          class="mlib-seg"
          role="tablist"
          aria-label="Sort"
        >
          <button
            v-for="s in sorts"
            :key="s.id"
            type="button"
            role="tab"
            class="mlib-seg__btn"
            :class="{ 'mlib-seg__btn--on': source === s.id }"
            :aria-selected="source === s.id ? 'true' : 'false'"
            :data-tid="`library-grid-sort-${s.id}`"
            @click="$emit('update:source', s.id)"
          >
            {{ s.label }}
          </button>
        </div>
      </div>
    </header>

    <div
      class="mlib-chips"
      role="group"
      aria-label="Filter"
    >
      <button
        type="button"
        class="mlib-chip"
        :class="{ 'mlib-chip--on': fits }"
        :aria-pressed="fits ? 'true' : 'false'"
        data-tid="library-grid-chip-fits"
        @click="fits = !fits"
      >
        <frame-icon
          v-if="fits"
          name="check"
          small
        />
        {{ fitsLabel }}
      </button>
      <button
        v-for="c in categories"
        :key="c.id"
        type="button"
        class="mlib-chip"
        :class="{ 'mlib-chip--on': category === c.id }"
        :aria-pressed="category === c.id ? 'true' : 'false'"
        :data-tid="`library-grid-chip-${c.id}`"
        @click="category = c.id"
      >
        {{ c.label }}
      </button>
    </div>

    <div
      v-if="busy && !cards.length"
      class="mgrid__grid"
      role="status"
    >
      <span class="mlib-hidden">Loading {{ title }}</span>
      <span
        v-for="n in 8"
        :key="n"
        class="mlib-skeleton-card"
      >
        <span class="mlib-skeleton" />
        <span class="mlib-skeleton mlib-skeleton--line" />
      </span>
    </div>

    <library-state
      v-else-if="error && !cards.length"
      kind="error"
      icon="alert"
      :title="error"
      action="Try again"
      primary
      tid="library-grid-error"
      @action="load(true)"
    />

    <library-state
      v-else-if="!cards.length"
      icon="search"
      :title="emptyTitle"
      :text="emptyText"
      tid="library-grid-empty"
    />

    <library-state
      v-else-if="!shown.length"
      icon="filter"
      :title="noMatchTitle"
      text="Clear the filter to see everything here."
      action="Clear filter"
      tid="library-grid-nomatch"
      @action="clearFilter"
    />

    <template v-else>
      <div
        class="mgrid__grid"
        data-tid="library-grid-cards"
      >
        <library-model-card
          v-for="card in shown"
          :key="card.key"
          :card="card"
          :printer-name="printerName"
          :busy="printing === card.key"
          @print="$emit('print', $event)"
          @open="$emit('open', $event)"
        />
      </div>
      <library-state
        v-if="error"
        kind="callout"
        :title="error"
        action="Retry"
        tid="library-grid-more-error"
        @action="more"
      />
      <button
        v-else-if="cursor"
        type="button"
        class="mlib-btn mlib-more"
        :disabled="busy"
        data-tid="library-grid-more"
        @click="more"
      >
        {{ busy ? 'Loading…' : 'Load more' }}
      </button>
    </template>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import LibraryModelCard from './LibraryModelCard.vue'
import LibraryState from './LibraryState.vue'
import { cardMatches, loadGrid, type GridSource, type ShelfCard } from '@/services/library/shelves'

const TITLES: Record<GridSource, string> = {
  popular: 'Popular',
  m1: 'Made for M1',
  new: 'New',
  search: 'Search'
}

/**
 * See all (Library v3 page 3) and search results (page 4): one grid page
 * for every Discover shelf and for a search. Its header goes back, names
 * the list and says how many are shown; search and sort sit at the right;
 * the filters are the same chips as Discover; Load more reads the next
 * page. The host keeps the source and the search in the address.
 */
@Component({ components: { LibraryModelCard, LibraryState } })
export default class LibraryGridPage extends Vue {
  @Prop({ type: String, required: true }) readonly source!: GridSource
  @Prop({ type: String, default: '' }) readonly query!: string
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: Boolean, default: false }) readonly fitsFirst!: boolean
  @Prop({ type: String, default: 'Made for M1' }) readonly fitsLabel!: string
  @Prop({ type: Array, required: true }) readonly categories!: Array<{ id: string, label: string }>
  @Prop({ type: String, default: '' }) readonly printing!: string

  cards: ShelfCard[] = []
  cursor: string | null = null
  busy = false
  error = ''
  local = false
  draft = ''
  fits = false
  category = 'all'
  private reads = 0
  sorts: Array<{ id: GridSource, label: string }> = [{ id: 'popular', label: 'Popular' }, { id: 'new', label: 'New' }, { id: 'm1', label: 'Made for M1' }]

  created () {
    this.fits = this.fitsFirst
    this.draft = this.source === 'search' ? this.query : ''
  }

  get title (): string {
    return this.source === 'search' ? `"${this.query}"` : TITLES[this.source]
  }

  /** On a search, the box asks the service; elsewhere it filters what is here. */
  get filterWords (): string {
    return this.source === 'search' ? '' : this.draft
  }

  get shown (): ShelfCard[] {
    return this.cards.filter(card =>
      (!this.fits || card.m1) &&
      (this.category === 'all' || (card.category || 'other') === this.category) &&
      cardMatches(card, this.filterWords))
  }

  get countLine (): string {
    if (this.busy && !this.cards.length) return 'Loading…'
    const n = this.shown.length
    const what = `${n}${this.cursor ? '+' : ''} ${n === 1 ? 'print' : 'prints'}`
    if (this.source === 'search') return `${what} for "${this.query}"${this.local ? ', among the newest' : ''}`
    return what
  }

  get emptyTitle (): string {
    return this.source === 'search' ? `Nothing found for "${this.query}"` : `Nothing in ${this.title} yet`
  }

  get emptyText (): string {
    return this.source === 'search' ? 'Try another word, or a maker\'s name.' : 'Prints appear here as people share them.'
  }

  get noMatchTitle (): string {
    const category = this.categories.find(c => c.id === this.category && c.id !== 'all')
    const parts = [this.fits ? this.fitsLabel : '', category ? category.label : '', this.filterWords.trim() ? `"${this.filterWords.trim()}"` : ''].filter(Boolean)
    return `Nothing here with ${parts.join(' and ')}`
  }

  clearFilter () {
    this.fits = false
    this.category = 'all'
    if (this.source !== 'search') this.draft = ''
  }

  submit () {
    const q = this.draft.trim()
    if (q) this.$emit('update:query', q)
  }

  @Watch('source', { immediate: true })
  @Watch('query')
  onList () {
    if (this.source === 'search') this.draft = this.query
    this.load(true)
  }

  async load (fresh: boolean) {
    const read = ++this.reads
    if (fresh) {
      this.cards = []
      this.cursor = null
      this.local = false
    }
    this.busy = true
    this.error = ''
    try {
      const page = await loadGrid(this.source, { cursor: fresh ? null : this.cursor, query: this.query })
      if (read !== this.reads) return
      const seen = new Set(this.cards.map(card => card.key))
      this.cards = [...this.cards, ...page.cards.filter(card => !seen.has(card.key))]
      this.cursor = page.cursor
      this.local = !!page.local
    } catch (error) {
      if (read === this.reads) this.error = error instanceof Error ? error.message : String(error)
    } finally {
      if (read === this.reads) this.busy = false
    }
  }

  more () {
    if (!this.busy && (this.cursor || this.error)) this.load(false)
  }
}
</script>

<style lang="scss">
.mgrid {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  &__titles {
    h1 { margin: 2px 0 0; font-family: var(--m3d-font-title, var(--m3d-font-sans)); font-size: 28px; font-weight: 700; }
    p { margin: 4px 0 0; font-size: var(--m3d-text-sm); }
  }

  &__back { font-size: var(--m3d-text-sm); }
  &__acts { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  &__search { width: 280px; max-width: 100%; }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--mlib-gap, 16px);
  }

  .mlib--phone & {
    &__grid { grid-template-columns: 1fr 1fr; }
    &__acts, &__search { width: 100%; }
  }
}
</style>
