<template>
  <span class="matp__root">
    <v-menu
      v-model="open"
      :close-on-content-click="false"
      offset-y
      :nudge-bottom="6"
      min-width="280"
      max-width="320"
      content-class="matp"
    >
      <template #activator="{ on, attrs }">
        <slot
          name="activator"
          v-bind="{ on, attrs, disabled: !klippyReady }"
        >
          <button
            type="button"
            class="matp__chip"
            :disabled="!klippyReady"
            aria-haspopup="listbox"
            :aria-expanded="open ? 'true' : 'false'"
            data-tid="chip-filament"
            v-bind="attrs"
            v-on="on"
          >
            <span
              class="matp__swatch"
              :style="{ background: shown && shown.colour ? shown.colour : 'transparent' }"
            />
            {{ chipText }}
            <frame-icon
              name="chevronDown"
              small
            />
          </button>
        </slot>
      </template>

      <div
        class="matp__panel"
        data-tid="material-picker"
      >
        <div class="matp__header">
          <p class="matp__title">
            What's loaded?
          </p>
          <button
            v-if="loadMacro"
            type="button"
            class="matp__icon-btn"
            :disabled="!klippyReady || loadPlan.kind === 'none'"
            :title="loadPlan.kind === 'none' ? loadPlan.reason : 'Load filament'"
            aria-label="Load filament"
            data-tid="material-load"
            @click="runOnce('load')"
          >
            <frame-icon
              name="down"
              small
            />
          </button>
          <button
            v-if="unloadMacro"
            type="button"
            class="matp__icon-btn"
            :disabled="!klippyReady || unloadPlan.kind === 'none'"
            :title="unloadPlan.kind === 'none' ? unloadPlan.reason : 'Unload filament'"
            aria-label="Unload filament"
            data-tid="material-unload"
            @click="runOnce('unload')"
          >
            <frame-icon
              name="up"
              small
            />
          </button>
        </div>
        <div
          role="listbox"
          aria-label="Material"
          class="matp__list"
          data-tid="material-shortlist"
        >
          <button
            v-for="m in pinnedChoices"
            :key="m.name"
            type="button"
            role="option"
            class="matp__row"
            :class="{ 'matp__row--on': loadedMaterial && loadedMaterial.name === m.name }"
            :aria-selected="loadedMaterial && loadedMaterial.name === m.name ? 'true' : 'false'"
            :disabled="busy"
            :data-tid="`material-${m.name}`"
            @click="choose(m)"
          >
            <span
              class="matp__swatch"
              :style="{ background: m.colour }"
            />
            <b>{{ m.name }}</b>
            <span class="matp__temps">{{ temps(m) }}</span>
            <frame-icon
              v-if="loadedMaterial && loadedMaterial.name === m.name"
              name="check"
              small
            />
          </button>
          <button
            type="button"
            class="matp__row matp__add"
            data-tid="material-picker-add"
            @click="startAdding"
          >
            <frame-icon
              name="plus"
              small
            />
            <b>Add</b>
          </button>
        </div>
        <p
          v-if="busy"
          class="matp__note"
        >
          Not while printing: the print was sliced for what's loaded.
        </p>
        <p class="matp__title">
          Its colour<span
            v-if="loadedColour"
            class="matp__colour-name"
          > · {{ loadedColourName }}</span>
        </p>
        <div
          role="listbox"
          aria-label="Colour"
          class="matp__colours"
          data-tid="material-colours"
        >
          <button
            v-for="c in colours"
            :key="c.colour"
            type="button"
            role="option"
            class="matp__colour"
            :class="{ 'matp__colour--on': loadedColour === c.colour }"
            :style="{ background: c.colour }"
            :title="c.name"
            :aria-label="c.name"
            :aria-selected="loadedColour === c.colour ? 'true' : 'false'"
            :data-tid="`colour-${c.name}`"
            @click="chooseColour(c.colour)"
          />
          <label
            class="matp__colour matp__colour--other"
            :class="{ 'matp__colour--on': loadedColour && !isListed(loadedColour) }"
            :style="loadedColour && !isListed(loadedColour) ? { background: loadedColour } : undefined"
            title="Another colour"
          >
            <frame-icon
              v-if="!loadedColour || isListed(loadedColour)"
              name="plus"
              small
            />
            <input
              type="color"
              class="matp__colour-input"
              aria-label="Another colour"
              :value="loadedColour || '#888888'"
              data-tid="colour-other"
              @change="onOtherColour"
            >
          </label>
        </div>
        <div
          v-if="loadedMaterial"
          class="matp__actions"
        >
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="!klippyReady || busy"
            data-tid="material-heat"
            @click="heat"
          >
            <frame-icon
              name="flame"
              small
            />
            Heat for {{ loadedMaterial.name }}
          </button>
        </div>
        <router-link
          :to="presetsTo"
          class="matp__more"
          data-tid="material-see-materials"
          @click.native="open = false"
        >
          See materials ›
        </router-link>
      </div>
    </v-menu>
    <add-material-dialog
      v-if="adding"
      v-model="adding"
    />
  </span>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import FilamentActionsMixin from '@/mixins/filament-actions'
