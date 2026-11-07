<template>
  <div
    id="console"
    class="m3-sets cset"
    data-tid="console-settings"
  >
    <section
      class="m3-set"
      data-tid="console-settings-quick"
    >
      <h2 class="m3-set__title">
        Quick commands · {{ quick.length }}
      </h2>
      <div class="m3-set__row">
        <app-draggable
          v-model="quickOrder"
          class="cset__chips"
          :options="{ animation: 150, forceFallback: true, fallbackTolerance: 4, draggable: '.cset__chip:not(.cset__add)', ghostClass: 'cset__chip--ghost' }"
          role="list"
          aria-label="Quick commands"
        >
          <button
            v-for="(q, i) in quick"
            :key="q.id"
            type="button"
            role="listitem"
            class="cset__chip"
            :title="q.label ? q.command : ''"
            :aria-label="`${chipText(q)}. Double-click to edit; Alt and an arrow key moves it.`"
            :data-tid="`console-settings-chip-${q.command}`"
            @dblclick="editQuick(q)"
            @keydown.enter.prevent="editQuick(q)"
            @keydown.alt.left.prevent="moveQuick(i, i - 1)"
            @keydown.alt.right.prevent="moveQuick(i, i + 1)"
          >
            <span
              class="cset__grip"
              aria-hidden="true"
            ><i /><i /><i /><i /></span>
            {{ chipText(q) }}
          </button>
          <button
            type="button"
            class="cset__chip cset__add"
            data-tid="console-settings-add-quick"
            :disabled="!quickKey"
            @click="editQuick(null)"
          >
            <frame-icon
              name="plus"
              small
            />
            Add
          </button>
        </app-draggable>
      </div>
      <p
        v-if="!quickKey"
        class="cset__help"
        data-tid="console-settings-quick-loading"
      >
        Loading your account…
      </p>
      <p
        v-else
        class="cset__help"
      >
        Shown as chips above the console input. Drag to reorder; double-click to edit. Saved for you on this printer.
      </p>
    </section>

    <section class="m3-set">
      <h2 class="m3-set__title">
        Showing
      </h2>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Times on each line</b>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="config.timestamps"
            label="Times on each line"
            @input="setConfig('timestamps', $event)"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Temperature reports</b>
          <span>The "ok T:210 /210" lines a print sends every second.</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="!hideTempWaits"
            label="Temperature reports"
            @input="hideTempWaits = !$event"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Newest at</b>
        </div>
        <div class="m3-set__control">
          <seg-picker
            :value="flipLayout ? 'top' : 'bottom'"
            :options="[{ value: 'bottom', label: 'Bottom' }, { value: 'top', label: 'Top' }]"
            label="Newest at"
            @input="flipLayout = $event === 'top'"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Lines kept</b>
          <span>Older lines are still in the printer's log.</span>
        </div>
        <div class="m3-set__control">
          <seg-picker
            :value="config.linesKept"
            :options="linesKept"
            label="Lines kept"
            @input="setConfig('linesKept', $event)"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Text size</b>
        </div>
        <div class="m3-set__control">
          <seg-picker
            :value="config.textSize"
            :options="[{ value: 'sm', label: 'S', title: 'Small' }, { value: 'md', label: 'M', title: 'Medium' }, { value: 'lg', label: 'L', title: 'Large' }]"
            label="Text size"
            @input="setConfig('textSize', $event)"
          />
        </div>
      </div>
    </section>

    <section
      class="m3-set"
      data-tid="console-settings-filters"
    >
      <h2 class="m3-set__title">
        Hide lines · {{ filters.length }}
      </h2>
      <div
        v-for="f in filters"
        :key="f.id"
        class="m3-set__row cset__filter"
        :data-tid="`console-filter-${f.name}`"
        @click="editFilter(f)"
      >
        <div class="m3-set__label">
          <b>{{ f.name }}</b>
          <span class="cset__mono">{{ describe(f) }}</span>
        </div>
        <div
          class="m3-set__control cset__filter-ctl"
          @click.stop
        >
          <toggle-switch
            :value="f.enabled"
            :label="`Hide ${f.name}`"
            @input="setFilterEnabled(f, $event)"
          />
          <button
            type="button"
            class="cset__go"
            :aria-label="`Edit ${f.name}`"
            @click="editFilter(f)"
          >
            <frame-icon
              name="chevronRight"
              small
            />
          </button>
        </div>
      </div>
      <button
        type="button"
        class="m3-set__row cset__addrow"
        data-tid="console-add-filter"
        @click="editFilter(null)"
      >
        <span class="cset__ico"><frame-icon
          name="plus"
          small
        /></span>
        <span class="cset__grow">Add a filter</span>
        <frame-icon
          name="chevronRight"
          small
        />
      </button>
    </section>

    <section class="m3-set">
      <h2 class="m3-set__title">
        Typing
      </h2>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Suggest commands as you type</b>
          <span>From the printer's own command list and macros, with their help text.</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="config.suggest"
            label="Suggest commands as you type"
            @input="setConfig('suggest', $event)"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Enter sends</b>
          <span>Off: Enter adds a line; Ctrl Enter sends. Useful for pasting several lines.</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="config.enterSends"
            label="Enter sends"
            @input="setConfig('enterSends', $event)"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Remember what I typed</b>
          <span>Up arrow brings back earlier commands.</span>
        </div>
        <div class="m3-set__control">
          <seg-picker
            :value="config.historyCount"
            :options="historyCounts"
            label="Remember what I typed"
            @input="setConfig('historyCount', $event)"
          />
        </div>
      </div>
    </section>

    <router-link
      v-if="accessTo"
      :to="accessTo"
      class="cset__link"
      data-tid="console-settings-access"
    >
      <frame-icon name="user" />
      <span class="cset__grow"><b>Who may type commands</b> is set per person in People and access.</span>
      <span class="cset__link-go">People and access ›</span>
    </router-link>

    <quick-command-dialog
      v-model="quickOpen"
      :quick="quickEditing"
      @save="saveQuick"
      @remove="removeQuick"
    />
    <console-filter-dialog
      v-model="filterOpen"
      :filter="filterEditing"
      @save="saveFilter"
      @remove="removeFilter"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { ConsoleFilter } from '@/store/console/types'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import SegPicker from '@/components/control/SegPicker.vue'
