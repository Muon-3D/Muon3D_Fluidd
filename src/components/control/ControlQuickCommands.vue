<template>
  <control-card
    title="Quick commands"
    icon="bolt"
    :locked="controlLock"
    data-tid="control-quick"
  >
    <template #aside>
      <button
        v-if="commands.length > TOP"
        type="button"
        class="qc__all"
        :aria-expanded="all ? 'true' : 'false'"
        data-tid="quick-all"
        @click="all = !all"
      >
        {{ all ? 'Fewer' : `All ${commands.length}` }}
      </button>
      <a
        class="qc__arrange"
        :href="arrangeLink"
        title="Hide, show and group macros in Settings › Macros"
        @click.prevent="$router.push(arrangeLink)"
      >Arrange</a>
    </template>

    <div
      class="qc"
      role="list"
    >
      <button
        v-for="c in shown"
        :key="c.name"
        type="button"
        role="listitem"
        class="qc__row"
        :class="{ 'qc__row--off': !!c.reason }"
        :aria-disabled="c.reason ? 'true' : undefined"
        :title="c.tooltip"
        :data-tid="`qc-${c.name}`"
        @click="runCommand(c)"
      >
        <frame-icon
          :name="c.icon"
          small
        />
        <span class="qc__text">
          <b>{{ c.label }}</b>
          <small
            v-if="c.reason"
            :data-tid="`qc-${c.name}-reason`"
          >{{ c.reason }}</small>
          <small v-else-if="c.params.length">Asks for {{ c.params.join(', ') }}</small>
        </span>
        <kbd>{{ c.name }}</kbd>
      </button>
      <p
        v-if="!commands.length"
        class="qc__none"
      >
        No macros to show here. Quick actions and Filament have the everyday ones.
      </p>
      <div
        class="qc__rule"
        role="separator"
      />
      <button
        v-for="r in restarts"
        :key="r.name"
        type="button"
        role="listitem"
        class="qc__row qc__row--danger"
        :class="{ 'qc__row--off': !!r.reason }"
        :aria-disabled="r.reason ? 'true' : undefined"
        :data-tid="`qc-${r.name}`"
        @click="restartWith(r)"
      >
        <frame-icon
          name="refresh"
          small
        />
        <span class="qc__text">
          <b>{{ r.label }}</b>
          <small v-if="r.reason">{{ r.reason }}</small>
        </span>
        <kbd>{{ r.name }}</kbd>
      </button>
    </div>
    <p
      v-if="commandRefusal"
      class="qc__refusal"
      role="alert"
    >
      {{ commandRefusal }}
    </p>

    <form
      v-if="selected"
      class="macros__values"
      data-tid="macro-send"
      aria-label="Macro values"
      @submit.prevent="submitMacro"
    >
      <h3>{{ selected.title }}</h3>
      <p>{{ selected.description }}</p>
      <label
        v-for="field in fields"
        :key="field.name"
        class="macros__field"
      >
        <span>{{ field.name }} · {{ field.optional ? `optional${field.defaultValue ? ` · default ${field.defaultValue}` : ' · uses the macro’s own value'}` : 'required' }}</span>
        <textarea
          v-model="values[field.name]"
          rows="1"
          :aria-label="`Macro ${field.name}`"
          autocomplete="off"
        />
      </label>
      <p>Sends <code>{{ preview || 'check the values' }}</code></p>
      <p
        v-if="formError"
        role="alert"
      >
        {{ formError }}
      </p>
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
    </form>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MacroRunMixin from '@/mixins/macro-run'
import type { ShownMacro } from '@/mixins/macros'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { restartReason } from '@/services/quick-actions/model'
import {
  RESTART_COMMANDS, coveredElsewhere, quickCommandIcon, quickCommandLabel, quickCommandReason
} from '@/services/control/quick-commands'
import ControlCard from './ControlCard.vue'

interface QuickCommand {
  name: string
  label: string
  icon: string
  reason: string
  tooltip: string
  params: string[]
  macro: ShownMacro
}

