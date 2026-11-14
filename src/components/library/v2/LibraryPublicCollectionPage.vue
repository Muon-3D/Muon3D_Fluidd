<template>
  <section
    class="mgrid mcoll mpubcoll"
    data-tid="library-public-collection"
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
        <h1
          ref="heading"
          tabindex="-1"
          data-tid="library-collection-title"
        >
          {{ title }}
        </h1>
        <p
          v-if="collection && collection.description"
          data-tid="library-collection-description"
        >
          {{ collection.description }}
        </p>
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
        <button
          v-if="!signedIn"
          type="button"
          class="mlib-btn mlib-btn--primary"
          data-tid="library-collection-sign-in"
          @click="$emit('sign-in')"
        >
          Sign in to follow
        </button>
        <button
          v-else-if="canFollow"
          type="button"
          class="mlib-btn"
          :class="{ 'mlib-btn--primary': !following }"
          :aria-pressed="following ? 'true' : 'false'"
          :disabled="followBusy"
          data-tid="library-collection-follow"
          @click="toggle"
        >
          {{ following ? 'Following' : 'Follow' }}
        </button>
      </div>
    </header>

    <p
      v-if="note"
      class="mlib-muted"
      role="alert"
      data-tid="library-collection-note"
    >
      {{ note }}
    </p>

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
      v-else-if="unavailable"
      icon="library"
      title="This collection is not available."
      text="It may be private, or its owner may have removed it."
      tid="library-collection-unavailable"
    />

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
      tid="library-collection-empty"
    />

    <div
      v-else-if="collection"
      class="mgrid__grid"
      data-tid="library-collection-cards"
    >
      <library-model-card
        v-for="card in cards"
        :key="card.key"
        :card="card"
        :printer-name="printerName"
        :busy="printing === card.key"
        :can-save="false"
        @print="$emit('print', $event)"
        @open="$emit('open', $event)"
      />
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import LibraryModelCard from './LibraryModelCard.vue'
import LibraryState from './LibraryState.vue'
import { describeLibraryError, LibraryError, type CommunityCollectionDetail } from '@/services/library/api'
import { CollectionUnavailable, followedList, loadPublicCollection, printCount } from '@/services/library/follow'
import { libraryClient } from '@/services/library/store'
import { cloudState } from '@/services/muon-cloud/state'
import { publicationPicture, saveCard, type ShelfCard } from '@/services/library/shelves'

/** How many public prints have their picture read (the service sends none for them). */
const PICTURES = 48

/**
 * Someone else's public collection, read-only: its name, description and
 * prints (each opens its quick look and page), with Follow / Following. The
 * read needs no account. Follow shows at once and goes back, saying why, if
 * the service refuses (its own words for the 500-follow limit). Signed out it
 * says Sign in to follow; `canFollow` is false while your own collections
 * are unknown, so your own never offers it. Everything the service sends is
 * drawn as text.
 */
@Component({ components: { LibraryModelCard, LibraryState } })
export default class LibraryPublicCollectionPage extends Vue {
  @Prop({ type: String, required: true }) readonly collectionId!: string
  @Prop({ type: Boolean, default: false }) readonly signedIn!: boolean
  /** Signed in and known not to be yours: Follow may show. */
  @Prop({ type: Boolean, default: false }) readonly canFollow!: boolean
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: String, default: '' }) readonly printing!: string

  collection: CommunityCollectionDetail | null = null
  pictures: Record<string, string | null> = {}
  busy = false
  error = ''
  note = ''
  unavailable = false
  following = false
  followBusy = false
  private reads = 0
  private focusedFor = ''

  get title (): string {
    if (this.collection) return this.collection.name
    return this.unavailable ? 'Collection not available' : 'Collection'
  }

  get cards (): ShelfCard[] {
    return (this.collection?.items ?? [])
      .map(item => saveCard({ id: item.save_id, target: item.target, card: item.card, created_at: '' }))
      .filter((card): card is ShelfCard => !!card)
      .map(card => card.picture || !this.pictures[card.id] ? card : { ...card, picture: this.pictures[card.id] })
  }

  get line (): string {
    return printCount(this.cards.length)
  }

  @Watch('collectionId', { immediate: true })
  onCollection () {
    this.collection = null
    this.unavailable = false
    this.following = false
    this.note = ''
    this.load()
  }

  @Watch('signedIn')
  onSignedIn () {
    this.readFollowing()
  }

  get accountId (): string | null { return cloudState.account?.id ?? null }

  /** Another account: the last one's Following is not this one's. */
  @Watch('accountId')
  onAccount () {
    this.following = false
    this.followBusy = false
    this.note = ''
    this.readFollowing()
  }

  async load () {
    const read = ++this.reads
    this.busy = true
    this.error = ''
    this.unavailable = false
    try {
      const [detail] = await Promise.all([loadPublicCollection(this.collectionId), this.readFollowing()])
      if (read !== this.reads) return
      this.collection = detail
      this.readPictures()
    } catch (error) {
      if (read !== this.reads) return
      if (error instanceof CollectionUnavailable) this.unavailable = true
      else this.error = describeLibraryError(error)
    } finally {
      if (read === this.reads) {
        this.busy = false
        this.focusHeading()
      }
    }
  }

  /** Whether you already follow it: in the list of the ones you do. A list that won't read leaves it as Follow. */
  async readFollowing () {
    if (!this.signedIn) {
      this.following = false
      return
    }
    const id = this.collectionId
    const account = this.accountId
    try {
      const list = followedList(await libraryClient().followedCollections())
      if (id === this.collectionId && account === this.accountId && !this.followBusy) this.following = list.some(c => c.id === id)
    } catch {
      // Follow stays offered; following twice is harmless.
    }
  }

  private async focusHeading () {
    if (this.focusedFor === this.collectionId) return
    this.focusedFor = this.collectionId
    await this.$nextTick()
    ;(this.$refs.heading as HTMLElement | undefined)?.focus({ preventScroll: true })
  }

  /** Follow or unfollow: shown at once, put back with the reason if it fails. */
  async toggle () {
    if (!this.collection || this.followBusy) return
    const id = this.collectionId
    const was = this.following
    const account = this.accountId
    this.followBusy = true
    this.note = ''
    this.following = !was
    try {
      if (was) await libraryClient().unfollowCollection(id)
      else await libraryClient().followCollection(id)
    } catch (error) {
      if (id === this.collectionId && account === this.accountId) {
        this.following = was
        this.note = this.refusal(error, was)
      }
    } finally {
      if (account === this.accountId) this.followBusy = false
    }
  }

  /** The service's own words for its limit; otherwise what failed, then why. */
  private refusal (error: unknown, wasFollowing: boolean): string {
    if (error instanceof LibraryError && error.code === 'follow_limit') return error.message
    return `Couldn't ${wasFollowing ? 'unfollow' : 'follow'} this collection. ${describeLibraryError(error)}`
  }

  async readPictures () {
    const wanted = this.cards.filter(card => card.kind === 'publication' && !card.picture && !(card.id in this.pictures))
      .map(card => card.id)
      .slice(0, PICTURES)
    for (const id of wanted) this.$set(this.pictures, id, null)
    await Promise.all(wanted.map(async id => {
      this.$set(this.pictures, id, await publicationPicture(id).catch(() => null))
    }))
  }
}
</script>
