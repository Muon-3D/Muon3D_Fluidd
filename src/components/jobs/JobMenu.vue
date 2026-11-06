<template>
  <v-menu
    offset-y
    left
  >
    <template #activator="{ on, attrs }">
      <button
        type="button"
        class="job-menu"
        :class="{ 'job-menu--button': button }"
        :aria-label="`Options for ${label}`"
        data-tid="job-menu"
        v-bind="attrs"
        @click.stop
        v-on="on"
      >
        <frame-icon name="more" />
      </button>
    </template>
    <v-list dense>
      <v-list-item
        v-for="item in items"
        :key="item.id"
        :disabled="item.disabled"
        :data-action="item.id"
        @click="$emit('action', item.id)"
      >
        <v-list-item-title :class="{ 'error--text': item.danger }">
          {{ item.label }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

export type JobMenuAction = 'print' | 'queue' | 'preview' | 'download' | 'rename' | 'move' | 'delete'

interface MenuItem {
  id: JobMenuAction;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}

/**
 * The ··· on a file or folder: everything that can be done to the item,
 * so nothing waits on a hover. The file that is printing stays where it
 * is, so it can't be renamed, moved or deleted.
 */
@Component({})
export default class JobMenu extends Vue {
  @Prop({ type: String, default: 'file' })
  readonly kind!: 'file' | 'folder'

  @Prop({ type: String, default: '' })
  readonly label!: string

  @Prop({ type: Boolean })
  readonly printing?: boolean

  /** The printer is busy and has a queue: Print becomes Add to queue. */
  @Prop({ type: Boolean })
  readonly queueing?: boolean

  /** The printer can't be told anything now. */
  @Prop({ type: Boolean })
  readonly locked?: boolean

  /** A round button of its own (the detail tile's), not a table cell's. */
  @Prop({ type: Boolean })
  readonly button?: boolean

  /** Leave out Print: the detail tile and the sticky bar have it beside the menu. */
  @Prop({ type: Boolean })
  readonly noPrint?: boolean

  /** Leave out Preview: the detail tile has it beside the menu. */
  @Prop({ type: Boolean })
  readonly noPreview?: boolean

  get items (): MenuItem[] {
    const held = !!this.printing
    const items: MenuItem[] = []
    if (this.kind === 'file') {
      if (!this.noPrint) {
        items.push({ id: this.queueing ? 'queue' : 'print', label: this.queueing ? 'Add to queue' : 'Print', disabled: this.locked || (held && !this.queueing) })
      }
      if (!this.noPreview) items.push({ id: 'preview', label: 'Preview' })
      items.push({ id: 'download', label: 'Download' })
    }
    items.push({ id: 'rename', label: 'Rename', disabled: this.locked || held })
    items.push({ id: 'move', label: 'Move to…', disabled: this.locked || held })
    items.push({ id: 'delete', label: 'Delete', disabled: this.locked || held, danger: true })
    return items
  }
}
</script>

<style lang="scss" scoped>
  .job-menu {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
    }
  }

  .job-menu--button {
    width: 40px;
    height: 40px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
  }
</style>
