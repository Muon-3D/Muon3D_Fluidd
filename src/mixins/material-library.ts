import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from './state'
import type { TemperaturePreset } from '@/store/config/types'
import type { Heater } from '@/store/printer/types'
import { EventBus } from '@/eventBus'
import { printerNameParts } from '@/util/printer-name'
import { entryPresetName, materialLibrary, presetFromEntry, type LibraryEntry } from '@/services/materials/library'
import { isPinned, pinnedNames, renamePin, samePin, togglePin, MAX_PINS } from '@/services/materials/pins'

export type LibraryState = 'loading' | 'ready' | 'offline'

/**
 * The printer's materials and the library, shared by Settings › Materials,
 * the Add-a-material popup and the preset sheet: what is on the printer,
 * what is pinned, and adding a library entry as a printer-local copy.
 */
@Component({})
export default class MaterialLibraryMixin extends Mixins(StateMixin) {
  libraryEntries: LibraryEntry[] = []
  libraryState: LibraryState = 'loading'

  async loadLibrary () {
    this.libraryState = 'loading'
    try {
      this.libraryEntries = await materialLibrary.load()
      this.libraryState = 'ready'
    } catch {
      this.libraryState = 'offline'
    }
  }

  get printerLabel (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  get printerPresets (): TemperaturePreset[] {
    return this.$store.getters['config/getTempPresets'] as TemperaturePreset[]
  }

  get pins (): string[] {
    return pinnedNames(this.$store.state.config.uiSettings.general.pinnedMaterials)
  }

  get pinsFull (): boolean {
    return this.pins.length >= MAX_PINS
  }

  presetPinned (name: string): boolean {
    return isPinned(this.pins, name)
  }

  savePins (names: string[]) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.pinnedMaterials', value: names, server: true
    })
  }

  togglePresetPin (name: string) {
    const next = togglePin(this.pins, name)
    if (next) this.savePins(next)
    else EventBus.$emit(`Six materials are pinned already. Unpin one to pin ${name}.`, { type: 'warning' })
  }

  /** The printer's copy of a library entry, by the entry it came from or its name. */
  onPrinter (entry: LibraryEntry): TemperaturePreset | undefined {
    return this.printerPresets.find(p => p.libraryId === entry.id) ??
      this.printerPresets.find(p => samePin(p.name, entryPresetName(entry)))
  }

  get heaterNames (): string[] {
    return ((this.$store.getters['printer/getHeaters'] as Heater[] | undefined) ?? []).map(h => h.name)
  }

  /** A library entry as a new preset for this printer's heaters. */
  presetFor (entry: LibraryEntry): TemperaturePreset {
    const bed = this.heaterNames.includes('heater_bed') || !this.heaterNames.length ? 'heater_bed' : null
    return presetFromEntry(entry, 'extruder', bed)
  }

  /** Carbon- and glass-filled materials need a hardened nozzle: ask first. */
  async confirmAbrasive (entry: LibraryEntry): Promise<boolean> {
    if (!entry.abrasive) return true
    return await this.$confirm(
      `${entryPresetName(entry)} is filled with carbon or glass fibre, which wears a brass nozzle out quickly. Only print it with a hardened steel nozzle fitted.`,
      { title: 'This needs a hardened nozzle', buttonTrueText: 'Add it anyway' }
    ) as boolean
  }

  async addEntry (entry: LibraryEntry): Promise<boolean> {
    if (this.onPrinter(entry)) return false
    if (!(await this.confirmAbrasive(entry))) return false
    await this.$store.dispatch('config/updatePreset', this.presetFor(entry))
    EventBus.$emit(`${entryPresetName(entry)} is on ${this.printerLabel}.`, { timeout: 2500 })
    return true
  }

  /** Saved presets keep their pin when renamed. */
  async savePreset (preset: TemperaturePreset, previousName?: string) {
    await this.$store.dispatch('config/updatePreset', preset)
    if (previousName && !samePin(previousName, preset.name) && this.presetPinned(previousName)) {
      this.savePins(renamePin(this.pins, previousName, preset.name))
    }
  }

  async deletePreset (preset: TemperaturePreset) {
    await this.$store.dispatch('config/removePreset', preset)
    if (this.presetPinned(preset.name)) this.savePins(this.pins.filter(p => !samePin(p, preset.name)))
  }
}
