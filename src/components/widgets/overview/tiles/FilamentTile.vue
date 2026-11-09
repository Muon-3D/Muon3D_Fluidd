<template>
  <tile-shell
    tile="filament"
    title="Filament"
    :menu="menu"
    class="ft"
  >
    <material-picker ref="picker">
      <template #activator="{ on, attrs, disabled }">
        <button
          type="button"
          class="ft__row"
          :disabled="disabled"
          aria-haspopup="listbox"
          :aria-label="`Filament: ${view.type}. Set material and colour`"
          data-tid="filament-row"
          v-bind="attrs"
          v-on="on"
        >
          <span
            class="ft__spool"
            :class="{ 'ft__spool--none': !view.colour }"
            :style="view.colour ? { background: view.colour, color: ink } : undefined"
            data-tid="filament-swatch"
          >
            <frame-icon
              name="spool"
              large
            />
          </span>
          <span class="ft__text">
            <b data-tid="filament-type">
              <v-icon
                v-if="noMaterial"
                x-small
                class="ft__warn"
                data-tid="filament-warning"
              >$warning</v-icon>{{ view.type }}
            </b>
            <span data-tid="filament-detail">{{ view.detail }}</span>
          </span>
        </button>
      </template>
    </material-picker>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { filamentView, inkFor, type FilamentView, type TileMenuItem } from '@/services/overview/tiles'
import TileShell from './TileShell.vue'
import MaterialPicker from '@/components/overview/MaterialPicker.vue'

/**
 * What is loaded: one spool (the M1 has one), as a row with its type and a
 * colour icon. Whatever Control already knows: the active Spoolman spool,
 * what someone said is loaded, or what the print file was sliced for.
 * There is no amount and no percentage: the printer does not track them.
 * A press on the row, or on ⋯ Set material or Load or unload, opens the
 * material panel (MaterialPicker) directly, as Control's do.
 */
@Component({ components: { TileShell, MaterialPicker } })
export default class FilamentTile extends Mixins(OverviewMixin) {
  get view (): FilamentView {
    const spool = this.$store.getters['spoolman/getActiveSpool']
    const loaded = this.loadedMaterial ? { name: this.loadedMaterial.name, colour: this.loadedColour } : null
    const view = filamentView(spool, loaded, this.printingWith)
    // The sensor can see filament that nobody has named yet.
    if (view.source === 'none' && this.filamentSensed) return { ...view, type: 'Filament loaded', detail: 'Say which material from the ⋯ menu' }
    return view
  }

  /** Nothing is loaded: the one place to warn, in the one phrase. */
  get noMaterial (): boolean {
    return this.view.source === 'none' && !this.filamentSensed
  }

  get ink (): string { return inkFor(this.view.colour) }

  get menu (): TileMenuItem[] {
    const items: TileMenuItem[] = [
      { id: 'material', label: 'Set material and colour…', action: () => this.openPanel() },
      { id: 'load', label: 'Load or unload…', action: () => this.openPanel() },
      { id: 'sensors', label: 'Filament sensors…', to: this.pagePath('/maintenance') }
    ]
    if (this.$store.getters['spoolman/getAvailable']) {
      items.push({ id: 'spoolman', label: 'Pick a Spoolman spool…', action: () => this.$store.commit('spoolman/setDialogState', { show: true }) })
    }
    return items
  }

  openPanel () {
    const picker = this.$refs.picker as unknown as { open: boolean } | undefined
    if (picker) this.$nextTick(() => { picker.open = true })
  }
}
</script>

<style lang="scss">
.ft__row { display: flex; align-items: center; gap: 14px; width: 100%; padding: 0; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.ft__row:disabled { cursor: default; }
.ft__spool { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgb(128 128 128 / 45%); }
.ft__spool--none { background: var(--m3d-surface-2); color: var(--m3d-text-subtle); }
.ft__spool .frame-icon { color: inherit; }
.ft__spool svg { width: 28px; height: 28px; }
.ft__text { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
.ft__text b { font-size: 16px; font-weight: 600; }
.ft__warn { margin-right: 6px; color: var(--m3d-warning) !important; }
.ft__text span { overflow: hidden; color: var(--m3d-text-muted); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
</style>
