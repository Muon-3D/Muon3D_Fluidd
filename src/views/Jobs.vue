<template>
  <!-- The files on the printer as one list, and the one that's picked beside it. -->
  <div
    class="jobs"
    :class="{ 'jobs--phone': isMobileViewport }"
    data-tid="jobs-page"
  >
    <section
      v-if="queue.length"
      class="jobs__next"
      data-tid="jobs-up-next"
    >
      <div class="jobs__next-head">
        <h2>Up next</h2>
        <span class="jobs__count">{{ queue.length }}</span>
        <span class="jobs__hint">Starts when the plate is lifted off and put back</span>
        <button
          type="button"
          class="jobs__link"
          :disabled="!controlReady"
          data-tid="jobs-queue-start"
          @click="startQueue"
        >
          Start
        </button>
        <button
          v-if="queue.length > 1"
          type="button"
          class="jobs__link"
          data-tid="jobs-queue-clear"
          :disabled="!controlReady"
          @click="clearQueue"
        >
          Clear
        </button>
      </div>
      <div class="jobs__next-list">
        <div
          v-for="queued in queue"
          :key="queued.job_id"
          class="jobs__queued"
        >
          <span class="jobs__thumb jobs__thumb--small">
            <job-picture :src="thumbnailOf(queued.filename)" />
          </span>
          <span class="jobs__queued-text">
            <b>{{ titleOf(queued.filename) }}</b>
            <span>{{ factsOf(queued.filename) }}</span>
          </span>
          <button
            v-if="queue.length > 1"
            type="button"
            class="jobs__unqueue"
            :disabled="!controlReady || queued === queue[0]"
            :aria-label="`Move ${titleOf(queued.filename)} earlier`"
            @click="moveQueued(queued, -1)"
          >
            ↑
          </button>
          <button
            v-if="queue.length > 1"
            type="button"
            class="jobs__unqueue"
            :disabled="!controlReady || queued === queue[queue.length - 1]"
            :aria-label="`Move ${titleOf(queued.filename)} later`"
            @click="moveQueued(queued, 1)"
          >
            ↓
          </button>
          <button
            type="button"
            class="jobs__unqueue"
            :aria-label="`Take ${titleOf(queued.filename)} out of the queue`"
            :disabled="!controlReady"
            @click="unqueue(queued)"
          >
            <frame-icon
              name="x"
              small
            />
          </button>
        </div>
      </div>
    </section>

    <p
      v-if="!controlReady"
      class="jobs__readonly"
      data-tid="jobs-readonly"
    >
      {{ printerName }} isn't taking commands right now, so Print, Upload, Rename and Delete are off. You can still look through its files.
    </p>

    <div class="jobs__grid">
      <section
        class="jobs__list"
        data-tid="jobs-list"
      >
        <nav
          v-if="path"
          class="jobs__crumbs"
          aria-label="Folder"
        >
          <button
            type="button"
            data-tid="jobs-crumb"
            @click="openFolder('')"
          >
            gcodes
          </button>
          <template v-for="crumb in crumbs">
            <span
              :key="`slash-${crumb.path}`"
              aria-hidden="true"
            >/</span>
            <button
              :key="crumb.path"
              type="button"
              data-tid="jobs-crumb"
              :disabled="crumb.path === path"
              @click="openFolder(crumb.path)"
            >
              {{ crumb.name }}
            </button>
          </template>
        </nav>

        <div
          v-if="!dirLoaded"
          class="jobs__skeleton"
          data-tid="jobs-loading"
          aria-busy="true"
        >
          <div
            v-for="n in 5"
            :key="n"
            class="jobs__skeleton-row"
          />
        </div>

        <div
          v-else-if="!rows.length"
          class="jobs__empty"
          data-tid="jobs-empty"
        >
          <span class="jobs__empty-icon"><frame-icon name="jobs" /></span>
          <b>{{ query ? `Nothing matches “${query}”` : path ? 'This folder is empty' : 'No G-code on the printer yet' }}</b>
          <span>{{ query ? 'Try another name, or clear the search.' : 'Upload a file, or slice one in Slice.' }}</span>
          <button
            v-if="query"
            type="button"
            class="cbtn"
            @click="clearSearch"
          >
            Clear search
          </button>
          <button
            v-else
            type="button"
            class="cbtn cbtn--primary"
            :disabled="!controlReady"
            data-tid="jobs-empty-upload"
            @click="pickUpload"
          >
            <frame-icon
              name="upload"
              small
            />
            Upload a file
          </button>
        </div>

        <template v-else>
          <div
            v-if="selecting"
            class="jobs__selection"
            data-tid="jobs-selection"
          >
            <input
              type="checkbox"
              class="jobs__box"
              :checked="allSelected"
              aria-label="Select every row"
              data-tid="jobs-select-all"
              @change="toggleAll"
            >
            <b>{{ selection.length }} selected</b>
            <button
              v-if="canQueue && queueable.length"
              type="button"
              :disabled="!controlReady"
              data-tid="jobs-sel-queue"
              @click="queueSelected"
            >
              {{ queueLabel(queueable.length) }}
            </button>
            <button
              v-if="changeable.length"
              type="button"
              :disabled="!controlReady"
              data-tid="jobs-sel-move"
              @click="moveSelected"
            >
              Move to…
            </button>
            <button
              v-if="selectedFiles.length"
              type="button"
              data-tid="jobs-sel-download"
              @click="downloadSelected"
            >
              Download
            </button>
            <button
              v-if="changeable.length"
              type="button"
              class="jobs__danger"
              :disabled="!controlReady"
              data-tid="jobs-sel-delete"
              @click="deleteSelected"
            >
              Delete
            </button>
            <span
              v-if="heldCount"
              class="jobs__note"
            >{{ printingTitle }} is printing, so it stays where it is</span>
            <span class="jobs__grow" />
            <button
              type="button"
              data-tid="jobs-sel-done"
              @click="stopSelecting"
            >
              Done
            </button>
          </div>
          <div
            v-if="!isMobileViewport"
            class="jobs__row jobs__row--head"
            aria-hidden="true"
          >
            <span>Name</span>
            <span>Material</span>
            <span>Time</span>
            <span>Size</span>
            <span>Last printed</span>
            <span />
          </div>
          <div
            ref="rows"
            class="jobs__rows"
            role="listbox"
            tabindex="0"
            aria-label="Files on the printer"
            data-tid="jobs-rows"
            @keydown="onKey"
          >
            <div
              v-for="row in rows"
              :key="row.key"
              class="jobs__row"
              :class="{ 'jobs__row--sel': (selectedKey === row.key && !selecting) || selection.includes(row.key), 'jobs__row--now': row.printing }"
              role="option"
              :aria-selected="selectedKey === row.key ? 'true' : 'false'"
              :data-key="row.key"
              data-tid="jobs-row"
              @click="onRowClick(row, $event)"
              @dblclick="openRow(row)"
              @touchstart.passive="pressStart(row)"
              @touchend="pressEnd"
              @touchmove.passive="pressEnd"
              @touchcancel="pressEnd"
            >
              <span class="jobs__name">
                <input
                  v-if="selecting"
                  type="checkbox"
                  class="jobs__box"
                  :checked="selection.includes(row.key)"
                  :aria-label="`Select ${row.title}`"
                  data-tid="jobs-row-check"
                  @click.stop="onCheck(row, $event)"
                >
                <span
                  class="jobs__thumb"
                  :class="{ 'jobs__thumb--folder': row.kind === 'folder' }"
                >
                  <frame-icon
                    v-if="row.kind === 'folder'"
                    name="files"
                  />
                  <job-picture
                    v-else
                    :src="row.job ? row.job.thumbnail : ''"
                  />
                </span>
                <span class="jobs__name-text">
                  <b :title="row.name">{{ row.title }}</b>
                  <template v-if="isMobileViewport">
                    <span
                      v-if="row.kind === 'folder'"
                      class="jobs__sub"
                    >{{ folderCount(row.key) }}</span>
                    <span
                      v-else
                      class="jobs__sub"
                    >
                      <i
                        v-if="row.material"
                        class="jobs__dot"
                      />{{ [row.material, row.printing ? (leftText || 'Printing now') : listDuration(row.time), fileSize(row.size)].filter(Boolean).join(' · ') }}
                    </span>
                    <span
                      v-if="row.printing"
                      class="jobs__bar"
                    ><i :style="{ width: `${Math.min(100, progress)}%` }" /></span>
                  </template>
                  <span
                    v-else-if="row.printing"
                    class="jobs__sub"
                  >
                    <router-link
                      :to="pagePath('/')"
                      class="jobs__printing-link"
                      data-tid="jobs-printing-link"
                      @click.native.stop
                    >
                      <tone-pill tone="run">{{ printerPaused ? 'Paused' : 'Printing now' }} · {{ Math.floor(progress) }}%</tone-pill>
                    </router-link>
                  </span>
                  <span
                    v-else-if="row.sub"
                    class="jobs__sub"
                  >{{ row.sub }}</span>
                </span>
              </span>
              <template v-if="!isMobileViewport">
                <span class="jobs__cell">
                  <template v-if="row.kind === 'file' && row.material"><i class="jobs__dot" />{{ row.material }}</template>
                </span>
                <span class="jobs__cell">{{ row.kind === 'folder' ? '' : row.printing ? (leftText || 'Printing') : listDuration(row.time) }}</span>
                <span class="jobs__cell">{{ row.kind === 'folder' ? folderCount(row.key) : fileSize(row.size) }}</span>
                <span class="jobs__cell">{{ row.kind === 'folder' ? '' : row.printing ? (startedAt ? `Started ${startedAt}` : 'Now') : lastPrinted(row.lastPrinted, row.printed) }}</span>
              </template>
              <span class="jobs__end">
                <template v-if="!selecting">
                  <router-link
                    v-if="row.printing && isMobileViewport"
                    :to="pagePath('/')"
                    class="jobs__pct"
                    data-tid="jobs-printing-link"
                    @click.native.stop
                  >
                    {{ Math.floor(progress) }}%
                  </router-link>
                  <frame-icon
                    v-if="isMobileViewport && selectedKey === row.key && row.kind === 'file'"
                    name="check"
                    class="jobs__check"
                  />
                  <job-menu
                    v-else
                    :kind="row.kind"
                    :label="row.title"
                    :printing="row.held"
                    :queueing="busy && canQueue"
                    :locked="!controlReady"
                    @action="act($event, row)"
                  />
                </template>
              </span>
            </div>
          </div>
        </template>
      </section>

      <aside
        v-if="!isMobileViewport && selectedRow && selectedRow.job"
        class="jobs__detail"
        data-tid="jobs-detail"
      >
        <div class="jobs__detail-head">
          <frame-icon name="files" />
          <b :title="selectedRow.job.filename">{{ selectedRow.title }}</b>
          <job-menu
            kind="file"
            no-print
            no-preview
            :label="selectedRow.title"
            :printing="selectedRow.printing"
            :locked="!controlReady"
            @action="act($event, selectedRow)"
          />
        </div>
        <div class="jobs__picture">
          <job-picture
            :src="selectedRow.job.thumbnail"
            large
          />
        </div>
        <p class="jobs__filename">
          {{ selectedRow.job.filename }}
        </p>
        <dl class="jobs__stats">
          <div
            v-for="stat in stats"
            :key="stat.label"
          >
            <dt>{{ stat.label }}</dt>
            <dd>
              <i
                v-if="stat.dot"
                class="jobs__dot"
              />{{ stat.value }}
            </dd>
          </div>
        </dl>
        <ul
          v-if="warnings.length"
          class="jobs__warnings"
          data-tid="jobs-warnings"
        >
          <li
            v-for="warning in warnings"
            :key="warning"
          >
            <v-icon
              x-small
              class="jobs__warning-icon"
            >
              $warning
            </v-icon>
            {{ warning }}
          </li>
        </ul>
        <div class="jobs__actions">
          <button
            type="button"
            class="cbtn cbtn--primary jobs__print"
            :disabled="!canStart(selectedRow)"
            data-tid="jobs-print"
            @click="printRow(selectedRow)"
          >
            {{ printLabel(selectedRow) }}
          </button>
          <button
            type="button"
            class="cbtn"
            data-tid="jobs-preview"
            @click="preview(selectedRow)"
          >
            <frame-icon
              name="eye"
              small
            />
            Preview
          </button>
        </div>
      </aside>
    </div>

    <div
      v-if="isMobileViewport && selectedRow && selectedRow.job"
      class="jobs__sticky"
      data-tid="jobs-sticky"
    >
      <button
        type="button"
        class="cbtn cbtn--primary jobs__print"
        :disabled="!canStart(selectedRow)"
        data-tid="jobs-print"
        @click="printRow(selectedRow)"
      >
        {{ printLabel(selectedRow) }} {{ selectedRow.printing ? '' : selectedRow.title }}
      </button>
      <job-menu
        kind="file"
        button
        no-print
        :label="selectedRow.title"
        :printing="selectedRow.printing"
        :queueing="false"
        :locked="!controlReady"
        @action="act($event, selectedRow)"
      />
    </div>

    <input
      ref="upload"
      type="file"
      multiple
      :accept="gcodeAccept"
      class="jobs__upload"
      data-tid="jobs-upload-input"
      @change="onPicked"
    >

    <file-name-dialog
      v-if="folderDialog"
      v-model="folderDialog"
      title="New folder"
      :label="`In ${path ? `${path}/` : 'gcodes/'}`"
      name=""
      @save="makeFolder"
    />
    <file-name-dialog
      v-if="renameRow"
      :value="true"
      :title="renameRow.kind === 'folder' ? 'Rename the folder' : 'Rename the file'"
      label="Name"
      :name="renameRow.name"
      @input="renameRow = null"
      @save="rename"
    />

    <v-dialog
      :value="!!moveRows"
      max-width="420"
      @input="moveRows = null"
    >
      <div
        v-if="moveRows"
        class="jobs__move"
        data-tid="jobs-move-dialog"
      >
        <h3>Move {{ moveRows.length === 1 ? moveRows[0].title : `${moveRows.length} items` }} to</h3>
        <button
          v-for="folder in moveTargets"
          :key="folder"
          type="button"
          class="jobs__move-to"
          @click="moveInto(folder)"
        >
          <frame-icon
            name="files"
            small
          />
          {{ folder ? `gcodes/${folder}/` : 'gcodes/' }}
        </button>
        <p
          v-if="!moveTargets.length"
          class="jobs__note"
        >
          No other folder yet. Make one with New folder first.
        </p>
        <div class="jobs__move-actions">
          <button
            type="button"
            class="cbtn"
            @click="moveRows = null"
          >
            Cancel
          </button>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import consola from 'consola'
