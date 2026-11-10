<template>
  <section
    class="mpage"
    data-tid="library-print-page"
    :aria-label="title"
  >
    <header class="mgrid__head mpage__head">
      <div class="mgrid__titles">
        <button
          type="button"
          class="mlib-link mgrid__back"
          data-tid="library-print-back"
          @click="$emit('back')"
        >
          ‹ {{ backLabel }}
        </button>
        <h1 data-tid="library-print-title">
          {{ title }}
        </h1>
        <p
          v-if="byLine && !unavailable"
          class="mlib-muted"
          data-tid="library-print-by"
        >
          {{ byLine }}
        </p>
      </div>
      <div class="mgrid__acts">
        <button
          v-if="signedIn && !unavailable"
          type="button"
          class="mlib-btn mlib-btn--icon mpage__heart"
          :class="{ 'mpage__heart--on': !!saveId }"
          :aria-pressed="saveId ? 'true' : 'false'"
          :aria-label="saveId ? 'Saved' : 'Save'"
          :disabled="saving || !publication"
          data-tid="library-print-heart"
          @click="toggleSave"
        >
          {{ saveId ? 'Saved' : 'Save' }}
        </button>
        <button
          v-if="slug"
          type="button"
          class="mlib-btn"
          data-tid="library-print-share"
          @click="share"
        >
          Share
        </button>
        <a
          v-if="slug"
          class="mlib-btn mlib-btn--icon"
          :href="pageHref"
          target="_blank"
          rel="noopener"
          aria-label="Open on library.muon3d.com"
          title="Open on library.muon3d.com"
          data-tid="library-print-web"
        >↗</a>
      </div>
    </header>

    <p
      v-if="note"
      class="mlib-muted"
      role="status"
      data-tid="library-print-note"
    >
      {{ note }}
    </p>

    <library-state
      v-if="unavailable"
      :title="context && context.owner && context.state === 'pending' ? 'Your model is under review' : 'Model not found'"
      text="It may have been removed, made private or still be awaiting review. Only reviewed public versions can be opened here."
      action="Back to Discover"
      tid="library-print-unavailable"
      @action="$emit('back')"
    />
    <library-state
      v-else-if="error && !publication"
      kind="error"
      icon="alert"
      :title="error"
      action="Try again"
      primary
      tid="library-print-error"
      @action="read"
    />

    <template v-else>
      <div class="mpage__top">
        <!-- The gallery: one big picture, the strip under it. -->
        <div
          class="mpage__tile mpage__gallery"
          data-tid="library-print-gallery"
        >
          <div class="mpage__pic">
            <img
              v-if="shown"
              :src="shown"
              :alt="title"
            >
            <span
              v-else
              class="mlib-skeleton"
              :class="{ 'mpage__blank': !busy }"
            />
          </div>
          <div
            v-if="pictures.length > 1"
            class="mpage__strip"
            role="group"
            aria-label="Pictures"
          >
            <button
              v-for="(src, i) in pictures"
              :key="src"
              type="button"
              class="mpage__thumb"
              :class="{ 'mpage__thumb--on': i === pic }"
              :aria-pressed="i === pic ? 'true' : 'false'"
              :aria-label="`Picture ${i + 1} of ${pictures.length}`"
              @click="pic = i"
            >
              <img
                :src="src"
                alt=""
              >
            </button>
          </div>
        </div>

        <!-- Print: everything needed to print it, one primary. -->
        <div
          class="mpage__tile mpage__print"
          data-tid="library-print-tile"
        >
          <header class="mpage__tile-head">
            <frame-icon
              name="printer"
              small
            />
            <h2>Print</h2>
            <span class="mlib-grow" />
            <span
              v-if="fitLabel"
              class="mlib-badge"
              :class="{ 'mlib-badge--ok': sizeFit !== false }"
              data-tid="library-print-fits"
            >{{ fitLabel }}</span>
            <span
              v-else
              class="mlib-badge"
            >Check print size</span>
          </header>
          <dl
            v-if="specs.length"
            class="mlook__specs"
          >
            <div
              v-for="s in specs"
              :key="s.label"
            >
              <dt>{{ s.label }}</dt><dd>{{ s.value }}</dd>
            </div>
          </dl>
          <dl
            v-if="publication"
            class="mpage__profile"
            data-tid="library-print-profile"
          >
            <div
              v-for="fact in profileFacts"
              :key="fact.label"
            >
              <dt>{{ fact.label }}</dt><dd>{{ fact.value }}</dd>
            </div>
          </dl>
          <p
            v-if="!busy && publication && !print"
            class="mlib-muted"
            data-tid="library-print-nogcode"
          >
            This print has no G-code yet. Remix it to slice it for your printer.
          </p>
          <div
            v-if="colours.length || loadedLine"
            class="mlook__colours"
            data-tid="library-print-colours"
          >
            <span
              v-for="c in colours"
              :key="c"
              class="mlook__dot"
              :class="{ 'mlook__dot--on': c === loadedColour }"
              :style="{ background: c }"
              role="img"
              :aria-label="c === loadedColour ? `${colourLabel(c)}, loaded` : colourLabel(c)"
            />
            <span class="mlib-grow" />
            <span
              v-if="loadedLine"
              class="mlib-muted mlook__loaded"
            >{{ loadedLine }}</span>
          </div>
          <button
            v-if="print"
            type="button"
            class="mlib-btn mlib-btn--primary mpage__go"
            :disabled="printing === card.key"
            data-tid="library-print-print"
            @click="go"
          >
            <frame-icon
              name="printer"
              small
            />
            {{ printing === card.key ? 'Opening…' : printerName ? `Print on ${printerName}` : 'Print' }}
          </button>
          <div class="mlook__secondary">
            <label
              v-if="signedIn"
              class="mlib-btn mlib-btn--sm mlook__collect"
            >
              <select
                aria-label="Add to collection"
                data-tid="library-print-collect"
                :disabled="saving"
                @change="collect"
              >
                <option value="">Add to collection</option>
                <option value="__new">New collection…</option>
                <option
                  v-for="c in collections"
                  :key="c.id"
                  :value="c.id"
                >{{ c.name }}</option>
              </select>
            </label>
            <a
              v-if="slug"
              class="mlib-btn mlib-btn--sm"
              :href="remixLink"
              target="_blank"
              rel="noopener"
              data-tid="library-print-remix"
            >Remix ↗</a>
            <button
              v-if="signedIn && print"
              type="button"
              class="mlib-btn mlib-btn--sm"
              :aria-busy="downloading ? 'true' : 'false'"
              data-tid="library-print-download"
              @click="download"
            >
              {{ downloading ? 'Downloading…' : 'Download' }}
            </button>
          </div>
          <form
            v-if="naming"
            class="mlook__new"
            @submit.prevent="createAndAdd"
          >
            <input
              ref="newName"
              v-model="newName"
              type="text"
              maxlength="80"
              placeholder="Collection name"
              aria-label="Collection name"
              data-tid="library-print-new-name"
              @keydown.esc="naming = false"
            >
            <button
              type="submit"
              class="mlib-btn mlib-btn--sm mlib-btn--primary"
              :disabled="!newName.trim() || saving"
            >
              Create and add
            </button>
          </form>
          <p
            class="mlib-muted mpage__counts"
            data-tid="library-print-counts"
          >
            {{ countsLine }}
          </p>
        </div>
      </div>

      <div class="mpage__top">
        <div
          class="mpage__tile mpage__about"
          data-tid="library-print-about"
        >
          <header class="mpage__tile-head">
            <frame-icon
              name="info"
              small
            />
            <h2>About</h2>
          </header>
          <p
            v-if="description"
            class="mpage__desc"
          >
            {{ description }}
          </p>
          <p
            v-else-if="!busy"
            class="mlib-muted"
          >
            Its maker wrote nothing about it.
          </p>
          <div
            v-if="tags.length"
            class="mlib-chips"
          >
            <span
              v-for="t in tags"
              :key="t"
              class="mlib-chip mlib-chip--quiet"
            >#{{ t }}</span>
          </div>
        </div>

        <div
          class="mpage__tile mpage__maker"
          data-tid="library-print-maker"
        >
          <header class="mpage__tile-head">
            <frame-icon
              name="user"
              small
            />
            <h2>Maker</h2>
          </header>
          <div class="mpage__who">
            <span
              class="mpage__avatar"
              aria-hidden="true"
              data-tid="library-print-maker-face"
            ><photo-face
              :photo="makerPhoto"
              :letter="initials"
            /></span>
            <span class="mpage__who-text">
              <a
                v-if="makerHandle"
                :href="`${libraryUrl}/@${encodeURIComponent(makerHandle)}`"
                target="_blank"
                rel="noopener"
                data-tid="library-print-maker-link"
              >{{ makerName }}</a>
              <strong v-else>{{ makerName }}</strong>
              <span
                v-if="makerHandle"
                class="mlib-muted"
              >@{{ makerHandle }}</span>
            </span>
          </div>
        </div>
      </div>

      <section
        v-if="publication"
        class="mpage__tile"
        data-tid="library-print-versions"
      >
        <h2>Versions</h2>
        <p>Version {{ publication.version }} <span class="mlib-muted">Reviewed public version</span></p>
        <details v-if="context && context.owner">
          <summary>Your version history</summary>
          <p class="mlib-muted">
            Only you can see versions that have not been published.
          </p>
          <ul>
            <li
              v-for="v in context.versions"
              :key="v.number"
            >
              Version {{ v.number }} <span class="mlib-muted">{{ v.origin }}</span>
            </li>
          </ul>
        </details>
        <a
          :href="`${pageHref}#report`"
          target="_blank"
          rel="noopener"
          class="mlib-link"
          data-tid="library-print-report"
        >Report this model</a>
      </section>
      <section
        v-if="publication && signedIn"
        class="mpage__tile"
        data-tid="library-print-history"
      >
        <h2>Your print history</h2>
        <p class="mlib-muted">
          Private to your account. Other people's prints are never shown here.
        </p>
        <p
          v-if="!signedIn"
          class="mlib-muted"
        >
          Sign in to see your print history.
        </p>
        <div
          v-else-if="contextBusy"
          class="mlib-skeleton"
          aria-label="Loading your print history"
          style="min-height: 80px"
        />
        <template v-else-if="contextError">
          <p role="status">
            {{ contextError }}
          </p><button
            class="mlib-btn"
            type="button"
            @click="readContext"
          >
            Try again
          </button>
        </template>
        <ul
          v-else-if="context && context.runs.length"
          class="mpage__runs"
        >
          <li
            v-for="run in context.runs"
            :key="run.id"
          >
            <strong>{{ run.printer_name }}</strong><span>{{ new Date(run.started_at).toLocaleDateString() }} · {{ run.outcome }}</span>
          </li>
        </ul>
        <p
          v-else
          class="mlib-muted"
        >
          No prints recorded for this model yet.
        </p>
      </section>
      <library-shelf
        v-if="publication"
        id="similar"
        title="More like this"
        sub="More ideas from this category"
        :cards="similar.cards"
        :loading="similar.loading"
        :error="similar.error"
        :printer-name="printerName"
        :printing="printing"
        :see-all="false"
        @retry="readSimilar"
        @print="$emit('print-card', $event)"
        @open="$emit('open', $event)"
      />
      <library-shelf
        id="makes"
        title="Made by people"
        :sub="makes ? `${count(makes)} ${makes === 1 ? 'make' : 'makes'}, newest first` : 'Nobody has shared a make yet'"
        :cards="related.makes.cards"
        :printer-name="printerName"
        :printing="printing"
        :loading="related.makes.loading"
        :error="related.makes.error"
        :see-all="false"
        @retry="readRelated('makes')"
        @print="$emit('print-card', $event)"
        @open="$emit('open', $event)"
      >
        <p
          v-if="!related.makes.loading && !related.makes.cards.length"
          class="mlib-muted myours__empty"
          data-tid="library-shelf-makes-empty"
        >
          Printed it? Share a make on library.muon3d.com and it shows here.
        </p>
      </library-shelf>

      <library-shelf
        v-if="related.remixes.cards.length || related.remixes.error"
        id="remixes"
        title="Remixes"
        :sub="`${count(remixes || related.remixes.cards.length)} prints built on this one`"
        :cards="related.remixes.cards"
        :printer-name="printerName"
        :printing="printing"
        :loading="related.remixes.loading"
        :error="related.remixes.error"
        :see-all="false"
        @retry="readRelated('remixes')"
        @print="$emit('print-card', $event)"
        @open="$emit('open', $event)"
      />
    </template>
  </section>
