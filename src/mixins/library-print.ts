import { Component, Mixins, Watch } from 'vue-property-decorator'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug, printerPath } from '@/services/printer-pages'
import { describeLibraryError, type LibraryItem, type LibraryRun, type Version } from '@/services/library/api'
import { agoText, setupLine, versionLine, versionOrigin, versionWhen } from '@/services/library/format'
import { loadThumbnail, thumbnailFor } from '@/services/library/thumbnails'
import { libraryClient, libraryState, loadItem, printVersions, restoreVersion } from '@/services/library/store'
import { shortDuration } from '@/util/short-duration'
import type { TargetRow } from '@/services/library/print-targets'
import LibraryPageMixin from './library-page'

/** One time it was printed, as the Printed tile lists it. */
export interface RunRow {
  id: string;
  /** "Boxwood · 1h 47m", or "Walnut · stopped at 62%". */
  title: string;
  /** "yesterday · finished". */
  line: string;
  status: string;
  tone: 'ok' | 'run' | 'bad';
}

export interface VersionRow {
  number: number;
  when: string;
  line: string;
  origin: string;
  current: boolean;
}

/**
 * What a print's own page does, apart from how it looks: the print the
 * address names, its versions (and restoring one), its history, and the
 * actions the Library page's card has. The page itself
 * (views/LibraryPrint.vue) is only its template and styles.
 */
@Component
export default class LibraryPrintMixin extends Mixins(LibraryPageMixin) {
  /** The print, once read; null when the Library has no such print. */
  loaded: LibraryItem | null = null
  missing = false
  /** Why it could not be read (the Library didn't answer), not that it is gone. */
  loadError = ''
  versions: Version[] = []
  /** Its prints, newest first, from the Library's runs. */
  runs: LibraryRun[] = []

  get itemId (): string {
    return String(this.$route.params.item ?? '')
  }

  /** The print as the list has it now (a rename, a print elsewhere), else as it was read. */
  get item (): LibraryItem | null {
    return libraryState.items[this.itemId] ?? this.loaded
  }

  @Watch('itemId', { immediate: true })
  async onItemId (id: string) {
    this.missing = false
    this.loadError = ''
    this.loaded = null
    this.versions = []
    this.runs = []
    // Not until the account is known and the Library has answered for it (then onLibrary reads again).
    if (!id || !this.libraryKnown) return
    // Off: the page says so (libraryOff) rather than reading for ever.
    if (!libraryState.enabled) return
    try {
      const item = await loadItem(id)
      if (id !== this.itemId) return
      this.loaded = item
      this.missing = !item
    } catch (error) {
      // Not gone: the Library didn't answer. Say why, with Retry.
      if (id === this.itemId) this.loadError = describeLibraryError(error)
    }
  }

  /** Retry: read it again. */
  reload () {
    return this.onItemId(this.itemId)
  }

  /** The Library is off (or could not be read), so there is no print to show. */
  get libraryOff (): boolean {
    return this.signedIn && libraryState.checked && !libraryState.enabled && !this.item
  }

  /** Its prints, from the Library's newest runs (they carry the print they were of). */
  async readRuns () {
    const id = this.itemId
    try {
      const page = await libraryClient().runs('', 100)
      if (id !== this.itemId) return
      this.runs = (Array.isArray(page.runs) ? page.runs : []).filter(run => run.item_id === id)
    } catch { /* the tile says it has printed, from the item, without the list */ }
  }

  get runRows (): RunRow[] {
    return this.runs.slice(0, 8).map(run => {
      const stopped = run.outcome === 'cancelled' || run.outcome === 'failed'
      const at = stopped && typeof run.progress_pct === 'number' ? `stopped at ${Math.round(run.progress_pct)}%` : run.duration_s ? shortDuration(run.duration_s) : ''
      const outcome = run.outcome === 'finished' ? 'finished' : run.outcome === 'running' ? 'printing now' : run.outcome
      return {
        id: run.id,
        title: [run.printer_name, at].filter(Boolean).join(' · '),
        line: [agoText(run.started_at), outcome].filter(Boolean).join(' · '),
        status: run.outcome === 'finished' ? 'Done' : run.outcome === 'running' ? 'Printing' : run.outcome === 'cancelled' ? 'Stopped' : run.outcome === 'failed' ? 'Failed' : '',
        tone: run.outcome === 'finished' ? 'ok' : run.outcome === 'running' ? 'run' : 'bad'
      }
    })
  }

