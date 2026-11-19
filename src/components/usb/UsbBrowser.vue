<template>
  <section
    class="usb"
    :class="{ 'usb--phone': isMobileViewport }"
    data-tid="usb-view"
  >
    <div
      v-if="usb.supported === null"
      class="usb__empty"
      aria-busy="true"
      data-tid="usb-loading"
    >
      <span>Looking for a USB stick…</span>
    </div>

    <template v-else>
      <usb-job-panel
        v-if="shownJob"
        :job="shownJob"
        :cancelling="cancelling"
        @cancel="cancelJob"
        @dismiss="dismissJob"
      />

      <p
        v-if="notice"
        class="usb__notice"
        :class="{ 'usb__notice--bad': noticeBad }"
        role="status"
        data-tid="usb-notice"
      >
        {{ notice }}
      </p>

      <div
        v-if="!stick && justEjected"
        class="usb__empty"
        data-tid="usb-ejected"
      >
        <span class="usb__empty-icon"><frame-icon name="check" /></span>
        <b>Safe to remove</b>
        <span>{{ justEjected.name }} is ejected. Take it out of the printer. Plug it in again to use it.</span>
      </div>

      <div
        v-else-if="!stick"
        class="usb__empty"
        data-tid="usb-none"
      >
        <span class="usb__empty-icon"><frame-icon name="files" /></span>
        <b>No USB stick in the printer</b>
        <span v-if="rejected">The stick in the printer can't be read ({{ rejected }}). Use one formatted as FAT32 or exFAT.</span>
        <span v-else>Plug one into the printer's USB port and its files show up here.</span>
      </div>

      <template v-else>
        <header class="usb__head">
          <div class="usb__title">
            <select
              v-if="sticks.length > 1"
              v-model="stickName"
              class="usb__select"
              aria-label="USB stick"
              data-tid="usb-stick-select"
            >
              <option
                v-for="s in sticks"
                :key="s.name"
                :value="s.name"
              >
                {{ s.name }}
              </option>
            </select>
            <b
              v-else
              data-tid="usb-stick-name"
            >{{ stick.name }}</b>
            <span
              v-if="space"
              class="usb__space"
              data-tid="usb-space"
            >{{ space }}</span>
          </div>
          <button
            type="button"
            class="cbtn"
            :disabled="running || ejecting"
            :title="running ? 'A copy is running. Cancel it or wait for it to finish.' : ''"
            data-tid="usb-eject"
            @click="eject"
          >
            {{ ejecting ? 'Ejecting…' : 'Eject' }}
          </button>
        </header>

        <p
          v-if="stick.readOnly"
          class="usb__notice"
          data-tid="usb-readonly"
        >
          This stick is read-only, so nothing can be copied onto it. You can still print from it and copy its files to the printer.
        </p>

        <nav
          v-if="rel"
          class="usb__crumbs"
          aria-label="Folder"
        >
          <button
            type="button"
            data-tid="usb-crumb"
            @click="openFolder('')"
          >
            {{ stick.name }}
          </button>
          <template v-for="crumb in crumbs">
            <span
              :key="`s-${crumb.path}`"
              aria-hidden="true"
            >/</span>
            <button
              :key="crumb.path"
              type="button"
              data-tid="usb-crumb"
              :disabled="crumb.path === rel"
              @click="openFolder(crumb.path)"
            >
              {{ crumb.name }}
            </button>
          </template>
        </nav>

        <div
          class="usb__bar"
          data-tid="usb-actions"
        >
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="!selected.length || running"
            data-tid="usb-copy-to-printer"
            @click="askCopy('to_printer', selected.slice(), `${selected.length} selected`)"
          >
            <frame-icon
              name="download"
              small
            />
            Copy to printer{{ selected.length ? ` (${selected.length})` : '' }}
          </button>
          <button
            type="button"
            class="cbtn"
            :disabled="running"
            data-tid="usb-copy-all"
            @click="askCopy('to_printer', ['/'], 'everything on the stick')"
          >
            Copy all to printer
          </button>
          <button
            type="button"
            class="cbtn"
            :disabled="running || stick.readOnly || !controlReady"
            data-tid="usb-copy-from-printer"
            @click="picker = true"
          >
            <frame-icon
              name="upload"
              small
            />
            Copy from printer…
          </button>
          <button
            type="button"
            class="cbtn"
            :disabled="!downloadable.length || !!downloading"
            data-tid="usb-download"
            @click="download"
          >
            Download{{ downloadable.length > 1 ? ` (${downloadable.length})` : '' }}
          </button>
          <button
            type="button"
            class="cbtn"
            :disabled="!printable || !controlReady || running"
            data-tid="usb-print"
            @click="printAsk = printable"
          >
            Print
          </button>
        </div>

        <div
          v-if="downloading"
          class="usb__download"
          data-tid="usb-download-progress"
        >
          <span>Downloading {{ downloading.name }}… {{ downloading.total ? `${percent(downloading.loaded, downloading.total)}%` : bytes(downloading.loaded) }}</span>
          <button
            type="button"
            class="cbtn cbtn--sm"
            data-tid="usb-download-cancel"
            @click="stopDownload"
          >
            Cancel
          </button>
        </div>

        <div
          v-if="loadError"
          class="usb__empty"
          role="alert"
          data-tid="usb-error"
        >
          <b>Couldn't read the stick</b>
          <span>{{ loadError }}</span>
          <button
            type="button"
            class="cbtn"
            @click="load(true)"
          >
            Try again
          </button>
        </div>

        <div
          v-else-if="loading && !entries.length"
          class="usb__empty"
          aria-busy="true"
        >
          <span>Reading the stick…</span>
        </div>

        <div
          v-else-if="!entries.length"
          class="usb__empty"
          data-tid="usb-empty"
        >
          <span class="usb__empty-icon"><frame-icon name="files" /></span>
          <b>{{ rel ? 'This folder is empty' : 'No G-code on this stick' }}</b>
          <span>Only G-code files and the folders they are in are shown.</span>
        </div>

        <template v-else>
          <div class="usb__row usb__row--head">
            <label class="usb__check">
              <input
                type="checkbox"
                :checked="allSelected"
                aria-label="Select all"
                data-tid="usb-select-all"
                @change="toggleAll"
              >
            </label>
            <span class="usb__name">Name</span>
            <span
              v-if="!isMobileViewport"
              class="usb__when"
            >Modified</span>
            <span class="usb__size">Size</span>
          </div>
          <ul
            class="usb__rows"
            data-tid="usb-rows"
          >
            <li
              v-for="entry in entries"
              :key="entry.rel"
              class="usb__row"
              :class="{ 'usb__row--on': selected.includes(entry.rel) }"
              data-tid="usb-row"
              :data-name="entry.name"
              :data-kind="entry.isDir ? 'folder' : 'file'"
              :aria-selected="selected.includes(entry.rel)"
            >
              <label class="usb__check">
                <input
                  type="checkbox"
                  :checked="selected.includes(entry.rel)"
                  :aria-label="`Select ${entry.name}`"
                  data-tid="usb-row-check"
                  @change="toggle(entry.rel)"
                >
              </label>
              <button
                v-if="entry.isDir"
                type="button"
                class="usb__name usb__name--folder"
                data-tid="usb-open-folder"
                @click="openFolder(entry.rel)"
              >
                <frame-icon
                  name="files"
                  small
                />
                {{ entry.name }}
              </button>
              <span
                v-else
                class="usb__name"
                @click="toggle(entry.rel)"
              >
                <frame-icon
                  name="jobs"
                  small
                />
                {{ entry.name }}
              </span>
              <span
                v-if="!isMobileViewport"
                class="usb__when"
              >{{ when(entry.modified) }}</span>
              <span class="usb__size">{{ entry.isDir ? '' : bytes(entry.size) }}</span>
            </li>
          </ul>
          <button
            v-if="entries.length < total"
            type="button"
            class="cbtn usb__more"
            :disabled="loading"
            data-tid="usb-more"
            @click="load(false)"
          >
            {{ loading ? 'Loading…' : `Show more (${total - entries.length} left)` }}
          </button>
          <p
            class="usb__count"
            data-tid="usb-count"
          >
            Showing {{ entries.length }} of {{ total }}
          </p>
        </template>
      </template>
    </template>

    <v-dialog
      :value="!!copyAsk"
      max-width="440"
      @input="copyAsk = null"
    >
      <div
        v-if="copyAsk"
        class="usb__dialog"
        data-tid="usb-conflict"
      >
        <b>Copy {{ copyAsk.label }} {{ copyAsk.direction === 'to_printer' ? 'to the printer' : `to ${stickName}` }}</b>
        <p>If a file with the same name is already there:</p>
        <label
          v-for="choice in CONFLICTS"
          :key="choice.value"
          class="usb__choice"
        >
          <input
            v-model="conflict"
            type="radio"
            name="usb-conflict"
            :value="choice.value"
            :data-tid="`usb-conflict-${choice.value}`"
          >
          <span><b>{{ choice.title }}</b> {{ choice.hint }}</span>
        </label>
        <div class="usb__dialog-actions">
          <button
            type="button"
            class="cbtn"
            @click="copyAsk = null"
          >
            Cancel
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            data-tid="usb-conflict-confirm"
            @click="startCopy"
          >
            Copy
          </button>
        </div>
      </div>
    </v-dialog>

    <v-dialog
      :value="!!printAsk"
      max-width="420"
      @input="printAsk = null"
    >
      <div
        v-if="printAsk"
        class="usb__dialog"
        data-tid="usb-print-confirm"
      >
        <b>Print {{ printAsk.name }}?</b>
        <p>The printer copies it from the stick to itself first, then starts.</p>
        <div class="usb__dialog-actions">
          <button
            type="button"
            class="cbtn"
            @click="printAsk = null"
          >
            Cancel
          </button>
          <button
            type="button"
            class="cbtn cbtn--primary"
            data-tid="usb-print-confirm-go"
            @click="print"
          >
            Print
          </button>
        </div>
      </div>
    </v-dialog>

    <usb-printer-picker
      v-model="picker"
      :stick-name="stickName"
      @choose="askCopy('to_usb', $event, $event[0] === '/' ? 'everything on the printer' : `${$event.length} selected`)"
    />
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import UsbJobPanel from './UsbJobPanel.vue'
import UsbPrinterPicker from './UsbPrinterPicker.vue'
import { failureOf, saveBlob, usbCancel, usbCopy, usbDownload, usbEject, usbList, usbPath, usbPrint } from '@/services/usb/api'
import { dismissJob, refreshUsb, refreshUsbJob, usb } from '@/services/usb/state'
import type { UsbConflict, UsbDirection, UsbEntry, UsbJob, UsbStick } from '@/services/usb/types'
import { bytesWords, isRunning, percentOf, reasonWords } from '@/services/usb/words'

