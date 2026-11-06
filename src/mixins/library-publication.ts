import { Component, Prop, Vue } from 'vue-property-decorator'
import { describeLibraryError, type CommunityCollection, type PublicPublication } from '@/services/library/api'
import { libraryClient } from '@/services/library/store'
import { LIBRARY_URL, safePicture } from '@/services/library/discover'
import { colourList, loadPublication, minutesText, publicationPrint, type PublicationPrint, type ShelfCard } from '@/services/library/shelves'
import { colourName, savedMaterialColour, savedMaterialName } from '@/services/control/model'

/**
 * One public print, as the quick look and a print's page show it (Library
 * v3): read it, its heart (likes are saves), Add to collection (or a new
 * one), Remove from the collection it was opened from, Download, Remix,
 * its colours with the one the open printer has loaded, and its facts.
 * The look is each component's own.
 */
@Component({})
export default class LibraryPublicationMixin extends Vue {
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

  /** How many pictures to show: the quick look six, a print's page more. */
  pictureLimit = 6

  get pictures (): string[] {
    const images = (this.publication?.images ?? [])
      .map(image => safePicture(image.url))
      .filter((url): url is string => !!url)
    const all = [this.card.picture, ...images].filter((url): url is string => !!url)
    return all.filter((url, i) => all.indexOf(url) === i).slice(0, this.pictureLimit)
  }

  get shown (): string | null { return this.pictures[this.pic] ?? null }
  get makes (): number { return this.publication?.counts?.makes ?? this.card.makes }
  get remixes (): number { return this.publication?.counts?.remixes ?? this.card.remixes }
  get saves (): number { return this.publication?.counts?.saves ?? this.card.saves }
  get tags (): string[] { return (this.publication?.tags ?? this.card.tags).slice(0, 6) }
  /** Its description, cut to `descriptionLimit` (the quick look's is short). */
  descriptionLimit = 400
  get description (): string { return (this.publication?.description ?? '').trim().slice(0, this.descriptionLimit) }

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
