<template>
  <tile-shell
    tile="fans"
    title="Fans"
    icon="fan"
    :menu="menu"
    :open="open"
    :locked="!fans.length"
    class="fa"
    @toggle="toggle"
  >
    <template v-if="fans.length">
      <span
        class="ot__value"
        data-tid="fan-value"
      >{{ headline }}<small>{{ headlineLabel }}</small></span>
      <span
        v-if="size !== 'S'"
        class="ot__sub"
      >{{ others }}</span>
    </template>
    <template v-else>
      <span class="ot__value">—</span>
      <span class="ot__sub">No fans reported</span>
    </template>

    <template #popover>
      <div
        :key="panelTarget"
        class="fa__pop"
      >
        <div
          v-for="fan in sliders"
          :key="fan.name"
          class="fa__row"
        >
          <span class="fa__name">{{ fan.prettyName || fan.name }}</span>
          <range-slider
            class="fa__slider"
            :value="fanValue(fan)"
            :label="fan.prettyName || fan.name"
            :value-text-formatter="percentText"
            :disabled="!controlReady"
            @change="setFan(fan, $event)"
          />
          <b class="fa__pct">{{ fanValue(fan) }}%</b>
        </div>
        <div
          v-if="hasLights"
          class="fa__row"
        >
          <span class="fa__name">Lights</span>
          <toggle-switch
            :value="lightsValue > 0"
            label="Lights"
            :disabled="!controlReady"
            @input="setLights"
          />
        </div>
        <p
          v-if="!sliders.length"
          class="ot__note"
        >
          The fans here are run by the printer itself.
        </p>
        <p
          v-else-if="busy"
          class="ot__note"
        >
          The print sets the part fan as it goes. A change here lasts until its next fan command.
        </p>
      </div>
    </template>

    <tile-dialog
      :value="dialog"
      title="All fans and outputs"
      max-width="720"
      @close="dialog = false"
    >
      <control-fans />
    </tile-dialog>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import type { TileMenuItem } from '@/services/overview/tiles'
import type { Fan } from '@/store/printer/types'
import TileShell from './TileShell.vue'
import TileDialog from './TileDialog.vue'
import RangeSlider from '@/components/control/RangeSlider.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'

/**
 * The part fan as one number, the others in a line. Tapping opens a slider
 * for each fan the printer lets us set, and the lights. Every fan and
 * output, and the power devices, are behind the three dots.
 */
@Component({ components: { TileShell, TileDialog, RangeSlider, ToggleSwitch, ControlFans: () => import('@/components/control/ControlFans.vue') } })
export default class FansTile extends Mixins(OverviewMixin) {
  open = false
  dialog = false

  @Watch('panelTarget')
  closeOnSwitch () { this.open = false; this.dialog = false }

  get lead (): Fan | null { return this.partFan ?? this.fans[0] ?? null }
  get headline (): string { return this.lead ? `${this.fanValue(this.lead)}%` : '—' }
  get headlineLabel (): string { return this.lead === this.partFan ? 'part' : (this.lead?.prettyName || '') }

  /** The rest, in words: a fan we can set by its percentage, one the printer runs by itself on or off. */
  get others (): string {
    return this.fans.filter(f => f !== this.lead).slice(0, 3).map(f => {
      const name = f.prettyName || f.name
      const value = this.fanValue(f)
      return f.controllable ? `${name} ${value}%` : `${name} ${value ? 'on' : 'off'}`
    }).join(' · ') || 'No other fans'
  }

  get sliders (): Fan[] {
    return this.fans.filter(f => f.controllable && (f.type === 'fan' || f.type === 'fan_generic'))
  }

  get powerDevices (): unknown[] {
    if (!this.$store.getters['server/componentSupport']?.('power')) return []
    return (this.$store.getters['power/getDevices'] as unknown[]) ?? []
  }

  percentText (value: number): string { return `${value} percent` }

  toggle () { if (this.fans.length) this.open = !this.open }

  get menu (): TileMenuItem[] {
    const items: TileMenuItem[] = [{ id: 'all', label: 'All fans and outputs…', action: () => { this.dialog = true } }]
    if (this.powerDevices.length) items.push({ id: 'power', label: 'Power devices…', to: this.pagePath('/system') })
    return items
  }
}
</script>

<style lang="scss">
.fa__pop { display: flex; flex-direction: column; gap: 12px; }
.fa__row { display: flex; align-items: center; gap: 12px; }
.fa__name { flex: 0 0 90px; font-size: 14px; font-weight: 500; }
.fa__slider { flex: 1 1 auto; }
.fa__pct { min-width: 40px; text-align: right; font-variant-numeric: tabular-nums; }
</style>
