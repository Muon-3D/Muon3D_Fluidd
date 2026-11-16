<template>
  <tile-shell
    tile="mode"
    title="Print mode"
    icon="fan"
    :state="modes ? currentLabel : ''"
    :tone="modes && modes.current ? 'ok' : 'off'"
    :class="['pm', `pm--${size}`]"
  >
    <div
      v-if="modes"
      class="pm__modes"
      role="radiogroup"
      aria-label="Print mode"
    >
      <button
        v-for="card in modes.cards"
        :key="card.id"
        type="button"
        role="radio"
        class="pm__mode"
        :class="{ 'pm__mode--on': card.id === modes.current }"
        :aria-checked="card.id === modes.current ? 'true' : 'false'"
        :disabled="!controlReady"
        :data-tid="`overview-mode-${card.id}`"
        @click="setMode(card.id)"
      >
        <frame-icon
          :name="card.icon"
          small
        />
        <b>{{ card.label }}</b>
        <span v-if="size !== 'S' && card.blurb">{{ card.blurb }}</span>
      </button>
    </div>
    <div
      v-else
      class="pm__none"
      data-tid="mode-unavailable"
    >
      <b>Not available on this printer</b>
      <span>{{ size === 'S' ? 'No print modes set up.' : 'Quiet, Normal and Turbo need [fan_modes] in the printer config.' }}</span>
    </div>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import TileShell from './TileShell.vue'
import { printModeCommand, printModeLabel, readPrintModes, type PrintModes } from '@/services/control/print-mode'

/**
 * Quiet, Normal or Turbo, as on Control's Print mode card (ControlPrintMode):
 * the modes come from printer.fan_modes and a press sends SET_PRINT_MODE.
 * A printer without fan_modes says so; speed and flow are not a stand-in.
 */
@Component({ components: { TileShell } })
export default class PrintModeTile extends Mixins(OverviewMixin) {
  get modes (): PrintModes | null {
    const commands = this.$store.getters['printer/getAvailableCommands'] as Record<string, unknown> | undefined
    return readPrintModes(this.$store.state.printer.printer.fan_modes, commands)
  }

  get currentLabel (): string { return printModeLabel(this.modes?.current ?? '') }

  setMode (mode: string) {
    const command = printModeCommand(mode, this.modes)
    if (!this.controlReady || !command || mode === this.modes?.current) return
    this.sendGcode(command)
  }
}
</script>

<style lang="scss">
.pm__modes { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 6px; }
.pm__mode { display: flex; flex-direction: column; align-items: center; gap: 2px; min-height: 44px; padding: 8px 4px; border-radius: 12px; background: var(--m3d-fill); color: var(--m3d-text); font: inherit; font-size: 12.5px; cursor: pointer; }
.pm__mode b { font-weight: 600; }
.pm__mode span { color: var(--m3d-text-muted); font-size: 11.5px; text-align: center; }
.pm__mode--on { background: var(--m3d-accent); color: var(--m3d-on-accent, #fff); }
.pm__mode--on span { color: inherit; opacity: 0.85; }
.pm__mode:disabled { cursor: default; opacity: 0.6; }
.pm--M .pm__mode { align-items: flex-start; padding: 10px 12px; text-align: left; }
.pm--M .pm__mode span { text-align: left; }
.pm__none { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
.pm__none span { color: var(--m3d-text-muted); font-size: 12.5px; }
</style>