</template>

<script lang="ts">
import { Component, Inject, Mixins, Prop, Watch } from 'vue-property-decorator'
import PhotoFace from '@/components/account/profile/PhotoFace.vue'
import { publicAvatarUrl } from '@/services/account/avatar'
import LibraryShelf from './LibraryShelf.vue'
import LibraryState from './LibraryState.vue'
import LibraryPublicationMixin from '@/mixins/library-publication'
import { LIBRARY_URL } from '@/services/library/discover'
import { agoText } from '@/services/library/format'
import { loadPublication, loadRelated, minutesText, publicationPrint, type ShelfCard } from '@/services/library/shelves'
import { browse, dimensionFit } from '@/services/library/catalogue'
import { libraryClient } from '@/services/library/store'
import { cloudState } from '@/services/muon-cloud/state'
import type { ModelContext } from '@/services/library/api'

interface Related { cards: ShelfCard[], loading: boolean, error: string }

/**
 * A print's own page (Library v3, page 6): the gallery, a Print tile with
 * everything needed to print it (fit, facts, colours, one primary, then
 * Add to collection, Remix and Download), About and its Maker, then what
 * people made from it and the remixes built on it, as shelves. What it does
 * with the print is mixins/library-publication.ts, shared with the quick look.
 */
@Component({ components: { LibraryShelf, LibraryState, PhotoFace } })
export default class LibraryPrintPage extends Mixins(LibraryPublicationMixin) {
  /** The card being read for Print (MuonLibrary's), for the Print button. */
  @Prop({ type: String, default: '' }) readonly printing!: string
  /** Where ‹ goes back to: "Discover", "Yours", or the print it was opened from. */
  @Prop({ type: String, default: 'Discover' }) readonly backLabel!: string

