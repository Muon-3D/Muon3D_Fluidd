<template>
  <article
    class="mcard"
    :data-tid="`library-card-${card.key}`"
  >
    <button
      type="button"
      class="mcard__pic"
      :aria-label="`Quick look at ${card.title}`"
      @click="$emit('open', card)"
    >
      <img
        v-if="card.picture"
        :src="card.picture"
        alt=""
        loading="lazy"
      >
      <span
        v-else
        class="mcard__blank"
      ><frame-icon
        name="library"
        large
      /></span>
      <span
        v-if="card.m1"
        class="mlib-badge mlib-badge--glass mcard__badge"
      >Made for M1</span>
      <span
        v-if="card.material"
        class="mlib-badge mlib-badge--glass mcard__fil"
        data-tid="library-card-filament"
      ><span
        v-if="card.colour"
        class="mcard__dot"
        :style="{ background: card.colour }"
      />{{ card.material }}</span>
    </button>
    <div class="mcard__act">
      <button
        type="button"
        class="mlib-btn mlib-btn--primary mlib-btn--sm mcard__print"
        :disabled="busy"
        :aria-label="printerName ? `Print ${card.title} on ${printerName}` : `Print ${card.title}`"
        data-tid="library-card-print"
        @click="$emit('print', card)"
      >
        <frame-icon
          name="printer"
          small
        />
        {{ busy ? 'Opening…' : printerName ? `Print on ${printerName}` : 'Print' }}
      </button>
      <button
        type="button"
        class="mlib-btn mlib-btn--sm mlib-btn--icon"
        :aria-label="`Quick look at ${card.title}`"
        @click="$emit('open', card)"
      >
        <frame-icon
          name="eye"
          small
        />
      </button>
    </div>
    <div class="mcard__meta">
      <strong
        class="mcard__title"
        :title="card.title"
      >{{ card.title }}</strong>
      <span class="mcard__by">
        {{ card.creator }}
        <span class="mlib-grow" />
        <span
          v-if="card.saves"
          class="mlib-stat"
          :aria-label="`${card.saves} saves`"
        >♡ {{ count(card.saves) }}</span>
        <span
          v-else-if="card.makes"
          class="mlib-stat"
        ><frame-icon
          name="printer"
          small
        />{{ count(card.makes) }}</span>
      </span>
      <span
        v-if="card.facts"
        class="mcard__facts"
      >{{ card.facts }}</span>
    </div>
  </article>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { ShelfCard } from '@/services/library/shelves'

/** One print on a shelf: a big picture, Print on <printer>, and Quick look. */
@Component({})
export default class LibraryModelCard extends Vue {
  @Prop({ type: Object, required: true }) readonly card!: ShelfCard
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: Boolean, default: false }) readonly busy!: boolean

  count (n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  }
}
</script>