const PAGE = 100

/** Above this a download asks first: it is held in the browser's memory until saved. */
const LARGE_DOWNLOAD = 100 * 1024 * 1024

const CONFLICTS: Array<{ value: UsbConflict, title: string, hint: string }> = [
  { value: 'rename', title: 'Keep both.', hint: 'The new one gets a number added to its name.' },
  { value: 'skip', title: 'Skip it.', hint: 'Leave the file that is there.' },
  { value: 'replace', title: 'Overwrite it.', hint: 'The file that is there is replaced.' }
]

/**
 * The printer's USB stick as a list (KAN-4814, I-520): browse, print, download,
 * copy to and from the printer (one, several or all), and eject. Everything
 * goes through the printer's USB routes over the page's own HTTP client, so
 * it works over a LAN, Bluetooth or the cloud alike.
 */
@Component({ components: { UsbJobPanel, UsbPrinterPicker } })
export default class UsbBrowser extends Mixins(BrowserMixin) {
  @Prop({ type: Boolean, default: true }) readonly controlReady!: boolean

  readonly usb = usb
  readonly CONFLICTS = CONFLICTS
  readonly bytes = bytesWords
  readonly percent = percentOf

  stickName = ''
  rel = ''
  entries: UsbEntry[] = []
  total = 0
  loading = false
  loadError = ''
  selected: string[] = []
  notice = ''
  noticeBad = false
  cancelling = false
  ejecting = false
  picker = false
  conflict: UsbConflict = 'rename'
  copyAsk: { direction: UsbDirection, items: string[], label: string } | null = null
  printAsk: UsbEntry | null = null
  downloading: { name: string, loaded: number, total: number } | null = null
  downloadAbort: AbortController | null = null
  /** Which read the list is waiting for, so a slow answer for a folder already left is dropped. */
  ticket = 0