  pictureLimit = 8
  descriptionLimit = 4000
  related: { makes: Related, remixes: Related } = {
    makes: { cards: [], loading: true, error: '' },
    remixes: { cards: [], loading: true, error: '' }
  }

  private relatedReads: Record<string, number> = {}
  unavailable = false
  context: ModelContext | null = null
  contextBusy = false
  contextError = ''
  similar: Related = { cards: [], loading: false, error: '' }
  private contextRead = 0
  private similarRead = 0
  libraryUrl = LIBRARY_URL
  @Inject({ default: null }) readonly libraryCardContext!: (() => { volume: { x: number, y: number, z: number } | null }) | null

  get accountKey (): string { return this.signedIn ? cloudState.account?.id ?? '' : '' }
  @Watch('accountKey', { immediate: true })
  async readContext () {
    const read = ++this.contextRead
    this.context = null
    this.contextError = ''
    this.contextBusy = this.signedIn
    if (!this.signedIn) return
    try {
      const result = await libraryClient().modelContext(this.card.id)
      if (read === this.contextRead) this.context = result
    } catch {
      if (read === this.contextRead) this.contextError = 'Your history could not be loaded. Library must be enabled for your account.'
    } finally { if (read === this.contextRead) this.contextBusy = false }
  }

  async read () {
    this.busy = true
    this.error = ''
    this.unavailable = false
    try {
      this.publication = await loadPublication(this.card.id)
      this.print = publicationPrint(this.publication, this.card.id)
      this.readSimilar()
    } catch (error) {
      this.unavailable = (error as { status?: number }).status === 404
      this.error = error instanceof Error ? error.message : String(error)
    } finally { this.busy = false }
  }

