<template>
  <div
    class="myours"
    data-tid="library-yours-shelves"
  >
    <!-- Collections: mosaic tiles, then New collection. A tile opens the collection's own page. -->
    <section
      class="mlib-shelf"
      data-tid="library-collections"
    >
      <header class="mlib-shelf__head">
        <h2>Collections</h2>
        <span class="mlib-muted">Saved prints, grouped your way</span>
        <form
          v-if="naming"
          class="myours__new"
          @submit.prevent="create"
        >
          <input
            ref="name"
            v-model="name"
            type="text"
            maxlength="80"
            placeholder="Name"
            aria-label="Collection name"
            data-tid="library-collection-name"
            @keydown.esc="naming = false"
          >
          <button
            type="submit"
            class="mlib-btn mlib-btn--sm mlib-btn--primary"
            :disabled="!name.trim() || busy"
          >
            Create
          </button>
        </form>
        <button
          v-else
          type="button"
          class="mlib-link"
          data-tid="library-collection-new"
          @click="startNaming"
        >
          <frame-icon
            name="plus"
            small
          /> New
        </button>
      </header>
      <p
        v-if="error || collectionsError"
        class="mlib-muted"
        role="alert"
        data-tid="library-yours-error"
      >
        {{ error || collectionsError }}
      </p>
      <div class="mlib-cols">
        <button
          v-for="c in collections"
          :key="c.id"
          type="button"
          class="mlib-col"
          :aria-label="`${c.name}, ${c.item_count} ${c.item_count === 1 ? 'print' : 'prints'}`"
          :data-tid="`library-collection-${c.id}`"
          @click="$emit('open-collection', c.id)"
        >
          <span class="mlib-col__mosaic">
            <img
              v-for="(src, i) in mosaic(c.id)"
              :key="i"
              :src="src"
              alt=""
            >
          </span>
          <strong>{{ c.name }}</strong>
          <span class="mlib-muted">{{ c.item_count }} {{ c.item_count === 1 ? 'print' : 'prints' }}</span>
        </button>
        <button
          v-if="!naming"
          type="button"
          class="mlib-col mlib-col--new"
          data-tid="library-collection-new-tile"
          @click="startNaming"
        >
          <frame-icon
            name="plus"
            small
          /> New collection
        </button>
      </div>
    </section>

    <!-- Following: public collections other people made, that you follow. -->
    <library-following-shelf
      ref="following"
      @open-collection="$emit('open-collection', $event)"
      @go-discover="$emit('go-discover')"
    />

    <template v-for="s in shelves">
      <library-shelf
        v-if="s.id === 'saved'"
        id="saved"
        :key="s.id"
        title="Saved"
        sub="From Discover"
        :cards="saved.slice(0, ROW).map(withPicture)"
        :printer-name="printerName"
        :printing="printing"
        :loading="!savedLoaded && !savedError"
        :error="savedError"
        :see-all="saved.length > 0"
        data-tid="library-saved"
        @see-all="$emit('see-all', 'saved')"
        @retry="refresh"
        @print="$emit('print', $event)"
        @open="$emit('open', $event)"
      >
        <template v-if="savedLoaded && !saved.length">
          <p
            class="mlib-muted myours__empty"
            data-tid="library-shelf-saved-empty"
          >
            Tap ♡ on a print in Discover and it is kept here.
          </p>
        </template>
      </library-shelf>

      <library-shelf
        v-else-if="own && s.shown"
        :id="s.id"
        :key="s.id"
        :title="s.title"
        :sub="s.sub"
        :loading="s.loading"
        :error="s.error"
        :see-all="s.cards.length > 0"
        @see-all="$emit('see-all', s.id)"
        @retry="readOwn(s.id)"
      >
        <library-own-card
          v-for="card in s.cards.slice(0, ROW)"
          :key="card.key"
          :card="card"
          :printer-name="printerName"
          @act="$emit('own-act', $event)"
          @open="$emit('own-open', $event)"
        />
        <div
          v-if="!s.cards.length"
          class="myours__empty"
          :data-tid="`library-shelf-${s.id}-empty`"
        >
          <p class="mlib-muted">
            {{ s.empty }}
          </p>
          <button
            v-if="s.id === 'sliced'"
            type="button"
            class="mlib-btn mlib-btn--sm mlib-btn--primary"
            data-tid="library-go-slice"
            @click="$emit('go-slice')"
          >
            Open Slice
          </button>
        </div>
      </library-shelf>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import LibraryFollowingShelf from './LibraryFollowingShelf.vue'
