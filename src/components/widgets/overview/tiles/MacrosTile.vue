<template>
  <tile-shell
    tile="macros"
    title="Quick commands"
    icon="bolt"
    :menu="menu"
    :class="['mt', `mt--${size}`]"
  >
    <div
      v-if="tiles.length"
      class="mt__chips"
      :class="{ 'mt__chips--icons': iconOnly }"
      :style="grid"
      data-tid="macro-chips"
    >
      <button
        v-for="c in tiles"
        :key="c.key"
        type="button"
        class="mt__chip"
        :disabled="c.disabled"
        :title="c.tip"
        :aria-label="iconOnly ? c.title : undefined"
        :data-macro="c.key"
        data-tid="macro-chip"
        @click="c.go()"
      >
        <frame-icon :name="c.icon" />
        <span
          v-if="!iconOnly"
          class="mt__label"
        >{{ c.title }}</span>
      </button>
      <button
        type="button"
        class="mt__chip mt__chip--more"
        data-tid="macros-all"
        :aria-label="iconOnly ? 'All commands' : undefined"
        :title="iconOnly ? 'All commands' : undefined"
        @click="dialog = true"
      >
        <frame-icon name="list" />
        <span
          v-if="!iconOnly"
          class="mt__label"
        >{{ size === 'S' ? 'All' : 'All commands' }}</span>
      </button>
    </div>
    <p
      v-else
      class="ot__note"
    >
      No quick commands on this printer.
    </p>
    <p
      v-if="!controlReady && tiles.length"
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
import { type ShownMacro } from '@/mixins/macros'
import { QUICK_BUSY_BLOCKED, defaultQuick, quickSlots } from '@/services/overview/quick-defaults'
import type { TileMenuItem } from '@/services/overview/tiles'
import { macroIcon } from '@/services/macros/icon'
import TileShell from './TileShell.vue'
import TileDialog from './TileDialog.vue'

/**
 * Quick commands as the top bar's Quick actions: a line icon over the name
 * (KAN-2076). Which ones show is ticked on the Macros page's "Quick commands"
 * section (KAN-2122), else the best of each group. The tile grows with its
 * size (OV-29): XS is small icon-only buttons, so more fit; S, M and L show
 * more named buttons, and the buttons fill the tile to its floor. One that
 * needs a value asks for it here. All of them, grouped, are in a dialog.
 */
@Component({ components: { TileShell, TileDialog, ControlMacros: () => import('@/components/control/ControlMacros.vue') } })
export default class MacrosTile extends Mixins(MacroRunMixin, OverviewMixin) {
  dialog = false

  /** XS: icon-only. */
  get iconOnly (): boolean { return (this.size as string) === 'XS' }

  /** How many show besides All commands: XS 5, S 3, M 7, L 11 (a full row each with All commands). */
  get count (): number {
    return ({ XS: 5, S: 3, M: 7, L: 30 } as Record<string, number>)[this.size] ?? 7
  }

  get chips (): ShownMacro[] { return this.quickCommandList(this.count) }

  /** The tile's width, kept up to date (a ResizeObserver), so how many commands fit in a row follows it. */
  width = 1000
  private watcher: ResizeObserver | null = null

  mounted () {
    const el = this.$el as HTMLElement
    const measure = () => { const w = el.clientWidth - 36; if (w > 0) this.width = w }
    measure()
    if (typeof ResizeObserver === 'function') {
      this.watcher = new ResizeObserver(measure)
      this.watcher.observe(el)
    }
  }

  beforeDestroy () { this.watcher?.disconnect() }

  /** Names the printer has, upper case: its macros and the commands it lists. */
  get have (): Set<string> {
    const commands = Object.keys((this.$store.getters['printer/getAvailableCommands'] as Record<string, unknown>) ?? {})
    return new Set([...this.arrangedMacros.map(m => m.name), ...commands].map(n => n.toUpperCase()))
  }

  /** L is the full-width row: exactly two rows, as many as fit, the last place always All commands. A person's own picks (Settings, Macros) win over the default set. */
  get slots (): { perRow: number; shown: number } {
    const total = this.quickCommandPicks === null ? defaultQuick(this.have).length : this.quickCommandList(30).length
    return quickSlots(this.width, total)
  }

  get grid (): Record<string, string> | undefined {
    return this.size === 'L' ? { '--per': String(this.slots.perRow) } : undefined
  }