  async readSimilar () {
    if (!this.publication?.category) return
    const read = ++this.similarRead
    this.similar.loading = true
    this.similar.error = ''
    try {
      const page = await browse(this.publication.category, '', { sort: 'popular' }, null)
      if (read === this.similarRead) this.similar.cards = page.cards.filter(c => c.id !== (this.publication?.id || this.card.id)).slice(0, 8)
    } catch { if (read === this.similarRead) this.similar.error = 'Similar models could not be loaded. Try again.' } finally { if (read === this.similarRead) this.similar.loading = false }
  }

  get profileFacts (): Array<{ label: string, value: string }> {
    const p = this.publication?.print_profile
    const setup = this.print?.item.setups[0]
    const seconds = p?.estimated_seconds || setup?.print_seconds
    const grams = p?.filament_g || setup?.filament_g
    return [
      { label: 'Licence', value: this.publication?.licence || 'Not provided' },
      { label: 'Layer height', value: p?.layer_height_mm ? `${p.layer_height_mm} mm` : 'Not provided' },
      { label: 'Supports', value: typeof p?.supports === 'boolean' ? p.supports ? 'Required' : 'Not required' : 'Not provided' },
      { label: 'Plate', value: p?.plate || 'Not provided' },
      ...(p?.material && !this.print ? [{ label: 'Material', value: p.material }] : []),
      { label: 'Estimated time', value: seconds ? minutesText(seconds) : 'Not provided' },
      { label: 'Estimated filament', value: grams ? `${grams} g` : 'Not provided' }
    ]
  }

