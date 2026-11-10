<template>
  <div
    id="toolhead"
    class="m3-sets mset"
    data-tid="moving-settings"
  >
    <div
      v-if="muon"
      class="mset__callout"
      data-tid="moving-muon-callout"
    >
      <frame-icon
        name="shield"
        small
      />
      <div><b>{{ printerName }} is a Muon printer.</b> Speeds stay inside what the M1 is built for. Anything that could damage it is under Developer mode.</div>
    </div>

    <p
      v-if="!connected"
      class="m3-set__intro"
      data-tid="moving-offline"
    >
      The printer isn't connected, so these can't be changed until it's back.
    </p>
    <fieldset
      class="m3-sets__fieldset"
      :disabled="!connected"
    >
      <section class="m3-set">
        <h2 class="m3-set__title">
          Moving the head and plate
        </h2>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Step sizes for the head</b>
            <span>The buttons in Control's Move tile.</span>
          </div>
          <div class="m3-set__control">
            <step-chips
              :values="toolheadXYMoveDistances"
              label="Step sizes for the head"
              unit="mm"
              tid="moving-steps-head"
              @change="save('toolheadXYMoveDistances', $event)"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Step sizes for the plate</b>
          </div>
          <div class="m3-set__control">
            <step-chips
              :values="toolheadZMoveDistances"
              label="Step sizes for the plate"
              unit="mm"
              tid="moving-steps-plate"
              @change="save('toolheadZMoveDistances', $event)"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Head speed</b>
            <span v-if="!limits.head">Waiting for the printer's limits.</span>
            <span v-else-if="muon">Up to {{ limits.head }} mm/s on an M1.</span>
            <span v-else>Up to {{ limits.head }} mm/s, this printer's max_velocity.</span>
          </div>
          <div class="m3-set__control">
            <seg-picker
              v-if="muon"
              :value="headPreset"
              :options="headPresets"
              :disabled="!limits.head"
              label="Head speed"
              data-tid="moving-head-presets"
              @input="setHeadPreset"
            />
            <number-field
              v-else
              :value="defaultToolheadXYSpeed"
              unit="mm/s"
              :min="1"
              :max="limits.head || 1000"
              label="Head speed"
              data-tid="moving-head-speed"
              @change="save('defaultToolheadXYSpeed', $event)"
            />
          </div>
        </div>
        <div
          v-if="!muon"
          class="m3-set__row"
        >
          <div class="m3-set__label">
            <b>Plate speed</b>
            <span v-if="limits.plate">Up to {{ limits.plate }} mm/s.</span>
          </div>
          <div class="m3-set__control">
            <number-field
              :value="defaultToolheadZSpeed"
              unit="mm/s"
              :min="1"
              :max="limits.plate || 100"
              label="Plate speed"
              data-tid="moving-plate-speed"
              @change="save('defaultToolheadZSpeed', $event)"
            />
          </div>
        </div>
        <div
          v-if="!muon"
          class="m3-set__row"
          data-tid="moving-reverse"
        >
          <div class="m3-set__label">
            <b>Reverse an axis</b>
            <span>Only for a printer whose motors run the other way.</span>
          </div>
          <div class="m3-set__control">
            <label
              v-for="axis in reversibleAxes"
              :key="axis"
              class="m3-set__check"
            ><input
              type="checkbox"
              :checked="inverted(axis)"
              :data-tid="`moving-reverse-${axis}`"
              @change="onInvert(axis, $event)"
            > {{ axis.toUpperCase() }}</label>
          </div>
        </div>
        <div
          v-if="!muon && printerSupportsForceMove"
          class="m3-set__row"
        >
          <div class="m3-set__label">
            <b>Warn before FORCE_MOVE</b>
            <span>Before a move that skips Klipper's limits.</span>
          </div>
          <div class="m3-set__control">
            <toggle-switch
              :value="forceMoveToggleWarning"
              label="Warn before FORCE_MOVE"
              data-tid="moving-force-move"
              @input="save('forceMoveToggleWarning', $event)"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Fine Z steps (paper test, live Z)</b>
          </div>
          <div class="m3-set__control">
            <step-chips
              :values="zAdjustDistances"
              label="Fine Z steps"
              unit="mm"
              tid="moving-steps-fine"
              @change="save('zAdjustDistances', $event)"
            />
          </div>
        </div>
      </section>

      <section class="m3-set">
        <h2 class="m3-set__title">
          Extruding by hand
        </h2>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Length per press</b>
            <span v-if="capped">Up to {{ limits.extrudeLength }} mm on an M1.</span>
            <span v-else>Up to {{ limits.extrudeLength }} mm.</span>
          </div>
          <div class="m3-set__control">
            <number-field
              :value="defaultExtrudeLength"
              unit="mm"
              :min="1"
              :max="limits.extrudeLength"
              label="Length per press"
              data-tid="moving-extrude-length"
              @change="save('defaultExtrudeLength', $event)"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Speed</b>
            <span v-if="capped">Up to {{ limits.extrudeSpeed }} mm/s on an M1, so the drive can't grind.</span>
            <span v-else>Up to {{ limits.extrudeSpeed }} mm/s.</span>
          </div>
          <div class="m3-set__control">
            <number-field
              :value="defaultExtrudeSpeed"
              unit="mm/s"
              :min="0.1"
              :max="limits.extrudeSpeed"
              :decimals="defaultExtrudeSpeed % 1 ? 1 : 0"
              label="Extrude speed"
              data-tid="moving-extrude-speed"
              @change="save('defaultExtrudeSpeed', $event)"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Heat for extruding</b>
            <span>The "Heat to extrude" button next to Extrude uses the loaded material's temperature.</span>
          </div>
          <div class="m3-set__control mset__value">
            From the material
          </div>
        </div>
      </section>

      <section class="m3-set">
        <h2 class="m3-set__title">
          Helpers
        </h2>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Open the paper test when the printer asks</b>
          </div>
          <div class="m3-set__control">
            <toggle-switch
              :value="general.showManualProbeDialogAutomatically"
              label="Open the paper test when the printer asks"
              @input="save('showManualProbeDialogAutomatically', $event)"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Open bed-screw help when the printer asks</b>
            <span>BED_SCREWS_ADJUST and SCREWS_TILT_CALCULATE, on printers that have them.</span>
          </div>
          <div class="m3-set__control">
            <toggle-switch
              :value="general.showBedScrewsAdjustDialogAutomatically && general.showScrewsTiltAdjustDialogAutomatically"
              label="Open bed-screw help when the printer asks"
              @input="save('showBedScrewsAdjustDialogAutomatically', $event); save('showScrewsTiltAdjustDialogAutomatically', $event)"
            />
          </div>
        </div>
        <div class="m3-set__row">
          <div class="m3-set__label">
            <b>Start again</b>
            <span>These settings back to how they came.</span>
          </div>
          <div class="m3-set__control">
            <button
              type="button"
              class="cbtn cbtn--ghost"
              data-tid="moving-reset"
              @click="handleReset"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section
        v-if="muon"
        class="m3-set"
        data-tid="moving-developer"
      >
        <h2 class="m3-set__title">
          Developer mode only
        </h2>
        <template v-if="devModeEnabled">
          <div
            class="m3-set__row"
            data-tid="moving-reverse"
          >
            <div class="m3-set__label">
              <b>Reverse X or Y</b>
              <span>An M1's directions are fixed. Only for a modified machine.</span>
            </div>
            <div class="m3-set__control">
              <label
                v-for="axis in reversibleAxes"
                :key="axis"
                class="m3-set__check"
              ><input
                type="checkbox"
                :checked="inverted(axis)"
                :data-tid="`moving-reverse-${axis}`"
                @change="onInvert(axis, $event)"
              > {{ axis.toUpperCase() }}</label>
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Plate speed</b>
              <span v-if="limits.plate">Up to {{ limits.plate }} mm/s.</span>
            </div>
            <div class="m3-set__control">
              <number-field
                :value="defaultToolheadZSpeed"
                unit="mm/s"
                :min="1"
                :max="limits.plate || 100"
                label="Plate speed"
                data-tid="moving-plate-speed"
                @change="save('defaultToolheadZSpeed', $event)"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Speeds above the M1's limits</b>
              <span>An exact head speed, up to {{ limits.head || '…' }} mm/s. Extruding goes up to the printer's own limits.</span>
            </div>
            <div class="m3-set__control">
              <number-field
                :value="defaultToolheadXYSpeed"
                unit="mm/s"
                :min="1"
                :max="limits.head || 1000"
                label="Head speed"
                data-tid="moving-head-speed"
                @change="save('defaultToolheadXYSpeed', $event)"
              />
            </div>
          </div>
          <div
            v-if="printerSupportsForceMove"
            class="m3-set__row"
          >
            <div class="m3-set__label">
              <b>Move without homing (FORCE_MOVE)</b>
              <span>Warn before a move that skips Klipper's limits.</span>
            </div>
            <div class="m3-set__control">
              <toggle-switch
                :value="forceMoveToggleWarning"
                label="Warn before FORCE_MOVE"
                data-tid="moving-force-move"
                @input="save('forceMoveToggleWarning', $event)"
              />
            </div>
          </div>
        </template>
        <div
          v-else
          class="mset__locked"
        >
          <locked-row
            label="Reverse X or Y"
            reason-text="An M1's directions are fixed. Only for a modified machine."
          />
          <locked-row
            label="Plate speed"
            :reason-text="`Fixed at ${defaultToolheadZSpeed} mm/s.`"
          />
          <locked-row
            label="Speeds above the M1's limits"
          />
          <locked-row
            v-if="printerSupportsForceMove"
            label="Move without homing (FORCE_MOVE)"
          />
        </div>
      </section>
    </fieldset>

    <p
      class="mset__note"
      data-tid="moving-no-reverse-z"
    >
      Reversing Z is gone for everyone: on a bed-moving printer it only crashes the plate.
    </p>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import NumberField from '@/components/control/NumberField.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import FrameIcon from '@/components/ui/FrameIcon.vue'