import { FILAMENT_COLOURS, colourName, normaliseColour, type MaterialChoice } from '@/services/control/model'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'
import { pinnedNames } from '@/services/materials/pins'
const AddMaterialDialog = () => import('@/components/settings/presets/AddMaterialDialog.vue')

/**
 * What's loaded, for everyone, on Overview and Control:
 * the material and its colour, and a press to change either. The printer
 * remembers both (save_variables muon_material, as the panel does, and
 * muon_material_colour beside it), so the panel, these pages, the slicer
 * and the live M1 agree. From here: heat for it, and load or unload with
 * the printer's own macros.
 */
@Component({ components: { AddMaterialDialog } })
export default class MaterialPicker extends Mixins(FilamentActionsMixin) {
  open = false
  adding = false

  colours = FILAMENT_COLOURS

  get pinnedMaterialNames (): string[] {
    return pinnedNames(this.$store.state.config.uiSettings.general.pinnedMaterials)
  }

  get pinnedChoices (): MaterialChoice[] {
    return this.pinnedMaterialNames
      .map(name => this.materialChoices.find(m => m.name.trim().toLowerCase() === name.trim().toLowerCase()))
      .filter((m): m is MaterialChoice => m !== undefined)
  }

  /** The library popup, the same one Settings › Materials and Heat open. */
  startAdding () {
    this.open = false
    this.adding = true
  }

  @Watch('panelTarget')
  resetPicker () {
    this.open = false
    this.adding = false
  }

  /** What the tile names: what's loaded, else what the print running was sliced for. */
  get shown (): { name: string, colour: string | null } | null {
    return this.loadedMaterial ?? this.printingWith
  }

  get loadedColourName (): string {
    return colourName(this.loadedColour)
  }

  get chipText (): string {
    const m = this.loadedMaterial
    if (!m && this.printingWith) return `${this.printingWith.name} (from the file)`
    if (!m) return 'Say what\'s loaded'
    return this.loadedColour ? `${m.name} · ${this.loadedColourName}` : m.name
  }

  isListed (colour: string): boolean {
    return this.colours.some(c => c.colour === colour)
  }

  /** The colour of what's loaded can change at any time: a change of filament mid-print is what M600 is for. */
  chooseColour (colour: string) {
    const hex = normaliseColour(colour)
    if (hex) this.setLoadedColour(hex)
  }

  onOtherColour (event: Event) {
    this.chooseColour((event.target as HTMLInputElement).value)
  }

  get presetsTo (): string {
    return `${scopedPath('/settings', activeSlug())}#presets`
  }

  temps (m: MaterialChoice): string {
    return [m.nozzle !== null ? `${m.nozzle}° nozzle` : '', m.bed !== null ? `${m.bed}° bed` : ''].filter(Boolean).join(' · ')
  }