  get sizeFit (): boolean | null {
    return dimensionFit(this.publication?.size_mm, this.libraryCardContext?.().volume ?? null)
  }

  get fitLabel (): string {
    const fit = this.sizeFit
    return fit === null ? this.madeForM1 && this.printerFits && this.printerName ? `Fits ${this.printerName}` : '' : fit ? `Fits ${this.printerName || 'this printer'} by size` : 'Does not fit as oriented'
  }

  // Each print is its own page: MuonLibrary keys it by id, so another print mounts afresh.
  mounted () {
    this.readRelated('makes')
    this.readRelated('remixes')
    // A page opened from a shelf far down starts at its top.
    ;(this.$el as HTMLElement).scrollIntoView?.({ block: 'start' })
  }

  async readRelated (kind: 'makes' | 'remixes') {
    const read = (this.relatedReads[kind] = (this.relatedReads[kind] ?? 0) + 1)
    const shelf = this.related[kind]
    shelf.loading = true
    shelf.error = ''
    try {
      const { cards } = await loadRelated(this.card.id, kind)
      if (read !== this.relatedReads[kind]) return
      shelf.cards = cards
    } catch (error) {
      if (read === this.relatedReads[kind]) shelf.error = error instanceof Error ? error.message : String(error)
    } finally {
      if (read === this.relatedReads[kind]) shelf.loading = false
    }
  }

  /** Made for M1: the card says so, or (opened by its address) its tags do. */
  get madeForM1 (): boolean {
    return this.card.m1 || (this.publication?.tags ?? []).includes('m1-ready')
  }

  get title (): string {
    return this.unavailable ? 'Model unavailable' : this.publication?.title || this.card.title
  }

  get slug (): string {
    return this.publication?.slug || this.card.slug
  }

  get pageHref (): string {
    return `${LIBRARY_URL}/p/${encodeURIComponent(this.slug)}`
  }

