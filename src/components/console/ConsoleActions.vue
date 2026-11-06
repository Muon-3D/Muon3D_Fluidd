<template>
  <div
    class="console-actions"
    data-tid="console-actions"
  >
    <seg-picker
      :options="options"
      :value="view.filter"
      label="Show"
      @input="view.filter = $event"
    />
    <button
      type="button"
      class="cbtn console-actions__clear"
      data-tid="console-clear"
      aria-label="Clear the log"
      title="Clear the log"
      @click="clear"
    >
      <frame-icon name="trash" />
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import { consoleView } from '@/services/console/view'
import { entryKind } from '@/services/console/model'
import type { ConsoleEntry } from '@/store/console/types'

/** The Console's page-header actions: what to show (All, Commands, Warnings, Errors) and Clear. */
@Component({ components: { SegPicker } })
export default class ConsoleActions extends Vue {
  view = consoleView

  get errorCount (): number {
    const entries = (this.$store.getters['console/getConsoleEntries'] as ConsoleEntry[]) ?? []
    return entries.filter(e => entryKind(e) === 'error').length
  }

  get options (): SegOption[] {
    return [
      { value: 'all', label: 'All' },
      { value: 'commands', label: 'Commands' },
      { value: 'warnings', label: 'Warnings' },
      { value: 'errors', label: this.errorCount ? `Errors · ${this.errorCount}` : 'Errors' }
    ]
  }

  clear () {
    this.$store.dispatch('console/onClear')
  }
}
</script>

<style lang="scss" scoped>
  .console-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 100%;
  }

  .console-actions__clear {
    width: 40px;
    height: 40px;
    padding: 0;
    justify-content: center;
    border-radius: 999px;
  }
</style>
