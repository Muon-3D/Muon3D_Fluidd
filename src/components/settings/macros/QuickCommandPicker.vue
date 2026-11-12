<template>
  <section
    class="qpick"
    aria-labelledby="qpick-title"
    data-tid="quick-command-picker"
  >
    <header class="qpick__head">
      <div>
        <h3 id="qpick-title">
          Quick commands
        </h3>
        <p>Tick the ones Overview and Control show. The last one you tick comes first.</p>
      </div>
      <button
        v-if="quickCommandPicks !== null"
        type="button"
        class="cbtn"
        data-tid="quick-pick-auto"
        @click="useAutomatic"
      >
        Pick for me
      </button>
    </header>
    <p
      v-if="!choices.length"
      class="qpick__none"
    >
      This printer has nothing to show there yet.
    </p>
    <ul
      v-else
      class="qpick__list"
    >
      <li
        v-for="c in choices"
        :key="c.name"
      >
        <label
          class="qpick__row"
          :data-tid="`quick-pick-${c.name}`"
        >
          <input
            type="checkbox"
            :checked="c.on"
            @change="onToggle(c.name, $event)"
          >
          <frame-icon
            :name="c.icon"
            small
          />
          <span>{{ c.title }}</span>
        </label>
      </li>
    </ul>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MacrosMixin from '@/mixins/macros'
import { isPicked } from '@/services/control/quick-command-picks'
import { macroIcon } from '@/services/macros/icon'

/**
 * The Macros page's "Quick commands" section (KAN-2122): tick or untick which
 * commands the Overview's Quick commands tile and Control's Quick commands
 * card show. Kept in the printer's settings (uiSettings.general.quickCommands),
 * so every device opening this printer agrees. Until something is ticked the
 * best of each group show, and those start ticked.
 */
@Component({})
export default class QuickCommandPicker extends Mixins(MacrosMixin) {
  get choices () {
    const picks = this.quickCommandPicks
    const auto = this.autoQuickCommandNames
    return this.arrangedMacros
      .filter(m => m.group !== 'printer')
      .map(m => ({ name: m.name, title: m.title, icon: macroIcon(m.name), on: isPicked(picks, m.name, auto) }))
      .sort((a, b) => Number(b.on) - Number(a.on) || a.title.localeCompare(b.title))
  }

  onToggle (name: string, event: Event) {
    this.setQuickCommand(name, (event.target as HTMLInputElement).checked)
  }

  useAutomatic () {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.quickCommands', value: null, server: true })
  }
}
</script>

<style lang="scss" scoped>
  .qpick {
    margin: 0 0 20px;
    padding: 16px 18px;
    border-radius: 18px;
    background: var(--m3d-surface);
  }

  .qpick__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;

    h3 { margin: 0; font-size: 15px; font-weight: 600; }
    p { margin: 2px 0 0; color: var(--m3d-text-muted); font-size: 13px; }
  }

  .qpick__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 4px 12px;
    margin: 12px 0 0;
    padding: 0;
    list-style: none;
  }

  .qpick__row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    padding: 6px 8px;
    border-radius: 10px;
    cursor: pointer;

    &:hover { background: var(--m3d-surface-2); }
    input { width: 18px; height: 18px; accent-color: var(--m3d-accent); }
    .frame-icon { color: var(--m3d-text-muted); }
  }

  .qpick__none {
    margin: 10px 0 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
