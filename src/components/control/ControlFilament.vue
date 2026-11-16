<template>
  <control-card
    title="Filament"
    icon="spool"
    :locked="lockReason"
    :note="lockReason ? '' : note"
    data-tid="control-filament"
  >
    <filament-section
      ref="section"
      :phone="phone"
    >
      <control-task-fold
        v-if="hasExtruder"
        fold-key="filament.extrude"
        title="Extrude by hand"
        :summary="`${length} mm at ${speed} mm/s`"
      >
        <div class="heat__extruder">
          <div
            class="crow heat__for-extrude"
            data-tid="extrude-heat-row"
          >
            <span class="crow__name">Heat for extruding <span
              class="crow__sub"
              data-tid="extrude-heat-note"
            >{{ heatNote }}</span></span>
            <number-field
              :key="`heat-${panelTarget}`"
              :value="heatTemp"
              unit="°C"
              :min="minExtrude"
              :max="heatMax"
              label="Extrude temperature"
              :disabled="!controlReady"
              @change="heatDraft = $event"
            />
            <button
              type="button"
              class="cbtn cbtn--primary"
              :disabled="!canHeat"
              :title="heatBlocked || ''"
              data-tid="extrude-heat"
              @click="heatForExtrude"
            >
              Heat
            </button>
          </div>
          <div class="crow">
            <span class="crow__name">Length</span>
            <seg-picker
              :options="lengthOptions"
              :value="length"
              label="Length"
              @input="length = $event"
            />
          </div>
          <div class="crow">
            <span class="crow__name">Speed</span>
            <number-field
              :value="speed"
              unit="mm/s"
              :min="0.1"
              :max="maxExtrudeSpeed"
              :decimals="speed % 1 ? 1 : 0"
              label="Extrude speed"
              @change="speed = $event"
            />
          </div>
          <div class="heat__extrude-buttons">
            <button
              type="button"
              class="cbtn cbtn--grow"
              :disabled="!canExtrude"
              data-tid="retract"
              @click="extrude(-1)"
            >
              Retract
            </button>
            <button
              type="button"
              class="cbtn cbtn--grow"
              :disabled="!canExtrude"
              data-tid="extrude"
              @click="extrude(1)"
            >
              Extrude
            </button>
          </div>
          <p
            v-if="extrudeReason"
            class="heat__reason"
            data-tid="extrude-reason"
          >
            <frame-icon
              name="lock"
              small
            />
            {{ extrudeReason }}
          </p>
        </div>
      </control-task-fold>
    </filament-section>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import FilamentActionsMixin from '@/mixins/filament-actions'
import ControlCard from './ControlCard.vue'
import ControlTaskFold from './ControlTaskFold.vue'
import FilamentSection from './FilamentSection.vue'
import NumberField from './NumberField.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import { extrudeBlocked, extrudeLengths, hotendLimitReason } from '@/services/control/model'
import { extrudeTemperature, type ExtrudeTemperature } from '@/util/temperature-preset'

/**
 * Filament on Control: the one filament section Overview has too
 * (FilamentSection: the material panel, Change filament, Load, Unload and
 * the sensors), plus Extrude by hand. Extrude by hand heats for you: its
 * Heat button sets the nozzle to the loaded material's temperature (or the
 * printer's default material's), which can be changed first. It is only a
 * heater target; it never extrudes.
 */
