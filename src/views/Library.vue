<template>
  <div
    class="library"
    :class="{ 'library--phone': isMobileViewport }"
    data-tid="library-page"
  >
    <!-- Share a print (v3 page 11), in place of the Library while it is open. -->
    <library-share-page
      v-if="shareId !== null && signedIn && state.enabled"
      :items="everything"
      :item-id="shareId === 'new' ? '' : shareId"
      @back="shareBack"
    />

    <muon-library
      v-else
      context="page"
      :printer-id="activePrinter ? activePrinter.id : null"
      :printer-name="activePrinter ? activePrinter.name : null"
      :printer-model="activePrinter && activePrinter.model ? activePrinter.model : 'M1'"
      :tab="view === 'mine' ? 'yours' : 'discover'"
      :continue-recent="continueRecent"
      :continue-item="continueItem"
      :signed-in="signedIn"
      :settings-to="settingsTo"
      :grid="grid"
      :search="searchQuery"
      :own-ready="state.checked && state.enabled"
      :collection="collection"
      :print-id="printId"
      :auto-print="autoPrint"
      @auto-printed="onAutoPrinted"
      @update:tab="setView"
      @update:grid="setGrid"
      @grid-back="gridBack"
      @update:collection="openCollection"
      @collection-back="gridBack"
      @collection-deleted="collectionDeleted"
      @update:print="openPrint"
      @share="openShare('new')"
      @print-back="printBack"
      @open-search="openSearch"
      @sign-in="accountDialog = true"
      @print="onLibraryPrint"
      @print-item="printOn($event, activePrinter ? activePrinter.id : null)"
      @print-run="onPrintRun"
      @open-item="openItem"
      @open-recent="openRecent"
      @slice-item="openInSlice"
      @go-slice="goSlice"
    >
      <template #yours>
        <!-- Every state is one tile in the same place (Library v3, page 12): an icon, one line, one more, at most one button. -->
        <library-state
          v-if="!mineShown"
          icon="library"
          title="Sign in to see yours"
          text="What you slice, save and print stays in your Muon3D account, on every printer."
          action="Sign in"
          primary
          tid="library-signed-out"
          @action="accountDialog = true"
        />

        <template v-else>
          <!-- Something you did didn't work (a delete, turning it on): said here, not at the foot of the page. -->
          <library-state
            v-if="error"
            kind="callout"
            :title="error"
            tid="library-action-error"
          />

          <!-- It didn't answer before anything was read: the whole of Yours says so, with Try again. -->
          <library-state
            v-if="signedIn && state.error && !state.synced && !deleting"
            kind="error"
            icon="alert"
            title="Your Library didn't answer"
            :text="state.error"
            action="Try again"
            primary
            tid="library-error"
            @action="refresh"
          />
          <!-- It stopped answering later: what is shown stays, with Retry above it. -->
          <library-state
            v-else-if="signedIn && state.error && !deleting"
            kind="callout"
            :title="`Your Library didn't answer: ${state.error}`"
            action="Retry"
            tid="library-error"
            @action="refresh"
          />

          <!-- The one real "off": a deletion is pending. -->
          <library-state
            v-else-if="state.checked && !state.enabled && purgeDay"
            icon="lock"
            title="Your Library is being deleted"
            :text="`Everything in it goes on ${purgeDay}. Turn it back on before then to keep it.`"
            :action="promise ? 'Keep my Library' : ''"
            primary
            tid="library-off"
            @action="turnOnOnce"
          />
          <!-- Off for another reason (turning it on for you failed, or this Control can't show the promise). -->
          <library-state
            v-else-if="state.checked && !state.enabled && !consentDue"
            icon="library"
            :title="offTitle"
            :text="offText"
            :action="promise ? 'Turn it on' : ''"
            primary
            tid="library-off"
            @action="turnOnOnce"
          />

          <!-- Being read, or being turned on for you (KAN-735): skeletons in the final layout, not a line of text. -->
          <div
            v-else-if="!state.checked || consentDue"
            class="mlib-shelf"
            role="status"
            data-tid="library-reading"
          >
            <span class="mlib-hidden">Reading your Library</span>
            <div class="mlib-shelf__row">
              <span
                v-for="n in 5"
                :key="n"
                class="mlib-skeleton-card"
              >
                <span class="mlib-skeleton" />
                <span class="mlib-skeleton mlib-skeleton--line" />
              </span>
            </div>
          </div>
        </template>
      </template>
    </muon-library>

    <!-- On Yours an action's error is a callout in the page (above); elsewhere it shows here. -->
    <p
      v-if="error && !errorOnYours"
      class="library__note library__note--error"
      role="alert"
    >
      {{ error }}
    </p>

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />

    <print-on-dialog
      :item="printing"
      :prefer="preferPrinter"
      @close="printing = null"
    />

    <file-name-dialog
      v-if="naming"
      :value="true"
      :title="naming.mode === 'rename' ? 'Rename' : 'Save as copy'"
      :label="naming.mode === 'rename' ? 'Name' : 'Name of the copy'"
      :name="naming.mode === 'rename' ? naming.item.name : `${naming.item.name} copy`"
      @input="!$event && (naming = null)"
      @save="saveName"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Mixins, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import LibraryPageMixin from '@/mixins/library-page'
import { storedToken } from '@/services/muon-cloud/api'
import { cloudState } from '@/services/muon-cloud/state'
import MuonLibrary, { type LibraryPrintRequest, type LibraryTab } from '@/components/library/v2/MuonLibrary.vue'
import LibrarySharePage from '@/components/library/v2/LibrarySharePage.vue'
import LibraryState from '@/components/library/v2/LibraryState.vue'
import type { GridSource } from '@/services/library/shelves'
import type { Dictionary } from 'vue-router/types/router'
import PrintOnDialog from '@/components/library/PrintOnDialog.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'
import { describeLibraryError, type LibraryItem, type LibraryRun } from '@/services/library/api'
import { libraryState, turnLibraryOn } from '@/services/library/store'
import { YOURS_GRIDS, type YoursGridSource } from '@/components/library/v2/LibraryYoursGrid.vue'
import { readRecents, type RecentEntry } from '@/services/library/recents'
import { autoPrintHandled, markAutoPrintHandled } from '@/services/library/auto-print'

/** Automatic consent, by account: asked once per app session, whichever page instance asked (KAN-735). */
export const autoConsent = Vue.observable({ asked: {} as Record<string, 'pending' | 'done' | 'failed'> })

/**
 * The Library page (`/library`): Discover, or Yours (Library v3, page 2) —
 * Continue, Collections, then your Sliced, Printed, Saved, Shared and Designs
 * shelves, each with See all. MuonLibrary draws both; this page keeps the
 * place in the address, says what to do when Yours cannot show (signed out,
 * off, reading, an error), and does what a card asks: Print on…, Print again,
 * Slice, or the print's own page.
 */
@Component({ components: { MuonLibrary, LibrarySharePage, LibraryState, PrintOnDialog, FileNameDialog, CloudAccountDialog } })
export default class Library extends Mixins(LibraryPageMixin, BrowserMixin) {
  /**
   * Discover or your own Library: as the address says, else yours once you're
   * signed in. While a saved session is still being restored it is yours too,
   * so a signed-in start doesn't flash Discover first.
   */
  get view (): 'discover' | 'mine' {
    const asked = this.$route?.query.view
    if (asked === 'discover' || asked === 'mine') return asked
    return this.mineShown ? 'mine' : 'discover'
  }

  /**
   * A See all page or search results, from the address (`?shelf=popular`,
   * `?shelf=search&q=…`), or a Yours shelf's See all (`?view=mine&shelf=sliced`).
   */
  get grid (): GridSource | YoursGridSource | null {
    const shelf = this.$route?.query.shelf
    if (typeof shelf !== 'string') return null
    if (this.view === 'mine') return YOURS_GRIDS.includes(shelf as YoursGridSource) ? shelf as YoursGridSource : null
    return shelf === 'popular' || shelf === 'm1' || shelf === 'new' || shelf === 'search' ? shelf : null
  }

  /** A collection's page on Yours (`?view=mine&collection=<id>`). */
  get collection (): string | null {
    const id = this.$route?.query.collection
    return this.view === 'mine' && typeof id === 'string' && id ? id : null
  }

  /** Share a print (`?share=<id>`, or `new` to choose one), over Yours. */
  get shareId (): string | null {
    const id = this.$route?.query.share
    return typeof id === 'string' && id ? id : null
  }

  shareOpenedHere = false

  openShare (id: string) {
    this.shareOpenedHere = true
    this.$router.push({ query: { view: 'mine', share: id } }).catch(() => {})
  }

  /** ‹ Yours on Share a print: back where it was opened, else Yours. */
  shareBack () {
    // From one of your prints (its Share…): to that print's page, whatever history holds.
    if (this.$route.query.from === 'print' && this.shareId && this.shareId !== 'new') {
      this.$router.replace(this.printTo({ id: this.shareId } as LibraryItem)).catch(() => {})
      return
    }
    // Opened here: back where it was.
    if (this.shareOpenedHere) {
      this.shareOpenedHere = false
      this.$router.back()
      return
    }
    this.$router.replace({ query: { view: 'mine' } }).catch(() => {})
  }

  /** The Library is being deleted: that is what Yours says, whatever else did not answer. */
  get deleting (): boolean {
    return libraryState.checked && !libraryState.enabled && !!this.purgeDay
  }

  /**
   * The Share page replaces the Library only for a signed-in person whose
   * Library is on; otherwise `?share=` is ignored and Yours shows.
   */
  get shareShown (): boolean {
    return this.shareId !== null && this.signedIn && libraryState.enabled
  }

  /**
   * Yours' home (the callout's place) is on screen, as MuonLibrary draws it:
   * not Share, a print's page (any state), a collection's page or a See all
   * (both signed in only), and signed in, not the signed-out tile.
   */
  get yoursHome (): boolean {
    if (this.view !== 'mine' || this.shareShown || this.printId) return false
    if (this.collection && this.signedIn) return false
    if (this.grid && this.signedIn && ((libraryState.checked && libraryState.enabled) || this.grid === 'saved')) return false
    return this.mineShown
  }

  /** The action's error is the callout on Yours' home; everywhere else it is the foot note, so never twice and never lost. */
  get errorOnYours (): boolean {
    return this.yoursHome
  }

  /** Signing out takes an old error with it (the next person has not done anything yet). */
  @Watch('signedIn')
  onSignedIn (signedIn: boolean) {
    if (!signedIn) this.error = ''
  }

  /** Why the Library is off, said as it is: turned off on purpose, or turning it on for you failed. */
  get offTitle (): string {
    if (!this.promise) return 'Update Control to use your Library'
    return libraryState.withdrawn ? 'Your Library is off' : 'Your Library isn\'t on yet'
  }

  get offText (): string {
    if (!this.promise) return 'Your Library has a promise this version of Control cannot show.'
    return libraryState.withdrawn
      ? 'Turn it on to keep what you slice and print, in your account and on every printer.'
      : 'It turns on for you when you sign in, and this time it didn\'t. Turn it on to keep what you slice and print.'
  }

  /** Keep my Library / Turn it on: a second click while the first is working does nothing. */
  turnOnOnce () {
    if (this.busy) return
    return this.turnOn()
  }

  /** A print's own page (`?print=<id>`), on Discover or Yours. */
  get printId (): string | null {
    const id = this.$route?.query.print
    return typeof id === 'string' && id ? id : null
  }

  /**
   * The print this page was opened on by its address (the site's Print
   * link), until Print on… has opened for it. Only that arrival opens it: a
   * print opened from inside Control, or one whose history entry already
   * opened it (a reload, Back), does not.
   */
  arrivedPrint: string | null = null

  created () {
    const id = this.printId
    this.arrivedPrint = id && !autoPrintHandled(id) ? id : null
  }

  get autoPrint (): boolean {
    return !!this.arrivedPrint && this.printId === this.arrivedPrint
  }

  /** The print's page opened Print on… for the address: once. */
  onAutoPrinted () {
    if (this.arrivedPrint) markAutoPrintHandled(this.arrivedPrint)
    this.arrivedPrint = null
  }

  /** Off the print's pages (Back, the switch, a grid, a collection): nothing of ours to go back through. */
  @Watch('printId')
  onPrintId (id: string | null) {
    if (!id) this.printDepth = 0
    // A different print than the one the address arrived on (opened here, or Back to one): never an arrival, so a reload of this entry opens nothing.
    if (id !== this.arrivedPrint) this.arrivedPrint = null
    if (id && !this.arrivedPrint) markAutoPrintHandled(id)
  }

  /**
   * How many print's pages this page pushed, one on another (a make opened
   * from a print's page is one more): ‹ goes back through them, then to the
   * place under them. Leaving the print's pages any other way starts it again.
   */
  printDepth = 0

  /** Open page: the print's page, pushed so Back returns to where it was opened. */
  openPrint (id: string) {
    // The print already open adds no page, so nothing to go back through.
    if (id === this.printId) return
    this.$router.push({ query: { ...this.$route.query, print: id } })
      .then(() => { this.printDepth++ })
      .catch(() => {})
  }

  /** ‹ on a print's page: back where it came from, or (opened by its address) to the place under it. */
  printBack () {
    if (this.printDepth > 0) {
      this.printDepth--
      this.$router.back()
      return
    }
    const query: Dictionary<string | (string | null)[]> = { ...this.$route.query }
    delete query.print
    this.$router.replace({ query }).catch(() => {})
  }

  /** Deleted on its page: Yours replaces it in history, so Back cannot return to it. */
  collectionDeleted () {
    const query: Dictionary<string | (string | null)[]> = { ...this.$route.query, view: 'mine' }
    delete query.collection
    if (this.gridOpenedHere) {
      this.gridOpenedHere = false
      this.$router.back()
      return
    }
    this.$router.replace({ query }).catch(() => {})
  }

  /** A collection tile: its page, pushed so Back returns to Yours. */
  openCollection (id: string) {
    const query: Dictionary<string | (string | null)[]> = { ...this.$route.query, view: 'mine', collection: id }
    delete query.shelf
    delete query.q
    delete query.print
    this.gridOpenedHere = true
    this.$router.push({ query }).catch(() => {})
  }

  get searchQuery (): string {
    const q = this.$route?.query.q
    return typeof q === 'string' ? q : ''
  }

  /** Whether this page opened the grid itself (then ‹ Discover is the browser's Back). */
  gridOpenedHere = false

  /**
   * A grid in the address. Opening one from Discover is pushed, so Back
   * returns to the shelves; changing the grid's sort replaces, so it adds
   * no history.
   */
  setGrid (grid: GridSource | YoursGridSource | null, q?: string) {
    const rest = { ...this.$route.query }
    delete rest.shelf
    delete rest.q
    delete rest.collection
    delete rest.print
    delete rest.category
    const view = YOURS_GRIDS.includes(grid as YoursGridSource) ? 'mine' : 'discover'
    const query = grid ? { ...rest, view, shelf: grid, ...(grid === 'search' ? { q: q ?? this.searchQuery } : {}) } : rest
    if (this.grid && grid) {
      this.$router.replace({ query }).catch(() => {})
      return
    }
    if (grid) this.gridOpenedHere = true
    this.$router.push({ query }).catch(() => {})
  }

  /** A search, from Discover or the results page itself. */
  openSearch (q: string) {
    this.setGrid('search', q)
  }

  /** ‹ Discover: back where it came from, or Discover when the grid was opened by its address. */
  gridBack () {
    if (this.gridOpenedHere) {
      this.gridOpenedHere = false
      this.$router.back()
      return
    }
    this.setGrid(null)
  }

  /** Discover or Yours, kept in the address so Back and a shared link land on it. */
  setView (tab: LibraryTab) {
    const view = tab === 'yours' ? 'mine' : 'discover'
    if (view === this.view && !this.grid && !this.collection && !this.printId) return
    // A place starts at its top: no See all or search left in the address.
    const query: Dictionary<string | (string | null)[]> = { ...this.$route.query, view }
    delete query.shelf
    delete query.q
    delete query.collection
    delete query.print
    this.$router.replace({ query }).catch(() => {})
  }

  /**
   * Print from a Discover card (Library v2): a public print with a G-code
   * goes to Print on…, which checks each printer and the file's checksum.
   */
  onLibraryPrint (request: LibraryPrintRequest) {
    if (!request.print) return
    // The G-code comes over the share route, which reads as an account.
    if (!this.signedIn) {
      this.accountDialog = true
      return
    }
    this.printOn(request.print.item as unknown as LibraryItem, request.printerId)
  }

  /** Your Library is there only signed in (or while a saved session is restored); signed out it's Discover alone (KAN-735). */
  get mineShown (): boolean {
    return this.signedIn || (!cloudState.ready && !!storedToken())
  }

  /**
   * The Library is always on (KAN-735): signed in with it off, consent is
   * recorded with the promise this Control shows, once per account. Not when
   * it was turned off (deletion pending or not), the service's promise is one
   * this Control can't show, or an attempt already failed: those keep the off
   * panel. True only while the attempt is still to come or under way.
   */
  get consentDue (): boolean {
    const account = libraryState.account
    const asked = account ? autoConsent.asked[account] : undefined
    return this.signedIn && libraryState.checked && !libraryState.enabled && !libraryState.error &&
      !libraryState.purgeAfter && !libraryState.withdrawn && this.promise !== null &&
      (asked === undefined || asked === 'pending')
  }

  @Watch('consentDue', { immediate: true })
  async onConsentDue (due: boolean) {
    const account = libraryState.account
    const promise = this.promise
    if (!due || !promise || !account || autoConsent.asked[account] !== undefined) return
    Vue.set(autoConsent.asked, account, 'pending')
    try {
      await turnLibraryOn(promise.version)
      Vue.set(autoConsent.asked, account, 'done')
    } catch (error) {
      Vue.set(autoConsent.asked, account, 'failed')
      this.error = describeLibraryError(error)
    }
  }

  /** Only a run whose print is still in the Library, and whose version is known, can be printed again. */
  canPrintAgain (run: LibraryRun): boolean {
    return !!run.item_id && run.in_library && (run.version ?? run.item?.version ?? null) !== null
  }

  printAgain (run: LibraryRun) {
    return { path: '/print', query: { library: run.item_id as string, version: String(run.version ?? run.item?.version) } }
  }

  /** Printed's Print again: the print hand-off, for that version. */
  onPrintRun (run: LibraryRun) {
    if (this.canPrintAgain(run)) this.$router.push(this.printAgain(run)).catch(() => {})
  }

  /**
   * Continue is what this device opened last (kept in this browser, not in the
   * account). One of your own prints counts only signed in, and not once the
   * synced Library no longer has it; a public model counts whoever is here.
   */
  get continueRecent (): RecentEntry | null {
    return readRecents().find(entry => entry.kind === 'publication' ||
      // A print of yours shows only once this account's list is read and holds it:
      // never while it loads, after a failed read, or with Library saving off.
      (this.signedIn && this.state.synced && !!this.everything.find(item => item.id === entry.id))) ?? null
  }

  /** The print behind Continue when it is one of yours, for Print again. */
  get continueItem (): LibraryItem | null {
    const entry = this.continueRecent
    return entry && entry.kind === 'own' ? this.prints.find(item => item.id === entry.id) ?? null : null
  }

  /** Continue's Open: one of yours goes to its own page, a public model to its page here. */
  openRecent (entry: RecentEntry) {
    if (entry.kind === 'own') this.$router.push(this.printTo({ id: entry.id } as LibraryItem)).catch(() => {})
    else this.openPrint(entry.id)
  }

  /** A Yours card's picture or Continue's Open: the print's own page. */
  openItem (item: LibraryItem) {
    this.$router.push(this.printTo(item)).catch(() => {})
  }

  goSlice () {
    this.$router.push('/slice').catch(() => {})
  }
}
</script>

<style lang="scss" scoped>
  .library {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1440px;
    margin: 0 auto;
    padding: 6px 12px 40px;
    color: var(--m3d-text);
  }

  .library--phone {
    gap: 16px;
    padding: 4px 0 24px;
  }

  .library__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .library__note--error {
    color: var(--m3d-danger);
  }
</style>
