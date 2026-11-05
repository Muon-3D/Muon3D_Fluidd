<template>
  <tile-shell
    tile="filament"
    title="Filament"
    :menu="menu"
    class="ft"
  >
    <div
      class="ft__row"
      data-tid="filament-row"
    >
      <span
        class="ft__spool"
        :class="{ 'ft__spool--none': !view.colour }"
        :style="view.colour ? { background: view.colour, color: ink } : null"
        data-tid="filament-swatch"
      >
        <frame-icon
          name="spool"
          large
        />
      </span>
      <span class="ft__text">
        <b data-tid="filament-type">{{ view.type }}</b>
        <span data-tid="filament-detail">{{ view.detail }}</span>
      </span>
    </div>

    <tile-dialog
      :value="dialog"
      title="Set the filament"
      @close="dialog = false"
    >
      <material-picker />
    </tile-dialog>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { filamentView, inkFor, type FilamentView, type TileMenuItem } from '@/services/overview/tiles'
import TileShell from './TileShell.vue'
import TileDialog from './TileDialog.vue'

/**
 * What is loaded: one spool (the M1 has one), as a row with its type and a
 * colour icon. Whatever Control already knows: the active Spoolman spool,
 * what someone said is loaded, or what the print file was sliced for.
 * There is no amount and no percentage: the printer does not track them.
 */
@Component({ components: { TileShell, TileDialog, MaterialPicker: () => import('@/components/overview/MaterialPicker.vue') } })
export default class FilamentTile extends Mixins(OverviewMixin) {
  dialog = false

  get view (): FilamentView {
    const spool = this.$store.getters['spoolman/getActiveSpool']
    const loaded = this.loadedMaterial ? { name: this.loadedMaterial.name, colour: this.loadedColour } : null
    return filamentView(spool, loaded, this.printingWith)
  }

  get ink (): string { return inkFor(this.view.colour) }

  get menu (): TileMenuItem[] {
    const items: TileMenuItem[] = [
      { id: 'material', label: 'Set material and colour…', action: () => { this.dialog = true } },
      { id: 'load', label: 'Load or unload…', to: this.pagePath('/control') },
      { id: 'sensors', label: 'Filament sensors…', to: this.pagePath('/maintenance') }
    ]
    if (this.$store.getters['spoolman/getAvailable']) {
      items.push({ id: 'spoolman', label: 'Pick a Spoolman spool…', action: () => this.$store.commit('spoolman/setDialogState', { show: true }) })
    }
    return items
  }
}
</script>

<style lang="scss">
.ft__row { display: flex; align-items: center; gap: 14px; }
.ft__spool { display: inline-flex; flex: none; align-items: center; justify-content: center; width: 46px; height: 46px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgb(128 128 128 / 45%); }
.ft__spool--none { background: var(--m3d-surface-2); color: var(--m3d-text-subtle); }
.ft__spool .frame-icon { color: inherit; }
.ft__spool svg { width: 28px; height: 28px; }
.ft__text { display: flex; flex-direction: column; min-width: 0; line-height: 1.25; }
.ft__text b { font-size: 16px; font-weight: 600; }
.ft__text span { overflow: hidden; color: var(--m3d-text-muted); font-size: 12.5px; text-overflow: ellipsis; white-space: nowrap; }
</style>
