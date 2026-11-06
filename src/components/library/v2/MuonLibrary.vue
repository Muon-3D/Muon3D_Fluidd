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
      <!-- The whole of Discover: offline, nothing answered, or nothing yet (v3 §6). -->
      <library-state
        v-if="pageState"
        :kind="pageState.kind"
        :icon="pageState.icon"
        :title="pageState.title"
        :text="pageState.text"
        :action="pageState.action"
        primary
        tid="library-discover-state"
        @action="load"
      />

      <template v-else>
        <library-shelf
          v-for="shelf in visibleShelves"
          :id="shelf.id"
          :key="shelf.id"
          :title="shelf.title"
          :sub="shelf.sub"
          :cards="shelf.cards"
          :loading="busy"
          :error="shelf.error"
          :printer-name="printerName"
          :printing="printing"
          @print="print"
          @open="open"
          @retry="load"
          @see-all="seeAll"
        />

        <library-state
          v-if="noMatch"
          icon="search"
          :title="noMatchTitle"
          text="Clear the filter to see prints that need a re-slice, or try another word."
          action="Clear filter"
          tid="library-discover-empty"
          @action="clearFilter"
        />

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
                >{{ p.card.title }}</a><template v-if="p.card.makeOf">, from <a
                  :href="publicationHref(p.card.makeOf.slug)"
                  target="_blank"
                  rel="noopener"
                >{{ p.card.makeOf.title }}</a></template><template v-else-if="p.card.remixOf"> from {{ p.card.remixOf.title }}</template></span>
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
                  v-if="p.card.saves"
                  class="mlib-stat"
                  :aria-label="`${p.card.saves} saves`"
                >♡ {{ p.card.saves }}</span>
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
                  :aria-label="`Print ${p.card.title}`"
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

    <!-- YOURS: collections and saves, then the host's own Library (sign in, sections, your prints). -->
    <template v-else>
      <library-yours-shelves
        v-if="signedIn"
        ref="yours"
        :printer-name="printerName"
        :printing="printing"
        :collections="collections"
        :collections-error="collectionsError"
        @print="print"
        @open="open"
        @changed="readCollections"
      />
      <section
        v-if="signedIn"
        class="mlib-shelf mlib-shelf--own"
      >
        <header class="mlib-shelf__head">
          <h2>Your prints</h2>
          <span class="mlib-muted">Sliced and saved from Slice, on every printer</span>
        </header>
        <slot name="yours" />
      </section>
      <slot
        v-else
        name="yours"
      />
    </template>

    <library-quick-look
      v-if="looking"
      :key="looking.key"
      :card="looking"
      :printer-name="printerName"
      :signed-in="signedIn"
      :collections="collections"
      @close="looking = null"
      @saved="onSaved"
      @print="printFromLook"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import LibraryModelCard from './LibraryModelCard.vue'