import AppDraggable from '@/components/ui/AppDraggable.vue'
import ConsoleFilterDialog from './ConsoleFilterDialog.vue'
import QuickCommandDialog from './QuickCommandDialog.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import {
  HISTORY_COUNTS, LINES_KEPT, chipText, consoleConfig, describeFilter, moveQuickCommand, quickCommandsFor, accountQuickKey, saveQuickCommand,
  type ConsoleConfig, type QuickCommand
} from '@/services/console/settings'
import { SocketActions } from '@/api/socketActions'

/**
 * Settings › Console: the quick-command chips above the Console's input
 * (each person's own, on this printer), what the console shows, the lines
 * it hides, and how typing works.
 */
@Component({ components: { ToggleSwitch, SegPicker, AppDraggable, ConsoleFilterDialog, QuickCommandDialog } })
export default class ConsoleSettings extends Mixins(StateMixin) {
  quickOpen = false
  quickEditing: QuickCommand | null = null
  filterOpen = false
  filterEditing: ConsoleFilter | null = null

  readonly chipText = chipText
  readonly describe = describeFilter
  readonly linesKept = LINES_KEPT.map(n => ({ value: n, label: n.toLocaleString('en') }))
  readonly historyCounts = HISTORY_COUNTS.map(n => ({ value: n, label: String(n) }))

  get config (): ConsoleConfig {
    return consoleConfig(this.$store.state.config.uiSettings.console)
  }

  setConfig<K extends keyof ConsoleConfig> (key: K, value: ConsoleConfig[K]) {
    this.$store.dispatch('config/saveByPath', { path: `uiSettings.console.${key}`, value, server: true })
  }

  get hideTempWaits (): boolean {
    return this.$store.state.config.uiSettings.general.hideTempWaits !== false
  }

  set hideTempWaits (value: boolean) {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.hideTempWaits', value, server: true })
  }

  get flipLayout (): boolean {
    return !!this.$store.state.config.uiSettings.general.flipConsoleLayout
  }

  set flipLayout (value: boolean) {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.flipConsoleLayout', value, server: true })
  }

  // -- quick commands -----------------------------------------------------------

  /** This person's key, or null while the account is still loading: nothing is read or saved before it is known. */
  get quickKey (): string | null {
    return accountQuickKey(cloudState)
  }

