<template>
  <div
    class="fsec"
    :class="{ 'fsec--phone': phone, 'fsec--compact': compact }"
    data-tid="filament-section"
  >
    <material-picker ref="picker">
      <template #activator="{ on, attrs, disabled }">
        <button
          type="button"
          class="fsec__row"
          :disabled="disabled"
          aria-haspopup="listbox"
          :aria-label="`Filament: ${view.type}. Set material and colour`"
          data-tid="filament-row"
          v-bind="attrs"
          v-on="on"
        >
          <span
            class="fsec__spool"
            :class="{ 'fsec__spool--none': !view.colour }"
            :style="view.colour ? { background: view.colour, color: ink } : undefined"
            data-tid="filament-swatch"
          >
            <frame-icon
              name="spool"
              large
            />
          </span>
          <span class="fsec__text">
            <b data-tid="filament-type">
              <v-icon
                v-if="noMaterial"
                x-small
                class="fsec__warn"
                data-tid="filament-warning"
              >$warning</v-icon>{{ view.type }}
            </b>
            <span data-tid="filament-detail">{{ view.detail }}</span>
          </span>
        </button>
      </template>
    </material-picker>
    <template v-if="!compact">
      <div class="fsec__buttons">
        <button
          type="button"
          class="cbtn cbtn--primary cbtn--grow"
          :disabled="!!controlLock || changePlan.kind === 'none'"
          :title="changePlan.kind === 'none' ? changePlan.reason : ''"
          :data-tid="`${tidPrefix}change-filament`"
          @click="changeFilament"
        >
          Change filament
        </button>
        <button
          type="button"
          class="cbtn cbtn--grow"
          :disabled="!!controlLock || loadPlan.kind === 'none'"
          :title="loadPlan.kind === 'none' ? loadPlan.reason : ''"
          :data-tid="`${tidPrefix}load-filament`"
          @click="runFilamentPlan('load')"
        >
          Load
        </button>
        <button
          type="button"
          class="cbtn cbtn--grow"
          :disabled="!!controlLock || unloadPlan.kind === 'none'"
          :title="unloadPlan.kind === 'none' ? unloadPlan.reason : ''"
          :data-tid="`${tidPrefix}unload-filament`"
          @click="runFilamentPlan('unload')"
        >
          Unload
        </button>
      </div>
      <p
        v-for="sensor in loaders"
        :key="sensor.name"
        class="fsec__loader"
      >
        <template v-if="sensor.enabled">
          {{ sensor.filament_detected ? 'Filament in.' : 'No filament.' }} Push new filament in and it loads by itself. <b>Always on</b>
        </template>
        <template v-else>
          Automatic loading is off. Report the sensor state before loading filament.
        </template>
      </p>
      <div
        v-for="sensor in manualSensors"
        :key="sensor.name"
        class="crow"
        data-tid="filament-sensor"
      >
        <span class="crow__name">{{ sensor.prettyName }} · {{ !sensor.enabled ? 'off' : sensor.filament_detected ? 'filament in' : 'no filament' }}<span
          v-if="sensor.role === 'unknown'"
          class="crow__sub"
        > · settings not loaded</span></span>
        <toggle-switch
          :value="sensor.enabled"
          :label="`${sensor.prettyName} on`"
          :disabled="!controlReady || (sensor.enabled && sensor.role !== 'runout')"
          @input="setRunout(sensor.name, $event)"
        />
      </div>
      <router-link
        v-if="hasSensors"
        class="fsec__sensors"
        :to="sensorsLink"
        data-tid="filament-sensors-link"
      >
        Filament sensors in Health ›
      </router-link>
    </template>
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import FilamentActionsMixin from '@/mixins/filament-actions'
import MaterialPicker from '@/components/overview/MaterialPicker.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import { filamentSensorRole, sensorCommand, type FilamentSensorRole } from '@/services/control/model'
import { filamentView, inkFor, type FilamentView } from '@/services/overview/tiles'
import { sensorsPath } from '@/services/control/sensors-link'
import type { RunoutSensor } from '@/store/printer/types'

/**
 * The one filament section, on Overview and Control alike (Jack, 6 Nov 2026:
 * "the same component, in parity"): what is loaded as a ring and its name,
 * which opens the material panel (MaterialPicker), Change filament, Load and
 * Unload through the KAN-1700 plans, and the filament sensors. Control puts
 * Extrude by hand in the default slot; nothing else differs.
 */
