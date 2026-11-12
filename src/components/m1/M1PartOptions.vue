<template>
  <div
    class="m1-opts"
    :data-tid="`m1-options-${part}`"
  >
    <!-- Toolhead: move (the pad, back at the top as seen from above), heat the nozzle, load and unload. -->
    <template v-if="part === 'toolhead'">
      <section
        class="m1-opts__group"
        aria-label="Move"
      >
        <span class="m1-opts__title"><frame-icon
          name="control"
          small
        />Move</span>
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
              :title="b.label"
              :disabled="!!moveLock && b.id !== 'home'"
              :data-tid="`m1-pad-${b.id}`"
              @click="b.run()"
            >
              <frame-icon
                :name="b.icon"
                small
              />
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
      </section>
      <section
        class="m1-opts__group"
        aria-label="Heat the nozzle"
      >
        <span class="m1-opts__title"><frame-icon
          name="thermometer"
          small
        />Heat the nozzle</span>
        <div class="m1-opts__row">
          <button
            v-for="m in heatChoices"
            :key="m.name"
            type="button"
            class="m1-opts__chip"
            :data-tid="`m1-heat-${m.name}`"
            @click="heatNozzle(m)"
          >
            <frame-icon
              name="flame"
              small
            />
            {{ m.name }} {{ m.nozzle }}°
          </button>
          <button
            type="button"
            class="m1-opts__chip"
            data-tid="m1-heat-off"
            @click="nozzleOff"
          >
            <frame-icon
              name="snow"
              small
            />
            Off
          </button>
        </div>
      </section>
      <section
        class="m1-opts__group"
        aria-label="Filament"
      >
        <span class="m1-opts__title"><frame-icon
          name="spool"
          small
        />Filament</span>
        <div class="m1-opts__row">
          <button
            type="button"
            class="m1-opts__btn"
            :disabled="loadPlan.kind === 'none'"
            :title="loadPlan.kind === 'none' ? loadPlan.reason : ''"
            data-tid="m1-load"
            @click="runFilamentPlan('load')"
          >
            <frame-icon
              name="download"
              small
            />
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
            <frame-icon
              name="upload"
              small
            />
            Unload
          </button>
        </div>
      </section>
    </template>

    <!-- Plate: up and down as it physically moves, home, and a bed mesh. -->
    <template v-else-if="part === 'plate'">
      <section
        class="m1-opts__group"
        aria-label="Move"
      >
        <span class="m1-opts__title"><frame-icon
          name="control"
          small
        />Move</span>
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
            <frame-icon
              name="chevronUp"
              small
            />
            Plate up
          </button>
          <button
            type="button"
            class="m1-opts__btn"
            :disabled="!!zLock"
            data-tid="m1-plate-down"
            @click="moveBy('Z', -zStep)"
          >
            <frame-icon
              name="chevronDown"
              small
            />
            Plate down
          </button>
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
      </section>
      <section
        class="m1-opts__group"
        aria-label="Set up"
      >
        <span class="m1-opts__title"><frame-icon
          name="maintenance"
          small
        />Set up</span>
        <div class="m1-opts__row">
          <button
            type="button"
            class="m1-opts__btn"
            data-tid="m1-home"
            @click="home()"
          >
            <frame-icon
              name="home"
              small
            />
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
            <frame-icon
              name="mesh"
              small
            />
            Bed mesh
          </button>
        </div>
      </section>
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
          <frame-icon
            name="monitor"
            small
          />
          Use the printer's screen
        </button>
      </div>
    </template>

    <!-- Filament: change, load, unload and what is loaded, through the same plans as the Filament box. -->
    <template v-else-if="part === 'filament'">
      <section
        class="m1-opts__group"
        aria-label="Filament"
      >
        <span class="m1-opts__title"><frame-icon
          name="spool"
          small
        />Filament</span>
        <div class="m1-opts__row">
          <button
            type="button"
            class="m1-opts__btn"
            :disabled="changePlan.kind === 'none'"
            :title="changePlan.kind === 'none' ? changePlan.reason : ''"
            data-tid="m1-change"
            @click="changeFilament"
          >
            <frame-icon
              name="refresh"
              small
            />
            Change
          </button>
          <button
            type="button"
            class="m1-opts__btn"
            :disabled="loadPlan.kind === 'none'"
            :title="loadPlan.kind === 'none' ? loadPlan.reason : ''"
            data-tid="m1-load"
            @click="runFilamentPlan('load')"
          >
            <frame-icon
              name="download"
              small
            />
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
            <frame-icon
              name="upload"
              small
            />
            Unload
          </button>
        </div>
      </section>
      <section
        class="m1-opts__group"
        aria-label="Material"
      >
        <span class="m1-opts__title"><frame-icon
          name="bulb"
          small
        />Material</span>
        <div class="m1-opts__row">
          <material-picker ref="picker">
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
      </section>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import FrameIcon from '@/components/ui/FrameIcon.vue'
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
@Component({ components: { FrameIcon, MaterialPicker } })
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
      { id: 'n', icon: 'chevronUp', label: 'Head back', run: () => this.moveBy('Y', back * step()) },
      { id: 'w', icon: 'chevronLeft', label: 'Head left (X−)', run: () => this.moveBy('X', -step()) },
      { id: 'home', icon: 'home', label: 'Home all', run: () => this.home() },
      { id: 'e', icon: 'chevronRight', label: 'Head right (X+)', run: () => this.moveBy('X', step()) },
      { id: 's', icon: 'chevronDown', label: 'Head forward', run: () => this.moveBy('Y', -back * step()) }
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

  /**
   * As the Filament box does it: mid-print, M600 after its confirm (through
   * runFilamentPlan); idle, the material panel opens and nothing is sent.
   */
  async changeFilament () {
    if (this.changePlan.kind === 'panel') {
      const picker = this.$refs.picker as unknown as { open: boolean } | undefined
      if (picker) this.$nextTick(() => { picker.open = true })
      return
    }
    await this.runFilamentPlan('change')
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
    gap: 10px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgb(255 255 255 / 8%);
    pointer-events: auto;
  }

  /* One group per kind of action: a quiet caption, then its buttons. */
  .m1-opts__group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .m1-opts__title {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #98989d;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    white-space: nowrap;

    &:hover:not(:disabled) {
      background: rgb(118 118 128 / 36%);
    }

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
