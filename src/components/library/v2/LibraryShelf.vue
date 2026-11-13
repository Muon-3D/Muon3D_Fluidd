<template>
  <section
    class="mlib-shelf"
    :data-tid="`library-shelf-${id}`"
    :aria-label="title"
    :aria-busy="loading ? 'true' : 'false'"
  >
    <header class="mlib-shelf__head">
      <h2>{{ title }}</h2>
      <span
        v-if="sub"
        class="mlib-muted"
      >{{ sub }}</span>
      <slot name="actions">
        <button
          v-if="seeAll && !loading && !error"
          type="button"
          class="mlib-link"
          :aria-label="`See all ${title}`"
          :data-tid="`library-shelf-${id}-all`"
          @click="$emit('see-all', id)"
        >
          See all ›
        </button>
      </slot>
    </header>

    <div
      v-if="loading"
      class="mlib-shelf__row"
      role="status"
    >
      <span class="mlib-hidden">Loading {{ title }}</span>
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
      v-else-if="error"
      kind="callout"
      :title="error"
      action="Retry"
      :tid="`library-shelf-${id}-error`"
      @action="$emit('retry', id)"
    />

    <!-- Nothing on it: one sentence and one way on (set by the host for a fixed shelf). -->
    <div
      v-else-if="empty && !cards.length"
      class="myours__empty"
      :data-tid="`library-shelf-${id}-empty`"
    >
      <p class="mlib-muted">
        {{ empty }}
      </p>
      <button
        v-if="emptyAction"
        type="button"
        class="mlib-btn mlib-btn--sm"
        :data-tid="`library-shelf-${id}-empty-action`"
        @click="$emit('empty-action', id)"
      >
        {{ emptyAction }}
      </button>
    </div>

    <div
      v-else
      class="mlib-shelf__row"
    >
      <slot>
        <library-model-card
          v-for="card in cards"
          :key="card.key"
          :card="card"
          :printer-name="printerName"
          :busy="printing === card.key"
          :can-save="canSave"
          @print="$emit('print', $event)"
          @open="$emit('open', $event)"
        />
      </slot>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import LibraryModelCard from './LibraryModelCard.vue'
import LibraryState from './LibraryState.vue'
import type { ShelfCard } from '@/services/library/shelves'

/**
 * A shelf (v3 L2): a header row (title, muted line, See all ›), then one
 * row of cards. While it loads it shows skeleton cards in the same place;
 * if it failed, an inline callout with Retry, while the rest of the page
 * keeps working.
 */
@Component({ components: { LibraryModelCard, LibraryState } })
export default class LibraryShelf extends Vue {
  @Prop({ type: String, required: true }) readonly id!: string
  @Prop({ type: String, required: true }) readonly title!: string
  @Prop({ type: String, default: '' }) readonly sub!: string
  @Prop({ type: Array, default: () => [] }) readonly cards!: ShelfCard[]
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: String, default: '' }) readonly printing!: string
  @Prop({ type: Boolean, default: false }) readonly loading!: boolean
  @Prop({ type: String, default: '' }) readonly error!: string
  @Prop({ type: Boolean, default: true }) readonly seeAll!: boolean
  /** Its cards draw the save heart (off for a signed-out visitor on a model's page). */
  @Prop({ type: Boolean, default: true }) readonly canSave!: boolean
  /** What to say when there are no cards (and nothing failed): one sentence. Empty: the row shows as it is. */
  @Prop({ type: String, default: '' }) readonly empty!: string
  /** The one way on from an empty shelf (a button), or none. */
  @Prop({ type: String, default: '' }) readonly emptyAction!: string
}
</script>
