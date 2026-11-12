<template>
  <tile-shell
    tile="macros"
    title="Quick commands"
    icon="bolt"
    :menu="menu"
    :class="['mt', `mt--${size}`]"
  >
    <div
      v-if="chips.length"
      class="mt__chips"
      data-tid="macro-chips"
    >
      <button
        v-for="m in chips"
        :key="m.name"
        type="button"
        class="mt__chip"
        :disabled="!controlReady || (m.disabledWhilePrinting && busy)"
        :title="tooltipOf(m)"
        :data-macro="m.name"
        data-tid="macro-chip"
        @click="run(m)"
      >
        <frame-icon :name="iconOf(m)" />
        <span class="mt__label">{{ m.title }}</span>
      </button>
      <button
        type="button"
        class="mt__chip mt__chip--more"
        data-tid="macros-all"
        @click="dialog = true"
      >
        <frame-icon name="list" />
        <span class="mt__label">{{ size === 'S' ? 'All' : 'All commands' }}</span>
      </button>
    </div>
    <p
      v-else
      class="ot__note"
    >
      No quick commands on this printer.
    </p>
    <p
      v-if="!controlReady && chips.length"
      class="ot__lock"
    >
      {{ controlLock }}
    </p>

    <form
      v-if="selected"
      class="macros__values mt__form"
      data-tid="macro-send"
      aria-label="Quick command values"
      @submit.prevent="submitMacro"
    >
      <h3>{{ selected.title }}</h3>
      <label
        v-for="field in fields"
        :key="field.name"
        class="macros__field"
      >
        <span>{{ field.name }} · {{ field.optional ? 'optional' : 'required' }}</span>
        <textarea
          v-model="values[field.name]"
          rows="1"
          :aria-label="`Value ${field.name}`"
          autocomplete="off"
        />
      </label>
      <p>Sends <code>{{ preview || 'check the values' }}</code></p>
      <p
        v-if="formError || commandRefusal"
        role="alert"
      >
        {{ formError || commandRefusal }}
      </p>
      <div class="mt__form-actions">
        <button
          type="button"
          class="cbtn"
          @click="selected = null"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="cbtn cbtn--primary"
          :disabled="!controlReady"
        >
          Run
        </button>
      </div>
    </form>

    <tile-dialog
      :value="dialog"
      title="All quick commands"
      max-width="860"
      @close="dialog = false"
    >
      <control-macros />
    </tile-dialog>
  </tile-shell>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MacroRunMixin from '@/mixins/macro-run'
import OverviewMixin from '@/mixins/overview'
import type { ShownMacro } from '@/mixins/macros'
import type { TileMenuItem } from '@/services/overview/tiles'
import { macroIcon } from '@/services/macros/icon'
import TileShell from './TileShell.vue'
import TileDialog from './TileDialog.vue'

/**
 * The macros people press most, as the buttons of the top bar's Quick
 * actions: a line icon over the name (KAN-2076). The tile is a full row
 * across the page. One that needs a value asks for it here. All of them, grouped, are in a dialog; managing which show, and
 * the console, are behind the three dots.
 */
@Component({ components: { TileShell, TileDialog, ControlMacros: () => import('@/components/control/ControlMacros.vue') } })
export default class MacrosTile extends Mixins(MacroRunMixin, OverviewMixin) {
  dialog = false

  /** Small shows the two most pressed, medium five, large seven (a full row with All commands). */
  get chips (): ShownMacro[] { return this.topMacroList(this.size === 'S' ? 2 : this.size === 'M' ? 5 : 7) }

  /** The icon for a macro: by what its name says it does, else the bolt. */
  iconOf (m: ShownMacro): string { return macroIcon(m.name) }

  get menu (): TileMenuItem[] {
    return [
      { id: 'manage', label: 'Manage quick commands…', to: `${this.pagePath('/settings')}#macros` },
      { id: 'console', label: 'Open the console…', to: this.pagePath('/console') }
    ]
  }
}
</script>

<style lang="scss">
.mt__chips { display: grid; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); gap: 10px; }
.mt--L .mt__chips { grid-template-columns: repeat(8, minmax(0, 1fr)); }
.mt--M .mt__chips { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.mt--S .mt__chips { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.mt__chip { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; min-width: 0; min-height: 76px; padding: 10px 6px; border-radius: 14px; background: var(--m3d-surface-2); color: var(--m3d-text); text-align: center; cursor: pointer; }
.mt__chip .frame-icon { width: 22px; height: 22px; color: var(--m3d-text-muted); }
.mt__chip:hover:not(:disabled) { background: color-mix(in srgb, var(--m3d-surface-2) 82%, #fff); }
.mt__chip:hover:not(:disabled) .frame-icon { color: var(--m3d-text); }
.mt__chip:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 2px; }
.mt__chip:disabled { opacity: 0.45; cursor: default; }
.mt__label { display: -webkit-box; max-width: 100%; overflow: hidden; font-size: 12.5px; font-weight: 600; line-height: 1.2; text-overflow: ellipsis; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.mt__chip--more { background: transparent; box-shadow: inset 0 0 0 1px var(--m3d-border-strong); }
.mt__chip--more .mt__label { color: var(--m3d-text-muted); }
@media (max-width: 599px) {
  .mt--L .mt__chips, .mt--M .mt__chips { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .mt__chip { min-height: 70px; padding: 8px 4px; }
  .mt__label { font-size: 11.5px; }
}
.mt__form { padding-top: 12px; border-top: 1px solid var(--m3d-border); }
.mt__form h3 { margin: 0 0 4px; font-size: 14px; font-weight: 600; }
.mt__form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.mt .macros__field { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; margin: 10px 0; font-size: 13px; }
.mt .macros__field textarea { background: var(--m3d-surface-2); color: var(--m3d-text); padding: 6px 10px; border-radius: 8px; width: 140px; resize: none; }
</style>
