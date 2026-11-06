<template>
  <div
    class="mlook"
    role="dialog"
    aria-modal="true"
    :aria-label="card.title"
    data-tid="library-quick-look"
    @click.self="$emit('close')"
  >
    <div
      ref="card"
      class="mlook__card"
      tabindex="-1"
    >
      <div class="mlook__stage">
        <span class="mlib-badge mlib-badge--glass mlook__tag">Quick look</span>
        <button
          ref="close"
          type="button"
          class="mlib-btn mlib-btn--icon mlook__close"
          aria-label="Close"
          data-tid="library-quick-look-close"
          @click="$emit('close')"
        >
          <frame-icon
            name="x"
            small
          />
        </button>
        <img
          v-if="shown"
          :src="shown"
          alt=""
          class="mlook__img"
        >
        <span
          v-else
          class="mlook__img mcard__blank"
        ><frame-icon
          name="library"
          large
        /></span>
        <div
          v-if="pictures.length > 1"
          class="mlook__strip"
        >
          <button
            v-for="(src, i) in pictures"
            :key="src"
            type="button"
            class="mlook__thumb"
            :class="{ 'mlook__thumb--on': pic === i }"
            :aria-label="`Picture ${i + 1}`"
            @click="pic = i"
          >
            <img
              :src="src"
              alt=""
            >
          </button>
        </div>
      </div>

      <div class="mlook__side">
        <header class="mlook__head">
          <h2>{{ card.title }}</h2>
          <template v-if="signedIn && card.kind === 'publication'">
            <button
              type="button"
              class="mlib-btn mlib-btn--icon mlib-btn--sm mlook__heart"
              :class="{ 'mlook__heart--on': saveId }"
              :aria-pressed="saveId ? 'true' : 'false'"
              :aria-label="saveId ? `Unsave ${card.title}` : `Save ${card.title}`"
              :aria-busy="saving ? 'true' : 'false'"
              data-tid="library-quick-look-save"
              @click="toggleSave"
            >
              {{ saveId ? '♥' : '♡' }}
            </button>
          </template>
        </header>
        <p
          class="mlib-muted mlook__note"
          role="status"
          aria-live="polite"
        >
          {{ note }}
        </p>
        <div class="mcard__by">
          {{ card.creator }}
          <span
            v-if="card.m1"
            class="mlib-badge mlib-badge--ok"
          >Made for M1</span>
          <span
            v-if="card.m1 && printerFits && printerName"
            class="mlib-badge mlib-badge--ok"
            data-tid="library-quick-look-fits"
          >Fits {{ printerName }}</span>
        </div>
        <div class="mlook__stats">
          <span class="mlib-stat"><frame-icon
            name="printer"
            small
          />{{ makes }} made</span>
          <span
            v-if="remixes"
            class="mlib-stat"
          ><frame-icon
            name="copy"
            small
          />{{ remixes }} {{ remixes === 1 ? 'remix' : 'remixes' }}</span>
          <span
            v-if="saves"
            class="mlib-stat"
          >♡ {{ saves }}</span>
        </div>

        <p
          v-if="busy"
          class="mlib-muted"
          role="status"
        >
          Reading the print…
        </p>
        <p
          v-else-if="error"
          class="mlib-muted"
          role="alert"
        >
          {{ error }}
        </p>
        <template v-else>
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
          <p
            v-if="description"
            class="mlook__desc"
          >
            {{ description }}
          </p>
        </template>

        <div
          v-if="colours.length || loadedLine"
          class="mlook__colours"
          data-tid="library-quick-look-colours"
        >
          <template v-if="colours.length">
            <span class="mlib-muted">Shown in</span>
            <span
              v-for="c in colours"
              :key="c"
              class="mlook__dot"
              :class="{ 'mlook__dot--on': c === loadedColour }"
              :style="{ background: c }"
              role="img"
              :aria-label="c === loadedColour ? `${colourLabel(c)}, loaded` : colourLabel(c)"
            />
          </template>
          <span
            v-if="loadedLine"
            class="mlib-muted mlook__loaded"
            data-tid="library-quick-look-loaded"
          >{{ loadedLine }}</span>
        </div>

        <div class="mlook__acts">
          <button
            v-if="print || card.kind === 'catalogue'"
            type="button"
            class="mlib-btn mlib-btn--primary mlook__go"
            :disabled="busy"
            data-tid="library-quick-look-print"
            @click="go"
          >
            <frame-icon
              name="printer"
              small
            />
            {{ printerName ? `Print on ${printerName}` : 'Print on…' }}
          </button>
          <a
            v-else-if="!busy"
            :href="card.href"
            target="_blank"
            rel="noopener"
            class="mlib-btn mlib-btn--primary mlook__go"
            data-tid="library-quick-look-slice"
          >Slice it on library.muon3d.com ↗</a>
        </div>
        <div
          class="mlook__secondary"
          data-tid="library-quick-look-more"
        >
          <select
            v-if="signedIn && card.kind === 'publication'"
            class="mlook__collect"
            aria-label="Add to collection"
            data-tid="library-quick-look-collect"
            :aria-busy="saving ? 'true' : 'false'"
            @change="collect($event)"
          >
            <option value="">
              Add to collection
            </option>
            <option value="__new">
              New collection…
            </option>
            <option
              v-for="c in collections"
              :key="c.id"
              :value="c.id"
            >
              {{ c.name }}
            </option>
          </select>
          <a
            :href="card.href"
            target="_blank"
            rel="noopener"
            class="mlib-btn mlib-btn--sm"
            data-tid="library-quick-look-page"
          >Open page ↗</a>
          <a
            v-if="card.kind === 'publication'"
            :href="remixHref"
            target="_blank"
            rel="noopener"
            class="mlib-btn mlib-btn--sm"
            data-tid="library-quick-look-remix"
          >Remix ↗</a>
          <button
            v-if="signedIn && inCollection"
            type="button"
            class="mlib-btn mlib-btn--sm"
            :disabled="saving"
            data-tid="library-quick-look-uncollect"
            @click="uncollect"
          >
            Remove from {{ inCollection.name }}
          </button>
          <button
            v-if="signedIn && print"
            type="button"
            class="mlib-btn mlib-btn--sm"
            :aria-busy="downloading ? 'true' : 'false'"
            data-tid="library-quick-look-download"
            @click="download"
          >
            {{ downloading ? 'Downloading…' : 'Download' }}
          </button>
        </div>
        <form
          v-if="naming"
          class="mlook__new"
          data-tid="library-quick-look-new"
          @submit.prevent="createAndAdd"
        >
          <input
            ref="newName"
            v-model="newName"
            type="text"
            maxlength="80"
            placeholder="Name"
            aria-label="New collection name"
            data-tid="library-quick-look-new-name"
            @keydown.esc.stop="naming = false"
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
          v-if="!busy && !print && card.kind === 'publication' && !error"
          class="mlib-muted mlook__note"
        >
          This print has no G-code yet. Slice it for your printer, then print it from here.
        </p>

        <div
          v-if="tags.length"
          class="mlib-chips mlook__tags"
        >
          <span
            v-for="t in tags"
            :key="t"
            class="mlib-chip mlib-chip--quiet"
          >#{{ t }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { describeLibraryError, type CommunityCollection, type PublicPublication } from '@/services/library/api'
