<template>
  <div
    class="mc-search"
    @focusout="onBlur"
  >
    <label class="mlib-search">
      <frame-icon
        name="search"
        small
      />
      <input
        ref="input"
        v-model="draft"
        type="search"
        role="combobox"
        aria-label="Search Discover"
        placeholder="Search models, makers, tags"
        maxlength="64"
        aria-autocomplete="list"
        :aria-expanded="expanded ? 'true' : 'false'"
        :aria-controls="`${uid}-list`"
        :aria-activedescendant="expanded && active >= 0 ? `${uid}-${active}` : undefined"
        :data-tid="tid"
        @input="queue"
        @focus="focused = true"
        @keydown="onKey"
      >
    </label>
    <div
      v-if="expanded"
      class="mc-search__menu"
      data-tid="library-suggestions"
    >
      <ul
        :id="`${uid}-list`"
        role="listbox"
        aria-label="Suggested models"
      >
        <li
          v-for="(item, index) in items"
          :id="`${uid}-${index}`"
          :key="item.id"
          role="option"
          :aria-selected="active === index ? 'true' : 'false'"
          @mousedown.prevent="choose(item)"
          @mousemove="active = index"
        >
          <img
            v-if="picture(item)"
            :src="picture(item) || undefined"
            width="44"
            height="44"
            alt=""
          >
          <span><strong>{{ item.title }}</strong><small>{{ item.creator.display_name || item.creator.handle || 'Muon3D maker' }}</small></span>
        </li>
      </ul>
      <button
        type="button"
        class="mlib-link"
        @mousedown.prevent
        @click="submit"
      >
        Search all for “{{ draft.trim() }}”
      </button>
      <p
        v-if="note"
        role="status"
        class="mlib-muted"
      >
        {{ note }}
      </p>
    </div>
    <span
      class="mlib-hidden"
      role="status"
    >{{ loading ? 'Finding suggestions' : items.length ? `${items.length} suggestions. Use the arrow keys to choose.` : '' }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import { suggestions } from '@/services/library/catalogue'
import { safePicture } from '@/services/library/discover'
import type { PublicationSummary } from '@/services/library/shelves'

let nextId = 0
@Component({})
export default class LibrarySearchBox extends Vue {
  @Prop({ type: String, default: '' }) readonly value!: string
  @Prop({ type: String, default: 'library-discover-find' }) readonly tid!: string
  @Prop({ type: Boolean, default: false }) readonly instant!: boolean
  uid = `library-search-${++nextId}`
  draft = ''
  focused = false
  active = -1
  items: PublicationSummary[] = []
  note = ''
  loading = false
  timer: ReturnType<typeof setTimeout> | null = null
  controller: AbortController | null = null
  @Watch('value', { immediate: true }) onValue () { this.draft = this.value }
  get expanded (): boolean { return this.focused && this.draft.trim().length >= 2 }
  picture (item: PublicationSummary): string | null { return safePicture(item.thumbnail_url) }
  onBlur (event: FocusEvent) { if (!this.$el.contains(event.relatedTarget as Node | null)) this.focused = false }
  queue () {
    this.$emit('input', this.draft)
    this.controller?.abort()
    if (this.timer) clearTimeout(this.timer)
    this.items = []
    this.loading = false
    this.active = -1
    this.note = ''
    if (this.draft.trim().length < 2) return
    this.timer = setTimeout(() => this.read(), 250)
  }

  async read () {
    const controller = this.controller = new AbortController()
    const query = this.draft.trim()
    this.loading = true
    if (this.instant) this.$emit('search', query)
    try { const items = await suggestions(query, controller.signal); if (!controller.signal.aborted) this.items = items } catch (error) {
      if (!controller.signal.aborted) this.note = error instanceof Error ? error.message : String(error)
    } finally { if (!controller.signal.aborted) this.loading = false }
  }

  choose (item: PublicationSummary) { this.focused = false; this.$emit('open', item) }
  submit () { this.focused = false; if (this.timer) clearTimeout(this.timer); this.controller?.abort(); if (this.draft.trim().length >= 2) this.$emit('search', this.draft.trim()) }
  onKey (event: KeyboardEvent) {
    if (event.isComposing) return
    if (event.key === 'Escape') { this.focused = false; event.preventDefault() }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); this.focused = true
      this.active = this.items.length ? (this.active + (event.key === 'ArrowDown' ? 1 : -1) + this.items.length) % this.items.length : -1
    }
    if (event.key === 'Enter') { event.preventDefault(); if (this.expanded && this.active >= 0) this.choose(this.items[this.active]); else this.submit() }
  }

  beforeDestroy () { if (this.timer) clearTimeout(this.timer); this.controller?.abort() }
}
</script>

<style lang="scss">
.mc-search {
  position: relative;
  min-width: 0;
  .mlib-search { width: 100%; }
  &__menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    z-index: 8;
    padding: 12px;
    border-radius: var(--m3d-radius-float);
    background: var(--m3d-glass-thick);
    backdrop-filter: var(--m3d-glass-filter);
    box-shadow: var(--m3d-glass-rim), var(--m3d-glass-edge), var(--m3d-shadow-float);
    ul { list-style: none; padding: 0; margin: 0 0 8px; }
    li { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: var(--m3d-radius-sm); cursor: pointer; }
    li[aria-selected='true'] { background: var(--m3d-fill); }
    img { object-fit: contain; background: var(--m3d-surface-2); border-radius: var(--m3d-radius-xs); flex: none; }
    strong, small { display: block; }
    strong { font-size: var(--m3d-text-sm); }
    small, p { font-size: var(--m3d-text-xs); color: var(--m3d-text-muted); }
    button { padding: 10px; text-align: left; }
  }
}
</style>
