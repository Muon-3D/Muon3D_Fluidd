<template>
  <section
    class="ot sl"
    :class="`sl--${size}`"
    data-tile="statusline"
  >
    <div
      class="sl__group"
      role="group"
      aria-label="Temperatures"
    >
      <span
        class="sl__temp"
        data-tid="sl-hotend"
      >
        <frame-icon
          name="nozzle"
          small
        />
        <span class="sl__lbl">Hotend</span>
        <b>{{ heat(nozzle) }}</b><small v-if="goal(nozzle)">/ {{ goal(nozzle) }}</small>
      </span>
      <span
        class="sl__temp"
        data-tid="sl-bed"
      >
        <frame-icon
          name="thermometer"
          small
        />
        <span class="sl__lbl">Bed</span>
        <b>{{ heat(bed) }}</b><small v-if="goal(bed)">/ {{ goal(bed) }}</small>
      </span>
    </div>

    <span class="sl__rule" />

    <div
      class="sl__group sl__axes"
      role="group"
      aria-label="Position"
    >
      <span
        v-for="(a, i) in axes"
        :key="a"
        class="sl__axis"
        :class="{ 'sl__axis--off': !isHomed(a), 'sl__axis--edit': editing === a }"
        data-tid="axis"
      >
        <span class="sl__k">{{ a }}</span>
        <template v-if="!isHomed(a)">
          <span
            class="sl__nohome"
            data-tid="axis-not-homed"
          >not homed</span>
          <button
            type="button"
            class="sl__home"
            :disabled="!canHome"
            :aria-label="`Home ${a}`"
            :title="`Home ${a} (G28 ${a})`"
            :data-tid="`home-${a.toLowerCase()}`"
            @click="home(a)"
          >
            <v-progress-circular
              v-if="homing(a)"
              indeterminate
              size="12"
              width="2"
            />
            <frame-icon
              v-else
              name="home"
              small
            />
          </button>
        </template>
        <input
          v-else-if="editing === a"
          :ref="`edit-${a}`"
          v-model="draft"
          class="sl__input"
          type="text"
          inputmode="decimal"
          :aria-label="`${a} position`"
          :aria-invalid="invalid ? 'true' : undefined"
          :data-tid="`axis-input-${a.toLowerCase()}`"
          @keydown.enter.prevent="commit(i)"
          @keydown.esc.prevent="cancel"
          @blur="commit(i)"
        >
        <button
          v-else
          type="button"
          class="sl__val"
          :disabled="!canEdit"
          :aria-label="`${a} ${shown(i)} millimetres. Press to type a new position`"
          :title="canEdit ? `Type where ${a} should go` : 'Not while the printer is busy'"
          :data-tid="`axis-edit-${a.toLowerCase()}`"
          @click="startEdit(a, i)"
        >
          <b>{{ shown(i) }}</b><small>mm</small>
        </button>
      </span>
      <span
        v-if="invalid"
        class="sl__err"
        role="status"
      >{{ editing }} {{ axisMin[editIndex] }} to {{ axisMax[editIndex] }}</span>
    </div>

    <span class="sl__rule" />

    <div
      v-if="modes"
      class="sl__modes"
      role="radiogroup"
      aria-label="Print mode"
    >
      <button
        v-for="card in modes.cards"
        :key="card.id"
        type="button"
        role="radio"
        class="sl__mode"
        :class="{ 'sl__mode--on': card.id === modes.current }"
        :aria-checked="card.id === modes.current ? 'true' : 'false'"
        :disabled="!controlReady"
        :data-tid="`overview-mode-${card.id}`"
        @click="setMode(card.id)"
      >
        <frame-icon
          :name="card.icon"
          small
        />{{ card.label }}
      </button>
    </div>
    <span
      v-else
      class="sl__lbl"
      data-tid="mode-unavailable"
    >No print modes</span>

    <button
      type="button"
      class="sl__off"
      :disabled="!controlReady || busy"
      title="Turn the motors off (M84)"
      data-tid="motors-off"
      @click="motorsOff"
    >
      <frame-icon
        name="power"
        small
      />Motors off
    </button>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { printModeCommand, readPrintModes, type PrintModes } from '@/services/control/print-mode'
import type { Heater } from '@/store/printer/types'

/**
 * I-542 mock: the one line under the printer view. Hotend, bed, where the head
 * is, the print mode and Motors off. An axis box is typed into (it goes through
 * moveTo, so the same checks as the trackpad); an axis that is not homed says so
 * and carries its own small Home button, like the trackpad's.
 */
@Component({})
export default class StatusLineTile extends Mixins(OverviewMixin) {
  readonly axes = ['X', 'Y', 'Z']
  editing = ''
  editIndex = 0
  draft = ''
  invalid = false

  @Watch('panelTarget')
  reset () { this.cancel() }

  get modes (): PrintModes | null {
    const commands = this.$store.getters['printer/getAvailableCommands'] as Record<string, unknown> | undefined
    return readPrintModes(this.$store.state.printer.printer.fan_modes, commands)
  }

  setMode (mode: string) {
    const command = printModeCommand(mode, this.modes)
    if (!this.controlReady || !command || mode === this.modes?.current) return
    this.sendGcode(command)
  }

  heat (h: Heater | null): string { return h ? `${h.temperature.toFixed(1)}°` : '—' }
  goal (h: Heater | null): string { return h && h.target ? `${Math.round(h.target)}°` : '' }

  get known (): boolean {
    const p = this.toolhead.position
    return Array.isArray(p) && p.slice(0, 3).every(Number.isFinite)
  }