import JobsMixin, { type JobFile } from '@/mixins/jobs'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import { EventBus } from '@/eventBus'
import type { QueuedJob } from '@/store/jobQueue/types'
import type { AppDirectory, AppFileWithMeta, FileBrowserEntry } from '@/store/files/types'
import { fileSize, isGcodeFile, jobTitle, parentFolder, queueLabel, rangeSelect, readyChecks, toggleKey } from '@/services/jobs/model'
import { lastPrinted, layerCountOf, listDuration, materialOf, sortListRows } from '@/services/jobs/list'
import { jobsPage, resetJobsPage } from '@/services/jobs/page-state'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'
import JobMenu, { type JobMenuAction } from '@/components/jobs/JobMenu.vue'
import JobPicture from '@/components/jobs/JobPicture.vue'
import TonePill from '@/components/printers/TonePill.vue'

/** A row of the list: a folder, or a G-code file in the folder that's open. */
interface ListRow {
  /** Its path in gcodes/, which is also its key. */
  key: string;
  kind: 'folder' | 'file';
  /** What the printer calls it. */
  name: string;
  title: string;
  sub: string;
  modified: number;
  time?: number;
  size: number;
  filament?: number;
  layer?: number;
  material: string;
  lastPrinted: number | null;
  /** It has a print on record, with or without a time. */
  printed: boolean;
  printing: boolean;
  /** It is the file printing, or a folder with that file in it: it stays where it is. */
  held: boolean;
  job?: JobFile;
}

