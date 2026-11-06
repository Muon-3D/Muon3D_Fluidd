<template>
  <m3-dialog
    :value="value"
    eyebrow="Quick command"
    :title="editing ? 'Edit the quick command' : 'Add a quick command'"
    max-width="460"
    data-tid="quick-command-dialog"
    @input="$emit('input', $event)"
    @close="$emit('input', false)"
  >
    <form
      class="qcd"
      @submit.prevent="save"
    >
      <label class="qcd__lbl">
        Command
        <input
          v-model="command"
          class="qcd__field qcd__field--mono"
          spellcheck="false"
          autocomplete="off"
          placeholder="BED_MESH_CALIBRATE PROFILE=pla"
          data-tid="quick-command-command"
        >
      </label>
      <label class="qcd__lbl">
        Label on the chip
        <input
          v-model="label"
          class="qcd__field"
          :placeholder="command.trim() || 'Mesh (PLA)'"
          data-tid="quick-command-label"
        >
      </label>
      <div
        class="qcd__lbl"
        role="radiogroup"
        aria-label="When tapped"
      >
        When tapped
        <div class="qcd__opts">
          <button
            v-for="o in options"
            :key="String(o.send)"
            type="button"
            role="radio"
            class="qcd__opt"
            :class="{ 'qcd__opt--on': send === o.send }"
            :aria-checked="send === o.send ? 'true' : 'false'"
            @click="send = o.send"
          >
            <b>{{ o.title }}</b>
            <span>{{ o.sub }}</span>
          </button>
        </div>
      </div>
      <button
        v-if="editing"
        type="button"
        class="qcd__remove"
        data-tid="quick-command-remove"
        @click="$emit('remove', quick); $emit('input', false)"
      >
        Remove this quick command
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
        :disabled="!command.trim()"
        data-tid="quick-command-save"
        @click="save"
      >
        {{ editing ? 'Save' : 'Add' }}
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import type { QuickCommand } from '@/services/console/settings'

/** Adds or edits one chip above the Console's input. */
@Component({ components: { M3Dialog } })
export default class QuickCommandDialog extends Vue {
  @Prop({ type: Boolean })
  readonly value!: boolean

  /** The chip being edited; null adds one. */
  @Prop({ type: Object, default: null })
  readonly quick!: QuickCommand | null

  command = ''
  label = ''
  send = true

  readonly options = [
    { send: true, title: 'Send it', sub: 'One tap runs it' },
    { send: false, title: 'Put it in the input', sub: 'To edit before sending' }
  ]

  get editing (): boolean {
    return !!this.quick?.id
  }

  @Watch('value', { immediate: true })
  onOpen (open: boolean) {
    if (!open) return
    this.command = this.quick?.command ?? ''
    this.label = this.quick?.label ?? ''
    this.send = this.quick?.send ?? true
  }

  save () {
    if (!this.command.trim()) return
    this.$emit('save', { id: this.quick?.id ?? '', command: this.command, label: this.label, send: this.send })
    this.$emit('input', false)
  }
}
</script>

<style lang="scss" scoped>
  // The storyboard's sheet: Cancel, then the action across the rest of the row.
  .dlg-pri {
    flex: 1 1 auto;
  }

  .qcd {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .qcd__lbl {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .qcd__field {
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

  .qcd__field--mono {
    font-family: var(--m3d-font-mono, monospace);
  }

  .qcd__opts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .qcd__opt {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    text-align: left;

    b { font-size: 14px; }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
      font-weight: 400;
    }
  }

  .qcd__opt--on {
    background: rgba(128, 214, 209, 0.14);
    box-shadow: inset 0 0 0 1px rgba(128, 214, 209, 0.5);
  }

  .qcd__remove {
    align-self: flex-start;
    color: var(--m3d-danger);
    font-size: 13px;
    font-weight: 600;
  }
</style>
