<template>
  <tile-shell
    :tile="kind"
    :title="disconnected ? `${name} disconnected` : name"
    :icon="kind === 'bed' ? 'thermometer' : 'nozzle'"
    :state="disconnected ? '' : status.label"
    :tone="status.tone"
    :menu="menu"
    :open="open"
    :locked="locked"
    :class="{ ht: true, [`ht--${size}`]: true, 'ht--disconnected': disconnected }"
    @toggle="toggle"
  >
    <span
      class="ot__value"
      data-tid="heater-value"
    >{{ valueText }}<small v-if="targetText">/ {{ targetText }}</small></span>
    <span
      v-if="heater && !disconnected"
      class="ot__bar"
    ><i :style="{ width: `${Math.round(barFraction * 100)}%` }" /></span>
    <span
      v-if="size === 'M' && heater && !disconnected"
      class="hp__presets ht__inline"
      role="group"
      :aria-label="`${name} presets`"
      data-tid="heater-inline-presets"
    >
      <button
        v-for="m in presetChoices"
        :key="m.name"
        type="button"
        class="hp__preset"
        :class="{ 'hp__preset--on': Math.round(heater.target) === m.temp }"
        :disabled="!controlReady"
        @click.stop="setHeater(heater, m.temp)"
      >
        {{ m.name }} {{ m.temp }}
      </button>
      <button
        type="button"
        class="hp__preset"
        :disabled="!controlReady"
        @click.stop="setHeater(heater, 0)"
      >
        Off
      </button>
    </span>

    <template #popover>
      <div
        :key="panelTarget"
        class="hp"
      >
        <div class="hp__top">
          <span class="hp__now">{{ nowText }}<small>now</small></span>
          <template v-for="context in [panelTarget]">
            <number-field
              :key="context"
              :value="heater ? Math.round(heater.target) : null"
              unit="°"
              :label="`${name} target`"
              :min="0"
              :max="maxTemp"
              :disabled="!controlReady"
              @change="commitTarget(context, $event)"
            />
          </template>
        </div>
        <div
          class="hp__presets"
          role="group"
          :aria-label="`${name} presets`"
        >
          <button
            v-for="m in presetChoices"
            :key="m.name"
            type="button"
            class="hp__preset"
            :class="{ 'hp__preset--on': heater && Math.round(heater.target) === m.temp }"
            :disabled="!controlReady"
            :data-preset="m.name"
            @click="setHeater(heater, m.temp)"
          >
            {{ m.name }} {{ m.temp }}
          </button>
          <button
            type="button"
            class="hp__preset"
            :class="{ 'hp__preset--on': heater && !heater.target }"
            :disabled="!controlReady"
            data-tid="heater-off"
            @click="setHeater(heater, 0)"
          >
            Off
          </button>
        </div>
        <div class="ot__rows">
          <div class="ot__row">
            <frame-icon
              name="pulse"
              small
            />Show on graph
            <toggle-switch
              :value="onGraph"
              label="Show on graph"
              @input="toggleGraph"
            />
          </div>
          <router-link
            class="ot__row"
            data-row="pid"
            :to="pagePath('/maintenance')"
          >
            <frame-icon
              name="settings"
              small
            />PID tune and limits…<span class="hp__hint">max {{ maxTemp }}°</span>
          </router-link>
          <router-link
            v-if="kind === 'hotend'"
            class="ot__row"
            data-row="load"
            :to="pagePath('/control')"
          >
            <frame-icon
              name="spool"
              small
            />Load or unload filament…
          </router-link>
          <router-link
            v-if="kind === 'bed' && meshSupported"
            class="ot__row"
            data-row="mesh"
            :to="pagePath('/tune')"
          >
            <frame-icon
              name="mesh"
              small
            />Bed mesh…
          </router-link>
          <router-link
            class="ot__row"
            data-row="presets"
            :to="`${pagePath('/settings')}#presets`"
          >
            <frame-icon
              name="list"
              small
            />Edit temperature presets…
          </router-link>
          <button
            type="button"
            class="ot__row"
            :disabled="!controlReady"
            data-tid="cool-down"
            @click="coolDown"
          >
            <frame-icon
              name="snow"
              small
            />Cool down
          </button>
        </div>
      </div>
    </template>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { heaterTile, type HeaterTile as HeaterReading } from '@/services/overview/model'
import type { TileMenuItem } from '@/services/overview/tiles'
import type { Heater } from '@/store/printer/types'
import TileShell from './TileShell.vue'
import NumberField from '@/components/control/NumberField.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'

type Kind = 'hotend' | 'bed'

/**
 * The hotend or the bed: its temperature and target as one live number and
 * a bar, and how close it is in words. Tapping it opens the full controls:
 * an exact target, the materials, show on graph, PID, and cool down.
 */
@Component({ components: { TileShell, NumberField, ToggleSwitch } })
export default class HeaterTile extends Mixins(OverviewMixin) {
  @Prop({ type: String, default: 'hotend' }) readonly kind!: Kind