  /** What the buttons are: for L the default set (or the picks) cut to the width, else the old automatic pick. */
  get tiles (): Array<{ key: string, title: string, icon: string, tip: string, disabled: boolean, go: () => void }> {
    const ready = this.controlReady
    const ofMacro = (m: ShownMacro) => ({ key: m.name, title: m.title, icon: this.iconOf(m), tip: this.tooltipOf(m), disabled: !ready || (m.disabledWhilePrinting && this.busy), go: () => this.run(m) })
    if (this.size !== 'L') return this.chips.map(ofMacro)
    if (this.quickCommandPicks !== null) return this.quickCommandList(this.slots.shown).map(ofMacro)
    return defaultQuick(this.have).slice(0, this.slots.shown).map(d => {
      const macro = this.arrangedMacros.find(m => m.name === d.found)
      const send = d.gcode ?? d.found
      const go = macro && !d.gcode ? () => this.run(macro) : () => { this.sendTypedGcode(send) }
      return { key: d.id, title: d.title, icon: d.icon, tip: d.gcode ? `${d.title} (${d.gcode})` : d.found, disabled: !ready || (this.busy && (QUICK_BUSY_BLOCKED.has(d.id) || !!macro?.disabledWhilePrinting)), go }
    })
  }

  /** The icon for a macro: by what its name says it does, else the bolt. */
  iconOf (m: ShownMacro): string { return macroIcon(m.name) }

  get menu (): TileMenuItem[] {
    return [
      // KAN-2122: managing which show is the Macros page's job, so the button is named for it.
      { id: 'manage', label: 'Manage in Macros…', to: `${this.pagePath('/settings')}#macros` },
      { id: 'console', label: 'Open the console…', to: this.pagePath('/console') }
    ]
  }
}</script>

<style lang="scss">
/* OV-29: the tile reaches its floor; the buttons share the height. */
.mt > .ot__door { flex: 1 1 auto; }
.mt__chips { display: grid; flex: 1 1 auto; grid-template-columns: repeat(auto-fit, minmax(104px, 1fr)); grid-auto-rows: minmax(64px, 1fr); gap: 10px; }
.mt--L .mt__chips { grid-template-columns: repeat(var(--per, 8), minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(76px, 1fr)); }
.mt--L .mt__label { font-size: 14px; }
.mt--L .mt__chip .frame-icon { width: 26px; height: 26px; }
.mt--M .mt__chips { grid-template-columns: repeat(8, minmax(0, 1fr)); }
.mt--S .mt__chips { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.mt--XS .mt__chips { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-auto-rows: minmax(40px, 1fr); gap: 6px; }
.mt__chip { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; min-width: 0; padding: 10px 6px; border-radius: 14px; background: var(--m3d-surface-2); color: var(--m3d-text); text-align: center; cursor: pointer; }
.mt__chips--icons .mt__chip { padding: 6px; border-radius: 12px; }
.mt__chip .frame-icon { width: 22px; height: 22px; color: var(--m3d-text-muted); }
.mt__chips--icons .mt__chip .frame-icon { width: 20px; height: 20px; }
.mt__chip:hover:not(:disabled) { background: color-mix(in srgb, var(--m3d-surface-2) 82%, #fff); }
.mt__chip:hover:not(:disabled) .frame-icon { color: var(--m3d-text); }
.mt__chip:focus-visible { outline: 2px solid var(--m3d-focus-ring, var(--m3d-accent)); outline-offset: 2px; }
.mt__chip:disabled { opacity: 0.45; cursor: default; }
.mt__label { display: -webkit-box; max-width: 100%; overflow: hidden; font-size: 12.5px; font-weight: 600; line-height: 1.2; text-overflow: ellipsis; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.mt__chip--more { background: transparent; box-shadow: inset 0 0 0 1px var(--m3d-border-strong); }
.mt__chip--more .mt__label { color: var(--m3d-text-muted); }
@media (max-width: 599px) {
  .mt--M .mt__chips { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .mt--XS .mt__chips { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .mt__chip { padding: 8px 4px; }
  .mt__label { font-size: 11.5px; }
}
.mt__form { padding-top: 12px; border-top: 1px solid var(--m3d-border); }
.mt__form h3 { margin: 0 0 4px; font-size: 14px; font-weight: 600; }
.mt__form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.mt .macros__field { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; margin: 10px 0; font-size: 13px; }
.mt .macros__field textarea { background: var(--m3d-surface-2); color: var(--m3d-text); padding: 6px 10px; border-radius: 8px; width: 140px; resize: none; }
</style>
