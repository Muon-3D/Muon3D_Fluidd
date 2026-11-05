<template>
  <div
    class="mlib"
    :class="[`mlib--${context}`, { 'mlib--phone': phone }]"
    data-tid="muon-library"
  >
    <!-- The two places, search and filters. No creator row, no page tabs. -->
    <header class="mlib__head">
      <div class="mlib__titles">
        <h1 v-if="context === 'page'">
          Library
        </h1>
        <div
          class="mlib-seg"
          role="tablist"
          aria-label="Library"
          data-tid="library-views"
        >
          <button
            v-for="t in tabs"
            :key="t.id"
            type="button"
            role="tab"
            class="mlib-seg__btn"
            :class="{ 'mlib-seg__btn--on': tab === t.id }"
            :aria-selected="tab === t.id ? 'true' : 'false'"
            :data-tid="`library-view-${t.id === 'yours' ? 'mine' : t.id}`"
            @click="setTab(t.id)"
          >
            {{ t.label }}
          </button>
        </div>
      </div>
      <label
        v-if="tab === 'discover'"
        class="mlib-search"
      >
        <frame-icon
          name="search"
          small
        />
        <input
          v-model="query"
          type="search"
          placeholder="Search models, makers, tags"
          aria-label="Search Discover"
          data-tid="library-discover-find"
        >
      </label>
      <slot
        v-else
        name="yours-search"
      />
      <div
        v-if="tab === 'discover'"
        class="mlib-chips"
        role="group"
        aria-label="Filter"
      >
        <button
          v-for="c in chips"
          :key="c.id"
          type="button"
          class="mlib-chip"
          :class="{ 'mlib-chip--on': chip === c.id }"
          :aria-pressed="chip === c.id ? 'true' : 'false'"
          :data-tid="`library-discover-chip-${c.id}`"
          @click="chip = c.id"
        >
          <frame-icon
            v-if="c.id === 'fits'"
            name="check"
            small
          />
          {{ c.label }}
        </button>
      </div>
    </header>

    <!-- Continue: the print you last saved, one tap to print it again. -->
    <section
      v-if="continueItem"
      class="mlib-continue"
      aria-label="Continue"
      data-tid="library-continue"
    >
      <img
        v-if="continuePicture"
        :src="continuePicture"
        alt=""
        class="mlib-continue__img"
      >
      <span
        v-else
        class="mlib-continue__img mlib-continue__img--blank"
      ><frame-icon name="library" /></span>
      <div class="mlib-continue__text">
        <span class="mlib-eyebrow">Continue</span>
        <strong>{{ continueItem.name }}</strong>
        <span class="mlib-muted">{{ continueFacts }}</span>
      </div>
      <div class="mlib-continue__acts">
        <button
          type="button"
          class="mlib-btn mlib-btn--primary"
          data-tid="library-continue-print"
          @click="$emit('print-item', continueItem)"
        >
          <frame-icon
            name="printer"
            small
          />
          {{ printerName ? `Print again on ${printerName}` : 'Print again' }}
        </button>
      </div>
    </section>

    <!-- DISCOVER -->
    <template v-if="tab === 'discover'">
      <div
        v-if="busy"
        class="mlib-shelf__row"
        role="status"
        aria-busy="true"
      >
        <span class="mlib-hidden">Loading Discover</span>
        <span
          v-for="n in 5"
          :key="n"
          class="mlib-skeleton"
        />
      </div>

      <section
        v-else-if="error"
        class="mlib-empty"
        role="alert"
      >
        <h2>Discover didn't answer</h2>
        <p>{{ error }}</p>
        <div class="mlib-empty__acts">
          <button
            type="button"
            class="mlib-btn"
            @click="load"
          >
            Try again
          </button>
          <a
            :href="libraryUrl"
            target="_blank"
            rel="noopener"
            class="mlib-btn"
          >Open library.muon3d.com ↗</a>
        </div>
      </section>

      <template v-else>
        <section
          v-for="shelf in visibleShelves"
          :key="shelf.id"
          class="mlib-shelf"
          :data-tid="`library-shelf-${shelf.id}`"
        >
          <header class="mlib-shelf__head">
            <h2>{{ shelf.title }}</h2>
            <span class="mlib-muted">{{ shelf.sub }}</span>
            <a
              :href="shelf.more"
              target="_blank"
              rel="noopener"
              class="mlib-link"
            >See all</a>
          </header>
          <div class="mlib-shelf__row">
            <library-model-card
              v-for="card in shelf.cards"
              :key="card.key"
              :card="card"
              :printer-name="printerName"
              :busy="printing === card.key"
              @print="print"
              @open="open"
            />
          </div>
        </section>

        <section
          v-if="!visibleShelves.length && !posts.length"
          class="mlib-empty"
          data-tid="library-discover-empty"
        >
          <h2>{{ query || chip !== 'all' ? 'Nothing matches' : 'Nothing to discover yet' }}</h2>
          <p>{{ query || chip !== 'all' ? 'Try another word or filter.' : 'Prints people share, and the ones we test on the M1, appear here.' }}</p>
        </section>

        <!-- The feed: what people share, newest first, below the shelves. -->
        <section
          v-if="visiblePosts.length"
          class="mlib-shelf"
          data-tid="library-feed"
        >
          <header class="mlib-shelf__head">
            <h2>From the community</h2>
            <span class="mlib-muted">What people are sharing for their M1s</span>
          </header>
          <div class="mlib-feed">
            <article
              v-for="(p, i) in visiblePosts"
              :key="p.key"
              class="mlib-post"
              :class="{ 'mlib-post--tall': i % 3 === 0 }"
              :data-tid="`library-post-${p.card.id}`"
            >
              <header class="mlib-post__by">
                <span
                  class="mlib-ava"
                  :style="{ background: colourOf(p.card.creator) }"
                >{{ initials(p.card.creator) }}</span>
                <span><strong>{{ p.card.creator }}</strong> {{ p.verb }} <a
                  href="#"
                  @click.prevent="open(p.card)"
                >{{ p.card.title }}</a><template v-if="p.card.remixOf"> from {{ p.card.remixOf.title }}</template></span>
                <span class="mlib-muted mlib-post__when">{{ ago(p.card.createdAt) }}</span>
              </header>
              <button
                type="button"
                class="mlib-post__pic"
                :aria-label="`Quick look at ${p.card.title}`"
                @click="open(p.card)"
              >
                <img
                  v-if="p.card.picture"
                  :src="p.card.picture"
                  alt=""
                  loading="lazy"
                >
                <span
                  v-if="p.card.m1"
                  class="mlib-badge mlib-badge--glass"
                >Made for M1</span>
              </button>
              <footer class="mlib-post__foot">
                <span
                  v-if="p.card.makes"
                  class="mlib-stat"
                ><frame-icon
                  name="printer"
                  small
                />{{ p.card.makes }} made</span>
                <span
                  v-if="p.card.remixes"
                  class="mlib-stat"
                ><frame-icon
                  name="copy"
                  small
                />{{ p.card.remixes }} {{ p.card.remixes === 1 ? 'remix' : 'remixes' }}</span>
                <span class="mlib-grow" />
                <button
                  type="button"
                  class="mlib-btn mlib-btn--sm mlib-btn--tint"
                  @click="print(p.card)"
                >
                  <frame-icon
                    name="printer"
                    small
                  />
                  Print this
                </button>
              </footer>
            </article>
          </div>
          <button
            v-if="feedCursor"
            ref="more"
            type="button"
            class="mlib-btn mlib-more"
            :disabled="feedBusy"
            data-tid="library-feed-more"
            @click="loadMore"
          >
            {{ feedBusy ? 'Loading…' : 'Show more' }}
          </button>
        </section>
      </template>
    </template>

    <!-- YOURS: the host's own Library (sign in, sections, your prints). -->
    <slot
      v-else
      name="yours"
    />

    <library-quick-look
      v-if="looking"
      :card="looking"
      :printer-name="printerName"
      @close="looking = null"
      @print="printFromLook"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import LibraryModelCard from './LibraryModelCard.vue'