  open = false

  @Watch('panelTarget')
  closeOnSwitch () { this.open = false }

  get name (): string { return this.kind === 'bed' ? 'Bed' : 'Hotend' }
  get heater (): Heater | null { return this.kind === 'bed' ? this.bed : this.nozzle }
  get seriesKey (): string { return this.kind === 'bed' ? 'heater_bed' : 'extruder' }

  /** The printer says the part is not there at all. */
  get disconnected (): boolean {
    const printer = this.$store.state.printer.printer
    return this.kind === 'bed' ? !!printer?.bed_removal_detector?.bedRemoved : !!printer?.['mcu toolhead']?.non_critical_disconnected
  }

  get locked (): boolean { return !this.heater || this.disconnected }
  get maxTemp (): number { return this.heater?.maxTemp || 300 }
  get reading (): HeaterReading | null { return this.heater ? heaterTile(this.heater.temperature, this.heater.target) : null }

  get status (): { label: string, tone: string } {
    const r = this.reading
    if (!r) return { label: '', tone: 'off' }
    if (r.status === 'at temperature') return { label: 'At temperature', tone: 'ok' }
    if (r.status === 'off') return { label: 'Off', tone: 'off' }
    return { label: r.status === 'heating' ? 'Heating' : 'Cooling', tone: 'warm' }
  }

  get valueText (): string {
    return this.heater && !this.disconnected ? `${this.heater.temperature.toFixed(1)}°` : '—'
  }

  get nowText (): string { return this.heater ? `${this.heater.temperature.toFixed(1)}°` : '—' }
  get targetText (): string { return this.heater && !this.disconnected && this.heater.target ? `${Math.round(this.heater.target)}°` : '' }
  get barFraction (): number { return this.reading?.progress ?? 0 }

  /** The materials that say a temperature for this heater. */
  get presetChoices (): Array<{ name: string, temp: number }> {
    return this.materialChoices
      .map(m => ({ name: m.name, temp: this.kind === 'bed' ? m.bed : m.nozzle }))
      .filter((m): m is { name: string, temp: number } => typeof m.temp === 'number' && m.temp > 0 && m.temp <= this.maxTemp)
      .slice(0, 6)
  }

  get meshSupported (): boolean { return !!this.$store.getters['mesh/getSupportsBedMesh'] }

  get onGraph (): boolean {
    const saved = (this.$store.getters['charts/getSelectedLegends'] ?? {})[this.seriesKey]
    return typeof saved === 'boolean' ? saved : true
  }

  toggleGraph () {
    const selected = (this.$store.getters['charts/getSelectedLegends'] ?? {}) as Record<string, boolean>
    this.$store.dispatch('charts/saveSelectedLegends', { ...selected, [this.seriesKey]: !this.onGraph })
  }

  toggle () { if (!this.locked) this.open = !this.open }

  commitTarget (context: string, value: number) {
    if (context === this.panelTarget && !this.disconnected) this.setHeater(this.heater, value)
  }

  get menu (): TileMenuItem[] {
    const items: TileMenuItem[] = [
      { id: 'graph', label: 'Show on graph', toggle: true, on: this.onGraph, action: this.toggleGraph },
      { id: 'pid', label: 'PID tune and limits…', to: this.pagePath('/maintenance') }
    ]
    if (this.kind === 'hotend') items.push({ id: 'load', label: 'Load or unload…', to: this.pagePath('/control') })
    else if (this.meshSupported) items.push({ id: 'mesh', label: 'Bed mesh…', to: this.pagePath('/tune') })
    items.push({ id: 'presets', label: 'Presets…', to: `${this.pagePath('/settings')}#presets` })
    return items
  }
}
</script>

<style lang="scss">
.ht .ot__state { margin-right: 0; }
@media (max-width: 599px) { .ht .ot__state { display: none; } }
.ht--disconnected { outline: 1px solid var(--m3d-danger); outline-offset: -1px; }
.hp__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.hp__now { font-family: var(--m3d-font-rounded); font-size: 30px; font-weight: 600; font-variant-numeric: tabular-nums; }
.hp__now small { margin-left: 6px; color: var(--m3d-text-muted); font-size: 12px; font-weight: 500; }
.ht__inline { margin-top: 8px; }
.hp__presets { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px; border-radius: 16px; background: var(--m3d-surface-2); }
.hp__preset { flex: 1 1 auto; min-height: 32px; padding: 0 10px; border-radius: 12px; color: var(--m3d-text-muted); font-size: 13px; font-weight: 600; white-space: nowrap; cursor: pointer; }
.hp__preset:disabled { opacity: 0.45; cursor: default; }
.hp__preset--on { background: var(--m3d-accent); color: var(--m3d-on-accent, #00201e); }
.hp__hint { color: var(--m3d-text-subtle); font-family: var(--m3d-font-mono); font-size: 12px; }
</style>
