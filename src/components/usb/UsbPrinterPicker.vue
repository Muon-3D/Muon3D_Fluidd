<template>
  <v-dialog
    :value="value"
    max-width="560"
    scrollable
    :fullscreen="isMobileViewport"
    @input="$emit('input', $event)"
  >
    <div
      class="upick"
      data-tid="usb-picker"
    >
      <header class="upick__head">
        <b>Copy from the printer to {{ stickName }}</b>
        <button
          type="button"
          class="upick__x"
          aria-label="Close"
          @click="$emit('input', false)"
        >
          <frame-icon name="x" />
        </button>
      </header>

      <nav class="upick__crumbs">
        <button
          type="button"
          data-tid="usb-picker-crumb"
          @click="open('')"
        >
          gcodes
        </button>
        <template v-for="crumb in crumbs">
          <span
            :key="`s-${crumb.path}`"
            aria-hidden="true"
          >/</span>
          <button
            :key="crumb.path"
            type="button"
            data-tid="usb-picker-crumb"
            :disabled="crumb.path === path"
            @click="open(crumb.path)"
          >
            {{ crumb.name }}
          </button>
        </template>
      </nav>

      <label class="upick__all">
        <input
          v-model="everything"
          type="checkbox"
          data-tid="usb-picker-all"
        >
        <span>Everything on the printer</span>
      </label>

      <ul
        class="upick__list"
        :class="{ 'upick__list--off': everything }"
      >
        <li
          v-if="!loaded"
          class="upick__note"
        >
          Loading…
        </li>
        <li
          v-else-if="!rows.length"
          class="upick__note"
          data-tid="usb-picker-empty"
        >
          {{ path ? 'This folder is empty.' : 'There is no G-code on the printer yet.' }}
        </li>
        <li
          v-for="row in rows"
          :key="row.rel"
          class="upick__row"
        >
          <label>
            <input
              type="checkbox"
              :checked="everything || picked.includes(row.rel)"
              :disabled="everything"
              data-tid="usb-picker-row"
              :data-name="row.name"
              @change="toggle(row.rel)"
            >
            <frame-icon
              :name="row.dir ? 'files' : 'jobs'"
              small
            />
            <span class="upick__name">{{ row.name }}</span>
          </label>
          <button
            v-if="row.dir"
            type="button"
            class="upick__open"
            :disabled="everything"
            :aria-label="`Open ${row.name}`"
            @click="open(row.rel)"
          >
            ›
          </button>
          <span
            v-else
            class="upick__size"
          >{{ bytes(row.size) }}</span>
        </li>
      </ul>

      <footer class="upick__foot">
        <button
          type="button"
          class="cbtn"
          @click="$emit('input', false)"
        >
          Cancel
        </button>
        <button
          type="button"
          class="cbtn cbtn--primary"
          :disabled="!everything && !picked.length"
          data-tid="usb-picker-next"
          @click="choose"
        >
          {{ everything ? 'Copy everything' : `Copy ${picked.length} selected` }}
        </button>
      </footer>
    </div>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import type { AppDirectory, AppFile, FileBrowserEntry } from '@/store/files/types'
import { isGcodeFile } from '@/services/jobs/model'
import { bytesWords } from '@/services/usb/words'

interface Row { rel: string, name: string, dir: boolean, size: number }

/** Which of the printer's files and folders go to the stick: one, several, or everything. */
@Component
export default class UsbPrinterPicker extends Mixins(BrowserMixin) {
  @Prop({ type: Boolean, default: false }) readonly value!: boolean
  @Prop({ type: String, default: 'the USB stick' }) readonly stickName!: string

  path = ''
  picked: string[] = []
  everything = false

  readonly bytes = bytesWords

  get dir (): string { return this.path ? `gcodes/${this.path}` : 'gcodes' }

  get crumbs (): Array<{ name: string, path: string }> {
    const parts = this.path ? this.path.split('/') : []
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }))
  }

  get loaded (): boolean { return !!this.$store.getters['files/getDirectory'](this.dir) }

  get rows (): Row[] {
    const entries = (this.$store.getters['files/getDirectory'](this.dir) as FileBrowserEntry[] | undefined) ?? []
    const at = (name: string) => this.path ? `${this.path}/${name}` : name
    const dirs = entries
      .filter((e): e is AppDirectory => e.type === 'directory' && e.name !== '..')
      .map(d => ({ rel: at(d.dirname), name: d.dirname, dir: true, size: 0 }))
    const files = entries
      .filter((e): e is AppFile => e.type === 'file' && isGcodeFile(e.filename))
      .map(f => ({ rel: at(f.filename), name: f.filename, dir: false, size: f.size }))
    return [...dirs, ...files]
  }

  @Watch('value', { immediate: true })
  onOpen (open: boolean) {
    if (!open) return
    this.picked = []
    this.everything = false
    this.open('')
  }

  open (path: string) {
    this.path = path
    SocketActions.serverFilesGetDirectory('gcodes', this.dir)
  }

  toggle (rel: string) {
    this.picked = this.picked.includes(rel) ? this.picked.filter(p => p !== rel) : [...this.picked, rel]
  }

  choose () {
    this.$emit('choose', this.everything ? ['/'] : this.picked.slice())
    this.$emit('input', false)
  }
}
</script>

<style lang="scss" scoped>
  .upick {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 100%;
    padding: 18px;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .upick__head {
    display: flex;
    align-items: center;
    gap: 8px;

    b {
      flex: 1;
      font-size: 17px;
    }
  }

  .upick__x {
    display: inline-flex;
    padding: 6px;
    border-radius: 8px;
    color: var(--m3d-text-muted);
  }

  .upick__crumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    color: var(--m3d-text-muted);
    font-size: 13px;

    button:not(:disabled) {
      color: var(--m3d-accent);
    }
  }

  .upick__all {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .upick__list {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 120px;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;

    &--off {
      opacity: 0.5;
    }
  }

  .upick__row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 6px;
    border-radius: 10px;

    label {
      display: flex;
      flex: 1;
      align-items: center;
      gap: 8px;
      min-width: 0;
      min-height: 36px;
    }
  }

  .upick__name {
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .upick__size {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .upick__open {
    padding: 4px 10px;
    color: var(--m3d-text-muted);
    font-size: 18px;
  }

  .upick__note {
    padding: 16px 6px;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .upick__foot {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
