<template>
  <section
    class="ov-card overview-editor"
    aria-label="Customise Overview"
    data-tid="overview-panel"
  >
    <div class="ov-card__head">
      <h2 class="ov-card__title">
        Customise
      </h2>
      <button
        type="button"
        class="cbtn"
        data-tid="overview-done"
        @click="$emit('close')"
      >
        Done
      </button>
    </div>
    <p>M1 and this print, with Pause and Stop, are always here. Changes apply straight away. Drag a card or use the arrows to reorder.</p>
    <div
      v-for="card in rows"
      :key="card.id"
      class="overview-editor__row"
      :data-card="card.id"
      :draggable="selected.includes(card.id)"
      @dragstart="dragged = card.id"
      @dragover.prevent
      @drop.prevent="drop(card.id)"
    >
      <label>
        <input
          type="checkbox"
          role="switch"
          :checked="selected.includes(card.id)"
          :disabled="!!unavailable[card.id] && !selected.includes(card.id)"
          @change="toggleEvent(card.id, $event)"
        >
        <span>
          {{ card.title }}
          <small>{{ unavailable[card.id] || card.needs }}</small>
        </span>
      </label>
      <template v-if="selected.includes(card.id)">
        <button
          type="button"
          class="cbtn"
          :disabled="selected.indexOf(card.id) === 0"
          :aria-label="`Move ${card.title} up`"
          @click="move(card.id, -1)"
        >
          ↑
        </button>
        <button
          type="button"
          class="cbtn"
          :disabled="selected.indexOf(card.id) === selected.length - 1"
          :aria-label="`Move ${card.title} down`"
          @click="move(card.id, 1)"
        >
          ↓
        </button>
      </template>
    </div>
    <div class="overview-editor__foot">
      <button
        type="button"
        class="cbtn"
        data-tid="overview-reset"
        @click="$emit('input', null)"
      >
        Reset to default
      </button>
      <small v-if="note">{{ note }}</small>
    </div>
  </section>
</template>
<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { cardLayout, moveCard, overviewCards } from '@/services/overview/cards'
@Component
export default class OverviewCards extends Vue {
  @Prop({ type: Array, required: true }) readonly value!: string[]
  @Prop({ type: String, default: '' }) readonly note!: string
  @Prop({ type: Object, default: () => ({}) }) readonly unavailable!: Record<string, string>
  dragged = ''
  get selected (): string[] { return cardLayout(this.value) }
  get rows () { return [...this.selected.map(id => overviewCards.find(c => c.id === id)!), ...overviewCards.filter(c => !this.selected.includes(c.id))] }
  toggle (id: string, on: boolean) {
    if (this.unavailable[id] && on) return
    this.$emit('input', on ? cardLayout([...this.selected, id]) : this.selected.filter(c => c !== id))
  }

  toggleEvent (id: string, event: Event) {
    if (event.target instanceof HTMLInputElement) this.toggle(id, event.target.checked)
  }

  move (id: string, by: number) { this.$emit('input', moveCard(this.selected, id, by)) }
  drop (id: string) {
    if (!this.selected.includes(this.dragged) || !this.selected.includes(id)) return
    this.move(this.dragged, this.selected.indexOf(id) - this.selected.indexOf(this.dragged))
    this.dragged = ''
  }
}
</script>
<style scoped>
.overview-editor__row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-top: 1px solid var(--m3d-border); }
.overview-editor__row .cbtn { min-width: 44px; min-height: 44px; }
.overview-editor label { display: flex; flex: 1; align-items: center; gap: 12px; min-height: 44px; min-width: 0; }
.overview-editor input { flex: none; width: 20px; height: 20px; margin: 0; }
.overview-editor small { display: block; color: var(--m3d-text-subtle); }
.overview-editor p { margin: 0; color: var(--m3d-text-muted); }
.overview-editor__foot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding-top: 6px; border-top: 1px solid var(--m3d-border); }
</style>
