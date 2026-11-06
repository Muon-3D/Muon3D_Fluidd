<template>
  <div
    class="library"
    :class="{ 'library--phone': isMobileViewport }"
    data-tid="library-page"
  >
    <muon-library
      context="page"
      :printer-id="activePrinter ? activePrinter.id : null"
      :printer-name="activePrinter ? activePrinter.name : null"
      :printer-model="activePrinter && activePrinter.model ? activePrinter.model : 'M1'"
      :tab="view === 'mine' ? 'yours' : 'discover'"
      :continue-item="signedIn && state.synced && prints.length ? prints[0] : null"
      :signed-in="signedIn"
      :grid="grid"
      :search="searchQuery"
      :own-ready="state.checked && state.enabled"
      :collection="collection"
      @update:tab="setView"
      @update:grid="setGrid"
      @grid-back="gridBack"
      @update:collection="openCollection"
      @collection-back="gridBack"
      @open-search="openSearch"
      @print="onLibraryPrint"
      @print-item="printOn($event, activePrinter ? activePrinter.id : null)"
      @print-run="onPrintRun"
      @open-item="openItem"
      @slice-item="openInSlice"
      @go-slice="goSlice"
    >
      <template #yours>
        <section
          v-if="signedIn && state.error"
          class="lib-empty lib-surface library__state"
          role="alert"
        >
          <h2>Your Library didn't answer</h2>
          <p>{{ state.error }}</p>
          <div class="lib-empty__actions">
            <button
              type="button"
              class="lib-btn"
              @click="refresh"
            >
              Try again
            </button>
          </div>
        </section>

        <!-- Signed out: Yours is the account's (a saved session still being restored reads as signed in). -->
        <section
          v-if="!mineShown"
          class="lib-empty lib-surface library__state"
          data-tid="library-signed-out"
        >
          <span class="lib-empty__icon lib-empty__icon--accent"><frame-icon
            name="library"
            large
          /></span>
          <h2>Sign in to see yours</h2>
          <p>What you slice, save and print is kept in your Muon3D account, on every printer you use.</p>
          <div class="lib-empty__actions">
            <button
              type="button"
              class="lib-btn lib-btn--pri"
              data-tid="library-sign-in"
              @click="accountDialog = true"
            >
              Sign in
            </button>
          </div>
        </section>

        <!-- Reading it, or turning it on for you (KAN-735: no turn-on step). -->
        <section
          v-else-if="!state.error && (!signedIn || !state.checked || consentDue || (state.enabled && !state.synced))"
          class="lib-empty lib-surface library__state"
          data-tid="library-reading"
        >
          <p>
            Reading your Library…
          </p>
        </section>

        <!-- Off and not turned on for you: a deletion is pending, the promise is unknown, or consent failed. -->
        <section
          v-else-if="state.checked && !state.enabled && !state.error"
          class="lib-empty lib-surface library__state"
          data-tid="library-off"
        >
          <span class="lib-empty__icon lib-empty__icon--accent"><frame-icon
            name="library"
            large
          /></span>
          <h2>Your Library is off</h2>
          <p>
            Turn it on and we keep what you save: the project, the sliced file and a picture, in your account and nowhere
            else. You can download or delete all of it whenever you like.
          </p>
          <p
            v-if="purgeDay"
            class="library__warn"
          >
            What was in it is deleted on {{ purgeDay }} unless you turn it back on.
          </p>
          <div class="lib-empty__actions">
            <button
              type="button"
              class="lib-btn lib-btn--pri"
              :disabled="busy || !promise"
              data-tid="library-turn-on"
              @click="turnOn"
            >
              Turn it on
            </button>
            <a
              class="lib-btn lib-btn--ghost"
              :href="promiseUrl"
              target="_blank"
              rel="noopener"
            >What we keep</a>
          </div>
          <p v-if="!promise">
            The Library has a promise this version of Control cannot show. Update Control before turning it on.
          </p>
        </section>
      </template>
    </muon-library>

    <p
      v-if="error"
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
import type { GridSource } from '@/services/library/shelves'
import type { Dictionary } from 'vue-router/types/router'
import PrintOnDialog from '@/components/library/PrintOnDialog.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'
import { describeLibraryError, type LibraryItem, type LibraryRun } from '@/services/library/api'
import { libraryState, turnLibraryOn } from '@/services/library/store'
import { YOURS_GRIDS, type YoursGridSource } from '@/components/library/v2/LibraryYoursGrid.vue'

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
@Component({ components: { MuonLibrary, PrintOnDialog, FileNameDialog, CloudAccountDialog } })
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

  /** A collection tile: its page, pushed so Back returns to Yours. */
  openCollection (id: string) {
    const query: Dictionary<string | (string | null)[]> = { ...this.$route.query, view: 'mine', collection: id }
    delete query.shelf
    delete query.q
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
    if (view === this.view && !this.grid) return
    // A place starts at its top: no See all or search left in the address.
    const query: Dictionary<string | (string | null)[]> = { ...this.$route.query, view }
    delete query.shelf
    delete query.q
    delete query.collection
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

  .library__state {
    max-width: 560px;
    width: 100%;
    margin: 24px auto 0;
  }

  .library__warn {
    color: var(--m3d-warning) !important;
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