  get quick (): QuickCommand[] {
    return this.quickKey ? quickCommandsFor(this.config, this.quickKey) : []
  }

  get quickOrder (): QuickCommand[] {
    return this.quick
  }

  set quickOrder (list: QuickCommand[]) {
    this.saveQuickList(list)
  }

  /** Kept per person: the whole map in the page, only this person's list written to the printer. */
  saveQuickList (list: QuickCommand[]) {
    const key = this.quickKey
    if (!key) return
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.console.quickCommands',
      value: { ...this.config.quickCommands, [key]: list }
    })
    SocketActions.serverWrite(`uiSettings.console.quickCommands.${key}`, list)
  }

  editQuick (q: QuickCommand | null) {
    if (!this.quickKey) return
    this.quickEditing = q ? { ...q } : null
    this.quickOpen = true
  }

  saveQuick (q: QuickCommand) {
    this.saveQuickList(saveQuickCommand(this.quick, q))
  }

  removeQuick (q: QuickCommand) {
    this.saveQuickList(this.quick.filter(x => x.id !== q.id))
  }

  moveQuick (from: number, to: number) {
    if (to < 0 || to >= this.quick.length) return
    this.saveQuickList(moveQuickCommand(this.quick, from, to))
    this.$nextTick(() => {
      const chips = this.$el.querySelectorAll<HTMLButtonElement>('.cset__chip:not(.cset__add)')
      chips[to]?.focus()
    })
  }

  // -- filters ------------------------------------------------------------------

  get filters (): ConsoleFilter[] {
    return this.$store.getters['console/getFilters'] ?? []
  }

  editFilter (f: ConsoleFilter | null) {
    this.filterEditing = f ? { ...f } : null
    this.filterOpen = true
  }

  saveFilter (f: ConsoleFilter) {
    this.$store.dispatch('console/onSaveFilter', f)
  }

  removeFilter (f: ConsoleFilter) {
    this.$store.dispatch('console/onRemoveFilter', f)
  }

  setFilterEnabled (f: ConsoleFilter, enabled: boolean) {
    this.$store.dispatch('console/onSaveFilter', { ...f, enabled })
  }

  // -- the link -----------------------------------------------------------------

  /** People and access, when this printer has it. */
  get accessTo (): string | null {
    const supports = (name: string) => this.$store.getters['server/componentSupport'](name) as boolean
    if (!['muon_access', 'muon_protection', 'authorization'].some(supports)) return null
    return `${scopedPath('/settings', activeSlug())}#access`
  }
}
</script>

<style lang="scss" scoped>
  .cset__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 4px 0;
  }

  .cset__chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 12px;
    font-weight: 700;
    cursor: grab;
    user-select: none;
    touch-action: none;
  }

  .cset__chip--ghost {
    opacity: 0.4;
  }

  .cset__add {
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    font-family: inherit;
    cursor: pointer;
    touch-action: auto;
  }

  .cset__grip {
    display: grid;
    grid-template-columns: 3px 3px;
    gap: 2px;

    i {
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: var(--m3d-text-subtle);
    }
  }

  .cset__help {
    margin: 4px 0 8px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .cset__mono {
    font-family: var(--m3d-font-mono, monospace);
  }

  .cset__filter {
    cursor: pointer;
  }

  .cset__filter-ctl {
    gap: 4px;
  }

  .cset__go {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--m3d-text-muted);
  }

  // Phones: the switch and the chevron stay on the name's line.
  @media (max-width: 760px) {
    .cset__filter {
      flex-wrap: nowrap;
    }

    .cset__filter-ctl {
      flex: 0 0 auto;
    }
  }

  .cset__addrow {
    width: 100%;
    justify-content: flex-start;
    color: var(--m3d-text);
    font-size: 15px;
    font-weight: 600;
    text-align: left;
  }

  .cset__ico {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
  }

  .cset__grow {
    flex: 1 1 auto;
    min-width: 0;
  }

  .cset__link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 18px;
    background: rgba(128, 214, 209, 0.08);
    box-shadow: inset 0 0 0 1px rgba(128, 214, 209, 0.3);
    color: var(--m3d-text);
    font-size: 14px;
    text-decoration: none;
  }

  .cset__link-go {
    flex: none;
    color: var(--m3d-accent);
    font-weight: 600;
  }

  @media (max-width: 760px) {
    .cset__link {
      flex-wrap: wrap;
    }
  }
</style>