  get remixLink (): string {
    return `${this.pageHref}/remix`
  }

  get makerName (): string {
    const creator = this.publication?.creator
    return creator?.display_name || creator?.handle || this.card.creator || 'Someone'
  }

  get makerHandle (): string | null {
    return this.publication?.creator?.handle ?? this.card.handle ?? null
  }

  /** The maker's public photo; it 404s while their profile isn't visible, and the initials stand in. */
  get makerPhoto (): string | null {
    return publicAvatarUrl(this.publication?.creator?.avatar_url)
  }

  get initials (): string {
    const parts = this.makerName.replace(/^@/, '').split(/[\s._-]+/).filter(Boolean)
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : this.makerName.slice(0, 2)).toUpperCase()
  }

  /** "by Wren Atelier · shared 3 weeks ago · CC BY 4.0". */
  get byLine (): string {
    const when = agoText(this.publication?.created_at ?? this.card.createdAt ?? null)
    const licence = this.publication?.licence ? this.publication.licence.replace(/-/g, ' ') : ''
    return [`by ${this.makerName}`, when ? `shared ${when}` : '', licence].filter(Boolean).join(' · ')
  }

  /** "♡ 3.5k saves · 1.6k made · 4 remixes". */
  get countsLine (): string {
    return [
      `♡ ${this.count(this.saves)} ${this.saves === 1 ? 'save' : 'saves'}`,
      `${this.count(this.makes)} made`,
      `${this.count(this.remixes)} ${this.remixes === 1 ? 'remix' : 'remixes'}`
    ].join(' · ')
  }

  count (n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
  }

  /** Share: the print's page on library.muon3d.com, copied (or shared, where the device can). */
  async share () {
    if (!this.slug) return
    const url = this.pageHref
    this.note = ''
    try {
      const nav = navigator as Navigator & { share?: (data: { title: string, url: string }) => Promise<void> }
      if (nav.share && window.matchMedia?.('(pointer: coarse)').matches) {
        await nav.share({ title: this.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      this.note = 'Link copied.'
    } catch (error) {
      // Closing the share sheet is not a failure.
      if ((error as { name?: string })?.name === 'AbortError') return
      this.note = `Copy this link: ${url}`
    }
  }
}
</script>

<style lang="scss">
.mpage {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__top {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  &__tile {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: var(--m3d-radius, 18px);
    background: var(--m3d-surface-2, #1d2024);
    min-width: 0;
  }

  &__tile-head {
    display: flex;
    align-items: center;
    gap: 8px;

    h2 { margin: 0; font-size: var(--m3d-text-md, 16px); font-weight: 700; }
  }

  &__pic {
    display: grid;
    place-items: center;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 14px;
    background: var(--m3d-surface-3, #25292e);

    img { width: 100%; height: 100%; object-fit: contain; }
    .mlib-skeleton { width: 100%; height: 100%; }
  }

  &__blank { animation: none; }

  &__strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
  }

  &__thumb {
    flex: none;
    width: 64px;
    height: 64px;
    padding: 0;
    overflow: hidden;
    border: 0;
    border-radius: 10px;
    background: var(--m3d-surface-3, #25292e);
    cursor: pointer;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__thumb--on { box-shadow: inset 0 0 0 2px var(--m3d-accent); }

  &__go { width: 100%; justify-content: center; }

  &__counts { margin: 0; font-size: var(--m3d-text-sm); }

  &__desc { margin: 0; white-space: pre-line; }

  &__heart--on { color: var(--m3d-danger); }

  &__who {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__who-text {
    display: flex;
    flex-direction: column;
  }

  &__avatar {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    overflow: hidden;
    border-radius: 50%;
    background: var(--m3d-warning, #f2a33a);
    color: #111;
    font-weight: 800;
  }

  .mlib--phone & {
    &__top { grid-template-columns: minmax(0, 1fr); }
  }
}
</style>