import LibraryQuickLook from './LibraryQuickLook.vue'
import LibraryYoursShelves from './LibraryYoursShelves.vue'
import LibraryShelf from './LibraryShelf.vue'
import LibraryState from './LibraryState.vue'
import { describeLibraryError, type CommunityCollection, type LibraryItem } from '@/services/library/api'
import { LIBRARY_URL } from '@/services/library/discover'
import { libraryClient } from '@/services/library/store'
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
@Component({ components: { LibraryModelCard, LibraryQuickLook, LibraryYoursShelves, LibraryShelf, LibraryState } })
export default class MuonLibrary extends Vue {
  @Prop({ type: String, default: 'page' }) readonly context!: 'page' | 'control'
  @Prop({ type: String, default: null }) readonly printerId!: string | null
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: String, default: 'M1' }) readonly printerModel!: string
  @Prop({ type: Object, default: null }) readonly buildVolume!: { x: number, y: number, z: number } | null
  /** Which place is shown: the host owns it (Control keeps it in the address). */
  @Prop({ type: String, default: 'discover' }) readonly tab!: LibraryTab
  /** Signed in: Yours shows collections and saves, the quick look a heart. */
  @Prop({ type: Boolean, default: false }) readonly signedIn!: boolean
  /** The print to continue with (the last one saved), or none. */
  @Prop({ type: Object, default: null }) readonly continueItem!: LibraryItem | null

  query = ''
  chip = 'all'
  busy = true
  /** Why each part of Discover couldn't be read; '' when it was. */
  popularError = ''
  m1Error = ''
  feedError = ''
  /** The browser said it was offline, or nothing could be fetched at all. */
  offline = false
  popular: ShelfCard[] = []
  m1: ShelfCard[] = []
  posts: FeedPost[] = []
  feedCursor: string | null = null
  feedBusy = false
  looking: ShelfCard | null = null
  collections: CommunityCollection[] = []
  private collectionReads = 0
  collectionsError = ''
  /** The card whose print is being read, for Print. */
  printing = ''
  libraryUrl = LIBRARY_URL
  ago = ago
  tabs: Array<{ id: LibraryTab, label: string }> = [{ id: 'discover', label: 'Discover' }, { id: 'yours', label: 'Yours' }]
  controller: AbortController | null = null
  observer: IntersectionObserver | null = null

  created () {
    this.load()
  }

  /** In Control, open on what this printer can print, even when it is known only later. */
  @Watch('printerName', { immediate: true })
  onPrinter (name: string | null, before?: string | null) {
    if (name && !before && this.isM1 && this.chip === 'all') this.chip = 'fits'
  }

  /** Back online after Discover couldn't be read: read it again, nobody needs to tap. */
  onOnline () {
    if (this.offline || this.allFailed) this.load()
  }

  mounted () {
    window.addEventListener('online', this.onOnline)
    if (typeof IntersectionObserver === 'undefined') return
    this.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) this.loadMore()
    }, { rootMargin: '600px' })
  }

  /** Show more is drawn only with a cursor, once loading ends: watch it then ($refs aren't reactive). */
  @Watch('feedCursor')
  @Watch('busy')
  @Watch('tab')
  async observeMore () {
    await this.$nextTick()
    this.observer?.disconnect()
    const more = this.$refs.more as Element | undefined
    if (more) this.observer?.observe(more)
  }

  beforeDestroy () {
    window.removeEventListener('online', this.onOnline)
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
    this.feedBusy = false
    this.busy = true
    this.popularError = this.m1Error = this.feedError = ''
    this.offline = typeof navigator !== 'undefined' && navigator.onLine === false
    if (this.offline) {
      this.busy = false
      return
    }
    const [shelves, feed] = await Promise.all([
      loadShelves(fetch, controller.signal),
      loadFeedPage(null, fetch, controller.signal).catch((error: unknown) => error instanceof Error ? error : new Error(String(error)))
    ])
    if (controller.signal.aborted) return
    this.popular = shelves.popular
    this.m1 = shelves.m1
    this.popularError = shelves.errors.popular ?? ''
    this.m1Error = shelves.errors.m1 ?? ''
    if (feed instanceof Error) {
      this.feedError = feed.message
      this.posts = []
      this.feedCursor = null
    } else {
      this.posts = feed.posts
      this.feedCursor = feed.cursor
    }
    // Nothing answered and the browser can't reach anything: offline, not an outage.
    this.offline = this.allFailed && (navigator.onLine === false || /fetch|network/i.test(this.popularError))
    this.busy = false
  }

  async loadMore () {
    if (!this.feedCursor || this.feedBusy || this.busy) return
    // A reload (Try again) while this page is read makes it stale: dropped.
    const controller = this.controller
    this.feedBusy = true
    try {
      const page = await loadFeedPage(this.feedCursor, fetch, controller?.signal)
      if (controller !== this.controller || controller?.signal.aborted) return
      const seen = new Set(this.posts.map(post => post.key))
      this.posts = [...this.posts, ...page.posts.filter(post => !seen.has(post.key))]
      this.feedCursor = page.cursor
    } catch {
      // Show more stays; the next tap tries again.
    } finally {
      if (controller === this.controller) this.feedBusy = false
    }
  }

  matches (card: ShelfCard): boolean {
    if (this.chip === 'fits' && !card.m1) return false
    if (this.chip === 'remixes' && !card.remixOf) return false
    const words = this.query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const haystack = [card.title, card.creator, card.handle ?? '', ...card.tags].join(' ').toLowerCase()
    return words.every(word => haystack.includes(word))
  }

  /** Newly shared prints (not makes), from the feed's first page: the New shelf. */
  get newest (): ShelfCard[] {
    return this.posts.filter(post => post.verb !== 'made').map(post => post.card).slice(0, 12)
  }

  /**
   * Popular this week, Made for M1, New (v3 L3). While Discover loads, all
   * three show skeletons; a shelf that failed shows its error with Retry;
   * an empty one hides. Filtered to what fits, Popular is already all M1
   * prints, so Made for M1 would repeat it and hides.
   */
  get visibleShelves () {
    const popular = this.popular.filter(this.matches)
    const shelves = [
      { id: 'popular', title: 'Popular this week', sub: 'Most made and saved in the last 7 days', cards: popular, error: this.popularError },
      { id: 'm1', title: 'Made for M1', sub: 'Sliced and test-printed on the M1', cards: this.m1.filter(this.matches), error: this.m1Error },
      { id: 'new', title: 'New', sub: 'Shared in the last few days', cards: this.newest.filter(this.matches), error: this.feedError }
    ]
    if (this.busy) return shelves
    return shelves.filter(shelf => (shelf.error || shelf.cards.length > 0) && !(this.chip === 'fits' && shelf.id === 'm1' && popular.length > 0 && !shelf.error))
  }

  get allFailed (): boolean {
    return !!(this.popularError && this.m1Error && this.feedError)
  }

  get filtered (): boolean {
    return !!this.query.trim() || this.chip !== 'all'
  }

  /** Discover as a whole can't be shown: offline, nothing answered, or nothing yet. */
  get pageState (): { kind: 'empty' | 'error', icon: string, title: string, text: string, action: string } | null {
    if (this.busy) return null
    if (this.offline) return { kind: 'error', icon: 'wifi', title: 'You\'re offline', text: 'Discover needs the internet. Your printers on this network still work.', action: 'Try again' }
    if (this.allFailed) return { kind: 'error', icon: 'alert', title: 'The Library didn\'t answer', text: this.popularError, action: 'Try again' }
    // Nothing at all, whatever the filter (in Control "Fits" is on from the start).
    if (!this.popular.length && !this.m1.length && !this.posts.length) {
      return { kind: 'empty', icon: 'library', title: 'Nothing to discover yet', text: 'Prints people share, and the ones we test on the M1, appear here.', action: '' }
    }
    return null
  }

  /** A filter or a search hides everything there is. */
  get noMatch (): boolean {
    return !this.busy && this.filtered && !this.visibleShelves.length && !this.visiblePosts.length
  }

  get noMatchTitle (): string {
    const query = this.query.trim()
    const chip = this.chips.find(c => c.id === this.chip)
    const filter = this.chip !== 'all' && chip ? ` with ${chip.label}` : ''
    return query ? `Nothing matches "${query}"${filter}` : `Nothing here${filter}`
  }

  clearFilter () {
    this.query = ''
    this.chip = 'all'
  }

  /** See all: the shelf's own page arrives with v3 page 3; until then, the Library site's list. */
  seeAll (id: string) {
    const where: Record<string, string> = {
      popular: `${LIBRARY_URL}/community?sort=trending`,
      m1: `${LIBRARY_URL}/search?sources=muon3d`,
      new: `${LIBRARY_URL}/community?sort=new`
    }
    if (where[id]) window.open(where[id], '_blank', 'noopener')
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

  /** Your collections, for Yours and for the quick look's Add to… (Discover too). */
  @Watch('signedIn', { immediate: true })
  async readCollections () {
    if (!this.signedIn) {
      this.collections = []
      return
    }
    const read = ++this.collectionReads
    try {
      const answer = await libraryClient().collections()
      if (read !== this.collectionReads || !this.signedIn) return
      this.collections = Array.isArray(answer.collections) ? answer.collections : []
      this.collectionsError = ''
    } catch (error) {
      // Yours says so; Add to… stays hidden.
      if (read === this.collectionReads) this.collectionsError = describeLibraryError(error)
    }
  }

  /** A heart or Add to… in the quick look: the counts and Yours' shelves read again. */
  onSaved () {
    this.readCollections()
    ;(this.$refs.yours as { refresh?: () => void } | undefined)?.refresh?.()
  }

  publicationHref (slug: string): string {
    return `${LIBRARY_URL}/p/${encodeURIComponent(slug)}`
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
