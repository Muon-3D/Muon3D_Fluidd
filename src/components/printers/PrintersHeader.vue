<template>
  <header class="phead">
    <div class="phead__titles">
      <h1
        class="phead__title"
        data-tid="page-title"
      >
        All printers
      </h1>
      <p
        class="phead__summary"
        data-tid="printers-summary"
      >
        {{ summary }}
      </p>
    </div>
    <div class="phead__tools">
      <label
        v-if="showSearch"
        class="phead__search"
      >
        <frame-icon
          name="search"
          small
        />
        <input
          type="search"
          :value="search"
          placeholder="Search printers"
          aria-label="Search printers"
          data-tid="printers-search"
          @input="onInput"
        >
      </label>
      <div
        v-if="showView"
        class="seg"
        role="group"
        aria-label="View"
      >
        <button
          type="button"
          :class="{ on: view === 'bench' }"
          :aria-pressed="view === 'bench' ? 'true' : 'false'"
          data-tid="view-bench"
          @click="$emit('update:view', 'bench')"
        >
          Bench
        </button>
        <button
          type="button"
          :class="{ on: view === 'cards' }"
          :aria-pressed="view === 'cards' ? 'true' : 'false'"
          data-tid="view-grid"
          @click="$emit('update:view', 'cards')"
        >
          Grid
        </button>
        <button
          type="button"
          :class="{ on: view === 'list' }"
          :aria-pressed="view === 'list' ? 'true' : 'false'"
          data-tid="view-list"
          @click="$emit('update:view', 'list')"
        >
          List
        </button>
      </div>
      <button
        type="button"
        class="btn btn--primary"
        data-tid="add-printer"
        @click="$emit('add')"
      >
        <frame-icon
          name="plus"
          small
        />
        Add printer
      </button>
    </div>
  </header>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

/**
 * The page header (v3 section 2): the title, one muted line saying what is
 * here, then the page's actions: search, Grid / List, and the one primary,
 * Add printer.
 */
@Component({})
export default class PrintersHeader extends Vue {
  @Prop({ type: String, default: '' })
  readonly summary!: string

  @Prop({ type: String, default: '' })
  readonly search!: string

  @Prop({ type: String, default: 'cards' })
  readonly view!: 'cards' | 'list' | 'bench'

  @Prop({ type: Boolean })
  readonly showSearch?: boolean

  @Prop({ type: Boolean })
  readonly showView?: boolean

  onInput (event: Event) {
    this.$emit('update:search', (event.target as HTMLInputElement).value)
  }
}
</script>

<style lang="scss" scoped>
  .phead {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .phead__titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .phead__title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.015em;
  }

  .phead__summary {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .phead__tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .phead__search {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 240px;
    height: 40px;
    padding: 0 14px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 auto;
      min-width: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font-size: 14px;
    }
  }

  // Phone: search goes (the mockup), and Grid / List and Add share the row.
  @media (max-width: 699px) {
    .phead__search { display: none; }
    .phead__tools { width: 100%; }
    .phead__tools .btn { flex: 1 1 auto; }
  }
</style>
