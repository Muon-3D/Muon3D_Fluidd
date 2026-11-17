<template>
  <article
    class="mcard"
    :data-tid="`library-own-${card.key}`"
  >
    <component
      :is="card.item ? 'button' : 'div'"
      :type="card.item ? 'button' : null"
      class="mcard__pic"
      :aria-label="card.item ? `Open ${card.title}` : null"
      @click="card.item && $emit('open', card)"
    >
      <img
        v-if="picture"
        :src="picture"
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
        v-if="card.material"
        class="mlib-badge mlib-badge--glass mcard__fil"
        data-tid="library-card-filament"
      >{{ card.material }}</span>
    </component>
    <div
      v-if="card.action"
      class="mcard__act"
    >
      <button
        type="button"
        class="mlib-btn mlib-btn--primary mlib-btn--sm mcard__print"
        :disabled="busy"
        :aria-label="actionLabel"
        data-tid="library-own-act"
        @click="$emit('act', card)"
      >
        <frame-icon
          :name="card.action === 'slice' ? 'slice' : 'printer'"
          small
        />
        {{ busy ? 'Opening…' : actionText }}
      </button>
      <button
        v-if="card.item"
        type="button"
        class="mlib-btn mlib-btn--sm mlib-btn--icon"
        :aria-label="`Open ${card.title}`"
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
        <span
          v-if="card.facts"
          class="mcard__facts"
        >{{ card.facts }}</span>
        <span class="mlib-grow" />
        <span
          v-if="card.note"
          class="mlib-muted"
        >{{ card.note }}</span>
      </span>
    </div>
  </article>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { loadThumbnail, thumbnailFor } from '@/services/library/thumbnails'
import type { OwnCard } from '@/services/library/yours'

/**
 * One of your own prints on a Yours shelf (Library v3): its thumbnail, what
 * that shelf does with it (Print on <printer>, Print again, Slice), and Open.
 * The same card size and glass as Discover's (LibraryModelCard).
 */
@Component({})
export default class LibraryOwnCard extends Vue {
  @Prop({ type: Object, required: true }) readonly card!: OwnCard
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: Boolean, default: false }) readonly busy!: boolean

  @Watch('card', { immediate: true })
  onCard (card: OwnCard) {
    if (card.item) loadThumbnail(card.item)
  }

  get picture (): string | null {
    return this.card.item ? thumbnailFor(this.card.item) : null
  }

  get actionText (): string {
    switch (this.card.action) {
      case 'again': return 'Print again'
      case 'slice': return 'Slice'
      default: return this.printerName ? `Print on ${this.printerName}` : 'Print'
    }
  }

  get actionLabel (): string {
    return `${this.actionText}: ${this.card.title}`
  }
}
</script>