import LibraryOwnCard from './LibraryOwnCard.vue'
import LibraryShelf from './LibraryShelf.vue'
import { describeLibraryError, type CommunityCollection, type CommunitySave, type LibraryItem } from '@/services/library/api'
import { libraryClient, libraryItems, libraryState, refreshLibrary } from '@/services/library/store'
import { publicationPicture, saveCard, type ShelfCard } from '@/services/library/shelves'
import { itemShelf, loadOwnShelf, OWN_SHELVES, type OwnCard, type OwnShelfId } from '@/services/library/yours'

/** How many saved public prints have their picture read (the service sends none for them). */
const PICTURES = 24

/** What a shelf's row shows; See all has the rest. */
const ROW = 12

interface OwnShelf { cards: OwnCard[], loading: boolean, error: string, loaded: boolean }

/** What an empty shelf says. Shared by you and Designs hide instead. */
const EMPTY: Record<OwnShelfId, string> = {
  sliced: 'Slice something and press Save. It appears here, ready to print on any of your printers.',
  printed: 'What your printers print appears here, to print again.',
  shared: '',
  designs: ''
}

/**
 * Yours (Library v3, page 2), below Continue: your collections (mosaic tiles,
 * then New collection; one opened shows its prints), then one shelf each for
 * Sliced, Printed, Saved, Shared by you and Designs, each with See all. No
 * tab row. Signed in only; MuonLibrary owns the collection list (the quick
 * look's Add to… needs it on Discover too) and reads it again on `changed`.
 *
 * Each shelf reads on its own: one that fails says so with Retry while the
 * others keep working.
 */
@Component({ components: { LibraryFollowingShelf, LibraryOwnCard, LibraryShelf } })
export default class LibraryYoursShelves extends Vue {
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  /** The card whose print is being read (MuonLibrary's), for its Print button. */
  @Prop({ type: String, default: '' }) readonly printing!: string
  @Prop({ type: Array, default: () => [] }) readonly collections!: CommunityCollection[]
  /** Why MuonLibrary couldn't read them, if it couldn't. */
  @Prop({ type: String, default: '' }) readonly collectionsError!: string
  /** Your Library is on and read: your own shelves show. Saved and Collections are the community's and always do. */
  @Prop({ type: Boolean, default: true }) readonly own!: boolean

  ROW = ROW
  /** Each collection's cards, read for its mosaic and when opened. */
  members: Record<string, ShelfCard[]> = {}
  /** Pictures of saved public prints, by publication id. */
  pictures: Record<string, string | null> = {}
  saved: ShelfCard[] = []
  savedLoaded = false
  savedError = ''
  /** Printed and Shared by you, read from the service. Sliced and Designs are the synced Library's. */
  read: Record<'printed' | 'shared', OwnShelf> = {
    printed: blank(),
    shared: blank()
  }

  naming = false
  name = ''
  busy = false
  error = ''
  /** The newest read of each: an older, slower answer must not overwrite it. */
  private reads = 0
  private ownReads: Record<string, number> = {}

  created () {
    this.refresh()
  }

  /** Saved, your own shelves, and every collection's prints. After a heart or Add to… too. */
  async refresh () {
    const read = ++this.reads
    if (this.own) this.readOwn('printed')
    if (this.own) this.readOwn('shared')
    this.savedError = ''
    try {
      const page = await libraryClient().saved()
      if (read !== this.reads) return
      this.saved = cards(page.saves)
    } catch (error) {
      if (read === this.reads) this.savedError = describeLibraryError(error)
    }
    if (read === this.reads) this.savedLoaded = true
    await this.readMembers(read)
  }

  async readOwn (id: OwnShelfId) {
    // Sliced and Designs are the synced Library's: Retry syncs it again.
    if (id === 'sliced' || id === 'designs') {
      refreshLibrary().catch(() => {})
      return
    }
    const read = (this.ownReads[id] = (this.ownReads[id] ?? 0) + 1)
    const shelf = this.read[id]
    shelf.loading = !shelf.loaded
    shelf.error = ''
    try {
      const cards = await loadOwnShelf(id, libraryClient(), libraryItems())
      if (read !== this.ownReads[id]) return
      shelf.cards = cards
      shelf.loaded = true
    } catch (error) {
      // A re-read that failed keeps what the shelf shows; the next sync tries again.
      if (read === this.ownReads[id] && !shelf.cards.length) shelf.error = describeLibraryError(error)
    } finally {
      if (read === this.ownReads[id]) shelf.loading = false
    }
  }

  /**
   * The Library synced something new (a slice saved, a print finished, a
   * share's print arrived): Printed and Shared by you read again. Also while
   * one is still loading: its answer may predate the change, and the newer
   * read wins.
   */
  get syncRev (): number {
    return libraryState.rev
  }