@Component({ components: { ControlCard, ControlTaskFold, FilamentSection, NumberField, SegPicker } })
export default class ControlFilament extends Mixins(FilamentActionsMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  lengthDraft: number | null = null
  speedDraft: number | null = null
  heatDraft: number | null = null
  extrusionTarget = ''
  created () { this.resetExtrusion() }

  @Watch('panelTarget')
  resetExtrusion () { this.lengthDraft = null; this.speedDraft = null; this.heatDraft = null; this.extrusionTarget = this.panelTarget }

  get length (): number { return this.lengthDraft ?? (this.$store.state.config.uiSettings.general.defaultExtrudeLength as number || 10) }
  set length (value: number) { this.lengthDraft = value }
  get speed (): number { return this.speedDraft ?? (this.$store.state.config.uiSettings.general.defaultExtrudeSpeed as number || 5) }
  set speed (value: number) { this.speedDraft = value }

  get ready (): boolean { return this.controlReady }

  extrude (direction: 1 | -1) {
    if (this.extrusionTarget !== this.panelTarget || !this.canExtrude || !Number.isFinite(this.length) || this.length <= 0 || this.length > this.maxExtrudeLength ||
      !Number.isFinite(this.speed) || this.speed < 0.1 || this.speed > this.maxExtrudeSpeed) return
    this.sendExtrudeGcode(direction * this.length, this.speed)
  }

  get lengthOptions (): SegOption[] {
    return extrudeLengths(this.maxExtrudeLength).map((v, i, all) => ({ value: v, label: i === all.length - 1 ? `${v} mm` : String(v) }))
  }

  /** The length chosen, kept within max_extrude_only_distance, which Klipper refuses past. */
  get extrudeLength (): number {
    return Math.min(this.length, this.maxExtrudeLength)
  }

  get minExtrude (): number {
    return Math.round(this.activeExtruder?.min_extrude_temp ?? 170)
  }

  /** What Heat sets the nozzle to, before anyone changes it: the loaded material's, else the printer's default. */
  get heatChoice (): ExtrudeTemperature {
    return extrudeTemperature(this.presets, this.loadedMaterial?.name ?? null, { min: this.minExtrude, max: this.heatMax })
  }

  get heatMax (): number { return Math.round(this.nozzle?.maxTemp || this.extruderMaxTemp || 300) }
  get heatTemp (): number { return this.heatDraft ?? this.heatChoice.temp }

  get heatNote (): string {
    const n = this.nozzle
    if (n && n.target >= this.minExtrude && n.temperature < this.minExtrude) return `heating to ${Math.round(n.target)}° · now ${Math.round(n.temperature)}°`
    if (this.heatDraft !== null) return 'your temperature'
    return this.heatChoice.material ? `for ${this.heatChoice.material}` : ''
  }

  /** Why Heat can't be pressed now, if it can't. */
  get heatBlocked (): string | null {
    if (!this.ready || !this.nozzle) return 'Not connected to the printer'
    if (this.busy) return this.printLocked ? 'Not while printing' : 'The printer is busy'
    const temp = this.heatTemp
    if (!Number.isFinite(temp) || temp < this.minExtrude) return `Extruding needs at least ${this.minExtrude}°`
    return hotendLimitReason(this.heatChoice.material ?? undefined, temp, this.extruderMaxTemp)
  }

  get canHeat (): boolean { return !this.heatBlocked }

  /** A heater target only: the nozzle heats, nothing moves and nothing is extruded. */
  heatForExtrude () {
    if (this.extrusionTarget !== this.panelTarget || !this.canHeat) return
    this.setHeater(this.nozzle, this.heatTemp)
  }

  get extrudeReason (): string | null {
    if (!this.ready) return null
    if (this.busy) return this.printLocked ? 'Not while printing' : 'The printer is busy'
    const temperature = this.activeExtruder?.temperature ?? 0
    const canExtrude = this.activeExtruder?.can_extrude
    if (canExtrude === false && temperature >= this.minExtrude) return 'Klipper isn\'t allowing extrusion yet. Wait a moment for the nozzle to settle.'
    return extrudeBlocked(temperature, this.minExtrude, canExtrude === true)
  }

  get canExtrude (): boolean {
    return this.ready && !this.extrudeReason
  }

  get lockReason (): string {
    // Changing filament mid-print is what M600 is for; it pauses the print.
    return this.controlLock
  }

  get note (): string {
    return this.changeMacro
      ? 'Guided: it heats the nozzle for you, tells you when to pull and push, then purges.'
      : 'Load and unload heat the nozzle for you first.'
  }

  get section (): FilamentSection | undefined {
    return this.$refs.section as FilamentSection | undefined
  }

  /** As the section's: idle, the material panel; mid-print, M600 after its confirm. */
  async changeFilament () {
    if (this.changePlan.kind === 'panel') {
      this.openPanel()
      return
    }
    await this.runFilamentPlan('change')
  }

  openPanel () {
    this.section?.openPanel()
  }

  /**
   * Quick actions' Change filament, idle, comes here with ?filament=open:
   * on arrival, or while already here. The query is then dropped, so the
   * next press changes the route again.
   */
  @Watch('$route.query.filament', { immediate: true })
  onFilamentQuery (value: unknown) {
    if (value !== 'open') return
    this.$nextTick(() => {
      this.openPanel()
      const query = { ...this.$route.query }
      delete query.filament
      this.$router.replace({ path: this.$route.path, query }).catch(() => {})
    })
  }
}
</script>

<style lang="scss" scoped>
  .heat__extruder { display: flex; flex-direction: column; gap: 8px; }
  .heat__reason { display: flex; align-items: center; gap: 6px; margin: 0; color: var(--m3d-text-subtle); font-size: 12px; }
  .heat__extrude-buttons { display: flex; gap: 8px; }
  .heat__for-extrude { gap: 8px; }
  .heat__for-extrude .crow__sub { display: block; font-size: 11px; }
</style>
