<template>
  <div
    class="mlib"
    :class="[`mlib--${context}`, { 'mlib--phone': phone }]"
    data-tid="muon-library"
  >
    <!-- A print's own page (v3 page 6), over whichever place it was opened from. -->
    <library-print-page
      v-if="printId"
      :key="printId"
      :card="pageCard"
      :printer-name="printerName"
      :printer-fits="isM1"
      :signed-in="signedIn"
      :collections="collections"
      :printing="printing"
      :back-label="tab === 'yours' ? 'Yours' : 'Discover'"
      :auto-print="autoPrint"
      @auto-printed="$emit('auto-printed')"
      @back="$emit('print-back')"
      @saved="onSaved"
      @print="printFromLook"
      @print-card="print"
      @open="open"
    />

    <library-browse-page
      v-else-if="tab === 'discover' && (categorySlug || (catalogue && discoverGrid === 'search'))"
      :category="categorySlug && categorySlug !== 'all' ? categorySlug : null"
      :query="categorySlug ? '' : search"
      :volume="printerVolume"
      :printer-name="printerName"
      :pictures="categoryPictures"
      :printing="printing"
      @back="browseBack"
      @category="openCategory"
      @search="openSearch"
      @open="open"
      @print="print"
    />

    <!-- See all and search results (v3 pages 3 and 4): one grid page. -->
    <library-grid-page
      v-else-if="tab === 'discover' && discoverGrid"
      :source="discoverGrid"
      :query="search"
      :printer-name="printerName"
      :fits-first="fits"
      :fits-label="fitsLabel"
      :categories="chips"
      :printing="printing"
      @back="$emit('grid-back')"
      @yours="setTab('yours')"
      @update:source="$emit('update:grid', $event)"
      @update:query="openSearch"
      @print="print"
      @open="open"
    />

    <!-- A collection's own page (v3 page 8). -->
    <library-collection-page
      v-else-if="tab === 'yours' && collection && signedIn"
      ref="collectionPage"
      :collection-id="collection"
      :printer-name="printerName"
      :printing="printing"
      @back="$emit('collection-back')"
      @deleted="$emit('collection-deleted')"
      @changed="readCollections"
      @print="print"
      @open="openInCollection"
    />

    <!-- See all for a Yours shelf: one grid with search and sort. -->
    <library-yours-grid
      v-else-if="tab === 'yours' && yoursGrid && signedIn && (ownReady || yoursGrid === 'saved')"
      :source="yoursGrid"
      :printer-name="printerName"
      :printing="printing"
      @back="$emit('grid-back')"
      @print="print"
      @open="open"
      @own-act="ownAct"
      @own-open="ownOpen"
    />

    <template v-else>
      <!-- The two places, search and filters. No creator row, no page tabs. -->
      <header class="mlib__head">
        <div class="mlib__titles">
          <div
            v-if="context === 'page'"
            class="mlib__title"
          >
            <h1>Library</h1>
            <p data-tid="library-purpose">
              {{ tab === 'discover' ? catalogue ? 'Good ideas. Made to be made.' : 'Prints people share, and ones tested on the M1' : 'What you sliced, printed, saved and shared' }}
            </p>
          </div>
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
        <library-search-box
          v-if="tab === 'discover'"
          class="mlib__search"
          :value="query"
          @input="query = $event"
          @search="openSearch"
          @open="openSummary"
        />
        <slot
          v-else
          name="yours-search"
        />
        <!-- Share a print (v3 page 11): one of yours into Discover. -->
        <button
          v-if="signedIn && context === 'page'"
          type="button"
          class="mlib-btn mlib__share"
          data-tid="library-share-open"
          @click="$emit('share')"
        >
          <frame-icon
            name="upload"
            small
          />
          Share a print
        </button>
        <div
          v-if="tab === 'discover'"
          class="mlib-chips"
          role="group"
          aria-label="Filter"
        >
          <button
            type="button"
            class="mlib-chip"
            :class="{ 'mlib-chip--on': fits }"
            :aria-pressed="fits ? 'true' : 'false'"
            data-tid="library-discover-chip-fits"
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
            type="button"
            class="mlib-chip"
            data-tid="library-browse-open"
            @click="openCategory('all')"
          >
            Browse categories ›
          </button>
          <button
            v-for="c in chips"
            :key="c.id"
            type="button"
            class="mlib-chip"
            :class="{ 'mlib-chip--on': chip === c.id }"
            :aria-pressed="chip === c.id ? 'true' : 'false'"
            :data-tid="`library-discover-chip-${c.id}`"
            @click="catalogue && c.id !== 'all' ? openCategory(c.id) : chip = c.id"
          >
            {{ c.label }}
          </button>
        </div>
      </header>

      <!-- Continue: the print this device opened last (kept here, not in your account). -->
      <section
        v-if="continueRecent"
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
          <strong>{{ continueRecent.title }}</strong>
          <span class="mlib-muted">{{ continueFacts }}</span>
        </div>
        <div class="mlib-continue__acts">
          <button
            v-if="continueItem"
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
          <button
            type="button"
            class="mlib-btn"
            :class="{ 'mlib-btn--primary': !continueItem }"
            data-tid="library-continue-open"
            @click="$emit('open-recent', continueRecent)"
          >
            Open
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
          <section
            v-if="catalogue && catalogue.hero && !query.trim() && chip === 'all'"
            class="mc-hero"
            data-tid="library-featured-hero"
            aria-label="Featured model"
          >
            <div class="mc-hero__story">
              <span class="mlib-eyebrow">Made to make your day</span>
              <h2>{{ catalogue.hero.headline }}</h2>
              <p>{{ catalogue.hero.card.title }}<br><span class="mlib-muted">By {{ catalogue.hero.card.creator }}</span></p>
              <button
                type="button"
                class="mlib-btn mlib-btn--primary"
                @click="open(catalogue.hero.card)"
              >
                Take a closer look <frame-icon
                  name="chevronRight"
                  small
                />
              </button>
            </div>
            <library-model-card
              :card="catalogue.hero.card"
              :printer-name="printerName"
              :busy="printing === catalogue.hero.card.key"
              @open="open"
              @print="print"
            />
          </section>
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
            :see-all="!shelf.id.startsWith('editorial-') && shelf.cards.length > 0"
            :empty="FIXED_SHELVES.includes(shelf.id) ? 'Nothing here yet.' : ''"
            empty-action="Browse categories"
            @print="print"
            @open="open"
            @retry="load"
            @see-all="seeAll"
            @empty-action="openCategory('all')"
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
            v-if="!catalogue && visiblePosts.length"
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

      <!-- YOURS (v3 page 2): what the host has to say first (sign in, off, reading, error), then the shelves. -->
      <template v-else>
        <slot name="yours" />
        <library-yours-shelves
          v-if="signedIn"
          ref="yours"
          :own="ownReady"
          :printer-name="printerName"
          :printing="printing"
          :collections="collections"
          :collections-error="collectionsError"
          @print="print"
          @open="open"
          @changed="readCollections"
          @see-all="seeAll"
          @open-collection="$emit('update:collection', $event)"
          @own-act="ownAct"
          @own-open="ownOpen"
          @go-slice="$emit('go-slice')"
        />
      </template>
    </template>

    <library-quick-look
      v-if="looking"
      :key="looking.key"
      :card="looking"
      :printer-name="printerName"
      :printer-fits="isM1"
      :signed-in="signedIn"
      :collections="collections"
      :in-collection="lookingIn"
      @close="looking = null; lookingIn = null"
      @saved="onSaved"
      @removed="onRemoved"
      @page="openPage"
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
import LibraryGridPage from './LibraryGridPage.vue'
import LibrarySearchBox from './LibrarySearchBox.vue'
import LibraryBrowsePage from './LibraryBrowsePage.vue'
import LibraryYoursGrid, { YOURS_GRIDS, type YoursGridSource } from './LibraryYoursGrid.vue'
import LibraryCollectionPage, { saveIdOf } from './LibraryCollectionPage.vue'
import LibraryPrintPage from './LibraryPrintPage.vue'
import type { OwnCard } from '@/services/library/yours'
import type { RecentEntry } from '@/services/library/recents'
import { describeLibraryError, type CommunityCollection, type LibraryItem } from '@/services/library/api'
import { LIBRARY_URL } from '@/services/library/discover'
import { libraryClient } from '@/services/library/store'
import { lastEvent, nozzleText, printFacts } from '@/services/library/format'
import { loadThumbnail, thumbnailFor } from '@/services/library/thumbnails'
import { ago, isNetworkError, loadFeedPage, loadPublication, loadShelves, publicationPrint, summaryCard, type DiscoverShelves, type FeedPost, type GridSource, type PublicationPrint, type PublicationSummary, type ShelfCard } from '@/services/library/shelves'
import { dimensionFit } from '@/services/library/catalogue'
import { cardSaves, clearCardSaves, readCardSave } from '@/services/library/card-saves'
import { cloudState } from '@/services/muon-cloud/state'