  hasMacro (name: string): boolean {
    return `gcode_macro ${name.toLowerCase()}` in (this.$store.state.printer.printer.configfile?.settings ?? {})
  }

  choose (m: MaterialChoice) {
    if (this.busy) return
    this.setLoadedMaterial(m)
  }

  heat () {
    if (this.loadedMaterial) this.heatFor(this.loadedMaterial)
    this.open = false
  }

  /** Load or Unload (FilamentActionsMixin), once however often it's pressed; the panel closes once it's sent. */
  async runOnce (which: 'load' | 'unload') {
    if (await this.runFilamentPlan(which)) this.open = false
  }
}
</script>

<style lang="scss" scoped>

  .matp__swatch {
    display: inline-block;
    flex: none;
    width: 12px;
    height: 12px;
    margin-right: 8px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 25%);
    vertical-align: middle;
  }

  .matp__panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    border: 1px solid var(--m3d-border);
    border-radius: 18px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .matp__title {
    margin: 0 4px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .matp__list {
    display: flex;
    flex-direction: column;
  }

  .matp__row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 40px;
    padding: 0 8px;
    border-radius: 10px;
    color: var(--m3d-text);
    text-align: left;

    b {
      min-width: 52px;
      font-size: 14px;
    }

    &:hover:not(:disabled) {
      background: var(--m3d-hover);
    }

    &:disabled {
      opacity: 0.5;
    }
  }

  .matp__row--on {
    background: var(--m3d-surface-2);
  }

  .matp__temps {
    flex: 1 1 auto;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .matp__note {
    margin: 0 4px;
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .matp__actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 10px;
    border-top: 1px solid var(--m3d-border);

    .cbtn {
      width: 100%;
      min-height: 40px;
      justify-content: center;
    }
  }

  .matp__more {
    margin: 2px 4px 0;
    color: var(--m3d-accent) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .matp__colour-name {
    color: var(--m3d-text);
    font-weight: 500;
  }

  .matp__colours {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 6px;
    padding: 0 4px 4px;
  }

  .matp__colour {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 50%;
    // The theme's own border, so black shows on the dark panel and white on the light one.
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    color: var(--m3d-text-muted);
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
      outline-offset: 2px;
    }
  }

  .matp__colour--on {
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong), 0 0 0 2px var(--m3d-surface), 0 0 0 4px var(--m3d-accent);
  }

  .matp__colour--other {
    background: var(--m3d-surface-2);
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
  }

  .matp__colour--other.matp__colour--on {
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong), 0 0 0 2px var(--m3d-surface), 0 0 0 4px var(--m3d-accent);
  }

  // The native picker covers the circle, invisible, so a press anywhere on it opens the system's colour chooser.
  .matp__colour-input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .matp__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 10px;
    border: 1px solid var(--m3d-border);
    border-radius: var(--m3d-radius-pill);
    color: var(--m3d-text);
    font: inherit;
    font-size: 13px;
    white-space: nowrap;
    cursor: pointer;

    .matp__swatch {
      margin-right: 0;
    }

    &:hover:not(:disabled) {
      background: var(--m3d-hover);
    }

    &:disabled {
      cursor: default;
      opacity: 0.6;
    }
  }
.matp__root {
  display: contents;
}
.matp__header {
  display: flex;
  align-items: center;
  gap: 4px;
  .matp__title { flex: 1 1 auto; }
}
.matp__icon-btn {
  display: inline-flex;
  padding: 8px;
  border-radius: 10px;
  color: var(--m3d-text);
  &:hover:not(:disabled) { background: var(--m3d-hover); }
  &:disabled { opacity: 0.4; }
}
.matp__add {
  color: var(--m3d-accent);
}
</style>

<style lang="scss">
  .v-menu__content.matp {
    border-radius: 18px;
    box-shadow: 0 12px 40px rgb(0 0 0 / 35%);
  }
</style>
