<template>
  <section
    class="mgrid mcoll"
    data-tid="library-collection-page"
    :aria-label="collection ? collection.name : 'Collection'"
  >
    <header class="mgrid__head">
      <div class="mgrid__titles">
        <button
          type="button"
          class="mlib-link mgrid__back"
          data-tid="library-collection-back"
          @click="$emit('back')"
        >
          ‹ Yours
        </button>
        <form
          v-if="renaming"
          class="mcoll__rename"
          @submit.prevent="rename"
        >
          <input
            ref="name"
            v-model="name"
            type="text"
            maxlength="80"
            aria-label="Collection name"
            data-tid="library-collection-rename-input"
            @keydown.esc="renaming = false"
          >
          <button
            type="submit"
            class="mlib-btn mlib-btn--sm mlib-btn--primary"
            :disabled="!name.trim() || saving"
          >
            Save
          </button>
          <button
            type="button"
            class="mlib-btn mlib-btn--sm"
            @click="renaming = false"
          >
            Cancel
          </button>
        </form>
        <h1
          v-else
          data-tid="library-collection-title"
        >
          {{ collection ? collection.name : '' }}
        </h1>
        <p
          v-if="collection"
          class="mlib-muted"
          data-tid="library-collection-line"
        >
          {{ line }}
        </p>
      </div>
      <div
        v-if="collection"
        class="mgrid__acts"
      >
        <div
          class="mlib-seg"
          role="group"
          aria-label="Who can see it"
        >
          <button
            v-for="v in visibilities"
            :key="v.id"
            type="button"
            class="mlib-seg__btn"
            :class="{ 'mlib-seg__btn--on': collection.visibility === v.id }"
            :aria-pressed="collection.visibility === v.id ? 'true' : 'false'"
            :disabled="saving"
            :data-tid="`library-collection-${v.id}`"
            @click="setVisibility(v.id)"
          >
            {{ v.label }}
          </button>
        </div>
        <button
          v-if="!renaming"
          type="button"
          class="mlib-btn"
          data-tid="library-collection-rename"
          @click="startRename"
        >
          <frame-icon
            name="pencil"
            small
          /> Rename
        </button>
        <div class="mcoll__menu">
          <button
            type="button"
            class="mlib-btn mlib-btn--icon"
            aria-label="More"
            :aria-expanded="menu ? 'true' : 'false'"
            data-tid="library-collection-more"
            @click="menu = !menu"
          >
            ···
          </button>
          <div
            v-if="menu"
            class="mcoll__pop"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              class="mcoll__danger"
              data-tid="library-collection-delete"
              @click="confirming = true; menu = false"
            >
              Delete collection
            </button>
          </div>
        </div>
      </div>
    </header>

    <div
      v-if="confirming && collection"
      class="mcoll__confirm"
      role="alertdialog"
      aria-label="Delete this collection"
      data-tid="library-collection-confirm"
    >
      <p>Delete “{{ collection.name }}”? The prints in it stay saved.</p>
      <button
        type="button"
        class="mlib-btn mlib-btn--danger"
        :disabled="saving"
        data-tid="library-collection-confirm-delete"
        @click="remove"
      >
        Delete
      </button>
      <button
        type="button"
        class="mlib-btn"
        @click="confirming = false"
      >
        Keep it
      </button>
    </div>

    <p
      v-if="note"
      class="mlib-muted"
      role="alert"
      data-tid="library-collection-note"
    >
      {{ note }}
    </p>

    <div
      v-if="collection && cards.length > 1"
      class="mcoll__bar"
    >
      <span
        v-if="sort === 'order'"
        class="mlib-muted"
      >Drag a print to change your order (or focus it and press Alt + ← / →).</span>
      <span class="mlib-grow" />
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
          :data-tid="`library-collection-sort-${s.id}`"
          @click="sort = s.id"
        >
          {{ s.label }}
        </button>
      </div>
    </div>

    <div
      v-if="busy && !collection"
      class="mgrid__grid"
      role="status"
    >
      <span class="mlib-hidden">Loading the collection</span>
      <span
        v-for="n in 5"
        :key="n"
        class="mlib-skeleton-card"
      >
        <span class="mlib-skeleton" />
        <span class="mlib-skeleton mlib-skeleton--line" />
      </span>
    </div>

    <library-state
      v-else-if="error && !collection"
      kind="error"
      icon="alert"
      :title="error"
      action="Try again"
      primary
      tid="library-collection-error"
      @action="load"
    />

    <library-state
      v-else-if="collection && !cards.length"
      icon="library"
      title="Nothing in it yet"
      text="Add a print from its quick look: Add to collection."
      tid="library-collection-empty"
    />

    <div
      v-else-if="collection"
      class="mgrid__grid"
      data-tid="library-collection-cards"
    >
      <div
        v-for="(card, i) in shown"
        :key="card.key"
        class="mcoll__cell"
        :class="{ 'mcoll__cell--over': over === card.key }"
        :draggable="sort === 'order' ? 'true' : 'false'"
        :tabindex="sort === 'order' ? 0 : -1"
        :aria-label="sort === 'order' ? `${card.title}, ${i + 1} of ${shown.length}` : undefined"
        :data-tid="`library-collection-cell-${i}`"
        @dragstart="dragStart($event, card.key)"
        @dragover.prevent="over = card.key"
        @dragleave="over = over === card.key ? '' : over"
        @drop.prevent="drop(card.key)"
        @dragend="dragging = ''; over = ''"
        @keydown.alt.left.prevent="move(card.key, -1)"
        @keydown.alt.right.prevent="move(card.key, 1)"
      >
        <library-model-card
          :card="card"
          :printer-name="printerName"
          :busy="printing === card.key"
          @print="$emit('print', $event)"
          @open="$emit('open', $event, collection ? { id: collection.id, name: collection.name } : null)"
        />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import LibraryModelCard from './LibraryModelCard.vue'