/**
 * Jobs: the G-code on the printer as one list (the file that's printing
 * pinned first), and a tile beside it for the one that's picked: its
 * picture, its facts, Print and Preview. Everything that can be done to
 * a file is in its ··· menu. The search, the order, Upload and the
 * pages that used to be tabs are in the header (JobsActions).
 */
@Component({ components: { FileNameDialog, JobMenu, JobPicture, TonePill } })
export default class Jobs extends Mixins(JobsMixin, BrowserMixin) {
  path = ''
  selectedKey: string | null = null
  folderDialog = false
  renameRow: ListRow | null = null
  moveRows: ListRow[] | null = null
  dialogTarget: string | null = null
  /** Selecting many: rows have checkboxes and a bar offers what can be done to them. */
  selecting = false
  selection: string[] = []
  anchor: string | null = null
  pressTimer: number | null = null
  longPressed = false

  readonly listDuration = listDuration
  readonly fileSize = fileSize
  readonly lastPrinted = lastPrinted
  readonly queueLabel = queueLabel

  get query (): string { return jobsPage.query }

  mounted () {
    const saved = (this.$store.getters['files/getCurrentPathByRoot'](this.root) as string | undefined) ?? ''
    this.openFolder(saved.startsWith(`${this.root}/`) ? saved.slice(this.root.length + 1) : '')
    this.loadFiles()
    this.publish()
  }

