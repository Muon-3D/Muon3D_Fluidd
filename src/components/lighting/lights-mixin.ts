import { Component, Mixins, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import { lightsStore, type LightsStore } from '@/services/control/lights-store'
import {
  DEFAULT_LIGHT,
  effectFor,
  type EffectInfo,
  type LightPreset,
  type LightState,
  type LightsCapabilities
} from '@/services/control/lights'

/**
 * What the Lighting screen and its widgets share: the lights as the printer
 * reports them (or the change just made), what the backend can do, and the
 * changes. All I/O is in the services; nothing here talks to the printer.
 */
@Component
export default class LightsMixin extends Mixins(ControlMixin) {
  get lights (): LightsStore { return lightsStore }

  get caps (): LightsCapabilities { return lightsStore.backend.capabilities }

  get printerObjects (): Record<string, any> { return this.$store.state.printer.printer }

  /** The LED_MODE macro's variables: what a report changes. */
  get ledReport (): unknown { return this.printerObjects['gcode_macro LED_MODE'] }

  /** The lights, or null on a printer with none. */
  get light (): LightState | null { return lightsStore.current(this.printerObjects) }

  /** What to draw while the printer has not said: the defaults, dimmed by `known`. */
  get shown (): LightState { return this.light ?? DEFAULT_LIGHT }

  get known (): boolean { return this.light !== null }

  get effect (): EffectInfo { return effectFor(this.caps, this.shown.effect) }

  /** Colours that count for this effect: none for Rainbow and Status, one for Solid... */
  get usedColours (): string[] { return this.shown.colors.slice(0, this.effect.colours) }

  get canSet (): boolean { return this.controlReady && this.known }

  get busyPrinting (): boolean { return this.printerPrinting || this.printerPaused }

  get presetId (): string | null { return lightsStore.matching(this.light) }

  /** Short name of what is showing: the preset's, or the effect's. */
  get lightName (): string {
    if (!this.light) return ''
    if (!this.light.on) return 'Off'
    const preset = lightsStore.presets.find(p => p.id === this.presetId)
    return preset ? preset.name : this.effect.label
  }

  change (patch: Partial<LightState>) {
    if (!this.canSet) return
    lightsStore.set(this.printerObjects, patch)
  }

  toggleOn () {
    if (!this.canSet) return
    lightsStore.setOn(this.printerObjects, !this.shown.on)
  }

  pick (preset: LightPreset) {
    if (!this.canSet) return
    lightsStore.applyPreset(this.printerObjects, preset)
  }

  /** The next preset in the list, for a tap on the small widget. */
  nextPreset () {
    const list = lightsStore.presets
    if (!this.canSet || !list.length) return
    const at = list.findIndex(p => p.id === this.presetId)
    lightsStore.applyPreset(this.printerObjects, list[(at + 1) % list.length])
  }

  @Watch('ledReport', { deep: true, immediate: true })
  onReport () { lightsStore.observe(this.printerObjects) }

  @Watch('commandTarget')
  onPrinter () {
    lightsStore.reset()
    lightsStore.ensureLibrary()
  }

  created () { lightsStore.ensureLibrary() }
}