import LockedRow from '@/components/settings/gates/LockedRow.vue'
import StepChips from '@/components/settings/StepChips.vue'
import MuonGatesMixin from '@/mixins/muon-gates'
import { defaultState } from '@/store/config/state'
import type { GeneralConfig } from '@/store/config/types'
import { printerNameParts } from '@/util/printer-name'
import { HEAD_SPEED_PRESETS, headSpeedFor, motionLimits, presetOf, type HeadSpeedPreset, type MotionLimits } from '@/services/settings/motion-limits'

/**
 * Settings › Moving and extruding (settings/motion.md). On a Muon printer
 * (or one whose server info hasn't loaded yet) anything that could damage
 * it is under Developer mode; any other printer gets plain fields, capped at
 * its own config's limits.
 */
@Component({
  components: { NumberField, SegPicker, ToggleSwitch, FrameIcon, LockedRow, StepChips }
})
export default class ToolHeadSettings extends Mixins(MuonGatesMixin) {
  /** Unknown counts as Muon: the locks show until the printer says otherwise. */
  get muon (): boolean {
    return this.isMuonPrinter !== false
  }

  /** The M1's caps apply: a Muon printer without developer mode. */
  get capped (): boolean {
    return this.muon && !this.devModeEnabled
  }

  get connected (): boolean {
    return this.$store.state.socket?.open === true
  }

  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  get general (): GeneralConfig {
    return this.$store.state.config.uiSettings.general
  }