  shown (i: number): string { return this.known ? this.position[i].toFixed(i === 2 ? 2 : 1) : '—' }

  get canHome (): boolean { return this.controlReady && !this.busy }
  get canEdit (): boolean { return this.controlReady && !this.busy && this.known }

  startEdit (axis: string, i: number) {
    if (!this.canEdit) return
    this.editing = axis
    this.editIndex = i
    this.draft = this.position[i].toFixed(i === 2 ? 2 : 1)
    this.invalid = false
    this.$nextTick(() => {
      const el = (this.$refs[`edit-${axis}`] as HTMLInputElement[] | undefined)?.[0]
      el?.focus()
      el?.select()
    })
  }

  cancel () { this.editing = ''; this.invalid = false }

  commit (i: number) {
    if (!this.editing) return
    const axis = this.editing
    const value = Number(this.draft.replace(',', '.'))
    if (this.draft.trim() === '' || !Number.isFinite(value) || value < this.axisMin[i] || value > this.axisMax[i]) {
      this.invalid = true
      return
    }
    this.cancel()
    if (Math.abs(value - this.position[i]) >= 0.005) this.moveTo(axis === 'X' ? { X: value } : axis === 'Y' ? { Y: value } : { Z: value })
  }
}
</script>

<style lang="scss">
.sl { flex-direction: row; flex-wrap: wrap; align-items: center; gap: 10px 10px; padding: 10px 14px; min-height: 64px; }
.sl__group { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
@media (min-width: 1100px) { .sl { flex-wrap: nowrap; } .sl__group { flex-wrap: nowrap; } }
.sl__rule { align-self: stretch; width: 1px; margin: 4px 0; background: var(--m3d-border-strong, var(--m3d-fill)); }
.sl__lbl { color: var(--m3d-text-muted); font-size: 12px; font-weight: 600; }
.sl__temp { display: inline-flex; align-items: baseline; gap: 6px; padding: 7px 10px; border-radius: 14px; background: var(--m3d-surface-2); white-space: nowrap; }
.sl__temp .frame-icon { align-self: center; color: var(--m3d-text-muted); }
.sl__temp b { font-family: var(--m3d-font-mono); font-size: 17px; font-weight: 600; font-variant-numeric: tabular-nums; }
.sl__temp small { color: var(--m3d-text-muted); font-family: var(--m3d-font-mono); font-size: 12.5px; }
.sl__axes { gap: 6px; }
.sl__axis { display: inline-flex; align-items: center; gap: 4px; min-height: 40px; padding: 4px 6px 4px 10px; border-radius: 14px; background: var(--m3d-surface-2); }
.sl__k { color: var(--m3d-accent); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
.sl__val { display: inline-flex; align-items: baseline; gap: 4px; min-width: 0; padding: 4px 6px; border-radius: 10px; color: inherit; font: inherit; cursor: text; }
.sl__val:hover:not(:disabled) { background: var(--m3d-fill); }
.sl__val:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 1px; }
.sl__val:disabled { cursor: default; }
.sl__val b { font-family: var(--m3d-font-mono); font-size: 17px; font-weight: 500; font-variant-numeric: tabular-nums; }
.sl__val small { color: var(--m3d-text-subtle); font-size: 11px; }
.sl__axis--edit { box-shadow: inset 0 0 0 1.5px var(--m3d-accent); }
.sl__input { width: 78px; padding: 4px 8px; border-radius: 10px; background: var(--m3d-fill); color: var(--m3d-text); font-family: var(--m3d-font-mono); font-size: 17px; font-variant-numeric: tabular-nums; outline: none; }
.sl__nohome { padding: 2px 10px; border-radius: 999px; background: color-mix(in srgb, var(--m3d-warning) 16%, transparent); color: var(--m3d-warning); font-size: 12px; font-weight: 600; white-space: nowrap; }
.sl__home { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 10px; background: var(--m3d-fill); color: var(--m3d-text); cursor: pointer; }
.sl__home:hover:not(:disabled) { filter: brightness(1.15); }
.sl__home:disabled { opacity: 0.45; cursor: default; }
.sl__home:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 2px; }
.sl__err { color: var(--m3d-danger); font-size: 12px; font-weight: 600; }
.sl__modes { display: inline-flex; gap: 4px; padding: 4px; border-radius: 14px; background: var(--m3d-surface-2); }
.sl__mode { display: inline-flex; align-items: center; gap: 5px; min-height: 32px; padding: 0 9px; border-radius: 10px; color: var(--m3d-text-muted); font-size: 13px; font-weight: 600; cursor: pointer; }
.sl__mode--on { background: var(--m3d-accent); color: var(--m3d-on-accent, #00201e); }
.sl__mode:disabled { opacity: 0.6; cursor: default; }
.sl__off { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; margin-left: auto; padding: 0 12px; border-radius: 14px; background: var(--m3d-surface-2); color: var(--m3d-text); font-size: 13px; font-weight: 600; white-space: nowrap; cursor: pointer; }
.sl__off:hover:not(:disabled) { filter: brightness(1.15); }
.sl__off:disabled { opacity: 0.45; cursor: default; }
@media (max-width: 599px) {
  .sl { gap: 10px; }
  .sl__rule { display: none; }
  .sl__group, .sl__modes { width: 100%; }
  .sl__temp { flex: 1 1 0; justify-content: center; }
  .sl__axes { display: grid; grid-template-columns: 1fr; }
  .sl__axis { width: 100%; }
  .sl__mode { flex: 1 1 0; justify-content: center; }
  .sl__off { width: 100%; justify-content: center; margin-left: 0; }
}
</style>
