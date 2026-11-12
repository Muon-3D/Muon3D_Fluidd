<template>
  <m3-dialog
    :value="value"
    :eyebrow="eyebrow"
    :title="draft.name || 'New material'"
    max-width="480"
    data-tid="preset-sheet"
    @close="close"
  >
    <form
      :id="formId"
      class="psheet"
      novalidate
      @submit.prevent="save"
    >
      <label class="psheet__field">
        <span class="psheet__label">Name</span>
        <input
          v-model.trim="draft.name"
          type="text"
          class="psheet__input"
          autocomplete="off"
          :readonly="isDefault"
          data-tid="preset-name"
        >
      </label>
      <p
        v-if="nameError || (tried && !draft.name.trim())"
        class="psheet__error"
        role="alert"
      >
        {{ nameError || 'Give it a name' }}
      </p>

      <p
        v-if="draft.source"
        class="psheet__source"
        data-tid="preset-source"
      >
        From {{ draft.source }}<template v-if="canReset">
          · <button
            type="button"
            class="psheet__link"
            data-tid="preset-reset"
            @click="resetToTheirs"
          >
            Reset to theirs
          </button>
        </template>
      </p>

      <div class="psheet__group">
        <span class="psheet__label">Type and colour</span>
        <div
          class="psheet__types"
          role="radiogroup"
          aria-label="Type"
        >
          <button
            v-for="t in types"
            :key="t"
            type="button"
            role="radio"
            class="psheet__type"
            :aria-checked="draft.type === t ? 'true' : 'false'"
            :data-tid="`preset-type-${t}`"
            @click="draft.type = t"
          >
            {{ t }}
          </button>
        </div>
        <div
          class="psheet__colours"
          role="radiogroup"
          aria-label="Colour"
        >
          <button
            v-for="c in colours"
            :key="c.colour"
            type="button"
            role="radio"
            class="psheet__colour"
            :style="{ background: c.colour }"
            :aria-label="c.name"
            :title="c.name"
            :aria-checked="sameColour(c.colour) ? 'true' : 'false'"
            @click="draft.colour = c.colour"
          />
        </div>
      </div>

      <div
        v-for="h in heaterRows"
        :key="h.key"
        class="psheet__temp"
      >
        <label
          class="psheet__temp-label"
          :for="`${formId}-${h.key}`"
        >
          <b>{{ h.label }}</b>
          <span v-if="h.maker">Maker says {{ h.maker[0] }}–{{ h.maker[1] }}°</span>
        </label>
        <span class="psheet__num">
          <input
            :id="`${formId}-${h.key}`"
            v-model.number="draft.values[h.key].value"
            type="number"
            inputmode="numeric"
            min="0"
            :max="h.limit || undefined"
            class="psheet__input"
            :aria-invalid="limitError(h) ? 'true' : 'false'"
            :data-tid="`preset-temp-${h.tid}`"
          >
          <span class="psheet__unit">°C</span>
        </span>
        <p
          v-if="limitError(h)"
          class="psheet__error"
          role="alert"
          :data-tid="`preset-limit-${h.tid}`"
        >
          {{ limitError(h) }}
        </p>
      </div>

      <div class="psheet__temp">
        <label
          class="psheet__temp-label"
          :for="`${formId}-fan`"
        >
          <b>Part fan</b>
        </label>
        <span class="psheet__num">
          <input
            :id="`${formId}-fan`"
            v-model.number="fan"
            type="number"
            inputmode="numeric"
            min="0"
            max="100"
            class="psheet__input"
            :aria-invalid="fanError ? 'true' : 'false'"
            data-tid="preset-fan"
          >
          <span
            class="psheet__unit"
            data-tid="preset-fan-unit"
          >%</span>
        </span>
        <p
          v-if="fanError"
          class="psheet__error"
          role="alert"
        >
          {{ fanError }}
        </p>
      </div>

      <locked-row
        v-if="gcodeLocked"
        label="G-code when chosen"
        lock="developer-mode"
        reason-text="Developer mode only on Muon printers"
        data-tid="preset-gcode-locked"
      />
      <label
        v-else
        class="psheet__field"
      >
        <span class="psheet__label">G-code when chosen</span>
        <textarea
          v-model="draft.gcode"
          class="psheet__input psheet__gcode"
          rows="3"
          spellcheck="false"
          data-tid="preset-gcode"
        />
      </label>
    </form>

    <template #actions>
      <button
        v-if="canDelete"
        type="button"
        class="cbtn cbtn--danger"
        data-tid="preset-delete"
        @click="remove"
      >
        Delete
      </button>
      <span class="m3-dlg__grow" />
      <button
        type="submit"
        class="cbtn cbtn--primary"
        :form="formId"
        data-tid="preset-save"
      >
        Save
      </button>
    </template>
  </m3-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import M3Dialog from '@/components/ui/M3Dialog.vue'
