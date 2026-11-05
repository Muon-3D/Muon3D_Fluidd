<template>
  <div
    class="myours"
    data-tid="library-yours-shelves"
  >
    <!-- Collections: mosaic tiles, and New. One open shows its prints as a shelf. -->
    <section class="mlib-shelf">
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
      <div
        v-if="collections.length"
        class="mlib-cols"
      >
        <button
          v-for="c in collections"
          :key="c.id"
          type="button"
          class="mlib-col"
          :class="{ 'mlib-col--on': openId === c.id }"
          :aria-pressed="openId === c.id ? 'true' : 'false'"
          :data-tid="`library-collection-${c.id}`"
          @click="toggle(c.id)"
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
      </div>
      <p
        v-else-if="loaded && !collectionsError"
        class="mlib-muted"
      >
        Make a collection, then add prints to it from their quick look.
      </p>
    </section>

    <section
      v-if="shelf.cards.length"
      class="mlib-shelf"
      :data-tid="openId ? 'library-collection-open' : 'library-saved'"
    >
      <header class="mlib-shelf__head">
        <h2>{{ shelf.title }}</h2>
        <span class="mlib-muted">{{ shelf.sub }}</span>
      </header>
      <div class="mlib-shelf__row">
        <library-model-card
          v-for="card in shelf.cards"
          :key="card.key"
          :card="withPicture(card)"
          :printer-name="printerName"
          :busy="printing === card.key"
          @print="$emit('print', withPicture($event))"
          @open="$emit('open', withPicture($event))"
        />
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import LibraryModelCard from './LibraryModelCard.vue'
import { describeLibraryError, type CommunityCollection, type CommunitySave } from '@/services/library/api'
import { libraryClient } from '@/services/library/store'
import { publicationPicture, saveCard, type ShelfCard } from '@/services/library/shelves'

/** How many saved public prints have their picture read (the service sends none for them). */
const PICTURES = 24

/**
 * Yours, above your own prints: your collections (mosaic tiles; one opened
 * shows its prints) and what you saved from Discover, as cards that print
 * from where they are. Signed in only; MuonLibrary owns the collection list
 * (the quick look's Add to… needs it on Discover too) and reads it again on
 * `changed`.
 */
@Component({ components: { LibraryModelCard } })
export default class LibraryYoursShelves extends Vue {
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  /** The card whose print is being read (MuonLibrary's), for its Print button. */
  @Prop({ type: String, default: '' }) readonly printing!: string
  @Prop({ type: Array, default: () => [] }) readonly collections!: CommunityCollection[]
  /** Why MuonLibrary couldn't read them, if it couldn't. */
  @Prop({ type: String, default: '' }) readonly collectionsError!: string

  /** Each collection's cards, read for its mosaic and when opened. */
  members: Record<string, ShelfCard[]> = {}
  /** Pictures of saved public prints, by publication id. */
  pictures: Record<string, string | null> = {}
  saved: ShelfCard[] = []
  openId = ''
  loaded = false
  naming = false
  name = ''
  busy = false
  error = ''
  /** The newest read: an older, slower answer must not overwrite it. */
  private reads = 0

  created () {
    this.refresh()
  }

  /** Saved, and every collection's prints. After a heart or Add to… too. */
  async refresh () {
    const read = ++this.reads
    this.error = ''
    try {
      const page = await libraryClient().saved()
      if (read !== this.reads) return
      this.saved = cards(page.saves)
    } catch (error) {
      if (read === this.reads) this.error = describeLibraryError(error)
    }
    await this.readMembers(read)
    if (read === this.reads) this.loaded = true
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

  get shelf (): { title: string, sub: string, cards: ShelfCard[] } {
    const open = this.collections.find(c => c.id === this.openId)
    if (open) return { title: open.name, sub: `${open.item_count} ${open.item_count === 1 ? 'print' : 'prints'}`, cards: this.members[open.id] ?? [] }
    return { title: 'Saved', sub: 'From Discover', cards: this.saved }
  }

  toggle (id: string) {
    this.openId = this.openId === id ? '' : id
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
}

.mlib-col--on { box-shadow: inset 0 0 0 2px var(--m3d-accent); }
</style>