  get sticks (): UsbStick[] { return usb.status?.sticks ?? [] }

  get stick (): UsbStick | null {
    return this.sticks.find(s => s.name === this.stickName) ?? this.sticks[0] ?? null
  }

  get rejected (): string {
    const r = usb.status?.rejected[0]
    return r ? (r.fstype || r.label || r.name) : ''
  }

  get justEjected () {
    return usb.status?.ejected[0] ?? null
  }

  get space (): string {
    const s = this.stick
    if (!s || s.freeBytes === null) return ''
    return s.totalBytes ? `${bytesWords(s.freeBytes)} free of ${bytesWords(s.totalBytes)}` : `${bytesWords(s.freeBytes)} free`
  }

  get crumbs (): Array<{ name: string, path: string }> {
    const parts = this.rel ? this.rel.split('/') : []
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }))
  }

  get shownJob (): UsbJob | null {
    const job = usb.job
    if (!job || job.id === usb.dismissed) return null
    return job
  }

  get running (): boolean { return isRunning(usb.job) }

  get allSelected (): boolean {
    return !!this.entries.length && this.entries.every(e => this.selected.includes(e.rel))
  }

  get downloadable (): UsbEntry[] {
    return this.entries.filter(e => !e.isDir && this.selected.includes(e.rel))
  }

  /** Print takes exactly one file. */
  get printable (): UsbEntry | null {
    const picked = this.entries.filter(e => this.selected.includes(e.rel))
    return picked.length === 1 && !picked[0].isDir ? picked[0] : null
  }

  mounted () {
    this.stickName = this.sticks[0]?.name ?? ''
    if (this.stickName) this.load(true)
  }

  beforeDestroy () {
    this.downloadAbort?.abort()
  }

  @Watch('stick.name')
  onStick (name: string | undefined) {
    if (!name) {
      this.entries = []
      this.total = 0
      this.selected = []
      this.rel = ''
      return
    }
    this.stickName = name
    this.rel = ''
    this.selected = []
    this.load(true)
  }

  /** A copy onto the stick changes what is on it. */
  @Watch('usb.job.state')
  onJobState (state: string | undefined, before: string | undefined) {
    if (before && (before === 'running' || before === 'queued') && state && state !== 'running' && state !== 'queued') this.load(true)
  }

  say (text: string, bad = false) {
    this.notice = text
    this.noticeBad = bad
  }

  openFolder (path: string) {
    this.rel = path
    this.selected = []
    this.load(true)
  }

  async load (reset: boolean) {
    const stick = this.stick
    if (!stick) return
    const ticket = ++this.ticket
    this.loading = true
    if (reset) { this.loadError = ''; this.entries = []; this.total = 0 }
    try {
      const page = await usbList(stick.name, this.rel, reset ? 0 : this.entries.length, PAGE)
      if (ticket !== this.ticket) return
      this.entries = reset ? page.entries : [...this.entries, ...page.entries]
      this.total = Math.max(page.total, this.entries.length)
    } catch (error) {
      if (ticket !== this.ticket) return
      const { status, message } = failureOf(error)
      this.loadError = status === 404 ? reasonWords('stick_removed') : (message || 'The printer did not answer.')
      if (status === 404) refreshUsb()
    } finally {
      if (ticket === this.ticket) this.loading = false
    }
  }

  when (seconds: number): string {
    return seconds ? new Date(seconds * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  }

  toggle (rel: string) {
    this.selected = this.selected.includes(rel) ? this.selected.filter(s => s !== rel) : [...this.selected, rel]
  }

  toggleAll () {
    this.selected = this.allSelected ? [] : this.entries.map(e => e.rel)
  }

  // -- copy --------------------------------------------------------------------

  askCopy (direction: UsbDirection, items: string[], label: string) {
    this.copyAsk = { direction, items, label }
  }

  async startCopy () {
    const ask = this.copyAsk
    const stick = this.stick
    this.copyAsk = null
    if (!ask || !stick) return
    this.notice = ''
    try {
      // API v1.2: the stick's side is always usb/<stick>/<path>; the printer's side is relative to gcodes/.
      const items = ask.direction === 'to_printer' ? ask.items.map(i => i === '/' ? usbPath(stick.name) : usbPath(stick.name, i)) : ask.items
      await usbCopy({ direction: ask.direction, stick: stick.name, items, onConflict: this.conflict })
      this.selected = []
      await refreshUsbJob()
    } catch (error) {
      const { status, reason, message } = failureOf(error)
      if (status === 409) this.say('A copy is already running. Wait for it to finish, or cancel it first.', true)
      else this.say(reasonWords(reason) || message || 'The printer could not start the copy.', true)
    }
  }

  async cancelJob () {
    const job = usb.job
    if (!job) return
    this.cancelling = true
    try {
      await usbCancel(job.id)
      await refreshUsbJob()
    } catch (error) {
      this.say(failureOf(error).message || 'The printer could not cancel the copy.', true)
    } finally {
      this.cancelling = false
    }
  }

  dismissJob () {
    dismissJob()
  }

  // -- download, print, eject ----------------------------------------------------

  async download () {
    const stick = this.stick
    if (!stick) return
    this.notice = ''
    const files = this.downloadable.slice()
    // A download is held in this tab's memory until it is saved: a big file can make a phone's browser
    // close the page, so ask first above LARGE_DOWNLOAD (KAN-4815 review).
    const big = files.filter(f => (f.size ?? 0) > LARGE_DOWNLOAD)
    if (big.length) {
      const largest = big.reduce((a, b) => ((b.size ?? 0) > (a.size ?? 0) ? b : a))
      const text = big.length === 1
        ? `${largest.name} is ${this.bytes(largest.size)}. It downloads into this browser's memory first, which can be slow or fail on a phone. Download it anyway?`
        : `${big.length} of these files are large (up to ${this.bytes(largest.size)}). They download into this browser's memory first, which can be slow or fail on a phone. Download them anyway?`
      const sure = await this.$confirm(text, { title: 'Large download', buttonTrueText: 'Download' })
      if (!sure) return
    }
    this.downloadAbort = new AbortController()
    try {
      for (const file of files) {
        this.downloading = { name: file.name, loaded: 0, total: file.size }
        const blob = await usbDownload(stick.name, file.rel, {
          signal: this.downloadAbort.signal,
          onProgress: (loaded, total) => { this.downloading = { name: file.name, loaded, total: total || file.size } }
        })
        saveBlob(blob, file.name)
      }
    } catch (error) {
      if (!this.downloadAbort?.signal.aborted) {
        const { status, message } = failureOf(error)
        this.say(status === 404 ? reasonWords('stick_removed') : `The download failed. ${message}`.trim(), true)
      }
    } finally {
      this.downloading = null
      this.downloadAbort = null
    }
  }

  stopDownload () {
    this.downloadAbort?.abort()
  }

  async print () {
    const file = this.printAsk
    const stick = this.stick
    this.printAsk = null
    if (!file || !stick) return
    try {
      await usbPrint(stick.name, file.rel)
      this.say(`Started printing ${file.name}.`)
      this.$store.dispatch('notifications/pushNotification', { title: 'Printing from USB', description: file.name, type: 'success', snackbar: true })
    } catch (error) {
      const { status, message } = failureOf(error)
      this.say(status === 409 ? 'The printer is busy, so nothing was printed.' : status === 404 ? reasonWords('stick_removed') : (message || 'The printer could not start the print.'), true)
    }
  }

  async eject () {
    const stick = this.stick
    if (!stick || this.running) return
    this.ejecting = true
    this.notice = ''
    try {
      await usbEject(stick.name)
      await refreshUsb()
      this.say(`${stick.name} is ejected. Safe to remove.`)
    } catch (error) {
      const { status, reason, message } = failureOf(error)
      this.say(status === 409 || reason === 'job_running' ? 'A copy is still running. Cancel it or wait for it to finish, then eject.' : (message || 'The printer could not eject the stick.'), true)
    } finally {
      this.ejecting = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .usb {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }

  .usb__head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .usb__title {
    display: flex;
    flex: 1;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
    min-width: 0;

    b {
      font-size: 18px;
    }
  }

  .usb__select {
    padding: 4px 8px;
    border-radius: 8px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 16px;
  }

  .usb__space {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .usb__notice {
    margin: 0;
    padding: 10px 14px;
    border-radius: 14px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    font-size: 14px;

    &--bad {
      color: var(--m3d-warning);
    }
  }

  .usb__crumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    color: var(--m3d-text-muted);
    font-size: 14px;

    button:not(:disabled) {
      color: var(--m3d-accent);
    }
  }

  .usb__bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .usb__download {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }

  .usb__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 40px 16px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);
    font-size: 14px;
    text-align: center;

    b {
      color: var(--m3d-text);
      font-size: 17px;
    }
  }

  .usb__empty-icon {
    display: inline-flex;
    padding: 12px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
  }

  .usb__rows {
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .usb__row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 0 12px;
    border-radius: 12px;

    &--head {
      min-height: 32px;
      color: var(--m3d-text-subtle);
      font-size: 12px;
    }

    &--on {
      background: var(--m3d-fill-2);
    }

    &:hover:not(.usb__row--head) {
      background: var(--m3d-hover);
    }
  }

  .usb__check {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
  }

  .usb__name {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 8px;
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--folder {
      color: var(--m3d-accent);
    }
  }

  .usb__when {
    flex: none;
    width: 120px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .usb__size {
    flex: none;
    width: 72px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    text-align: right;
  }

  .usb__more {
    align-self: center;
  }

  .usb__count {
    margin: 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
    text-align: center;
  }

  .usb__dialog {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .usb__choice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 14px;

    span {
      color: var(--m3d-text-muted);
    }

    b {
      color: var(--m3d-text);
    }
  }

  .usb__dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .usb--phone {
    .usb__bar .cbtn {
      flex: 1 1 calc(50% - 8px);
    }

    .usb__size {
      width: 60px;
    }
  }
</style>