  beforeDestroy () {
    this.pressEnd()
    resetJobsPage()
    jobsPage.files = 0
    jobsPage.free = ''
  }

  // -- the folder that's open ------------------------------------------------

  get dir (): string {
    return this.path ? `${this.root}/${this.path}` : this.root
  }

  get dirEntries (): FileBrowserEntry[] {
    return (this.$store.getters['files/getDirectory'](this.dir) as FileBrowserEntry[] | undefined) ?? []
  }

  get dirLoaded (): boolean {
    return !!this.$store.getters['files/getDirectory'](this.dir)
  }

  get parent (): string {
    return parentFolder(this.path)
  }

  get crumbs (): Array<{ name: string, path: string }> {
    const parts = this.path ? this.path.split('/') : []
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }))
  }

  /** The file printing, or a folder with it inside, stays where it is. */
  holds (key: string): boolean {
    const printing = this.busy ? this.jobFile : ''
    return !!printing && (printing === key || printing.startsWith(`${key}/`))
  }

  get printingTitle (): string {
    return jobTitle(this.jobFile)
  }

  openFolder (path: string) {
    if (path !== this.path) this.selectedKey = null
    this.path = path
    // A file dropped anywhere on the page lands in the folder that's open.
    this.$store.dispatch('files/updateCurrentPathByRoot', { root: this.root, path: this.dir })
    SocketActions.serverFilesGetDirectory(this.root, this.dir)
  }

  /** A folder's G-code count, once Fluidd has listed it. */
  folderCount (key: string): string {
    const listing = (this.$store.state.files.pathFiles as Record<string, { files: Array<{ filename: string }> }>)[`${this.root}/${key}`]
    if (!listing) return 'Folder'
    const n = listing.files.filter(f => isGcodeFile(f.filename)).length
    return `${n} ${n === 1 ? 'file' : 'files'}`
  }

  // -- the list ----------------------------------------------------------------

  get fileRows (): ListRow[] {
    return this.dirEntries
      .filter((e): e is AppFileWithMeta => e.type === 'file' && isGcodeFile(e.filename))
      .map(f => {
        const job = this.toJobFile(f)
        const history = f.history as { start_time?: number } | undefined
        return {
          key: job.path,
          kind: 'file' as const,
          name: f.filename,
          title: job.title,
          sub: '',
          modified: f.modified,
          time: f.estimated_time,
          size: f.size,
          filament: f.filament_weight_total || undefined,
          layer: f.layer_height || undefined,
          material: materialOf(f.filament_type),
          lastPrinted: history?.start_time ?? job.print_start_time ?? null,
          printed: job.printed,
          printing: job.printing,
          held: job.printing,
          job
        }
      })
  }

  get folderRows (): ListRow[] {
    return this.dirEntries
      .filter((e): e is AppDirectory => e.type === 'directory' && e.name !== '..')
      .map(d => ({
        key: this.path ? `${this.path}/${d.dirname}` : d.dirname,
        kind: 'folder' as const,
        name: d.dirname,
        title: d.dirname,
        sub: '',
        modified: d.modified,
        size: d.size,
        material: '',
        lastPrinted: null,
        printed: false,
        printing: false,
        held: this.holds(this.path ? `${this.path}/${d.dirname}` : d.dirname)
      }))
  }

  get rows (): ListRow[] {
    const q = this.query.trim().toLowerCase()
    const all = [...this.folderRows, ...this.fileRows]
      .filter(r => !q || r.name.toLowerCase().includes(q) || r.title.toLowerCase().includes(q))
      .filter(r => r.kind === 'folder' || jobsPage.filter === 'all' || (jobsPage.filter === 'before') === r.printed)
    return sortListRows(all, jobsPage.sort, jobsPage.reverse)
  }

  get selectedRow (): ListRow | undefined {
    return this.rows.find(r => r.key === this.selectedKey && r.kind === 'file')
  }

  /** A desktop always has a file picked, so the tile is never empty; a phone waits for a tap. */
  @Watch('rows')
  keepSelection (rows: ListRow[]) {
    const keys = new Set(rows.map(r => r.key))
    if (this.selection.some(k => !keys.has(k))) this.selection = this.selection.filter(k => keys.has(k))
    if (this.selectedKey && rows.some(r => r.key === this.selectedKey)) return
    if (this.isMobileViewport) {
      this.selectedKey = null
      return
    }
    const first = rows.find(r => r.kind === 'file' && !r.printing) ?? rows.find(r => r.kind === 'file')
    this.selectedKey = first?.key ?? null
  }

  @Watch('isMobileViewport')
  onViewport () {
    this.keepSelection(this.rows)
  }

  /** What the header's second line says. */
  @Watch('fileRows')
  @Watch('freeSpace')
  @Watch('printerName')
  publish () {
    jobsPage.files = this.fileRows.length
    jobsPage.free = this.freeSpace ?? ''
    jobsPage.printerName = this.printerName
  }

  pick (row: ListRow) {
    if (row.kind === 'folder') {
      this.openFolder(row.key)
      return
    }
    // A phone's second tap lets go of the file, and the Print bar goes.
    this.selectedKey = this.isMobileViewport && this.selectedKey === row.key ? null : row.key
  }

  /** A click picks the file for the tile; with Ctrl, Shift or while selecting, it selects. */
  onRowClick (row: ListRow, event: MouseEvent) {
    if (this.longPressed) {
      this.longPressed = false
      return
    }
    if (this.selecting || event.ctrlKey || event.metaKey || event.shiftKey) {
      this.selecting = true
      this.onCheck(row, event)
      return
    }
    this.pick(row)
  }

  onCheck (row: ListRow, event: MouseEvent) {
    const order = this.rows.map(r => r.key)
    this.selection = event.shiftKey
      ? rangeSelect(order, this.selection, this.anchor, row.key)
      : toggleKey(this.selection, row.key)
    this.anchor = row.key
  }

  /** Enter or a double-click: a folder opens, a file opens its preview. */
  openRow (row: ListRow | undefined) {
    if (!row) return
    if (row.kind === 'folder') {
      this.openFolder(row.key)
      return
    }
    this.selectedKey = row.key
    this.preview(row)
  }

  /** A long press on a phone starts selecting. */
  pressStart (row: ListRow) {
    if (!this.isMobileViewport || this.selecting) return
    this.pressEnd()
    this.pressTimer = window.setTimeout(() => {
      this.pressTimer = null
      this.longPressed = true
      this.selecting = true
      this.selection = [row.key]
      this.anchor = row.key
    }, 500)
  }

  pressEnd () {
    if (this.pressTimer !== null) window.clearTimeout(this.pressTimer)
    this.pressTimer = null
  }

  @Watch('selectTick')
  onSelectTick () {
    this.selecting = true
  }

  get selectTick (): number { return jobsPage.selectTick }

  stopSelecting () {
    this.selecting = false
    this.selection = []
    this.anchor = null
  }

  get selectedRows (): ListRow[] {
    return this.rows.filter(r => this.selection.includes(r.key))
  }

  get selectedFiles (): ListRow[] {
    return this.selectedRows.filter(r => r.job)
  }

  /** What can be moved or deleted: not the file printing, nor a folder holding it. */
  get changeable (): ListRow[] {
    return this.selectedRows.filter(r => !this.holds(r.key))
  }

  get queueable (): ListRow[] {
    return this.selectedFiles.filter(r => !this.holds(r.key))
  }

  get heldCount (): number {
    return this.selectedRows.length - this.changeable.length
  }

  get allSelected (): boolean {
    return this.rows.length > 0 && this.rows.every(r => this.selection.includes(r.key))
  }

  toggleAll () {
    this.selection = this.allSelected ? [] : this.rows.map(r => r.key)
  }

  async queueSelected () {
    if (!this.controlReady || !this.canQueue) return
    const paths = this.queueable.map(r => r.key)
    if (!paths.length) return
    await SocketActions.serverJobQueuePostJob(paths)
    this.stopSelecting()
  }

  downloadSelected () {
    for (const row of this.selectedFiles) if (row.job) this.downloadJob(row.job)
  }

  moveSelected () {
    this.dialogTarget = this.commandTarget
    this.moveRows = this.changeable
  }

  async deleteSelected () {
    if (!this.controlReady) return
    const rows = this.changeable.filter(r => !this.holds(r.key))
    if (!rows.length) return
    const files = rows.filter(r => r.kind === 'file').length
    const folders = rows.length - files
    const what = [
      files ? `${files} ${files === 1 ? 'file' : 'files'}` : '',
      folders ? `${folders} ${folders === 1 ? 'folder' : 'folders'}` : ''
    ].filter(Boolean).join(' and ')
    const name = rows.length === 1 ? rows[0].name : what
    const note = folders ? ' A folder goes with everything in it.' : ''
    const target = this.commandTarget
    const ok = await this.$confirm(`It's removed from ${this.printerName}.${note} This can't be undone.`, { title: `Delete ${name}?`, buttonTrueText: 'Delete', danger: true })
    if (!ok || target !== this.commandTarget || !this.controlReady) return
    for (const row of rows) {
      // The print may have started while the question was open.
      if (this.holds(row.key)) continue
      if (row.kind === 'folder') SocketActions.serverFilesDeleteDirectory(`${this.root}/${row.key}`, true)
      else SocketActions.serverFilesDeleteFile(`${this.root}/${row.key}`)
    }
    this.stopSelecting()
  }

  clearSearch () {
    jobsPage.query = ''
  }

  onKey (event: KeyboardEvent) {
    // Keys on a row's ... button or a menu belong to them: only the list itself takes these.
    if (event.target !== this.$refs.rows) return
    const keys = this.rows.map(r => r.key)
    const at = this.selectedKey ? keys.indexOf(this.selectedKey) : -1
    const go = (to: number) => {
      const row = this.rows[Math.max(0, Math.min(keys.length - 1, to))]
      if (!row) return
      if (row.kind === 'file') this.selectedKey = row.key
      this.$nextTick(() => (this.$el.querySelector(`[data-key="${CSS.escape(row.key)}"]`) as HTMLElement | null)?.scrollIntoView({ block: 'nearest' }))
    }
    switch (event.key) {
      case 'ArrowDown': go(at + 1); break
      case 'ArrowUp': go(at - 1); break
      case 'Home': go(0); break
      case 'End': go(keys.length); break
      case 'Delete':
        if (this.selecting && this.selection.length) this.deleteSelected()
        else if (this.selectedRow) this.removeRow(this.selectedRow)
        break
      case 'Enter':
        this.openRow(this.selectedRow)
        break
      case ' ':
        if (!this.selecting || !this.selectedRow) return
        this.selection = toggleKey(this.selection, this.selectedRow.key)
        break
      case 'Escape':
        if (this.selection.length) this.selection = []
        else if (this.selecting) this.stopSelecting()
        else return
        break
      case 'Backspace':
        if (this.path) this.openFolder(this.parent)
        break
      default:
        return
    }
    event.preventDefault()
  }

  // -- the picked file ---------------------------------------------------------

  get stats (): Array<{ label: string, value: string, dot?: boolean }> {
    const job = this.selectedRow?.job
    if (!job) return []
    const f = job.file
    const layers = layerCountOf(f)
    const material = materialOf(f.filament_type)
    return [
      { label: 'Print time', value: listDuration(f.estimated_time) },
      { label: 'Material', value: material || '—', dot: !!material },
      { label: 'Filament', value: f.filament_weight_total ? `${f.filament_weight_total.toFixed(1)} g` : '—' },
      { label: layers && f.layer_height ? `Layers at ${f.layer_height} mm` : 'Layers', value: layers ? String(layers) : '—' }
    ]
  }

  /** What to know before it prints: the checks that aren't fine. */
  get warnings (): string[] {
    const job = this.selectedRow?.job
    if (!job) return []
    return readyChecks(job.file, job.filename, this.loadedFilament, this.printerName, this.busy)
      .filter(c => !c.ok && !c.text.endsWith('it can go next in the queue'))
      .map(c => c.text)
  }

  canStart (row: ListRow): boolean {
    if (!row.job || !this.controlReady) return false
    if (row.printing) return false
    return !this.busy || this.canQueue
  }

  printLabel (row: ListRow): string {
    if (row.printing) return 'Printing now'
    return this.busy && this.canQueue ? 'Add to queue' : 'Print'
  }

  async printRow (row: ListRow) {
    if (!row.job || !this.canStart(row)) return
    await this.printOrQueue(row.job)
  }

  async preview (row: ListRow) {
    const job = row.job
    if (!job) return
    try {
      const response = await this.getGcode(job.file)
      const gcode = response?.data
      if (!gcode) return
      this.$router.push({ path: scopedPath('/preview', activeSlug()) }).catch(() => {})
      this.$store.dispatch('gcodePreview/loadGcode', { file: job.file, gcode })
    } catch (error: unknown) {
      consola.error('[Jobs] preview gcode', error)
    }
  }

  act (action: JobMenuAction, row: ListRow) {
    this.dialogTarget = this.commandTarget
    switch (action) {
      case 'print': this.printRow(row); break
      case 'queue': if (row.job) this.addToQueue(row.job); break
      case 'preview': this.preview(row); break
      case 'download': if (row.job) this.downloadJob(row.job); break
      case 'rename': this.renameRow = row; break
      case 'move': this.moveRows = [row]; break
      case 'delete': this.removeRow(row); break
    }
  }

  // -- changing files ----------------------------------------------------------

  async removeRow (row: ListRow) {
    if (!this.controlReady || this.holds(row.key)) return
    if (row.kind === 'file' && row.job) {
      await this.removeJob(row.job)
      return
    }
    const target = this.commandTarget
    const ok = await this.$confirm(`It's removed from ${this.printerName}. A folder goes with everything in it. This can't be undone.`, { title: `Delete ${row.name}?`, buttonTrueText: 'Delete', danger: true })
    if (!ok || target !== this.commandTarget || !this.controlReady || this.holds(row.key)) return
    SocketActions.serverFilesDeleteDirectory(`${this.root}/${row.key}`, true)
  }

  rename (name: string) {
    const row = this.renameRow
    this.renameRow = null
    // Checked again now: the print may have started while the dialog was open.
    if (!row || !this.controlReady || this.dialogTarget !== this.commandTarget || this.holds(row.key)) return
    const clean = name.trim()
    if (!clean || clean === row.name) return
    SocketActions.serverFilesMove(`${this.root}/${row.key}`, `${this.dir}/${clean}`)
  }

  /** Where the rows can go: every folder Fluidd has listed, less where they are and the folders being moved. */
  get moveTargets (): string[] {
    const rows = this.moveRows
    if (!rows) return []
    const known = Object.keys(this.$store.state.files.pathFiles as Record<string, unknown>)
      .filter(p => p === this.root || p.startsWith(`${this.root}/`))
      .map(p => p === this.root ? '' : p.slice(this.root.length + 1))
    const here = this.folderRows.map(r => r.key)
    const moving = rows.filter(r => r.kind === 'folder').map(r => r.key)
    return [...new Set([...known, ...here, this.parent])]
      .filter(f => f !== this.path && !moving.some(m => f === m || f.startsWith(`${m}/`)))
      .sort((a, b) => a.localeCompare(b))
  }

  moveInto (folder: string) {
    const rows = this.moveRows
    this.moveRows = null
    if (!rows || !this.controlReady || this.dialogTarget !== this.commandTarget) return
    for (const row of rows) {
      // Checked again now: the print may have started while the dialog was open.
      if (!this.controlReady || this.dialogTarget !== this.commandTarget) return
      if (this.holds(row.key)) continue
      SocketActions.serverFilesMove(`${this.root}/${row.key}`, `${this.root}/${folder ? `${folder}/` : ''}${row.name}`)
    }
    if (this.selecting) this.stopSelecting()
  }

  makeFolder (name: string) {
    if (!this.controlReady) return
    const clean = name.trim()
    if (clean) SocketActions.serverFilesPostDirectory(`${this.dir}/${clean}`)
  }

  @Watch('commandTarget')
  onCommandTarget () {
    this.selectedKey = null
    this.renameRow = null
    this.moveRows = null
    this.folderDialog = false
    this.dialogTarget = null
    this.stopSelecting()
    this.openFolder('')
  }

  @Watch('folderTick')
  onFolderTick () {
    if (this.controlReady) this.folderDialog = true
  }

  get folderTick (): number { return jobsPage.folderTick }

  // -- upload ------------------------------------------------------------------

  get uploadTick (): number { return jobsPage.uploadTick }

  @Watch('uploadTick')
  onUploadTick () {
    this.pickUpload()
  }

  get gcodeAccept (): string {
    const root = this.$store.getters['files/getRootProperties'](this.root) as { accepts?: string[] } | undefined
    return (root?.accepts ?? []).join(',')
  }

  pickUpload () {
    if (!this.controlReady) return
    (this.$refs.upload as HTMLInputElement).click()
  }

  /** Uploads go into the folder that's open; one G-code file on its own is offered to print. */
  async onPicked (event: Event) {
    const input = event.target as HTMLInputElement
    const files = [...(input.files ?? [])]
    input.value = ''
    if (!this.controlReady || !files.length) return
    const target = this.commandTarget
    const path = this.path
    const stillCurrent = () => target === this.commandTarget && this.controlReady
    const uploaded = await this.uploadFiles(files, path, this.root, false, stillCurrent)
    if (uploaded === false || !stillCurrent()) {
      EventBus.$emit('Stopped: the printer changed', { type: 'warning', timeout: 5000 })
      return
    }
    const filepath = path ? `${path}/${files[0].name}` : files[0].name
    if (files.length === 1 && isGcodeFile(files[0].name) && uploaded.includes(filepath)) {
      EventBus.bus.$emit('job-ready', filepath)
    }
  }

  // -- the queue ---------------------------------------------------------------

  fileFor (filename: string): JobFile | undefined {
    return this.jobFiles.find(j => j.path === filename)
  }

  thumbnailOf (filename: string): string {
    return this.fileFor(filename)?.thumbnail ?? ''
  }

  titleOf (filename: string): string {
    return jobTitle(filename)
  }

  factsOf (filename: string): string {
    return this.fileFor(filename)?.facts ?? ''
  }

  unqueue (job: QueuedJob) {
    if (!this.controlReady) return
    SocketActions.serverJobQueueDeleteJobs([job.job_id])
  }

  async clearQueue () {
    if (!this.controlReady) return
    const target = this.commandTarget
    const jobs = this.queue.map(j => j.job_id)
    const ok = await this.$confirm(`The files stay on ${this.printerName}.`, { title: `Take all ${jobs.length} jobs out of the queue?`, buttonTrueText: 'Clear the queue', danger: true })
    if (ok && target === this.commandTarget && this.controlReady) SocketActions.serverJobQueueDeleteJobs(jobs)
  }

  startQueue () {
    if (this.controlReady) SocketActions.serverJobQueueStart()
  }

  async moveQueued (job: QueuedJob, by: number) {
    if (!this.controlReady) return
    const jobs = [...this.queue]
    const from = jobs.findIndex(item => item.job_id === job.job_id)
    const to = from + by
    if (from < 0 || to < 0 || to >= jobs.length) return
    jobs.splice(to, 0, jobs.splice(from, 1)[0])
    await SocketActions.serverJobQueuePostJob(jobs.map(item => item.filename), true)
  }
}
</script>

