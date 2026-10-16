<template>
  <div
    class="ftree"
    data-tid="files-tree"
  >
    <div
      v-for="section in sections"
      :key="section.id"
      class="ftree__section"
      :data-section="section.id"
    >
      <h2 class="ftree__section-title">
        {{ section.title }}
      </h2>
      <section
        v-for="group in section.groups"
        :key="group.root"
        class="ftree__group"
        :data-root="group.root"
      >
        <div class="ftree__head">
          <h3>
            {{ group.title }}
            <span v-if="group.note">· {{ group.note }}</span>
          </h3>
          <span class="ftree__tools">
            <button
              v-if="group.root === resettableRoot && canResetAll"
              type="button"
              class="ftree__reset"
              data-tid="files-reset-all"
              @click="$emit('reset-all')"
            >
              Reset all
            </button>
            <template v-if="group.editable">
              <button
                type="button"
                :aria-label="`New file in ${group.title}`"
                title="New file"
                :data-tid="`files-new-${group.root}`"
                @click="newIn = group.root"
              >
                <frame-icon
                  name="plus"
                  small
                />
              </button>
              <button
                type="button"
                :aria-label="`Upload to ${group.title}`"
                title="Upload"
                @click="pickUpload(group.root)"
              >
                <frame-icon
                  name="upload"
                  small
                />
              </button>
            </template>
          </span>
        </div>

        <p
          v-if="!group.loaded"
          class="ftree__note"
        >
          Reading…
        </p>
        <p
          v-else-if="!group.rows.length"
          class="ftree__note"
        >
          Nothing here.
        </p>
        <button
          v-for="row in group.rows"
          :key="row.key"
          type="button"
          class="ftree__row"
          :class="{
            'ftree__row--folder': row.folder,
            'ftree__row--on': row.key === selected
          }"
          :style="{ paddingLeft: `${12 + row.depth * 16}px` }"
          :data-key="row.key"
          @click="row.folder ? toggle(row) : $emit('open', row)"
        >
          <frame-icon
            v-if="row.folder"
            :name="expanded[row.key] ? 'chevronDown' : 'chevronRight'"
            small
          />
          <span class="ftree__name">{{ row.folder ? `${row.name}/` : row.name }}</span>
          <span
            v-if="dirty.includes(row.key)"
            class="ftree__dirty"
          >unsaved</span>
          <span
            v-else-if="tags[row.key]"
            class="ftree__tag"
            :class="`ftree__tag--${tags[row.key]}`"
            :title="tags[row.key] === 'changed' ? 'Different from its Muon3D default' : 'Yours: there\'s no default for it'"
          >{{ tags[row.key] === 'changed' ? 'changed' : 'yours' }}</span>
          <span
            v-else-if="group.download && !row.folder"
            class="ftree__size"
          >{{ size(row.size) }}</span>
        </button>
      </section>
    </div>

    <input
      ref="upload"
      type="file"
      multiple
      class="ftree__upload"
      @change="onPicked"
    >
    <file-name-dialog
      v-if="newIn"
      :value="!!newIn"
      title="New file"
      :label="`In ${groupTitle(newIn)}`"
      name=""
      @input="!$event && (newIn = null)"
      @save="makeFile"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import type { AppDirectory, AppFile, FileBrowserEntry } from '@/store/files/types'
import { RESETTABLE_ROOT, SECTIONS, rootGroup, rootSection, validName } from '@/services/files/model'
import { fileSize } from '@/services/jobs/model'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'

/** A file or folder in Files' list. `key` is root/path/name. */
export interface FileRow {
  key: string;
  root: string;
  /** The folder it's in, inside its root: '' at the top. */
  dir: string;
  name: string;
  folder: boolean;
  depth: number;
  size: number;
  readonly: boolean;
}

/**
 * Files' list: the printer's folders under three headings, Your
 * configuration, Defaults and Other files, folders opening in place. New
 * file and Upload go to the top of a folder that can be written to. A file
 * in your copy that differs from its default says "changed", and one with
 * no default says "yours"; Reset all sits on your copy's heading.
 */
@Component({ components: { FileNameDialog } })
export default class FilesTree extends Mixins(StateMixin, FilesMixin) {
  @Prop({ type: Array, required: true })
  readonly roots!: string[]

  /** By row key: 'changed' or 'yours', for files in your copy. */
  @Prop({ type: Object, default: () => ({}) })
  readonly tags!: Record<string, 'changed' | 'yours'>

  @Prop({ type: Boolean, default: false })
  readonly canResetAll!: boolean

  readonly resettableRoot = RESETTABLE_ROOT

  @Prop({ type: String, default: null })
  readonly selected!: string | null

  /** Files with unsaved changes. */
  @Prop({ type: Array, default: () => [] })
  readonly dirty!: string[]

  expanded: Record<string, boolean> = {}
  newIn: string | null = null
  uploadTo: string | null = null

  mounted () {
    this.refresh()
  }

  /** Lists every folder shown again. */
  refresh () {
    for (const root of this.roots) this.load(root, '')
    for (const key of Object.keys(this.expanded)) {
      if (!this.expanded[key]) continue
      const [root, ...rest] = key.split('/')
      this.load(root, rest.join('/'))
    }
  }

  load (root: string, dir: string) {
    SocketActions.serverFilesGetDirectory(root, dir ? `${root}/${dir}` : root)
  }

