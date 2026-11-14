<template>
  <library-shelf
    v-if="signedIn"
    id="following"
    title="Following"
    sub="Public collections you follow"
    :loading="loading"
    :error="error"
    :see-all="false"
    :empty="collections.length ? '' : 'You don\'t follow any collections yet.'"
    empty-action="Discover"
    :cards="[]"
    data-tid="library-following"
    @retry="load"
    @empty-action="$emit('go-discover')"
  >
    <p
      v-if="note"
      class="mlib-muted"
      role="alert"
      data-tid="library-following-note"
    >
      {{ note }}
    </p>
    <div
      v-if="collections.length"
      class="mlib-cols mfollow"
    >
      <div
        v-for="c in collections"
        :key="c.id"
        class="mlib-col mfollow__tile"
        :data-tid="`library-following-${c.id}`"
      >
        <button
          type="button"
          class="mfollow__open"
          :aria-label="`${c.name}, ${count(c.item_count)}`"
          :data-tid="`library-following-open-${c.id}`"
          @click="$emit('open-collection', c.id)"
        >
          <strong>{{ c.name }}</strong>
          <span class="mlib-muted">{{ count(c.item_count) }}</span>
        </button>
        <button
          type="button"
          class="mlib-btn mlib-btn--sm"
          :aria-label="`Unfollow ${c.name}`"
          :disabled="busyId === c.id"
          :data-tid="`library-following-unfollow-${c.id}`"
          @click="unfollow(c)"
        >
          Unfollow
        </button>
      </div>
    </div>
  </library-shelf>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import LibraryShelf from './LibraryShelf.vue'
import { describeLibraryError, type CommunityCollection } from '@/services/library/api'
import { followedList, printCount } from '@/services/library/follow'
import { libraryClient } from '@/services/library/store'

/**
 * Following, on Yours: the public collections you follow (their name and how
 * many prints), each opening its public view, with Unfollow. Signed in only.
 * It reads on its own: if that fails it says so with Retry and the rest of
 * Yours keeps working. Names come from the service and are drawn as text.
 */
@Component({ components: { LibraryShelf } })
export default class LibraryFollowingShelf extends Vue {
  @Prop({ type: Boolean, default: true }) readonly signedIn!: boolean

  collections: CommunityCollection[] = []
  loading = true
  error = ''
  note = ''
  busyId = ''
  private reads = 0

  created () {
    if (this.signedIn) this.load()
  }

  count (n: number): string {
    return printCount(Number.isFinite(n) ? n : 0)
  }

  async load () {
    if (!this.signedIn) return
    const read = ++this.reads
    this.loading = !this.collections.length
    this.error = ''
    try {
      const answer = await libraryClient().followedCollections()
      if (read !== this.reads) return
      this.collections = followedList(answer)
    } catch (error) {
      if (read === this.reads) this.error = describeLibraryError(error)
    } finally {
      if (read === this.reads) this.loading = false
    }
  }

  /** Gone from the shelf at once; put back, with why, if the service says no. */
  async unfollow (collection: CommunityCollection) {
    if (this.busyId) return
    const before = this.collections
    this.busyId = collection.id
    this.note = ''
    this.collections = before.filter(c => c.id !== collection.id)
    try {
      await libraryClient().unfollowCollection(collection.id)
    } catch (error) {
      this.collections = before
      this.note = `Couldn't unfollow ${collection.name}. ${describeLibraryError(error)}`
    } finally {
      this.busyId = ''
    }
  }
}
</script>

<style lang="scss">
.mfollow {
  &__tile {
    gap: 8px;
  }

  &__open {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    width: 100%;
    padding: 6px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
}
</style>