<style lang="scss" scoped>
  .jobs {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  // -- Up next ----------------------------------------------------------------

  .jobs__next {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .jobs__next-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }
  }

  .jobs__count {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    font-size: 12px;
    font-weight: 600;
  }

  .jobs__hint {
    margin-left: auto;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .jobs__link {
    color: var(--m3d-accent) !important;
    font-size: 14px;

    &:disabled {
      opacity: 0.45;
    }
  }

  .jobs__next-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 8px;
  }

  .jobs__queued {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 8px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
  }

  .jobs__queued-text {
    display: flex;
    flex-direction: column;
    min-width: 0;

    b {
      overflow: hidden;
      font-size: 14px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .jobs__unqueue {
    display: inline-flex;
    flex: none;
    margin-left: auto;
    padding: 6px;
    border-radius: 8px;
    color: var(--m3d-text-muted);

    & + & {
      margin-left: 0;
    }

    &:hover:not(:disabled) {
      background: var(--m3d-surface);
      color: var(--m3d-text);
    }

    &:disabled {
      opacity: 0.4;
    }
  }

  .jobs__readonly {
    margin: 0;
    padding: 12px 16px;
    border-radius: 14px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  // -- The list and the tile beside it ------------------------------------------

  .jobs__grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
    align-items: start;
    gap: 16px;
  }

  .jobs__list,
  .jobs__detail {
    min-width: 0;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .jobs__list {
    overflow: hidden;
  }

  .jobs__detail {
    position: sticky;
    top: 88px;
    padding: 18px;
  }

  .jobs__crumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    border-bottom: 1px solid var(--m3d-border);
    color: var(--m3d-text-muted);
    font-size: 13px;

    button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--m3d-accent);

      &:disabled {
        color: var(--m3d-text);
      }
    }
  }

  .jobs__selection {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    padding: 10px 18px;
    border-bottom: 1px solid var(--m3d-border);
    background: var(--m3d-accent-soft);
    font-size: 14px;

    button {
      color: var(--m3d-accent);
      font-weight: 600;

      &:disabled {
        opacity: 0.45;
      }
    }
  }

  .jobs__grow {
    flex: 1 1 auto;
  }

  .jobs__danger {
    color: var(--m3d-danger) !important;
  }

  .jobs__box {
    flex: none;
    width: 18px;
    height: 18px;
    accent-color: var(--m3d-accent);
  }

  .jobs__printing-link {
    text-decoration: none;
  }

  .jobs__row {
    display: grid;
    grid-template-columns: minmax(0, 3fr) 1fr 1.3fr 1fr 1.3fr 44px;
    align-items: center;
    gap: 12px;
    min-height: 64px;
    padding: 8px 12px 8px 18px;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    cursor: pointer;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .jobs__row--head {
    min-height: 44px;
    border-bottom: 1px solid var(--m3d-border);
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
    cursor: default;
  }

  .jobs__row--now {
    background: var(--m3d-surface-2);
  }

  .jobs__row--sel {
    background: var(--m3d-accent-soft);
  }

  .jobs__rows:focus-visible {
    outline: 2px solid var(--m3d-accent);
    outline-offset: -2px;
  }

  .jobs__name {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .jobs__name-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;

    b {
      overflow: hidden;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .jobs__sub {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .jobs__thumb {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    overflow: hidden;
    border-radius: 10px;
    background: radial-gradient(100% 100% at 50% 35%, #2f3133 0%, #1f2022 70%);
    color: var(--m3d-text-subtle);

    img {
      width: 90%;
      height: 90%;
      object-fit: contain;
    }
  }

  .jobs__thumb--small {
    width: 36px;
    height: 36px;
  }

  .jobs__thumb--folder {
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .jobs__cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .jobs__dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    margin-right: 6px;
    border-radius: 50%;
    background: var(--m3d-text);
    vertical-align: -1px;
  }

  .jobs__end {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
  }

  .jobs__check {
    color: var(--m3d-accent);
  }

  .jobs__pct {
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
    font-size: 12px;
    font-weight: 700;
  }

  .jobs__bar {
    display: block;
    height: 4px;
    margin-top: 4px;
    overflow: hidden;
    border-radius: 2px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      background: var(--m3d-accent);
    }
  }

  // -- The detail tile ------------------------------------------------------------

  .jobs__detail-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;

    b {
      flex: 1 1 0;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .jobs__picture {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 16px;
    background: radial-gradient(90% 80% at 50% 45%, #2f3133 0%, #1b1c1e 80%);
    color: var(--m3d-text-subtle);

    img {
      width: 88%;
      height: 88%;
      object-fit: contain;
    }
  }

  .jobs__filename {
    margin: 10px 0 0;
    overflow: hidden;
    color: var(--m3d-text-muted);
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .jobs__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 14px 0;

    div {
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--m3d-surface-2);
    }

    dd {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
    }

    dt {
      order: 2;
      color: var(--m3d-text-muted);
      font-size: 12px;
      font-weight: 400;
    }

    div {
      display: flex;
      flex-direction: column;
    }
  }

  .jobs__warning-icon {
    margin-right: 6px;
    color: var(--m3d-warning) !important;
  }

  .jobs__warnings {
    margin: 0 0 14px;
    padding: 0;
    color: var(--m3d-warning);
    font-size: 13px;
    list-style: none;
  }

  .jobs__actions {
    display: flex;
    gap: 10px;
  }

  .jobs__print {
    flex: 1 1 auto;
  }

  // -- Empty and loading ------------------------------------------------------------

  .jobs__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 48px 24px;
    color: var(--m3d-text-muted);
    font-size: 14px;
    text-align: center;

    b {
      color: var(--m3d-text);
      font-size: 16px;
    }
  }

  .jobs__empty-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: 6px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
  }

  .jobs__skeleton-row {
    height: 64px;
    margin: 0 18px;
    border-bottom: 1px solid var(--m3d-border);
    background: linear-gradient(90deg, transparent, var(--m3d-surface-2), transparent);
    opacity: 0.6;
  }

  .jobs__upload {
    display: none;
  }

  .jobs__note {
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .jobs__move {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface-solid, var(--m3d-surface));

    h3 {
      margin: 0 0 8px;
    }
  }

  .jobs__move-to {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    text-align: left;

    &:hover {
      background: var(--m3d-surface-2);
    }
  }

  .jobs__move-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }

  // -- A phone: rows, and Print in a bar above the tab bar ----------------------------

  .jobs--phone {
    .jobs__grid {
      grid-template-columns: minmax(0, 1fr);
    }

    .jobs__row {
      grid-template-columns: minmax(0, 1fr) auto;
      min-height: 72px;
      padding: 10px 14px;
    }

    .jobs__thumb {
      width: 56px;
      height: 56px;
    }
  }

  .jobs__sticky {
    position: sticky;
    bottom: calc(76px + env(safe-area-inset-bottom));
    z-index: 5;
    display: flex;
    gap: 10px;
    margin: 0 -8px;
    padding: 12px 14px;
    border-top: 1px solid var(--m3d-border);
    background: var(--m3d-glass-thick, var(--m3d-surface));
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
  }
</style>