  listing (root: string, dir: string): FileBrowserEntry[] | undefined {
    return this.$store.getters['files/getDirectory'](dir ? `${root}/${dir}` : root) as FileBrowserEntry[] | undefined
  }

  readonlyRoot (root: string): boolean {
    return !!(this.$store.getters['files/getRootProperties'](root) as { readonly?: boolean } | undefined)?.readonly
  }

  rowsOf (root: string, dir: string, depth: number): FileRow[] {
    const entries = this.listing(root, dir) ?? []
    const readonly = this.readonlyRoot(root)
    const rows: FileRow[] = []
    const folders = entries.filter((e): e is AppDirectory => e.type === 'directory' && e.name !== '..' && !e.name.startsWith('.'))
      .sort((a, b) => a.name.localeCompare(b.name))
    const files = entries.filter((e): e is AppFile => e.type === 'file' && !e.filename.startsWith('.'))
      .sort((a, b) => a.filename.localeCompare(b.filename))
    for (const f of folders) {
      const path = dir ? `${dir}/${f.name}` : f.name
      const key = `${root}/${path}`
      rows.push({ key, root, dir, name: f.name, folder: true, depth, size: 0, readonly })
      if (this.expanded[key]) rows.push(...this.rowsOf(root, path, depth + 1))
    }
    for (const f of files) {
      const readonlyFile = readonly || f.permissions === 'r'
      rows.push({ key: `${root}/${dir ? `${dir}/` : ''}${f.filename}`, root, dir, name: f.filename, folder: false, depth, size: f.size, readonly: readonlyFile })
    }
    return rows
  }

  get groups () {
    return this.roots.map(root => {
      const info = rootGroup(root)
      return {
        root,
        ...info,
        editable: !this.readonlyRoot(root),
        loaded: !!this.listing(root, ''),
        rows: this.rowsOf(root, '', 0)
      }
    })
  }

  get sections () {
    const groups = this.groups
    return SECTIONS
      .map(section => ({ ...section, groups: groups.filter(g => rootSection(g.root) === section.id) }))
      .filter(section => section.groups.length)
  }

  groupTitle (root: string): string {
    return rootGroup(root).title
  }

  toggle (row: FileRow) {
    const open = !this.expanded[row.key]
    this.$set(this.expanded, row.key, open)
    if (open) this.load(row.root, row.dir ? `${row.dir}/${row.name}` : row.name)
  }

  size (bytes: number): string {
    return fileSize(bytes)
  }

  pickUpload (root: string) {
    this.uploadTo = root;
    (this.$refs.upload as HTMLInputElement).click()
  }

  async onPicked (event: Event) {
    const input = event.target as HTMLInputElement
    const files = [...(input.files ?? [])]
    input.value = ''
    if (!files.length || !this.uploadTo) return
    await this.uploadFiles(files, '', this.uploadTo, false)
    this.load(this.uploadTo, '')
  }

  async makeFile (name: string) {
    const root = this.newIn
    this.newIn = null
    if (!root || !validName(name)) return
    await this.uploadFile(new File([], name.trim()), '', root, false)
    this.load(root, '')
    this.$emit('created', { root, dir: '', name: name.trim() })
  }
}
</script>

<style lang="scss" scoped>
  .ftree {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .ftree__section {
    display: flex;
    flex-direction: column;
    gap: 14px;

    & + & {
      padding-top: 16px;
      border-top: 1px solid var(--m3d-border);
    }
  }

  .ftree__section-title {
    margin: 0;
    padding: 0 12px;
    color: var(--m3d-text-subtle);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .ftree__group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ftree__reset {
    padding: 3px 8px !important;
    color: var(--m3d-accent) !important;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  .ftree__tag {
    padding: 1px 6px;
    border-radius: 999px;
    font-family: var(--m3d-font-sans, inherit);
    font-size: 11px;
    font-weight: 600;
  }

  .ftree__tag--changed {
    background: rgb(232 150 60 / 16%);
    color: var(--m3d-warning, #e8963c);
  }

  .ftree__tag--yours {
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .ftree__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 4px 6px 12px;

    h3 {
      margin: 0;
      color: var(--m3d-text);
      font-size: 13px;
      font-weight: 600;

      span {
        color: var(--m3d-text-subtle);
        font-weight: 400;
      }
    }
  }

  .ftree__tools {
    display: inline-flex;
    gap: 2px;

    button {
      display: inline-flex;
      padding: 5px;
      border-radius: 8px;
      color: var(--m3d-text-muted);

      &:hover {
        background: var(--m3d-surface-2);
        color: var(--m3d-text);
      }
    }
  }

  .ftree__row {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    padding-right: 10px;
    border-radius: 10px;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 13px;
    text-align: left;

    &:hover {
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
    }
  }

  .ftree__row--folder {
    color: var(--m3d-text);
  }

  .ftree__row--on {
    background: rgba(128, 214, 209, 0.12);
    color: var(--m3d-accent);
  }

  .ftree__name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ftree__dirty {
    color: var(--m3d-warning, #ff9f0a);
    font-family: var(--m3d-font-sans, inherit);
    font-size: 11px;
    font-weight: 600;
  }

  .ftree__size {
    color: var(--m3d-text-subtle);
    font-size: 11px;
  }

  .ftree__note {
    margin: 0;
    padding: 4px 12px;
    color: var(--m3d-text-subtle);
    font-size: 13px;
  }

  .ftree__upload {
    display: none;
  }
</style>