import LibraryQuickLook from './LibraryQuickLook.vue'
import type { LibraryItem } from '@/services/library/api'
import { LIBRARY_URL } from '@/services/library/discover'
import { lastEvent, nozzleText, printFacts } from '@/services/library/format'
import { thumbnailFor } from '@/services/library/thumbnails'
import { ago, loadFeedPage, loadPublication, loadShelves, publicationPrint, type FeedPost, type PublicationPrint, type ShelfCard } from '@/services/library/shelves'

export type LibraryTab = 'discover' | 'yours'

/** What the host is asked to do with a card: it does the send (Control: Print on…). */
export interface LibraryPrintRequest {
  modelId: string;
  printerId: string | null;
  card: ShelfCard;
  /** The publication as Print on… takes it, when the quick look has read it. */
  print: PublicationPrint | null;
}

const PALETTE = ['#ff9f0a', '#ff453a', '#64d2ff', '#30d158', '#bf5af2', '#80d6d1', '#ffd60a']

/**
 * The Library (Library v2, Jack 5 Nov 2026, option 2): one component for
 * the Library page and for Control's printer page. Discover is shelves
 * (Popular this week, Made for M1) and a feed below them; Yours is the
 * host's (a slot), so Control keeps its own sign-in and sections. A card
 * prints from where it is, through the host: `print` and `print-item`.
 * No router in here; it sizes to its container.
 */
