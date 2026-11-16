<template>
  <tile-shell
    tile="filament"
    title="Filament"
    :menu="menu"
    :class="['ft', `ft--${size}`]"
  >
    <filament-section
      ref="section"
      :compact="size === 'S'"
      tid-prefix="overview-"
    />
    <p
      v-if="size === 'L'"
      class="ot__sub ft__note"
    >
      {{ changeMacro ? 'Change filament is guided: it heats the nozzle, tells you when to pull and push, then purges.' : 'Load and unload heat the nozzle for you first.' }}
    </p>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import FilamentActionsMixin from '@/mixins/filament-actions'
import type { TileMenuItem } from '@/services/overview/tiles'
import { sensorsPath } from '@/services/control/sensors-link'
import TileShell from './TileShell.vue'
import FilamentSection from '@/components/control/FilamentSection.vue'

/**
 * What is loaded, and the buttons to change it: Control's filament section
 * (FilamentSection), the same component (Jack, 6 Nov 2026: "the same
 * component, in parity"), without Extrude by hand. A press on the ring or
 * its name, or ⋯ Set material and colour, opens the material panel
 * (MaterialPicker) directly. There is no amount and no percentage: the
 * printer does not track them.
 */
@Component({ components: { TileShell, FilamentSection } })
export default class FilamentTile extends Mixins(OverviewMixin, FilamentActionsMixin) {
  get menu (): TileMenuItem[] {
    const items: TileMenuItem[] = [
      { id: 'material', label: 'Set material and colour…', action: () => this.openPanel() },
      { id: 'load', label: 'Load or unload…', action: () => this.openPanel() },
      { id: 'sensors', label: 'Filament sensors…', to: sensorsPath() }
    ]
    if (this.$store.getters['spoolman/getAvailable']) {
      items.push({ id: 'spoolman', label: 'Pick a Spoolman spool…', action: () => this.$store.commit('spoolman/setDialogState', { show: true }) })
    }
    return items
  }

  openPanel () {
    (this.$refs.section as FilamentSection | undefined)?.openPanel()
  }
}
</script>

<style lang="scss">
.ft__note { margin-top: 8px; }
</style>
