<template>
  <tile-shell
    tile="speed"
    :title="heading"
    icon="pulse"
    :menu="menu"
    :open="open"
    class="sp"
    @toggle="open = !open"
  >
    <span
      class="ot__value"
      data-tid="speed-value"
    >{{ speedFactor }}%<small>/ {{ flowFactor }}%</small></span>
    <span class="ot__sub">{{ sub }}</span>

    <template #popover>
      <div
        :key="panelTarget"
        class="sp__pop"
      >
        <seg-picker
          :options="speedOptions"
          :value="speedFactor"
          label="Speed choices"
          accent
          fill
          :disabled="!controlReady"
          @input="commit(panelTarget, 'speed', $event)"
        />
        <div class="sp__row">
          <span>Speed</span>
          <template v-for="context in [panelTarget]">
            <number-field
              :key="`s${context}`"
              :value="speedFactor"
              unit="%"
              label="Speed"
              :min="1"
              :max="500"
              :disabled="!controlReady"
              @change="commit(context, 'speed', $event)"
            />
          </template>
        </div>
        <div class="sp__row">
          <span>Flow</span>
          <template v-for="context in [panelTarget]">
            <number-field
              :key="`f${context}`"
              :value="flowFactor"
              unit="%"
              label="Flow"
              :min="1"
              :max="300"
              :disabled="!controlReady"
              @change="commit(context, 'flow', $event)"
            />
          </template>
        </div>
        <div
          v-if="pressureAdvance !== null"
          class="sp__row"
        >
          <span>Pressure advance</span>
          <template v-for="context in [panelTarget]">
            <number-field
              :key="`p${context}`"
              :value="pressureAdvance"
              unit="s"
              label="Pressure advance"
              :min="0"
              :max="2"
              :decimals="3"
              :disabled="!controlReady"
              @change="commit(context, 'pa', $event)"
            />
          </template>
        </div>
        <p class="ot__note">
          Applies now and lasts until the printer restarts. Nothing here is saved.
        </p>
      </div>
    </template>

    <tile-dialog
      :value="dialog === 'limits'"
      title="Speed and acceleration limits"
      max-width="720"
      @close="dialog = ''"
    >
      <control-tuning />
    </tile-dialog>
    <tile-dialog
      :value="dialog === 'retraction'"
      title="Retraction"
      @close="dialog = ''"
    >
      <retract />
    </tile-dialog>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import type { TileMenuItem } from '@/services/overview/tiles'
import TileShell from './TileShell.vue'
import TileDialog from './TileDialog.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import NumberField from '@/components/control/NumberField.vue'

/**
 * Speed and flow as one pair of numbers. Tapping opens the live tune:
 * Slow, Normal and Fast, exact speed and flow, and pressure advance. The
 * speed and acceleration limits and the retraction settings are behind the
 * three dots.
 */
@Component({ components: { TileShell, TileDialog, SegPicker, NumberField, ControlTuning: () => import('@/components/control/ControlTuning.vue'), Retract: () => import('@/components/widgets/retract/Retract.vue') } })
export default class SpeedTile extends Mixins(OverviewMixin) {
  /** The tile's name: "Print mode" when it stands in for that widget. */
  @Prop({ type: String, default: 'Speed / flow' }) readonly heading!: string

  open = false
  dialog: '' | 'limits' | 'retraction' = ''

  @Watch('panelTarget')
  closeOnSwitch () { this.open = false; this.dialog = '' }

  get sub (): string {
    return this.pressureAdvance !== null ? `Pressure advance ${this.pressureAdvance.toFixed(3)}` : 'Applies now, not saved'
  }

  get speedOptions (): SegOption[] {
    return this.speedChoices.map(c => ({ value: c.percent, label: c.label }))
  }

  /** A value from a field made for another printer is dropped, as everywhere else. */
  commit (context: string, what: 'speed' | 'flow' | 'pa', value: number) {
    if (context !== this.panelTarget) return
    if (what === 'speed') this.setSpeed(value)
    else if (what === 'flow') this.setFlow(value)
    else this.setPressureAdvance(value)
  }

  get hasRetraction (): boolean { return !!this.$store.state.printer.printer.firmware_retraction }

  get menu (): TileMenuItem[] {
    const items: TileMenuItem[] = [{ id: 'limits', label: 'Speed and acceleration limits…', action: () => { this.dialog = 'limits' } }]
    if (this.hasRetraction) items.push({ id: 'retraction', label: 'Retraction…', action: () => { this.dialog = 'retraction' } })
    return items
  }
}
</script>

<style lang="scss">
.sp__pop { display: flex; flex-direction: column; gap: 12px; }
.sp__row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 14px; font-weight: 500; }
</style>
