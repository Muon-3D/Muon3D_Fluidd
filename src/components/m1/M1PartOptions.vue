<template>
  <div
    class="m1-opts"
    :data-tid="`m1-options-${part}`"
  >
    <!-- Toolhead: the pad (back at the top, as seen from above), heat, load and unload. -->
    <template v-if="part === 'toolhead'">
      <div class="m1-opts__move">
        <div
          class="m1-opts__pad"
          :title="moveLock"
        >
          <button
            v-for="b in pad"
            :key="b.id"
            type="button"
            :class="`m1-opts__pad-${b.id}`"
            :aria-label="b.label"
            :disabled="!!moveLock && b.id !== 'home'"
            :data-tid="`m1-pad-${b.id}`"
            @click="b.run()"
          >
            {{ b.text }}
          </button>
        </div>
        <div
          class="m1-opts__seg"
          role="radiogroup"
          aria-label="Step"
        >
          <button
            v-for="s in xySteps"
            :key="s"
            type="button"
            role="radio"
            :aria-checked="step === s ? 'true' : 'false'"
            :class="{ on: step === s }"
            @click="step = s"
          >
            {{ s }} mm
          </button>
        </div>
      </div>
      <div class="m1-opts__row">
        <button
          v-for="m in heatChoices"
          :key="m.name"
          type="button"
          class="m1-opts__chip"
          :data-tid="`m1-heat-${m.name}`"
          @click="heatNozzle(m)"
        >
          {{ m.name }} {{ m.nozzle }}°
        </button>
        <button
          type="button"
          class="m1-opts__chip"
          data-tid="m1-heat-off"
          @click="nozzleOff"
        >
          Off
        </button>
      </div>
      <div class="m1-opts__row">
        <button
          type="button"
          class="m1-opts__btn"
          :disabled="loadPlan.kind === 'none'"
          :title="loadPlan.kind === 'none' ? loadPlan.reason : ''"
          data-tid="m1-load"
          @click="runFilamentPlan('load')"
        >
          Load
        </button>
        <button
          type="button"
          class="m1-opts__btn"
          :disabled="unloadPlan.kind === 'none'"
          :title="unloadPlan.kind === 'none' ? unloadPlan.reason : ''"
          data-tid="m1-unload"
          @click="runFilamentPlan('unload')"
        >
          Unload
        </button>
      </div>
    </template>

    <!-- Plate: up and down as it physically moves, home, and a bed mesh. -->
    <template v-else-if="part === 'plate'">
      <div class="m1-opts__row">
        <div
          class="m1-opts__seg"
          role="radiogroup"
          aria-label="Step"
        >
          <button
            v-for="s in zSteps"
            :key="s"
            type="button"
            role="radio"
            :aria-checked="zStep === s ? 'true' : 'false'"
            :class="{ on: zStep === s }"
            @click="zStep = s"
          >
            {{ s }} mm
          </button>
        </div>
      </div>
      <div
        class="m1-opts__row"
        :title="zLock"
      >
        <button
          type="button"
          class="m1-opts__btn"
          :disabled="!!zLock"
          data-tid="m1-plate-up"
          @click="moveBy('Z', zStep)"
        >
          Plate up
        </button>
        <button
          type="button"
          class="m1-opts__btn"
          :disabled="!!zLock"
          data-tid="m1-plate-down"
          @click="moveBy('Z', -zStep)"
        >
          Plate down
        </button>
      </div>
      <div class="m1-opts__row">
        <button
          type="button"
          class="m1-opts__btn"
          data-tid="m1-home"
          @click="home()"
        >
          Home
        </button>
        <button
          type="button"
          class="m1-opts__btn"
          :disabled="!meshRow || !!checksBlocked"
          :title="checksBlocked"
          data-tid="m1-mesh"
          @click="meshRow && runCheck(meshRow)"
        >
          Run a bed mesh
        </button>
      </div>
    </template>

    <!-- Screen: use the printer's own screen from here, when Control serves it (/panel/). -->
    <template v-else-if="part === 'screen'">
      <div class="m1-opts__row">
        <button
          type="button"
          class="m1-opts__btn"
          data-tid="m1-use-screen"
          @click="$emit('use-screen')"
        >
          Use the printer's screen
        </button>
      </div>
    </template>

    <!-- Filament: load, unload and what is loaded, as the filament panel does it. -->
    <template v-else-if="part === 'filament'">
      <div class="m1-opts__row">
        <button
          type="button"
          class="m1-opts__btn"
          :disabled="loadPlan.kind === 'none'"
          :title="loadPlan.kind === 'none' ? loadPlan.reason : ''"
          data-tid="m1-load"
          @click="runFilamentPlan('load')"
        >
          Load
        </button>
        <button
          type="button"
          class="m1-opts__btn"
          :disabled="unloadPlan.kind === 'none'"
          :title="unloadPlan.kind === 'none' ? unloadPlan.reason : ''"
          data-tid="m1-unload"
          @click="runFilamentPlan('unload')"
        >
          Unload
        </button>
      </div>
      <div class="m1-opts__row">
        <material-picker>
          <template #activator="{ on, attrs, disabled }">
            <button
              type="button"
              class="m1-opts__chip"
              :disabled="disabled"
              aria-haspopup="listbox"
              data-tid="m1-material"
              v-bind="attrs"
              v-on="on"
            >
              <span
                class="m1-opts__swatch"
                :style="{ background: loadedColour || (loadedMaterial ? loadedMaterial.colour : 'transparent') }"
              />
              {{ loadedMaterial ? loadedMaterial.name : 'Material and colour' }}
            </button>
          </template>
        </material-picker>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import FilamentActionsMixin from '@/mixins/filament-actions'