import { libraryClient } from '@/services/library/store'
import { LIBRARY_URL, safePicture } from '@/services/library/discover'
import { colourList, loadPublication, minutesText, publicationPrint, type PublicationPrint, type ShelfCard } from '@/services/library/shelves'
import { colourName, savedMaterialColour, savedMaterialName } from '@/services/control/model'

/** The big quick look: its pictures, the facts that matter, and Print. */
@Component({})
export default class LibraryQuickLook extends Vue {
  @Prop({ type: Object, required: true }) readonly card!: ShelfCard
  @Prop({ type: String, default: null }) readonly printerName!: string | null
  /** The open printer is an M1, so an M1 print fits it. */
  @Prop({ type: Boolean, default: false }) readonly printerFits!: boolean
  @Prop({ type: Boolean, default: false }) readonly signedIn!: boolean
  @Prop({ type: Array, default: () => [] }) readonly collections!: CommunityCollection[]
  /** Opened from a collection's page: Remove from it. */
  @Prop({ type: Object, default: null }) readonly inCollection!: { id: string, name: string, saveId: string } | null

  pic = 0
  busy = false
  error = ''
  publication: PublicPublication | null = null
  print: PublicationPrint | null = null
  before: Element | null = null
  /** This print's save (the heart), when you saved it. */
  saveId = ''
  /** The collection New collection… made, kept so a retry after a failed add reuses it. */
  made: { id: string, name: string } | null = null
  saving = false
  /** The heart or Add to… was used: the first lookup no longer applies. */
  touched = false
  naming = false
  newName = ''
  downloading = false
  note = ''