  setting (path: string): unknown {
    return this.$store.getters['printer/getPrinterSettings'](path)
  }

  get limits (): MotionLimits {
    return motionLimits({
      maxVelocity: this.setting('printer.max_velocity') ?? this.$store.state.printer.printer.toolhead?.max_velocity,
      maxZVelocity: this.setting('printer.max_z_velocity'),
      maxExtrudeOnlyDistance: this.setting('extruder.max_extrude_only_distance'),
      maxExtrudeOnlyVelocity: this.setting('extruder.max_extrude_only_velocity')
    }, this.capped)
  }

  get headPresets (): SegOption[] {
    return HEAD_SPEED_PRESETS.map(p => ({
      value: p.value,
      label: p.label,
      title: this.limits.head ? `${headSpeedFor(p.value, this.limits.head)} mm/s` : undefined
    }))
  }

  get headPreset (): HeadSpeedPreset | null {
    return this.limits.head ? presetOf(this.defaultToolheadXYSpeed, this.limits.head) : null
  }

  setHeadPreset (preset: HeadSpeedPreset) {
    if (this.limits.head) this.save('defaultToolheadXYSpeed', headSpeedFor(preset, this.limits.head))
  }

  get toolheadXYMoveDistances (): number[] { return this.general.toolheadXYMoveDistances }
  get toolheadZMoveDistances (): number[] { return this.general.toolheadZMoveDistances }
  get zAdjustDistances (): number[] { return this.general.zAdjustDistances }
  get defaultToolheadXYSpeed (): number { return this.general.defaultToolheadXYSpeed }
  get defaultToolheadZSpeed (): number { return this.general.defaultToolheadZSpeed }
  get defaultExtrudeLength (): number { return this.general.defaultExtrudeLength }
  get defaultExtrudeSpeed (): number { return this.general.defaultExtrudeSpeed }
  get forceMoveToggleWarning (): boolean { return this.general.forceMoveToggleWarning }

  get printerSupportsForceMove (): boolean {
    return !!this.setting('force_move.enable_force_move')
  }

  /** An M1's Z is fixed (developer mode can still reverse X or Y); another printer may need any axis reversed. */
  get reversibleAxes (): Array<'x' | 'y' | 'z'> {
    return this.muon ? ['x', 'y'] : ['x', 'y', 'z']
  }

  inverted (axis: 'x' | 'y' | 'z'): boolean {
    return !!this.general.axis?.[axis]?.inverted
  }

  save (key: string, value: unknown) {
    this.$store.dispatch('config/saveByPath', {
      path: `uiSettings.general.${key}`,
      value,
      server: true
    })
  }

  /** Reversing an axis asks first; putting it back doesn't. */
  async onInvert (axis: 'x' | 'y' | 'z', event: Event) {
    const box = event.target as HTMLInputElement
    const checked = box.checked
    if (checked) {
      const name = axis.toUpperCase()
      const ok = await this.$confirm('Moves will go the other way.', { title: `Reverse ${name}?`, buttonTrueText: `Reverse ${name}` })
      if (!ok) {
        box.checked = false
        return
      }
    }
    this.save(`axis.${axis}.inverted`, checked)
  }

  handleReset () {
    const current = this.general
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general',
      value: {
        ...defaultState().uiSettings.general,
        instanceName: current.instanceName,
        chartVisible: current.chartVisible,
        hideTempWaits: current.hideTempWaits
      },
      server: true
    })
  }
}
</script>

<style lang="scss" scoped>
  .m3-sets__fieldset {
    display: contents;
    border: 0;
  }

  .mset__callout {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 16px;
    background: var(--m3d-surface);
    font-size: 13px;
  }

  .mset__value {
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .mset__locked {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 6px 0 10px;
  }

  .mset__note {
    margin: 0 4px;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }
</style>