/**
 * Quick commands: the printer's macros as rows in the top bar's Quick
 * actions style: an icon, a plain-words name, the macro as a muted hint,
 * the reason when it can't run, and the firmware restart in red below a
 * rule. What Quick actions or the Filament tile already do is left out
 * (services/control/quick-commands). Hidden macros and groups follow
 * Settings › Macros. A macro that needs values opens the values form; a
 * restart asks first, as everywhere (TypedCommandsMixin).
 */
@Component({ components: { ControlCard } })
export default class ControlQuickCommands extends Mixins(MacroRunMixin) {
  readonly TOP = 5
  all = false

  get commands (): QuickCommand[] {
    const byScore = (a: ShownMacro, b: ShownMacro) => b.score - a.score || a.name.localeCompare(b.name)
    return this.arrangedMacros
      .filter(m => m.group !== 'printer' && !coveredElsewhere(m.name) && !RESTART_COMMANDS.some(r => r.name === m.name.toUpperCase()))
      .sort((a, b) => Number(!!b.userGroup) - Number(!!a.userGroup) || byScore(a, b))
      .map(m => ({
        name: m.name,
        label: quickCommandLabel(m.name, m.description),
        icon: quickCommandIcon(m.group, m.name),
        reason: quickCommandReason({ controlLock: this.controlLock, busy: this.busy, disabledWhilePrinting: m.disabledWhilePrinting }),
        tooltip: this.tooltipOf(m),
        params: m.params,
        macro: m
      }))
  }

  get shown (): QuickCommand[] {
    return this.all ? this.commands : this.commands.slice(0, this.TOP)
  }

  get restarts () {
    return RESTART_COMMANDS.map(r => ({ ...r, reason: restartReason(this.restartRefusal) }))
  }

  runCommand (c: QuickCommand) {
    // Disabled in words, not by the browser, so the reason stays readable and focusable.
    if (c.reason) return
    this.run(c.macro)
  }

  restartWith (r: { name: string, reason: string }) {
    if (r.reason) return
    this.sendTypedGcode(r.name)
  }

  get arrangeLink (): string {
    return `${scopedPath('/settings', activeSlug())}#macros`
  }
}
</script>

<style lang="scss" scoped>
  .qc {
    display: flex;
    flex-direction: column;
    margin: 0 -18px -10px;
  }

  .qc__row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 7px 18px;
    border-top: 1px solid var(--m3d-border);
    color: var(--m3d-text);
    text-align: left;

    &:first-child { border-top: 0; }
    &:hover:not(.qc__row--off) { background: var(--m3d-surface-2); }

    .frame-icon { color: var(--m3d-text-muted); }

    kbd {
      color: var(--m3d-text-subtle);
      font-family: var(--m3d-font-mono);
      font-size: 11px;
      background: none;
      box-shadow: none;
    }
  }

  .qc__text {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;

    b { font-weight: 600; }

    small {
      color: var(--m3d-text-subtle);
      font-size: 12px;
    }
  }

  .qc__row--off {
    cursor: default;

    b, .frame-icon { opacity: 0.55; }
  }

  .qc__rule {
    height: 0;
    margin: 0 18px;
    border-top: 1px solid var(--m3d-border-strong);
  }

  .qc__rule + .qc__row { border-top: 0; }

  .qc__row--danger {
    b, .frame-icon { color: var(--m3d-danger); }
  }

  .qc__all,
  .qc__arrange {
    color: var(--m3d-accent);
    font-size: 13px;
    text-decoration: none;
  }

  .qc__none,
  .qc__refusal {
    margin: 8px 18px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .qc__refusal { color: var(--m3d-danger); }

  .macros__values { border-top: 1px solid var(--m3d-border); margin-top: 12px; padding-top: 12px; }
  .macros__field { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; margin: 10px 0; font-size: 13px; }
  .macros__field textarea { background: var(--m3d-surface-2); color: var(--m3d-text); padding: 6px 10px; border-radius: 8px; width: 140px; resize: none; }
</style>