  /** "Version 3 · saved from Slice today · printed 4×". */
  get headLine (): string {
    const item = this.item
    if (!item) return ''
    const n = item.printed_count ?? 0
    return [
      item.version ? `Version ${item.version}` : '',
      `${item.versioned ? 'saved from Slice' : 'from the app'} ${this.savedAgo}`.trim(),
      n ? `printed ${n}×` : 'not printed yet'
    ].filter(Boolean).join(' · ')
  }

  /** The facts that matter, from its first G-code. */
  get specs (): Array<{ label: string, value: string }> {
    const setup = this.item?.setups?.[0]
    if (!setup) return []
    return [
      { label: 'Material', value: setup.material },
      ...(setup.print_seconds ? [{ label: 'Time', value: shortDuration(setup.print_seconds) }] : []),
      ...(setup.filament_g ? [{ label: 'Filament', value: `${Math.round(setup.filament_g)} g` }] : []),
      { label: 'Nozzle', value: `${setup.nozzle_mm} mm` }
    ]
  }

  /** The Library has answered for the signed-in account (a session still being restored has none yet). */
  get libraryKnown (): boolean {
    return !!libraryState.account && libraryState.checked
  }

  /** The account, whether it answered, and whether it is on: when any changes, the print is read again. */
  get libraryKey (): string {
    return `${libraryState.account ?? ''}|${libraryState.checked}|${libraryState.enabled}`
  }

  @Watch('libraryKey')
  onLibrary () {
    if (this.libraryKnown && !this.item) this.onItemId(this.itemId)
  }

  @Watch('item.version')
  async readVersions () {
    const item = this.item
    if (!item?.versioned) return
    try {
      const versions = await printVersions(item.id)
      if (item.id === this.itemId) this.versions = versions
    } catch { /* the page shows what the item says */ }
  }

  @Watch('item', { immediate: true })
  onItemPicture (item: LibraryItem | null, before?: LibraryItem | null) {
    if (!item) return
    loadThumbnail(item)
    if (item.id !== before?.id) {
      this.readVersions()
      this.readRuns()
    }
  }

  /** It fits the printer open here as it is. */
  get readyHere (): boolean {
    return !!this.item && !!this.activeFit(this.item)?.ready
  }

  get picture (): string | null {
    return this.item ? thumbnailFor(this.item) : null
  }

  get libraryTo (): string {
    return scopedPath('/library', activeSlug())
  }

  get firstSetup (): string {
    const setup = this.item?.setups?.[0]
    return setup ? setupLine(setup) : ''
  }

  get savedAgo (): string {
    return agoText(this.item?.updated_at)
  }

  get printedTimes (): string {
    const n = this.item?.printed_count ?? 0
    return n === 0 ? 'Not printed yet' : n === 1 ? 'Printed once' : `Printed ${n} times`
  }

  get lastPrinted (): string {
    const item = this.item
    if (!item?.last_printed_at) return ''
    return agoText(item.last_printed_at)
  }

  get versionRows (): VersionRow[] {
    const current = this.item?.version ?? null
    return this.versions.map(v => ({
      number: v.number,
      when: versionWhen(v.created_at),
      line: versionLine(v),
      origin: versionOrigin(v.origin),
      current: v.number === current
    }))
  }

  restore (row: VersionRow) {
    const item = this.item
    if (!item) return
    return this.act(() => restoreVersion(item.id, row.number))
  }

  /** Re-slice on one printer: Slice on that printer, with this print. */
  reslice (row: TargetRow) {
    const item = this.item
    if (!item) return
    this.$router.push({ path: printerPath(row.slug, 'slice'), query: { library: item.id } }).catch(() => {})
  }

  /** Yours, where ‹ goes. */
  get yoursTo () {
    return { path: this.libraryTo, query: { view: 'mine' } }
  }

  /** Delete (it asks first): then back to Yours. */
  async removeHere () {
    const item = this.item
    if (!item) return
    await this.remove(item)
    if (!libraryState.items[item.id]) this.$router.push(this.yoursTo).catch(() => {})
  }
}