import LockedRow from '@/components/settings/gates/LockedRow.vue'
import MuonGatesMixin from '@/mixins/muon-gates'
import MaterialLibraryMixin from '@/mixins/material-library'
import type { TemperaturePreset } from '@/store/config/types'
import type { Heater } from '@/store/printer/types'
import { FILAMENT_COLOURS } from '@/services/control/model'
import { DEFAULT_MATERIALS, isDefaultMaterial } from '@/store/config/default-materials'
import { materialLibrary } from '@/services/materials/library'
import { samePin } from '@/services/materials/pins'

interface HeaterRow {
  key: string;
  tid: string;
  label: string;
  maker: [number, number] | null;
  limit: number | null;
}

let sheets = 0

const TYPES = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PA', 'PC', 'CF/GF', 'Other']

/**
 * A material's own sheet (Settings › Materials, frame 2): its name, where it
 * came from, type and colour, nozzle and plate against the maker's range,
 * the part fan in %, and the G-code it sends when chosen. Temperatures above
 * the printer's own max_temp are refused with the limit shown. Raw G-code
 * can move or heat anything, so on a Muon printer it is developer mode only.
 */
@Component({ components: { M3Dialog, LockedRow } })
export default class PresetDialog extends Mixins(MuonGatesMixin, MaterialLibraryMixin) {
  @Prop({ type: Boolean, required: true })
  readonly value!: boolean

  @Prop({ type: Object, required: true })
  readonly preset!: TemperaturePreset

  formId = `psheet-${++sheets}`
  types = TYPES
  colours = FILAMENT_COLOURS
  draft: TemperaturePreset = { id: -1, name: '', gcode: '', values: {} }
  fan: number | '' = 100
  tried = false

  created () {
    this.draft = this.copy(this.preset)
    this.fan = this.preset.partFan ?? 100
  }

  copy (preset: TemperaturePreset): TemperaturePreset {
    const draft: TemperaturePreset = JSON.parse(JSON.stringify(preset))
    draft.values = draft.values ?? {}
    for (const key of ['extruder', 'heater_bed']) {
      if (key === 'heater_bed' && !this.hasHeater(key)) continue
      if (!draft.values[key]) draft.values[key] = { value: 0, type: 'heater', active: true }
    }
    draft.gcode = draft.gcode ?? ''
    draft.type = draft.type ?? (TYPES.includes(draft.name.toUpperCase()) ? draft.name.toUpperCase() : undefined)
    return draft
  }

  hasHeater (name: string): boolean {
    const heaters = (this.$store.getters['printer/getHeaters'] as Heater[] | undefined) ?? []
    return !heaters.length || heaters.some(h => h.name === name)
  }

  get isNew (): boolean {
    return this.preset.id === -1
  }

  get isDefault (): boolean {
    return !this.isNew && isDefaultMaterial(this.preset)
  }

  get eyebrow (): string {
    if (this.isDefault) return `On ${this.printerLabel} · always there`
    return this.isNew ? 'Make my own' : 'Your preset'
  }

  get canDelete (): boolean {
    return !this.isNew && !this.isDefault
  }

  get canReset (): boolean {
    return !!this.draft.libraryId || this.isDefault
  }

  /** On a Muon printer (or while that is still unknown) G-code is developer mode only. */
  get gcodeLocked (): boolean {
    return this.isMuonPrinter !== false && !this.devModeEnabled
  }

  maxTemp (section: string): number | null {
    const max = Number(this.$store.state.printer?.printer?.configfile?.settings?.[section]?.max_temp)
    return Number.isFinite(max) && max > 0 ? max : null
  }

  get heaterRows (): HeaterRow[] {
    return Object.keys(this.draft.values)
      .filter(key => this.draft.values[key].type === 'heater')
      .sort((a, b) => (a === 'extruder' ? -1 : b === 'extruder' ? 1 : a === 'heater_bed' ? -1 : b === 'heater_bed' ? 1 : a.localeCompare(b)))
      .map(key => ({
        key,
        tid: key === 'extruder' ? 'nozzle' : key === 'heater_bed' ? 'plate' : key.replace(/\s+/g, '-'),
        label: key === 'extruder' ? 'Nozzle' : key === 'heater_bed' ? 'Plate' : key.replace(/^heater_generic /, ''),
        maker: (key === 'extruder' ? this.draft.maker?.nozzle : key === 'heater_bed' ? this.draft.maker?.bed : null) ?? null,
        limit: this.maxTemp(key)
      }))
  }

  limitError (h: HeaterRow): string {
    const v = this.draft.values[h.key].value as number | string
    const empty = v === '' || v === null || !Number.isFinite(Number(v)) || Number(v) < 0 || (h.key === 'extruder' && Number(v) === 0)
    if (empty) return this.tried ? `${h.label}: enter a temperature` : ''
    if (h.limit !== null && Number(v) > h.limit) return `${this.printerLabel}'s ${h.label.toLowerCase()} tops out at ${h.limit}°C.`
    return ''
  }

