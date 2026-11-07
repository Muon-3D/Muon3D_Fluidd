<template>
  <m3-dialog
    :value="value"
    eyebrow="Hide lines"
    title="Hide lines that…"
    max-width="480"
    data-tid="console-filter-dialog"
    @input="$emit('input', $event)"
    @close="$emit('input', false)"
  >
    <form
      class="cfd"
      @submit.prevent="save"
    >
      <label class="cfd__lbl">
        Name
        <input
          v-model="name"
          class="cfd__field"
          placeholder="Probe chatter"
          data-tid="console-filter-name"
        >
      </label>
      <div class="cfd__lbl">
        Match
        <seg-picker
          v-model="type"
          :options="types"
          label="Match"
        />
      </div>
      <input
        v-model="text"
        class="cfd__field cfd__field--mono"
        spellcheck="false"
        autocomplete="off"
        :aria-label="type === 'expression' ? 'Pattern' : 'Text'"
        :placeholder="type === 'expression' ? '^probe at .* is z=' : '// timelapse'"
        data-tid="console-filter-value"
      >
      <p
        v-if="problem && text"
        role="alert"
        class="cfd__error"
        data-tid="console-filter-problem"
      >
        {{ problem }}
      </p>
      <p
        v-else-if="nameProblem"
        role="alert"
        class="cfd__error"
      >
        {{ nameProblem }}
      </p>
      <div
        v-if="!problem"
        class="cfd__lbl"
      >
        <span data-tid="console-filter-count">Would hide {{ preview.hidden.length }} of the last {{ preview.of }} lines</span>
        <div
          v-if="preview.hidden.length"
          class="cfd__term"
          data-tid="console-filter-preview"
        >
          <div
            v-for="(e, i) in preview.hidden.slice(-8)"
            :key="`${e.id}-${i}`"
          >
            <span
              v-if="e.time"
              class="cfd__time"
            >{{ time(e) }}</span> {{ lineText(e) }}
          </div>
        </div>
      </div>
      <p class="cfd__note">
        Hidden lines are hidden only in Control; the printer's log keeps them.
      </p>
      <button
        v-if="filter && filter.id"
        type="button"
        class="cfd__remove"
        data-tid="console-filter-remove"
        @click="$emit('remove', filter); $emit('input', false)"
      >
        Remove this filter
      </button>
    </form>
    <template #actions>
      <button
        type="button"
        class="cbtn cbtn--ghost"
        @click="$emit('input', false)"
      >
        Cancel
      </button>
      <button
        type="button"
        class="cbtn cbtn--primary dlg-pri"
        :disabled="!!problem || !!nameProblem"
        data-tid="console-filter-save"
        @click="save"
      >
        Save
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import SegPicker from '@/components/control/SegPicker.vue'
import type { ConsoleEntry, ConsoleFilter, ConsoleFilterType } from '@/store/console/types'
import { FILTER_TYPES, filterProblem, previewFilter, type FilterPreview } from '@/services/console/settings'
import { entryText } from '@/services/console/model'

/** One "hide lines" filter, with a live preview on the last 200 console lines. */
@Component({ components: { M3Dialog, SegPicker } })
export default class ConsoleFilterDialog extends Vue {
  @Prop({ type: Boolean })
  readonly value!: boolean

  /** The filter being edited; null adds one. */
  @Prop({ type: Object, default: null })
  readonly filter!: ConsoleFilter | null

  name = ''
  type: ConsoleFilterType = 'contains'
  text = ''

  readonly types = FILTER_TYPES

  @Watch('value', { immediate: true })
  onOpen (open: boolean) {
    if (!open) return
    this.name = this.filter?.name ?? ''
    this.type = this.filter?.type ?? 'contains'
    this.text = this.filter?.value ?? ''
  }

  get filters (): ConsoleFilter[] {
    return this.$store.getters['console/getFilters'] ?? []
  }

  get entries (): ConsoleEntry[] {
    return this.$store.state.console.console ?? []
  }

  get problem (): string | null {
    return filterProblem({ type: this.type, value: this.text })
  }

  get nameProblem (): string | null {
    const name = this.name.trim()
    if (!name) return this.text ? 'Give it a name.' : null
    return this.filters.some(f => f.id !== this.filter?.id && f.name.toLowerCase() === name.toLowerCase()) ? 'A filter has that name already.' : null
  }

  get preview (): FilterPreview {
    return previewFilter({ type: this.type, value: this.text }, this.entries)
  }

  time (e: ConsoleEntry): string {
    return e.time ? this.$filters.formatTimeWithSeconds(e.time * 1000) : ''
  }

  lineText (e: ConsoleEntry): string {
    return entryText(e.message)
  }

  save () {
    if (this.problem || this.nameProblem || !this.name.trim()) return
    this.$emit('save', {
      id: this.filter?.id ?? '',
      enabled: this.filter?.enabled ?? true,
      name: this.name.trim(),
      type: this.type,
      value: this.text
    })
    this.$emit('input', false)
  }
}
</script>

<style lang="scss" scoped>
  // The storyboard's sheet: Cancel, then the action across the rest of the row.
  .dlg-pri {
    flex: 1 1 auto;
  }

  .cfd {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .cfd__lbl {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .cfd__field {
    height: 42px;
    padding: 0 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font: inherit;
    font-size: 14px;
    font-weight: 400;
    outline: none;

    &:focus-visible { box-shadow: 0 0 0 2px var(--m3d-accent); }
  }

  .cfd__field--mono {
    font-family: var(--m3d-font-mono, monospace);
  }

  .cfd__term {
    max-height: 180px;
    overflow: auto;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--m3d-bg, #000);
    color: var(--m3d-text);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 12px;
    font-weight: 400;
    line-height: 1.6;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .cfd__time {
    color: var(--m3d-text-subtle);
  }

  .cfd__error {
    margin: 0;
    color: var(--m3d-danger);
    font-size: 13px;
  }

  .cfd__note {
    margin: 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .cfd__remove {
    align-self: flex-start;
    color: var(--m3d-danger);
    font-size: 13px;
    font-weight: 600;
  }
</style>