import MaterialPicker from '@/components/overview/MaterialPicker.vue'
import { Y_BACK } from '@/services/machine/orientation'
import type { CheckRow } from '@/mixins/maintenance'
import type { MaterialChoice } from '@/services/control/model'
import type { PartId } from '@/services/m1-3d/parts'

/**
 * A selected part's options on the Overview's 3D M1 (control-mockups/v3/
 * overview-3d, Jack's OK 6 Nov). Every button calls what Control's own
 * buttons call: home, setHeater, moveBy (each move through
 * the no-go planner, the shared hand-move lock and its waits), the
 * Maintenance bed-mesh check, and the LOAD_FILAMENT / UNLOAD_FILAMENT macros
 * the filament panel runs. Nothing here builds G-code of its own, and none
 * of it asks to confirm: Jack (6 Nov) keeps confirms for AI agents, not people.
 * Only shown on an idle printer the person can control (M1Parts).
 */
@Component({ components: { MaterialPicker } })
export default class M1PartOptions extends Mixins(MaintenanceMixin, FilamentActionsMixin) {
  @Prop({ type: String, required: true })
  readonly part!: PartId

  readonly xySteps = [1, 10, 50]
  readonly zSteps = [1, 10]
  step = 10
  zStep = 1

  /** Why the head can't be moved by hand now, or ''. */
  get moveLock (): string {
    if (!this.controlReady) return this.controlLock
    if (!this.isHomed('XY')) return 'Home the printer first.'
    return ''
  }

  get zLock (): string {
    if (!this.controlReady) return this.controlLock
    if (!this.isHomed('Z')) return 'Home the printer first.'
    return ''
  }

  /** Up is the back of the machine, as on Control's pad. */
  get pad () {
    const back = Y_BACK
    const step = () => this.step
    return [
      { id: 'n', text: '↑', label: 'Head back', run: () => this.moveBy('Y', back * step()) },
      { id: 'w', text: '←', label: 'Head left (X−)', run: () => this.moveBy('X', -step()) },
      { id: 'home', text: '⌂', label: 'Home all', run: () => this.home() },
      { id: 'e', text: '→', label: 'Head right (X+)', run: () => this.moveBy('X', step()) },
      { id: 's', text: '↓', label: 'Head forward', run: () => this.moveBy('Y', -back * step()) }
    ]
  }

  /** The materials to heat for: those with a nozzle temperature, the first three. */
  get heatChoices (): MaterialChoice[] {
    return this.materialChoices.filter(m => m.nozzle !== null).slice(0, 3)
  }

  get meshRow (): CheckRow | undefined {
    return this.checks.find(c => c.id === 'bedMesh')
  }

  /** On the toolhead a chip heats the nozzle only, to the material's temperature; the bed is the plate's. */
  heatNozzle (m: MaterialChoice) {
    if (this.busy || m.nozzle === null) return
    if (this.refuseTooHot(m.name, m.nozzle)) return
    this.setHeater(this.nozzle, m.nozzle)
  }

  nozzleOff () {
    if (this.busy) return
    this.setHeater(this.nozzle, 0)
  }
}
</script>

<style lang="scss" scoped>
  .m1-opts {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;
    pointer-events: auto;
  }

  .m1-opts__row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .m1-opts__btn,
  .m1-opts__chip,
  .m1-opts__seg button,
  .m1-opts__pad button {
    height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgb(118 118 128 / 24%);
    color: #f5f5f7;
    font-size: 12px;
    font-weight: 600;

    &:disabled {
      opacity: 0.4;
    }

    &:focus-visible {
      outline: 2px solid #80d6d1;
      outline-offset: 2px;
    }

    &.on {
      background: rgb(128 214 209 / 18%);
      color: #80d6d1;
    }
  }

  .m1-opts__btn {
    flex: 1;
  }

  .m1-opts__move {
    display: flex;
    align-items: center;
    gap: 10px;

    .m1-opts__seg {
      flex-direction: column;
    }
  }

  .m1-opts__seg {
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    border-radius: 10px;
    background: rgb(118 118 128 / 14%);

    button {
      height: 26px;
      border-radius: 8px;
      background: transparent;
    }
  }

  .m1-opts__pad {
    display: grid;
    grid-template-columns: repeat(3, 32px);
    grid-template-rows: repeat(3, 26px);
    gap: 3px;

    button {
      padding: 0;
      border-radius: 8px;
      font-size: 14px;
    }
  }

  .m1-opts__pad-n { grid-area: 1 / 2; }
  .m1-opts__pad-w { grid-area: 2 / 1; }
  .m1-opts__pad-home { grid-area: 2 / 2; }
  .m1-opts__pad-e { grid-area: 2 / 3; }
  .m1-opts__pad-s { grid-area: 3 / 2; }

  .m1-opts__swatch {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 4px;
    border-radius: 50%;
  }
</style>