  get fanError (): string {
    const v = Number(this.fan)
    return this.fan === '' || !Number.isFinite(v) || v < 0 || v > 100 ? 'The part fan runs from 0 to 100%.' : ''
  }

  get nameError (): string {
    const name = this.draft.name.trim()
    if (!name) return ''
    const clash = this.printerPresets.some(p => String(p.id) !== String(this.preset.id) && samePin(p.name, name))
    return clash ? `${this.printerLabel} already has a material called ${name}.` : ''
  }

  get valid (): boolean {
    const filled = this.heaterRows.every(h => {
      const v = this.draft.values[h.key].value as number | string
      return v !== '' && v !== null && Number.isFinite(Number(v)) && Number(v) >= 0 && !(h.key === 'extruder' && Number(v) === 0)
    })
    return filled && !!this.draft.name.trim() && !this.nameError && !this.fanError && this.heaterRows.every(h => !this.limitError(h))
  }

  sameColour (colour: string): boolean {
    return (this.draft.colour ?? '').toLowerCase() === colour.toLowerCase()
  }

  async resetToTheirs () {
    const fallback = DEFAULT_MATERIALS.find(m => samePin(m.name, this.preset.name))
    let nozzle = fallback?.nozzle
    let bed = fallback?.bed
    let fan = fallback?.fan
    if (this.draft.libraryId) {
      try {
        const entry = (await materialLibrary.load()).find(e => e.id === this.draft.libraryId)
        if (entry) ({ nozzle, bed, fan } = { nozzle: entry.nozzle.default, bed: entry.bed.default, fan: entry.fan })
      } catch {
        // Offline: keep what the printer has.
      }
    }
    if (nozzle !== undefined && this.draft.values.extruder) this.draft.values.extruder.value = nozzle
    if (bed !== undefined && this.draft.values.heater_bed) this.draft.values.heater_bed.value = bed
    if (fan !== undefined) this.fan = fan
  }

  close () {
    this.$emit('input', false)
  }

  async save () {
    this.tried = true
    if (!this.valid) return
    const preset: TemperaturePreset = {
      ...this.draft,
      name: this.draft.name.trim(),
      partFan: Math.round(Number(this.fan)),
      origin: this.isDefault ? 'default' : 'own'
    }
    for (const key of Object.keys(preset.values)) preset.values[key].value = Math.round(Number(preset.values[key].value))
    if (!preset.gcode) delete preset.gcode
    await this.savePreset(preset, this.isNew ? undefined : this.preset.name)
    this.$emit('saved', preset)
    this.close()
  }

  async remove () {
    const ok = await this.$confirm(`${this.preset.name} is removed from ${this.printerLabel} and from the filament picker.`, {
      title: `Delete ${this.preset.name}?`,
      buttonTrueText: 'Delete',
      danger: true
    })
    if (!ok) return
    await this.deletePreset(this.preset)
    this.close()
  }
}
</script>

<style lang="scss" scoped>
  .psheet {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .psheet__field,
  .psheet__group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .psheet__label {
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .psheet__input {
    width: 100%;
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid var(--m3d-border);
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font: inherit;

    &[aria-invalid="true"] {
      border-color: var(--m3d-danger);
    }
  }

  .psheet__gcode {
    font-family: var(--m3d-font-mono, monospace);
    font-size: 13px;
  }

  .psheet__source {
    margin: -6px 0 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .psheet__link {
    color: var(--m3d-accent);
    font-weight: 600;
  }

  .psheet__types {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .psheet__type {
    min-height: 32px;
    padding: 0 12px;
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-pill);
    color: var(--m3d-text);
    font-size: 13px;

    &[aria-checked="true"] {
      border-color: var(--m3d-accent);
      background: var(--m3d-surface-2);
      font-weight: 600;
    }
  }

  .psheet__colours {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(28px, 1fr));
    gap: 6px;
  }

  .psheet__colour {
    aspect-ratio: 1;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);

    &[aria-checked="true"] {
      box-shadow: inset 0 0 0 1px var(--m3d-border-strong), 0 0 0 2px var(--m3d-surface), 0 0 0 4px var(--m3d-accent);
    }
  }

  .psheet__temp {
    display: grid;
    grid-template-columns: 1fr 120px;
    align-items: center;
    gap: 4px 12px;

    .psheet__error {
      grid-column: 1 / -1;
    }
  }

  .psheet__temp-label {
    b {
      display: block;
      font-size: 15px;
      font-weight: 600;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .psheet__num {
    display: flex;
    align-items: center;
    gap: 6px;

    .psheet__input {
      text-align: right;
    }
  }

  .psheet__unit {
    flex: none;
    min-width: 22px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .psheet__error {
    margin: 0;
    color: var(--m3d-danger);
    font-size: 13px;
  }
</style>
