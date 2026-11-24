<template>
  <tile-shell
    tile="position"
    title="Position"
    icon="expand"
    :state="homedText"
    :tone="homed ? 'ok' : 'warm'"
    :class="['po', `po--${size}`]"
  >
    <template #head>
      <button
        type="button"
        class="po__motors"
        :disabled="!controlReady || busy"
        aria-label="Motors off"
        title="Turn the motors off (M84)"
        data-tid="motors-off"
        @click="motorsOff"
      >
        <frame-icon
          name="motorsOff"
          small
        />
      </button>
    </template>
    <span class="po__xyz">
      <span
        v-for="(a, i) in axes"
        :key="a"
        class="po__axis"
        :class="{ 'po__axis--off': !isHomed(a), 'po__axis--edit': editing === a }"
        data-tid="axis"
      >
        <span class="po__top">
          <span class="po__k">{{ a }}</span>
        </span>
        <span
          v-if="!isHomed(a)"
          class="po__nohome"
          data-tid="axis-not-homed"
        >not homed</span>
        <input
          v-else-if="editing === a"
          :ref="`edit-${a}`"
          v-model="draft"
          class="po__input"
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
          class="po__val"
          :disabled="!canEdit"
          :aria-label="`${a} ${shown(i)} millimetres. Press to type a new position`"
          :title="canEdit ? `Type where ${a} should go` : 'Not while the printer is busy'"
          :data-tid="`axis-edit-${a.toLowerCase()}`"
          @click="startEdit(a, i)"
        >
          <b>{{ shown(i) }}</b><small>mm</small>
        </button>
      </span>
    </span>
    <span
      v-if="invalid"
      class="po__err"
      role="status"
    >{{ editing }} goes from {{ axisMin[editIndex] }} to {{ axisMax[editIndex] }}</span>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import TileShell from './TileShell.vue'

/**
 * Where the head is, live, and whether it is homed. Press an axis to type a
 * number (it goes through moveTo: the same checks as the Trackpad); an axis that is
 * not homed says so (Home all is in the Trackpad header; KAN-5980). Motors off is the small icon in the
 * header. The endstops are not in a menu here any more.
 */
@Component({ components: { TileShell } })
export default class PositionTile extends Mixins(OverviewMixin) {
  readonly axes = ['X', 'Y', 'Z']
  editing = ''
  editIndex = 0
  draft = ''
  invalid = false

  @Watch('panelTarget')
  reset () { this.cancel() }

  get known (): boolean {
    const p = this.toolhead.position
    return Array.isArray(p) && p.slice(0, 3).every(Number.isFinite)
  }

  get homed (): boolean { return this.known && this.isHomed('XYZ') }

  get homedText (): string {
    if (this.homed) return 'Homed'
    return this.homedAxes ? `Homed ${this.homedAxes.split('').join(' ')}` : 'Not homed'
  }

  shown (i: number): string { return this.known ? this.position[i].toFixed(i === 2 ? 2 : 1) : '—' }

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
.po__xyz { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.po__axis { display: flex; flex-direction: column; justify-content: space-between; gap: 2px; min-width: 0; min-height: 52px; padding: 6px 8px 6px 10px; border-radius: 14px; background: var(--m3d-surface-2); }
.po__top { display: flex; align-items: center; justify-content: space-between; min-height: 24px; }
.po__k { color: var(--m3d-accent); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; }
.po__val { display: inline-flex; align-items: baseline; gap: 3px; margin: 0 -4px; padding: 2px 4px; border-radius: 8px; color: inherit; font: inherit; text-align: left; cursor: text; }
.po__val:hover:not(:disabled) { background: var(--m3d-fill); }
.po__val:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 1px; }
.po__val:disabled { cursor: default; }
.po__val b { font-family: var(--m3d-font-mono); font-size: 18px; font-weight: 500; font-variant-numeric: tabular-nums; }
.po__val small { color: var(--m3d-text-subtle); font-size: 11px; }
.po__axis--edit { box-shadow: inset 0 0 0 1.5px var(--m3d-accent); }
.po__input { width: 100%; min-width: 0; padding: 2px 4px; margin: 0 -4px; border-radius: 8px; background: var(--m3d-fill); color: var(--m3d-text); font-family: var(--m3d-font-mono); font-size: 18px; font-variant-numeric: tabular-nums; outline: none; }
.po__nohome { color: var(--m3d-warning); font-size: 12px; font-weight: 600; white-space: nowrap; }
.po--S .po__val small { display: none; }
.po--S .po__val b, .po--S .po__input { font-size: 16px; }
.po__motors { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 9px; background: var(--m3d-fill); color: var(--m3d-text-muted); cursor: pointer; }
.po__motors:hover:not(:disabled) { color: var(--m3d-text); filter: brightness(1.15); }
.po__motors:disabled { opacity: 0.45; cursor: default; }
.po__motors:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 2px; }
.po__err { color: var(--m3d-danger); font-size: 12px; font-weight: 600; }
</style>
