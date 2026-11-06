<template>
  <div
    v-if="tile"
    class="fs-bulk"
    data-tid="files-bulk"
  >
    <b data-tid="files-selected">{{ count }} selected</b>
    <button
      type="button"
      class="fs-bulk__btn"
      data-tid="files-clear-selection"
      @click="$emit('clear')"
    >
      Clear
    </button>
    <button
      v-if="root === 'gcodes'"
      type="button"
      class="fs-bulk__btn"
      @click="$emit('enqueue')"
    >
      Add to queue
    </button>
    <button
      type="button"
      class="fs-bulk__btn"
      data-tid="files-bulk-download"
      @click="$emit('create-zip')"
    >
      Download
    </button>
    <button
      v-if="!readonly"
      type="button"
      class="fs-bulk__btn fs-bulk__btn--danger"
      data-tid="files-bulk-delete"
      @click="$emit('remove')"
    >
      Delete
    </button>
  </div>
  <v-toolbar
    v-else
    dense
  >
    <v-toolbar-title class="d-none d-sm-block">
      <div
        class="file-path"
        data-tid="files-selected"
      >
        {{ count }} selected
      </div>
    </v-toolbar-title>

    <v-spacer />

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          small
          text
          data-tid="files-clear-selection"
          v-on="on"
          @click="$emit('clear')"
        >
          <v-icon>
            $close
          </v-icon>
        </v-btn>
      </template>
      <span>Clear the selection</span>
    </v-tooltip>

    <v-tooltip
      v-if="root === 'gcodes'"
      bottom
    >
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          small
          text
          v-on="on"
          @click="$emit('enqueue')"
        >
          <v-icon>
            $enqueueJob
          </v-icon>
        </v-btn>
      </template>
      <span>{{ $t('app.general.btn.add_to_queue') }}</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          small
          text
          v-on="on"
          @click="$emit('create-zip')"
        >
          <v-icon>
            $fileZipAdd
          </v-icon>
        </v-btn>
      </template>
      <span>{{ $t('app.general.btn.create_zip_archive') }}</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          small
          text
          v-on="on"
          @click="$emit('remove')"
        >
          <v-icon>
            $delete
          </v-icon>
        </v-btn>
      </template>
      <span>{{ $t('app.general.btn.delete') }}</span>
    </v-tooltip>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StatesMixin from '@/mixins/state'

@Component({})
export default class FileSystemBulkActions extends Mixins(StatesMixin) {
  @Prop({ type: String, required: true })
  readonly root!: string

  // The current path
  @Prop({ type: String })
  readonly path!: string

  // How many rows are selected.
  @Prop({ type: Number, default: 0 })
  readonly count!: number

  // The v3 tile's bar: pills in an accent strip, under the tools.
  @Prop({ type: Boolean })
  readonly tile?: boolean

  get readonly (): boolean {
    return !!(this.$store.getters['files/getRootProperties'](this.root) as { readonly?: boolean } | undefined)?.readonly
  }
}
</script>

<style lang="scss" scoped>
  .fs-bulk {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 18px 12px;
    padding: 8px 12px;
    border-radius: 12px;
    background: var(--m3d-accent-soft);
    font-size: 13px;

    b {
      margin-right: auto;
      color: var(--m3d-accent);
    }
  }

  .fs-bulk__btn {
    padding: 6px 14px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;

    &:hover {
      background: var(--m3d-border);
    }
  }

  .fs-bulk__btn--danger {
    background: rgb(255 69 58 / 16%);
    color: var(--m3d-danger);
  }
</style>
