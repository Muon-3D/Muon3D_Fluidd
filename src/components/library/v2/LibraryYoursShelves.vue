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
        v-if="error"
        class="mlib-muted"
        role="alert"
      >
        {{ error }}
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
              v-for="src in mosaic(c.id)"
              :key="src"
              :src="src"
              alt=""
            >
          </span>
          <strong>{{ c.name }}</strong>
          <span class="mlib-muted">{{ c.item_count }} {{ c.item_count === 1 ? 'print' : 'prints' }}</span>
        </button>
      </div>
      <p
        v-else-if="loaded"
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
          :card="card"
          :printer-name="printerName"
          :busy="printing === card.key"
          @print="$emit('print', $event)"
          @open="$emit('open', $event)"
        />
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import LibraryModelCard from './LibraryModelCard.vue'
import { describeLibraryError, type CommunityCollection, type CommunitySave } from '@/services/library/api'
import { safePicture } from '@/services/library/discover'
import { libraryClient } from '@/services/library/store'
import { saveCard, type ShelfCard } from '@/services/library/shelves'

/**
 * Yours, above your own prints: your collections (mosaic tiles; one opened
 * shows its prints) and what you saved from Discover, as cards that print
 * from where they are. Signed in only; the host shows it then.
 */
@Component({ components: { LibraryModelCard } })
export default class LibraryYoursShelves extends Vue {
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  /** The card whose print is being read (MuonLibrary's), for its Print button. */
  @Prop({ type: String, default: '' }) readonly printing!: string

  collections: CommunityCollection[] = []
  pictures: Record<string, string[]> = {}
  saved: ShelfCard[] = []
  opened: ShelfCard[] = []
  openId = ''
  loaded = false
  naming = false
  name = ''
  busy = false
  error = ''

  created () {
    this.load()
  }

  async load () {
    this.error = ''
    try {
      const client = libraryClient()
      const [collections, saved] = await Promise.all([client.collections(), client.saved()])
      this.collections = Array.isArray(collections.collections) ? collections.collections : []
      this.saved = (Array.isArray(saved.saves) ? saved.saves : []).map(saveCard).filter((card): card is ShelfCard => !!card)
      this.loaded = true
      // Each tile's mosaic: its first four pictures.
      await Promise.all(this.collections.slice(0, 12).map(async c => {
        const detail = await client.collection(c.id).catch(() => null)
        const pics = (detail?.items ?? []).map(item => safePicture(item.card.thumbnail_url)).filter((url): url is string => !!url)
        this.$set(this.pictures, c.id, pics.slice(0, 4))
      }))
    } catch (error) {
      this.error = describeLibraryError(error)
      this.loaded = true
    }
  }

  mosaic (id: string): string[] {
    return this.pictures[id] ?? []
  }

  get shelf (): { title: string, sub: string, cards: ShelfCard[] } {
    const open = this.collections.find(c => c.id === this.openId)
    if (open) return { title: open.name, sub: `${open.item_count} ${open.item_count === 1 ? 'print' : 'prints'}`, cards: this.opened }
    return { title: 'Saved', sub: 'From Discover', cards: this.saved }
  }

  async toggle (id: string) {
    if (this.openId === id) {
      this.openId = ''
      return
    }
    this.openId = id
    this.opened = []
    try {
      const detail = await libraryClient().collection(id)
      if (this.openId !== id) return
      this.opened = detail.items.map(item => saveCard({ id: item.save_id, target: item.target, card: item.card, created_at: '' } as CommunitySave))
        .filter((card): card is ShelfCard => !!card)
    } catch (error) {
      if (this.openId === id) this.error = describeLibraryError(error)
    }
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
      const made = await libraryClient().createCollection(name)
      this.collections = [made, ...this.collections]
      this.naming = false
      this.$emit('collections', this.collections)
    } catch (error) {
      this.error = describeLibraryError(error)
    } finally {
      this.busy = false
    }
  }
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