@Component({ components: { MaterialPicker, ToggleSwitch } })
export default class FilamentSection extends Mixins(FilamentActionsMixin) {
  @Prop({ type: Boolean }) readonly phone?: boolean
  /** Only the ring and its name (Overview's small widget). */
  @Prop({ type: Boolean }) readonly compact?: boolean
  /** Put before the buttons' data-tid, so each page keeps its own (`overview-`). */
  @Prop({ type: String, default: '' }) readonly tidPrefix!: string

  get view (): FilamentView {
    // What someone said is loaded comes first; the active Spoolman spool stands in when nobody has.
    const loaded = this.loadedMaterial ? { name: this.loadedMaterial.name, colour: this.loadedColour } : null
    const spool = loaded ? null : this.$store.getters['spoolman/getActiveSpool']
    const view = filamentView(spool, loaded, this.printingWith)
    // The sensor can see filament that nobody has named yet.
    if (view.source === 'none' && this.filamentSensed) return { ...view, type: 'Filament loaded', detail: 'Press to say which material' }
    if (view.source === 'none') return { ...view, detail: 'Press to set the material and colour' }
    return view
  }

  /** Nothing is loaded: the one place to warn, in the one phrase. */
  get noMaterial (): boolean {
    return this.view.source === 'none' && !this.filamentSensed
  }

  get ink (): string { return inkFor(this.view.colour) }

  get sensors (): Array<RunoutSensor & { prettyName: string, role: FilamentSensorRole }> {
    return ((this.$store.getters['printer/getRunoutSensors'] as Array<RunoutSensor & { prettyName: string }>) ?? [])
      .map(sensor => ({ ...sensor, role: filamentSensorRole(this.$store.state.printer.printer.configfile, sensor.name) }))
  }

  get hasSensors (): boolean { return this.sensors.length > 0 }
  get loaders (): RunoutSensor[] { return this.sensors.filter(s => s.role === 'loads') }
  get manualSensors (): Array<RunoutSensor & { prettyName: string, role: FilamentSensorRole }> { return this.sensors.filter(s => s.role !== 'loads') }
  get sensorsLink () { return sensorsPath() }

  setRunout (name: string, enabled: boolean) {
    if (!this.controlReady) return
    const command = sensorCommand(name, enabled, this.$store.state.printer.printer.configfile)
    if (command) this.sendGcode(command)
  }

  /**
   * Mid-print: M600, which pauses the print, after its confirm. Idle: open
   * the material panel and send nothing (KAN-1700).
   */
  async changeFilament () {
    if (this.changePlan.kind === 'panel') {
      this.openPanel()
      return
    }
    await this.runFilamentPlan('change')
  }

  openPanel () {
    const picker = this.$refs.picker as unknown as { open: boolean } | undefined
    if (picker) this.$nextTick(() => { picker.open = true })
  }
}
</script>

<style lang="scss">
.fsec { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.fsec__row { display: flex; align-items: center; gap: 14px; width: 100%; padding: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.fsec__row:disabled { cursor: default; }
.fsec__spool { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgb(128 128 128 / 45%); }
.fsec--compact .fsec__spool { width: 36px; height: 36px; }
.fsec__spool--none { background: var(--m3d-surface-2); color: var(--m3d-text-subtle); }
.fsec__spool .frame-icon { color: inherit; }
.fsec__spool svg { width: 28px; height: 28px; }
.fsec__text { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
.fsec__text b { font-size: 16px; font-weight: 600; }
.fsec__warn { margin-right: 6px; color: var(--m3d-warning) !important; }
.fsec__text span { overflow: hidden; color: var(--m3d-text-muted); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
.fsec__buttons { display: flex; flex-wrap: wrap; gap: 6px; }
.fsec__buttons .cbtn--primary { flex-grow: 2; }
.fsec--phone .fsec__buttons .cbtn { height: 48px; }
.fsec__loader { margin: 0; font-size: 13px; color: var(--m3d-text-muted); }
.fsec__sensors { align-self: flex-start; color: var(--m3d-text-muted) !important; font-size: 13px; font-weight: 600; text-decoration: none; }
.fsec__sensors:hover { color: var(--m3d-text) !important; }
</style>