  created () {
    if (this.card.kind === 'publication') {
      this.read()
      if (this.signedIn) this.readSave()
    }
  }

  async readSave () {
    try {
      const { saves } = await libraryClient().savesOf([this.card.id])
      // A tap on the heart while this was read decides.
      if (this.touched) return
      this.saveId = saves.find(s => s.target.id === this.card.id)?.save_id ?? ''
    } catch {
      // No heart state: it still works, starting unsaved.
    }
  }

  /** The heart: likes are saves (Jack, 5 Nov). */
  async toggleSave () {
    if (this.saving) return
    this.touched = true
    this.saving = true
    this.note = ''
    try {
      if (this.saveId) {
        await libraryClient().unsave(this.saveId)
        this.saveId = ''
      } else {
        this.saveId = (await libraryClient().save(this.card.id)).id
      }
      this.$emit('saved')
    } catch (error) {
      this.note = describeLibraryError(error)
    } finally {
      this.saving = false
    }
  }

  async collect (event: Event) {
    const select = event.target as HTMLSelectElement
    const id = select.value
    select.value = ''
    if (id === '__new') {
      this.naming = true
      this.newName = ''
      await this.$nextTick()
      ;(this.$refs.newName as HTMLInputElement | undefined)?.focus()
      return
    }
    const collection = this.collections.find(c => c.id === id)
    if (!collection || this.saving) return
    this.touched = true
    this.saving = true
    this.note = ''
    try {
      // A collection holds saves: saved first, if it wasn't.
      if (!this.saveId) this.saveId = (await libraryClient().save(this.card.id)).id
      await libraryClient().addToCollection(collection.id, this.saveId)
      this.note = `Added to ${collection.name}.`
      this.$emit('saved')
    } catch (error) {
      this.note = describeLibraryError(error)
    } finally {
      this.saving = false
    }
  }

  // Above the rail and the app bar: out of the page's stacking context,
  // into the app's root, where its theme tokens still apply.
  mounted () {
    this.before = document.activeElement;
    (document.querySelector('[data-app]') ?? document.body).appendChild(this.$el)
    // Focus moves into the quick look: its Close where it shows (phone),
    // else the dialog itself, so Escape and Tab start inside it.
    const close = this.$refs.close as HTMLElement | undefined
    const target = close && close.offsetParent !== null ? close : this.$refs.card as HTMLElement | undefined
    target?.focus()
    document.addEventListener('keydown', this.onKey)
  }

  beforeDestroy () {
    document.removeEventListener('keydown', this.onKey)
    this.$el.remove();
    (this.before as HTMLElement | null)?.focus?.()
  }