export type LibraryTab = 'discover' | 'yours'

/** What the host is asked to do with a card: it does the send (Control: Print on…). */
export interface LibraryPrintRequest {
  modelId: string;
  printerId: string | null;
  card: ShelfCard;
  /** The publication as Print on… takes it, when the quick look has read it. */
  print: PublicationPrint | null;
}

/** The shelves Discover always has: with nothing on one, it says so instead of vanishing. */
const FIXED_SHELVES = ['popular', 'm1', 'new']

/** Made for M1 is tested only when every print on it is one Muon3D test-printed (the catalogue's); publisher-tagged ones are candidates. */
const M1_TESTED = 'Sliced and test-printed on the M1'
const M1_TAGGED = 'Publisher-tagged M1 candidates. Check the profile before printing.'

const PALETTE = ['#ff9f0a', '#ff453a', '#64d2ff', '#30d158', '#bf5af2', '#80d6d1', '#ffd60a']

/**
 * The Library (Library v2, Jack 5 Nov 2026, option 2): one component for
 * the Library page and for Control's printer page. Discover is shelves
 * (Popular this week, Made for M1) and a feed below them; Yours is the
 * host's (a slot), so Control keeps its own sign-in and sections. A card
 * prints from where it is, through the host: `print` and `print-item`.
 * No router in here; it sizes to its container.
 */
