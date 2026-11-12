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
        width="512"
        height="512"
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
        <span class="mcard__print-label">{{ busy ? 'Opening…' : printerName ? `Print on ${printerName}` : 'Print' }}</span>
        <span
          class="mcard__print-short"
          aria-hidden="true"
        >{{ busy ? 'Opening…' : 'Print' }}</span>
      </button>
      <button
        v-if="canSave"
        type="button"
        class="mlib-btn mlib-btn--sm mlib-btn--icon"
        :aria-label="saved ? `Unsave ${card.title}` : `Save ${card.title}`"
        :aria-pressed="saved ? 'true' : 'false'"
        :disabled="saving"
        data-tid="library-card-save"
        @click="save"
      >
        <svg
          class="mlib-i"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        ><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
      </button>
    </div>
    <div class="mcard__meta">
      <span
        class="mcard__fit"
        data-tid="library-card-fit"
        title="Based on published dimensions in the current orientation. Slicing and material are checked before printing."
      >{{ fitLabel }}</span>
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
          :aria-label="`${card.makes} made`"
        ><frame-icon
          name="printer"
          small
        />{{ count(card.makes) }}</span>
      </span>
      <span
        v-if="card.facts"
        class="mcard__facts"
      >{{ card.facts }}</span>
      <span
        v-if="saveNote"
        class="mcard__note"
        role="status"
      >{{ saveNote }}</span>
    </div>
  </article>
</template>

<script lang="ts">
import { Component, Inject, Prop, Vue, Watch } from 'vue-property-decorator'
import type { ShelfCard } from '@/services/library/shelves'
import { dimensionFit } from '@/services/library/catalogue'
import { cardSaves, cardSaveKey, readCardSave, toggleCardSave } from '@/services/library/card-saves'

/** One print on a shelf: a big picture, Print on <printer>, and Quick look. */
@Component({})
export default class LibraryModelCard extends Vue {
  @Prop({ type: Object, required: true }) readonly card!: ShelfCard
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  @Prop({ type: Boolean, default: false }) readonly busy!: boolean
  /** Draw the save heart. Off where a signed-out visitor would only be sent to sign in. */
  @Prop({ type: Boolean, default: true }) readonly canSave!: boolean
  @Inject({ default: null }) readonly libraryCardContext!: (() => { volume: { x: number, y: number, z: number } | null, printerName: string | null, signedIn: boolean, signIn: () => void }) | null
  signedOutNote = ''
  get signedIn (): boolean { return !!this.libraryCardContext?.().signedIn }
  get saveKey (): string { return cardSaveKey(this.card.id, this.card.kind) }
  get saved (): boolean { return !!cardSaves.ids[this.saveKey] }
  get saving (): boolean { return !!cardSaves.busy[this.saveKey] }
  get saveNote (): string { return cardSaves.errors[this.saveKey] || this.signedOutNote }
  get fitLabel (): string {
    const context = this.libraryCardContext?.()
    const fit = dimensionFit(this.card.size, context?.volume ?? null)
    return fit === null ? 'Check print size' : fit ? `Fits ${context?.printerName || 'this printer'}` : 'Does not fit as oriented'
  }

  @Watch('signedIn', { immediate: true })
  @Watch('card.id')
  readSaved () { if (this.signedIn) readCardSave(this.card.id, this.card.kind) }

  async save () {
    if (!this.signedIn) { this.signedOutNote = 'Sign in to save this print.'; this.libraryCardContext?.().signIn(); return }
    await toggleCardSave(this.card.id, this.card.kind)
  }

  count (n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  }
}
</script>