  onKey (event: KeyboardEvent) {
    // A dialog opened over the quick look (Print on…) takes its own Escape.
    const inside = this.$el.contains(document.activeElement)
    if (event.key === 'Escape' && (inside || document.activeElement === document.body)) {
      this.$emit('close')
      return
    }
    if (event.key !== 'Tab' || (!inside && document.activeElement !== document.body)) return
    const focusable = Array.from(this.$el.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]'))
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    // Focus fell to the page (a control went disabled): back into the quick look.
    if (!inside) {
      event.preventDefault()
      first.focus()
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  async read () {
    this.busy = true
    this.error = ''
    try {
      this.publication = await loadPublication(this.card.id)
      this.print = publicationPrint(this.publication, this.card.id)
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error)
    } finally {
      this.busy = false
    }
  }

  /** New collection… in Add to collection: make it, then add this print (saved first). */
  async createAndAdd () {
    const name = this.newName.trim()
    if (!name || this.saving) return
    this.touched = true
    this.saving = true
    this.note = ''
    let adding = false
    try {
      if (!this.made || this.made.name !== name) this.made = await libraryClient().createCollection(name)
      const made = this.made
      if (!this.saveId) this.saveId = (await libraryClient().save(this.card.id)).id
      adding = true
      await libraryClient().addToCollection(made.id, this.saveId)
      // Added: a later New collection… with the same name makes another.
      this.made = null
      this.naming = false
      this.note = `Added to ${made.name}.`
      this.$emit('saved')
    } catch (error) {
      // The collection is gone (deleted elsewhere): the retry makes it again.
      if (adding && (error as { status?: number }).status === 404) this.made = null
      this.note = describeLibraryError(error)
    } finally {
      this.saving = false
    }
  }

  /** Take it out of the collection its page opened it from (it stays saved). */
  async uncollect () {
    const c = this.inCollection
    if (!c || this.saving) return
    this.saving = true
    this.note = ''
    try {
      await libraryClient().removeFromCollection(c.id, c.saveId)
      this.$emit('removed', c.id)
    } catch (error) {
      this.note = describeLibraryError(error)
    } finally {
      this.saving = false
    }
  }

  /** Download its G-code to this computer, checked against what its maker published. */
  async download () {
    const item = this.print?.item
    const setup = item?.setups[0]
    if (!item || !setup || this.downloading) return
    this.downloading = true
    this.note = ''
    try {
      // Lazy: print-on reaches the store and the socket, which the quick look needs only to download.
      const { downloadSharedGcode, gcodeFileName, saveToComputer } = await import('@/services/library/print-on')
      const { bytes } = await downloadSharedGcode(item.id, setup.file_id, item.shared.expected[setup.file_id])
      saveToComputer(bytes, gcodeFileName(item), 'text/x-gcode')
    } catch (error) {
      this.note = describeLibraryError(error)
    } finally {
      this.downloading = false
    }
  }

  get remixHref (): string {
    return `${LIBRARY_URL}/p/${encodeURIComponent(this.card.slug)}/remix`
  }

  /** Every colour its pictures show it in (#rrggbb). */
  get colours (): string[] {
    const fromPage = colourList(this.publication?.colours)
    return fromPage.length ? fromPage : (this.card.colours ?? [])
  }

  /** What the open printer has loaded, from its save_variables (the panel, Overview and Control set them). */
  get loaded (): { material: string | null, colour: string | null } {
    if (!this.printerName) return { material: null, colour: null }
    const variables = this.$store?.state?.printer?.printer?.save_variables?.variables
    return { material: savedMaterialName(variables), colour: savedMaterialColour(variables)?.toLowerCase() ?? null }
  }

  get loadedColour (): string | null {
    return this.loaded.colour
  }

  /** "Boxwood has Teal PLA loaded". */
  get loadedLine (): string {
    const { material, colour } = this.loaded
    if (!this.printerName || (!material && !colour)) return ''
    const name = colour ? colourName(colour) : ''
    // A colour that is not a preset has no name: say the material, or that it is a custom colour.
    const what = name === 'Custom colour'
      ? (material ?? 'a custom colour')
      : [name, material ?? ''].filter(Boolean).join(' ')
    return `${this.printerName} has ${what} loaded`
  }

  colourLabel (colour: string): string {
    const name = colourName(colour)
    return name === 'Custom colour' ? colour : name
  }

  get pictures (): string[] {
    const images = (this.publication?.images ?? [])
      .map(image => safePicture(image.url))
      .filter((url): url is string => !!url)
    const all = [this.card.picture, ...images].filter((url): url is string => !!url)
    return all.filter((url, i) => all.indexOf(url) === i).slice(0, 6)
  }

  get shown (): string | null { return this.pictures[this.pic] ?? null }
  get makes (): number { return this.publication?.counts?.makes ?? this.card.makes }
  get remixes (): number { return this.publication?.counts?.remixes ?? this.card.remixes }
  get saves (): number { return this.publication?.counts?.saves ?? this.card.saves }
  get tags (): string[] { return (this.publication?.tags ?? this.card.tags).slice(0, 6) }
  get description (): string { return (this.publication?.description ?? '').trim().slice(0, 400) }

  get specs (): Array<{ label: string, value: string }> {
    const setup = this.print?.item.setups[0]
    if (!setup) return this.card.facts ? [{ label: 'Print', value: this.card.facts }] : []
    return [
      { label: 'Printer', value: setup.printer_model },
      { label: 'Material', value: setup.material },
      { label: 'Nozzle', value: `${setup.nozzle_mm} mm` },
      ...(setup.print_seconds ? [{ label: 'Time', value: minutesText(setup.print_seconds) }] : []),
      ...(setup.filament_g ? [{ label: 'Filament', value: `${Math.round(setup.filament_g)} g` }] : []),
      ...(this.print && this.print.item.setups.length > 1 ? [{ label: 'G-codes', value: String(this.print.item.setups.length) }] : [])
    ]
  }

  go () {
    if (this.card.kind === 'catalogue') {
      window.open(this.card.href, '_blank', 'noopener')
      return
    }
    if (!this.print) return
    this.$emit('print', this.card, this.print)
    this.$emit('close')
  }
}
</script>
