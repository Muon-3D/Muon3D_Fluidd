<template>
  <div
    class="hp"
    role="dialog"
    :aria-label="title + ' controls'"
    data-tid="heat-popover"
  >
    <div class="hp__top">
      <span class="hp__now">{{ temp }}°<small>now</small></span>
      <number-field
        :value="target"
        unit="°"
        :label="title + ' target'"
        :min="0"
        :max="max"
      />
    </div>
    <seg-picker
      :options="presets"
      :value="target"
      :label="title + ' presets'"
      accent
      fill
    />
    <div class="acct-menu hp__rows">
      <div class="acct-menu__item hp__row">
        <frame-icon
          name="pulse"
          small
        />Show on graph<toggle-switch
          :value="true"
          label="Show on graph"
          class="hp__toggle"
        />
      </div>
      <button
        v-for="r in rows"
        :key="r.t"
        type="button"
        class="acct-menu__item"
      >
        <frame-icon
          :name="r.i"
          small
        />{{ r.t }}<span
          v-if="r.k"
          class="acct-menu__key"
        >{{ r.k }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import NumberField from '@/components/control/NumberField.vue'
import SegPicker from '@/components/control/SegPicker.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'

export default {
  components: { NumberField, SegPicker, ToggleSwitch },
  props: { kind: { type: String, default: 'hotend' }, temp: { type: [String, Number], default: 0 }, target: { type: Number, default: 0 } },
  computed: {
    title () { return this.kind === 'bed' ? 'Bed' : 'Hotend' },
    max () { return this.kind === 'bed' ? 110 : 300 },
    presets () {
      return this.kind === 'bed'
        ? [{ value: 60, label: 'PLA 60' }, { value: 80, label: 'PETG 80' }, { value: 100, label: 'ABS 100' }, { value: 0, label: 'Off' }]
        : [{ value: 215, label: 'PLA 215' }, { value: 240, label: 'PETG 240' }, { value: 255, label: 'ABS 255' }, { value: 0, label: 'Off' }]
    },
    rows () {
      return this.kind === 'bed'
        ? [{ i: 'mesh', t: 'Bed mesh…' }, { i: 'settings', t: 'PID tune and limits…', k: 'max 110°' }, { i: 'clock', t: 'Wait until it reaches temperature' }]
        : [{ i: 'settings', t: 'PID tune and limits…', k: 'max 300°' }, { i: 'spool', t: 'Load or unload filament…' }, { i: 'snow', t: 'Cool down' }]
    }
  }
}
</script>

<style lang="scss" scoped>
.hp {
  position: absolute; top: calc(100% + 8px); left: 0; z-index: 8; display: flex; flex-direction: column; gap: 12px; width: 360px; max-width: calc(100vw - 32px); padding: 14px;
  border-radius: 22px; background: var(--m3d-surface); color: var(--m3d-text);
  box-shadow: var(--m3d-shadow-float), inset 0 0 0 1px var(--m3d-border-strong);
}
.hp__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.hp__now { font-family: var(--m3d-font-rounded); font-size: 30px; font-weight: 600; font-variant-numeric: tabular-nums; }
.hp__now small { margin-left: 6px; color: var(--m3d-text-muted); font-size: 12px; font-weight: 500; }
.hp__rows { padding: 0; }
.hp__row { cursor: default; }
.hp__toggle { margin-left: auto; }
</style>