import LibraryState from './LibraryState.vue'
import { agoText } from '@/services/library/format'
import { describeLibraryError, type CommunityCollectionDetail, type CommunitySave } from '@/services/library/api'
import { libraryClient } from '@/services/library/store'
import { publicationPicture, saveCard, type ShelfCard } from '@/services/library/shelves'

type Sort = 'order' | 'recent' | 'name'

/** How many public prints have their picture read (the service sends none for them). */
const PICTURES = 48

/** A save's id from its card's key (`save:<id>`, shelves.ts saveCard). */
export function saveIdOf (card: Pick<ShelfCard, 'key'>): string {
  return card.key.startsWith('save:') ? card.key.slice(5) : ''
}

/** Move one key by `step` places, as the reorder call wants the whole list. */
export function moved (keys: string[], key: string, step: number): string[] {
  const from = keys.indexOf(key)
  const to = Math.max(0, Math.min(keys.length - 1, from + step))
  if (from < 0 || from === to) return keys
  const next = [...keys]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

/** Put `key` where `target` is (a drop). */
export function droppedOn (keys: string[], key: string, target: string): string[] {
  const from = keys.indexOf(key)
  const to = keys.indexOf(target)
  if (from < 0 || to < 0 || from === to) return keys
  return moved(keys, key, to - from)
}

/**
 * A collection's own page (Library v3, page 8): its name, how many and who
 * can see it; Private/Public, Rename, and Delete in ··· (with a check).
 * "Your order" is the order you set (drag, or Alt + arrows), kept by the
 * service; Recent and Name sort without changing it. Each card prints from
 * here; its quick look has Remove from <collection>.
 */
@Component({ components: { LibraryModelCard, LibraryState } })
export default class LibraryCollectionPage extends Vue {
  @Prop({ type: String, required: true }) readonly collectionId!: string
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: String, default: '' }) readonly printing!: string

  collection: CommunityCollectionDetail | null = null
  /** The order you set, by card key. */
  order: string[] = []
  /** When each save was made, by save id, for Recent. */
  savedAt: Record<string, string> = {}
  pictures: Record<string, string | null> = {}
  busy = false
  saving = false
  error = ''
  note = ''
  sort: Sort = 'order'
  sorts: Array<{ id: Sort, label: string }> = [{ id: 'order', label: 'Your order' }, { id: 'recent', label: 'Recent' }, { id: 'name', label: 'Name' }]
  visibilities: Array<{ id: 'private' | 'public', label: string }> = [{ id: 'private', label: 'Private' }, { id: 'public', label: 'Public' }]
  renaming = false
  name = ''
  menu = false
  confirming = false
  dragging = ''
  over = ''
  private reads = 0
  /** Reorders go one at a time, in the order they were made. */
  private sending: Promise<void> = Promise.resolve()
  /** How many of this collection's reorders are still to answer: a reload must not put back an order you just changed. */
  private unsent = 0
  /** Counts every reorder made: a read that began before the latest one did not see it. */
  private reorders = 0
  /** Which showing of a collection the reorder bookkeeping is for: each switch starts it afresh (A, B, then A again is a new one). */
  private showing = 0

  @Watch('collectionId', { immediate: true })
  onCollection () {
    this.collection = null
    // Reorders still being sent are the last collection's: this one starts with none.
    this.showing++
    this.order = []
    this.unsent = 0
    this.sending = Promise.resolve()
    // Another collection: nothing open from the last one (a Delete check, Rename, the menu, a note).
    this.confirming = false
    this.renaming = false
    this.menu = false
    this.note = ''
    this.sort = 'order'
    this.load()
  }

  /** Read it again: after a Remove from its quick look, or Try again. */
  async load () {
    const read = ++this.reads
    const reordersBefore = this.reorders
    this.busy = true
    this.error = ''
    try {
      const [detail, saved] = await Promise.all([
        libraryClient().collection(this.collectionId),
        libraryClient().saved().catch(() => null)
      ])
      if (read !== this.reads) return
      this.collection = detail
      // The order you made stands while it is being sent, and when this read began before it.
      if (!this.unsent && reordersBefore === this.reorders) this.order = this.all.map(card => card.key)
      if (saved) this.savedAt = Object.fromEntries((saved.saves ?? []).map((s: CommunitySave) => [s.id, s.created_at]))
      this.readPictures()
    } catch (error) {
      if (read === this.reads) this.error = describeLibraryError(error)
    } finally {
      if (read === this.reads) this.busy = false
    }
  }

  /** Every card, in the service's order (positions). */
  get all (): ShelfCard[] {
    const items = this.collection?.items ?? []
    return items
      .map(item => saveCard({ id: item.save_id, target: item.target, card: item.card, created_at: this.savedAt[item.save_id] ?? '' }))
      .filter((card): card is ShelfCard => !!card)
      .map(card => card.picture || !this.pictures[card.id] ? card : { ...card, picture: this.pictures[card.id] })
  }

  get cards (): ShelfCard[] {
    const byKey = new Map(this.all.map(card => [card.key, card]))
    const ordered = this.order.map(key => byKey.get(key)).filter((card): card is ShelfCard => !!card)
    // Anything the order doesn't know yet goes last.
    return [...ordered, ...this.all.filter(card => !this.order.includes(card.key))]
  }

  get shown (): ShelfCard[] {
    if (this.sort === 'name') return [...this.cards].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
    if (this.sort === 'recent') return [...this.cards].sort((a, b) => (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0))
    return this.cards
  }

  /** "18 prints · private · updated today". */
  get line (): string {
    const c = this.collection
    if (!c) return ''
    const n = this.cards.length
    const updated = agoText(c.updated_at)
    return [`${n} ${n === 1 ? 'print' : 'prints'}`, c.visibility, updated ? `updated ${updated}` : ''].filter(Boolean).join(' · ')
  }

  async readPictures () {
    const wanted = this.all.filter(card => card.kind === 'publication' && !card.picture && !(card.id in this.pictures))
      .map(card => card.id)
      .slice(0, PICTURES)
    for (const id of wanted) this.$set(this.pictures, id, null)
    await Promise.all(wanted.map(async id => {
      this.$set(this.pictures, id, await publicationPicture(id).catch(() => null))
    }))
  }

  async setVisibility (visibility: 'private' | 'public') {
    if (!this.collection || this.collection.visibility === visibility) return
    await this.patch({ visibility })
  }

  async startRename () {
    this.renaming = true
    this.name = this.collection?.name ?? ''
    await this.$nextTick()
    ;(this.$refs.name as HTMLInputElement | undefined)?.focus()
  }

  async rename () {
    const name = this.name.trim()
    if (!name || !this.collection) return
    if (name === this.collection.name) {
      this.renaming = false
      return
    }
    if (await this.patch({ name })) this.renaming = false
  }

  private async patch (patch: { name?: string, visibility?: 'private' | 'public' }): Promise<boolean> {
    if (!this.collection || this.saving) return false
    const id = this.collection.id
    this.saving = true
    this.note = ''
    try {
      const updated = await libraryClient().updateCollection(id, patch)
      this.$emit('changed')
      // Moved on to another collection meanwhile: this answer is not about the one shown.
      if (!this.collection || this.collection.id !== id) return false
      this.collection = { ...this.collection, ...updated, id, items: this.collection.items }
      return true
    } catch (error) {
      if (this.collection?.id === id) this.note = describeLibraryError(error)
      return false
    } finally {
      this.saving = false
    }
  }

  async remove () {
    if (!this.collection || this.saving) return
    this.saving = true
    this.note = ''
    try {
      await libraryClient().deleteCollection(this.collection.id)
      this.$emit('changed')
      // Gone: the host replaces this page in history, so Back does not return to it.
      this.$emit('deleted')
    } catch (error) {
      this.note = describeLibraryError(error)
      this.confirming = false
    } finally {
      this.saving = false
    }
  }

  dragStart (event: DragEvent, key: string) {
    this.dragging = key
    // Some browsers start a drag only with data set.
    event.dataTransfer?.setData('text/plain', key)
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  }

  drop (target: string) {
    const key = this.dragging
    this.dragging = ''
    this.over = ''
    if (key && this.sort === 'order') this.reorder(droppedOn(this.order, key, target))
  }

  async move (key: string, step: number) {
    if (this.sort !== 'order') return
    const sent = this.reorder(moved(this.order, key, step))
    // Keep the moved print focused where it now is, at once (the arrows can move it again)…
    await this.focusOn(key)
    // …and again once the service has answered (after a refusal, where the service put it).
    await sent
    await this.focusOn(key)
  }

  private async focusOn (key: string) {
    await this.$nextTick()
    const index = this.shown.findIndex(card => card.key === key)
    if (index < 0) return
    ;(this.$el.querySelector(`[data-tid="library-collection-cell-${index}"]`) as HTMLElement | null)?.focus()
  }

  /**
   * Your order: shown at once, then sent, one reorder after another so the
   * service ends on the last one you made. If it says no, the order is read
   * again from the service (what it holds), and the note says why.
   */
  reorder (next: string[]): Promise<void> {
    if (!this.collection || next.join() === this.order.join()) return Promise.resolve()
    const id = this.collection.id
    const showing = this.showing
    this.order = next
    this.note = ''
    this.unsent++
    this.reorders++
    // Only while the same showing lasts does the bookkeeping, a note or a reload apply.
    const here = () => this.showing === showing
    const send = async () => {
      try {
        await libraryClient().reorderCollection(id, next.map(key => saveIdOf({ key })))
      } catch (error) {
        if (!here()) return
        this.note = describeLibraryError(error)
        this.unsent--
        await this.load()
        return
      }
      if (here()) this.unsent--
    }
    this.sending = this.sending.then(send)
    return this.sending
  }
}
</script>

