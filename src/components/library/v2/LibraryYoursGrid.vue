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
          ‹ Yours
        </button>
        <h1>{{ title }}</h1>
        <p
          class="mlib-muted"
          aria-live="polite"
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
            v-model="query"
            type="search"
            :placeholder="`Search ${title}`"
            :aria-label="`Search ${title}`"
            maxlength="64"
            data-tid="library-grid-find"
          >
        </label>
        <div
          class="mlib-seg"
          role="group"
          aria-label="Sort"
        >
          <button
            v-for="s in sorts"
            :key="s.id"
            type="button"
            class="mlib-seg__btn"
            :class="{ 'mlib-seg__btn--on': sort === s.id }"
            :aria-pressed="sort === s.id ? 'true' : 'false'"
            :data-tid="`library-grid-sort-${s.id}`"
            @click="sort = s.id"
          >
            {{ s.label }}
          </button>
        </div>
      </div>
    </header>

    <div
      v-if="busy && !count"
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
      v-else-if="error"
      kind="error"
      icon="alert"
      :title="error"
      action="Try again"
      primary
      tid="library-grid-error"
      @action="load"
    />

    <library-state
      v-else-if="!count"
      icon="library"
      :title="`Nothing in ${title} yet`"
      tid="library-grid-empty"
    />

    <library-state
      v-else-if="!shownCount"
      icon="filter"
      :title="`Nothing in ${title} matches “${query.trim()}”`"
      text="Clear the search to see everything here."
      action="Clear search"
      tid="library-grid-nomatch"
      @action="query = ''"
    />

    <div
      v-else
      class="mgrid__grid"
      data-tid="library-grid-cards"
    >
      <template v-if="source === 'saved'">
        <library-model-card
          v-for="card in shownSaved"
          :key="card.key"
          :card="card"
          :printer-name="printerName"
          :busy="printing === card.key"
          @print="$emit('print', $event)"
          @open="$emit('open', $event)"
        />
      </template>
      <template v-else>
        <library-own-card
          v-for="card in shownOwn"
          :key="card.key"
          :card="card"
          :printer-name="printerName"
          @act="$emit('own-act', $event)"
          @open="$emit('own-open', $event)"
        />
      </template>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import LibraryModelCard from './LibraryModelCard.vue'
import LibraryOwnCard from './LibraryOwnCard.vue'
import LibraryState from './LibraryState.vue'
import { describeLibraryError, type CommunitySave } from '@/services/library/api'
import { libraryClient, libraryItems } from '@/services/library/store'
import { cardMatches, saveCard, type ShelfCard } from '@/services/library/shelves'
import { findOwn, loadOwnShelf, OWN_SHELVES, type OwnCard, type OwnShelfId, type OwnSort } from '@/services/library/yours'

export type YoursGridSource = OwnShelfId | 'saved'

export const YOURS_GRIDS: YoursGridSource[] = ['sliced', 'printed', 'saved', 'shared', 'designs']

/**
 * See all for a Yours shelf (Library v3, page 3): every print on it as one
 * grid, with search and sort (newest first, or by name). ‹ Yours goes back.
 */
@Component({ components: { LibraryModelCard, LibraryOwnCard, LibraryState } })
export default class LibraryYoursGrid extends Vue {
  @Prop({ type: String, required: true }) readonly source!: YoursGridSource
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: String, default: '' }) readonly printing!: string

  own: OwnCard[] = []
  saved: ShelfCard[] = []
  busy = false
  error = ''
  query = ''
  sort: OwnSort = 'new'
  sorts: Array<{ id: OwnSort, label: string }> = [{ id: 'new', label: 'Newest' }, { id: 'name', label: 'Name' }]
  private reads = 0

  @Watch('source', { immediate: true })
  onSource () {
    this.query = ''
    this.load()
  }

  async load () {
    const read = ++this.reads
    this.busy = true
    this.error = ''
    this.own = []
    this.saved = []
    try {
      if (this.source === 'saved') {
        const page = await libraryClient().saved()
        if (read !== this.reads) return
        this.saved = (Array.isArray(page.saves) ? page.saves : [] as CommunitySave[]).map(saveCard).filter((c): c is ShelfCard => !!c)
      } else {
        const cards = await loadOwnShelf(this.source, libraryClient(), libraryItems())
        if (read !== this.reads) return
        this.own = cards
      }
    } catch (error) {
      if (read === this.reads) this.error = describeLibraryError(error)
    } finally {
      if (read === this.reads) this.busy = false
    }
  }

  /** Your prints arrived (or changed): a share can now show the print it is. */
  get itemCount (): number {
    return libraryItems().length
  }

  @Watch('itemCount')
  onItems () {
    if (this.source === 'shared') this.load()
  }

  get title (): string {
    return this.source === 'saved' ? 'Saved' : OWN_SHELVES.find(s => s.id === this.source)?.title ?? 'Yours'
  }

  get count (): number {
    return this.source === 'saved' ? this.saved.length : this.own.length
  }

  get shownOwn (): OwnCard[] {
    return findOwn(this.own, this.query, this.sort)
  }

  /** Saved keeps the order you saved in (newest first); Name sorts it. */
  get shownSaved (): ShelfCard[] {
    const q = this.query.trim()
    const found = q ? this.saved.filter(card => cardMatches(card, q)) : this.saved
    return this.sort === 'name' ? [...found].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })) : found
  }

  get shownCount (): number {
    return this.source === 'saved' ? this.shownSaved.length : this.shownOwn.length
  }

  get countLine (): string {
    if (this.busy && !this.count) return ''
    const n = this.query.trim() ? this.shownCount : this.count
    return `${n} ${n === 1 ? 'print' : 'prints'}${this.query.trim() ? ` match “${this.query.trim()}”` : ''}`
  }
}
</script>