@Component({
  components: { LibraryModelCard, LibraryQuickLook, LibraryYoursShelves, LibraryShelf, LibraryState, LibraryGridPage, LibraryYoursGrid, LibraryCollectionPage, LibraryPrintPage, LibrarySearchBox, LibraryBrowsePage },
  provide (this: MuonLibrary) { return { libraryCardContext: () => ({ volume: this.printerVolume, printerName: this.printerName, signedIn: this.signedIn, signIn: () => this.$emit('sign-in'), settingsTo: this.settingsTo }) } }
})
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
  /** A See all page or search results instead of Discover's shelves; the host keeps it in the address. */
  @Prop({ type: String, default: null }) readonly grid!: GridSource | YoursGridSource | null
  @Prop({ type: String, default: '' }) readonly search!: string
  /** The print this device opened last, or none: Continue is not drawn without it. */
  @Prop({ type: Object, default: null }) readonly continueRecent!: RecentEntry | null
  /** That print as your Library has it (one of yours), for Print again; null for a public model. */
  @Prop({ type: Object, default: null }) readonly continueItem!: LibraryItem | null
  /** A print's own page (its publication id), over everything else; the host keeps it in the address. */
  @Prop({ type: String, default: null }) readonly printId!: string | null
  /** The print's page was opened by its address (the site's Print link): it opens Print on… once, signed in. */
  @Prop({ type: Boolean, default: false }) readonly autoPrint!: boolean
  /** A collection's page instead of Yours' shelves (its id); the host keeps it in the address. */
  @Prop({ type: String, default: null }) readonly collection!: string | null
  /** Where the Library's settings are, for the links that say to turn it on (the host knows its printer's path). */
  @Prop({ type: String, default: '/account/library' }) readonly settingsTo!: string
  /** Your Library is on and read: Yours' shelves can show (the host says what to do otherwise). */
  @Prop({ type: Boolean, default: true }) readonly ownReady!: boolean

  query = ''
  /** The category shown: 'all' or one of the model service's categories. */
  chip = 'all'
  /** Only what this printer can print (Made for M1, for an M1); on from the start in Control. */
  fits = false
  busy = true
  /** Why each part of Discover couldn't be read; '' when it was. */
  popularError = ''
  m1Error = ''
  feedError = ''
  /** The browser said it was offline, or nothing could be fetched at all. */
  offline = false
  /** The browser is online but nothing could be fetched: the Library turned this address away (CORS), or something between refused it. */
  unreachable = false
  popular: ShelfCard[] = []
  catalogue: DiscoverShelves['catalogue'] | null = null
  m1: ShelfCard[] = []
  posts: FeedPost[] = []
  feedCursor: string | null = null
  feedBusy = false
  looking: ShelfCard | null = null
  /** The collection the quick look was opened from (its page), for Remove from <it>. */
  lookingIn: { id: string, name: string, saveId: string } | null = null
  collections: CommunityCollection[] = []
  private collectionReads = 0
  collectionsError = ''
  /** The card whose print is being read, for Print. */
  printing = ''
  libraryUrl = LIBRARY_URL
  FIXED_SHELVES = FIXED_SHELVES
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
    if (name && !before && this.isM1) {
      const cards = [...this.popular, ...this.m1, ...this.posts.map(p => p.card)]
      this.fits = !cards.length || !!this.catalogue || cards.some(c => c.m1)
    }
  }

  /** Back online after Discover couldn't be read: read it again, nobody needs to tap. */
  onOnline () {
    if (this.offline || this.unreachable || this.allFailed) this.load()
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

  get printerVolume (): { x: number, y: number, z: number } | null {
    if (this.buildVolume) return this.buildVolume
    const toolhead = this.$store?.state.printer?.printer?.toolhead
    const min = toolhead?.axis_minimum
    const max = toolhead?.axis_maximum
    if (!min || !max || min.length < 3 || max.length < 3) return null
    const dimensions = max.slice(0, 3).map((v: number, i: number) => v - min[i])
    return dimensions.every((v: number) => Number.isFinite(v) && v > 0) ? { x: dimensions[0], y: dimensions[1], z: dimensions[2] } : null
  }

  get categorySlug (): string | null { const slug = this.$route?.query.category; return typeof slug === 'string' ? slug : null }
  get categoryPictures (): ShelfCard[] { return [...this.popular, ...this.m1, ...(this.catalogue?.shelves.flatMap(s => s.cards) ?? []), ...this.newest] }
  openSummary (item: PublicationSummary) { this.open(summaryCard(item)) }
  openCategory (slug: string) { this.$router.push({ query: { view: 'discover', category: slug } }).catch(() => {}) }
  browseBack () { this.$router.push({ query: { view: 'discover' } }).catch(() => {}) }

  get fitsLabel (): string {
    return this.printerName && this.isM1 ? `Fits ${this.printerName}` : 'Made for M1'
  }

  /** All, then the model service's categories (public_v2.rs): the ones people print most first. */
  get chips () {
    return [
      { id: 'all', label: 'All' },
      { id: 'home', label: 'Home' },
      { id: 'workshop', label: 'Workshop' },
      { id: 'tools', label: 'Tools' },
      { id: 'toys-games', label: 'Toys & games' },
      { id: 'spare-parts', label: 'Spare parts' },
      { id: 'art', label: 'Art' },
      { id: 'education', label: 'Education' },
      { id: 'cosplay', label: 'Cosplay' },
      { id: 'other', label: 'Other' }
    ]
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
    this.unreachable = false
    this.offline = typeof navigator !== 'undefined' && navigator.onLine === false
    if (this.offline) {
      this.busy = false
      return
    }
    try {
      const shelves = await loadShelves(fetch, controller.signal)
      const feed = shelves.catalogue ? { posts: [] as FeedPost[], cursor: null } : await loadFeedPage(null, fetch, controller.signal).catch((error: unknown) => error instanceof Error ? error : new Error(String(error)))
      if (controller.signal.aborted) return
      this.catalogue = shelves.catalogue ?? null
      this.popular = shelves.popular
      this.m1 = shelves.m1
      if (this.fits && !this.catalogue && this.popular.length && ![...this.popular, ...this.m1].some(card => card.m1)) this.fits = false
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
      // Nothing answered and nothing could be reached: offline if the browser says so, else this address can't reach it. Not an outage.
      const unreached = this.allFailed && shelves.unreachable && feed instanceof Error && isNetworkError(feed)
      this.offline = this.allFailed && navigator.onLine === false
      this.unreachable = !this.offline && unreached
    } catch (error) {
      // Something unreadable got past the readers: the page says so instead of loading forever.
      if (controller.signal.aborted) return
      const text = error instanceof Error ? error.message : String(error)
      this.popularError = this.m1Error = this.feedError = text
    } finally {
      if (!controller.signal.aborted) this.busy = false
    }
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
    if (this.fits && (this.catalogue ? dimensionFit(card.size, this.printerVolume) === false : !card.m1)) return false
    // A print with no category (Muon3D's tested catalogue) is Other, never lost from every chip but All.
    if (this.chip !== 'all' && (card.category || 'other') !== this.chip) return false
    const words = this.query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    const haystack = [card.title, card.creator, card.handle ?? '', ...card.tags].join(' ').toLowerCase()
    return words.every(word => haystack.includes(word))
  }

  /** Newly shared prints (not makes), from the feed's first page: the New shelf. */
  get newest (): ShelfCard[] {
    if (this.catalogue) return this.catalogue.week
    return this.posts.filter(post => post.verb !== 'made').map(post => post.card).slice(0, 12)
  }

  /**
   * Popular this week, Made for M1, New (v3 L3). While Discover loads, all
   * three show skeletons; a shelf that failed shows its error with Retry;
   * an empty one of the three says so (Nothing here yet.) unless a filter is
   * on (then "nothing matches" says it once); the editorial shelves hide. Filtered to what fits, Popular is already all M1
   * prints, so Made for M1 would repeat it and hides.
   */
  get visibleShelves () {
    const popular = this.popular.filter(this.matches)
    const m1Cards = this.m1.filter(this.matches)
    const shelves = [
      { id: 'popular', title: 'Popular this week', sub: 'Most made and saved in the last 7 days', cards: popular, error: this.popularError },
      // "Test-printed" is said only when every print here is one of Muon3D's tested catalogue; a publisher's m1-ready tag is a candidate.
      { id: 'm1', title: 'Made for M1', sub: m1Cards.length && m1Cards.every(card => card.kind === 'catalogue') ? M1_TESTED : M1_TAGGED, cards: m1Cards, error: this.m1Error },
      { id: 'new', title: 'New', sub: 'Shared in the last few days', cards: this.newest.filter(this.matches), error: this.feedError }
    ]
    if (this.catalogue) {
      shelves.unshift(...this.catalogue.shelves.map(s => ({ ...s, cards: s.cards.filter(this.matches), error: '' })))
      const m1 = shelves.find(s => s.id === 'm1')
      if (m1) m1.sub = M1_TAGGED
      const week = shelves.find(s => s.id === 'new')
      if (week) { week.title = 'New this week'; week.sub = 'Fresh ideas shared in the last seven days' }
    }
    if (this.busy) return shelves
    const sayEmpty = !this.filtered
    return shelves.filter(shelf => (shelf.error || shelf.cards.length > 0 || (sayEmpty && FIXED_SHELVES.includes(shelf.id))) && !(!this.catalogue && this.fits && shelf.id === 'm1' && popular.length > 0 && !shelf.error))
  }

  get allFailed (): boolean {
    return !!(this.popularError && this.m1Error && this.feedError)
  }

  get filtered (): boolean {
    return !!this.query.trim() || this.fits || this.chip !== 'all'
  }

  /** Discover as a whole can't be shown: offline, nothing answered, or nothing yet. */
  get pageState (): { kind: 'empty' | 'error', icon: string, title: string, text: string, action: string } | null {
    if (this.busy) return null
    if (this.offline) return { kind: 'error', icon: 'wifi', title: 'You\'re offline', text: 'Discover needs the internet. Your printers on this network still work.', action: 'Try again' }
    if (this.unreachable) return { kind: 'error', icon: 'alert', title: 'The Library can\'t be reached from here', text: `You're online, but the Library didn't answer Control opened at ${location.host}.`, action: 'Try again' }
    if (this.allFailed) return { kind: 'error', icon: 'alert', title: 'The Library didn\'t answer', text: this.popularError, action: 'Try again' }
    // Nothing at all, whatever the filter (in Control "Fits" is on from the start),
    // and no shelf failed (a failed shelf shows its own Retry instead).
    if (!this.popular.length && !this.m1.length && !this.posts.length && !this.catalogue?.week.length && !this.catalogue?.shelves.length && !this.popularError && !this.m1Error && !this.feedError) {
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
    const category = this.chips.find(c => c.id === this.chip && c.id !== 'all')
    const parts = [this.fits ? this.fitsLabel : '', category ? category.label : ''].filter(Boolean)
    const filter = parts.length ? ` with ${parts.join(' and ')}` : ''
    return query ? `Nothing matches "${query}"${filter}` : `Nothing here${filter}`
  }

  clearFilter () {
    this.query = ''
    this.chip = 'all'
    this.fits = false
  }

  /** See all: the shelf as a grid page (v3 page 3). */
  seeAll (id: string) {
    this.$emit('update:grid', id)
  }

  get discoverGrid (): GridSource | null {
    return this.grid === 'popular' || this.grid === 'm1' || this.grid === 'new' || this.grid === 'search' ? this.grid : null
  }

  get yoursGrid (): YoursGridSource | null {
    return YOURS_GRIDS.includes(this.grid as YoursGridSource) ? this.grid as YoursGridSource : null
  }

  /** A Yours card's button: print it, print that run again, or open it in Slice. The host does each. */
  ownAct (card: OwnCard) {
    if (card.action === 'again' && card.run) this.$emit('print-run', card.run)
    else if (card.action === 'slice' && card.item) this.$emit('slice-item', card.item)
    else if (card.action === 'print' && card.item) this.$emit('print-item', card.item)
  }

  /** A Yours card's picture: its own page (v3 page 9). */
  ownOpen (card: OwnCard) {
    if (card.item) this.$emit('open-item', card.item)
  }

  /** Enter in a search box: the results page (v3 page 4), for two letters or more. */
  openSearch (query: string) {
    const q = query.trim()
    if (q.length < 2 || q.length > 64) return
    this.$emit('open-search', q)
  }

  get visiblePosts (): FeedPost[] {
    return this.posts.filter(post => this.matches(post.card))
  }

  /** One of yours to Continue with: its picture is asked for (it is not stored with the entry). */
  @Watch('continueItem', { immediate: true })
  onContinueItem (item: LibraryItem | null) {
    if (item) loadThumbnail(item)
  }

  get continuePicture (): string | null {
    return this.continueRecent?.thumbnail ?? (this.continueItem ? thumbnailFor(this.continueItem) : null)
  }

  /** "PLA · 0.4 mm · 3 h 5 min · 98 g · Printed on Walnut · 2 days ago" for one of yours, "By Wren Atelier" for a public model. */
  get continueFacts (): string {
    const item = this.continueItem
    if (!item) return this.continueRecent?.maker ? `By ${this.continueRecent.maker}` : 'Opened on this device'
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
      clearCardSaves()
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

  /** Another account's hearts must not show on this one's cards. */
  get accountId (): string | null { return cloudState.account?.id ?? null }
  @Watch('accountId') accountChanged () { clearCardSaves() }

  /** A heart or Add to… in the quick look: the counts and Yours' shelves read again. */
  onSaved () {
    // Every heart a card has shown, publications and catalogue models alike.
    const keys = Object.keys(cardSaves.ids)
    clearCardSaves()
    for (const key of keys) {
      if (key.startsWith('catalogue:')) readCardSave(key.slice('catalogue:'.length), 'catalogue')
      else readCardSave(key)
    }
    for (const card of [...this.categoryPictures, ...(this.looking ? [this.looking] : [])]) readCardSave(card.id, card.kind)
    this.readCollections()
    ;(this.$refs.yours as { refresh?: () => void } | undefined)?.refresh?.()
  }

  publicationHref (slug: string): string {
    return `${LIBRARY_URL}/p/${encodeURIComponent(slug)}`
  }

  open (card: ShelfCard) {
    this.lookingIn = null
    this.looking = card
    this.$emit('open-model', card.id)
  }

  /** Cards a print's page was opened from, by id, so its header shows at once. */
  pageCards: Record<string, ShelfCard> = {}

  /** Open page in a quick look: the print's own page (the host puts it in the address). */
  openPage (card: ShelfCard) {
    this.$set(this.pageCards, card.id, card)
    this.$emit('update:print', card.id)
  }

  /** The page's card: the one it was opened from, else (opened by its address) one the page fills in. */
  get pageCard (): ShelfCard {
    const id = this.printId ?? ''
    return this.pageCards[id] ?? {
      key: `pub:${id}`,
      kind: 'publication',
      id,
      slug: '',
      title: '',
      picture: null,
      creator: '',
      handle: null,
      makes: 0,
      remixes: 0,
      saves: 0,
      facts: '',
      m1: false,
      tags: [],
      remixOf: null,
      makeOf: null,
      createdAt: null,
      href: ''
    }
  }

  /** A card on a collection's page: its quick look can take it out of that collection. */
  openInCollection (card: ShelfCard, from: { id: string, name: string } | null) {
    const saveId = saveIdOf(card)
    this.open(card)
    this.lookingIn = from && saveId ? { id: from.id, name: from.name, saveId } : null
  }

  /** Taken out of a collection from its quick look: the page and the tiles read again. */
  onRemoved () {
    this.looking = null
    this.lookingIn = null
    this.readCollections()
    ;(this.$refs.collectionPage as { load?: () => void } | undefined)?.load?.()
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

  /** `auto`: opened by the site's Print link, so no printer is preselected: the person picks one. */
  printFromLook (card: ShelfCard, print: PublicationPrint | null, auto = false) {
    const request: LibraryPrintRequest = { modelId: card.id, printerId: auto ? null : this.printerId, card, print }
    this.$emit('print', request)
  }
}
</script>

<style lang="scss">
@import './library-v2.scss';
</style>