<style lang="scss">
.mcoll {
  &__rename {
    display: flex;
    gap: 6px;
    align-items: center;

    input {
      height: 40px;
      width: min(320px, 100%);
      min-width: 0;
      padding: 0 12px;
      border: 0;
      border-radius: var(--m3d-radius-sm);
      background: var(--m3d-fill, var(--m3d-surface-2));
      color: var(--m3d-text);
      font: inherit;
      font-size: 22px;
      font-weight: 700;
    }
  }

  &__menu { position: relative; }

  &__pop {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    z-index: 5;
    min-width: 200px;
    padding: 6px;
    border-radius: var(--m3d-radius-sm);
    background: var(--m3d-surface-2, #1d2024);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);

    button {
      width: 100%;
      padding: 8px 10px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      text-align: left;
      cursor: pointer;

      &:hover, &:focus-visible { background: var(--m3d-fill, rgba(255, 255, 255, 0.06)); }
    }
  }

  &__danger { color: var(--m3d-danger) !important; }

  &__confirm {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
    border-radius: var(--m3d-radius-sm);
    background: var(--m3d-surface-2, #1d2024);

    p { margin: 0 auto 0 0; }
  }

  &__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;

    .mlib-muted { font-size: var(--m3d-text-sm); }
  }

  // A grid cell may shrink to its column (a card's own content must not widen the page on a phone).
  &__cell {
    min-width: 0;
    border-radius: var(--m3d-radius, 14px);

    &[draggable='true'] { cursor: grab; }
    &:focus-visible { outline: 2px solid var(--m3d-accent); outline-offset: 2px; }
  }

  &__cell--over { box-shadow: 0 0 0 2px var(--m3d-accent); }
}

.mlib-btn--danger {
  background: var(--m3d-danger);
  color: #fff;
}
</style>