@Component({ components: { LibraryModelCard, LibraryQuickLook } })
export default class MuonLibrary extends Vue {
  @Prop({ type: String, default: 'page' }) readonly context!: 'page' | 'control'
  @Prop({ type: String, default: null }) readonly printerId!: string | null
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: String, default: 'M1' }) readonly printerModel!: string
  @Prop({ type: Object, default: null }) readonly buildVolume!: { x: number, y: number, z: number } | null
  /** Which place is shown: the host owns it (Control keeps it in the address). */
  @Prop({ type: String, default: 'discover' }) readonly tab!: LibraryTab
  /** The print to continue with (the last one saved), or none. */
  @Prop({ type: Object, default: null }) readonly continueItem!: LibraryItem | null

  query = ''
  chip = 'all'
  busy = true
  error = ''
  popular: ShelfCard[] = []
  m1: ShelfCard[] = []
  posts: FeedPost[] = []
  feedCursor: string | null = null
  feedBusy = false
  looking: ShelfCard | null = null
  /** The card whose print is being read, for Print. */
  printing = ''
  libraryUrl = LIBRARY_URL
  ago = ago
  tabs: Array<{ id: LibraryTab, label: string }> = [{ id: 'discover', label: 'Discover' }, { id: 'yours', label: 'Yours' }]
  controller: AbortController | null = null
  observer: IntersectionObserver | null = null

  created () {
    // In Control, open on what this printer can print.
    if (this.printerName && this.isM1) this.chip = 'fits'
    this.load()
  }

  mounted () {
    if (typeof IntersectionObserver === 'undefined') return
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) this.loadMore()
    }, { rootMargin: '600px' })
    this.$watch(() => this.$refs.more, (el) => {
      this.observer?.disconnect()
      if (el) this.observer?.observe(el as Element)
    }, { immediate: true })
  }

  beforeDestroy () {
    this.controller?.abort()
    this.observer?.disconnect()
  }

  get phone (): boolean {
    return this.$vuetify.breakpoint.xsOnly
  }

  get isM1 (): boolean {
    return /\bM1\b/i.test(this.printerModel || '')
  }

  get chips () {
    const fits = this.printerName && this.isM1 ? [{ id: 'fits', label: `Fits ${this.printerName}` }] : [{ id: 'fits', label: 'Made for M1' }]
    return [{ id: 'all', label: 'All' }, ...fits, { id: 'remixes', label: 'Remixes' }]
  }

  setTab (tab: LibraryTab) {
    if (tab !== this.tab) this.$emit('update:tab', tab)
  }

  async load () {
    this.controller?.abort()
    const controller = this.controller = new AbortController()
    this.busy = true
    this.error = ''
    try {
      const [shelves, feed] = await Promise.all([
        loadShelves(fetch, controller.signal),
        loadFeedPage(null, fetch, controller.signal).catch(() => ({ posts: [], cursor: null }))
      ])
      if (controller.signal.aborted) return
      this.popular = shelves.popular
      this.m1 = shelves.m1
      this.posts = feed.posts
      this.feedCursor = feed.cursor
    } catch (error) {
      if (controller.signal.aborted) return
      this.error = error instanceof Error ? error.message : String(error)
    } finally {
      if (!controller.signal.aborted) this.busy = false
    }
  }

  async loadMore () {
    if (!this.feedCursor || this.feedBusy) return
    this.feedBusy = true
    try {
      const page = await loadFeedPage(this.feedCursor)
      const seen = new Set(this.posts.map(post => post.key))
      this.posts = [...this.posts, ...page.posts.filter(post => !seen.has(post.key))]
      this.feedCursor = page.cursor
    } catch {
      // Show more stays; the next tap tries again.
    } finally {
      this.feedBusy = false
    }
  }

  matches (card: ShelfCard): boolean {
    if (this.chip === 'fits' && !card.m1) return false
    if (this.chip === 'remixes' && !card.remixOf) return false
    const words = this.query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const haystack = [card.title, card.creator, card.handle ?? '', ...card.tags].join(' ').toLowerCase()
    return words.every(word => haystack.includes(word))
  }

  get visibleShelves () {
    const popular = this.popular.filter(this.matches)
    const m1 = this.m1.filter(this.matches)
    return [
      { id: 'popular', title: 'Popular this week', sub: 'Most made and saved in the last 7 days', cards: popular, more: `${LIBRARY_URL}/community?sort=trending` },
      { id: 'm1', title: 'Made for M1', sub: 'Sliced and test-printed on the M1', cards: m1, more: `${LIBRARY_URL}/search?sources=muon3d` }
    ]
      // Filtered to what fits, Popular is already all M1 prints: one shelf says it.
      .filter(shelf => shelf.cards.length > 0 && !(this.chip === 'fits' && shelf.id === 'm1' && popular.length > 0))
  }

  get visiblePosts (): FeedPost[] {
    return this.posts.filter(post => this.matches(post.card))
  }

  get continuePicture (): string | null {
    return this.continueItem ? thumbnailFor(this.continueItem) : null
  }

  /** "PLA · 0.4 mm · 3 h 5 min · 98 g · Printed on Walnut · 2 days ago". */
  get continueFacts (): string {
    const item = this.continueItem
    if (!item) return ''
    const setup = item.setups?.[0]
    return [setup?.material, setup ? `${nozzleText(setup.nozzle_mm)} mm` : '', printFacts(setup), lastEvent(item).text].filter(Boolean).join(' · ')
  }

  initials (name: string): string {
    const parts = name.replace(/^@/, '').split(/[\s._-]+/).filter(Boolean)
    return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase()
  }

  colourOf (name: string): string {
    let hash = 0
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
    return PALETTE[hash % PALETTE.length]
  }

  open (card: ShelfCard) {
    this.looking = card
    this.$emit('open-model', card.id)
  }

  /**
   * Print from the card: read the print, then ask the host (Print on…).
   * One with no G-code opens in the quick look, which says how to slice it.
   */
  async print (card: ShelfCard) {
    if (card.kind === 'catalogue') {
      window.open(card.href, '_blank', 'noopener')
      return
    }
    if (this.printing) return
    this.printing = card.key
    try {
      const publication = await loadPublication(card.id)
      const print = publicationPrint(publication, card.id)
      if (print) this.printFromLook(card, print)
      else this.open(card)
    } catch {
      this.open(card)
    } finally {
      this.printing = ''
    }
  }

  printFromLook (card: ShelfCard, print: PublicationPrint | null) {
    const request: LibraryPrintRequest = { modelId: card.id, printerId: this.printerId, card, print }
    this.$emit('print', request)
  }
}
</script>

<style lang="scss">
@import './library-v2.scss';
</style>