  @Watch('syncRev')
  onSync () {
    if (!this.own) return
    this.readOwn('printed')
    this.readOwn('shared')
  }

  @Watch('own')
  onOwn (own: boolean) {
    if (own) this.onSync()
  }

  /** Every item, from the synced Library: kept current by its sync, never a page short. */
  get items (): LibraryItem[] {
    return libraryItems()
  }

  /** In the mockup's order; Shared by you and Designs only once there is one. */
  get shelves () {
    // Before the first sync: reading, or why it could not (with Retry), not "nothing yet".
    // While Retry reads it again (busy), it is loading, not still failed.
    const failed = !libraryState.synced && !!libraryState.error && !libraryState.busy
    const synced = { loading: !libraryState.synced && !failed, error: failed ? libraryState.error ?? '' : '' }
    const sliced = { ...synced, cards: itemShelf('sliced', this.items) }
    const designs = { ...synced, cards: itemShelf('designs', this.items) }
    const shown = (s: { cards: OwnCard[], error: string }) => s.cards.length > 0 || !!s.error
    return [
      { ...OWN_SHELVES[0], ...sliced, empty: EMPTY.sliced, shown: true },
      { ...OWN_SHELVES[1], ...this.read.printed, empty: EMPTY.printed, shown: true },
      { id: 'saved' as const },
      { ...OWN_SHELVES[2], ...this.read.shared, empty: EMPTY.shared, shown: shown(this.read.shared) },
      { ...OWN_SHELVES[3], ...designs, empty: EMPTY.designs, shown: shown(designs) }
    ]
  }

  @Watch('collections')
  onCollections () {
    this.readMembers(this.reads)
  }

  async readMembers (read: number) {
    await Promise.all(this.collections.slice(0, 12).map(async c => {
      const detail = await libraryClient().collection(c.id).catch(() => null)
      if (read !== this.reads || !detail) return
      this.$set(this.members, c.id, cards(detail.items.map(item => ({ id: item.save_id, target: item.target, card: item.card, created_at: '' }))))
    }))
    this.readPictures()
  }

  /** The service sends no picture for a saved public print: its own page has them. */
  async readPictures () {
    const all = [...this.saved, ...Object.values(this.members).flat()]
    const wanted = all.filter(card => card.kind === 'publication' && !card.picture && !(card.id in this.pictures))
      .map(card => card.id)
      .filter((id, i, ids) => ids.indexOf(id) === i)
      .slice(0, PICTURES)
    for (const id of wanted) this.$set(this.pictures, id, null)
    await Promise.all(wanted.map(async id => {
      this.$set(this.pictures, id, await publicationPicture(id).catch(() => null))
    }))
  }

  withPicture (card: ShelfCard): ShelfCard {
    return card.picture || !this.pictures[card.id] ? card : { ...card, picture: this.pictures[card.id] }
  }

  mosaic (id: string): string[] {
    return (this.members[id] ?? []).map(card => this.withPicture(card).picture).filter((url): url is string => !!url).slice(0, 4)
  }

  async startNaming () {
    this.naming = true
    this.name = ''
    await this.$nextTick()
    ;(this.$refs.name as HTMLInputElement | undefined)?.focus()
  }

  async create () {
    const name = this.name.trim()
    if (!name || this.busy) return
    this.busy = true
    this.error = ''
    try {
      await libraryClient().createCollection(name)
      this.naming = false
      this.$emit('changed')
    } catch (error) {
      this.error = describeLibraryError(error)
    } finally {
      this.busy = false
    }
  }
}

function blank (): OwnShelf {
  return { cards: [], loading: true, error: '', loaded: false }
}

function cards (saves: CommunitySave[] | undefined): ShelfCard[] {
  return (Array.isArray(saves) ? saves : []).map(saveCard).filter((card): card is ShelfCard => !!card)
}
</script>

<style lang="scss">
.myours {
  display: flex;
  flex-direction: column;
  gap: 28px;

  &__new {
    display: flex;
    gap: 6px;

    input {
      height: 32px;
      padding: 0 10px;
      border: 0;
      border-radius: var(--m3d-radius-sm);
      background: var(--m3d-fill, var(--m3d-surface-2));
      color: var(--m3d-text);
      font: inherit;
      font-size: var(--m3d-text-sm);
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 10px;
    min-height: 120px;
    max-width: 420px;
    margin: 0;
  }
}

.mlib-col--new {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 120px;
  color: var(--m3d-accent);
  font-weight: 600;
  border: 1px dashed var(--m3d-border, rgba(255, 255, 255, 0.16));
  background: transparent;
}
</style>
