<template>
  <tile-shell
    tile="macros"
    title="Quick commands"
    icon="pulse"
    :menu="menu"
    class="mt"
  >
    <div
      v-if="chips.length"
      class="mt__chips"
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
        {{ m.title }}
      </button>
      <button
        type="button"
        class="mt__chip mt__chip--more"
        data-tid="macros-all"
        @click="dialog = true"
      >
        {{ size === 'S' ? 'All' : 'All commands' }}
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
import TileShell from './TileShell.vue'
import TileDialog from './TileDialog.vue'

/**
 * The macros people press most, as chips. One that needs a value asks for
 * it here. All of them, grouped, are in a dialog; managing which show, and
 * the console, are behind the three dots.
 */
@Component({ components: { TileShell, TileDialog, ControlMacros: () => import('@/components/control/ControlMacros.vue') } })
export default class MacrosTile extends Mixins(MacroRunMixin, OverviewMixin) {
  dialog = false

  /** Small shows the two most pressed, medium four, large seven. */
  get chips (): ShownMacro[] { return this.topMacroList(this.size === 'S' ? 2 : this.size === 'M' ? 4 : 7) }

  get menu (): TileMenuItem[] {
    return [
      { id: 'manage', label: 'Manage quick commands…', to: `${this.pagePath('/settings')}#macros` },
      { id: 'console', label: 'Open the console…', to: this.pagePath('/console') }
    ]
  }
}
</script>

<style lang="scss">
.mt__chips { display: flex; flex-wrap: wrap; gap: 8px; }
.mt__chip { display: inline-flex; align-items: center; height: 34px; padding: 0 14px; border-radius: 999px; background: var(--m3d-surface-2); color: var(--m3d-text); font-size: 13.5px; font-weight: 600; cursor: pointer; }
.mt__chip:hover:not(:disabled) { filter: brightness(1.12); }
.mt__chip:disabled { opacity: 0.45; cursor: default; }
.mt__chip--more { background: transparent; box-shadow: inset 0 0 0 1px var(--m3d-border-strong); color: var(--m3d-text-muted); }
.mt__form { padding-top: 12px; border-top: 1px solid var(--m3d-border); }
.mt__form h3 { margin: 0 0 4px; font-size: 14px; font-weight: 600; }
.mt__form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.mt .macros__field { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; margin: 10px 0; font-size: 13px; }
.mt .macros__field textarea { background: var(--m3d-surface-2); color: var(--m3d-text); padding: 6px 10px; border-radius: 8px; width: 140px; resize: none; }
</style>
